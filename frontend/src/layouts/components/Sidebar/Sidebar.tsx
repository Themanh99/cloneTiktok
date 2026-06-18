import React, { useState } from 'react';
import classNames from 'classnames/bind';
import styles from '../Sidebar/Sidebar.module.scss';
import config from '../../../config';
import MenuItem from './Menu/MenuItem';
import Menu from './Menu/Menu';
import SuggestedAccounts from '../../../components/SuggestedAccounts/SuggestedAccounts';
import FollowingAccounts from '../../../components/FollowingAccounts/FollowingAccounts';
import Discover from '../../../components/Discover/Discover';
import Footer from '../../../components/Footer/Footer';
import { HomeIcon, UserGrpIcon, LiveIcon } from '../../../components/Icons/Icons';
import Button from '../../../components/Button/Button';
import { useSelector } from 'react-redux';
import Login from '../Login/Login';

const cx = classNames.bind(styles);

function Sidebar() {
  const [showdialog, setShowDialog] = useState(false);

  const handleShowDialog = () => {
    setShowDialog(true);
  };
  const handleHideDialog = () => {
    setShowDialog(false);
  };

  const currentuser = useSelector((state: any) => state.auth.login.currentUser);

  return (
    <>
      <aside className={cx('wrapper')}>
        <Menu>
          <MenuItem title="For you" icon={<HomeIcon className={cx('icon')} />} to={config.routes.home} />
          <MenuItem title="Following" icon={<UserGrpIcon className={cx('icon')} />} to={config.routes.following} />
          <MenuItem title="LIVE" icon={<LiveIcon className={cx('icon')} />} to={config.routes.live} />
        </Menu>
        {!currentuser ? (
          <div className={cx('log-in')}>
            <p>Log in to follow creators, like videos, and view comments.</p>
            <Button
              primary
              className={cx('btnlogin')}
              onClick={handleShowDialog}
              to={undefined}
              href={undefined}
              leftIcon={null}
              rightIcon={null}
            >
              Log in
            </Button>
            {showdialog && (
              <div className={cx('divmodalcontainer')}>
                <div className={cx('divmodalmask')}></div>
                <Login show={showdialog} onHide={handleHideDialog} />
              </div>
            )}
          </div>
        ) : (
          <FollowingAccounts label="Following accounts" />
        )}
        <SuggestedAccounts label="Suggested accounts" />
        <div className={cx('Discover')}>
          <Discover label="Discover" />
        </div>
        <div className={cx('Footer')}>
          <Footer />
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
