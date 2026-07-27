import React, { useEffect, useState, useRef, useCallback } from 'react'
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
  FiMaximize2, FiX, FiZoomIn, FiZoomOut, FiRefreshCw,
  FiGrid, FiList, FiArrowUp, FiFilter, FiStar, FiTruck,
  FiPackage, FiTag, FiClock
} from 'react-icons/fi'
import { FaWhatsapp, FaInstagram, FaTiktok } from 'react-icons/fa'
import { GoArrowRight } from "react-icons/go"
import './StorePage.css'

// Helper function to deduplicate and sort size badges cleanly
const getSortedUniqueSizes = (sizes) => {
  if (!sizes || !Array.isArray(sizes)) return []
  const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "3XL"]
  
  const uniqueMap = {}
  sizes.forEach(s => {
    if (s && s.sizeName) {
      uniqueMap[s.sizeName.toUpperCase()] = s
    }
  })
  
  return Object.values(uniqueMap).sort((a, b) => {
    const indexA = sizeOrder.indexOf(a.sizeName.toUpperCase())
    const indexB = sizeOrder.indexOf(b.sizeName.toUpperCase())
    
    const valA = indexA === -1 ? 999 : indexA
    const valB = indexB === -1 ? 999 : indexB
    return valA - valB
  })
}

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
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('grid')
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [storeFound, setStoreFound] = useState(true)

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
  const [zoomImages, setZoomImages] = useState([])
  const [zoomIndex, setZoomIndex] = useState(0)

  // Touch support for zoom swipe
  const [touchStart, setTouchStart] = useState(null)

  // Decode and trim the shopName from URL
  const decodedShopName = shopName ? decodeURIComponent(shopName).trim() : ''

  // Back to top scroll listener
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 600)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

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

        const trimmedName = decodedShopName.trim()
        const res = await axios.get(`${BASE_URL}/api/v1/products/store/${encodeURIComponent(trimmedName)}`, { headers })
        
        if (res.data) {
          setStoreData(res.data)
          const prodList = res.data.products || []
          setProducts(prodList)
          setFilteredProducts(prodList)
          setStoreFound(res.data.storeFound !== false)
          
          if (res.data.shopName && res.data.shopName !== decodedShopName) {
            document.title = `${res.data.shopName} - Parabola Butik Mağazası`
          }
        }
      } catch (err) {
        console.error("Mağaza məlumatı yüklənərkən xəta:", err)
        setStoreFound(false)
        if (err.response && err.response.status >= 500) {
          notification.error({
            message: 'Server Xətası',
            description: 'Mağaza yüklənərkən server xətası baş verdi. Bir az sonra yenidən cəhd edin.'
          })
        }
      } finally {
        setLoading(false)
      }
    }

    if (decodedShopName) {
      fetchStore()
    }
  }, [decodedShopName, isSignedIn, user])

  // Search, Category & Sort Filter
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
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.color && p.color.toLowerCase().includes(q))
      )
    }

    switch (sortBy) {
      case 'price-low':
        list.sort((a, b) => (a.price || 0) - (b.price || 0))
        break
      case 'price-high':
        list.sort((a, b) => (b.price || 0) - (a.price || 0))
        break
      case 'name':
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        break
      case 'newest':
      default:
        break
    }
    
    setFilteredProducts(list)
  }, [searchQuery, selectedCategory, sortBy, products])

  // Extract unique categories in this store
  const categories = ['Hamısı', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))]

  // Calculate Price Range strictly from valid product prices
  const validPrices = products
    .map(p => p.price)
    .filter(p => typeof p === 'number' && !isNaN(p) && p > 0)

  const priceMin = validPrices.length > 0 ? Math.min(...validPrices) : null
  const priceMax = validPrices.length > 0 ? Math.max(...validPrices) : null

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
    setZoomImages(images)
    setZoomIndex(initialIdx)
    setZoomImage(imgUrl || images[0])
    setZoomScale(1)
    setZoomPan({ x: 0, y: 0 })
    setZoomOpacity(1)
  }

  const handleCloseZoom = (e) => {
    if (e) e.stopPropagation()
    setZoomImage(null)
    setZoomImages([])
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

  const handleZoomNext = useCallback((e) => {
    if (e) e.stopPropagation()
    if (zoomImages.length <= 1) return
    setZoomOpacity(0)
    setTimeout(() => {
      setZoomIndex(prev => {
        const next = (prev + 1) % zoomImages.length
        setZoomImage(zoomImages[next])
        return next
      })
      setZoomScale(1)
      setZoomPan({ x: 0, y: 0 })
      setZoomOpacity(1)
    }, 150)
  }, [zoomImages])

  const handleZoomPrev = useCallback((e) => {
    if (e) e.stopPropagation()
    if (zoomImages.length <= 1) return
    setZoomOpacity(0)
    setTimeout(() => {
      setZoomIndex(prev => {
        const next = (prev - 1 + zoomImages.length) % zoomImages.length
        setZoomImage(zoomImages[next])
        return next
      })
      setZoomScale(1)
      setZoomPan({ x: 0, y: 0 })
      setZoomOpacity(1)
    }, 150)
  }, [zoomImages])

  const handleTouchStart = (e) => {
    if (zoomScale > 1) return
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e) => {
    if (touchStart === null || zoomScale > 1) return
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd
    if (Math.abs(diff) > 60) {
      if (diff > 0) handleZoomNext(e)
      else handleZoomPrev(e)
    }
    setTouchStart(null)
  }

  const handleCopyStoreLink = () => {
    const cleanUrl = `${window.location.origin}/store/${encodeURIComponent(storeData?.shopName || decodedShopName)}`
    navigator.clipboard.writeText(cleanUrl)
    notification.success({
      message: 'Link Kopyalandı',
      description: 'Mağaza səhifəsinin linki kopyalandı!'
    })
  }

  if (loading) {
    return <LoadingSpinner text="Mağaza səhifəsi yüklənir..." fullScreen={true} />
  }

  const displayShopName = storeData?.shopName || decodedShopName
  const contactPhone = (storeData?.contactPhone && storeData.contactPhone.trim()) ? storeData.contactPhone.trim() : ''
  const contactLink = (storeData?.contactLink && storeData.contactLink.trim()) ? storeData.contactLink.trim() : ''
  const formattedPhone = contactPhone ? contactPhone.replace(/[^0-9]/g, '') : ''
  const whatsappUrl = formattedPhone ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(`Salam! ${displayShopName} mağazasından geyim haqqında maraqlanıram.`)}` : ''

  const numCategories = categories.length - 1

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
                  <FiPackage style={{ marginRight: '4px' }} /> {products.length} Geyim Məhsulu
                </span>
                {numCategories > 0 && (
                  <span className="store-count-badge category-badge">
                    <FiTag style={{ marginRight: '4px' }} /> {numCategories} Kateqoriya
                  </span>
                )}
              </div>

              <h1 className="store-title-name">{displayShopName}</h1>

              {/* Optional custom description if present */}
              {storeData?.description && storeData.description.trim() && (
                <p className="store-tagline">{storeData.description.trim()}</p>
              )}

              {/* Price Range Info (rendered ONLY if valid prices exist) */}
              {priceMin !== null && (
                <div className="store-price-range">
                  <FiTag /> {priceMin === priceMax ? `Qiymət: ${priceMin} ₼` : `Qiymət aralığı: ${priceMin} ₼ — ${priceMax} ₼`}
                </div>
              )}

              {/* Action Contact Buttons (strictly rendered ONLY if metadata exists) */}
              <div className="store-contact-actions">
                {whatsappUrl ? (
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="store-action-btn whatsapp">
                    <FaWhatsapp /> WhatsApp Əlaqə
                  </a>
                ) : null}

                {contactLink ? (
                  <a href={contactLink} target="_blank" rel="noopener noreferrer" className="store-action-btn social">
                    {contactLink.toLowerCase().includes('instagram') ? <FaInstagram /> : contactLink.toLowerCase().includes('tiktok') ? <FaTiktok /> : <FiShare2 />}
                    Mağaza Sosial Media
                  </a>
                ) : null}

                {contactPhone ? (
                  <a href={`tel:${contactPhone}`} className="store-action-btn phone">
                    <FiPhone /> {contactPhone}
                  </a>
                ) : null}

                <button className="store-action-btn share" onClick={handleCopyStoreLink} title="Mağaza linkini kopyala">
                  <FiShare2 /> Linki Paylaş
                </button>
              </div>
            </div>
          </div>

          {/* Store Stats Bar (rendered ONLY if products exist) */}
          {products.length > 0 && (
            <div className="store-stats-bar">
              <div className="stat-item">
                <FiPackage className="stat-icon" />
                <div className="stat-content">
                  <span className="stat-value">{products.length}</span>
                  <span className="stat-label">Məhsul</span>
                </div>
              </div>

              {numCategories > 0 && (
                <div className="stat-item">
                  <FiTag className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-value">{numCategories}</span>
                    <span className="stat-label">Kateqoriya</span>
                  </div>
                </div>
              )}

              {priceMin !== null && (
                <div className="stat-item">
                  <FiTag className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-value">{priceMin === priceMax ? `${priceMin} ₼` : `${priceMin} - ${priceMax} ₼`}</span>
                    <span className="stat-label">Qiymət Aralığı</span>
                  </div>
                </div>
              )}
            </div>
          )}
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

          <div className="store-filter-controls">
            {/* Sort Dropdown */}
            <select 
              className="store-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Ən yeni</option>
              <option value="price-low">Qiymət: Aşağıdan</option>
              <option value="price-high">Qiymət: Yuxarıdan</option>
              <option value="name">Ad üzrə (A-Z)</option>
            </select>

            {/* View Mode Toggle */}
            <div className="view-mode-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid baxışı"
              >
                <FiGrid />
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="Siyahı baxışı"
              >
                <FiList />
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills */}
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

        {/* Product Grid Header */}
        <div className="store-grid-header">
          <h2>Kolleksiya Geyimləri ({filteredProducts.length})</h2>
          {searchQuery && <p className="search-results-info">"{searchQuery}" üzrə nəticələr</p>}
          {selectedCategory !== 'Hamısı' && (
            <p className="search-results-info">Kateqoriya: {selectedCategory}</p>
          )}
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className={viewMode === 'grid' ? 'clothing-grid' : 'clothing-list-view'}>
            {filteredProducts.map((product) => {
              const displayPrice = product.price ? `${product.price} ₼` : "Razılaşma ilə"
              const displayImage = (product.imageUrl && product.imageUrl.trim()) 
                ? product.imageUrl 
                : (Array.isArray(product.imageUrls) && product.imageUrls[0])
                ? product.imageUrls[0]
                : "https://via.placeholder.com/300x400?text=Geyim+Şəkli"

              const imageCount = new Set([
                ...(product.imageUrl ? [product.imageUrl] : []),
                ...(Array.isArray(product.imageUrls) ? product.imageUrls : [])
              ].filter(Boolean)).size

              const sortedSizes = getSortedUniqueSizes(product.sizes)

              return (
                <div key={product.id} className={`clothing-card ${viewMode === 'list' ? 'list-mode' : ''}`}>
                  <div className="clothing-card-image-container">
                    <img 
                      src={displayImage} 
                      alt={product.name} 
                      className="clothing-card-image"
                      loading="lazy"
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
                    {imageCount > 1 && (
                      <span className="image-count-badge">{imageCount} şəkil</span>
                    )}
                  </div>

                  <div className="clothing-card-content">
                    <h3 className="clothing-card-title">{product.name}</h3>
                    <p className="clothing-card-brand">{product.brand || displayShopName}</p>
                    {product.description && viewMode === 'list' && (
                      <p className="clothing-card-description">{product.description}</p>
                    )}

                    <div className="clothing-card-sizes">
                      {sortedSizes.length > 0 ? (
                        sortedSizes.map((s, i) => (
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
                        Satıcı: <strong>{product.sellerName || displayShopName}</strong>
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
            {products.length === 0 && !searchQuery && selectedCategory === 'Hamısı' ? (
              <>
                <h3>Bu mağazada hələ ki geyim yoxdur</h3>
                <p>Satıcı tezliklə yeni kolleksiya əlavə edəcək. Mağazanı izləyin!</p>
              </>
            ) : (
              <>
                <h3>Hələ ki geyim tapılmadı</h3>
                <p>Bu mağazada axtarışınız üzrə heç bir məhsul tapılmadı. Zəhmət olmasa axtarış parametri dəyişin.</p>
              </>
            )}
            {(searchQuery || selectedCategory !== 'Hamısı') && (
              <button className="reset-filter-btn" onClick={() => { setSearchQuery(''); setSelectedCategory('Hamısı'); }}>
                Filtrləri Sıfırla
              </button>
            )}
            <button className="store-back-btn" style={{ marginTop: '16px' }} onClick={() => navigate('/')}>
              <FiArrowLeft /> Kataloqa Qayıt
            </button>
          </div>
        )}
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button className="back-to-top-btn" onClick={scrollToTop} title="Yuxarı qayıt">
          <FiArrowUp />
        </button>
      )}

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
                  <span className="detail-value">{selectedProduct.brand || displayShopName}</span>
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
                  {(selectedProduct.contactPhone || contactPhone) && (
                    <a
                      href={`https://wa.me/${(selectedProduct.contactPhone || contactPhone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Salam! ${selectedProduct.name} geyimi haqqında maraqlanıram.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-btn whatsapp"
                    >
                      <FaWhatsapp /> WhatsApp İlə Sifariş
                    </a>
                  )}
                  {(selectedProduct.contactLink || contactLink) && (
                    <a
                      href={selectedProduct.contactLink || contactLink}
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
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(16px)', zIndex: 100000000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div className="lightbox-controls-top" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-btn" onClick={handleZoomOut}><FiZoomOut /></button>
            <span className="lightbox-scale-badge">{Math.round(zoomScale * 100)}%</span>
            <button className="lightbox-btn" onClick={handleZoomIn}><FiZoomIn /></button>
            <button className="lightbox-btn" onClick={handleResetZoom}><FiRefreshCw /></button>
            {zoomImages.length > 1 && (
              <span className="lightbox-scale-badge">{zoomIndex + 1}/{zoomImages.length}</span>
            )}
            <button className="lightbox-close-btn" onClick={handleCloseZoom}><FiX /></button>
          </div>
          
          {/* Left/Right navigation for zoom */}
          {zoomImages.length > 1 && (
            <>
              <button 
                className="lightbox-nav-btn lightbox-nav-prev" 
                onClick={handleZoomPrev}
                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '48px', height: '48px', color: '#fff', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <FiChevronLeft />
              </button>
              <button 
                className="lightbox-nav-btn lightbox-nav-next" 
                onClick={handleZoomNext}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', width: '48px', height: '48px', color: '#fff', fontSize: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <FiChevronRight />
              </button>
            </>
          )}
          
          <div className="lightbox-image-wrapper" onClick={(e) => e.stopPropagation()}>
            <img 
              src={zoomImage} 
              alt="Böyüdülmüş baxış"
              style={{ 
                maxWidth: '90vw', 
                maxHeight: '80vh', 
                objectFit: 'contain', 
                borderRadius: '8px',
                transform: `scale(${zoomScale}) translate(${zoomPan.x}px, ${zoomPan.y}px)`,
                transition: zoomOpacity < 1 ? 'opacity 0.15s ease' : 'transform 0.15s ease',
                opacity: zoomOpacity
              }} 
            />
          </div>

          {/* Thumbnail strip */}
          {zoomImages.length > 1 && (
            <div className="lightbox-thumbs" onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', padding: '8px 16px', background: 'rgba(0,0,0,0.6)', borderRadius: '12px' }}>
              {zoomImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Şəkil ${idx + 1}`}
                  onClick={() => {
                    setZoomIndex(idx)
                    setZoomImage(img)
                    setZoomScale(1)
                    setZoomPan({ x: 0, y: 0 })
                  }}
                  style={{
                    width: '50px',
                    height: '50px',
                    objectFit: 'cover',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    border: idx === zoomIndex ? '2px solid #c9a96e' : '2px solid transparent',
                    opacity: idx === zoomIndex ? 1 : 0.6,
                    transition: 'all 0.2s ease'
                  }}
                />
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}

export default StorePage
