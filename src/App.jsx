import { lazy, Suspense, useEffect } from 'react'
import { notification } from 'antd'

import { Routes, Route, useLocation } from "react-router-dom"
import Home from './pages/Home/Home'
import LoadingSpinner from './components/Loading/LoadingSpinner'
import FeedbackWidget from './components/Feedback/FeedbackWidget'
import { initGA, trackPageView, trackEvent } from './utils/analytics'
import { useUser } from '@clerk/clerk-react'
import { Analytics } from '@vercel/analytics/react'

notification.config({
  maxCount: 1
})

const Register = lazy(() => import('./pages/register/Register'))
const Login = lazy(() => import('./pages/login/Login'))
const Forgot = lazy(() => import('./pages/forgotpassword/Forgot'))
const Profile = lazy(() => import('./pages/profile/Profile'))
const SellerPanel = lazy(() => import('./components/Seller/SellerPanel'))
const AdminPanel = lazy(() => import('./pages/admin/AdminPanel'))
const StorePage = lazy(() => import('./pages/store/StorePage'))

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
      <Suspense fallback={<LoadingSpinner text="Səhifə yüklənir..." fullScreen={true} />}>
        <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path='/register' element={<Register/>}/>
          <Route path='/login' element={<Login/>}/>
          <Route path='/forgot' element={<Forgot/>}/>
          <Route path='/profile' element={<Profile/>}/>
          <Route path='/seller' element={<SellerPanel/>}/>
          <Route path='/admin' element={<AdminPanel/>}/>
          <Route path='/store/:shopName' element={<StorePage/>}/>
        </Routes>
      </Suspense>
      <FeedbackWidget isSignedIn={isSignedIn} />
      <Analytics />
    </div>
  )
}

export default App
