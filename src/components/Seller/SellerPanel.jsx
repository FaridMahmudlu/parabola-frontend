import React, { useEffect, useState } from "react";
import axios from "axios";
import "./seller.css";
import Header from "../Header/Header";
import CustomSelect from "../CustomSelect/CustomSelect";
import { Navigate, Link } from "react-router-dom";
import { BASE_URL, translateError } from "../../pages/config";
import { notification } from "antd";
import { useUser, useAuth } from "@clerk/clerk-react";
import { trackProductCreate } from "../../utils/analytics";
import { FiEdit2, FiTrash2, FiX, FiUploadCloud } from "react-icons/fi";
import { FaWhatsapp, FaInstagram } from "react-icons/fa";

const SellerPanel = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  // Form state
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [contactLink, setContactLink] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [gender, setGender] = useState("");
  const [selectedSizes, setSelectedSizes] = useState({}); // size -> fit
  const [selectedColors, setSelectedColors] = useState({}); // colorName -> boolean
  const [style, setStyle] = useState("");
  const [description, setDescription] = useState("");

  // Edit mode
  const [editingId, setEditingId] = useState(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState(null);

  const [status, setStatus] = useState({ loading: false, error: null, ok: false });
  const [products, setProducts] = useState([]);
  const [sellerShopName, setSellerShopName] = useState("");
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchMyProducts = async () => {
    if (!isSignedIn) return;
    
    const cacheKey = `parabola_seller_products_${user?.id}`
    try {
      // Load cached products first inside try-catch to avoid crashes
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        try {
          setProducts(JSON.parse(cached))
        } catch (e) {
          localStorage.removeItem(cacheKey)
        }
      }

      const token = await getToken();
      const res = await axios.get(`${BASE_URL}/api/v1/products/my`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "X-Clerk-Role": user?.publicMetadata?.role
        }
      });
      setProducts(res.data);
      // Update cache
      localStorage.setItem(cacheKey, JSON.stringify(res.data))
    } catch (err) {
      console.error("Məhsullar yüklənmədi:", err);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!isSignedIn) return;
      try {
        const token = await getToken();
        const { data } = await axios.get(`${BASE_URL}/api/v1/users/profile`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            "X-Clerk-Role": user?.publicMetadata?.role
          }
        });
        if (data && data.shopName) {
          setSellerShopName(data.shopName);
        } else {
          setSellerShopName("");
        }
      } catch (error) {
        console.error("Profil məlumatları yüklənmədi:", error);
      } finally {
        setProfileLoading(false);
      }
    };

    if (isSignedIn) {
      fetchProfile();
      fetchMyProducts();
    }
  }, [isSignedIn, getToken]);

  if (!isLoaded || profileLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#c9a96e' }}>Yüklənir...</div>;
  }

  if (!isSignedIn || user?.publicMetadata?.role !== "ROLE_SELLER") {
    return <Navigate to="/" />;
  }

  const clearForm = () => {
    setName("");
    setBrand("");
    setCategory("");
    setPrice("");
    setContactLink("");
    setContactPhone("");
    setFiles([]);
    setPreviews([]);
    setGender("");
    setSelectedSizes({});
    setSelectedColors({});
    setStyle("");
    setDescription("");
    setEditingId(null);
    const imageInput = document.getElementById("image");
    if (imageInput) imageInput.value = "";
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setName(product.name || "");
    setBrand(product.brand || "");
    setCategory(product.category || "");
    setPrice(product.price ? String(product.price) : "");
    setContactLink(product.contactLink || "");
    setContactPhone(product.contactPhone || "");
    setGender(product.gender || "");
    
    // Extract colors
    const colorsObj = {};
    if (product.color) {
      product.color.split(",").forEach(c => {
        colorsObj[c.trim()] = true;
      });
    }
    setSelectedColors(colorsObj);

    setStyle(product.style || "");
    setDescription(product.description || "");
    
    // Extract sizes
    const sizesObj = {};
    if (product.sizes) {
      product.sizes.forEach(s => {
        sizesObj[s.sizeName] = s.clothingFit || "Orta";
      });
    }
    setSelectedSizes(sizesObj);

    setFiles([]);
    setPreviews(product.imageUrls || (product.imageUrl ? [product.imageUrl] : []));
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = [];
    const newPreviews = [];
    
    for (let f of selectedFiles) {
      if (f.size > 5 * 1024 * 1024) {
        notification.error({
          message: "Maksimum 5MB",
          description: `${f.name} faylı çox böyükdür.`
        });
        continue;
      }
      if (!f.type.startsWith("image/")) {
        notification.error({
          message: "Format xətası",
          description: `${f.name} şəkil faylı deyil.`
        });
        continue;
      }
      validFiles.push(f);
      newPreviews.push(URL.createObjectURL(f));
    }
    
    setFiles(validFiles);
    setPreviews(newPreviews);
  };

  const handleDelete = async (id) => {
    try {
      const token = await getToken();
      await axios.delete(`${BASE_URL}/api/v1/products/${id}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "X-Clerk-Role": user?.publicMetadata?.role
        }
      });
      setProducts(prev => {
        const next = prev.filter(p => p.id !== id);
        localStorage.setItem(`parabola_seller_products_${user?.id}`, JSON.stringify(next));
        return next;
      });
      notification.success({
        message: "Məhsul silindi",
        description: "Seçilmiş məhsul kataloqdan silindi."
      });
      setDeletingId(null);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      notification.error({
        message: "Silinmə zamanı xəta",
        description: translateError(errMsg)
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, ok: false });

    if (!sellerShopName || !sellerShopName.trim()) {
      setStatus({ loading: false, error: "Məhsul yarada bilmək üçün profilinizdə mütləq Mağaza Adı daxil etməlisiniz!", ok: false });
      return;
    }

    if (!gender || !style || !name || !brand || !category || !price) {
      setStatus({ loading: false, error: "Zəhmət olmasa bütün vacib geyim məlumatlarını daxil edin.", ok: false });
      return;
    }

    const colorString = Object.keys(selectedColors).filter(c => selectedColors[c]).join(", ");
    if (!colorString) {
      setStatus({ loading: false, error: "Zəhmət olmasa ən azı bir geyim rəngi seçin.", ok: false });
      return;
    }

    if (Object.keys(selectedSizes).length === 0) {
      setStatus({ loading: false, error: "Zəhmət olmasa ən azı bir ölçü seçin.", ok: false });
      return;
    }

    if (!contactPhone.trim() && !contactLink.trim()) {
      setStatus({ loading: false, error: "Ən azı bir əlaqə vasitəsi (Telefon/WhatsApp və ya Instagram/TikTok linki) daxil edilməlidir.", ok: false });
      return;
    }

    if (!editingId && files.length === 0) {
      setStatus({ loading: false, error: "Zəhmət olmasa məhsulun real şəklini yükləyin.", ok: false });
      return;
    }

    const sizesList = Object.entries(selectedSizes).map(([size, fit]) => ({
      sizeName: size,
      clothingFit: fit,
      modelBodyType: ""
    }));

    const productPayload = {
      name, brand, category,
      price: parseFloat(price),
      contactLink: contactLink.trim() || null,
      contactPhone: contactPhone.trim() || null,
      gender, 
      color: colorString, 
      style, 
      description,
      sizes: sizesList
    };

    const formData = new FormData();
    formData.append("product", JSON.stringify(productPayload));
    
    if (files && files.length > 0) {
      files.forEach(f => {
        formData.append("images", f);
      });
    } else if (editingId) {
      // Send dummy empty file to satisfy @RequestPart
      const blob = new Blob([""], { type: "application/octet-stream" });
      formData.append("images", blob, "empty");
    }

    try {
      const token = await getToken();

      if (editingId) {
        // UPDATE
        const res = await axios.put(`${BASE_URL}/api/v1/products/${editingId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
            "X-Clerk-Role": user?.publicMetadata?.role
          }
        });
        const updatedProduct = res.data;
        setProducts(prev => {
          const next = prev.map(p => p.id === editingId ? updatedProduct : p);
          localStorage.setItem(`parabola_seller_products_${user?.id}`, JSON.stringify(next));
          return next;
        });
        notification.success({
          message: "Məhsul yeniləndi",
          description: "Məhsul məlumatları yeniləndi."
        });
      } else {
        // CREATE
        const res = await axios.post(`${BASE_URL}/api/v1/products`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
            "X-Clerk-Role": user?.publicMetadata?.role
          }
        });
        const createdProduct = res.data;
        setProducts(prev => {
          const next = [createdProduct, ...prev];
          localStorage.setItem(`parabola_seller_products_${user?.id}`, JSON.stringify(next));
          return next;
        });
        trackProductCreate({
          name: createdProduct.name,
          price: createdProduct.price,
          brand: createdProduct.brand,
          category: createdProduct.category,
          sizes: createdProduct.sizes?.map(s => s.sizeName),
          colors: createdProduct.color ? createdProduct.color.split(",").map(c => c.trim()) : [],
        });
        notification.success({
          message: "Məhsul əlavə edildi",
          description: "Yeni məhsul kataloqa yerləşdirildi."
        });
      }

      setStatus({ loading: false, error: null, ok: true });
      clearForm();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || err.message;
      setStatus({
        loading: false,
        error: translateError(errMsg),
        ok: false,
      });
    }
  };

  return (
    <>
      <Header />
      <div className="panel-wrapper">
        <header className="panel-header">
          <h1 className="panel-title">Satıcı Paneli</h1>
          <p className="panel-subtitle">
            {editingId ? "Məhsulu redaktə edin." : "Yeni geyim əlavə edin."}
          </p>
        </header>
        {!sellerShopName ? (
          <div className="panel-card" style={{ border: '1px solid #ff4d4f', background: 'rgba(255, 77, 79, 0.05)', textAlign: 'center', padding: '40px 20px', maxWidth: '800px', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <div style={{ color: '#ff4d4f', fontSize: '48px' }}>⚠️</div>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', color: '#fff', margin: 0 }}>Mağaza Adı Tələb Olunur</h2>
            <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.6', margin: '0 0 10px 0', maxWidth: '500px' }}>
              Məhsul əlavə edə bilmək üçün profilinizdə mütləq <strong>Mağaza adı</strong> təyin etməlisiniz.
            </p>
            <Link to="/profile" style={{ display: 'inline-block', background: '#c9a96e', color: 'black', padding: '12px 30px', borderRadius: '4px', textDecoration: 'none', fontWeight: '600', fontFamily: 'Montserrat, sans-serif', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Profilə Keç
            </Link>
          </div>
        ) : (
          <div className="panel-card">
            {editingId && (
              <div className="edit-banner">
                <span>Redaktə rejimi — ID: {editingId}</span>
                <button className="cancel-edit-btn" onClick={clearForm}>
                  <FiX /> Ləğv et
                </button>
              </div>
            )}
            <form className="panel-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              
              <div className="form-field">
                <label htmlFor="name">Geyim adı</label>
                <input
                  id="name" type="text" placeholder="məs: Klassik köynək"
                  value={name} onChange={(e) => setName(e.target.value)} required
                />
              </div>

              <div className="form-field">
                <label>Cins</label>
                <CustomSelect value={gender} onChange={(e) => setGender(e.target.value)}
                  options={[
                    { value: "Kişi", label: "Kişi" },
                    { value: "Qadın", label: "Qadın" },
                    { value: "Unisex", label: "Unisex" }
                  ]} placeholder="Seçin"
                />
              </div>

              <div className="form-field form-field--full" style={{ border: '1px solid #1a1a1a', padding: '20px', borderRadius: '4px', background: '#090909', marginTop: '10px' }}>
                <label style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#c9a96e', marginBottom: '15px', display: 'block', textTransform: 'uppercase' }}>Geyim Ölçüləri və Kəsim (Fit)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {["XS", "S", "M", "L", "XL", "XXL", "3XL"].map((size) => {
                    const isChecked = !!selectedSizes[size];
                    return (
                      <div key={size} style={{ display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'space-between', borderBottom: '1px solid #141414', paddingBottom: '8px' }}>
                        <label className="custom-checkbox-container">
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            onChange={(e) => {
                              const next = { ...selectedSizes };
                              if (e.target.checked) {
                                next[size] = "Orta";
                              } else {
                                delete next[size];
                              }
                              setSelectedSizes(next);
                            }}
                          />
                          <span className="checkmark"></span>
                          <span className="label-text">{size}</span>
                        </label>
                        {isChecked && (
                          <div style={{ width: '180px' }}>
                            <CustomSelect 
                              value={selectedSizes[size]} 
                              onChange={(e) => {
                                const next = { ...selectedSizes };
                                next[size] = e.target.value;
                                setSelectedSizes(next);
                              }}
                              options={[
                                { value: "Kiçik", label: "Kiçik (Slim-fit)" },
                                { value: "Orta kiçik", label: "Orta kiçik" },
                                { value: "Orta", label: "Orta (Regular)" },
                                { value: "Orta geniş", label: "Orta geniş" },
                                { value: "Geniş", label: "Geniş (Oversized)" }
                              ]} 
                              placeholder="Kəsim seçin"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="form-field form-field--full" style={{ border: '1px solid #1a1a1a', padding: '20px', borderRadius: '4px', background: '#090909', marginTop: '10px' }}>
                <label style={{ fontSize: '11px', letterSpacing: '1.5px', color: '#c9a96e', marginBottom: '15px', display: 'block', textTransform: 'uppercase' }}>Geyim Rəngləri (Birdən çox seçilə bilər)</label>
                <div className="color-checkbox-grid">
                  {[
                    { name: "Qara", hex: "#000000" },
                    { name: "Ağ", hex: "#ffffff", border: "1px solid #555" },
                    { name: "Mavi", hex: "#1e90ff" },
                    { name: "Qırmızı", hex: "#ff4d4d" },
                    { name: "Yaşıl", hex: "#2ed573" },
                    { name: "Sarı", hex: "#ffa502" },
                    { name: "Boz", hex: "#747d8c" },
                    { name: "Qəhvəyi", hex: "#8b4513" },
                    { name: "Bej", hex: "#f5f5dc" },
                    { name: "Krem", hex: "#fffdd0" }
                  ].map(({ name, hex, border }) => {
                    const isColorChecked = !!selectedColors[name];
                    return (
                      <label key={name} className="custom-checkbox-container">
                        <input 
                          type="checkbox" 
                          checked={isColorChecked} 
                          onChange={(e) => {
                            const next = { ...selectedColors };
                            if (e.target.checked) {
                              next[name] = true;
                            } else {
                              delete next[name];
                            }
                            setSelectedColors(next);
                          }}
                        />
                        <span className="checkmark"></span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            display: 'inline-block', 
                            width: '10px', 
                            height: '10px', 
                            borderRadius: '50%', 
                            background: hex, 
                            border: border || 'none',
                            boxShadow: '0 0 4px rgba(0,0,0,0.5)'
                          }}></span>
                          <span className="label-text">{name}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="form-field">
                <label>Stil</label>
                <CustomSelect value={style} onChange={(e) => setStyle(e.target.value)}
                  options={[
                    { value: "Klassik", label: "Klassik" }, { value: "İdman", label: "İdman" },
                    { value: "Gündəlik", label: "Gündəlik" }, { value: "Ziyafət", label: "Ziyafət" },
                    { value: "Minimalist", label: "Minimalist" }, { value: "Küçə stili", label: "Küçə stili" }
                  ]} placeholder="Seçin"
                />
              </div>

              <div className="form-field">
                <label htmlFor="brand">Brend</label>
                <input id="brand" type="text" placeholder="məs: Zara, Mango"
                  value={brand} onChange={(e) => setBrand(e.target.value)} required
                />
              </div>

              <div className="form-field">
                <label htmlFor="category">Kateqoriya</label>
                <CustomSelect value={category} onChange={(e) => setCategory(e.target.value)}
                  options={[
                    { value: "Köynək", label: "Köynək" },
                    { value: "Şalvar", label: "Şalvar" },
                    { value: "Gödəkcə / Pencək", label: "Gödəkcə / Pencək" },
                    { value: "T-Shirt", label: "T-Shirt" },
                    { value: "Dəst", label: "Dəst" },
                    { value: "Hudi / Sviter", label: "Hudi / Sviter" },
                    { value: "Don / Yubka", label: "Don / Yubka" },
                    { value: "Ayaqqabı", label: "Ayaqqabı" },
                    { value: "Digər", label: "Digər" }
                  ]} placeholder="Kateqoriya seçin"
                />
              </div>

              <div className="form-field">
                <label htmlFor="price">Qiymət (AZN)</label>
                <input id="price" type="number" step="0.01" placeholder="məs: 45.00"
                  value={price} onChange={(e) => setPrice(e.target.value)} required
                />
              </div>

              <div className="form-field form-field--full">
                <label>Sifariş Və Əlaqə Vasitələri (Ən azı biri mütləqdir)</label>
                <div className="contact-section-card">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#7a7570', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>WhatsApp / Zəng Nömrəsi</span>
                    <div className="contact-input-wrapper">
                      <FaWhatsapp className="contact-input-icon" style={{ color: '#25D366' }} />
                      <input id="contactPhone" type="text" placeholder="məs: +994 50 123 45 67"
                        value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                        style={{ background: '#090909', border: '1px solid #1a1a1a' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#7a7570', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '1px' }}>Instagram / TikTok Linki</span>
                    <div className="contact-input-wrapper">
                      <FaInstagram className="contact-input-icon" style={{ color: '#cc2366' }} />
                      <input id="contactLink" type="url" placeholder="məs: https://instagram.com/mağaza_adı"
                        value={contactLink} onChange={(e) => setContactLink(e.target.value)}
                        style={{ background: '#090909', border: '1px solid #1a1a1a' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-field form-field--full">
                <label>Məhsulun Real Şəkilləri {editingId && <span style={{color: '#7a7570', fontSize: '11px'}}>(dəyişmək istəmirsinizsə boş buraxın)</span>}</label>
                <div 
                  className="modern-uploader"
                  onClick={() => document.getElementById("image").click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add("dragging");
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("dragging");
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("dragging");
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleFileChange({ target: { files: e.dataTransfer.files } });
                    }
                  }}
                >
                  <FiUploadCloud className="uploader-icon" />
                  <span className="uploader-text">Şəkilləri seçmək üçün klikləyin və ya buraya sürükləyin</span>
                  <span className="uploader-subtext">Maksimum 5 şəkil, hər biri ən çox 10 MB (PNG, JPG)</span>
                  <input id="image" type="file" accept="image/*" multiple
                    onChange={handleFileChange}
                    required={!editingId}
                    style={{ display: "none" }}
                  />
                </div>
                {previews.length > 0 && (
                  <div className="image-previews-container" style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                    {previews.map((src, index) => (
                      <div key={index} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #c9a96e', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={src} alt="Önbaxış" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-field form-field--full">
                <label htmlFor="description">Geyim haqqında qısa məlumat (İstəyə bağlı)</label>
                <textarea id="description" placeholder="Geyimin xüsusiyyətləri..."
                  value={description} onChange={(e) => setDescription(e.target.value)} rows="4"
                />
              </div>

            </div>

            {status.error && (
              <div className="form-alert form-alert--error" style={{ marginTop: "20px" }}>⚠ {status.error}</div>
            )}
            {status.ok && (
              <div className="form-alert form-alert--ok" style={{ marginTop: "20px" }}>✓ Əməliyyat uğurla tamamlandı!</div>
            )}

            <button type="submit" className="submit-btn" disabled={status.loading} style={{ marginTop: "30px", width: "100%" }}>
              {status.loading ? "Göndərilir..." : editingId ? "Dəyişiklikləri Yadda Saxla" : "Kataloqa Əlavə Et"}
            </button>
          </form>
        </div>
        )}

        <div className="panel-product">
          <section className="products-section">
            <h2 className="products-title">Mənim məhsullarım ({products.length})</h2>
            {products.length === 0 ? (
              <p className="products-empty">Hələ ki məhsul əlavə etməmisiniz.</p>
            ) : (
              <ul className="products-list">
                {products.map((p) => (
                  <li key={p.id} className={`product-item ${deletingId === p.id ? 'is-deleting' : ''}`}>
                    <div style={{ display: 'flex', gap: '15px', width: '100%', alignItems: 'center' }}>
                      <div style={{ width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, border: '1px solid #1a1a1a' }}>
                        <img 
                          src={p.imageUrls && p.imageUrls.length > 0 ? p.imageUrls[0] : p.imageUrl || "https://gunnandmoore.playwiththebest.com/media/catalog/product/cache/ec4e4c8893a2305e77afd20d2909bacb/7/0/7047_teknik_slipover_white_1.png"} 
                          alt={p.name} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </div>
                      <div className="product-info">
                        <h3 className="product-name">{p.name}</h3>
                        <div className="product-meta">
                          <span>{p.brand}</span>
                          <span>•</span>
                          <span>{p.category}</span>
                          <span>•</span>
                          <span>{p.price ? `${p.price} AZN` : ""}</span>
                          {p.gender && <><span>•</span><span>{p.gender}</span></>}
                          {p.color && <><span>•</span><span>{p.color}</span></>}
                        </div>
                        <div className="product-sizes-badges" style={{ marginTop: "10px" }}>
                          {p.sizes && p.sizes.map(s => (
                            <span key={s.id} style={{ background: "#2a2a2a", color: "#c9a96e", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", marginRight: "5px" }}>
                              {s.sizeName} {s.clothingFit ? `(Fit: ${s.clothingFit})` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="product-actions">
                      {deletingId === p.id ? (
                        <div className="delete-confirm">
                          <span style={{ color: '#e07b7b', fontSize: '12px', marginRight: '8px' }}>Əminsiniz?</span>
                          <button className="confirm-yes-btn" onClick={() => handleDelete(p.id)}>Bəli</button>
                          <button className="confirm-no-btn" onClick={() => setDeletingId(null)}>Xeyr</button>
                        </div>
                      ) : (
                        <>
                          <button className="edit-btn" onClick={() => startEdit(p)} title="Redaktə et">
                            <FiEdit2 />
                          </button>
                          <button className="delete-btn" onClick={() => setDeletingId(p.id)} title="Sil">
                            <FiTrash2 />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default SellerPanel;