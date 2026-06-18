import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import * as videoService from '../../services/videoService';

import classNames from 'classnames/bind';
import styles from './Video.module.scss';

const cx = classNames.bind(styles);

function Video() {
  const [data, setData] = useState<any>({});
  const { uuid } = useParams();
  useEffect(() => {
    const getUser = async () => {
      const result = await videoService.getAVideo(uuid);
      setData(result);
    };
    getUser();
  }, [uuid]);

  const [ratioVideo, setRatioVideo] = useState<number | undefined>();

  useEffect(() => {
    if (data.meta?.video?.resolution_x && data.meta?.video?.resolution_y) {
      const ratio = data.meta.video.resolution_x / data.meta.video.resolution_y;
      setRatioVideo(ratio);
    }
  }, [data]);

  const sizeVideo = styles.sizeVideo;
  return (
    <div className={cx('wrapper')}>
      <div
        className={cx('video-container')}
        style={{
          width: ratioVideo && ratioVideo < 1 ? `calc(${sizeVideo}*${ratioVideo})` : '',
          height: ratioVideo && ratioVideo > 1 ? `calc(${sizeVideo}/${ratioVideo})` : '',
        }}
      >
        <video src={data.file_url || ''} className={cx('video-player')} loop muted={true} />
      </div>
    </div>
  );
}

export default Video;
