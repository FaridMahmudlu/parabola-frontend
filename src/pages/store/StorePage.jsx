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
  FiPackage, FiTag, FiClock, FiRotateCcw, FiSliders, FiEdit3,
  FiCamera, FiImage, FiLink, FiType, FiAlignLeft
} from 'react-icons/fi'
import { FaWhatsapp, FaInstagram, FaTiktok } from 'react-icons/fa'
import { GoArrowRight } from "react-icons/go"
import './StorePage.css'
import '../../components/clothing/clothing.css'

// Allowed admin emails list
const ALLOWED_ADMIN_EMAILS = [
  'mleykmahmudlu@gmail.com',
  'fariddmahmudlu2008@gmail.com',
  'qeyisovli@gmail.com'
]

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

  // Store Customization Edit Modal State
  const [showStoreEditModal, setShowStoreEditModal] = useState(false)
  const [editShopName, setEditShopName] = useState('')
  const [editShopPhone, setEditShopPhone] = useState('')
  const [editShopLink, setEditShopLink] = useState('')
  const [editShopBio, setEditShopBio] = useState('')
  const [editAvatarFile, setEditAvatarFile] = useState(null)
  const [editBannerFile, setEditBannerFile] = useState(null)
  const [editAvatarPreview, setEditAvatarPreview] = useState(null)
  const [editBannerPreview, setEditBannerPreview] = useState(null)
  const [savingStoreProfile, setSavingStoreProfile] = useState(false)

  // Size Modal State (100% matching Cothing.jsx)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [modalImageIndex, setModalImageIndex] = useState(0)
  const [imageOpacity, setImageOpacity] = useState(1)
  const [recommendation, setRecommendation] = useState(null)
  const [loadingRecommendation, setLoadingRecommendation] = useState(false)
  const modalRef = useRef(null)

  // Zoom Lightbox State (100% matching Cothing.jsx)
  const [zoomImage, setZoomImage] = useState(null)
  const [zoomScale, setZoomScale] = useState(1)
  const [zoomPan, setZoomPan] = useState({ x: 0, y: 0 })
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
  const fetchStore = useCallback(async () => {
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
        
        // Pre-fill edit modal form
        setEditShopName(res.data.shopName || decodedShopName)
        setEditShopPhone(res.data.contactPhone || '')
        setEditShopLink(res.data.contactLink || '')
        setEditShopBio(res.data.shopBio || '')
        setEditAvatarPreview(res.data.shopAvatarUrl || null)
        setEditBannerPreview(res.data.shopBannerUrl || null)

        if (res.data.shopName) {
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
  }, [decodedShopName, isSignedIn, user, getToken])

  useEffect(() => {
    document.title = decodedShopName ? `${decodedShopName} - Parabola Butik Mağazası` : 'Parabola Store'
    if (decodedShopName) {
      fetchStore()
    }
  }, [decodedShopName, fetchStore])

  // Check authorization for store editing (Owner or Admin)
  const currentUserEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase().trim() || ''
  const isUserAdmin = ALLOWED_ADMIN_EMAILS.includes(currentUserEmail) || user?.publicMetadata?.role === 'ROLE_ADMIN'
  const isStoreOwner = storeData?.sellerEmail && currentUserEmail === storeData.sellerEmail.toLowerCase().trim()
  const isShopNameMatch = storeData?.shopName && user?.publicMetadata?.shopName && storeData.shopName.toLowerCase().trim() === user.publicMetadata.shopName.toLowerCase().trim()
  
  const canEditStore = isSignedIn && (isUserAdmin || isStoreOwner || isShopNameMatch)

  // Open store edit modal
  const handleOpenStoreEditModal = () => {
    if (storeData) {
      setEditShopName(storeData.shopName || decodedShopName)
      setEditShopPhone(storeData.contactPhone || '')
      setEditShopLink(storeData.contactLink || '')
      setEditShopBio(storeData.shopBio || '')
      setEditAvatarPreview(storeData.shopAvatarUrl || null)
      setEditBannerPreview(storeData.shopBannerUrl || null)
    }
    setShowStoreEditModal(true)
  }

  // Save Store Profile Handler
  const handleSaveStoreProfile = async (e) => {
    e.preventDefault()
    setSavingStoreProfile(true)
    try {
      const token = await getToken()
      const clerkRoleHeader = user?.publicMetadata?.role || ""
      const userEmailHeader = user?.primaryEmailAddress?.emailAddress || ""
      
      const formData = new FormData()
      formData.append("originalShopName", storeData?.shopName || decodedShopName || "")
      formData.append("shopName", editShopName)
      formData.append("shopPhone", editShopPhone)
      formData.append("shopLink", editShopLink)
      formData.append("shopBio", editShopBio)
      if (editAvatarFile) formData.append("avatarFile", editAvatarFile)
      if (editBannerFile) formData.append("bannerFile", editBannerFile)

      const res = await axios.put(`${BASE_URL}/api/v1/users/store-profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(clerkRoleHeader ? { "X-Clerk-Role": clerkRoleHeader } : {}),
          ...(userEmailHeader ? { "X-Clerk-User-Email": userEmailHeader } : {})
        }
      })

      if (res.data) {
        setStoreData(prev => ({
          ...prev,
          shopName: res.data.shopName || prev?.shopName,
          shopAvatarUrl: res.data.shopAvatarUrl || prev?.shopAvatarUrl,
          shopBannerUrl: res.data.shopBannerUrl || prev?.shopBannerUrl,
          shopBio: res.data.shopBio || prev?.shopBio,
          contactPhone: res.data.shopPhone || prev?.contactPhone,
          contactLink: res.data.shopLink || prev?.contactLink
        }))

        notification.success({
          message: "Mağaza Profili Yeniləndi",
          description: "Mağaza adınız, profil logonuz, baner şəkliniz və əlaqə məlumatlarınız uğurla saxlanıldı və canlıya tətbiq olundu!"
        })
        setShowStoreEditModal(false)

        const newShopName = res.data.shopName || editShopName
        if (newShopName && newShopName.trim() !== decodedShopName) {
          navigate(`/store/${encodeURIComponent(newShopName.trim())}`, { replace: true })
        } else {
          fetchStore()
        }
      }
    } catch (err) {
      console.error("Mağaza profili yenilənərkən xəta:", err)
      notification.error({
        message: "Xəta Baş Verdi",
        description: err.response?.data?.message || err.message || "Mağaza profili yenilənə bilmədi."
      })
    } finally {
      setSavingStoreProfile(false)
    }
  }

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

  // Try-On Size Analysis Modal Handler (100% matching Cothing.jsx)
  const handleTryOn = async (product) => {
    setSelectedProduct(product)
    setModalImageIndex(0)
    setImageOpacity(1)
    setShowModal(true)
    setSelectedSize('')
    setSelectedColor(product.color ? product.color.split(",")[0].trim() : '')
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
        notification.info({ message: "Əlaqə Nömrəsi Mövcud Deyil" })
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

  const handleShareStore = async () => {
    const cleanUrl = `${window.location.origin}/store/${encodeURIComponent(storeData?.shopName || decodedShopName)}`
    const shareData = {
      title: `${displayShopName} — Parabola`,
      text: `${displayShopName} mağazasına baxın!`,
      url: cleanUrl
    }
    
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        if (err.name !== 'AbortError') {
          navigator.clipboard.writeText(cleanUrl)
          notification.success({ message: 'Link Kopyalandı' })
        }
      }
    } else {
      navigator.clipboard.writeText(cleanUrl)
      notification.success({
        message: 'Link Kopyalandı',
        description: 'Mağaza səhifəsinin keçidi kopyalandı!'
      })
    }
  }

  if (loading) {
    return <LoadingSpinner text="Mağaza səhifəsi yüklənir..." fullScreen={true} />
  }

  const displayShopName = storeData?.shopName || decodedShopName
  
  // Contact info: store profile contacts take priority! Fallback to products if store profile contact is empty.
  const storePhone = (storeData?.contactPhone && storeData.contactPhone.trim()) ? storeData.contactPhone.trim() : ''
  const storeLink = (storeData?.contactLink && storeData.contactLink.trim()) ? storeData.contactLink.trim() : ''
  const productPhone = products.find(p => p.contactPhone && p.contactPhone.trim())?.contactPhone?.trim() || ''
  const productLink = products.find(p => p.contactLink && p.contactLink.trim())?.contactLink?.trim() || ''

  const contactPhone = storePhone || productPhone
  const contactLink = storeLink || productLink
  const formattedPhone = contactPhone ? contactPhone.replace(/[^0-9]/g, '') : ''
  const whatsappUrl = formattedPhone ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(`Salam! ${displayShopName} mağazasından geyim haqqında maraqlanıram.`)}` : ''

  const numCategories = categories.length - 1

  return (
    <div className="store-page-container">
      <Header />

      {/* FULL-WIDTH BANNER SECTION */}
      <div className="store-hero-banner">
        {storeData?.shopBannerUrl && (
          <div 
            className="store-banner-bg" 
            style={{ backgroundImage: `url('${storeData.shopBannerUrl}')` }} 
          />
        )}
        <div className="store-banner-gradient" />
        
        <div className="store-banner-content">
          {/* Navigation Row */}
          <div className="store-nav-row">
            <button className="store-back-btn" onClick={() => navigate('/')}>
              <FiArrowLeft /> Ana Səhifəyə Qayıt
            </button>
            <div className="store-nav-actions">
              {canEditStore && (
                <button 
                  className="store-icon-btn" 
                  onClick={handleOpenStoreEditModal}
                  title="Mağaza profilini redaktə et"
                >
                  <FiEdit3 />
                </button>
              )}
              <button 
                className="store-icon-btn" 
                onClick={handleShareStore}
                title="Mağazanı paylaş"
              >
                <FiShare2 />
              </button>
            </div>
          </div>

          {/* Profile Section */}
          <div className="store-profile-section">
            <div className="store-avatar-circle">
              {storeData?.shopAvatarUrl ? (
                <img src={storeData.shopAvatarUrl} alt={displayShopName} />
              ) : (
                <FiShoppingBag />
              )}
            </div>
            
            <div className="store-profile-info">
              <h1 className="store-title-name">{displayShopName}</h1>
              {storeData?.shopBio && storeData.shopBio.trim() && (
                <p className="store-tagline">{storeData.shopBio.trim()}</p>
              )}
              <div className="store-badges-row">
                <span className="store-badge verified">
                  <FiCheckCircle /> Təsdiqlənmiş Butik
                </span>
                <span className="store-badge count">
                  <FiPackage style={{ marginRight: '4px' }} /> {products.length} Məhsul
                </span>
                {numCategories > 0 && (
                  <span className="store-badge count">
                    <FiTag style={{ marginRight: '4px' }} /> {numCategories} Kateqoriya
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Bar (Stats + Contacts) */}
      <div className="store-info-bar">
        <div className="store-stats-row">
          {products.length > 0 && (
            <div className="store-stat">
              <span className="store-stat-value">{products.length}</span> məhsul
            </div>
          )}
          {numCategories > 0 && (
            <>
              <div className="store-stat-divider" />
              <div className="store-stat">
                <span className="store-stat-value">{numCategories}</span> kateqoriya
              </div>
            </>
          )}
          {priceMin !== null && (
            <>
              <div className="store-stat-divider" />
              <div className="store-stat">
                <span className="store-stat-value">
                  {priceMin === priceMax ? `${priceMin} ₼` : `${priceMin} - ${priceMax} ₼`}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="store-contact-row">
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="store-contact-btn whatsapp">
              <FaWhatsapp /> WhatsApp
            </a>
          )}
          {contactLink && (
            <a href={contactLink} target="_blank" rel="noopener noreferrer" className="store-contact-btn social">
              {contactLink.toLowerCase().includes('instagram') ? <FaInstagram /> : contactLink.toLowerCase().includes('tiktok') ? <FaTiktok /> : <FiLink />} Sosial Media
            </a>
          )}
          {contactPhone && (
            <a href={`tel:${contactPhone}`} className="store-contact-btn phone">
              <FiPhone /> Zəng Et
            </a>
          )}
        </div>
      </div>

      {/* Main Content Section */}
      <div className="store-main-section">
        {/* Compact Filter Bar */}
        <div className="store-filter-bar">
          <div className="filter-search-box">
            <FiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Geyim axtar..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-icon" onClick={() => setSearchQuery('')}>
                <FiX />
              </button>
            )}
          </div>

          <select 
            className="filter-select-compact"
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
          >
            {gendersList.map((g, idx) => (
              <option key={idx} value={g}>{g === 'Hamısı' ? 'Bütün Cinslər' : g}</option>
            ))}
          </select>

          <select 
            className="filter-select-compact"
            value={selectedSizeFilter}
            onChange={(e) => setSelectedSizeFilter(e.target.value)}
          >
            {sizesList.map((sz, idx) => (
              <option key={idx} value={sz}>{sz === 'Hamısı' ? 'Bütün Ölçülər' : sz}</option>
            ))}
          </select>

          <div className="filter-price-compact">
            <input 
              type="number" 
              placeholder="Min ₼" 
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              min="0"
            />
            <span className="price-sep">-</span>
            <input 
              type="number" 
              placeholder="Max ₼" 
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              min="0"
            />
          </div>

          <select 
            className="filter-select-compact"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Ən yeni</option>
            <option value="price-low">Ucuzdan</option>
            <option value="price-high">Bahadan</option>
            <option value="name">A-Z</option>
          </select>

          {activeFilterCount > 0 && (
            <button className="filter-reset-btn" onClick={handleResetAllFilters}>
              <FiRotateCcw /> Sıfırla
            </button>
          )}
        </div>

        {/* Category Pills */}
        {categories.length > 1 && (
          <div className="store-category-pills">
            {categories.map((cat, idx) => (
              <button 
                key={idx}
                className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat === 'Hamısı' ? 'Bütün Kateqoriyalar' : cat}
              </button>
            ))}
          </div>
        )}

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

      {/* Premium Store Profile Edit Modal */}
      {showStoreEditModal && (
        <div className="store-edit-overlay" onClick={() => setShowStoreEditModal(false)}>
          <div className="store-edit-modal" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="edit-modal-header">
              <div className="edit-modal-header-left">
                <div className="edit-modal-header-icon"><FiEdit3 /></div>
                <h2 className="edit-modal-title">Mağaza Profilini Redaktə Et</h2>
              </div>
              <button className="edit-modal-close" onClick={() => setShowStoreEditModal(false)} aria-label="Bağla">
                <FiX />
              </button>
            </div>
            
            <form onSubmit={handleSaveStoreProfile}>
              <div className="edit-modal-body">
                {/* Shop Name */}
                <div className="edit-field">
                  <label className="edit-field-label"><FiType /> Mağaza Adı</label>
                  <input 
                    type="text" 
                    value={editShopName} 
                    onChange={(e) => setEditShopName(e.target.value)}
                    placeholder="Məs: Parabola Luxury"
                    required
                  />
                </div>

                {/* Phone + Social Link Row */}
                <div className="edit-field-row">
                  <div className="edit-field">
                    <label className="edit-field-label"><FiPhone /> Əlaqə Telefonu</label>
                    <input 
                      type="text" 
                      value={editShopPhone} 
                      onChange={(e) => setEditShopPhone(e.target.value)}
                      placeholder="+994 50 123 45 67"
                    />
                  </div>
                  <div className="edit-field">
                    <label className="edit-field-label"><FiLink /> Sosial Media</label>
                    <input 
                      type="text" 
                      value={editShopLink} 
                      onChange={(e) => setEditShopLink(e.target.value)}
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                </div>

                {/* Bio / Description */}
                <div className="edit-field">
                  <label className="edit-field-label"><FiAlignLeft /> Açıqlama</label>
                  <textarea 
                    rows="3"
                    value={editShopBio} 
                    onChange={(e) => setEditShopBio(e.target.value)}
                    placeholder="Mağazanız haqqında müştərilərə məlumat verin..."
                  />
                </div>

                {/* Premium File Uploads — Drag-Drop Style */}
                <div className="edit-field-row">
                  <div className="edit-upload-area">
                    <label className="edit-field-label"><FiCamera /> Profil Şəkli</label>
                    <div className={`edit-upload-zone ${editAvatarPreview ? 'has-preview' : ''}`}>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            setEditAvatarFile(e.target.files[0])
                            setEditAvatarPreview(URL.createObjectURL(e.target.files[0]))
                          }
                        }}
                      />
                      {editAvatarPreview ? (
                        <img src={editAvatarPreview} alt="Profil" className="edit-avatar-preview" />
                      ) : (
                        <>
                          <FiCamera className="edit-upload-icon" />
                          <div className="edit-upload-text"><span>Şəkil seçin</span></div>
                          <div className="edit-upload-hint">Maks. 5MB</div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="edit-upload-area">
                    <label className="edit-field-label"><FiImage /> Arxa Fon (Banner)</label>
                    <div className={`edit-upload-zone ${editBannerPreview ? 'has-preview' : ''}`}>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            setEditBannerFile(e.target.files[0])
                            setEditBannerPreview(URL.createObjectURL(e.target.files[0]))
                          }
                        }}
                      />
                      {editBannerPreview ? (
                        <img src={editBannerPreview} alt="Banner" className="edit-banner-preview" />
                      ) : (
                        <>
                          <FiImage className="edit-upload-icon" />
                          <div className="edit-upload-text"><span>Banner seçin</span></div>
                          <div className="edit-upload-hint">Maks. 5MB</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="edit-modal-footer">
                <button 
                  type="button"
                  className="edit-cancel-btn"
                  onClick={() => setShowStoreEditModal(false)}
                >
                  Ləğv Et
                </button>
                <button 
                  type="submit"
                  className="edit-save-btn"
                  disabled={savingStoreProfile}
                >
                  {savingStoreProfile ? (
                    <><span className="edit-saving-spinner"></span>Saxlanılır...</>
                  ) : 'Yadda Saxla'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
                
                {/* Score Circle & User Authentication Status (100% matching Cothing.jsx) */}
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
                  <div style={{ fontSize: '12px' }}><span style={{ color: '#7a7570' }}>Kateqoriya:</span> <span style={{ color: 'white' }}>{selectedProduct.category || "Təyin edilməyib"}</span></div>
                </div>

                {/* Geyim Haqqında Description */}
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
                      {getSortedUniqueSizes(selectedProduct.sizes).map(s => (
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

                {/* Smart Size Recommendation Message */}
                <div className="section" style={{ marginTop: '20px', position: 'relative', overflow: 'hidden', borderRadius: '4px' }}>
                  <div className="section-label">AĞILLI ÖLÇÜ TÖVSİYƏSİ</div>
                  <div 
                    className="recommendation" 
                    style={{ 
                      color: '#c9a96e', 
                      fontSize: '14px', 
                      lineHeight: '1.6', 
                      marginTop: '5px',
                      filter: !isSignedIn ? 'blur(5px)' : 'none',
                      pointerEvents: !isSignedIn ? 'none' : 'auto',
                      userSelect: !isSignedIn ? 'none' : 'auto',
                      minHeight: !isSignedIn ? '60px' : 'auto'
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
                    <div style={{
                      position: 'absolute',
                      top: '20px',
                      left: 0,
                      width: '100%',
                      height: 'calc(100% - 20px)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 2,
                      textAlign: 'center',
                      background: 'rgba(0,0,0,0.4)',
                      padding: '10px'
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#c9a96e', fontFamily: 'Montserrat, sans-serif', textTransform: 'uppercase', letterSpacing: '1px', textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}>
                        Ölçü tövsiyəsini görmək üçün
                      </span>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                        <a href="/login" style={{ fontSize: '10px', fontWeight: '700', color: '#000', background: '#c9a96e', padding: '4px 12px', borderRadius: '4px', textDecoration: 'none', transition: 'all 0.2s', fontFamily: 'Montserrat, sans-serif' }}>Daxil Ol</a>
                        <a href="/register" style={{ fontSize: '10px', fontWeight: '700', color: '#c9a96e', border: '1px solid #c9a96e', padding: '3px 11px', borderRadius: '4px', textDecoration: 'none', transition: 'all 0.2s', fontFamily: 'Montserrat, sans-serif' }}>Qeydiyyat</a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Geyim Kəsimi və Manken Uyğunluğu */}
                {selectedProduct.sizes && selectedProduct.sizes.length > 0 && (
                  <div className="section" style={{ marginTop: '20px' }}>
                    <div className="section-label" style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#7a7570' }}>GEYİM KƏSİMİ VƏ ÖLÇÜ DETALLARI</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                      {getSortedUniqueSizes(selectedProduct.sizes).map(s => (
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

                {/* Direct Order Actions */}
                {(selectedProduct.contactPhone || selectedProduct.contactLink || storeData?.contactPhone || storeData?.contactLink) && (
                  <div className="section" style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div className="section-label" style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#7a7570' }}>SİFARİŞ VƏ ƏLAQƏ</div>
                    {(selectedProduct.contactPhone || storeData?.contactPhone) && (
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
                          width: '100%',
                          background: '#25d366'
                        }}
                      >
                        <FaWhatsapp style={{ fontSize: '18px' }} /> WhatsApp ilə Sifariş
                      </button>
                    )}
                    {(selectedProduct.contactLink || storeData?.contactLink) && (
                      <button 
                        onClick={() => handleOrderMessage('social')}
                        className={`contact-seller-btn ${(selectedProduct.contactLink || storeData?.contactLink || '').toLowerCase().includes('tiktok') ? 'tiktok-btn' : 'instagram-btn'}`}
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
                          width: '100%',
                          background: 'linear-gradient(135deg, #e1306c, #f56040)'
                        }}
                      >
                        <FaInstagram style={{ fontSize: '18px' }} /> Sosyal Media (Butik DM)
                      </button>
                    )}
                  </div>
                )}
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
                transition: 'transform 0.15s ease'
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
