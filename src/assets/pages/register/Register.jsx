import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import { notification } from "antd";
import { authFailure, authStart, authSuccess } from '../../../features/Auth/authSlice'
import { useNavigate } from 'react-router-dom';
import './register.css'
import Header from '../../components/Header/Header';
import { BASE_URL } from '../config'   

function Register() {
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.auth)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/

  const handleRegister = async (e) => {
    e.preventDefault()

    if (!emailRegex.test(email)) {
      notification.error({
        message: "Email düzgün deyil",
        description: "Zəhmət olmasa düzgün email daxil edin!"
      })
      return
    }

    if (!passwordRegex.test(password)) {
      notification.warning({
        message: "Şifrə zəifdir",
        description: "Şifrə minimum 8 simvol, böyük/kiçik hərf, rəqəm və xüsusi simvol içerməlidir!"
      })
      return
    }

    dispatch(authStart())
    try {
      let { data } = await axios.post(
        `${BASE_URL}/api/v1/auth/register`,
        { email, password }
      )

      dispatch(authSuccess(null))

      notification.success({
        message: "Qeydiyyat uğurlu oldu",
        description: data || "Uğurla qeydiyyatdan keçdiniz! Daxil ola bilərsiniz."
      })

      setEmail("")
      setPassword("")

      setTimeout(() => {
        navigate("/login")
      }, 2000)

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data || error.message;
      dispatch(authFailure(errorMessage))
      notification.error({
        message: "Xəta baş verdi",
        description: typeof errorMessage === 'string' ? errorMessage : "Qeydiyyat uğursuz oldu."
      })
    }
  }

  return (
    <>
      <Header />
      <div className='FormContainer'>
        <form className='formdata' onSubmit={handleRegister}>
          <div className="FormText">
            <h2>Parabola</h2>
            <p>Create a new account</p>
          </div>
          <div className="formdiv">
            <div className="LabelForm">
              <label htmlFor="email">Email</label>
              <input
                id='email'
                autoComplete="off"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="LabelForm">
              <label htmlFor="password">Password</label>
              <input
                id='password'
                autoComplete="new-password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="formbtn">
              <button type="submit" disabled={loading}>
                {loading ? "loading..." : "register"}
              </button>
            </div>

            <p>Already have an account? <a href="/login">Login</a></p>
          </div>

          {error && <p className="error-text">{error}</p>}
        </form>
      </div>
    </>
  )
}

export default Register
