import { notification } from 'antd'
import axios from 'axios'
import React, { useState } from 'react'

const Forgot = () => {
    const [email,setEmail]=useState("")

    const handleforgotpas = async(e)=>{
       e.preventDefault()

      try {
         await axios.get("https://678e58c7a64c82aeb1200f8c.mockapi.io/new",{email})
         notification.success({
           message: "Email göndərildi",
           description: "Şifrəni sıfırlamaq üçün emailinizə link göndərildi."
         })
      } catch (error) {
        notification.error({
        message: "Xəta baş verdi",
        description: error.message
      })
      }
    }
  return (
    <div>
       <div className="FormContainer">
      <form onSubmit={handleforgotpas}>
        <h2>Forgot Password</h2>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit">Send Reset Link</button>
      </form>
    </div>
    </div>
  )
}

export default Forgot
