import { useReducer, ReactNode } from 'react';
import VolumeContext from './VolumeContext';
import VolumeReducer, { initialState } from './VolumeReducer';

interface VolumeProviderProps {
    children: ReactNode;
}

function VolumeProvider({ children }: VolumeProviderProps) {
    const [state, dispatch] = useReducer(VolumeReducer, initialState);

    return <VolumeContext.Provider value={[state, dispatch]}>{children}</VolumeContext.Provider>;
}

export default VolumeProvider;
