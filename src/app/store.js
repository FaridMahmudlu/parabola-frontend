import { configureStore } from '@reduxjs/toolkit'
import authSlice from "../features/Auth/authSlice"
import profileSlice from "../features/Profile/ProfileSlice"
export const  store=configureStore({
    reducer:{
        auth:authSlice,
        profile:profileSlice
    }
})