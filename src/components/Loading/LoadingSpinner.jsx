import React from 'react'
import { FiShield, FiSliders, FiShoppingBag, FiLayers } from 'react-icons/fi'
import { CgSpinner } from 'react-icons/cg'
import './loading.css'

const LoadingSpinner = ({ text = "Yüklənir...", fullScreen = true, iconType = "default" }) => {
  const renderIcon = () => {
    switch (iconType) {
      case 'admin':
        return <FiShield className="spinner-inner-icon" />
      case 'seller':
        return <FiSliders className="spinner-inner-icon" />
      case 'catalog':
        return <FiLayers className="spinner-inner-icon" />
      default:
        return <CgSpinner className="spinner-inner-icon" />
    }
  }

  return (
    <div className={`luxury-loading-container ${fullScreen ? 'fullscreen' : ''}`}>
      <div className="luxury-spinner-box">
        <div className="spinner-outer-ring"></div>
        {renderIcon()}
      </div>
      <div className="luxury-loading-title">PARABOLA</div>
      <div className="luxury-loading-text">{text}</div>
    </div>
  )
}

export default LoadingSpinner
