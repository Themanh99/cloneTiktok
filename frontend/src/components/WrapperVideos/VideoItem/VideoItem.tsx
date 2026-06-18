import styles from './VideoItem.module.scss';
import classNames from 'classnames/bind';
import { faMusic, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import { Wrapper as PopperWrapper } from '../../../components/Popper';
import Button from '../../../components/Button/Button';
import 'linkify-plugin-hashtag';
import VideoPlayer from '../VideoPlayer/VideoPlayer';
import AccountPreview from '../../SuggestedAccounts/AccountPreview/AccountPreview';
import Tippy from '@tippyjs/react/headless';
import Image from '../../Image/Image';
import HashTag from '../../HashTag/HashTag';
import { useCurrentVideoPlayingStore } from '../../../redux/hooks';
import { useAuthModal } from '../../../hooks';
import { useEffect, useRef, useState } from 'react';
import { useElementOnScreen } from '../../../hooks';
const cx = classNames.bind(styles);

function VideoItem({ data, indexVideo }) {
  const { dispatch, currentVideoPlayingSlice } = useCurrentVideoPlayingStore();
  const { loginModal, setShowLoginModal } = useAuthModal();

  const renderPreview = (props) => {
    return (
      <div tabIndex="-1" {...props}>
        <PopperWrapper>
          <AccountPreview data={data} />
        </PopperWrapper>
      </div>
    );
  };

  const wrapperRef = useRef(null);
  const [wrapperElement, setWrapperElement] = useState(null);
  const options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.9,
  };

  const isVisible = useElementOnScreen(options, wrapperRef);
  useEffect(() => {
    setWrapperElement(wrapperRef.current);
    return () => {};
  }, []);
  useEffect(() => {
    if (wrapperElement)
      if (isVisible) {
        dispatch(currentVideoPlayingSlice.actions.setIndex({ index: indexVideo }));
      }
  }, [isVisible, wrapperElement, dispatch, indexVideo, currentVideoPlayingSlice]);
  return (
    <>
      {loginModal}
      <div className={cx('wrapper')} ref={wrapperRef} id={`video-${data.id}`}>
        <Tippy interactive delay={[800, 200]} offset={[125, 10]} placement="bottom" render={renderPreview}>
          <Link to={`/@${data.user.nickname}`} className={cx('link-avatar')}>
            <Image className={cx('user-avatar-big')} src={data.user.avatar} alt={data.user.nickname} />
          </Link>
        </Tippy>
        <div className={cx('container')}>
          <header className={cx('header')}>
            <div className={cx('info')}>
              <Link to={`/@${data.user.nickname}`} className={cx('user')}>
                <Image className={cx('user-avatar-small')} src={data.user.avatar} alt={data.user.nickname} />
                <div className={cx('profile-link')}>
                  <h3 className={cx('nickname')}>{data.user.nickname}</h3>
                  {data.tick ? (
                    <>
                      <FontAwesomeIcon className={cx('check')} icon={faCheckCircle} />
                    </>
                  ) : (
                    <></>
                  )}
                  <p className={cx('fullname')}>{`${data.user.first_name} ${data.user.last_name}`}</p>
                </div>
                {/* .<span className={cx('time')}>{data.published_at}</span> */}
              </Link>
              {data.user.is_followed ? (
                <>
                  <Button
                    outline_black
                    small
                    className={cx('btn-unfollow')}
                    primary
                    to={undefined}
                    href={undefined}
                    leftIcon={null}
                    rightIcon={null}
                    onClick={() => {}}
                  >
                    Unfollow
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    outline
                    small
                    className={cx('btn-follow')}
                    onClick={() => {
                      setShowLoginModal(true);
                    }}
                    primary
                    to={undefined}
                    href={undefined}
                    leftIcon={null}
                    rightIcon={null}
                  >
                    Follow
                  </Button>
                </>
              )}
              <div className={cx('content')}>
                <HashTag>{data.description}</HashTag>
              </div>
              <h4 className={cx('video-music')}>
                <Link to="/music/nhac-nen">
                  <FontAwesomeIcon icon={faMusic} /> Nhạc nền - {data.music}
                </Link>
              </h4>
            </div>
          </header>
          <div className={cx('player')}>
            <VideoPlayer data={data} isVisibile={isVisible} indexVideo={indexVideo} />
          </div>
        </div>{' '}
      </div>
    </>
  );
}

export default VideoItem;
