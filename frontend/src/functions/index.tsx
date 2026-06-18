export const getTimeDuration = (videoElement, setDur) => {
    const duraM = Math.floor(videoElement.duration / 60);
    const duraS = Math.floor(videoElement.duration % 60);
    setDur(() => `${duraM < 10 ? `0${duraM}` : duraM}:${duraS < 10 ? `0${duraS}` : duraS}`);
};

export const getTimeCurrent = (videoElement, setCurTime, setPercentSlider) => {
    const percent = (videoElement.currentTime / videoElement.duration) * 100;
    const currentTimeM = Math.floor(videoElement.currentTime / 60);
    const currentTimeS = Math.floor(videoElement.currentTime % 60);
    setCurTime(
        () =>
            `${currentTimeM < 10 ? `0${currentTimeM}` : currentTimeM}:${currentTimeS < 10 ? `0${currentTimeS}` : currentTimeS
            }`,
    );
    setPercentSlider(percent);
};

export const fMuted = (muted, prevVolume, dispatch, volumeVideoSlice) => {
    if (muted) {
        if (prevVolume === 0) {
            const defaultVolume = 90;
            dispatch(volumeVideoSlice.actions.setVolume(defaultVolume));
        } else {
            dispatch(volumeVideoSlice.actions.turnOnVolume());
        }
    } else {
        dispatch(volumeVideoSlice.actions.turnOffVolume());
    }
    return muted;
};

export const changeVolume = (currentVolume, dispatch, volumeVideoSlice) => {
    if (currentVolume === 0) {
        dispatch(volumeVideoSlice.actions.turnOffVolume());
    } else {
        dispatch(volumeVideoSlice.actions.turnOnVolume());
    }
    dispatch(volumeVideoSlice.actions.setVolume(currentVolume));
};
