import { notification } from 'antd'
import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import "./profile.css"
import axios from 'axios'
import { BASE_URL } from '../config'

const Profile = () => {
  const { user } = useSelector((state) => state.auth)

  const [height, setHeight] = useState("")
  const [weight, setWeight] = useState("")
  const [chest, setChest] = useState("")
  const [armLength, setArmLength] = useState("")
  const [waist, setWaist] = useState("")
  const [shoulder, setShoulder] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [savedData, setSavedData] = useState(null)

  useEffect(() => {
    if (user && user.token) {
      const fetchProfile = async () => {
        try {
          const { data } = await axios.get(`${BASE_URL}/api/v1/users/profile`, {
            headers: { Authorization: `Bearer ${user.token}` }
          })
          if (data) {
            setHeight(data.height || "")
            setWeight(data.weight || "")
            setChest(data.chest || "")
            setArmLength(data.armLength || "")
            setWaist(data.waist || "")
            setShoulder(data.shoulder || "")
            
            if (data.height && data.weight && data.chest) {
              setSavedData(data)
            }
          }
        } catch (error) {
          console.error("Profil məlumatları yüklənmədi:", error)
        }
      }
      fetchProfile()
    }
  }, [user])

  if (!user) {
    return <Navigate to="/login" />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const payload = {
      height: parseFloat(height),
      weight: parseFloat(weight),
      chest: parseFloat(chest),
      armLength: parseFloat(armLength),
      waist: parseFloat(waist),
      shoulder: parseFloat(shoulder)
    }

    try {
      const { data } = await axios.put(
        `${BASE_URL}/api/v1/users/profile`,
        payload,
        { headers: { Authorization: `Bearer ${user.token}` } }
      )
      setSavedData(payload)
      notification.success({
        message: "Məlumat yadda saxlanıldı",
        description: data || "Profil bədən ölçüləriniz uğurla yeniləndi!"
      })
    } catch (error) {
      const errMsg = error.response?.data?.message || error.response?.data || error.message;
      notification.error({
        message: "Xəta baş verdi",
        description: typeof errMsg === 'string' ? errMsg : "Ölçülər yenilənə bilmədi. Zəhmət olmasa parametrləri düzgün daxil edin!"
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
          <h2>Profilim və Bədən Ölçülərim</h2>
          <p>Məlumatlarınız ağıllı ölçü uyğunluğu alqoritmində istifadə edilir.</p>
        </div>

        {savedData && (
          <div className="user-infos">
            <h3>Saxlanılmış ölçülər</h3>
            <div className="user-info-text">
              <div className="infotextone">
                <div className="sizetext">
                  <p>Boy</p>
                  <p>{savedData.height} sm</p>
                </div>
                <div className="sizetext">
                  <p>Çəki</p>
                  <p>{savedData.weight} kq</p>
                </div>
                <div className="sizetext">
                  <p>Sinə</p>
                  <p>{savedData.chest} sm</p>
                </div>
              </div>
              <div className="infotextone">
                <div className="sizetext">
                  <p>Qol uzunluğu</p>
                  <p>{savedData.armLength} sm</p>
                </div>
                <div className="sizetext">
                  <p>Bel</p>
                  <p>{savedData.waist} sm</p>
                </div>
                <div className="sizetext">
                  <p>Çiyin</p>
                  <p>{savedData.shoulder} sm</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <form className='profileform' onSubmit={handleSubmit}>
          <div className="profilelabel">
            <label htmlFor="height">Boy (sm)</label>
            <input 
              type="number" 
              id="height" 
              value={height} 
              onChange={(e) => setHeight(e.target.value)} 
              placeholder="Boyunuzu daxil edin (sm)" 
              min="50"
              required 
            />
          </div>

          <div className="profilelabel">
            <label htmlFor="weight">Çəki (kq)</label>
            <input 
              type="number" 
              id="weight" 
              value={weight} 
              onChange={(e) => setWeight(e.target.value)} 
              placeholder="Çəkinizi daxil edin (kq)" 
              min="30"
              required 
            />
          </div>

          <div className="profilelabel">
            <label htmlFor="chest">Sinə genişliyi (sm)</label>
            <input 
              type="number" 
              id="chest" 
              value={chest} 
              onChange={(e) => setChest(e.target.value)} 
              placeholder="Sinə ölçünüzü daxil edin (sm)" 
              min="40"
              required 
            />
          </div>

          <div className="profilelabel">
            <label htmlFor="armLength">Qol uzunluğu (sm)</label>
            <input 
              type="number" 
              id="armLength" 
              value={armLength} 
              onChange={(e) => setArmLength(e.target.value)} 
              placeholder="Qol uzunluğunuzu daxil edin (sm)" 
              min="30"
              required 
            />
          </div>

          <div className="profilelabel">
            <label htmlFor="waist">Bel ölçüsü (sm)</label>
            <input 
              type="number" 
              id="waist" 
              value={waist} 
              onChange={(e) => setWaist(e.target.value)} 
              placeholder="Bel ölçünüzü daxil edin (sm)" 
              min="40"
              required 
            />
          </div>

          <div className="profilelabel">
            <label htmlFor="shoulder">Çiyin genişliyi (sm)</label>
            <input 
              type="number" 
              id="shoulder" 
              value={shoulder} 
              onChange={(e) => setShoulder(e.target.value)} 
              placeholder="Çiyin genişliyinizi daxil edin (sm)" 
              min="30"
              required 
            />
          </div>

          <div className="profilebtn">
            <button type='submit' disabled={loading}>
              {loading ? "Yadda saxlanılır..." : "Yadda Saxla"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Profile
