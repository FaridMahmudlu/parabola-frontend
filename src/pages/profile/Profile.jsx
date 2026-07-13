import { notification } from 'antd'
import React, { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import CustomSelect from '../../components/CustomSelect/CustomSelect'
import "./profile.css"
import axios from 'axios'
import { BASE_URL } from '../config'
import { useUser, useAuth } from '@clerk/clerk-react'

const Profile = () => {
  const { isLoaded, isSignedIn, user } = useUser()
  const { getToken } = useAuth()

  const [gender, setGender] = useState("")
  const [clothingSize, setClothingSize] = useState("")
  const [bodyType, setBodyType] = useState("")
  const [shopName, setShopName] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [savedData, setSavedData] = useState(null)

  const isSeller = user?.publicMetadata?.role === "ROLE_SELLER"

  useEffect(() => {
    if (isSignedIn) {
      const fetchProfile = async () => {
        try {
          const token = await getToken()
          const { data } = await axios.get(`${BASE_URL}/api/v1/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (data) {
            setGender(data.gender || "")
            setClothingSize(data.clothingSize || "")
            setBodyType(data.bodyType || "")
            setShopName(data.shopName || "")
            
            if (data.gender && data.clothingSize && data.bodyType) {
              setSavedData(data)
            }
          }
        } catch (error) {
          console.error("Profil məlumatları yüklənmədi:", error)
        }
      }
      fetchProfile()
    }
  }, [isSignedIn, getToken])

  if (!isLoaded) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#c9a96e' }}>Yüklənir...</div>
  }

  if (!isSignedIn) {
    return <Navigate to="/login" />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      gender,
      clothingSize,
      bodyType,
      shopName: isSeller ? shopName : null
    }

    try {
      const token = await getToken()
      const { data } = await axios.put(
        `${BASE_URL}/api/v1/users/profile`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSavedData(payload)
      notification.success({
        message: "Məlumat yadda saxlanıldı",
        description: data || "Profil seçimləriniz uğurla yeniləndi!"
      })
    } catch (error) {
      const errMsg = error.response?.data?.message || error.response?.data || error.message;
      notification.error({
        message: "Xəta baş verdi",
        description: typeof errMsg === 'string' ? errMsg : "Ölçülər yenilənə bilmədi. Zəhmət olmasa seçimlərinizi yoxlayın!"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Header />
      <div className='profilecontainer'>
        <div className="ProfileTextContainer">
          <h2>Profilim</h2>
          <p>Məlumatlarınız uyğunluq hesablamasında istifadə edilir.</p>
        </div>

        {savedData && (
          <div className="user-infos" style={{ height: 'auto', gap: '30px' }}>
            <h3 style={{ fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', color: '#c9a96e', margin: 0 }}>Saxlanılmış məlumatlar</h3>
            <div className="user-info-text" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '18px', fontFamily: 'Cormorant Garamond, serif' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a1a1a', paddingBottom: '10px' }}>
                <span style={{ color: '#7a7570' }}>CİNS</span>
                <span style={{ color: 'white' }}>{savedData.gender}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1a1a1a', paddingBottom: '10px' }}>
                <span style={{ color: '#7a7570' }}>GEYİM ÖLÇÜSÜ</span>
                <span style={{ color: 'white' }}>{savedData.clothingSize}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: isSeller && savedData.shopName ? '1px solid #1a1a1a' : 'none', paddingBottom: '10px' }}>
                <span style={{ color: '#7a7570' }}>BƏDƏN TİPİ</span>
                <span style={{ color: 'white' }}>{savedData.bodyType}</span>
              </div>
              {isSeller && savedData.shopName && (
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px' }}>
                  <span style={{ color: '#7a7570' }}>MAĞAZA ADI</span>
                  <span style={{ color: 'white' }}>{savedData.shopName}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <form className='profileform' onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {isSeller && (
            <div className="profilelabel">
              <label htmlFor="shopName">MAĞAZA ADI</label>
              <input
                id="shopName"
                type="text"
                placeholder="Mağazanızın adını daxil edin"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                style={{
                  width: '100%',
                  background: '#0e0e0e',
                  border: '1px solid #1f1f1f',
                  color: '#f0ece4',
                  fontFamily: 'Montserrat, sans-serif',
                  fontSize: '14px',
                  padding: '16px 20px',
                  borderRadius: '4px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          )}

          <div className="profilelabel">
            <label>CİNS</label>
            <CustomSelect
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              options={[
                { value: "Kişi", label: "Kişi" },
                { value: "Qadın", label: "Qadın" }
              ]}
              placeholder="Seçin"
            />
          </div>

          <div className="profilelabel">
            <label>GEYİM ÖLÇÜSÜ</label>
            <CustomSelect
              value={clothingSize}
              onChange={(e) => setClothingSize(e.target.value)}
              options={[
                { value: "S", label: "S" },
                { value: "M", label: "M" },
                { value: "L", label: "L" },
                { value: "XL", label: "XL" }
              ]}
              placeholder="Seçin"
            />
          </div>

          <div className="profilelabel">
            <label>BƏDƏN TİPİ</label>
            <CustomSelect
              value={bodyType}
              onChange={(e) => setBodyType(e.target.value)}
              options={[
                { value: "Arıq", label: "Arıq" },
                { value: "Normal", label: "Normal" },
                { value: "İdmançı", label: "İdmançı" },
                { value: "Kilolu", label: "Kilolu" }
              ]}
              placeholder="Seçin"
            />
          </div>

          <div className="profilebtn">
            <button className="gold-btn-style" type='submit' disabled={loading} style={{ background: '#c9a96e', color: 'black', border: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontWeight: '500', letterSpacing: '1px', textTransform: 'uppercase', transition: 'background-color 0.3s' }}>
              {loading ? "Yadda saxlanılır..." : "Yadda Saxla"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Profile
