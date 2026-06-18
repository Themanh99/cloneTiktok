import { SET_VOLUME, TURN_OFF_VOLUME, TURN_ON_VOLUME } from './constants';

export interface VolumeState {
    muted: boolean;
    volume: number;
    prevVolume: number;
}

export type VolumeAction =
    | { type: typeof TURN_OFF_VOLUME }
    | { type: typeof TURN_ON_VOLUME }
    | { type: typeof SET_VOLUME; payload: number };

const initialState: VolumeState = {
    muted: true,
    volume: 0,
    prevVolume: 100,
};

function VolumeReducer(state: VolumeState, action: VolumeAction): VolumeState {
    switch (action.type) {
        case TURN_OFF_VOLUME:
            return {
                muted: true,
                prevVolume: state.volume,
                volume: 0,
            };
        case TURN_ON_VOLUME:
            return {
                muted: false,
                volume: state.prevVolume,
                prevVolume: 0,
            };
        case SET_VOLUME:
            return {
                muted: action.payload === 0,
                volume: action.payload,
                prevVolume: state.volume,
            };

        default:
            throw new Error('Invalid action');
    }
}

export { initialState };

export default VolumeReducer;
