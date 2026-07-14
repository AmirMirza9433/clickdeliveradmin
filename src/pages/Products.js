import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import AdminDateFilter, {
  AdminCityFilter,
  getDateFilterParams,
} from "../components/AdminDateFilter";
import { useAdminCityFilter } from "../hooks/useAdminCityFilter";
import { usePermissions } from "../hooks/usePermissions";
import {
  Search,
  RefreshCw,
  Trash2,
  Tag,
  Plus,
  X,
  Package,
  DollarSign,
  Store,
  Info,
  Image as ImageIcon,
  Layers,
  Eye,
  EyeOff,
  Upload,
  Loader2,
  Pencil,
} from "lucide-react";
import { useRef } from "react";
import io from "socket.io-client";
import { useSearchParams } from "react-router-dom";

const CATEGORIES = [
  "Restaurants",
  "Groceries",
  "Pharmacy",
  "Bakeries",
  "Meat & Fish",
  "Beverages",
  "Fast Food",
  "Meals",
  "Snacks",
  "Desserts",
  "Petrol",
  "Other",
];

const Products = () => {
  const { can } = usePermissions();
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchParams] = useSearchParams();
  const shopQuery = searchParams.get("shop");
  const [showModal, setShowModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    unit: "pcs",
    category: "",
    brand: "",
    isAvailable: true,
    image: "",
    shop: "",
    cities: [],
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [availableCities, setAvailableCities] = useState([]);
  const [dateFilter, setDateFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const { cities, selectedCity, setSelectedCity, cityParams } =
    useAdminCityFilter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const filterParams = {
        ...getDateFilterParams(dateFilter, customStartDate, customEndDate),
        ...cityParams,
      };
      const [productsData, shopsData, citiesData] = await Promise.all([
        adminService.getProducts(filterParams),
        adminService.getUsers("shopkeeper", cityParams),
        adminService.getCities(),
      ]);
      setProducts(productsData.products || []);
      const users = shopsData || [];
      setShops(users);
      setAvailableCities(citiesData || []);

      // Auto-select "Admin Product" shop if it exists
      const adminShop = users.find(
        (s) =>
          s.shopDetails?.name?.toLowerCase() === "admin product" ||
          s.name?.toLowerCase() === "admin product",
      );
      if (adminShop) {
        setNewProduct((prev) => ({ ...prev, shop: adminShop._id, cities: [] }));
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFilter, customStartDate, customEndDate, selectedCity]);

  useEffect(() => {
    if (shopQuery) {
      setSearchTerm(shopQuery);
    }
  }, [shopQuery]);

  useEffect(() => {
    const socket = io("http://192.168.100.251:5001");

    socket.on("productUpdated", (updatedProduct) => {
      setProducts((currentProducts) =>
        currentProducts.map((p) =>
          p._id === updatedProduct._id ? { ...p, ...updatedProduct } : p,
        ),
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const data = await adminService.uploadImage(file);
      setNewProduct((prev) => ({ ...prev, image: data.imageUrl }));
    } catch (error) {
      alert("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleEdit = (product) => {
    setIsEditing(true);
    setEditingId(product._id);
    setNewProduct({
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
      unit: product.unit || "pcs",
      category: product.category,
      brand: product.brand || "",
      isAvailable: product.isAvailable,
      image: product.image,
      shop: product.shop?._id || product.shop || "",
      cities: product.cities || [],
    });
    setShowModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newProduct,
        price: Number(newProduct.price),
        quantity: Number(newProduct.quantity),
      };

      if (isEditing) {
        await adminService.updateProduct(editingId, payload);
      } else {
        await adminService.createProduct(payload);
      }

      handleCloseModal();
      fetchData();
    } catch (error) {
      alert(`Failed to ${isEditing ? "update" : "create"} product`);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    setNewProduct({
      name: "",
      description: "",
      price: "",
      quantity: "",
      unit: "pcs",
      category: "",
      brand: "",
      isAvailable: true,
      image: "",
      shop: "",
      cities: [],
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await adminService.deleteProduct(id);
        setProducts(products.filter((p) => p._id !== id));
      } catch (error) {
        alert("Failed to delete product");
      }
    }
  };

  const handleToggleAvailability = async (product) => {
    try {
      const updatedProduct = await adminService.updateProduct(product._id, {
        isAvailable: !product.isAvailable,
      });
      setProducts(
        products.map((p) =>
          p._id === product._id
            ? { ...p, isAvailable: updatedProduct.isAvailable }
            : p,
        ),
      );
    } catch (error) {
      alert("Failed to update product availability");
    }
  };

  const filteredProducts = (Array.isArray(products) ? products : []).filter(
    (product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.shop?.shopDetails?.name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === "All" || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    },
  );

  return (
    <div className="content-area animate-fade-in">
      <div className="section-header">
        <div>
          <h2>Product Management</h2>
          <p className="section-subtitle">
            Catalog across all registered shops
          </p>
        </div>
        <div className="header-actions">
          <button
            className="icon-btn"
            onClick={fetchData}
            style={{ marginRight: "1rem" }}
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          {can("products", "create") && (
            <button
              className="primary-btn icon-text-btn"
              onClick={() => setShowModal(true)}
            >
              <Plus size={18} />
              Add Product
            </button>
          )}
        </div>
      </div>

      <AdminDateFilter
        filterType={dateFilter}
        setFilterType={setDateFilter}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
        leadingContent={
          <AdminCityFilter
            cities={cities}
            selectedCity={selectedCity}
            setSelectedCity={setSelectedCity}
          />
        }
      />

      <div className="search-bar-container glass-panel">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Search items or shops..."
          className="search-input"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div
        className="category-tabs glass-panel"
        style={{
          marginTop: "1.5rem",
          padding: "0.5rem",
          display: "flex",
          gap: "0.5rem",
          overflowX: "auto",
        }}
      >
        {["All", ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            className={`tab-btn ${selectedCategory === cat ? "active" : ""}`}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor:
                selectedCategory === cat
                  ? "var(--accent-primary)"
                  : "rgba(255,255,255,0.05)",
              color:
                selectedCategory === cat ? "white" : "var(--text-secondary)",
              whiteSpace: "nowrap",
              cursor: "pointer",
              transition: "all 0.2s",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="glass-panel" style={{ marginTop: "1.5rem" }}>
        {loading ? (
          <div className="table-loader">Loading products...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Shop</th>
                <th>Price / Stock</th>
                <th>Category</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr
                  key={product._id}
                  style={{ opacity: !product.isAvailable ? 0.6 : 1 }}
                >
                  <td>
                    <div className="user-info-cell">
                      <div className="product-image-wrapper">
                        <img
                          src={
                            product.image ||
                            "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png"
                          }
                          alt={product.name}
                          className="product-thumb"
                        />
                      </div>
                      <div>
                        <div className="user-name">
                          {product.name}
                          {!product.isAvailable && (
                            <span
                              style={{
                                marginLeft: 8,
                                fontSize: 10,
                                backgroundColor: "#fee2e2",
                                color: "#dc2626",
                                padding: "2px 6px",
                                borderRadius: 4,
                              }}
                            >
                              Inactive
                            </span>
                          )}
                        </div>
                        <div
                          className="user-email"
                          style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                          }}
                        >
                          {product.brand && (
                            <span
                              style={{
                                fontWeight: 600,
                                color: "var(--text-primary)",
                              }}
                            >
                              {product.brand}
                            </span>
                          )}
                          <span>{product.description.substring(0, 30)}...</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="shop-owner-info">
                      <Store size={14} />
                      {product.shop?.shopDetails?.name || "Unknown"}
                    </div>
                  </td>
                  <td>
                    <div className="price-stock">
                      <div className="price-tag">PKR {product.price}</div>
                      <div
                        className={`stock-count ${product.quantity < 10 ? "low-stock" : ""}`}
                      >
                        {product.quantity} per{" "}
                        {product.unit
                          ?.replace(/\bg\b/i, "Gram")
                          .replace(/\bl\b/i, "Liter") || "pcs"}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="category-badge">
                      <Tag size={12} />
                      {product.category}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className="action-btn"
                        onClick={() => {
                          setSelectedProduct(product);
                          setShowViewModal(true);
                        }}
                        title="View Details"
                        style={{ color: "var(--primary)" }}
                      >
                        <Eye size={18} />
                      </button>
                      {can("products", "edit") && (
                        <button
                          className="action-btn"
                          onClick={() => handleEdit(product)}
                          title="Edit Product"
                          style={{ color: "var(--accent-primary)" }}
                        >
                          <Pencil size={18} />
                        </button>
                      )}
                      {can("products", "manage_stock") && (
                        <button
                          className={`action-btn ${product.isAvailable ? "unverify" : "verify"}`}
                          onClick={() => handleToggleAvailability(product)}
                          title={
                            product.isAvailable
                              ? "Mark as Out of Stock"
                              : "Mark as In Stock"
                          }
                        >
                          {product.isAvailable ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      )}
                      {can("products", "delete") && (
                        <button
                          className="action-btn delete"
                          onClick={() => handleDelete(product._id)}
                          title="Delete Product"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-table-msg">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel animate-fade-in">
            <div className="modal-header">
              <h3>{isEditing ? "Edit Product" : "Add New Product"}</h3>
              <button className="icon-btn close-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>
                    <Store size={12} style={{ marginRight: 4 }} /> Assign to
                    Shop
                  </label>
                  <select
                    value={newProduct.shop}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, shop: e.target.value })
                    }
                    required
                  >
                    <option value="">Select a Shop</option>
                    {shops.map((shop) => (
                      <option key={shop._id} value={shop._id}>
                        {shop.shopDetails?.name} ({shop.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    <Package size={12} style={{ marginRight: 4 }} /> Product
                    Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter product title"
                    value={newProduct.name}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    <DollarSign size={12} style={{ marginRight: 4 }} /> Price
                    (PKR)
                  </label>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newProduct.price}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, price: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    <Layers size={12} style={{ marginRight: 4 }} /> Quantity
                  </label>
                  <input
                    type="number"
                    placeholder="Stock level"
                    value={newProduct.quantity}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, quantity: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label>
                    <Tag size={12} style={{ marginRight: 4 }} /> Unit
                  </label>
                  <select
                    value={newProduct.unit}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, unit: e.target.value })
                    }
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="l">Liter (l)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="dozen">Dozen</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    <Tag size={12} style={{ marginRight: 4 }} /> Brand
                    (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., Nestle, Coca-Cola"
                    value={newProduct.brand}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, brand: e.target.value })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>
                    <Tag size={12} style={{ marginRight: 4 }} /> Category
                  </label>
                  <select
                    value={newProduct.category}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, category: e.target.value })
                    }
                    required
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    <ImageIcon size={12} style={{ marginRight: 4 }} /> Product
                    Image (Optional)
                  </label>
                  <div
                    className="image-upload-controls"
                    style={{ display: "flex", gap: "0.5rem" }}
                  >
                    <input
                      type="text"
                      placeholder="Paste URL or upload file →"
                      value={newProduct.image}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, image: e.target.value })
                      }
                      style={{ flex: 1 }}
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => fileInputRef.current.click()}
                      disabled={uploadingImage}
                      title="Upload from system"
                      style={{
                        height: "42px",
                        width: "42px",
                        backgroundColor: "var(--accent-primary)",
                        color: "white",
                        borderRadius: "8px",
                      }}
                    >
                      {uploadingImage ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <Upload size={18} />
                      )}
                    </button>
                  </div>
                  {newProduct.image && (
                    <div
                      className="image-preview-mini"
                      style={{ marginTop: "0.5rem" }}
                    >
                      <img
                        src={newProduct.image}
                        alt="Preview"
                        style={{
                          height: "40px",
                          borderRadius: "4px",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group" style={{ marginTop: "0.5rem" }}>
                <label>Targeted Cities (Multi-select / All)</label>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                    marginTop: "0.5rem",
                    padding: "0.75rem",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      color: "var(--text-primary)",
                      fontWeight: 500,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={newProduct.cities?.includes("All")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewProduct({ ...newProduct, cities: ["All"] });
                        } else {
                          setNewProduct({ ...newProduct, cities: [] });
                        }
                      }}
                    />
                    All Cities
                  </label>

                  {availableCities.map((c) => (
                    <label
                      key={c._id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                        color: newProduct.cities?.includes("All")
                          ? "var(--text-muted)"
                          : "var(--text-secondary)",
                        opacity: newProduct.cities?.includes("All") ? 0.5 : 1,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={
                          newProduct.cities?.includes("All") ||
                          newProduct.cities?.includes(c.name)
                        }
                        disabled={newProduct.cities?.includes("All")}
                        onChange={(e) => {
                          let updatedCities = [...(newProduct.cities || [])];
                          if (e.target.checked) {
                            updatedCities.push(c.name);
                          } else {
                            updatedCities = updatedCities.filter(
                              (name) => name !== c.name,
                            );
                          }
                          setNewProduct({
                            ...newProduct,
                            cities: updatedCities,
                          });
                        }}
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ marginTop: "0.5rem" }}>
                <label>
                  <Info size={12} style={{ marginRight: 4 }} /> Description
                  (Optional)
                </label>
                <textarea
                  placeholder="Enter detailed product description..."
                  rows="4"
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                ></textarea>
              </div>
              <div
                className="form-group"
                style={{
                  marginTop: "0.5rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={newProduct.isAvailable}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      isAvailable: e.target.checked,
                    })
                  }
                />
                <label
                  htmlFor="isAvailable"
                  style={{ marginBottom: 0, cursor: "pointer" }}
                >
                  Product is currently available
                </label>
              </div>
              <button
                type="submit"
                className="submit-btn primary-btn"
                style={{ marginTop: "1rem" }}
              >
                {isEditing ? "Update Product" : "Confirm & Create Product"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showViewModal && selectedProduct && (
        <div className="modal-overlay">
          <div
            className="modal-content glass-panel animate-fade-in"
            style={{ maxWidth: "600px" }}
          >
            <div className="modal-header">
              <h3>Product Details</h3>
              <button
                className="icon-btn close-btn"
                onClick={() => setShowViewModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="product-details-view">
              <div className="details-image-container">
                <img
                  src={
                    selectedProduct.image ||
                    "https://developers.elementor.com/docs/assets/img/elementor-placeholder-image.png"
                  }
                  alt={selectedProduct.name}
                  className="details-image"
                  style={{
                    width: "100%",
                    height: "250px",
                    objectFit: "cover",
                    borderRadius: "12px",
                    marginBottom: "1.5rem",
                  }}
                />
              </div>
              <div
                className="details-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1.5rem",
                }}
              >
                <div className="detail-item">
                  <label style={{ opacity: 0.6, fontSize: "12px" }}>
                    Product Name
                  </label>
                  <p style={{ fontWeight: 600, fontSize: "1.1rem" }}>
                    {selectedProduct.name}
                  </p>
                </div>
                <div className="detail-item">
                  <label style={{ opacity: 0.6, fontSize: "12px" }}>
                    Shop Name
                  </label>
                  <p style={{ fontWeight: 600 }}>
                    {selectedProduct.shop?.shopDetails?.name || "N/A"}
                  </p>
                </div>
                <div className="detail-item">
                  <label style={{ opacity: 0.6, fontSize: "12px" }}>
                    Price
                  </label>
                  <p style={{ fontWeight: 600, color: "var(--primary)" }}>
                    PKR {selectedProduct.price}
                  </p>
                </div>
                <div className="detail-item">
                  <label style={{ opacity: 0.6, fontSize: "12px" }}>
                    Quantity
                  </label>
                  <p style={{ fontWeight: 600 }}>
                    {selectedProduct.quantity} per{" "}
                    {selectedProduct.unit
                      ?.replace(/\bg\b/i, "Gram")
                      .replace(/\bl\b/i, "Liter") || "pcs"}
                  </p>
                </div>
                <div className="detail-item">
                  <label style={{ opacity: 0.6, fontSize: "12px" }}>
                    Category
                  </label>
                  <p style={{ fontWeight: 600 }}>{selectedProduct.category}</p>
                </div>
                <div className="detail-item">
                  <label style={{ opacity: 0.6, fontSize: "12px" }}>
                    Status
                  </label>
                  <p
                    style={{
                      fontWeight: 600,
                      color: selectedProduct.isAvailable
                        ? "#10b981"
                        : "#ef4444",
                    }}
                  >
                    {selectedProduct.isAvailable ? "In Stock" : "Out of Stock"}
                  </p>
                </div>
              </div>
              <div className="detail-item" style={{ marginTop: "1.5rem" }}>
                <label style={{ opacity: 0.6, fontSize: "12px" }}>
                  Description
                </label>
                <p style={{ marginTop: "0.5rem", lineHeight: "1.5" }}>
                  {selectedProduct.description}
                </p>
              </div>
            </div>
            <button
              className="primary-btn"
              style={{ marginTop: "2rem", width: "100%" }}
              onClick={() => setShowViewModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
