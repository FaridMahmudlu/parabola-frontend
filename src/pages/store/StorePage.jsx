import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { BASE_URL } from '../config'
import Header from '../../components/Header/Header'
import LoadingSpinner from '../../components/Loading/LoadingSpinner'
import { notification } from 'antd'
import { useUser, useAuth } from '@clerk/clerk-react'
import { createPortal } from 'react-dom'
import { 
  FiShoppingBag, FiPhone, FiCheckCircle, FiSearch, 
  FiArrowLeft, FiShare2, FiChevronLeft, FiChevronRight, 
  FiMaximize2, FiX, FiZoomIn, FiZoomOut, FiRefreshCw 
} from 'react-icons/fi'
import { FaWhatsapp, FaInstagram, FaTiktok } from 'react-icons/fa'
import { GoArrowRight } from "react-icons/go"
import './StorePage.css'
import '../../components/clothing/clothing.css'

const StorePage = () => {
  const { shopName } = useParams()
  const navigate = useNavigate()
  const { isSignedIn, isLoaded, user } = useUser()
  const { getToken } = useAuth()

  const [loading, setLoading] = useState(true)
  const [storeData, setStoreData] = useState(null)
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Hamısı')

  // Size Modal State
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [imageOpacity, setImageOpacity] = useState(1)
  const [sizeRecommendation, setSizeRecommendation] = useState(null)

  // Zoom Lightbox State
  const [zoomImage, setZoomImage] = useState(null)
  const [zoomScale, setZoomScale] = useState(1)
  const [zoomPan, setZoomPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [zoomOpacity, setZoomOpacity] = useState(1)

  const decodedShopName = shopName ? decodeURIComponent(shopName) : ''

  useEffect(() => {
    // Dynamic SEO & Document Title
    document.title = decodedShopName ? `${decodedShopName} - Parabola Butik Mağazası` : 'Parabola Store'
    
    const fetchStore = async () => {
      setLoading(true)
      try {
        let headers = {}
        if (isSignedIn) {
          try {
            const token = await getToken()
            if (token) headers['Authorization'] = `Bearer ${token}`
          } catch (e) {
            console.warn("Token alma xətası:", e)
          }
        }
        if (user && user.primaryEmailAddress?.emailAddress) {
          headers['X-Clerk-User-Email'] = user.primaryEmailAddress.emailAddress
        }

        const res = await axios.get(`${BASE_URL}/api/v1/products/store/${encodeURIComponent(decodedShopName)}`, { headers })
        setStoreData(res.data)
        const prodList = res.data.products || []
        setProducts(prodList)
        setFilteredProducts(prodList)
      } catch (err) {
        console.error("Mağaza məlumatı yüklənərkən xəta:", err)
        notification.error({
          message: 'Mağaza Tapılmadı',
          description: 'Axtardığınız butik mağazası tapılmadı və ya aktiv deyil.'
        })
      } finally {
        setLoading(false)
      }
    }

    if (decodedShopName) {
      fetchStore()
    }
  }, [decodedShopName, isSignedIn, user])

  // Search & Category Filter
  useEffect(() => {
    let list = [...products]
    if (selectedCategory !== 'Hamısı') {
      list = list.filter(p => p.category && p.category.toLowerCase() === selectedCategory.toLowerCase())
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      )
    }
    setFilteredProducts(list)
  }, [searchQuery, selectedCategory, products])

  // Extract unique categories in this store
  const categories = ['Hamısı', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))]

  // Size Recommendation Modal Handlers
  const handleOpenModal = async (product) => {
    setSelectedProduct(product)
    setModalImageIndex(0)
    setImageOpacity(1)
    setShowModal(true)
    setSizeRecommendation(null)

    try {
      let headers = {}
      if (isSignedIn) {
        const token = await getToken()
        if (token) headers['Authorization'] = `Bearer ${token}`
      }
      if (user && user.primaryEmailAddress?.emailAddress) {
        headers['X-Clerk-User-Email'] = user.primaryEmailAddress.emailAddress
      }
      const res = await axios.get(`${BASE_URL}/api/v1/products/${product.id}`, { headers })
      if (res.data && res.data.sizeRecommendation) {
        setSizeRecommendation(res.data.sizeRecommendation)
      }
    } catch (e) {
      console.warn("Ölçü tövsiyəsi alınarkən xəta:", e)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedProduct(null)
    setSizeRecommendation(null)
  }

  const getModalImages = () => {
    if (!selectedProduct) return []
    const list = []
    if (selectedProduct.imageUrl && typeof selectedProduct.imageUrl === 'string' && selectedProduct.imageUrl.trim()) {
      list.push(selectedProduct.imageUrl.trim())
    }
    if (Array.isArray(selectedProduct.imageUrls)) {
      selectedProduct.imageUrls.forEach(url => {
        if (url && typeof url === 'string' && url.trim() && !list.includes(url.trim())) {
          list.push(url.trim())
        }
      })
    }
    return list.length > 0 ? list : ['https://via.placeholder.com/400x500?text=Geyim+Şəkli']
  }

  const handleModalNextImage = () => {
    setImageOpacity(0)
    setTimeout(() => {
      const imgs = getModalImages()
      setModalImageIndex((prev) => (prev + 1) % imgs.length)
      setImageOpacity(1)
    }, 150)
  }

  const handleModalPrevImage = () => {
    setImageOpacity(0)
    setTimeout(() => {
      const imgs = getModalImages()
      setModalImageIndex((prev) => (prev - 1 + imgs.length) % imgs.length)
      setImageOpacity(1)
    }, 150)
  }

  // Zoom Handlers
  const handleOpenZoom = (imgUrl) => {
    const images = getModalImages()
    let initialIdx = images.indexOf(imgUrl)
    if (initialIdx === -1) initialIdx = 0
    setModalImageIndex(initialIdx)
    setZoomImage(imgUrl || images[0])
    setZoomScale(1)
    setZoomPan({ x: 0, y: 0 })
    setZoomOpacity(1)
  }

  const handleCloseZoom = (e) => {
    if (e) e.stopPropagation()
    setZoomImage(null)
    setZoomScale(1)
    setZoomPan({ x: 0, y: 0 })
  }

  const handleZoomIn = (e) => {
    if (e) e.stopPropagation()
    setZoomScale(prev => Math.min(3.5, Number((prev + 0.35).toFixed(2))))
  }

  const handleZoomOut = (e) => {
    if (e) e.stopPropagation()
    setZoomScale(prev => {
      const next = Math.max(1, Number((prev - 0.35).toFixed(2)))
      if (next === 1) setZoomPan({ x: 0, y: 0 })
      return next
    })
  }

  const handleResetZoom = (e) => {
    if (e) e.stopPropagation()
    setZoomScale(1)
    setZoomPan({ x: 0, y: 0 })
  }

  const handleCopyStoreLink = () => {
    navigator.clipboard.writeText(window.location.href)
    notification.success({
      message: 'Link Kopyalandı',
      description: 'Mağaza səhifəsinin daxili ünvanı kopyalandı!'
    })
  }

  if (loading) {
    return <LoadingSpinner text="Mağaza səhifəsi yüklənir..." fullScreen={true} />
  }

  const contactPhone = storeData?.contactPhone || ''
  const contactLink = storeData?.contactLink || ''
  const formattedPhone = contactPhone ? contactPhone.replace(/[^0-9]/g, '') : ''
  const whatsappUrl = formattedPhone ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(`Salam! ${decodedShopName} mağazasından geyim haqqında maraqlanıram.`)}` : ''

  return (
    <div className="store-page-container">
      <Header />

      {/* Store Hero Banner */}
      <div className="store-hero-banner">
        <div className="store-banner-overlay"></div>
        <div className="store-hero-content">
          <button className="store-back-btn" onClick={() => navigate('/')}>
            <FiArrowLeft /> Ana Səhifəyə Qayıt
          </button>
          
          <div className="store-header-card">
            <div className="store-avatar-circle">
              <FiShoppingBag />
            </div>
            
            <div className="store-meta-details">
              <div className="store-badge-row">
                <span className="store-verified-badge">
                  <FiCheckCircle /> Təsdiqlənmiş Butik
                </span>
                <span className="store-count-badge">
                  {products.length} Geyim Məhsulu
                </span>
              </div>

              <h1 className="store-title-name">{decodedShopName}</h1>
              <p className="store-tagline">
                Özəl dizayn geyimlər və keyfiyyətli dəb kolleksiyaları. Ağıllı ölçü mühərriki ilə 100% dəqiq seçim edin.
              </p>

              {/* Action Contact Buttons */}
              <div className="store-contact-actions">
                {whatsappUrl && (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="store-action-btn whatsapp">
                    <FaWhatsapp /> WhatsApp Əlaqə
                  </a>
                )}
                {contactLink && (
                  <a href={contactLink} target="_blank" rel="noopener noreferrer" className="store-action-btn social">
                    {contactLink.includes('instagram') ? <FaInstagram /> : contactLink.includes('tiktok') ? <FaTiktok /> : <FiShare2 />}
                    Mağaza Sosial Media
                  </a>
                )}
                {contactPhone && (
                  <a href={`tel:${contactPhone}`} className="store-action-btn phone">
                    <FiPhone /> {contactPhone}
                  </a>
                )}
                <button className="store-action-btn share" onClick={handleCopyStoreLink} title="Mağaza linkini kopyala">
                  <FiShare2 /> Linki Paylaş
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="store-main-section">
        {/* Filters & Search Bar */}
        <div className="store-filter-bar">
          <div className="store-search-box">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Bu mağazada geyim axtarın..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                <FiX />
              </button>
            )}
          </div>

          <div className="store-category-pills">
            {categories.map((cat, idx) => (
              <button 
                key={idx}
                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid Header */}
        <div className="store-grid-header">
          <h2>Kolleksiya Geyimləri ({filteredProducts.length})</h2>
          {searchQuery && <p className="search-results-info">"{searchQuery}" üzrə nəticələr</p>}
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="clothing-grid">
            {filteredProducts.map((product) => {
              const displayPrice = product.price ? `${product.price} ₼` : "Razılaşma ilə"
              const displayImage = (product.imageUrl && product.imageUrl.trim()) 
                ? product.imageUrl 
                : (Array.isArray(product.imageUrls) && product.imageUrls[0])
                ? product.imageUrls[0]
                : "https://via.placeholder.com/300x400?text=Geyim+Şəkli"

              return (
                <div key={product.id} className="clothing-card">
                  <div className="clothing-card-image-container">
                    <img 
                      src={displayImage} 
                      alt={product.name} 
                      className="clothing-card-image"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/300x400?text=Şəkil+Yüklənmədi"
                      }}
                    />
                    {product.gender && (
                      <span className={`gender-tag ${product.gender.toLowerCase()}`}>
                        {product.gender}
                      </span>
                    )}
                    <span className="price-tag">{displayPrice}</span>
                  </div>

                  <div className="clothing-card-content">
                    <h3 className="clothing-card-title">{product.name}</h3>
                    <p className="clothing-card-brand">{product.brand || decodedShopName}</p>

                    <div className="clothing-card-sizes">
                      {product.sizes && product.sizes.length > 0 ? (
                        product.sizes.map((s, i) => (
                          <span key={i} className="size-badge">
                            {s.sizeName}
                          </span>
                        ))
                      ) : (
                        <span className="size-badge empty">Standart Ölçü</span>
                      )}
                    </div>

                    <div className="clothing-card-footer">
                      <div className="clothing-card-seller">
                        Satıcı: <strong>{product.sellerName || decodedShopName}</strong>
                      </div>
                      <button 
                        className="try-button"
                        onClick={() => handleOpenModal(product)}
                      >
                        Sına <GoArrowRight />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="store-empty-state">
            <FiShoppingBag className="empty-icon" />
            <h3>Hələ ki geyim tapılmadı</h3>
            <p>Bu mağazada axtarışınız üzrə heç bir məhsul tapılmadı. Zəhmət olmasa axtarış parametri dəyişin.</p>
            {(searchQuery || selectedCategory !== 'Hamısı') && (
              <button className="reset-filter-btn" onClick={() => { setSearchQuery(''); setSelectedCategory('Hamısı'); }}>
                Filtrləri Sıfırla
              </button>
            )}
          </div>
        )}
      </div>

      {/* Try-on Size Recommendation Modal */}
      {showModal && selectedProduct && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleCloseModal} aria-label="Bağla">
              &times;
            </button>
            <h2 className="modal-title">{selectedProduct.name}</h2>

            <div className="modal-body">
              <div className="modal-image-viewer">
                <img
                  src={getModalImages()[modalImageIndex]}
                  alt={selectedProduct.name}
                  className="modal-image"
                  style={{ opacity: imageOpacity, transition: 'opacity 0.2s ease-in-out' }}
                />
                
                {/* Maximize Zoom Button */}
                <button
                  className="modal-zoom-btn"
                  onClick={() => handleOpenZoom(getModalImages()[modalImageIndex])}
                  title="Şəkli tam ekranda böyüt"
                >
                  <FiMaximize2 />
                </button>

                {getModalImages().length > 1 && (
                  <>
                    <button className="carousel-control prev" onClick={handleModalPrevImage} aria-label="Əvvəlki şəkil">
                      &#10094;
                    </button>
                    <button className="carousel-control next" onClick={handleModalNextImage} aria-label="Növbəti şəkil">
                      &#10095;
                    </button>
                    <div className="carousel-dots">
                      {getModalImages().map((_, idx) => (
                        <span
                          key={idx}
                          className={`dot ${idx === modalImageIndex ? 'active' : ''}`}
                          onClick={() => setModalImageIndex(idx)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="modal-details">
                <div className="detail-item">
                  <span className="detail-label">Brend:</span>
                  <span className="detail-value">{selectedProduct.brand || decodedShopName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Qiymət:</span>
                  <span className="detail-value highlight">{selectedProduct.price ? `${selectedProduct.price} ₼` : 'Razılaşma ilə'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Cins:</span>
                  <span className="detail-value">{selectedProduct.gender || 'Unisex'}</span>
                </div>
                {selectedProduct.color && (
                  <div className="detail-item">
                    <span className="detail-label">Rəng:</span>
                    <span className="detail-value">{selectedProduct.color}</span>
                  </div>
                )}
                {selectedProduct.description && (
                  <div className="detail-item full-width">
                    <span className="detail-label">Haqqında:</span>
                    <p className="detail-description">{selectedProduct.description}</p>
                  </div>
                )}

                {/* Size Engine Recommendation Result */}
                {sizeRecommendation ? (
                  <div className="size-recommendation-card">
                    <div className="rec-header">
                      <span className="rec-badge">{sizeRecommendation.bestSizeName || 'M'}</span>
                      <span className="rec-percentage">{sizeRecommendation.matchPercentage || 95}% Uyğunluq</span>
                    </div>
                    <p className="rec-explanation">{sizeRecommendation.explanation}</p>
                  </div>
                ) : (
                  <div className="size-recommendation-card loading">
                    <p>Ağıllı Ölçü Alqoritmi Hesablanır...</p>
                  </div>
                )}

                {/* Contact Actions in Modal */}
                <div className="modal-contact-row">
                  {selectedProduct.contactPhone && (
                    <a
                      href={`https://wa.me/${selectedProduct.contactPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Salam! ${selectedProduct.name} geyimi haqqında maraqlanıram.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-btn whatsapp"
                    >
                      <FaWhatsapp /> WhatsApp İlə Sifariş
                    </a>
                  )}
                  {selectedProduct.contactLink && (
                    <a
                      href={selectedProduct.contactLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-btn social"
                    >
                      <FaInstagram /> Sosyal Media
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Portal */}
      {zoomImage && createPortal(
        <div 
          className="zoom-lightbox-overlay" 
          onClick={handleCloseZoom}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(16px)', zIndex: 100000000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div className="lightbox-controls-top" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-btn" onClick={handleZoomOut}><FiZoomOut /></button>
            <span className="lightbox-scale-badge">{Math.round(zoomScale * 100)}%</span>
            <button className="lightbox-btn" onClick={handleZoomIn}><FiZoomIn /></button>
            <button className="lightbox-btn" onClick={handleResetZoom}><FiRefreshCw /></button>
            <button className="lightbox-close-btn" onClick={handleCloseZoom}><FiX /></button>
          </div>
          <div className="lightbox-image-wrapper" onClick={(e) => e.stopPropagation()}>
            <img 
              src={zoomImage} 
              alt="Böyüdülmüş baxış" 
              style={{ maxWidth: '90vw', maxHeight: '80vh', objectFit: 'contain', borderRadius: '8px' }} 
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default StorePage
