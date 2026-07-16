import React, { useEffect, useState } from "react";
import axios from "axios";
import "./seller.css";
import Header from "../Header/Header";
import CustomSelect from "../CustomSelect/CustomSelect";
import { Navigate } from "react-router-dom";
import { BASE_URL } from "../../pages/config";
import { notification } from "antd";
import { useUser, useAuth } from "@clerk/clerk-react";
import { FiEdit2, FiTrash2, FiX } from "react-icons/fi";

const SellerPanel = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  // Form state
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [contactLink, setContactLink] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [gender, setGender] = useState("");
  const [sizeName, setSizeName] = useState("");
  const [clothingFit, setClothingFit] = useState("");
  const [color, setColor] = useState("");
  const [style, setStyle] = useState("");
  const [description, setDescription] = useState("");

  // Edit mode
  const [editingId, setEditingId] = useState(null);

  // Delete confirmation
  const [deletingId, setDeletingId] = useState(null);

  const [status, setStatus] = useState({ loading: false, error: null, ok: false });
  const [products, setProducts] = useState([]);

  const fetchMyProducts = async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      const res = await axios.get(`${BASE_URL}/api/v1/products/my`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "X-Clerk-Role": user?.publicMetadata?.role
        }
      });
      setProducts(res.data);
    } catch (err) {
      console.error("Məhsullar yüklənmədi:", err);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchMyProducts();
    }
  }, [isSignedIn, getToken]);

  if (!isLoaded) {
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
    setFiles([]);
    setPreviews([]);
    setGender("");
    setSizeName("");
    setClothingFit("");
    setColor("");
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
    setGender(product.gender || "");
    setColor(product.color || "");
    setStyle(product.style || "");
    setDescription(product.description || "");
    // Extract size info from first size
    if (product.sizes && product.sizes.length > 0) {
      setSizeName(product.sizes[0].sizeName || "");
      setClothingFit(product.sizes[0].clothingFit || "");
    }
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
          message: "Xəta",
          description: `${f.name} faylı 5MB-dan çoxdur!`
        });
        continue;
      }
      if (!f.type.startsWith("image/")) {
        notification.error({
          message: "Xəta",
          description: `${f.name} şəkil formatında deyil!`
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
      notification.success({
        message: "Məhsul silindi",
        description: "Məhsul kataloqdan uğurla silindi!"
      });
      setDeletingId(null);
      fetchMyProducts();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message;
      notification.error({
        message: "Xəta",
        description: typeof errMsg === "string" ? errMsg : "Məhsul silinə bilmədi."
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, ok: false });

    if (!gender || !sizeName || !clothingFit || !color || !style) {
      setStatus({ loading: false, error: "Zəhmət olmasa bütün vacib seçimləri daxil edin.", ok: false });
      return;
    }

    if (!editingId && files.length === 0) {
      setStatus({ loading: false, error: "Zəhmət olmasa məhsulun real şəklini yükləyin.", ok: false });
      return;
    }

    const sizesList = [{
      sizeName: sizeName,
      clothingFit: clothingFit,
      modelBodyType: ""
    }];

    const productPayload = {
      name, brand, category,
      price: parseFloat(price),
      contactLink, gender, color, style, description,
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
        await axios.put(`${BASE_URL}/api/v1/products/${editingId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
            "X-Clerk-Role": user?.publicMetadata?.role
          }
        });
        notification.success({
          message: "Məhsul yeniləndi",
          description: "Geyim məlumatları uğurla redaktə olundu!"
        });
      } else {
        // CREATE
        await axios.post(`${BASE_URL}/api/v1/products`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
            "X-Clerk-Role": user?.publicMetadata?.role
          }
        });
        notification.success({
          message: "Məhsul əlavə edildi",
          description: "Yeni geyim uğurla kataloqa yerləşdirildi!"
        });
      }

      setStatus({ loading: false, error: null, ok: true });
      clearForm();
      fetchMyProducts();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || err.message;
      setStatus({
        loading: false,
        error: typeof errMsg === "string" ? errMsg : "Əməliyyat uğursuz oldu.",
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

              <div className="form-field">
                <label>Ölçü</label>
                <CustomSelect value={sizeName} onChange={(e) => setSizeName(e.target.value)}
                  options={[
                    { value: "S", label: "S" }, { value: "M", label: "M" },
                    { value: "L", label: "L" }, { value: "XL", label: "XL" },
                    { value: "XXL", label: "XXL" }
                  ]} placeholder="Seçin"
                />
              </div>

              <div className="form-field">
                <label>Uyğunlaşma Ölçüsü (Fit)</label>
                <CustomSelect value={clothingFit} onChange={(e) => setClothingFit(e.target.value)}
                  options={[
                    { value: "Kiçik", label: "Kiçik" },
                    { value: "Orta kiçik", label: "Orta kiçik" },
                    { value: "Orta", label: "Orta" },
                    { value: "Orta geniş", label: "Orta geniş" },
                    { value: "Geniş", label: "Geniş" }
                  ]} placeholder="Seçin"
                />
              </div>

              <div className="form-field">
                <label>Rəng</label>
                <CustomSelect value={color} onChange={(e) => setColor(e.target.value)}
                  options={[
                    { value: "Qara", label: "Qara" }, { value: "Ağ", label: "Ağ" },
                    { value: "Mavi", label: "Mavi" }, { value: "Qırmızı", label: "Qırmızı" },
                    { value: "Yaşıl", label: "Yaşıl" }, { value: "Sarı", label: "Sarı" },
                    { value: "Boz", label: "Boz" }, { value: "Qəhvəyi", label: "Qəhvəyi" },
                    { value: "Bej", label: "Bej" }, { value: "Krem", label: "Krem" }
                  ]} placeholder="Seçin"
                />
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
                <input id="category" type="text" placeholder="məs: Shirt, Pants, Jacket"
                  value={category} onChange={(e) => setCategory(e.target.value)} required
                />
              </div>

              <div className="form-field">
                <label htmlFor="price">Qiymət (AZN)</label>
                <input id="price" type="number" step="0.01" placeholder="məs: 45.00"
                  value={price} onChange={(e) => setPrice(e.target.value)} required
                />
              </div>

              <div className="form-field">
                <label htmlFor="contactLink">Sifariş/Əlaqə Linki</label>
                <input id="contactLink" type="url" placeholder="https://instagram.com/direct/t/..."
                  value={contactLink} onChange={(e) => setContactLink(e.target.value)} required
                />
              </div>

              <div className="form-field form-field--full">
                <label htmlFor="image">
                  Məhsulun Real Şəkilləri {editingId && <span style={{color: '#7a7570', fontSize: '11px'}}>(dəyişmək istəmirsinizsə boş buraxın)</span>}
                </label>
                <input id="image" type="file" accept="image/*" multiple
                  onChange={handleFileChange}
                  required={!editingId}
                  style={{ padding: "14px" }}
                />
                {previews.length > 0 && (
                  <div className="image-previews-container" style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                    {previews.map((src, index) => (
                      <div key={index} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #c9a96e', background: '#f0ece4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={src} alt="Önbaxış" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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