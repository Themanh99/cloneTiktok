import * as httpRequest from '../routes/utils/httpRequest'
import {
    loginStart, loginSuccess, loginFailed, registerStart, registerSuccess, registerFailed, logOutStart, logOutFailed, logOutSuccess
} from '../redux/authSlice';
import config from '../config/index';

export const loginUser = async (user, dispatch, navigate, onHide) => {
    dispatch(loginStart());
    try {
        const res = await httpRequest.post('/auth/login', {
            email: user.email,
            password: user.password
        });
        dispatch(loginSuccess(res));
        navigate(config.routes.home);
        onHide();
    } catch (error) {
        dispatch(loginFailed());
    }
};

export const registerUser = async (user, type, dispatch) => {
    dispatch(registerStart());
    try {
        const res = await httpRequest.post('/auth/register', {
            type,
            email: user.email,
            password: user.password
        });
        dispatch(registerSuccess(res));
    } catch (error) {
        dispatch(registerFailed());
    }
};

export const logOut = async (dispatch, navigate, user, token) => {
    // dispatch(logOutStart());
    // try {
    //     // const res = await httpRequest.post('/auth/logout', id, {
    //     //     headers: { Authorization: `Brear ${token}` }
    //     // });
    //     dispatch(logOutSuccess());
    //     navigate('/');
    // } catch (error) {
    //     dispatch(logOutFailed());
    //}
};