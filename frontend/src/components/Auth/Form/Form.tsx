import classNames from 'classnames/bind';
import styles from './Form.module.scss';

const cx = classNames.bind(styles);

function LoginForm(hasAccount) {
    return (
        <div className={cx('wrapper')}>
            {hasAccount.hasAccount ? <h1>Login to TikTok-ui</h1> : <h1>Sign up for TikTok-ui</h1>}
            <div className={cx('form')}>
                {hasAccount.hasAccount ? (
                    <>
                        <p>Email or TikTokID</p>
                        <div className={cx('form-input')}>
                            <input type="text" placeholder="Email" />
                        </div>
                        <div className={cx('form-input')}>
                            <input type="text" placeholder="Password" />
                        </div>
                        <span className={cx('forgot-password')}>Forgot your password?</span>
                    </>
                ) : (
                    <>
                        <p>Email</p>
                        <div className={cx('form-input')}>
                            <input type="text" placeholder="Email" />
                        </div>
                        <div className={cx('form-input')}>
                            <input type="text" placeholder="Password" />
                        </div>
                        <div className={cx('form-input')}>
                            <input type="text" placeholder="Re-type Password" />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default LoginForm;
