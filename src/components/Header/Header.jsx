import React, { useState } from 'react'
import { CgMenuRight, CgClose } from "react-icons/cg";
import { FiGrid, FiUser, FiSliders, FiLogIn, FiUserPlus } from "react-icons/fi";
import "./header.css"
import { Link, useLocation } from 'react-router-dom'
import { useUser, UserButton } from '@clerk/clerk-react'

function Header() {
  const { isSignedIn, user } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

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
                  {user?.publicMetadata?.role === 'ROLE_SELLER' && (
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
                <>
                  <li>
                    <Link 
                      to="/login" 
                      className={isActive('/login') ? 'active-link' : ''} 
                      onClick={() => setMenuOpen(false)}
                    >
                      <FiLogIn className="nav-icon" />
                      <span>Daxil Ol</span>
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/register" 
                      className={isActive('/register') ? 'active-link' : ''} 
                      onClick={() => setMenuOpen(false)}
                    >
                      <FiUserPlus className="nav-icon" />
                      <span>Qeydiyyat</span>
                    </Link>
                  </li>
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
