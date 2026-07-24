import React, { useState, useEffect } from 'react'
import { CgMenuRight, CgClose } from "react-icons/cg";
import { FiGrid, FiUser, FiSliders, FiLogIn, FiUserPlus } from "react-icons/fi";
import "./header.css"
import { Link, useLocation } from 'react-router-dom'
import { useUser, useAuth, UserButton } from '@clerk/clerk-react'
import axios from 'axios'
import { BASE_URL } from '../../pages/config'

function Header() {
  const { isSignedIn, user } = useUser()
  const { getToken } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [isSeller, setIsSeller] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (isSignedIn) {
      if (user?.publicMetadata?.role === 'ROLE_SELLER') {
        setIsSeller(true)
      } else {
        const checkProfile = async () => {
          try {
            const token = await getToken()
            const { data } = await axios.get(`${BASE_URL}/api/v1/users/profile`, {
              headers: { Authorization: `Bearer ${token}` }
            })
            if (data && (data.role === 'ROLE_SELLER' || (data.shopName && data.shopName.trim()))) {
              setIsSeller(true)
            }
          } catch (e) {
            // ignore
          }
        }
        checkProfile()
      }
    } else {
      setIsSeller(false)
    }
  }, [isSignedIn, user, getToken])

  function toggleMenu() {
    setMenuOpen(!menuOpen)
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className='Topcontainer'>
      <div className="headercontainer">
        <div className="parabolalogo">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h1>PARABOLA</h1>
          </Link>
        </div>
        <div className="parabolanavigation">
          {menuOpen ? (
            <CgClose onClick={toggleMenu} className='menuicon' />
          ) : (
            <CgMenuRight onClick={toggleMenu} className='menuicon' />
          )}
          <nav id='menyu' className={menuOpen ? 'active' : ''}>
            <ul>
              <li>
                <Link 
                  to="/" 
                  className={isActive('/') ? 'active-link' : ''} 
                  onClick={() => setMenuOpen(false)}
                >
                  <FiGrid className="nav-icon" />
                  <span>Katalog</span>
                </Link>
              </li>
              {isSignedIn ? (
                <>
                  <li>
                    <Link 
                      to="/profile" 
                      className={isActive('/profile') ? 'active-link' : ''} 
                      onClick={() => setMenuOpen(false)}
                    >
                      <FiUser className="nav-icon" />
                      <span>Profil</span>
                    </Link>
                  </li>
                  {isSeller && (
                    <li>
                      <Link 
                        to="/seller" 
                        className={isActive('/seller') ? 'active-link' : ''} 
                        onClick={() => setMenuOpen(false)}
                      >
                        <FiSliders className="nav-icon" />
                        <span>Satıcı Paneli</span>
                      </Link>
                    </li>
                  )}
                  <li className="user-btn-li">
                    <UserButton afterSignOutUrl="/login" />
                  </li>
                </>
              ) : (
                <li className="auth-btn-group">
                  <Link 
                    to="/login" 
                    className="btn-header-login"
                    onClick={() => setMenuOpen(false)}
                  >
                    Daxil Ol
                  </Link>
                  <Link 
                    to="/register" 
                    className="btn-header-register"
                    onClick={() => setMenuOpen(false)}
                  >
                    Qeydiyyat
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div> 
      </div>
    </div>
  )
}

export default Header
