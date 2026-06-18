import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CurrentVideoPlayingState {
    currentIndex: number;
    list: unknown[];
    length: number;
    isPlayingModal: boolean;
}

const currentVideoPlayingSlice = createSlice({
    name: 'currentVideoPlaying',
    initialState: {
        currentIndex: 0,
        list: [],
        length: 0,
        isPlayingModal: false,
    } as CurrentVideoPlayingState,
    reducers: {
        setIndex: (state, action: PayloadAction<{ index: number }>) => {
            state.currentIndex = action.payload.index;
        },

        playInModal: (state, action: PayloadAction<{ index: number }>) => {
            state.currentIndex = action.payload.index;
            state.isPlayingModal = true;
        },

        getList: (state, action: PayloadAction<{ list: unknown[] }>) => {
            state.list = action.payload.list;
            state.length = action.payload.list.length;
        },

        closeModal: (state) => {
            state.isPlayingModal = false;
        },

        nextVideo: (state) => {
            if (state.currentIndex < state.length - 1) state.currentIndex = state.currentIndex + 1;
        },

        prevVideo: (state) => {
            if (state.currentIndex > 0) state.currentIndex = state.currentIndex - 1;
        },
    },
});
export default currentVideoPlayingSlice;
