import React, { lazy, Suspense, useEffect } from 'react'

import { Routes, Route, useLocation } from "react-router-dom"
import Home from './pages/Home/Home'
import { initGA, trackPageView, trackEvent } from './utils/analytics'
import { useUser } from '@clerk/clerk-react'

const Register = lazy(() => import('./pages/register/Register'))
const Login = lazy(() => import('./pages/login/Login'))
const Forgot = lazy(() => import('./pages/forgotpassword/Forgot'))
const Profile = lazy(() => import('./pages/profile/Profile'))
const SellerPanel = lazy(() => import('./components/Seller/SellerPanel'))

const App = () => {
  const location = useLocation()
  const { isSignedIn, isLoaded, user } = useUser()

  useEffect(() => {
    initGA()
  }, [])

  useEffect(() => {
    trackPageView(location.pathname + location.search)
  }, [location])

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      const sessionTracked = sessionStorage.getItem("ga_session_auth_tracked");
      if (!sessionTracked) {
        trackEvent("Auth", "login_success", user.primaryEmailAddress?.emailAddress || "");
        sessionStorage.setItem("ga_session_auth_tracked", "true");
      }
    }
  }, [isLoaded, isSignedIn, user])

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
