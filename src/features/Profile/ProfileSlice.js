import { createSlice } from "@reduxjs/toolkit";
const initialState = {
  cins: "",
  size: "",
  bigsize:""
}
const profileSlice=createSlice({
name:"profile",
initialState,
reducers:{
    profileUpdate:(state,action)=>{
        state.cins=action.payload.cins
        state.size=action.payload.size
        state.bigsize=action.payload.bigsize
    }
}
})
export const{profileUpdate}=profileSlice.actions
export default profileSlice.reducer