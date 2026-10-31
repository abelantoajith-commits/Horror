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
  private channel: RealtimeChannel | null = null;
  private localBroadcastChannel: BroadcastChannel | null = null;
  private presenceState: Map<string, PlayerPresence> = new Map();
  private broadcastListeners: Map<string, Set<(payload: any) => void>> = new Map();
  private presenceListeners: Set<(players: PlayerPresence[]) => void> = new Set();
  private hostLeftListeners: Set<() => void> = new Set();
  private localPresence: PlayerPresence;
  private fallbackHeartbeatTimer: number | null = null;
  private currentHostId: string | null = null;
  private isDestroyed = false;

  constructor(roomKey: string, playerId: string, initialPresence: Omit<PlayerPresence, 'playerId' | 'joinedAt'>) {
    this.roomKey = roomKey.toUpperCase();
    this.playerId = playerId;
    this.localPresence = {
      ...initialPresence,
      playerId,
      joinedAt: Date.now(),
    };
    this.presenceState.set(playerId, this.localPresence);
  }

  public async connect(): Promise<void> {
    if (this.isDestroyed) return;

    if (isSupabaseConfigured && supabase) {
      this.channel = supabase.channel(`room:${this.roomKey}`, {
        config: {
          broadcast: { self: false },
          presence: { key: this.playerId },
        },
      });

      this.channel
        .on('presence', { event: 'sync' }, () => {
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
        })
        .on('broadcast', { event: '*' }, ({ event, payload }) => {
          if (this.isDestroyed) return;
          this.triggerBroadcast(event, payload);
        });

      await this.channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && !this.isDestroyed && this.channel) {
          await this.channel.track(this.localPresence);
        }
      });
    } else {
      // Local fallback using native BroadcastChannel
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
    // Keep local presence included
    this.presenceState.clear();
    for (const p of players) {
      this.presenceState.set(p.playerId, p);
    }
    if (!this.presenceState.has(this.playerId)) {
      this.presenceState.set(this.playerId, this.localPresence);
    }
    this.notifyPresence();
  }

  private notifyPresence() {
    const players = Array.from(this.presenceState.values()).sort((a, b) => a.joinedAt - b.joinedAt);

    // Host check
    if (players.length > 0) {
      const newHostId = players[0].playerId;
      if (this.currentHostId && this.currentHostId !== newHostId && !this.presenceState.has(this.currentHostId)) {
        // Old host left
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

  public async updatePresence(partial: Partial<PlayerPresence>): Promise<void> {
    this.localPresence = { ...this.localPresence, ...partial };
    this.presenceState.set(this.playerId, this.localPresence);
    this.notifyPresence();

    if (this.channel && isSupabaseConfigured) {
      await this.channel.track(this.localPresence);
    } else if (this.localBroadcastChannel) {
      this.localBroadcastChannel.postMessage({
        _type: 'presence_ping',
        presence: this.localPresence,
      });
    }
  }

  public async sendBroadcast(event: string, payload: any): Promise<void> {
    if (this.channel && isSupabaseConfigured) {
      await this.channel.send({
        type: 'broadcast',
        event,
        payload,
      });
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
    const listeners = this.broadcastListeners.get(event);
    if (listeners) {
      for (const cb of listeners) {
        cb(payload);
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
      this.channel.untrack();
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.presenceState.clear();
    this.broadcastListeners.clear();
    this.presenceListeners.clear();
    this.hostLeftListeners.clear();
  }
}

