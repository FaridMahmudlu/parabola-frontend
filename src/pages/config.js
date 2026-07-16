export const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const translateError = (errorMsg) => {
  if (!errorMsg) return "Gözlənilməz bir xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.";
  
  const msg = String(errorMsg).toLowerCase();
  
  // Database / Connection / PgBouncer prepared statement error
  if (msg.includes("jdbc") || msg.includes("sql") || msg.includes("database") || msg.includes("prepared statement") || msg.includes("connection")) {
    return "Verilənlər bazası ilə əlaqə kəsildi. Zəhmət olmasa bir az sonra yenidən cəhd edin.";
  }
  
  // Network / Server errors
  if (msg.includes("network error") || msg.includes("err_network")) {
    return "İnternet bağlantısını yoxlayın və ya serverin açılmasını gözləyin.";
  }
  if (msg.includes("timeout") || msg.includes("tükəndi")) {
    return "Sorğu müddəti başa çatdı. Zəhmət olmasa yenidən cəhd edin.";
  }
  
  // Authorization / Role errors
  if (msg.includes("403") || msg.includes("forbidden") || msg.includes("access is denied")) {
    return "Bu əməliyyatı yerinə yetirmək üçün icazəniz yoxdur.";
  }
  if (msg.includes("401") || msg.includes("unauthorized")) {
    return "Sessiya müddəti bitib. Zəhmət olmasa yenidən giriş edin.";
  }
  
  // File upload size/type errors
  if (msg.includes("5mb") || msg.includes("file size") || msg.includes("too large")) {
    return "Şəkil faylının ölçüsü çox böyükdür (maksimum 5MB).";
  }
  if (msg.includes("format") || msg.includes("image format") || msg.includes("image/")) {
    return "Yalnız şəkil formatında (PNG, JPG, JPEG, WEBP) fayllar yüklənə bilər.";
  }

  // Shop name validation
  if (msg.includes("shopname") || msg.includes("mağaza adı") || msg.includes("shop name")) {
    return "Zəhmət olmasa mağaza adını düzgün daxil edin.";
  }

  // Default fallback (friendly translated)
  return "Əməliyyat yerinə yetirilərkən xəta baş verdi. Zəhmət olmasa məlumatları yoxlayın.";
};