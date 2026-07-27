import React, { useEffect, useState } from 'react'
import { GoArrowRight } from "react-icons/go"
import axios from "axios"
import "./clothing.css"
import AOS from "aos"
import "aos/dist/aos.css"
import { BASE_URL } from '../../pages/config'
import { useUser, useAuth } from '@clerk/clerk-react'
import { notification } from 'antd'
import { FiChevronLeft, FiChevronRight, FiMaximize2, FiX } from 'react-icons/fi'
import { FaWhatsapp, FaInstagram, FaTiktok } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import { trackTryOnOpen, trackTryOnCalculate, trackContactClick } from '../../utils/analytics'

const getSortedUniqueSizes = (sizes) => {
  if (!sizes) return [];
  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
  
  // Deduplicate by sizeName
  const uniqueMap = {};
  sizes.forEach(s => {
    if (s && s.sizeName) {
      uniqueMap[s.sizeName.toUpperCase()] = s;
    }
  });
  
  // Convert to array and sort according to sizeOrder index
  return Object.values(uniqueMap).sort((a, b) => {
    const indexA = sizeOrder.indexOf(a.sizeName.toUpperCase());
    const indexB = sizeOrder.indexOf(b.sizeName.toUpperCase());
    
    const valA = indexA === -1 ? 999 : indexA;
    const valB = indexB === -1 ? 999 : indexB;
    return valA - valB;
  });
};

const formatSellerName = (sellerName) => {
  if (!sellerName) return "";
  const nameStr = String(sellerName).trim();
  if (nameStr.toLowerCase().includes("mleykmahmudlu")) {
    return "Parabola Admin";
  }
  return nameStr;
};

