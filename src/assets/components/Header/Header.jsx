import React from 'react'
import { IoMdMenu } from "react-icons/io";
import "./header.css"
import { Link } from 'react-router-dom'
import { useUser, UserButton } from '@clerk/clerk-react'

function Header() {
  const { isSignedIn, user } = useUser()

  function menutoggle() {
    document.getElementById("menyu").classList.toggle("active")
  }

  return (
    <div className='Topcontainer'>
      <div className="headercontainer">
        <div className="parabolalogo">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h1>PARABOLA</h1>
          </Link>
        </div>
        <div className="parabolanavigation" style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
          <IoMdMenu onClick={menutoggle} className='menuicon' />
          <nav id='menyu'>
            <ul style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
              <Link to="/">Katalog</Link>
              {isSignedIn ? (
                <>
                  <Link to="/profile">Profil</Link>
                  {user?.publicMetadata?.role === 'ROLE_SELLER' && (
                    <Link to="/seller">Satıcı Paneli</Link>
                  )}
                  <div style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <UserButton afterSignOutUrl="/login" />
                  </div>
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
