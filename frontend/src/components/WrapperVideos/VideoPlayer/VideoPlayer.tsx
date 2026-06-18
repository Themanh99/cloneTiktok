import styles from './VideoPlayer.module.scss';
import classNames from 'classnames/bind';
import { faPause, faPlay, faHeart, faComment, faShare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useRef, useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import useAuthModal from '../../../hooks/useAuthModal';
import Menu from '../../Popper/Menu/Menu';

import { DipIcon, TelegramRedIcon, FacebookIcon, WhatsAppIcon, LinksIcon } from '../../Icons/Icons';
import ScrollTrigger from 'gsap/ScrollTrigger';
import TrackSlider from './TrackSlider/TrackSlider';
import VolumeSlider from './VolumeSlider/VolumeSlider';
import { actions, useVolumeStore } from '../../../context';
import Image from '../../Image/Image';

const cx = classNames.bind(styles);

const MENU_ITEMS = [
  {
    icon: <DipIcon className={cx('menu-icon')} />,
    title: 'Copy Link',
  },
  {
    icon: <TelegramRedIcon className={cx('menu-icon')} />,
    title: 'Send to friends',
    to: '/feedback',
  },
  {
    icon: <FacebookIcon className={cx('menu-icon')} />,
    title: 'Share with facebook',
  },

  {
    icon: <WhatsAppIcon className={cx('menu-icon')} />,
    title: 'Share with Whatsapp',
  },
  {
    icon: <LinksIcon className={cx('menu-icon')} />,
    title: 'Share with Link',
  },
];

gsap.registerPlugin(ScrollTrigger);

function VideoPlayer({ data, isVisibile, indexVideo }) {
  const { loginModal, setShowLoginModal } = useAuthModal();
  // const { videoModal, setShowVideoModal } = useVideoModal()

  const [state, dispatch] = useVolumeStore();

  const videoRef = useRef(null);
  const [videoElement, setVideoElement] = useState(null);
  const [wrapperElement, setWrapperElement] = useState(null);
  const wrapperRef = useRef(null);
  const { muted, volume, prevVolume } = state;
  const [duration, setDuration] = useState(data.meta.playtime_seconds);
  const [percentDurationSlider, setPercentDurationSlider] = useState(0);
  const [timeDuration, setTimeDuration] = useState(data.meta.playtime_strings);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [isPlaying, setIsPlaying] = useState(false);
  const [ratioVideo, setRatioVideo] = useState<number | undefined>();
  const [classSize, setClassSize] = useState(null);

  useEffect(() => {
    const ratio = data.meta.video.resolution_x / data.meta.video.resolution_y;
    setRatioVideo(ratio);
    setClassSize(ratio < 1 ? 'wrapper-height' : 'wrapper-width');
    setWrapperElement(wrapperRef.current);
    setVideoElement(videoRef.current);
  }, [data, isVisibile]);

  const classes = cx('wrapper', {
    [classSize]: classSize,
  });

  const play = useCallback(() => {
    if (videoElement) {
      videoElement.play();
    }
    setIsPlaying(true);
  }, [videoElement]);

  const pause = useCallback(() => {
    if (videoElement) videoElement.pause();
    setIsPlaying(false);
  }, [videoElement]);

  useEffect(() => {
    if (wrapperElement)
      if (videoElement) {
        if (isVisibile) {
          if (!isPlaying) {
            play();
          }
        } else {
          if (isPlaying) {
            pause();
          }
        }
      } // eslint-disable-next-line
  }, [isVisibile, wrapperElement, videoElement]);

  useEffect(() => {
    setVideoElement(videoRef.current);
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleBtnPlay = () => {
    togglePlay();
  };

  useEffect(() => {
    if (videoElement) {
      videoElement.volume = volume / 100;
      videoElement.muted = muted;
    }
  }, [volume, muted, videoElement]);

  const handleValueVolumeChange = (e) => {
    const currentVolume = parseInt(e.target.value);
    if (currentVolume === 0) {
      dispatch(actions.turnOffVolume());
    } else {
      dispatch(actions.turnOnVolume());
    }
    dispatch(actions.setVolume(currentVolume));

    // videoElement.volume = currentVolume / 100
  };
  const handleMuted = useCallback(() => {
    if (muted) {
      if (prevVolume === 0) {
        const defaultVolume = 90;
        dispatch(actions.setVolume(defaultVolume));
      } else {
        dispatch(actions.turnOnVolume());
      }
    } else {
      dispatch(actions.turnOffVolume());
    }

    return muted;
  }, [prevVolume, muted, dispatch]);

  const handleValueTrackChange = (e) => {
    const percent = parseInt(e.target.value);
    videoElement.currentTime = (percent * videoElement.duration) / 100;
    setPercentDurationSlider(e.target.value);
  };

  const handleLoadedVideo = () => {
    const duraM = Math.floor(videoElement.duration / 60);
    const duraS = Math.floor(videoElement.duration % 60);
    setDuration(() => videoElement.duration);
    setTimeDuration(() => `${duraM < 10 ? `0${duraM}` : duraM}:${duraS < 10 ? `0${duraS}` : duraS}`);
  };

  const handleTimeUpdate = () => {
    const currentTimeM = Math.floor(videoElement.currentTime / 60);
    const currentTimeS = Math.floor(videoElement.currentTime % 60);
    const percent = (videoElement.currentTime / duration) * 100;
    setCurrentTime(
      () =>
        `${currentTimeM < 10 ? `0${currentTimeM}` : currentTimeM}:${
          currentTimeS < 10 ? `0${currentTimeS}` : currentTimeS
        }`,
    );
    setPercentDurationSlider(percent);
  };

  const sizeVideo = styles.sizeVideo;

  return (
    <>
      {loginModal}
      <div className={classes} ref={wrapperRef}>
        <div className={cx('video-container')}>
          <Image className={cx('thumnail')} src={data.thumb_url} />
          <div className={cx('video-player')}>
            <video
              ref={videoRef}
              loop
              muted={true}
              onLoadedMetadata={handleLoadedVideo}
              onTimeUpdate={handleTimeUpdate}
            >
              <source src={data.file_url} type="video/mp4" />
            </video>
          </div>
          <div className={cx('controls')}>
            <button className={cx('btn-play')} onClick={handleBtnPlay}>
              <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
            </button>
            <div className={cx('volume')}>
              <VolumeSlider onValueChange={handleValueVolumeChange} onMuted={handleMuted} />
            </div>

            <div className={cx('duration')}>
              <TrackSlider percent={percentDurationSlider} onValueChange={handleValueTrackChange} />
              <div className={cx('time')}>
                {currentTime}/{timeDuration}
              </div>
            </div>
          </div>
        </div>
        <div className={cx('action-icon-container')}>
          <button className={cx('action-icon-btn')}>
            <span className={cx('heart-icon')} onClick={() => setShowLoginModal(true)}>
              <FontAwesomeIcon icon={faHeart} />
            </span>
            <p className={cx('value')}>{data.likes_count}</p>
          </button>
          <button className={cx('action-icon-btn')}>
            <span className={cx('comment-icon')} onClick={() => setShowLoginModal(true)}>
              <FontAwesomeIcon icon={faComment} />
            </span>
            <p className={cx('value')}>{data.comments_count}</p>
          </button>
          <Menu items={MENU_ITEMS}>
            <button className={cx('action-icon-btn')}>
              <span className={cx('share-icon')}>
                <FontAwesomeIcon icon={faShare} />
              </span>
              <p className={cx('value')}>{data.shares_count}</p>
            </button>
          </Menu>
        </div>
      </div>
    </>
  );
}

export default VideoPlayer;
