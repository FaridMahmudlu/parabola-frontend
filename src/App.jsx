import React from 'react'

import{Routes,Route} from "react-router-dom"
import Home from './assets/Home/Home'
import Register from './assets/pages/register/Register'
import Login from './assets/pages/login/Login'
import Forgot from './assets/pages/forgotpassword/Forgot'
import Profile from './assets/pages/profile/Profile'
import SellerPanel from './assets/components/Seller/SellerPanel'



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
     

    
    </div>
  )
}

export default App
