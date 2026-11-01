// Central Audio Manager for NAGAVALLI
// Handles background music, Nagavalli footsteps, and iconic catch dialogues.

type MuteListener = (muted: boolean) => void;

class SoundManager {
  private bgMusic: HTMLAudioElement | null = null;
  private walkSound: HTMLAudioElement | null = null;
  private vidamatteAudio: HTMLAudioElement | null = null;

  private isMutedState = false;
  private isUnlocked = false;
  private muteListeners: Set<MuteListener> = new Set();

  private isNagavalliWalkingState = false;
  private targetWalkVolume = 0.55;

  constructor() {
    // Check localStorage for user preference
    if (typeof window !== 'undefined') {
      const savedMute = localStorage.getItem('nagavalli_audio_muted');
      if (savedMute !== null) {
        this.isMutedState = savedMute === 'true';
      }

      // Attach one-time global interaction unlock listener to satisfy browser autoplay policies
      const unlockAudio = () => {
        this.unlock();
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
    }
  }

  private initElements() {
    if (typeof window === 'undefined') return;

    if (!this.bgMusic) {
      this.bgMusic = new Audio('/sounds/bg_music.mp3');
      this.bgMusic.loop = true;
      this.bgMusic.volume = this.isMutedState ? 0 : 0.35;
      this.bgMusic.preload = 'auto';
    }

    if (!this.walkSound) {
      this.walkSound = new Audio('/sounds/walk_sound.mp3');
      this.walkSound.loop = true;
      this.walkSound.volume = this.isMutedState ? 0 : this.targetWalkVolume;
      this.walkSound.preload = 'auto';
    }

    if (!this.vidamatteAudio) {
      this.vidamatteAudio = new Audio('/sounds/vidamatte.mp3');
      this.vidamatteAudio.volume = this.isMutedState ? 0 : 0.9;
      this.vidamatteAudio.preload = 'auto';
    }
  }

  public unlock() {
    if (this.isUnlocked) return;
    this.isUnlocked = true;
    this.initElements();

    // Start background music automatically if not muted
    if (!this.isMutedState) {
      this.startBgMusic();
    }
  }

  public startBgMusic() {
    this.initElements();
    if (!this.bgMusic || this.isMutedState) return;

    this.bgMusic.volume = 0.35;
    const playPromise = this.bgMusic.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy prevented playback until gesture
      });
    }
  }

  public stopBgMusic() {
    if (this.bgMusic) {
      this.bgMusic.pause();
    }
  }

  public setMuted(muted: boolean) {
    this.isMutedState = muted;
    try {
      localStorage.setItem('nagavalli_audio_muted', String(muted));
    } catch {
      // ignore
    }

    if (this.bgMusic) {
      this.bgMusic.volume = muted ? 0 : 0.35;
      if (muted) {
        this.bgMusic.pause();
      } else {
        this.bgMusic.play().catch(() => {});
      }
    }

    if (this.walkSound) {
      this.walkSound.volume = muted ? 0 : this.targetWalkVolume;
      if (muted) {
        this.walkSound.pause();
      } else if (this.isNagavalliWalkingState) {
        this.walkSound.play().catch(() => {});
      }
    }

    if (this.vidamatteAudio) {
      this.vidamatteAudio.volume = muted ? 0 : 0.9;
    }

    this.muteListeners.forEach((listener) => listener(muted));
  }

  public toggleMute(): boolean {
    const next = !this.isMutedState;
    this.setMuted(next);
    return next;
  }

  public isMuted(): boolean {
    return this.isMutedState;
  }

  public subscribe(listener: MuteListener): () => void {
    this.muteListeners.add(listener);
    return () => {
      this.muteListeners.delete(listener);
    };
  }

  /**
   * Sets Nagavalli walking audio state.
   * @param walking Whether Nagavalli is moving
   * @param volumeFactor 0.0 to 1.0 (attenuation based on distance if listener is a hider)
   */
  public setNagavalliWalking(walking: boolean, volumeFactor = 1.0) {
    this.initElements();
    this.isNagavalliWalkingState = walking;
    const vol = Math.max(0, Math.min(1, 0.6 * volumeFactor));
    this.targetWalkVolume = vol;

    if (!this.walkSound) return;

    if (walking && !this.isMutedState && vol > 0.02) {
      this.walkSound.volume = vol;
      if (this.walkSound.paused) {
        this.walkSound.play().catch(() => {});
      }
    } else {
      if (!this.walkSound.paused) {
        this.walkSound.pause();
      }
    }
  }

  /**
   * Plays the iconic "Vidamatte" dialogue when a hider is claimed by Nagavalli.
   */
  public playVidamatte() {
    this.initElements();
    if (this.isMutedState) return;

    try {
      // Create clone or reuse element so overlapping catches also play cleanly
      const audio = this.vidamatteAudio ? (this.vidamatteAudio.cloneNode() as HTMLAudioElement) : new Audio('/sounds/vidamatte.mp3');
      audio.volume = 0.95;
      const promise = audio.play();
      if (promise !== undefined) {
        promise.catch((err) => {
          console.warn('Vidamatte audio playback interrupted:', err);
        });
      }
    } catch (e) {
      console.warn('Could not play Vidamatte SFX:', e);
    }
  }
}

export const soundManager = new SoundManager();

