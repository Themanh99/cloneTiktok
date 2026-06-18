import { useDispatch, useSelector } from "react-redux"
import { currentUserSelector, currentVideoPlayingSelector, volumeVideoSelector } from './selectors';
import currentUserSlice from './currentUserSlice';
import currentVideoPlayingSlice from './currentVideoPlayingSlice';
import volumeVideoSlice from './volumeVideoSlice';

export const useVolumeStore = () => {
    const dispatch = useDispatch();
    const stateVolumeStore = useSelector(volumeVideoSelector);
    return { stateVolumeStore, dispatch, volumeVideoSlice };
};

export const useUserStore = () => {
    const dispatch = useDispatch();
    const currentUser = useSelector(currentUserSelector);
    return { currentUser, dispatch, currentUserSlice };
};

export const useCurrentVideoPlayingStore = () => {
    const dispatch = useDispatch();
    const stateCurrentVideoPlayingStore = useSelector(currentVideoPlayingSelector);
    return { stateCurrentVideoPlayingStore, dispatch, currentVideoPlayingSlice };
};