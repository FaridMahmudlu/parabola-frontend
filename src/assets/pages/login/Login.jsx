import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { authFailure, authStart, authSuccess } from '../../../features/Auth/authSlice'
import axios from 'axios'
import { notification } from "antd";
import { Link, useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header';
import "./login.css"
import { BASE_URL } from '../config'  

function Login() {
  const dispatch = useDispatch()
  const { loading, error } = useSelector((state) => state.auth)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    dispatch(authStart())

    if (!email || !password) {
      notification.error({
        message: "Xəta",
        description: "Email və ya şifrə boş ola bilməz!"
      })
      return
    }

    try {
      let { data } = await axios.post(`${BASE_URL}/api/v1/auth/login`, { email, password })

      if (data && data.token) {
        dispatch(authSuccess(data))

        notification.success({
          message: "Uğurlu oldu",
          description: `Xoş gəldiniz, ${data.username || data.email}`
        })

        navigate("/profile")
      } else {
        dispatch(authFailure("Email və şifrə yanlışdır"))
        notification.error({
          message: "Login uğursuz",
          description: "İstifadəçi məlumatları tapılmadı!"
        })
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data || error.message;
      dispatch(authFailure(errorMessage))
      notification.error({
        message: "Giriş uğursuz oldu",
        description: typeof errorMessage === 'string' ? errorMessage : "Şifrə və ya email yanlışdır."
      })
    }
  }

  return (
    <>
      <Header />
      <div className='FormLoginContainer'>
        <form onSubmit={handleLogin}>
          <div className="FormLoginText">
            <h2>Log into Parabola</h2>
          </div>
          <div className="formLogindiv">
            <div className="LabelLoginForm">
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
            <div className="LabelLoginForm">
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

            <div className="forgotpassword">
              <Link to="/forgot">
                <button type="button">Forgot Password ?</button>
              </Link>
            </div>

            <div className="formbtn">
              <button type="submit" disabled={loading}>
                {loading ? "loading..." : "Login"}
              </button>
            </div>

            <div className="createaccount">
              <Link to="/register">
                <button type="button">Create New Account</button>
              </Link>
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}
        </form>
      </div>
    </>
  )
}

export default Login
