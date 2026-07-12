import React, { useEffect, useState } from "react";
import axios from "axios";
import "./seller.css";
import Header from "../Header/Header";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { BASE_URL } from "../../pages/config";
import { notification } from "antd";

const SellerPanel = () => {
  const { user } = useSelector((state) => state.auth);

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [contactLink, setContactLink] = useState("");
  const [file, setFile] = useState(null);

  const [selectedSizes, setSelectedSizes] = useState({
    S: { checked: false, chest: "", armLength: "", shoulder: "", totalLength: "" },
    M: { checked: false, chest: "", armLength: "", shoulder: "", totalLength: "" },
    L: { checked: false, chest: "", armLength: "", shoulder: "", totalLength: "" },
    XL: { checked: false, chest: "", armLength: "", shoulder: "", totalLength: "" },
  });

  const [status, setStatus] = useState({ loading: false, error: null, ok: false });
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    if (!user || !user.token) return;
    try {
      const res = await axios.get(`${BASE_URL}/api/v1/products`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setProducts(res.data);
    } catch (err) {
      console.error("Məhsullar yüklənmədi:", err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  if (!user || user.role !== "ROLE_SELLER") {
    return <Navigate to="/" />;
  }

  const handleSizeCheck = (sizeKey) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [sizeKey]: {
        ...prev[sizeKey],
        checked: !prev[sizeKey].checked,
      },
    }));
  };

  const handleSizeValChange = (sizeKey, field, val) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [sizeKey]: {
        ...prev[sizeKey],
        [field]: val,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, ok: false });

    // Validate size selection
    const activeSizes = Object.keys(selectedSizes).filter(key => selectedSizes[key].checked);
    if (activeSizes.length === 0) {
      setStatus({ loading: false, error: "Zəhmət olmasa ən azı bir ölçü variantı seçin və parametrlərini daxil edin.", ok: false });
      return;
    }

    // Validate size dimensions
    for (let key of activeSizes) {
      const s = selectedSizes[key];
      if (!s.chest || !s.armLength || !s.shoulder || !s.totalLength) {
        setStatus({ loading: false, error: `Seçilmiş ${key} ölçüsü üçün bütün ölçü parametrlərini (sinə, qol, çiyin, uzunluq) daxil edin!`, ok: false });
        return;
      }
    }

    if (!file) {
      setStatus({ loading: false, error: "Zəhmət olmasa məhsulun real şəklini yükləyin.", ok: false });
      return;
    }

    const sizesList = activeSizes.map(key => ({
      sizeName: key,
      chest: parseFloat(selectedSizes[key].chest),
      armLength: parseFloat(selectedSizes[key].armLength),
      shoulder: parseFloat(selectedSizes[key].shoulder),
      totalLength: parseFloat(selectedSizes[key].totalLength)
    }));

    const productPayload = {
      name,
      brand,
      category,
      price: parseFloat(price),
      contactLink,
      sizes: sizesList
    };

    const formData = new FormData();
    formData.append("product", JSON.stringify(productPayload));
    formData.append("image", file);

    try {
      await axios.post(`${BASE_URL}/api/v1/products`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.token}`
        }
      });

      setStatus({ loading: false, error: null, ok: true });
      notification.success({
        message: "Məhsul əlavə edildi",
        description: "Yeni geyim uğurla əlavə olundu və kataloqa yerləşdirildi!"
      });

      // Clear Form
      setName("");
      setBrand("");
      setCategory("");
      setPrice("");
      setContactLink("");
      setFile(null);
      setSelectedSizes({
        S: { checked: false, chest: "", armLength: "", shoulder: "", totalLength: "" },
        M: { checked: false, chest: "", armLength: "", shoulder: "", totalLength: "" },
        L: { checked: false, chest: "", armLength: "", shoulder: "", totalLength: "" },
        XL: { checked: false, chest: "", armLength: "", shoulder: "", totalLength: "" },
      });
      // Clear file input manually
      document.getElementById("image").value = "";

      fetchProducts();
    } catch (err) {
      const errMsg = err.response?.data?.message || err.response?.data || err.message;
      setStatus({
        loading: false,
        error: typeof errMsg === "string" ? errMsg : "Məhsul göndərilə bilmədi.",
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
          <p className="panel-subtitle">Yeni geyim əlavə edin və ölçü limitlərini təyin edin.</p>
        </header>
        <div className="panel-card">
          <form className="panel-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="name">Geyim adı</label>
                <input
                  id="name"
                  type="text"
                  placeholder="məs: Klassik köynək"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="brand">Brend</label>
                <input
                  id="brand"
                  type="text"
                  placeholder="məs: Zara, Mango"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="category">Kateqoriya</label>
                <input
                  id="category"
                  type="text"
                  placeholder="məs: Shirt, Pants, Jacket"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="price">Qiymət (AZN)</label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="məs: 45.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="contactLink">Sifariş/Əlaqə Linki (Instagram/Whatsapp)</label>
                <input
                  id="contactLink"
                  type="url"
                  placeholder="https://instagram.com/direct/t/..."
                  value={contactLink}
                  onChange={(e) => setContactLink(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="image">Məhsulun Real Şəkli</label>
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                />
              </div>
            </div>

            <div className="sizes-section" style={{ marginTop: "30px", borderTop: "1px solid #2a2a2a", paddingTop: "20px" }}>
              <h3 style={{ color: "#c9a96e", marginBottom: "15px", fontWeight: "300" }}>Ölçü Variantları və Fiziki Ölçüləri</h3>
              <p style={{ color: "#8c8c8c", fontSize: "14px", marginBottom: "20px" }}>
                Ağıllı tövsiyə sisteminin işləməsi üçün ən azı bir geyim ölçüsü seçib onun santimetrlərlə ölçü dəyərlərini daxil edin.
              </p>

              {Object.keys(selectedSizes).map((sizeKey) => (
                <div key={sizeKey} className="size-row" style={{ marginBottom: "20px", background: "#0c0c0c", padding: "15px", borderRadius: "6px", border: "1px solid #1a1a1a" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                    <input
                      type="checkbox"
                      id={`check-${sizeKey}`}
                      checked={selectedSizes[sizeKey].checked}
                      onChange={() => handleSizeCheck(sizeKey)}
                      style={{ width: "20px", height: "20px", cursor: "pointer" }}
                    />
                    <label htmlFor={`check-${sizeKey}`} style={{ color: "#c9a96e", fontSize: "18px", fontWeight: "bold", cursor: "pointer" }}>
                      {sizeKey} Ölçüsü
                    </label>
                  </div>

                  {selectedSizes[sizeKey].checked && (
                    <div className="size-inputs-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px" }}>
                      <div className="form-field">
                        <label>Sinə genişliyi (sm)</label>
                        <input
                          type="number"
                          placeholder="sm"
                          value={selectedSizes[sizeKey].chest}
                          onChange={(e) => handleSizeValChange(sizeKey, "chest", e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label>Çiyin genişliyi (sm)</label>
                        <input
                          type="number"
                          placeholder="sm"
                          value={selectedSizes[sizeKey].shoulder}
                          onChange={(e) => handleSizeValChange(sizeKey, "shoulder", e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label>Qol uzunluğu (sm)</label>
                        <input
                          type="number"
                          placeholder="sm"
                          value={selectedSizes[sizeKey].armLength}
                          onChange={(e) => handleSizeValChange(sizeKey, "armLength", e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-field">
                        <label>Ümumi uzunluq (sm)</label>
                        <input
                          type="number"
                          placeholder="sm"
                          value={selectedSizes[sizeKey].totalLength}
                          onChange={(e) => handleSizeValChange(sizeKey, "totalLength", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {status.error && (
              <div className="form-alert form-alert--error" style={{ marginTop: "20px" }}>⚠ {status.error}</div>
            )}
            {status.ok && (
              <div className="form-alert form-alert--ok" style={{ marginTop: "20px" }}>✓ Məhsul uğurla əlavə olundu!</div>
            )}

            <button type="submit" className="submit-btn" disabled={status.loading} style={{ marginTop: "30px", width: "100%" }}>
              {status.loading ? "Göndərilir..." : "Geyimi əlavə et"}
            </button>
          </form>
        </div>

        <div className="panel-product">
          <section className="products-section">
            <h2 className="products-title">Sistemdəki mövcud məhsullar ({products.length})</h2>
            {products.length === 0 ? (
              <p className="products-empty">Hələ ki məhsul yoxdur.</p>
            ) : (
              <ul className="products-list">
                {products.map((p) => (
                  <li key={p.id} className="product-item">
                    <div className="product-info">
                      <h3 className="product-name">{p.name}</h3>
                      <div className="product-meta">
                        <span>{p.brand}</span>
                        <span>•</span>
                        <span>{p.category}</span>
                        <span>•</span>
                        <span>{p.price ? `${p.price} AZN` : ""}</span>
                      </div>
                      <div className="product-sizes-badges" style={{ marginTop: "10px" }}>
                        {p.sizes && p.sizes.map(s => (
                          <span key={s.id} style={{ background: "#2a2a2a", color: "#c9a96e", padding: "3px 8px", borderRadius: "4px", fontSize: "12px", marginRight: "5px" }}>
                            {s.sizeName} (S:{s.chest}/Ç:{s.shoulder}/Q:{s.armLength}/U:{s.totalLength})
                          </span>
                        ))}
                      </div>
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