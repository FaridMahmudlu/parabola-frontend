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
  FiPackage, FiTag, FiClock, FiRotateCcw, FiSliders
} from 'react-icons/fi'
import { FaWhatsapp, FaInstagram, FaTiktok } from 'react-icons/fa'
import { GoArrowRight } from "react-icons/go"
import './StorePage.css'
import '../../components/clothing/clothing.css'

// Helper function to deduplicate and sort size badges cleanly (matching Cothing.jsx)
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

// Format seller name helper (matching Cothing.jsx)
const formatSellerName = (sellerName) => {
  if (!sellerName) return ""
  const nameStr = String(sellerName).trim()
  if (nameStr.toLowerCase().includes("mleykmahmudlu")) {
    return "Parabola Admin"
  }
  return nameStr
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
  
  // Card image slider index per product ID (matching Cothing.jsx)
  const [activeImageIndexes, setActiveImageIndexes] = useState({})

  // Multi-Option Professional Filter States
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Hamısı')
  const [selectedGender, setSelectedGender] = useState('Hamısı')
  const [selectedSizeFilter, setSelectedSizeFilter] = useState('Hamısı')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [storeFound, setStoreFound] = useState(true)

  // Size Modal State (matching Cothing.jsx)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [imageOpacity, setImageOpacity] = useState(1)
  const [recommendation, setRecommendation] = useState(null)
  const [loadingRecommendation, setLoadingRecommendation] = useState(false)
  const modalRef = useRef(null)

  // Zoom Lightbox State (matching Cothing.jsx)
  const [zoomImage, setZoomImage] = useState(null)
  const [zoomScale, setZoomScale] = useState(1)
  const [zoomPan, setZoomPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [zoomOpacity, setZoomOpacity] = useState(1)
  const [zoomImages, setZoomImages] = useState([])
  const [zoomIndex, setZoomIndex] = useState(0)
  const [touchStart, setTouchStart] = useState(null)

  // Decode and trim shopName
  const decodedShopName = shopName ? decodeURIComponent(shopName).trim() : ''

  // Scroll listener for back-to-top button
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

  // Fetch Store Data
  useEffect(() => {
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

  // Professional Multi-Option Filter Logic
  useEffect(() => {
    let list = [...products]
    
    // 1. Category Filter
    if (selectedCategory !== 'Hamısı') {
      list = list.filter(p => p.category && p.category.toLowerCase() === selectedCategory.toLowerCase())
    }

    // 2. Gender Filter
    if (selectedGender !== 'Hamısı') {
      list = list.filter(p => p.gender && p.gender.toLowerCase() === selectedGender.toLowerCase())
    }

    // 3. Size Filter
    if (selectedSizeFilter !== 'Hamısı') {
      list = list.filter(p => {
        if (!p.sizes || !Array.isArray(p.sizes)) return false
        return p.sizes.some(s => s.sizeName && s.sizeName.toUpperCase() === selectedSizeFilter.toUpperCase())
      })
    }

    // 4. Min Price Filter
    if (minPrice !== '') {
      const minVal = parseFloat(minPrice)
      if (!isNaN(minVal)) {
        list = list.filter(p => (p.price || 0) >= minVal)
      }
    }

    // 5. Max Price Filter
    if (maxPrice !== '') {
      const maxVal = parseFloat(maxPrice)
      if (!isNaN(maxVal)) {
        list = list.filter(p => (p.price || 0) <= maxVal)
      }
    }
    
    // 6. Keyword Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.color && p.color.toLowerCase().includes(q))
      )
    }

    // 7. Sort Options
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
  }, [searchQuery, selectedCategory, selectedGender, selectedSizeFilter, minPrice, maxPrice, sortBy, products])

  // Count active filters
  const activeFilterCount = [
    selectedCategory !== 'Hamısı',
    selectedGender !== 'Hamısı',
    selectedSizeFilter !== 'Hamısı',
    minPrice !== '',
    maxPrice !== '',
    searchQuery.trim() !== ''
  ].filter(Boolean).length

  // Reset all filters handler
  const handleResetAllFilters = () => {
    setSearchQuery('')
    setSelectedCategory('Hamısı')
    setSelectedGender('Hamısı')
    setSelectedSizeFilter('Hamısı')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('newest')
  }

  // Extract metadata options
  const categories = ['Hamısı', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))]
  const sizesList = ['Hamısı', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
  const gendersList = ['Hamısı', 'Kişi', 'Qadın', 'Unisex']

  // Price Range Calculation
  const validPrices = products.map(p => p.price).filter(p => typeof p === 'number' && !isNaN(p) && p > 0)
  const priceMin = validPrices.length > 0 ? Math.min(...validPrices) : null
  const priceMax = validPrices.length > 0 ? Math.max(...validPrices) : null

  // Card Image Navigation (matching Cothing.jsx)
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

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e, item) => {
    if (touchStart === null) return
    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd
    if (Math.abs(diff) > 40) {
      if (diff > 0) handleNextImage(e, item)
      else handlePrevImage(e, item)
    }
    setTouchStart(null)
  }

  // Try-On Size Analysis Modal Handler (matching Cothing.jsx)
  const handleTryOn = async (product) => {
    setSelectedProduct(product)
    setModalImageIndex(0)
    setImageOpacity(1)
    setShowModal(true)
    setSelectedSize('')
    setSelectedColor(product.color || '')
    setRecommendation(null)
    setLoadingRecommendation(true)

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
        setRecommendation(res.data.sizeRecommendation)
        if (res.data.sizeRecommendation.bestSizeName) {
          setSelectedSize(res.data.sizeRecommendation.bestSizeName)
        }
      }
    } catch (err) {
      console.warn("Ölçü tövsiyəsi alınarkən xəta:", err)
    } finally {
      setLoadingRecommendation(false)
    }
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
    return list.length > 0 ? list : ["https://gunnandmoore.playwiththebest.com/media/catalog/product/cache/ec4e4c8893a2305e77afd20d2909bacb/7/0/7047_teknik_slipover_white_1.png"]
  }

  const handleModalNextImage = () => {
    setImageOpacity(0)
    setTimeout(() => {
      const imgs = getModalImages()
      setModalImageIndex(prev => (prev + 1) % imgs.length)
      setImageOpacity(1)
    }, 150)
  }

  const handleModalPrevImage = () => {
    setImageOpacity(0)
    setTimeout(() => {
      const imgs = getModalImages()
      setModalImageIndex(prev => (prev - 1 + imgs.length) % imgs.length)
      setImageOpacity(1)
    }, 150)
  }

  // Lightbox Zoom Handlers
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

  // WhatsApp / Social Direct Order Message (matching Cothing.jsx)
  const handleOrderMessage = (platform) => {
    const message = `Salam! ${displayShopName} mağazasından bu geyim haqqında maraqlanıram:\n\n` +
                    `- Məhsul: ${selectedProduct.name}\n` +
                    `- Brend: ${selectedProduct.brand || displayShopName}\n` +
                    `- Kateqoriya: ${selectedProduct.category}\n` +
                    `- Ölçü: ${selectedSize || 'Seçilməyib'}\n` +
                    `- Rəng: ${selectedColor || 'Seçilməyib'}\n` +
                    `- Qiymət: ${selectedProduct.price ? selectedProduct.price + ' AZN' : 'Razılaşma ilə'}\n\n` +
                    `Bu geyimi sifariş etmək istəyirəm.`;
    
    const contactP = selectedProduct.contactPhone || storeData?.contactPhone || ''
    const contactL = selectedProduct.contactLink || storeData?.contactLink || ''

    if (platform === 'whatsapp') {
      const whatsappNumber = contactP.replace(/\D/g, "")
      if (whatsappNumber) {
        window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank')
      } else {
        notification.info({ message: "Əlaqə Nömrəsi Məvcut Deyil" })
      }
    } else {
      navigator.clipboard.writeText(message)
      notification.success({
        message: "Sifariş Mətni Kopyalandı",
        description: "Məhsul haqqında detallı sifariş mətni kopyalandı! Satıcıya mesaj bölməsində birbaşa yapışdıraraq (paste) göndərə bilərsiniz."
      })
      if (contactL) {
        window.open(contactL, '_blank')
      }
    }
  }

  const handleCopyStoreLink = () => {
    const cleanUrl = `${window.location.origin}/store/${encodeURIComponent(storeData?.shopName || decodedShopName)}`
    navigator.clipboard.writeText(cleanUrl)
    notification.success({
      message: 'Link Kopyalandı',
      description: 'Mağaza səhifəsinin daxili keçidi kopyalandı!'
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

              {/* Optional Custom Description if provided by seller */}
              {storeData?.description && storeData.description.trim() ? (
                <p className="store-tagline">{storeData.description.trim()}</p>
              ) : null}

              {/* Price Range Info (rendered ONLY if valid prices exist) */}
              {priceMin !== null ? (
                <div className="store-price-range">
                  <FiTag /> {priceMin === priceMax ? `Qiymət: ${priceMin} ₼` : `Qiymət aralığı: ${priceMin} ₼ — ${priceMax} ₼`}
                </div>
              ) : null}

              {/* Contact Actions (rendered ONLY if metadata exists) */}
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
          {products.length > 0 ? (
            <div className="store-stats-bar">
              <div className="stat-item">
                <FiPackage className="stat-icon" />
                <div className="stat-content">
                  <span className="stat-value">{products.length}</span>
                  <span className="stat-label">Məhsul</span>
                </div>
              </div>

              {numCategories > 0 ? (
                <div className="stat-item">
                  <FiTag className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-value">{numCategories}</span>
                    <span className="stat-label">Kateqoriya</span>
                  </div>
                </div>
              ) : null}

              {priceMin !== null ? (
                <div className="stat-item">
                  <FiTag className="stat-icon" />
                  <div className="stat-content">
                    <span className="stat-value">{priceMin === priceMax ? `${priceMin} ₼` : `${priceMin} - ${priceMax} ₼`}</span>
                    <span className="stat-label">Qiymət Aralığı</span>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {/* Main Content Section */}
      <div className="store-main-section">
        {/* Professional Multi-Option Filter Panel */}
        <div className="store-pro-filter-panel">
          <div className="filter-panel-header">
            <h3 className="filter-title">
              <FiSliders className="filter-title-icon" /> Profesional Filtrləmə Sistemləri
              {activeFilterCount > 0 && (
                <span className="active-filter-badge">{activeFilterCount} filtr aktivdir</span>
              )}
            </h3>
            {activeFilterCount > 0 && (
              <button className="reset-all-btn" onClick={handleResetAllFilters}>
                <FiRotateCcw /> Filtrləri Sıfırla
              </button>
            )}
          </div>

          <div className="filter-grid-rows">
            {/* 1. Keyword Search */}
            <div className="filter-group">
              <label>Axtarış</label>
              <div className="filter-input-wrap">
                <FiSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Geyim adı, brend və ya rəng..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button className="clear-icon" onClick={() => setSearchQuery('')}>
                    <FiX />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Category Select */}
            <div className="filter-group">
              <label>Kateqoriya</label>
              <select 
                className="filter-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* 3. Gender Select */}
            <div className="filter-group">
              <label>Cins</label>
              <select 
                className="filter-select"
                value={selectedGender}
                onChange={(e) => setSelectedGender(e.target.value)}
              >
                {gendersList.map((g, idx) => (
                  <option key={idx} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* 4. Size Select */}
            <div className="filter-group">
              <label>Ölçü</label>
              <select 
                className="filter-select"
                value={selectedSizeFilter}
                onChange={(e) => setSelectedSizeFilter(e.target.value)}
              >
                {sizesList.map((sz, idx) => (
                  <option key={idx} value={sz}>{sz}</option>
                ))}
              </select>
            </div>

            {/* 5. Price Min & Max */}
            <div className="filter-group">
              <label>Qiymət Aralığı (AZN)</label>
              <div className="price-range-inputs">
                <input 
                  type="number" 
                  placeholder="Min ₼" 
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  min="0"
                />
                <span className="price-separator">—</span>
                <input 
                  type="number" 
                  placeholder="Max ₼" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            {/* 6. Sorting */}
            <div className="filter-group">
              <label>Sıralama</label>
              <select 
                className="filter-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Ən yeni geyimlər</option>
                <option value="price-low">Qiymət: Aşağıdan yuxarı</option>
                <option value="price-high">Qiymət: Yuxarıdan aşağı</option>
                <option value="name">Ad üzrə (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Quick Category Pills Scroll */}
          {categories.length > 1 && (
            <div className="filter-pills-scroll">
              {categories.map((cat, idx) => (
                <button 
                  key={idx}
                  className={`filter-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Section Title Header */}
        <div className="store-grid-header">
          <h2>Kolleksiya Geyimləri ({filteredProducts.length})</h2>
          {activeFilterCount > 0 && (
            <span style={{ fontSize: '13px', color: '#c9a96e', fontFamily: 'Montserrat, sans-serif' }}>
              Filtrelənmiş nəticələr göstərilir
            </span>
          )}
        </div>

        {/* Clothing Cards Grid (100% MATCHING Cothing.jsx structure & styling) */}
        {filteredProducts.length > 0 ? (
          <div className="cothingboxcontainer">
            {filteredProducts.map((item, index) => {
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
                      <p className="brand-text">{item.brand || displayShopName}</p>
                      <p className="price-text">{item.price ? `${item.price} AZN` : "Qiymət təyin edilməyib"}</p>
                      {item.sellerName && (
                        <p 
                          className="seller-text" 
                          style={{ cursor: 'default' }}
                        >
                          Satıcı: <span style={{ color: '#c9a96e' }}>{formatSellerName(item.sellerName)}</span>
                        </p>
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
        ) : (
          <div className="store-empty-state">
            <FiShoppingBag className="empty-icon" />
            {products.length === 0 && activeFilterCount === 0 ? (
              <>
                <h3>Bu mağazada hələ ki geyim yoxdur</h3>
                <p>Satıcı tezliklə yeni kolleksiya əlavə edəcək. Mağazanı izləyin!</p>
              </>
            ) : (
              <>
                <h3>Hələ ki geyim tapılmadı</h3>
                <p>Seçdiyiniz filtrlər üzrə heç bir məhsul tapılmadı. Zəhmət olmasa axtarış parametrlərini dəyişin.</p>
              </>
            )}
            {activeFilterCount > 0 && (
              <button className="reset-all-btn" style={{ marginTop: '16px' }} onClick={handleResetAllFilters}>
                <FiRotateCcw /> Filtrləri Sıfırla
              </button>
            )}
          </div>
        )}
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button className="back-to-top-btn" onClick={scrollToTop} title="Yuxarı qayıt">
          <FiArrowUp />
        </button>
      )}

      {/* Try-On Size Analysis Modal (100% MATCHING Cothing.jsx modal portal) */}
      {showModal && selectedProduct && createPortal(
        <div className="modal-overlay" onClick={(e) => { if (e.target.className === 'modal-overlay') setShowModal(false); }}>
          <div className="modal-container" ref={modalRef}>
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
                  onTouchEnd={(e) => handleTouchEnd(e, selectedProduct)}
                >
                  <img 
                    src={getModalImages()[modalImageIndex] || "https://gunnandmoore.playwiththebest.com/media/catalog/product/cache/ec4e4c8893a2305e77afd20d2909bacb/7/0/7047_teknik_slipover_white_1.png"}
                    alt={selectedProduct.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', cursor: 'zoom-in', opacity: imageOpacity }}
                    onClick={() => handleOpenZoom(getModalImages()[modalImageIndex])}
                  />
                  <button 
                    className="zoom-btn" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      const img = getModalImages()[modalImageIndex] || (selectedProduct ? selectedProduct.imageUrl : null);
                      if (img) handleOpenZoom(img);
                    }} 
                    title="Böyütmək üçün klikləyin" 
                    style={{ position: 'absolute', bottom: '12px', right: '12px', background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}
                  >
                    <FiMaximize2 style={{ fontSize: '16px' }} />
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
                
                {/* Score Circle & User Authentication Status */}
                <div style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: '4px' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '16px', 
                    width: '100%', 
                    justifyContent: 'space-between', 
                    padding: '14px', 
                    background: '#090909', 
                    border: '1px solid #1a1a1a', 
                    borderRadius: '4px',
                    filter: !isSignedIn ? 'blur(5px)' : 'none',
                    pointerEvents: !isSignedIn ? 'none' : 'auto',
                    userSelect: !isSignedIn ? 'none' : 'auto'
                  }}>
                    <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="64" height="64" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx="50" cy="50" r="40" stroke="#141414" strokeWidth="8" fill="transparent" />
                        <circle cx="50" cy="50" r="40" stroke="#c9a96e" strokeWidth="8" fill="transparent" 
                                strokeDasharray="251.2" 
                                strokeDashoffset={251.2 - (251.2 * (!isSignedIn ? 0 : (recommendation ? recommendation.matchPercentage : 0))) / 100}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.8s ease-in-out', filter: 'drop-shadow(0 0 4px rgba(201, 169, 110, 0.4))' }} />
                      </svg>
                      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#c9a96e', fontFamily: 'Montserrat, sans-serif' }}>
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
                  {!isSignedIn && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                      textAlign: 'center',
                      padding: '10px',
                      background: 'rgba(0,0,0,0.4)'
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#c9a96e', fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}>
                        Uyğunluq faizini görmək üçün
                      </span>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <a href="/login" style={{ fontSize: '10px', fontWeight: '700', color: '#000', background: '#c9a96e', padding: '4px 12px', borderRadius: '4px', textDecoration: 'none', transition: 'all 0.2s', fontFamily: 'Montserrat, sans-serif' }}>Daxil Ol</a>
                        <a href="/register" style={{ fontSize: '10px', fontWeight: '700', color: '#c9a96e', border: '1px solid #c9a96e', padding: '3px 11px', borderRadius: '4px', textDecoration: 'none', transition: 'all 0.2s', fontFamily: 'Montserrat, sans-serif' }}>Qeydiyyat</a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-right">
                <h3 className="product-title">{selectedProduct.name}</h3>
                <p className="product-brand" style={{ fontSize: '13px', color: '#7a7570' }}>
                  {selectedProduct.brand} • {selectedProduct.category} {selectedProduct.sellerName && `• Satıcı: ${formatSellerName(selectedProduct.sellerName)}`}
                </p>

                <div className="filter-buttons" style={{ marginTop: '10px' }}>
                  <span className="price-badge" style={{ padding: '8px 16px', fontSize: '16px' }}>{selectedProduct.price ? `${selectedProduct.price} AZN` : "Təyin edilməyib"}</span>
                </div>

                {/* Product Specification Grid */}
                <div className="product-spec-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginTop: '16px', padding: '12px', border: '1px solid #1f1f1f', borderRadius: '4px', background: '#070707' }}>
                  <div style={{ fontSize: '12px' }}><span style={{ color: '#7a7570' }}>Cins:</span> <span style={{ color: 'white' }}>{selectedProduct.gender || "Təyin edilməyib"}</span></div>
                  <div style={{ fontSize: '12px' }}><span style={{ color: '#7a7570' }}>Stil:</span> <span style={{ color: 'white' }}>{selectedProduct.style || "Təyin edilməyib"}</span></div>
                  <div style={{ fontSize: '12px' }}><span style={{ color: '#7a7570' }}>Rəng:</span> <span style={{ color: 'white' }}>{selectedProduct.color || "Təyin edilməyib"}</span></div>
                </div>

                {/* Available Sizes Picker */}
                <div style={{ marginTop: '16px' }}>
                  <label style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#7a7570', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Mövcud Ölçülər</label>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {getSortedUniqueSizes(selectedProduct.sizes).map(s => (
                      <button 
                        key={s.id}
                        onClick={() => setSelectedSize(s.sizeName)}
                        style={{
                          background: selectedSize === s.sizeName ? '#c9a96e' : 'transparent',
                          color: selectedSize === s.sizeName ? '#000' : '#7a7570',
                          border: `1px solid ${selectedSize === s.sizeName ? '#c9a96e' : '#1f1f1f'}`,
                          padding: '6px 14px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontFamily: 'Montserrat, sans-serif',
                          fontSize: '12px',
                          fontWeight: '600',
                          transition: 'all 0.2s'
                        }}
                      >
                        {s.sizeName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direct Order Actions */}
                <div className="contact-seller-wrapper" style={{ marginTop: '24px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {(selectedProduct.contactPhone || contactPhone) && (
                    <button 
                      className="contact-seller-btn whatsapp-btn"
                      onClick={() => handleOrderMessage('whatsapp')}
                      style={{ flex: 1, minWidth: '160px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#25d366', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontFamily: 'Montserrat, sans-serif' }}
                    >
                      <FaWhatsapp style={{ fontSize: '18px' }} /> WhatsApp Sifariş
                    </button>
                  )}
                  {(selectedProduct.contactLink || contactLink) && (
                    <button 
                      className={`contact-seller-btn ${(selectedProduct.contactLink || contactLink).toLowerCase().includes('tiktok') ? 'tiktok-btn' : 'instagram-btn'}`}
                      onClick={() => handleOrderMessage('social')}
                      style={{ flex: 1, minWidth: '160px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #e1306c, #f56040)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontFamily: 'Montserrat, sans-serif' }}
                    >
                      <FaInstagram style={{ fontSize: '18px' }} /> Sosyal Media Sifariş
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
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
            {zoomImages.length > 1 && (
              <span className="lightbox-scale-badge">{zoomIndex + 1}/{zoomImages.length}</span>
            )}
            <button className="lightbox-close-btn" onClick={handleCloseZoom}><FiX /></button>
          </div>
          
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
        </div>,
        document.body
      )}
    </div>
  )
}

export default StorePage
