import { supabase, isSupabaseConfigured } from './supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PlayerPresence {
  playerId: string;
  name: string;
  skin: string;
  ready: boolean;
  joinedAt: number;
}

export interface GameStartPayload {
  seed: number;
  nagavalliId: string;
  spawns: Record<string, { x: number; y: number }>;
  startAt: number;
}

export interface PosPayload {
  id: string;
  x: number;
  y: number;
  dir: 'up' | 'down' | 'left' | 'right';
  t: number;
}

export interface CaughtPayload {
  hiderId: string;
  t: number;
  order: number;
}

export interface PhotoPayload {
  ownerId: string;
  ownerName: string;
  dataUrl: string;
  kind: 'caught' | 'nagavalli_lost';
}

export interface GameEndPayload {
  winner: 'nagavalli' | 'hiders';
}

export class RoomConnection {
  public roomKey: string;
  public playerId: string;
  public mode: 'supabase' | 'local';
  public connectionStatus: 'connecting' | 'connected' | 'error' = 'connecting';

  private channel: RealtimeChannel | null = null;
  private localBroadcastChannel: BroadcastChannel | null = null;
  private presenceState: Map<string, PlayerPresence> = new Map();
  private broadcastListeners: Map<string, Set<(payload: any) => void>> = new Map();
  private presenceListeners: Set<(players: PlayerPresence[]) => void> = new Set();
  private hostLeftListeners: Set<() => void> = new Set();
  private statusListeners: Set<(status: 'connecting' | 'connected' | 'error') => void> = new Set();
  private localPresence: PlayerPresence;
  private fallbackHeartbeatTimer: number | null = null;
  private currentHostId: string | null = null;
  private isDestroyed = false;

  constructor(roomKey: string, playerId: string, initialPresence: Omit<PlayerPresence, 'playerId' | 'joinedAt'>) {
    this.roomKey = roomKey.trim().toUpperCase();
    this.playerId = playerId;
    this.mode = isSupabaseConfigured ? 'supabase' : 'local';
    this.localPresence = {
      ...initialPresence,
      playerId,
      joinedAt: Date.now(),
    };
    this.presenceState.set(playerId, this.localPresence);
  }

  public async connect(): Promise<void> {
    if (this.isDestroyed) return;

    if (this.mode === 'supabase' && supabase) {
      console.log(`[Room] Connecting to Supabase Realtime channel room:${this.roomKey}`);
      this.channel = supabase.channel(`room:${this.roomKey}`, {
        config: {
          broadcast: { self: false },
          presence: { key: this.playerId },
        },
      });

      const handlePresenceSync = () => {
        if (this.isDestroyed || !this.channel) return;
        const state = this.channel.presenceState<PlayerPresence>();
        const updated: PlayerPresence[] = [];

        for (const key of Object.keys(state)) {
          const list = state[key];
          if (list && list.length > 0) {
            updated.push(list[list.length - 1]);
          }
        }

        this.handlePresenceUpdate(updated);
      };

      // Listen to all presence state changes
      this.channel
        .on('presence', { event: 'sync' }, () => {
          handlePresenceSync();
        })
        .on('presence', { event: 'join' }, () => {
          handlePresenceSync();
        })
        .on('presence', { event: 'leave' }, () => {
          handlePresenceSync();
        });

      // Explicitly register listeners for known game events and wildcard
      const gameEvents = ['game_start', 'pos', 'caught', 'photo', 'game_end', 'back_to_lobby', '*'];
      for (const ev of gameEvents) {
        this.channel.on('broadcast', { event: ev }, (resp: any) => {
          if (this.isDestroyed) return;
          const actualEvent = resp.event || ev;
          const actualPayload = resp.payload !== undefined ? resp.payload : resp;
          this.triggerBroadcast(actualEvent, actualPayload);
        });
      }

      this.channel.subscribe(async (status, err) => {
        console.log(`[Room ${this.roomKey}] Subscription status:`, status, err || '');
        if (status === 'SUBSCRIBED') {
          this.connectionStatus = 'connected';
          this.notifyStatus('connected');
          if (!this.isDestroyed && this.channel) {
            try {
              const res = await this.channel.track(this.localPresence);
              console.log(`[Room ${this.roomKey}] Track response:`, res);
            } catch (trackErr) {
              console.error(`[Room ${this.roomKey}] Error tracking presence:`, trackErr);
            }
          }
        } else if (status === 'CHANNEL_ERROR') {
          this.connectionStatus = 'error';
          this.notifyStatus('error');
          console.error(`[Room ${this.roomKey}] Supabase channel error:`, err);
        } else if (status === 'TIMED_OUT') {
          this.connectionStatus = 'error';
          this.notifyStatus('error');
          console.warn(`[Room ${this.roomKey}] Supabase channel timed out`);
        }
      });
    } else {
      // Local fallback using native BroadcastChannel
      console.log(`[Room] Using local BroadcastChannel fallback for room:${this.roomKey}`);
      this.connectionStatus = 'connected';
      this.notifyStatus('connected');

      const channelName = `nagavalli_room_${this.roomKey}`;
      this.localBroadcastChannel = new BroadcastChannel(channelName);

      this.localBroadcastChannel.onmessage = (event) => {
        if (this.isDestroyed) return;
        const msg = event.data;
        if (!msg) return;

        if (msg._type === 'presence_ping') {
          const remotePresence = msg.presence as PlayerPresence;
          if (remotePresence.playerId !== this.playerId) {
            this.presenceState.set(remotePresence.playerId, remotePresence);
            this.notifyPresence();
          }
        } else if (msg._type === 'presence_leave') {
          const leftId = msg.playerId;
          if (this.presenceState.has(leftId)) {
            this.presenceState.delete(leftId);
            this.notifyPresence();
          }
        } else if (msg._type === 'broadcast') {
          this.triggerBroadcast(msg.event, msg.payload);
        }
      };

      // Periodic presence broadcast for fallback
      const broadcastHeartbeat = () => {
        if (this.isDestroyed || !this.localBroadcastChannel) return;
        this.localBroadcastChannel.postMessage({
          _type: 'presence_ping',
          presence: this.localPresence,
        });
      };

      broadcastHeartbeat();
      this.fallbackHeartbeatTimer = window.setInterval(broadcastHeartbeat, 1000);
    }
  }

