import React from 'react'
import { SignUp } from '@clerk/clerk-react'
import Header from '../../components/Header/Header'
import './register.css'

function Register() {
  return (
    <>
      <Header />
      <div className='FormContainer' style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: '20px 0' }}>
        <SignUp signInUrl="/login" afterSignUpUrl="/profile" forceRedirectUrl="/profile" />
      </div>
    </>
  )
}

export default Register
