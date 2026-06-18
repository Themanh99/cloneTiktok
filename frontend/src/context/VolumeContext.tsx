import { createContext, Dispatch } from 'react';
import { VolumeState, VolumeAction } from './VolumeReducer';

type VolumeContextType = [VolumeState, Dispatch<VolumeAction>] | undefined;

const VolumeContext = createContext<VolumeContextType>(undefined);

export default VolumeContext;
