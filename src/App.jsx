import React, { lazy, Suspense } from 'react'

import { Routes, Route } from "react-router-dom"
import Home from './pages/Home/Home'

const Register = lazy(() => import('./pages/register/Register'))
const Login = lazy(() => import('./pages/login/Login'))
const Forgot = lazy(() => import('./pages/forgotpassword/Forgot'))
const Profile = lazy(() => import('./pages/profile/Profile'))
const SellerPanel = lazy(() => import('./components/Seller/SellerPanel'))

const App = () => {
  return (
    <div>
      <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#c9a96e', background: 'black' }}>Yüklənir...</div>}>
        <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path='/register' element={<Register/>}/>
          <Route path='/login' element={<Login/>}/>
          <Route path='/forgot' element={<Forgot/>}/>
          <Route path='/profile' element={<Profile/>}/>
          <Route path='/seller' element={<SellerPanel/>}/>
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
