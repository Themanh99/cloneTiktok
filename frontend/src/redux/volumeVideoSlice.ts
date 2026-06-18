import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface VolumeVideoState {
    volume: number;
    muted: boolean;
    prevVolume: number;
}

const volumeVideoSlice = createSlice({
    name: 'volumeVideo',
    initialState: {
        volume: 0,
        muted: true,
        prevVolume: 100,
    } as VolumeVideoState,
    reducers: {
        turnOnVolume: (state) => {
            state.volume = state.prevVolume;
            state.muted = false;
            state.prevVolume = 0;
        },

        turnOffVolume: (state) => {
            state.prevVolume = state.volume;
            state.muted = true;
            state.volume = 0;
        },

        setVolume: (state, action: PayloadAction<number>) => {
            state.prevVolume = state.volume;
            state.volume = action.payload;
            state.muted = action.payload === 0;
        },
    },
});
export default volumeVideoSlice;
