import React, { useEffect, useState } from "react";
import axios from "axios";
import "./seller.css";
import Header from "../Header/Header";
import CustomSelect from "../CustomSelect/CustomSelect";
import { Navigate } from "react-router-dom";
import { BASE_URL } from "../../pages/config";
import { notification } from "antd";
import { useUser, useAuth } from "@clerk/clerk-react";

const SellerPanel = () => {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [contactLink, setContactLink] = useState("");
  const [file, setFile] = useState(null);

  // New fields from the screenshot
  const [gender, setGender] = useState("");
  const [sizeName, setSizeName] = useState("");
  const [clothingFit, setClothingFit] = useState("");
  const [color, setColor] = useState("");
  const [style, setStyle] = useState("");
  const [description, setDescription] = useState("");

  const [status, setStatus] = useState({ loading: false, error: null, ok: false });
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      const res = await axios.get(`${BASE_URL}/api/v1/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data);
    } catch (err) {
      console.error("Məhsullar yüklənmədi:", err);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchProducts();
    }
  }, [isSignedIn, getToken]);

  if (!isLoaded) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#c9a96e' }}>Yüklənir...</div>;
  }

  if (!isSignedIn || user?.publicMetadata?.role !== "ROLE_SELLER") {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, ok: false });

    // Validate selections
    if (!gender || !sizeName || !clothingFit || !color || !style) {
      setStatus({ loading: false, error: "Zəhmət olmasa bütün vacib seçimləri daxil edin.", ok: false });
      return;
    }

    if (!file) {
      setStatus({ loading: false, error: "Zəhmət olmasa məhsulun real şəklini yükləyin.", ok: false });
      return;
    }

    const sizesList = [{
      sizeName: sizeName,
      clothingFit: clothingFit,
      modelBodyType: "" // Will be derived from clothingFit on the backend
    }];

    const productPayload = {
      name,
      brand,
      category,
      price: parseFloat(price),
      contactLink,
      gender,
      color,
      style,
      description,
      sizes: sizesList
    };

    const formData = new FormData();
    formData.append("product", JSON.stringify(productPayload));
    formData.append("image", file);

    try {
      const token = await getToken();
      await axios.post(`${BASE_URL}/api/v1/products`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`
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
      setGender("");
      setSizeName("");
      setClothingFit("");
      setColor("");
      setStyle("");
      setDescription("");
      
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
          <p className="panel-subtitle">Yeni geyim əlavə edin.</p>
        </header>
        <div className="panel-card">
          <form className="panel-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              
              {/* Row 1 */}
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
                <label>Cins</label>
                <CustomSelect
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  options={[
                    { value: "Kişi", label: "Kişi" },
                    { value: "Qadın", label: "Qadın" },
                    { value: "Unisex", label: "Unisex" }
                  ]}
                  placeholder="Seçin"
                />
              </div>

              {/* Row 2 */}
              <div className="form-field">
                <label>Ölçü</label>
                <CustomSelect
                  value={sizeName}
                  onChange={(e) => setSizeName(e.target.value)}
                  options={[
                    { value: "S", label: "S" },
                    { value: "M", label: "M" },
                    { value: "L", label: "L" },
                    { value: "XL", label: "XL" },
                    { value: "XXL", label: "XXL" }
                  ]}
                  placeholder="Seçin"
                />
              </div>

              <div className="form-field">
                <label>Uyğunlaşma Ölçüsü (Fit)</label>
                <CustomSelect
                  value={clothingFit}
                  onChange={(e) => setClothingFit(e.target.value)}
                  options={[
                    { value: "Kiçik", label: "Kiçik" },
                    { value: "Orta kiçik", label: "Orta kiçik" },
                    { value: "Orta", label: "Orta" },
                    { value: "Orta geniş", label: "Orta geniş" },
                    { value: "Geniş", label: "Geniş" }
                  ]}
                  placeholder="Seçin"
                />
              </div>

              {/* Row 3 */}
              <div className="form-field">
                <label>Rəng</label>
                <CustomSelect
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  options={[
                    { value: "Qara", label: "Qara" },
                    { value: "Ağ", label: "Ağ" },
                    { value: "Mavi", label: "Mavi" },
                    { value: "Qırmızı", label: "Qırmızı" },
                    { value: "Yaşıl", label: "Yaşıl" },
                    { value: "Sarı", label: "Sarı" },
                    { value: "Boz", label: "Boz" },
                    { value: "Qəhvəyi", label: "Qəhvəyi" },
                    { value: "Bej", label: "Bej" },
                    { value: "Krem", label: "Krem" }
                  ]}
                  placeholder="Seçin"
                />
              </div>

              <div className="form-field">
                <label>Stil</label>
                <CustomSelect
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  options={[
                    { value: "Klassik", label: "Klassik" },
                    { value: "İdman", label: "İdman" },
                    { value: "Gündəlik", label: "Gündəlik" },
                    { value: "Ziyafət", label: "Ziyafət" },
                    { value: "Minimalist", label: "Minimalist" },
                    { value: "Küçə stili", label: "Küçə stili" }
                  ]}
                  placeholder="Seçin"
                />
              </div>

              {/* Row 4: Backend required properties */}
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

              {/* Row 5 */}
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

              {/* Row 6: Image upload */}
              <div className="form-field form-field--full">
                <label htmlFor="image">Məhsulun Real Şəkli</label>
                <input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                  style={{ padding: "14px" }}
                />
              </div>

              {/* Description textarea */}
              <div className="form-field form-field--full">
                <label htmlFor="description">Geyim haqqında qısa məlumat (İstəyə bağlı)</label>
                <textarea
                  id="description"
                  placeholder="Geyimin xüsusiyyətləri..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="4"
                />
              </div>

            </div>

            {status.error && (
              <div className="form-alert form-alert--error" style={{ marginTop: "20px" }}>⚠ {status.error}</div>
            )}
            {status.ok && (
              <div className="form-alert form-alert--ok" style={{ marginTop: "20px" }}>✓ Məhsul uğurla əlavə olundu!</div>
            )}

            <button type="submit" className="submit-btn" disabled={status.loading} style={{ marginTop: "30px", width: "100%" }}>
              {status.loading ? "Göndərilir..." : "Kataloqa Əlavə Et"}
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
                            {s.sizeName} {s.clothingFit && s.modelBodyType ? `(Fit: ${s.clothingFit} / Manken: ${s.modelBodyType})` : `(S:${s.chest}/Ç:${s.shoulder}/Q:${s.armLength}/U:${s.totalLength})`}
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