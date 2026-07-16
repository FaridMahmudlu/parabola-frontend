import React, { useEffect, useState } from 'react'
import { GoArrowRight } from "react-icons/go"
import axios from "axios"
import "./clothing.css"
import AOS from "aos"
import "aos/dist/aos.css"
import Avatar from '../Avatar/Avatar'
import { BASE_URL } from '../../pages/config'
import { useUser, useAuth } from '@clerk/clerk-react'
import { FiChevronLeft, FiChevronRight, FiMaximize2, FiX, FiLock } from 'react-icons/fi'
import { Link } from 'react-router-dom'

function Clothing() {
  const [products, setProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [loadingRecommendation, setLoadingRecommendation] = useState(false)

  // Carousel & Zoom states
  const [activeImageIndexes, setActiveImageIndexes] = useState({}) // productCardId -> activeImageIndex
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [zoomImage, setZoomImage] = useState(null)

  const { isSignedIn } = useUser()
  const { getToken } = useAuth()

  useEffect(() => {
    async function getProducts() {
      try {
        // Load cached products first inside try-catch to avoid crashes
        const cached = localStorage.getItem("parabola_catalog_products")
        if (cached) {
          try {
            setProducts(JSON.parse(cached))
          } catch (e) {
            localStorage.removeItem("parabola_catalog_products")
          }
        }

        const headers = {}
        if (isSignedIn) {
          const token = await getToken()
          headers.Authorization = `Bearer ${token}`
        }
        const { data } = await axios.get(`${BASE_URL}/api/v1/products`, { headers })
        setProducts(data)
        // Update cache
        localStorage.setItem("parabola_catalog_products", JSON.stringify(data))
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
    setModalImageIndex(0)
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

  // Card list carousel handlers
  const handlePrevImage = (e, item) => {
    e.stopPropagation()
    const imgs = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : [item.imageUrl].filter(Boolean)
    const currentIndex = activeImageIndexes[item.id] || 0
    const nextIndex = (currentIndex - 1 + imgs.length) % imgs.length
    setActiveImageIndexes(prev => ({ ...prev, [item.id]: nextIndex }))
  }

  const handleNextImage = (e, item) => {
    e.stopPropagation()
    const imgs = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : [item.imageUrl].filter(Boolean)
    const currentIndex = activeImageIndexes[item.id] || 0
    const nextIndex = (currentIndex + 1) % imgs.length
    setActiveImageIndexes(prev => ({ ...prev, [item.id]: nextIndex }))
  }

  // Modal carousel handlers
  const getModalImages = () => {
    if (!selectedProduct) return []
    return selectedProduct.imageUrls && selectedProduct.imageUrls.length > 0
      ? selectedProduct.imageUrls
      : [selectedProduct.imageUrl].filter(Boolean)
  }

  const handleModalPrevImage = () => {
    const imgs = getModalImages()
    setModalImageIndex(prev => (prev - 1 + imgs.length) % imgs.length)
  }

  const handleModalNextImage = () => {
    const imgs = getModalImages()
    setModalImageIndex(prev => (prev + 1) % imgs.length)
  }

  useEffect(() => {
    AOS.init({
      duration: 1000,  
      once: false,     
      mirror: true      
    })
  }, [])

  return (
    <div className="cothingcontainer">
      <div data-aos="fade-up" className="box">
        <h1>Geyimlər</h1>
        <div style={{ position: 'relative' }}>
          <div 
            className="cothingboxcontainer"
            style={!isSignedIn ? { filter: 'blur(10px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.5 } : {}}
          >
            {products.map(item => {
              const cardImages = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : [item.imageUrl].filter(Boolean)
              const activeIdx = activeImageIndexes[item.id] || 0
              const activeImg = cardImages[activeIdx] || "https://gunnandmoore.playwiththebest.com/media/catalog/product/cache/ec4e4c8893a2305e77afd20d2909bacb/7/0/7047_teknik_slipover_white_1.png"
              const isPng = activeImg.toLowerCase().split('?')[0].endsWith('.png')

              return (
                <div key={item.id} className="cothingbox">
                  <div className="cothingimg" style={{ position: 'relative' }}>
                    <img 
                      key={activeImg}
                      src={activeImg} 
                      alt={item.name} 
                      onClick={() => handleTryOn(item)}
                      style={{ 
                        cursor: 'pointer',
                        objectFit: isPng ? 'contain' : 'cover',
                        padding: isPng ? '16px' : '0',
                        boxSizing: 'border-box'
                      }}
                    />
                    {cardImages.length > 1 && (
                      <>
                        <button className="slider-arrow prev" onClick={(e) => handlePrevImage(e, item)}>
                          <FiChevronLeft />
                        </button>
                        <button className="slider-arrow next" onClick={(e) => handleNextImage(e, item)}>
                          <FiChevronRight />
                        </button>
                        <div className="slider-indicators">
                          {cardImages.map((_, idx) => (
                            <span 
                              key={idx} 
                              className={`indicator-dot ${activeIdx === idx ? 'active' : ''}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <div className="cothingtext">
                    <div className="cothingtoptext">
                      <h3>{item.name}</h3>
                      <p className="brand-text">{item.brand}</p>
                      <p className="price-text">{item.price ? `${item.price} AZN` : "Qiymət təyin edilməyib"}</p>
                      {item.sellerName && (
                        <p className="seller-text">Satıcı: {item.sellerName}</p>
                      )}
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

          {!isSignedIn && (
            <div className="catalog-locked-overlay">
              <div className="catalog-locked-content">
                <FiLock className="locked-icon" />
                <h2>Kataloqu görmək üçün daxil olun</h2>
                <p>Məhsulları incələmək və bədən ölçünüzə uyğunluğunu yoxlamaq üçün hesaba daxil olmalısınız.</p>
                <div className="locked-auth-buttons">
                  <Link to="/login" className="btn-locked-login">Daxil Ol</Link>
                  <Link to="/register" className="btn-locked-register">Qeydiyyat</Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Try On / Modal */}
        {showModal && selectedProduct && (
          <div className="modal-overlay">
            <div className="modal-container">
              <div className="modal-header">
                <h2 className="modal-title">Geyim Detalları və Ölçü Analizi</h2>
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
                  {/* Image Viewer inside modal with Zoom and Slider */}
                  <div className="modal-image-viewer" style={{ position: 'relative', width: '100%', height: '280px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #1f1f1f', background: '#0e0e0e' }}>
                    <img 
                      src={getModalImages()[modalImageIndex] || "https://gunnandmoore.playwiththebest.com/media/catalog/product/cache/ec4e4c8893a2305e77afd20d2909bacb/7/0/7047_teknik_slipover_white_1.png"}
                      alt={selectedProduct.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'zoom-in' }}
                      onClick={() => setZoomImage(getModalImages()[modalImageIndex])}
                    />
                    <button className="zoom-btn" onClick={() => setZoomImage(getModalImages()[modalImageIndex])} title="Böyütmək üçün klikləyin" style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.7)', border: 'none', color: 'white', padding: '8px', borderRadius: '4px', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <FiMaximize2 />
                    </button>
                    {getModalImages().length > 1 && (
                      <>
                        <button className="slider-arrow prev" onClick={handleModalPrevImage} style={{ opacity: 1 }}>
                          <FiChevronLeft />
                        </button>
                        <button className="slider-arrow next" onClick={handleModalNextImage} style={{ opacity: 1 }}>
                          <FiChevronRight />
                        </button>
                      </>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', width: '100%', justifyContent: 'space-between', marginTop: '10px' }}>
                    <Avatar
                      topColor="#4A90C2"        
                      bottomColor="#A0A0A0"                    
                      skinColor="#d4b896"                     
                      size={130}                               
                    />
                    <div className="score" style={{ flexGrow: 1 }}>
                      <div className="score-number" style={{ fontSize: '32px' }}>
                        {!isSignedIn ? "?" : loadingRecommendation ? "..." : recommendation ? `${recommendation.matchPercentage}%` : "0%"}
                      </div>
                      <div className="score-label" style={{ fontSize: '12px' }}>
                        {!isSignedIn ? "Daxil olun" : (recommendation && recommendation.matchPercentage > 0 ? "UYĞUNDUR" : "UYĞUN DEYİL")}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="modal-right">
                  <h3 className="product-title" style={{ fontSize: '28px' }}>{selectedProduct.name}</h3>
                  <p className="product-brand" style={{ fontSize: '13px', color: '#7a7570' }}>
                    {selectedProduct.brand} • {selectedProduct.category} {selectedProduct.sellerName && `• Satıcı: ${selectedProduct.sellerName}`}
                  </p>

                  <div className="filter-buttons" style={{ marginTop: '10px' }}>
                    <span className="price-badge" style={{ padding: '8px 16px', fontSize: '16px' }}>{selectedProduct.price ? `${selectedProduct.price} AZN` : ""}</span>
                  </div>

                  {/* Product Specification Grid */}
                  <div className="product-spec-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px', padding: '12px', border: '1px solid #1f1f1f', borderRadius: '4px', background: '#070707' }}>
                    <div style={{ fontSize: '12px' }}><span style={{ color: '#7a7570' }}>Cins:</span> <span style={{ color: 'white' }}>{selectedProduct.gender || "Təyin edilməyib"}</span></div>
                    <div style={{ fontSize: '12px' }}><span style={{ color: '#7a7570' }}>Stil:</span> <span style={{ color: 'white' }}>{selectedProduct.style || "Təyin edilməyib"}</span></div>
                    <div style={{ fontSize: '12px' }}><span style={{ color: '#7a7570' }}>Rəng:</span> <span style={{ color: 'white' }}>{selectedProduct.color || "Təyin edilməyib"}</span></div>
                    <div style={{ fontSize: '12px' }}><span style={{ color: '#7a7570' }}>Kateqoriya:</span> <span style={{ color: 'white' }}>{selectedProduct.category || "Təyin edilməyib"}</span></div>
                  </div>

                  {selectedProduct.description && (
                    <div className="section" style={{ marginTop: '20px' }}>
                      <div className="section-label" style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#7a7570' }}>GEYİM HAQQINDA</div>
                      <p style={{ color: '#b0adaa', fontSize: '13px', lineHeight: '1.6', marginTop: '5px' }}>{selectedProduct.description}</p>
                    </div>
                  )}

                  <div className="section" style={{ marginTop: '20px' }}>
                    <div className="section-label">AĞILLI ÖLÇÜ TÖVSİYƏSİ</div>
                    <div className="recommendation" style={{ color: '#c9a96e', fontSize: '16px', lineHeight: '1.6', marginTop: '5px' }}>
                      {!isSignedIn ? (
                        <span>
                          Ağıllı ölçü hesablama və uyğunluq analizi üçün zəhmət olmasa <a href="/login" style={{ color: '#c9a96e', textDecoration: 'underline' }}>Daxil Olun</a>.
                        </span>
                      ) : (
                        loadingRecommendation 
                          ? "Analiz edilir..." 
                          : recommendation 
                            ? recommendation.feedbackMessage 
                            : "Ölçü hesablana bilmədi. Zəhmət olmasa profilinizdə ölçüləri daxil etdiyinizdən əmin olun."
                      )}
                    </div>
                  </div>

                  {/* Geyim Kəsimi və Manken Uyğunluğu */}
                  {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                    <div className="section" style={{ marginTop: '20px' }}>
                      <div className="section-label" style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#7a7570' }}>GEYİM KƏSİMİ VƏ ÖLÇÜ DETALLARI</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                        {selectedProduct.sizes.map(s => (
                          <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderBottom: '1px solid #1a1a1a', paddingBottom: '6px' }}>
                            <span style={{ color: '#c9a96e', fontWeight: '500' }}>{s.sizeName} Ölçüsü</span>
                            <span style={{ color: '#888' }}>
                              Kəsim (Fit): {s.clothingFit || 'Standart'} • Manken Tipi: {s.modelBodyType || 'Normal'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProduct.contactLink && (
                    <div className="section" style={{ marginTop: '20px' }}>
                      <a 
                        href={selectedProduct.contactLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="contact-seller-btn"
                        style={{
                          display: 'block',
                          backgroundColor: '#c9a96e',
                          color: 'black',
                          textDecoration: 'none',
                          padding: '14px 24px',
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

        {/* Zoom Lightbox fullscreen overlay */}
        {zoomImage && (
          <div className="zoom-lightbox-overlay" onClick={() => setZoomImage(null)} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', animation: 'fadeIn 0.25s ease-out' }}>
            <button className="lightbox-close" onClick={() => setZoomImage(null)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'white', fontSize: '32px', cursor: 'pointer' }}>
              <FiX />
            </button>
            <img 
              src={zoomImage} 
              alt="Böyüdülmüş baxış" 
              style={{ maxWidth: '90%', maxHeight: '90%', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', transition: 'transform 0.3s' }} 
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Clothing
