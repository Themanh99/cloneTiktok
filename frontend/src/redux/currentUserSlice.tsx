import { createSlice } from '@reduxjs/toolkit';

const currentUserSlice = createSlice({
    name: 'user',
    initialState: {
        currentUser: false,
    },
    reducers: {

    },
});

export default currentUserSlice;