function Clothing() {
  const navigate = useNavigate()
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
  const modalRef = React.useRef(null)

  const { isSignedIn, user } = useUser()
  const { getToken } = useAuth()

  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
      if (modalRef.current) {
        modalRef.current.scrollTop = 0;
      }
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showModal]);

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

        const userEmailHeader = user?.primaryEmailAddress?.emailAddress || "";
        const clerkRoleHeader = user?.publicMetadata?.role || "";
        const headers = {
          ...(userEmailHeader ? { "X-Clerk-User-Email": userEmailHeader } : {}),
          ...(clerkRoleHeader ? { "X-Clerk-Role": clerkRoleHeader } : {})
        }
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
  }, [isSignedIn, getToken, user])

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
      const userEmailHeader = user?.primaryEmailAddress?.emailAddress || "";
      const clerkRoleHeader = user?.publicMetadata?.role || "";
      const { data } = await axios.get(`${BASE_URL}/api/v1/products/${item.id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          ...(userEmailHeader ? { "X-Clerk-User-Email": userEmailHeader } : {}),
          ...(clerkRoleHeader ? { "X-Clerk-Role": clerkRoleHeader } : {})
        }
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

  const matchPct = recommendation ? recommendation.matchPercentage : 0;
  const strokeDash = 251.2;
  const strokeOffset = strokeDash - (strokeDash * (isSignedIn ? matchPct : 0)) / 100;

  return (
    <div className="cothingcontainer">
      <div data-aos="fade-up" className="box">
        <h2>Geyimlər</h2>
        <div>
          <div className="cothingboxcontainer">
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
                        <p className="seller-text">Satıcı: {formatSellerName(item.sellerName)}</p>
                      )}
                    </div>

                    <div className="cothingbtn">
                      {getSortedUniqueSizes(item.sizes).map(s => (
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

        </div>

        {/* ====== PRODUCT DETAIL MODAL ====== */}
        {showModal && selectedProduct && (
          <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setShowModal(false); }}>
            <div className="modal-container" ref={modalRef}>

              {/* Sticky Header */}
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

                {/* === LEFT PANEL: Image + Score === */}
                <div className="modal-left">

                  {/* Image Viewer */}
                  <div 
                    className="modal-image-viewer"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleModalTouchEnd}
                  >
                    <img 
                      src={getModalImages()[modalImageIndex] || "https://gunnandmoore.playwiththebest.com/media/catalog/product/cache/ec4e4c8893a2305e77afd20d2909bacb/7/0/7047_teknik_slipover_white_1.png"}
                      alt={selectedProduct.name}
                      style={{ opacity: imageOpacity }}
                      onClick={() => setZoomImage(getModalImages()[modalImageIndex])}
                    />
                    <button 
                      className="zoom-btn" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const img = getModalImages()[modalImageIndex] || selectedProduct.imageUrl;
                        if (img) setZoomImage(img);
                      }} 
                      title="Böyütmək üçün klikləyin"
                    >
                      <FiMaximize2 size={15} />
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
                  
                  {/* Score Ring */}
                  <div className="score-ring-container" style={{
                    filter: !isSignedIn ? 'blur(5px)' : 'none',
                    pointerEvents: !isSignedIn ? 'none' : 'auto',
                    userSelect: !isSignedIn ? 'none' : 'auto'
                  }}>
                    <div className="score-ring-circle">
                      <svg width="64" height="64" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="50" cy="50" r="40" stroke="#141414" strokeWidth="8" fill="transparent" />
                        <circle cx="50" cy="50" r="40" stroke="#c9a96e" strokeWidth="8" fill="transparent" 
                                strokeDasharray={strokeDash} 
                                strokeDashoffset={strokeOffset}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.8s ease-in-out', filter: 'drop-shadow(0 0 4px rgba(201, 169, 110, 0.4))' }} />
                      </svg>
                      <span className="score-ring-value">
                        {!isSignedIn ? "?" : (loadingRecommendation ? "..." : `${matchPct}%`)}
                      </span>
                    </div>
                    <div className="score-ring-info">
                      <div className="score-ring-label">Ağıllı Uyğunluq</div>
                      <div className="score-ring-status" style={{
                        color: !isSignedIn ? '#7a7570' : (matchPct > 75 ? '#c9a96e' : '#f0ece4')
                      }}>
                        {!isSignedIn ? "Daxil olun" : (loadingRecommendation ? "Hesablanır..." : (matchPct > 0 ? "Bədəninizə Uyğundur" : "Tam Uyğun Deyil"))}
                      </div>
                    </div>
                  </div>

                  {/* Auth lock overlay for score */}
                  {!isSignedIn && (
                    <div className="auth-lock-overlay" style={{ position: 'relative', background: 'transparent', marginTop: '-76px', height: '68px' }}>
                      <span className="auth-lock-label">Uyğunluq faizini görmək üçün</span>
                      <div className="auth-lock-buttons">
                        <a href="/login" className="auth-lock-btn-primary">Daxil Ol</a>
                        <a href="/register" className="auth-lock-btn-secondary">Qeydiyyat</a>
                      </div>
                    </div>
                  )}
                </div>

                {/* === RIGHT PANEL: Product Details === */}
                <div className="modal-right">

                  {/* Title & Brand */}
                  <h3 className="product-title">{selectedProduct.name}</h3>
                  <p className="product-brand">
                    {selectedProduct.brand} • {selectedProduct.category} {selectedProduct.sellerName && `• Satıcı: ${formatSellerName(selectedProduct.sellerName)}`}
                  </p>

                  {/* Price */}
                  <div className="price-badge">
                    {selectedProduct.price ? `${selectedProduct.price} AZN` : ""}
                  </div>

                  {/* Spec Grid */}
                  <div className="product-spec-grid">
                    <div className="spec-item"><span className="spec-label">Cins:</span><span className="spec-value">{selectedProduct.gender || "Təyin edilməyib"}</span></div>
                    <div className="spec-item"><span className="spec-label">Stil:</span><span className="spec-value">{selectedProduct.style || "Təyin edilməyib"}</span></div>
                    <div className="spec-item"><span className="spec-label">Rəng:</span><span className="spec-value">{selectedProduct.color || "Təyin edilməyib"}</span></div>
                    <div className="spec-item"><span className="spec-label">Kateqoriya:</span><span className="spec-value">{selectedProduct.category || "Təyin edilməyib"}</span></div>
                  </div>

                  {/* Description */}
                  {selectedProduct.description && (
                    <div className="modal-section">
                      <div className="section-label">GEYİM HAQQINDA</div>
                      <p className="product-description">{selectedProduct.description}</p>
                    </div>
                  )}

                  {/* Size Selector */}
                  {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                    <div className="modal-section">
                      <div className="section-label">ÖLÇÜ SEÇİN</div>
                      <div className="size-color-grid">
                        {getSortedUniqueSizes(selectedProduct.sizes).map(s => (
                          <button 
                            key={s.id}
                            className={`size-color-btn ${selectedSize === s.sizeName ? 'active' : ''}`}
                            onClick={() => setSelectedSize(s.sizeName)}
                          >
                            {s.sizeName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Color Selector */}
                  {selectedProduct.color && (
                    <div className="modal-section">
                      <div className="section-label">RƏNG SEÇİN</div>
                      <div className="size-color-grid">
                        {selectedProduct.color.split(",").map(c => {
                          const colorName = c.trim();
                          return (
                            <button 
                              key={colorName}
                              className={`size-color-btn ${selectedColor === colorName ? 'active' : ''}`}
                              onClick={() => setSelectedColor(colorName)}
                            >
                              {colorName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Smart Size Recommendation */}
                  <div className="modal-section" style={{ position: 'relative', overflow: 'hidden', borderRadius: '4px' }}>
                    <div className="section-label">AĞILLI ÖLÇÜ TÖVSİYƏSİ</div>
                    <div 
                      className="recommendation" 
                      style={{ 
                        filter: !isSignedIn ? 'blur(5px)' : 'none',
                        pointerEvents: !isSignedIn ? 'none' : 'auto',
                        userSelect: !isSignedIn ? 'none' : 'auto',
                        minHeight: !isSignedIn ? '50px' : 'auto'
                      }}
                    >
                      {isSignedIn ? (
                        loadingRecommendation 
                          ? "Analiz edilir..." 
                          : recommendation 
                            ? recommendation.feedbackMessage 
                            : "Ölçü hesablana bilmədi. Zəhmət olmasa profilinizdə ölçüləri daxil etdiyinizdən əmin olun."
                      ) : (
                        "Bu geyimin bədən ölçülərinizə uyğun gəlib-gəlmədiyini və sizə ən uyğun olan geyim ölçüsünü öyrənmək üçün ağıllı tövsiyə sistemimizdən istifadə edin."
                      )}
                    </div>
                    {!isSignedIn && (
                      <div className="auth-lock-overlay">
                        <span className="auth-lock-label">Ölçü tövsiyəsini görmək üçün</span>
                        <div className="auth-lock-buttons">
                          <a href="/login" className="auth-lock-btn-primary">Daxil Ol</a>
                          <a href="/register" className="auth-lock-btn-secondary">Qeydiyyat</a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Size Details (Fit & Model) */}
                  {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                    <div className="modal-section">
                      <div className="section-label">GEYİM KƏSİMİ VƏ ÖLÇÜ DETALLARI</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                        {getSortedUniqueSizes(selectedProduct.sizes).map(s => (
                          <div key={s.id} className="size-detail-row">
                            <span className="size-detail-name">{s.sizeName} Ölçüsü</span>
                            <span className="size-detail-info">
                              Kəsim: {s.clothingFit || 'Standart'} • Manken: {s.modelBodyType || 'Normal'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Contact & Order Buttons */}
                  {(selectedProduct.contactPhone || selectedProduct.contactLink) && (
                    <div className="contact-section">
                      <div className="section-label">SİFARİŞ VƏ ƏLAQƏ</div>
                      {selectedProduct.contactPhone && (
                        <button 
                          onClick={() => handleOrderMessage('whatsapp')}
                          className="contact-seller-btn whatsapp-btn"
                        >
                          <FaWhatsapp size={18} /> WhatsApp ilə Sifariş
                        </button>
                      )}
                      {selectedProduct.contactLink && (
                        <button 
                          onClick={() => handleOrderMessage('social')}
                          className={`contact-seller-btn ${selectedProduct.contactLink.toLowerCase().includes('tiktok') ? 'tiktok-btn' : 'instagram-btn'}`}
                        >
                          {selectedProduct.contactLink.toLowerCase().includes('tiktok') ? (
                            <FaTiktok size={16} />
                          ) : (
                            <FaInstagram size={18} />
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

        {/* ====== ZOOM LIGHTBOX ====== */}
        {zoomImage && (
          <div 
            className="zoom-lightbox-overlay" 
            onClick={() => setZoomImage(null)} 
          >
            <button 
              className="lightbox-close" 
              onClick={(e) => { e.stopPropagation(); setZoomImage(null); }} 
              title="Bağla"
            >
              <FiX />
            </button>

            {getModalImages().length > 1 && (
              <>
                <button 
                  className="lightbox-nav-btn prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = (modalImageIndex - 1 + getModalImages().length) % getModalImages().length;
                    setModalImageIndex(newIndex);
                    setZoomImage(getModalImages()[newIndex]);
                  }}
                  title="Əvvəlki şəkil"
                >
                  <FiChevronLeft />
                </button>

                <button 
                  className="lightbox-nav-btn next"
                  onClick={(e) => {
                    e.stopPropagation();
                    const newIndex = (modalImageIndex + 1) % getModalImages().length;
                    setModalImageIndex(newIndex);
                    setZoomImage(getModalImages()[newIndex]);
                  }}
                  title="Növbəti şəkil"
                >
                  <FiChevronRight />
                </button>

                <div className="lightbox-counter">
                  {modalImageIndex + 1} / {getModalImages().length}
                </div>
              </>
            )}

            <img 
              className="lightbox-image"
              src={zoomImage} 
              alt="Böyüdülmüş baxış" 
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Clothing
