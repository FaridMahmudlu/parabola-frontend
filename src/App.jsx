import React from 'react'
import { SpeedInsights } from '@vercel/speed-insights/react'

import{Routes,Route} from "react-router-dom"
import Home from './pages/Home/Home'
import Register from './pages/register/Register'
import Login from './pages/login/Login'
import Forgot from './pages/forgotpassword/Forgot'
import Profile from './pages/profile/Profile'
import SellerPanel from './components/Seller/SellerPanel'



const App = () => {
  return (
    <div>
   
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/register' element={<Register/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/forgot' element={<Forgot/>}/>
        <Route path='/profile' element={<Profile/>}/>
        <Route path='/seller' element={<SellerPanel/>}/>
      </Routes>
      <SpeedInsights />
     

    
    </div>
  )
}

export default App
