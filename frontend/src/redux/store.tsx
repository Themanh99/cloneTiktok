import { combineReducers, configureStore } from "@reduxjs/toolkit";
import authReducer from './authSlice';
import volumeVideoSlice from './volumeVideoSlice';
import currentVideoPlayingSlice from './currentVideoPlayingSlice';
import currentUserSlice from './currentUserSlice';
import {
    persistStore,
    persistReducer,
    FLUSH,
    REHYDRATE,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';

const persistConfig = {
    key: 'root',
    version: 1,
    storage,
}
const rootReducer = combineReducers(
    {
        auth: authReducer,
        volumeVideo: volumeVideoSlice.reducer,
        currentVideoPlaying: currentVideoPlayingSlice.reducer,
        user: currentUserSlice.reducer,
    }
);
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
        }),
})

export let persistor = persistStore(store);