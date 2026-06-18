import classNames from 'classnames/bind';
import { useState } from 'react';
import {
  AppleIcon,
  FacebookIcon,
  GoogleIcon,
  InstagramIcon,
  KaokaoTalkIcon,
  LineIcon,
  QRIcon,
  TwitterIcon,
  UserIcon,
} from '../Icons/Icons';

import styles from './Auth.module.scss';
import Form from './Form/Form';

const cx = classNames.bind(styles);

const loginList = {
  title: 'Login to TikTok-ui',
  textFooter: 'Already have an account?',
  textChange: 'Sign up',
  chanel: [
    {
      icon: <QRIcon className={cx('icon')} />,
      label: 'Use QR',
      disable: false,
    },
    {
      icon: <UserIcon className={cx('icon')} />,
      label: 'Mobile Phone / Email / Tiktok ID',
      disable: false,
    },
    {
      icon: <FacebookIcon className={cx('icon')} />,
      label: 'Continue with Facebook',
      disable: false,
    },
    {
      icon: <GoogleIcon className={cx('icon')} />,
      label: 'Continue with Google',
      disable: false,
    },
    {
      icon: <TwitterIcon className={cx('icon')} />,
      label: 'Continue with Twitter',
      disable: true,
    },
    {
      icon: <LineIcon className={cx('icon')} />,
      label: 'Continue with LINE',
      disable: true,
    },
    {
      icon: <KaokaoTalkIcon className={cx('icon')} />,
      label: 'Continue with KaokaoTalk',
      disable: true,
    },
    {
      icon: <AppleIcon className={cx('icon')} />,
      label: 'Continue with Apple',
      disable: false,
    },
    {
      icon: <InstagramIcon className={cx('icon')} />,
      label: 'Continue with Instagram',
      disable: true,
    },
  ],
};

const signinList = {
  title: 'Sign up for TikTok-ui',
  textFooter: 'Already have an account?',
  textChange: 'Login',
  chanel: [
    {
      icon: <UserIcon className={cx('icon')} />,
      label: 'Mobile Phone / Email / Tiktok ID',
      disable: false,
    },
    {
      icon: <FacebookIcon className={cx('icon')} />,
      label: 'Continue with Facebook',
      disable: false,
    },
    {
      icon: <GoogleIcon className={cx('icon')} />,
      label: 'Continue with Google',
      disable: true,
    },
    {
      icon: <TwitterIcon className={cx('icon')} />,
      label: 'Continue with Twitter',
      disable: true,
    },
    {
      icon: <LineIcon className={cx('icon')} />,
      label: 'Continue with LINE',
      disable: true,
    },
    {
      icon: <KaokaoTalkIcon className={cx('icon')} />,
      label: 'Continue with KaokaoTalk',
      disable: true,
    },
    {
      icon: <AppleIcon className={cx('icon')} />,
      label: 'Continue with Apple',
      disable: true,
    },
    {
      icon: <InstagramIcon className={cx('icon')} />,
      label: 'Continue with Instagram',
      disable: true,
    },
  ],
};

function Auth() {
  const [hasAccount, setHasAccount] = useState(true);
  const [isNav, setIsNav] = useState(true);

  return (
    <div className={cx('wrapper')}>
      {hasAccount && !isNav && <Form hasAccount={hasAccount} />}
      {!hasAccount && !isNav && <Form hasAccount={hasAccount} />}
      {isNav ? (
        <div className={cx('scroll')}>
          <div className={cx('container')}>
            <h2 className={cx('header')}>{hasAccount ? loginList.title : signinList.title}</h2>
            <div className={cx('list')}>
              <div className={cx('item')}>
                {(hasAccount ? loginList : signinList).chanel.map((item, index) =>
                  item.disable ? (
                    <div
                      className={cx('btn-chanel')}
                      style={{
                        filter: item.disable ? 'blur(1px)' : null,
                        cursor: item.disable ? '' : 'pointer',
                      }}
                      key={index}
                    >
                      <span className={cx('icon')}>{item.icon}</span>
                      <strong>{item.label}</strong>
                    </div>
                  ) : (
                    <div
                      className={cx('btn-chanel')}
                      style={{
                        filter: item.disable ? 'blur(1px)' : null,
                        cursor: item.disable ? '' : 'pointer',
                      }}
                      key={index}
                      onClick={() => setIsNav(false)}
                    >
                      <span className={cx('icon')}>{item.icon}</span>
                      <strong>{item.label}</strong>
                    </div>
                  ),
                )}
              </div>
            </div>
            {!hasAccount && (
              <div className={cx('policy-confirm')}>
                <p>
                  Bằng cách tiếp tục, bạn đồng ý với <a href="/">Điều khoản Sử dụng</a> của TikTok và xác nhận rằng bạn
                  đã đọc hiểu <a href="/">Chính sách Quyền riêng tư</a> của TikTok.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <></>
      )}
      {isNav ? (
        <div className={cx('footer')}>
          <p>
            {hasAccount ? loginList.textFooter : signinList.textFooter}{' '}
            <span onClick={() => setHasAccount(!hasAccount)}>
              {hasAccount ? loginList.textChange : signinList.textChange}
            </span>
          </p>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}

export default Auth;
