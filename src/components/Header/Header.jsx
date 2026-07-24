import React, { useState, useEffect } from 'react'
import { CgMenuRight, CgClose } from "react-icons/cg";
import { FiGrid, FiUser, FiSliders, FiShield, FiLogIn, FiUserPlus } from "react-icons/fi";
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
  const [isAdmin, setIsAdmin] = useState(false)
  const location = useLocation()

  useEffect(() => {
    if (isSignedIn) {
      const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase() || ""
      if (user?.publicMetadata?.role === 'ROLE_SELLER') {
        setIsSeller(true)
      }
      if (user?.publicMetadata?.role === 'ROLE_ADMIN' || email.includes('turalabdullayev') || email.includes('seid')) {
        setIsAdmin(true)
      }

      const checkProfile = async () => {
        try {
          const token = await getToken()
          const { data } = await axios.get(`${BASE_URL}/api/v1/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (data && (data.role === 'ROLE_SELLER' || (data.shopName && data.shopName.trim()))) {
            setIsSeller(true)
          }
          if (data && (data.role === 'ROLE_ADMIN' || email.includes('turalabdullayev') || email.includes('seid'))) {
            setIsAdmin(true)
          }
        } catch (e) {
          // ignore
        }
      }
      checkProfile()
    } else {
      setIsSeller(false)
      setIsAdmin(false)
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
                  {isAdmin && (
                    <li>
                      <Link 
                        to="/admin" 
                        className={isActive('/admin') ? 'active-link' : ''} 
                        onClick={() => setMenuOpen(false)}
                        style={{ color: '#c084fc' }}
                      >
                        <FiShield className="nav-icon" />
                        <span>Admin Panel</span>
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