  private handlePresenceUpdate(players: PlayerPresence[]) {
    this.presenceState.clear();
    for (const p of players) {
      this.presenceState.set(p.playerId, p);
    }
    // Always preserve local player
    if (!this.presenceState.has(this.playerId)) {
      this.presenceState.set(this.playerId, this.localPresence);
    }
    this.notifyPresence();
  }

  private notifyPresence() {
    const players = Array.from(this.presenceState.values()).sort((a, b) => a.joinedAt - b.joinedAt);

    // Host detection
    if (players.length > 0) {
      const newHostId = players[0].playerId;
      if (this.currentHostId && this.currentHostId !== newHostId && !this.presenceState.has(this.currentHostId)) {
        for (const cb of this.hostLeftListeners) {
          cb();
        }
      }
      this.currentHostId = newHostId;
    }

    for (const listener of this.presenceListeners) {
      listener(players);
    }
  }

  private notifyStatus(status: 'connecting' | 'connected' | 'error') {
    for (const listener of this.statusListeners) {
      listener(status);
    }
  }

  public async updatePresence(partial: Partial<PlayerPresence>): Promise<void> {
    this.localPresence = { ...this.localPresence, ...partial };
    this.presenceState.set(this.playerId, this.localPresence);
    this.notifyPresence();

    if (this.channel && this.mode === 'supabase') {
      try {
        await this.channel.track(this.localPresence);
      } catch (err) {
        console.error('[Room] Error updating presence:', err);
      }
    } else if (this.localBroadcastChannel) {
      this.localBroadcastChannel.postMessage({
        _type: 'presence_ping',
        presence: this.localPresence,
      });
    }
  }

  public async sendBroadcast(event: string, payload: any): Promise<void> {
    if (this.channel && this.mode === 'supabase') {
      try {
        const res = await this.channel.send({
          type: 'broadcast',
          event,
          payload,
        });
        if (res !== 'ok') {
          console.warn('[Room] Supabase broadcast send result:', res, event);
        }
      } catch (err) {
        console.error('[Room] Broadcast send error:', err);
      }
    } else if (this.localBroadcastChannel) {
      this.localBroadcastChannel.postMessage({
        _type: 'broadcast',
        event,
        payload,
      });
    }
  }

  public onBroadcast(event: string, callback: (payload: any) => void): () => void {
    if (!this.broadcastListeners.has(event)) {
      this.broadcastListeners.set(event, new Set());
    }
    this.broadcastListeners.get(event)!.add(callback);
    return () => {
      this.broadcastListeners.get(event)?.delete(callback);
    };
  }

  private triggerBroadcast(event: string, payload: any) {
    // Exact match listeners
    const listeners = this.broadcastListeners.get(event);
    if (listeners) {
      for (const cb of listeners) {
        cb(payload);
      }
    }
    // Wildcard listeners
    const allListeners = this.broadcastListeners.get('*');
    if (allListeners) {
      for (const cb of allListeners) {
        cb({ event, payload });
      }
    }
  }

  public onPresenceSync(callback: (players: PlayerPresence[]) => void): () => void {
    this.presenceListeners.add(callback);
    callback(Array.from(this.presenceState.values()).sort((a, b) => a.joinedAt - b.joinedAt));
    return () => {
      this.presenceListeners.delete(callback);
    };
  }

  public onStatusChange(callback: (status: 'connecting' | 'connected' | 'error') => void): () => void {
    this.statusListeners.add(callback);
    callback(this.connectionStatus);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public onHostLeft(callback: () => void): () => void {
    this.hostLeftListeners.add(callback);
    return () => {
      this.hostLeftListeners.delete(callback);
    };
  }

  public leave(): void {
    this.isDestroyed = true;
    if (this.fallbackHeartbeatTimer) {
      clearInterval(this.fallbackHeartbeatTimer);
      this.fallbackHeartbeatTimer = null;
    }
    if (this.localBroadcastChannel) {
      this.localBroadcastChannel.postMessage({
        _type: 'presence_leave',
        playerId: this.playerId,
      });
      this.localBroadcastChannel.close();
      this.localBroadcastChannel = null;
    }
    if (this.channel) {
      this.channel.untrack().catch(() => {});
      this.channel.unsubscribe().catch(() => {});
      this.channel = null;
    }
    this.presenceState.clear();
    this.broadcastListeners.clear();
    this.presenceListeners.clear();
    this.hostLeftListeners.clear();
    this.statusListeners.clear();
  }
}
