import React, { useState } from 'react';
import styles from '../Login/Login.module.scss'
import classNames from 'classnames/bind'
import PropTypes from 'prop-types';
import { loginUser } from '../../../services/authServices';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Alert } from 'antd';

const cx = classNames.bind(styles)

function Signup({ show, onHide }) {

    const [name, setName] = useState("");
    const [password, setPassword] = useState("");

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        const newUser = {
            email: name,
            password: password
        }
        loginUser(newUser, dispatch, navigate, onHide);
        <Alert message="Success Tips" type="success" showIcon />
    };

    if (!show) {
        return <></>;
    }
    return (
        <div className={cx('wrapper')}>
            <div className={cx('container')}>
                <div className={cx('content')} role='dialog' aria-modal='true' aria-labelledby='login-modal-title' >
                    <div className={cx('divwrapper')}>
                        <div className={cx('logincontainer')}>
                            <div className={cx('homecontainer')}>
                                <h2 className={cx('title')}>Log in to TikTok</h2>
                                <div className={cx('divdescription')} >Email or username
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className={cx('inputcontain')} >
                                        <input
                                            type="text"
                                            placeholder="Email or username"
                                            name="username"
                                            className={cx('input-container')}
                                            onChange={(e) => setName(e.target.value)}
                                        />
                                        <div className={cx('iconcontain')} />
                                    </div>
                                    <div className={cx('inputcontain')} >
                                        <input
                                            type="password"
                                            placeholder="Password"
                                            autoComplete="new-password"
                                            className={cx('input-container')}
                                            onChange={(e) => setPassword(e.target.value)}
                                        />
                                        <div className={cx('iconcontain')} >
                                            <i
                                                tabIndex={0}
                                                role="button"
                                                className={cx('pswdicon')}
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 20 20"
                                                    width="1.2em"
                                                    height="1.2em"
                                                >
                                                    <g
                                                        stroke="#161823"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeMiterlimit={10}
                                                        strokeWidth="1.5"
                                                        opacity="0.5">
                                                        <path d="M2.8 7.8c2.1 1 4.5 1.6 7 1.6s4.9-.6 7-1.6M9.8 9.8v3M5.1 9.2l-1.5 2.6M14.6 9.2l1.5 2.6" />
                                                    </g>
                                                </svg>
                                            </i>
                                        </div>
                                    </div><a href="/login/email/forget-password" className={cx('linkbtn')} >Forgot password?</a>
                                    <button type="submit" data-e2e="login-button" className={cx('button-style')} id="btn-disa" >Log in</button>
                                </form>
                                <div
                                    className={cx('boxcontainer')}
                                    tabIndex={0}
                                    role="button"
                                    data-e2e="channel-item">
                                    <div className={cx('iconcontainer')}>
                                        <svg
                                            width="1em"
                                            data-e2e height="1em"
                                            viewBox="0 0 48 48"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path d="M24 47C36.7025 47 47 36.7025 47 24C47 11.2975 36.7025 1 24 1C11.2975 1 1 11.2975 1 24C1 36.7025 11.2975 47 24 47Z" fill="white" />
                                            <path d="M24 1C11.2964 1 1 11.2964 1 24C1 35.4775 9.40298 44.9804 20.3846 46.7205L20.3936 30.6629H14.5151V24.009H20.3936C20.3936 24.009 20.3665 20.2223 20.3936 18.5363C20.4206 16.8503 20.7542 15.2274 21.6288 13.7487C22.9722 11.4586 25.0639 10.3407 27.6335 10.0251C29.7432 9.76362 31.826 10.0521 33.9087 10.3407C34.0529 10.3587 34.125 10.3767 34.2693 10.4038C34.2693 10.4038 34.2783 10.6472 34.2693 10.8005C34.2603 12.4053 34.2693 16.0839 34.2693 16.0839C33.2685 16.0659 31.6096 15.9667 30.5096 16.138C28.6884 16.4175 27.6425 17.5806 27.6064 19.4108C27.5704 20.8354 27.5884 24.009 27.5884 24.009H33.9988L32.962 30.6629H27.5974V46.7205C38.597 44.9984 47.009 35.4775 47.009 24C47 11.2964 36.7036 1 24 1Z" fill="#0075FA" /></svg>
                                    </div><p>Continue with Facebook</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className={cx('divcontent')} >
                        <div>Don't have an account?  </div>
                        <a className={cx('link')} href='/signup'>Sign up</a>
                    </div>
                </div>
                <div
                    data-e2e="modal-close-inner-button"
                    role="button"
                    tabIndex={0}
                    onClick={onHide}
                    className={cx('divcclose')}>
                    <svg
                        className={cx('styleicon')}
                        width="1em"
                        data-e2e
                        height="1em"
                        viewBox="0 0 48 48"
                        fill="currentColor"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M21.1718 23.9999L10.2931 13.1212C9.90261 12.7307 9.90261 12.0975 10.2931 11.707L11.7074 10.2928C12.0979 9.90228 12.731 9.90228 13.1216 10.2928L24.0002 21.1715L34.8789 10.2928C35.2694 9.90228 35.9026 9.90228 36.2931 10.2928L37.7073 11.707C38.0979 12.0975 38.0979 12.7307 37.7073 13.1212L26.8287 23.9999L37.7073 34.8786C38.0979 35.2691 38.0979 35.9023 37.7073 36.2928L36.2931 37.707C35.9026 38.0975 35.2694 38.0975 34.8789 37.707L24.0002 26.8283L13.1216 37.707C12.731 38.0975 12.0979 38.0975 11.7074 37.707L10.2931 36.2928C9.90261 35.9023 9.90261 35.2691 10.2931 34.8786L21.1718 23.9999Z" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
Signup.propTypes = {
    show: PropTypes.bool,
    onHide: PropTypes.func,
}

export default Signup;