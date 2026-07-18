import React, { useEffect, useState } from 'react'
import { GoArrowRight } from "react-icons/go"
import axios from "axios"
import "./clothing.css"
import AOS from "aos"
import "aos/dist/aos.css"
import { BASE_URL } from '../../pages/config'
import { useUser, useAuth } from '@clerk/clerk-react'
import { notification } from 'antd'
import { FiChevronLeft, FiChevronRight, FiMaximize2, FiX, FiLock } from 'react-icons/fi'
import { FaWhatsapp, FaInstagram, FaTiktok, FaPhone } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { trackTryOnOpen, trackTryOnCalculate, trackContactClick } from '../../utils/analytics'

function Clothing() {
  const [products, setProducts] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [loadingRecommendation, setLoadingRecommendation] = useState(false)
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [imageOpacity, setImageOpacity] = useState(1)

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
    trackTryOnOpen(item)

    // Set default size
    if (item.sizes && item.sizes.length > 0) {
      setSelectedSize(item.sizes[0].sizeName);
    } else {
      setSelectedSize("");
    }

    // Set default color
    if (item.color) {
      const cols = item.color.split(",");
      setSelectedColor(cols[0].trim());
    } else {
      setSelectedColor("");
    }

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
      if (data.sizeRecommendation) {
        if (data.sizeRecommendation.recommendedSizeName) {
          setSelectedSize(data.sizeRecommendation.recommendedSizeName);
        }
        trackTryOnCalculate(item, {
          gender: data.sizeRecommendation.gender || "",
          clothingSize: data.sizeRecommendation.clothingSize || "",
          bodyType: data.sizeRecommendation.bodyType || "",
        }, data.sizeRecommendation.matchPercentage || 0)
      }
    } catch (error) {
      console.error("Ölçü tövsiyəsi alınarkən xəta:", error)
    } finally {
      setLoadingRecommendation(false)
    }
  }

  // Touch swipe coordinates and handlers
  let touchStartX = 0;

  const handleTouchStart = (e) => {
    touchStartX = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = (e, item) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNextImage(e, item);
      } else {
        handlePrevImage(e, item);
      }
    }
  };

  const handleModalTouchEnd = (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleModalNextImage();
      } else {
        handleModalPrevImage();
      }
    }
  };

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
    setImageOpacity(0);
    setTimeout(() => {
      const imgs = getModalImages()
      setModalImageIndex(prev => (prev - 1 + imgs.length) % imgs.length)
      setImageOpacity(1);
    }, 200);
  }

  const handleModalNextImage = () => {
    setImageOpacity(0);
    setTimeout(() => {
      const imgs = getModalImages()
      setModalImageIndex(prev => (prev + 1) % imgs.length)
      setImageOpacity(1);
    }, 200);
  }

  const handleOrderMessage = (platform) => {
    trackContactClick(selectedProduct, platform, selectedSize, selectedColor);
    const message = `Salam! Parabola vebsaytından bu məhsul ilə maraqlanıram:\n\n` +
                    `- Məhsul: ${selectedProduct.name}\n` +
                    `- Brend: ${selectedProduct.brand}\n` +
                    `- Kateqoriya: ${selectedProduct.category}\n` +
                    `- Ölçü: ${selectedSize || 'Seçilməyib'}\n` +
                    `- Rəng: ${selectedColor || 'Seçilməyib'}\n` +
                    `- Qiymət: ${selectedProduct.price ? selectedProduct.price + ' AZN' : 'Təyin edilməyib'}\n\n` +
                    `Bu məhsulu sifariş etmək istəyirəm.`;
    
    if (platform === 'whatsapp') {
      const whatsappNumber = selectedProduct.contactPhone.replace(/\D/g, "");
      window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      // Copy to clipboard
      navigator.clipboard.writeText(message);
      notification.success({
        message: "Məlumat Kopyalandı",
        description: "Məhsul haqqında detallı sifariş mətni kopyalandı! Satıcıya mesaj bölməsində birbaşa yapışdıraraq (paste) göndərə bilərsiniz."
      });
      if (selectedProduct.contactLink) {
        window.open(selectedProduct.contactLink, '_blank');
      }
    }
  };

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
        <h2>Geyimlər</h2>
        <div style={{ position: 'relative' }}>
          <div 
            className="cothingboxcontainer"
            style={!isSignedIn ? { filter: 'blur(10px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.5 } : {}}
          >
            {products.map((item, index) => {
              const cardImages = item.imageUrls && item.imageUrls.length > 0 ? item.imageUrls : [item.imageUrl].filter(Boolean)
              const activeIdx = activeImageIndexes[item.id] || 0
              const activeImg = cardImages[activeIdx] || "https://gunnandmoore.playwiththebest.com/media/catalog/product/cache/ec4e4c8893a2305e77afd20d2909bacb/7/0/7047_teknik_slipover_white_1.png"
              const isPng = activeImg.toLowerCase().split('?')[0].endsWith('.png')
              const isLcp = index < 2;

              return (
                <div key={item.id} className="cothingbox">
                  <div 
                    className="cothingimg" 
                    style={{ position: 'relative' }}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={(e) => handleTouchEnd(e, item)}
                  >
                    <img 
                      key={activeImg}
                      src={activeImg} 
                      alt={item.name} 
                      onClick={() => handleTryOn(item)}
                      fetchPriority={isLcp ? "high" : undefined}
                      loading={isLcp ? "eager" : "lazy"}
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
                  <div 
                    className="modal-image-viewer" 
                    style={{ position: 'relative', width: '100%', height: '280px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #1f1f1f', background: '#0e0e0e' }}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleModalTouchEnd}
                  >
                    <img 
                      src={getModalImages()[modalImageIndex] || "https://gunnandmoore.playwiththebest.com/media/catalog/product/cache/ec4e4c8893a2305e77afd20d2909bacb/7/0/7047_teknik_slipover_white_1.png"}
                      alt={selectedProduct.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'zoom-in', opacity: imageOpacity }}
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
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px', width: '100%', justifyContent: 'space-between', padding: '16px', background: '#090909', border: '1px solid #1a1a1a', borderRadius: '4px' }}>
                    <div style={{ position: 'relative', width: '90px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="90" height="90" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="50" cy="50" r="40" stroke="#141414" strokeWidth="8" fill="transparent" />
                        <circle cx="50" cy="50" r="40" stroke="#c9a96e" strokeWidth="8" fill="transparent" 
                                strokeDasharray="251.2" 
                                strokeDashoffset={251.2 - (251.2 * (!isSignedIn ? 0 : (recommendation ? recommendation.matchPercentage : 0))) / 100}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.8s ease-in-out', filter: 'drop-shadow(0 0 4px rgba(201, 169, 110, 0.4))' }} />
                      </svg>
                      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#c9a96e', fontFamily: 'Montserrat, sans-serif' }}>
                          {!isSignedIn ? "?" : (loadingRecommendation ? "..." : (recommendation ? `${recommendation.matchPercentage}%` : "0%"))}
                        </span>
                      </div>
                    </div>
                    <div className="score" style={{ flexGrow: 1 }}>
                      <div className="score-label" style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#7a7570', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Ağıllı Uyğunluq
                      </div>
                      <div className="score-status" style={{ fontSize: '16px', fontWeight: '500', color: !isSignedIn ? '#7a7570' : (recommendation && recommendation.matchPercentage > 75 ? '#c9a96e' : '#f0ece4'), fontFamily: 'Cormorant Garamond, serif', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {!isSignedIn ? "Daxil olun" : (loadingRecommendation ? "Hesablanır..." : (recommendation && recommendation.matchPercentage > 0 ? "Bədəninizə Uyğundur" : "Tam Uyğun Deyil"))}
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

                  {/* Size Selector Swatches */}
                  {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                    <div className="section" style={{ marginTop: '20px' }}>
                      <div className="section-label" style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#7a7570' }}>ÖLÇÜ SEÇİN</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {selectedProduct.sizes
                          .filter((value, index, self) => self.findIndex(t => t.sizeName === value.sizeName) === index)
                          .map(s => (
                            <button 
                              key={s.id}
                              onClick={() => setSelectedSize(s.sizeName)}
                              style={{
                                background: selectedSize === s.sizeName ? '#c9a96e' : '#141414',
                                color: selectedSize === s.sizeName ? 'black' : '#f0ece4',
                                border: '1px solid #1f1f1f',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontFamily: 'Montserrat, sans-serif',
                                fontSize: '12px',
                                fontWeight: '600',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {s.sizeName}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Color Selector Swatches */}
                  {selectedProduct.color && (
                    <div className="section" style={{ marginTop: '20px' }}>
                      <div className="section-label" style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#7a7570' }}>RƏNG SEÇİN</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {selectedProduct.color.split(",").map(c => {
                          const colorName = c.trim();
                          const isSelected = selectedColor === colorName;
                          return (
                            <button 
                              key={colorName}
                              onClick={() => setSelectedColor(colorName)}
                              style={{
                                background: isSelected ? '#c9a96e' : '#141414',
                                color: isSelected ? 'black' : '#f0ece4',
                                border: '1px solid #1f1f1f',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontFamily: 'Montserrat, sans-serif',
                                fontSize: '12px',
                                fontWeight: '600',
                                transition: 'all 0.2s ease'
                              }}
                            >
                              {colorName}
                            </button>
                          );
                        })}
                      </div>
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
                        {selectedProduct.sizes
                          .filter((value, index, self) => self.findIndex(t => t.sizeName === value.sizeName) === index)
                          .map(s => (
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

                  {(selectedProduct.contactPhone || selectedProduct.contactLink) && (
                    <div className="section" style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div className="section-label" style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#7a7570' }}>SİFARİŞ VƏ ƏLAQƏ</div>
                      {selectedProduct.contactPhone && (
                        <button 
                          onClick={() => handleOrderMessage('whatsapp')}
                          className="contact-seller-btn whatsapp-btn"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            border: 'none',
                            color: 'white',
                            textDecoration: 'none',
                            padding: '14px 24px',
                            fontWeight: 'bold',
                            borderRadius: '4px',
                            textAlign: 'center',
                            fontSize: '14px',
                            fontFamily: 'Montserrat, sans-serif',
                            cursor: 'pointer',
                            width: '100%'
                          }}
                        >
                          <FaWhatsapp style={{ fontSize: '18px' }} /> WhatsApp ilə Sifariş
                        </button>
                      )}
                      {selectedProduct.contactLink && (
                        <button 
                          onClick={() => handleOrderMessage('social')}
                          className={`contact-seller-btn ${selectedProduct.contactLink.toLowerCase().includes('tiktok') ? 'tiktok-btn' : 'instagram-btn'}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            border: 'none',
                            color: 'white',
                            textDecoration: 'none',
                            padding: '14px 24px',
                            fontWeight: 'bold',
                            borderRadius: '4px',
                            textAlign: 'center',
                            fontSize: '14px',
                            fontFamily: 'Montserrat, sans-serif',
                            cursor: 'pointer',
                            width: '100%'
                          }}
                        >
                          {selectedProduct.contactLink.toLowerCase().includes('tiktok') ? (
                            <FaTiktok style={{ fontSize: '16px' }} />
                          ) : (
                            <FaInstagram style={{ fontSize: '18px' }} />
                          )}
                          Sosial Media (Butik DM)
                        </button>
                      )}
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
