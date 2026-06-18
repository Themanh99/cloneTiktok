import { useContext } from 'react';
import VolumeContext from './VolumeContext';

export const useVolumeStore = () => {
    const context = useContext(VolumeContext);
    if (!context) {
        throw new Error('useVolumeStore must be used within a VolumeProvider');
    }
    const [state, dispatch] = context;

    return [state, dispatch] as const;
};
