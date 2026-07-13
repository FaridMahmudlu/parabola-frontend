import React from 'react'
import { SignIn } from '@clerk/clerk-react'
import Header from '../../components/Header/Header'
import "./login.css"

function Login() {
  return (
    <>
      <Header />
      <div className='FormLoginContainer' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px 0' }}>
        <SignIn signUpUrl="/register" redirectUrl="/profile" />
      </div>
    </>
  )
}

export default Login
