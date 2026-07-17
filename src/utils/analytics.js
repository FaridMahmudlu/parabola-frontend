import ReactGA from "react-ga4";

// Initialize GA4 with Measurement ID
// It checks environment variables. If not defined, it will log to console in local development.
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "G-XXXXXXXXXX";

export const initGA = () => {
  if (GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== "G-XXXXXXXXXX") {
    ReactGA.initialize(GA_MEASUREMENT_ID);
    console.log("Google Analytics initialized with ID:", GA_MEASUREMENT_ID);
  } else {
    console.warn("Google Analytics Measurement ID is missing or set to placeholder. Tracking will log to console.");
  }
};

// Track Page View
export const trackPageView = (path) => {
  if (GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== "G-XXXXXXXXXX") {
    ReactGA.send({ hitType: "pageview", page: path });
  } else {
    console.log(`[GA PageView]: ${path}`);
  }
};

// Track Custom Events
export const trackEvent = (category, action, label = "", value = null, customParams = {}) => {
  if (GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== "G-XXXXXXXXXX") {
    ReactGA.event({
      category,
      action,
      label,
      value,
      ...customParams,
    });
  } else {
    console.log(`[GA Event]: Category: ${category} | Action: ${action} | Label: ${label} | Value: ${value}`, customParams);
  }
};

// Specific standard business event helper functions
export const trackTryOnOpen = (product) => {
  trackEvent("Product", "open_try_on", product.name, product.price ? Math.round(product.price) : null, {
    product_id: product.id,
    product_brand: product.brand,
    product_category: product.category,
  });
};

export const trackTryOnCalculate = (product, userParams, matchPercentage) => {
  trackEvent("Product", "try_on_calculate", `${product.name} (${matchPercentage}%)`, matchPercentage, {
    product_id: product.id,
    product_brand: product.brand,
    user_gender: userParams.gender,
    user_size: userParams.clothingSize,
    user_body_type: userParams.bodyType,
    match_percentage: matchPercentage,
  });
};

export const trackContactClick = (product, platform, selectedSize, selectedColor) => {
  trackEvent("Conversion", "contact_seller", `${platform} - ${product.name}`, product.price ? Math.round(product.price) : null, {
    product_id: product.id,
    product_brand: product.brand,
    platform: platform,
    selected_size: selectedSize,
    selected_color: selectedColor,
  });
};

export const trackProfileSave = (profileData) => {
  trackEvent("User", "profile_save", profileData.gender, null, {
    user_gender: profileData.gender,
    user_size: profileData.clothingSize,
    user_body_type: profileData.bodyType,
    is_seller: !!profileData.shopName,
  });
};

export const trackProductCreate = (productData) => {
  trackEvent("Seller", "product_create", productData.name, productData.price ? Math.round(productData.price) : null, {
    product_brand: productData.brand,
    product_category: productData.category,
    sizes: productData.sizes?.join(", "),
    colors: productData.colors?.join(", "),
  });
};

export const trackAuthAction = (actionType) => {
  trackEvent("Auth", actionType);
};
