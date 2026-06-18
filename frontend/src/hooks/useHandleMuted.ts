import { useCallback, useEffect } from 'react';
import { fMuted } from '../functions';
import { useVolumeStore } from '../redux/hooks';
import volumeVideoSlice from '../redux/volumeVideoSlice';

function useHandleMuted() {
    const { stateVolumeStore, dispatch } = useVolumeStore();
    const { muted, prevVolume } = stateVolumeStore;

    const handleMuted = useCallback(() => {
        fMuted(muted, prevVolume, dispatch, volumeVideoSlice);
    }, [prevVolume, muted, dispatch]);

    useEffect(() => {
        const handKeyDown = (e: KeyboardEvent) => {
            if (e.keyCode === 77) {
                handleMuted();
            }
        };

        document.addEventListener('keydown', handKeyDown);

        return () => {
            document.removeEventListener('keydown', handKeyDown);
        };
    }, [handleMuted]);

    return { handleMuted };
}

export default useHandleMuted;
