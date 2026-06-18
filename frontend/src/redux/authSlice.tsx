import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        login: {
            currentUser: null,
            isFeatching: false,
            error: false
        },
        register: {
            isFeatching: false,
            error: false,
            success: false
        },
        logout: {
            isFeatching: false,
            error: false
        }
    },
    reducers: {
        loginStart: (state) => {
            state.login.isFeatching = true;
        },
        loginSuccess: (state, action) => {
            state.login.isFeatching = false;
            state.login.currentUser = action.payload;
            state.login.error = false;
        },
        loginFailed: (state) => {
            state.login.isFeatching = false;
            state.login.error = true;
        },
        registerStart: (state) => {
            state.register.isFeatching = true;
        },
        registerSuccess: (state) => {
            state.register.isFeatching = false;
            state.register.error = false;
            state.register.success = true;
        },
        registerFailed: (state) => {
            state.register.isFeatching = false;
            state.register.error = true;
            state.register.success = false;
        },
        logOutStart: (state) => {
            state.logout.isFeatching = false;
        },
        logOutSuccess: (state) => {
            state.logout.isFeatching = false;
            state.login.currentUser = null;
            state.logout.error = false;
        },
        logOutFailed: (state) => {
            state.logout.isFeatching = false;
            state.logout.error = true;
        }
    }
})

export const {
    loginStart,
    loginSuccess,
    loginFailed,
    registerStart,
    registerSuccess,
    registerFailed,
    logOutStart,
    logOutSuccess,
    logOutFailed
} = authSlice.actions;

export default authSlice.reducer;