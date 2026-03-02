/**
 * Audio API for playing audio files with proper error handling and type safety
 */

export interface AudioPlayOptions {
  volume?: number;
  loop?: boolean;
  playbackRate?: number;
}

export interface AudioInstance {
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  setVolume: (volume: number) => void;
  setLoop: (loop: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  isPlaying: () => boolean;
  isPaused: () => boolean;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

export class AudioError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "AudioError";
  }
}

/**
 * Creates an audio instance from a file path or URL
 */
export function createAudio(
  src: string,
  options: AudioPlayOptions = {}
): AudioInstance {
  if (typeof window === "undefined") {
    throw new AudioError(
      "Audio API is only available in browser environment",
      "BROWSER_REQUIRED"
    );
  }

  const audio = new Audio(src);
  let isDestroyed = false;

  // Apply initial options
  if (options.volume !== undefined) {
    audio.volume = Math.max(0, Math.min(1, options.volume));
  }
  if (options.loop !== undefined) {
    audio.loop = options.loop;
  }
  if (options.playbackRate !== undefined) {
    audio.playbackRate = Math.max(0.25, Math.min(4, options.playbackRate));
  }

  const play = async (): Promise<void> => {
    if (isDestroyed) {
      throw new AudioError("Audio instance has been destroyed", "DESTROYED");
    }

    try {
      await audio.play();
    } catch (error) {
      if (error instanceof Error) {
        throw new AudioError(
          `Failed to play audio: ${error.message}`,
          "PLAY_FAILED"
        );
      }
      throw new AudioError(
        "Unknown error occurred while playing audio",
        "UNKNOWN_ERROR"
      );
    }
  };

  const pause = (): void => {
    if (isDestroyed) return;
    audio.pause();
  };

  const stop = (): void => {
    if (isDestroyed) return;
    audio.pause();
    audio.currentTime = 0;
  };

  const setVolume = (volume: number): void => {
    if (isDestroyed) return;
    audio.volume = Math.max(0, Math.min(1, volume));
  };

  const setLoop = (loop: boolean): void => {
    if (isDestroyed) return;
    audio.loop = loop;
  };

  const setPlaybackRate = (rate: number): void => {
    if (isDestroyed) return;
    audio.playbackRate = Math.max(0.25, Math.min(4, rate));
  };

  const isPlaying = (): boolean => {
    if (isDestroyed) return false;
    return !audio.paused && !audio.ended && audio.readyState > 2;
  };

  const isPaused = (): boolean => {
    if (isDestroyed) return false;
    return audio.paused;
  };

  const getCurrentTime = (): number => {
    if (isDestroyed) return 0;
    return audio.currentTime;
  };

  const getDuration = (): number => {
    if (isDestroyed) return 0;
    return audio.duration || 0;
  };

  const destroy = (): void => {
    if (isDestroyed) return;
    isDestroyed = true;
    audio.pause();
    audio.src = "";
    audio.load();
  };

  return {
    play,
    pause,
    stop,
    setVolume,
    setLoop,
    setPlaybackRate,
    isPlaying,
    isPaused,
    getCurrentTime,
    getDuration,
    destroy,
  };
}

/**
 * Preloads an audio file for faster playback
 */
export async function preloadAudio(src: string): Promise<void> {
  if (typeof window === "undefined") {
    throw new AudioError(
      "Audio API is only available in browser environment",
      "BROWSER_REQUIRED"
    );
  }

  return new Promise((resolve, reject) => {
    const audio = new Audio(src);

    audio.addEventListener(
      "canplaythrough",
      () => {
        resolve();
      },
      { once: true }
    );

    audio.addEventListener(
      "error",
      (event) => {
        reject(
          new AudioError(
            `Failed to preload audio: ${event.type}`,
            "PRELOAD_FAILED"
          )
        );
      },
      { once: true }
    );

    audio.load();
  });
}

/**
 * Utility function to check if audio is supported in the current environment
 */
export function isAudioSupported(): boolean {
  return typeof window !== "undefined" && typeof Audio !== "undefined";
}

export const sounds = {
  dialing: "/audio/dialing.wav",
  connected: "/audio/connected.wav",
} as const;
