import React, { useState } from 'react'
import { CgMenuRight, CgClose } from "react-icons/cg";
import "./header.css"
import { Link } from 'react-router-dom'
import { useUser, UserButton } from '@clerk/clerk-react'

function Header() {
  const { isSignedIn, user } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)

  function toggleMenu() {
    setMenuOpen(!menuOpen)
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
          {menuOpen ? (
            <CgClose onClick={toggleMenu} className='menuicon' />
          ) : (
            <CgMenuRight onClick={toggleMenu} className='menuicon' />
          )}
          <nav id='menyu' className={menuOpen ? 'active' : ''}>
            <ul>
              <li>
                <Link to="/" onClick={() => setMenuOpen(false)}>Katalog</Link>
              </li>
              {isSignedIn ? (
                <>
                  <li>
                    <Link to="/profile" onClick={() => setMenuOpen(false)}>Profil</Link>
                  </li>
                  {user?.publicMetadata?.role === 'ROLE_SELLER' && (
                    <li>
                      <Link to="/seller" onClick={() => setMenuOpen(false)}>Satıcı Paneli</Link>
                    </li>
                  )}
                  <li className="user-btn-li">
                    <UserButton afterSignOutUrl="/login" />
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/login" onClick={() => setMenuOpen(false)}>Daxil Ol</Link>
                  </li>
                  <li>
                    <Link to="/register" onClick={() => setMenuOpen(false)}>Qeydiyyat</Link>
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
