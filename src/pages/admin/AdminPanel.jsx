import React, { useState, useEffect } from 'react'
import Header from '../../components/Header/Header'
import LoadingSpinner from '../../components/Loading/LoadingSpinner'
import { useUser, useAuth } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'
import axios from 'axios'
import { BASE_URL } from '../config'
import { notification } from 'antd'
import { FiUsers, FiShoppingBag, FiShield, FiSearch, FiCheck, FiX, FiUserCheck, FiUserX } from 'react-icons/fi'
import './admin.css'

const AdminPanel = () => {
  const { isLoaded, isSignedIn, user } = useUser()
  const { getToken } = useAuth()

  const [isAdmin, setIsAdmin] = useState(false)
  const [loadingCheck, setLoadingCheck] = useState(true)
  const [usersList, setUsersList] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('ALL') // ALL, ROLE_USER, ROLE_SELLER, ROLE_ADMIN
  const [actionLoadingId, setActionLoadingId] = useState(null)

  useEffect(() => {
    const verifyAdminAccess = async () => {
      if (!isSignedIn) {
        setLoadingCheck(false)
        return
      }
      try {
        const token = await getToken()
        const clerkRoleHeader = user?.publicMetadata?.role || ""
        const userEmailHeader = user?.primaryEmailAddress?.emailAddress || ""
        const { data } = await axios.get(`${BASE_URL}/api/v1/admin/check`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            ...(clerkRoleHeader ? { "X-Clerk-Role": clerkRoleHeader } : {}),
            ...(userEmailHeader ? { "X-Clerk-User-Email": userEmailHeader } : {})
          }
        })
        if (data && data.isAdmin) {
          setIsAdmin(true)
          fetchUsersList(token, clerkRoleHeader, userEmailHeader)
        } else {
          setIsAdmin(false)
        }
      } catch (err) {
        console.error("Admin verification error:", err)
        setIsAdmin(false)
      } finally {
        setLoadingCheck(false)
      }
    }

    if (isSignedIn) {
      verifyAdminAccess()
    } else if (isLoaded && !isSignedIn) {
      setLoadingCheck(false)
    }
  }, [isSignedIn, isLoaded, getToken, user])

  const fetchUsersList = async (authToken, roleHeader, emailHeader) => {
    setLoadingUsers(true)
    try {
      const token = authToken || (await getToken())
      const clerkRoleHeader = roleHeader || user?.publicMetadata?.role || ""
      const userEmailHeader = emailHeader || user?.primaryEmailAddress?.emailAddress || ""
      const { data } = await axios.get(`${BASE_URL}/api/v1/admin/users`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          ...(clerkRoleHeader ? { "X-Clerk-Role": clerkRoleHeader } : {}),
          ...(userEmailHeader ? { "X-Clerk-User-Email": userEmailHeader } : {})
        }
      })
      setUsersList(data)
    } catch (err) {
      console.error("Error fetching users list:", err)
      notification.error({
        message: "Xəta",
        description: "İstifadəçi siyahısını gətirmək mümkün olmadı."
      })
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleRoleChange = async (targetUserId, targetUsername, newRoleStr) => {
    setActionLoadingId(targetUserId)
    try {
      const token = await getToken()
      const clerkRoleHeader = user?.publicMetadata?.role || ""
      const userEmailHeader = user?.primaryEmailAddress?.emailAddress || ""
      const { data } = await axios.put(
        `${BASE_URL}/api/v1/admin/users/${targetUserId}/role`,
        { role: newRoleStr },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            ...(clerkRoleHeader ? { "X-Clerk-Role": clerkRoleHeader } : {}),
            ...(userEmailHeader ? { "X-Clerk-User-Email": userEmailHeader } : {})
          }
        }
      )
      
      setUsersList(prev => prev.map(u => u.id === targetUserId ? data : u))

      const roleTextMap = {
        'ROLE_SELLER': 'Satıcı',
        'ROLE_USER': 'Adi İstifadəçi',
        'ROLE_ADMIN': 'Admin'
      }

      notification.success({
        message: "Rol Yeniləndi",
        description: `${targetUsername || 'İstifadəçi'} uğurla ${roleTextMap[newRoleStr] || newRoleStr} roluna keçirildi.`
      })
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message
      notification.error({
        message: "Rol Dəyişdirilə Bilmədi",
        description: errMsg
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  if (!isLoaded || loadingCheck) {
    return <LoadingSpinner text="Təhlükəsizlik icazələri yoxlanılır..." fullScreen={true} iconType="admin" />
  }

  if (!isSignedIn || !isAdmin) {
    notification.error({
      message: "Giriş Qadağandır",
      description: "Bu gizli səhifəyə yalnız sistem İdarəçiləri (Admin) daxil ola bilər."
    })
    return <Navigate to="/" />
  }

  // Filter & Search Logic
  const filteredUsers = usersList.filter(u => {
    const matchesSearch = 
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.shopName && u.shopName.toLowerCase().includes(searchQuery.toLowerCase()))
    
    if (filterRole === 'ALL') return matchesSearch
    return matchesSearch && u.role === filterRole
  })

  const totalSellers = usersList.filter(u => u.role === 'ROLE_SELLER').length
  const totalAdmins = usersList.filter(u => u.role === 'ROLE_ADMIN').length
  const totalUsers = usersList.filter(u => u.role === 'ROLE_USER').length

  return (
    <>
      <Header />
      <div className="admin-wrapper">
        <div className="admin-header-section">
          <div>
            <h1 className="admin-title">İdarəetmə Paneli <span>(Admin)</span></h1>
            <p className="admin-subtitle">İstifadəçilərin siyahısı, rolları və Satıcı icazələrinin idarə olunması.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="stat-icon-wrapper">
              <FiUsers />
            </div>
            <div className="stat-info">
              <div className="stat-value">{usersList.length}</div>
              <div className="stat-label">Ümumi İstifadəçi</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#c9a96e', background: 'rgba(201, 169, 110, 0.15)' }}>
              <FiShoppingBag />
            </div>
            <div className="stat-info">
              <div className="stat-value" style={{ color: '#c9a96e' }}>{totalSellers}</div>
              <div className="stat-label">Təsdiqlənmiş Satıcı</div>
            </div>
          </div>
          <div className="admin-stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#c084fc', background: 'rgba(168, 85, 247, 0.15)' }}>
              <FiShield />
            </div>
            <div className="stat-info">
              <div className="stat-value" style={{ color: '#c084fc' }}>{totalAdmins}</div>
              <div className="stat-label">İdarəçi (Admin)</div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="admin-controls-bar">
          <div className="search-box-wrapper">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="E-poçt, istifadəçi adı və ya mağaza adı ilə axtar..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="role-filter-group">
            <button 
              className={`filter-chip ${filterRole === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilterRole('ALL')}
            >
              Hamısı ({usersList.length})
            </button>
            <button 
              className={`filter-chip ${filterRole === 'ROLE_SELLER' ? 'active' : ''}`}
              onClick={() => setFilterRole('ROLE_SELLER')}
            >
              Satıcılar ({totalSellers})
            </button>
            <button 
              className={`filter-chip ${filterRole === 'ROLE_USER' ? 'active' : ''}`}
              onClick={() => setFilterRole('ROLE_USER')}
            >
              İstifadəçilər ({totalUsers})
            </button>
            <button 
              className={`filter-chip ${filterRole === 'ROLE_ADMIN' ? 'active' : ''}`}
              onClick={() => setFilterRole('ROLE_ADMIN')}
            >
              Adminlər ({totalAdmins})
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>İstifadəçi</th>
                <th>E-poçt Ünvanı</th>
                <th>Mağaza Adı</th>
                <th>Cari Rol</th>
                <th>Əməliyyat (Rolu Dəyiş)</th>
              </tr>
            </thead>
            <tbody>
              {loadingUsers ? (
                <tr>
                  <td colSpan="5" className="empty-state">
                    <LoadingSpinner text="İstifadəçilər gətirilir..." fullScreen={false} iconType="admin" />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-state">Məlumat tapılmadı.</td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const initialChar = u.username ? u.username.charAt(0) : (u.email ? u.email.charAt(0) : 'U')
                  const isUserSeller = u.role === 'ROLE_SELLER'
                  const isUserAdmin = u.role === 'ROLE_ADMIN'
                  const isUpdating = actionLoadingId === u.id

                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar">{initialChar}</div>
                          <div className="user-details">
                            <div className="username">{u.username || 'Anonim'}</div>
                            <div className="email">ID: #{u.id}</div>
                          </div>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        {u.shopName ? (
                          <span style={{ color: '#c9a96e', fontWeight: '500' }}>{u.shopName}</span>
                        ) : (
                          <span style={{ color: '#555' }}>-</span>
                        )}
                      </td>
                      <td>
                        {isUserAdmin ? (
                          <span className="role-badge badge-admin"><FiShield /> ADMIN</span>
                        ) : isUserSeller ? (
                          <span className="role-badge badge-seller"><FiShoppingBag /> SATICI</span>
                        ) : (
                          <span className="role-badge badge-user">İSTİFADƏÇİ</span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons-cell">
                          {isUpdating ? (
                            <span style={{ fontSize: '12px', color: '#c9a96e' }}>Yenilənir...</span>
                          ) : (
                            <>
                              {!isUserSeller && (
                                <button 
                                  className="btn-action-role btn-make-seller"
                                  onClick={() => handleRoleChange(u.id, u.username, 'ROLE_SELLER')}
                                >
                                  <FiUserCheck /> Satıcı Et
                                </button>
                              )}
                              {isUserSeller && (
                                <button 
                                  className="btn-action-role btn-make-user"
                                  onClick={() => handleRoleChange(u.id, u.username, 'ROLE_USER')}
                                >
                                  <FiUserX /> Adi İstifadəçi Et
                                </button>
                              )}
                              {!isUserAdmin && (
                                <button 
                                  className="btn-action-role btn-make-admin"
                                  onClick={() => handleRoleChange(u.id, u.username, 'ROLE_ADMIN')}
                                >
                                  <FiShield /> Admin Et
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default AdminPanel
