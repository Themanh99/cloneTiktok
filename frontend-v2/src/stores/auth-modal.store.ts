import { create } from 'zustand';

type AuthMode = 'login' | 'signup';

interface AuthModalState {
  isOpen: boolean;
  mode: AuthMode;
}

interface AuthModalActions {
  openModal: (mode?: AuthMode) => void;
  closeModal: () => void;
  setMode: (mode: AuthMode) => void;
}

type AuthModalStore = AuthModalState & AuthModalActions;

export const useAuthModalStore = create<AuthModalStore>((set) => ({
  isOpen: false,
  mode: 'login',
  openModal: (mode = 'login') => set({ isOpen: true, mode }),
  closeModal: () => set({ isOpen: false }),
  setMode: (mode) => set({ mode }),
}));
