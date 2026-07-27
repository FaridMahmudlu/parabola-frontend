import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { GoArrowRight } from "react-icons/go"
import axios from "axios"
import "./clothing.css"
import AOS from "aos"
import "aos/dist/aos.css"
import { BASE_URL } from '../../pages/config'
import { useUser, useAuth } from '@clerk/clerk-react'
import { notification } from 'antd'
import { FiChevronLeft, FiChevronRight, FiMaximize2, FiX, FiZoomIn, FiZoomOut, FiRefreshCw } from 'react-icons/fi'
import { FaWhatsapp, FaInstagram, FaTiktok, FaPhone } from 'react-icons/fa'
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
  const [zoomScale, setZoomScale] = useState(1)
  const [zoomPan, setZoomPan] = useState({ x: 0, y: 0 })
  const [zoomOpacity, setZoomOpacity] = useState(1)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
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

  const handleOpenZoom = (imgUrl) => {
    const items = getLightboxItems();
    let initialIdx = items.findIndex(it => it.url === imgUrl);
    if (initialIdx === -1) initialIdx = 0;
    setModalImageIndex(initialIdx);
    setZoomImage(items[initialIdx] ? items[initialIdx].url : imgUrl);
    setZoomScale(1);
    setZoomPan({ x: 0, y: 0 });
    setZoomOpacity(1);
  };

  const handleCloseZoom = (e) => {
    if (e) e.stopPropagation();
    setZoomOpacity(0);
    setTimeout(() => {
      setZoomImage(null);
      setZoomScale(1);
      setZoomPan({ x: 0, y: 0 });
    }, 180);
  };

  const handleLightboxNav = (e, direction) => {
    if (e) e.stopPropagation();
    const items = getLightboxItems();
    if (items.length <= 1) return;
    setZoomOpacity(0.3);
    setTimeout(() => {
      let newIndex;
      if (direction === 'next') {
        newIndex = (modalImageIndex + 1) % items.length;
      } else {
        newIndex = (modalImageIndex - 1 + items.length) % items.length;
      }
      const targetItem = items[newIndex] || items[0];
      setModalImageIndex(newIndex);
      setZoomImage(targetItem.url);
      if (targetItem.product && (!selectedProduct || targetItem.product.id !== selectedProduct.id)) {
        setSelectedProduct(targetItem.product);
      }
      setZoomScale(1);
      setZoomPan({ x: 0, y: 0 });
      setZoomOpacity(1);
    }, 120);
  };

  const handleSelectLightboxThumbnail = (e, idx) => {
    if (e) e.stopPropagation();
    const items = getLightboxItems();
    if (items.length === 0) return;
    const validIdx = idx % items.length;
    const targetItem = items[validIdx] || items[0];
    setZoomOpacity(0.3);
    setTimeout(() => {
      setModalImageIndex(validIdx);
      setZoomImage(targetItem.url);
      if (targetItem.product && (!selectedProduct || targetItem.product.id !== selectedProduct.id)) {
        setSelectedProduct(targetItem.product);
      }
      setZoomScale(1);
      setZoomPan({ x: 0, y: 0 });
      setZoomOpacity(1);
    }, 120);
  };

  const handleZoomIn = (e) => {
    if (e) e.stopPropagation();
    setZoomScale(prev => Math.min(3.5, Number((prev + 0.5).toFixed(1))));
  };

  const handleZoomOut = (e) => {
    if (e) e.stopPropagation();
    setZoomScale(prev => {
      const next = Math.max(1, Number((prev - 0.5).toFixed(1)));
      if (next === 1) setZoomPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = (e) => {
    if (e) e.stopPropagation();
    setZoomScale(1);
    setZoomPan({ x: 0, y: 0 });
  };

  const handleToggleZoomClick = (e) => {
    e.stopPropagation();
    if (zoomScale > 1) {
      setZoomScale(1);
      setZoomPan({ x: 0, y: 0 });
    } else {
      setZoomScale(2.2);
    }
  };

  const handleWheelZoom = (e) => {
    e.stopPropagation();
    if (e.deltaY < 0) {
      setZoomScale(prev => Math.min(3.5, Number((prev + 0.25).toFixed(2))));
    } else {
      setZoomScale(prev => {
        const next = Math.max(1, Number((prev - 0.25).toFixed(2)));
        if (next === 1) setZoomPan({ x: 0, y: 0 });
        return next;
      });
    }
  };

  const handleMouseDownPan = (e) => {
    if (zoomScale <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - zoomPan.x, y: e.clientY - zoomPan.y });
  };

  const handleMouseMovePan = (e) => {
    if (!isDragging || zoomScale <= 1) return;
    e.preventDefault();
    setZoomPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUpPan = () => {
    setIsDragging(false);
  };

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
    return list
  }

  const getLightboxItems = () => {
    const items = []
    
    // 1. Own images of selectedProduct
    if (selectedProduct) {
      const ownList = getModalImages()
      ownList.forEach(url => {
        items.push({ url, product: selectedProduct })
      })
    }

    // 2. Add all other products from catalog so user can slide through all clothing photos!
    if (Array.isArray(products)) {
      products.forEach(p => {
        if (selectedProduct && p.id === selectedProduct.id) return
        if (p.imageUrl && typeof p.imageUrl === 'string' && p.imageUrl.trim()) {
          const u = p.imageUrl.trim()
          if (!items.some(it => it.url === u)) {
            items.push({ url: u, product: p })
          }
        }
        if (Array.isArray(p.imageUrls)) {
          p.imageUrls.forEach(url => {
            if (url && typeof url === 'string' && url.trim()) {
              const u = url.trim()
              if (!items.some(it => it.url === u)) {
                items.push({ url: u, product: p })
              }
            }
          })
        }
      })
    }
    return items
  }

  const getLightboxImages = () => {
    return getLightboxItems().map(item => item.url)
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
                    onTouchEnd={handleModalTouchEnd}
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
                    <span className="price-badge" style={{ padding: '8px 16px', fontSize: '16px' }}>{selectedProduct.price ? `${selectedProduct.price} AZN` : ""}</span>
                  </div>

                  {/* Product Specification Grid */}
                  <div className="product-spec-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px', marginTop: '16px', padding: '12px', border: '1px solid #1f1f1f', borderRadius: '4px', background: '#070707' }}>
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
          </div>,
          document.body
        )}

        {/* Zoom Lightbox fullscreen overlay */}
        {zoomImage && createPortal(
          <div 
            className="zoom-lightbox-overlay" 
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseZoom(e);
              }
            }} 
            onWheel={handleWheelZoom}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', zIndex: 100000000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {/* Top Control Toolbar */}
            <div className="lightbox-controls-top" onClick={(e) => e.stopPropagation()}>
              <button className="lightbox-btn" onClick={(e) => handleZoomOut(e)} title="Kiçilt (-)">
                <FiZoomOut />
              </button>
              <span className="lightbox-scale-badge" onClick={(e) => handleResetZoom(e)} title="Əvvəlki ölçüyə qaytar">
                {Math.round(zoomScale * 100)}%
              </span>
              <button className="lightbox-btn" onClick={(e) => handleZoomIn(e)} title="Böyüt (+)">
                <FiZoomIn />
              </button>
              <button className="lightbox-btn" onClick={(e) => handleResetZoom(e)} title="Sıfırla">
                <FiRefreshCw style={{ fontSize: '15px' }} />
              </button>
              <button className="lightbox-close-btn" onClick={(e) => handleCloseZoom(e)} title="Bağla">
                <FiX />
              </button>
            </div>

            {/* Navigation Arrows */}
            {getLightboxImages().length > 1 && (
              <>
                <button 
                  className="lightbox-nav-btn prev"
                  onClick={(e) => handleLightboxNav(e, 'prev')}
                  title="Əvvəlki şəkil / geyim"
                  style={{ position: 'absolute', left: '24px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', fontSize: '28px', width: '52px', height: '52px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 100005, transition: 'all 0.2s ease' }}
                >
                  <FiChevronLeft />
                </button>

                <button 
                  className="lightbox-nav-btn next"
                  onClick={(e) => handleLightboxNav(e, 'next')}
                  title="Növbəti şəkil / geyim"
                  style={{ position: 'absolute', right: '24px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', fontSize: '28px', width: '52px', height: '52px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 100005, transition: 'all 0.2s ease' }}
                >
                  <FiChevronRight />
                </button>
              </>
            )}

            {/* Thumbnail Strip / Counter */}
            {getLightboxImages().length > 1 ? (
              <div className="lightbox-thumbnails-strip" onClick={(e) => e.stopPropagation()}>
                {getLightboxImages().map((imgUrl, idx) => (
                  <div 
                    key={idx} 
                    className={`lightbox-thumbnail ${idx === modalImageIndex ? 'active' : ''}`}
                    onClick={(e) => handleSelectLightboxThumbnail(e, idx)}
                  >
                    <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ position: 'absolute', bottom: '24px', background: 'rgba(0,0,0,0.7)', color: '#c9a96e', padding: '6px 18px', borderRadius: '20px', fontSize: '13px', fontFamily: 'Montserrat, sans-serif', border: '1px solid rgba(201,169,110,0.3)', zIndex: 100005, letterSpacing: '1px' }}>
                1 / 1
              </div>
            )}

            {/* Main Lightbox Image */}
            <div 
              onClick={(e) => e.stopPropagation()}
              onMouseDown={handleMouseDownPan}
              onMouseMove={handleMouseMovePan}
              onMouseUp={handleMouseUpPan}
              onMouseLeave={handleMouseUpPan}
              style={{
                maxWidth: '88vw',
                maxHeight: '82vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'visible',
                cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'
              }}
            >
              <img 
                src={zoomImage || getLightboxImages()[modalImageIndex] || selectedProduct?.imageUrl} 
                alt="Böyüdülmüş geyim baxışı" 
                onClick={handleToggleZoomClick}
                onError={(e) => {
                  const fallbackList = getLightboxImages();
                  if (fallbackList.length > 0 && e.target.src !== fallbackList[0]) {
                    e.target.src = fallbackList[0];
                  }
                }}
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '82vh', 
                  objectFit: 'contain', 
                  borderRadius: '6px', 
                  boxShadow: '0 25px 60px rgba(0,0,0,0.9)', 
                  opacity: zoomOpacity,
                  transform: `scale(${zoomScale}) translate(${zoomPan.x / zoomScale}px, ${zoomPan.y / zoomScale}px)`,
                  transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease',
                  userSelect: 'none',
                  WebkitUserDrag: 'none'
                }} 
              />
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  )
}

export default Clothing
