import React, { useEffect, useState } from 'react'
import { GoArrowRight } from "react-icons/go"
import axios from "axios"
import "./clothing.css"
import AOS from "aos"
import "aos/dist/aos.css"
import Avatar from '../Avatar/Avatar'
import { BASE_URL } from '../../pages/config'
import { useUser, useAuth } from '@clerk/clerk-react'

function Clothing() {
  const [products, setProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [loadingRecommendation, setLoadingRecommendation] = useState(false)

  const { isSignedIn } = useUser()
  const { getToken } = useAuth()

  useEffect(() => {
    async function getProducts() {
      if (!isSignedIn) return;
      try {
        const token = await getToken()
        const { data } = await axios.get(`${BASE_URL}/api/v1/products`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setProducts(data)
      } catch (error) {
        console.error("Məhsulları gətirmək mümkün olmadı:", error)
      }
    }
    getProducts()
  }, [isSignedIn, getToken])

  const handleTryOn = async (item) => {
    setSelectedProduct(item)
    setShowModal(true)
    setRecommendation(null)
    setLoadingRecommendation(true)

    if (!isSignedIn) {
      setLoadingRecommendation(false)
      return
    }

    try {
      const token = await getToken()
      const { data } = await axios.get(`${BASE_URL}/api/v1/products/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setRecommendation(data.sizeRecommendation)
    } catch (error) {
      console.error("Ölçü tövsiyəsi alınarkən xəta:", error)
    } finally {
      setLoadingRecommendation(false)
    }
  }

  useEffect(() => {
    AOS.init({
      duration: 1000,  
      once: false,     
      mirror: true      
    })
  }, [])

  if (!isSignedIn) {
    return (
      <div className="login-prompt-container">
        <h2>Ağıllı Ölçü Analizi Üçün Giriş Edin</h2>
        <p>Geyimlərin sizə uyğunluq dərəcəsini görmək üçün hesabınıza daxil olun.</p>
        <a href="/login" className="login-prompt-btn">Daxil Ol</a>
      </div>
    )
  }

  return (
    <div className="cothingcontainer">
      <div data-aos="fade-up" className="box">
        <h1>Geyimlər</h1>
        <div className="cothingboxcontainer">
          {products.map(item => {
            return (
              <div key={item.id} className="cothingbox">
                <div className="cothingimg">
                  <img 
                    src={item.imageUrl || "https://gunnandmoore.playwiththebest.com/media/catalog/product/cache/ec4e4c8893a2305e77afd20d2909bacb/7/0/7047_teknik_slipover_white_1.png"} 
                    alt={item.name} 
                  />
                </div>
                <div className="cothingtext">
                  <div className="cothingtoptext">
                    <h3>{item.name}</h3>
                    <p className="brand-text">{item.brand}</p>
                    <p className="price-text">{item.price ? `${item.price} AZN` : "Qiymət təyin edilməyib"}</p>
                  </div>

                  <div className="cothingbtn">
                    {item.sizes && item.sizes.map(s => (
                      <button key={s.id}>{s.sizeName}</button>
                    ))}
                  </div>
                  
                  <div className="cothingbutton">
                    <button onClick={() => handleTryOn(item)}>
                      Sına <GoArrowRight />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {showModal && selectedProduct && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h2 className="modal-title">Ölçü və Uyğunluq Analizi</h2>
                <button 
                  className="modal-close"  
                  aria-label="Bağla"
                  onClick={() => setShowModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-left">
                  <Avatar
                    topColor="#4A90C2"        
                    bottomColor="#A0A0A0"                    
                    skinColor="#d4b896"                     
                    size={180}                               
                  />
                  <div className="score">
                    <div className="score-number">
                      {loadingRecommendation ? "..." : recommendation ? `${recommendation.matchPercentage}%` : "0%"}
                    </div>
                    <div className="score-label">
                      {recommendation && recommendation.matchPercentage > 0 ? "UYĞUNDUR" : "UYĞUN DEYİL"}
                    </div>
                  </div>
                </div>

                <div className="modal-right">
                  <h3 className="product-title">{selectedProduct.name}</h3>
                  <p className="product-brand">{selectedProduct.brand} • {selectedProduct.category}</p>

                  <div className="filter-buttons" style={{ marginTop: '10px' }}>
                    <span className="price-badge">{selectedProduct.price ? `${selectedProduct.price} AZN` : ""}</span>
                  </div>

                  <div className="section" style={{ marginTop: '20px' }}>
                    <div className="section-label">AĞILLI ÖLÇÜ TÖVSİYƏSİ</div>
                    <div className="recommendation" style={{ color: '#c9a96e', fontSize: '18px', lineHeight: '1.6' }}>
                      {loadingRecommendation 
                        ? "Analiz edilir..." 
                        : recommendation 
                          ? recommendation.feedbackMessage 
                          : "Ölçü hesablana bilmədi. Zəhmət olmasa profilinizdə ölçüləri daxil etdiyinizdən əmin olun."}
                    </div>
                  </div>

                  {selectedProduct.contactLink && (
                    <div className="section" style={{ marginTop: '20px' }}>
                      <a 
                        href={selectedProduct.contactLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="contact-seller-btn"
                        style={{
                          display: 'inline-block',
                          backgroundColor: '#c9a96e',
                          color: 'black',
                          textDecoration: 'none',
                          padding: '12px 24px',
                          fontWeight: 'bold',
                          borderRadius: '4px',
                          textAlign: 'center',
                          marginTop: '10px',
                          transition: 'background-color 0.3s'
                        }}
                      >
                        Sifariş Et (Butik DM)
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Clothing
