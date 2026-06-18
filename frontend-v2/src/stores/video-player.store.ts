import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ===== Types =====

interface VideoPlayerState {
  currentIndex: number;
  isModalOpen: boolean;
  volume: number;
  muted: boolean;
  prevVolume: number;
}

interface VideoPlayerActions {
  setIndex: (index: number) => void;
  nextVideo: (maxIndex: number) => void;
  prevVideo: () => void;
  openModal: (index: number) => void;
  closeModal: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
}

type VideoPlayerStore = VideoPlayerState & VideoPlayerActions;

// ===== Store =====

export const useVideoPlayerStore = create<VideoPlayerStore>()(
  subscribeWithSelector((set, get) => ({
    // State
    currentIndex: 0,
    isModalOpen: false,
    volume: 0,
    muted: true,
    prevVolume: 50,

    // Actions
    setIndex: (index) => set({ currentIndex: index }),

    nextVideo: (maxIndex) => {
      const { currentIndex } = get();
      if (currentIndex < maxIndex) {
        set({ currentIndex: currentIndex + 1 });
      }
    },

    prevVideo: () => {
      const { currentIndex } = get();
      if (currentIndex > 0) {
        set({ currentIndex: currentIndex - 1 });
      }
    },

    openModal: (index) => set({ currentIndex: index, isModalOpen: true }),

    closeModal: () => set({ isModalOpen: false }),

    setVolume: (volume) =>
      set({
        volume,
        muted: volume === 0,
        prevVolume: volume > 0 ? volume : get().prevVolume,
      }),

    toggleMute: () => {
      const { muted, prevVolume, volume } = get();
      if (muted) {
        set({ volume: prevVolume || 50, muted: false });
      } else {
        set({ prevVolume: volume, volume: 0, muted: true });
      }
    },
  })),
);
