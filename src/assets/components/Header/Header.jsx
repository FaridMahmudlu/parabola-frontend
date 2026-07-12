import React from 'react'
import { IoMdMenu } from "react-icons/io";
import "./header.css"
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../../../features/Auth/authSlice'

function Header() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)

  function menutoggle() {
    document.getElementById("menyu").classList.toggle("active")
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate("/login")
  }

  return (
    <div className='Topcontainer'>
      <div className="headercontainer">
        <div className="parabolalogo">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h1>PARABOLA</h1>
          </Link>
        </div>
        <div className="parabolanavigation">
          <IoMdMenu onClick={menutoggle} className='menuicon' />
          <nav id='menyu'>
            <ul>
              <Link to="/">Katalog</Link>
              {user ? (
                <>
                  <Link to="/profile">Profil</Link>
                  {user.role === 'ROLE_SELLER' && (
                    <Link to="/seller">Satıcı Paneli</Link>
                  )}
                  <button onClick={handleLogout}>Çıxış</button>
                </>
              ) : (
                <>
                  <Link to="/login">Daxil Ol</Link>
                  <Link to="/register">Qeydiyyat</Link>
                </>
              )}
            </ul>
          </nav>
        </div> 
      </div>
    </div>
  )
}

export default Header
