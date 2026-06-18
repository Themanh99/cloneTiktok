import React, { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroller';
import classNames from 'classnames/bind';
import styles from './WrapperVideos.module.scss';
import VideoItem from './VideoItem/VideoItem';
import { useCurrentVideoPlayingStore } from '../../redux/hooks';
import * as videoService from '../../services/videoService';


const cx = classNames.bind(styles);

function WrapperVideos() {
    const [data, setData] = useState([]);
    const [page, setPage] = useState(1);
    //random page
    const { stateCurrentVideoPlayingStore, dispatch, currentVideoPlayingSlice } = useCurrentVideoPlayingStore();
    const { currentIndex, list } = stateCurrentVideoPlayingStore;

    const getVideos = async () => {
        const type = 'for-you';
        const result = await videoService.videosList(type, page);
        setData([...data, ...result]);
        setPage(page + 1);
    }
    useEffect(() => {
        dispatch(currentVideoPlayingSlice.actions.getList({ list: data }));
        // eslint-disable-next-line
    }, [data]);

    useEffect(() => {
        getVideos();
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        const handlePressDownKey = (e) => {
            const yOffset = -100;
            if (e.keyCode === 40 || e.keyCode === 32) {
                e.preventDefault();
                if (list.length !== 0) {
                    const videoWrapperElement = document.getElementById(`video-${list[currentIndex + 1].id}`);
                    const y = videoWrapperElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
                    window.scrollTo({ behavior: 'smooth', top: y });
                }
            } else if (e.keyCode === 38) {
                e.preventDefault();
                if (list.length !== 0) {
                    if (currentIndex > 0) {
                        const videoWrapperElement = document.getElementById(`video-${list[currentIndex - 1].id}`);
                        const y = videoWrapperElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
                        window.scrollTo({ behavior: 'smooth', top: y });
                    }
                }
            }
        };
        document.addEventListener('keydown', handlePressDownKey);
        return () => {
            document.addEventListener('keydown', handlePressDownKey);
        };
    }, [currentIndex, list]);
    return (
        <div className={cx('wrapperVideos')}>
            <InfiniteScroll className={cx('wrapperrr')} pageStart={0} hasMore={true || false} loadMore={getVideos}>
                <div className={cx('wrapper-container')}>
                    {data.map((video, index) => (
                        <VideoItem key={video.id} data={video} indexVideo={index} />
                    ))}
                </div>
            </InfiniteScroll>
        </div>
    );
}

export default WrapperVideos;