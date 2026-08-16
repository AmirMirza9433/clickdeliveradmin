import React, { useState, useEffect } from "react";
import { X, Search, Plus, Trash2, Package } from "lucide-react";
import { adminService } from "../services/adminService";
import toast from "react-hot-toast";

const AdminEditOrderItems = ({ order, onClose, onSave }) => {
  const [items, setItems] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (order && order.items) {
      // Deep copy to avoid mutating original order state directly
      setItems(JSON.parse(JSON.stringify(order.items)));
    }
  }, [order]);

  useEffect(() => {
    const fetchShopProducts = async () => {
      if (!order || !order.shops || !order.shops[0]) return;
      setIsSearching(true);
      try {
        const res = await adminService.getProducts({
          shopId: order.shops[0]._id || order.shops[0],
          search: searchQuery,
          limit: 20
        });
        setAvailableProducts(res.products || res || []);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      fetchShopProducts();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, order]);

  const handleQuantityChange = (index, delta) => {
    const newItems = [...items];
    const newQuantity = Math.max(1, (newItems[index].quantity || 1) + delta);
    newItems[index].quantity = newQuantity;
    setItems(newItems);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleAddProduct = (product) => {
    const existingIndex = items.findIndex((i) => i.product?._id === product._id || i.product === product._id);
    if (existingIndex >= 0) {
      handleQuantityChange(existingIndex, 1);
      toast.success("Increased quantity of existing item");
    } else {
      setItems([
        ...items,
        {
          product: product,
          quantity: 1,
          price: product.price,
          selected_variant: null,
          selected_addons: []
        }
      ]);
      toast.success("Item added to order");
    }
    setSearchQuery(""); // clear search after adding
  };

  const calculatePreviewSubtotal = () => {
    return items.reduce((acc, item) => {
      let basePrice = item.price || 0;
      if (item.product?.price && !item.price) {
        basePrice = item.product.price;
      }
      
      let variantPrice = item.selected_variant?.price || 0;
      let addonPrice = 0;
      if (item.selected_addons) {
        addonPrice = item.selected_addons.reduce((sum, addon) => sum + (addon.price * (addon.quantity || 1)), 0);
      }
      
      const unitPrice = item.unit_calculated_price || (basePrice + addonPrice); // simple fallback if variant isn't fully calculated on frontend
      return acc + (unitPrice * item.quantity);
    }, 0);
  };

  const handleSave = async () => {
    if (items.length === 0) {
      toast.error("Order must have at least one item.");
      return;
    }
    setIsSaving(true);
    try {
      const cleanItems = items.map(i => ({
        ...i,
        product: i.product?._id || i.product
      }));
      await onSave(cleanItems);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!order) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content glass-panel" style={{ maxWidth: "700px", width: "100%", maxHeight: "90vh", overflowY: "auto", padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Package size={20} /> Edit Items - Order #{order._id.substring(order._id.length - 8).toUpperCase()}
          </h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-main)" }}>
            <X size={24} />
          </button>
        </div>

        {/* Current Items List */}
        <div style={{ marginBottom: "2rem" }}>
          <h4 style={{ margin: "0 0 1rem 0", color: "var(--accent-primary)" }}>Current Items</h4>
          <div style={{ background: "var(--bg-secondary)", borderRadius: "8px", overflow: "hidden" }}>
            {items.map((item, index) => (
              <div key={index} style={{ padding: "1rem", borderBottom: index < items.length - 1 ? "1px solid var(--border-color)" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "0.95rem" }}>{item.product?.name || "Product"}</strong>
                  {item.selected_variant?.title && (
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      Variant: {item.selected_variant.title} (+PKR {item.selected_variant.price})
                    </div>
                  )}
                  {item.selected_addons?.map((addon, idx) => (
                    <div key={idx} style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                      Addon: {addon.quantity}x {addon.name} (+PKR {addon.price * addon.quantity})
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "var(--bg-color)", borderRadius: "4px", padding: "0.25rem" }}>
                    <button onClick={() => handleQuantityChange(index, -1)} style={{ border: "none", background: "transparent", color: "var(--text-main)", cursor: "pointer", padding: "0 0.5rem" }}>-</button>
                    <span style={{ minWidth: "20px", textAlign: "center" }}>{item.quantity}</span>
                    <button onClick={() => handleQuantityChange(index, 1)} style={{ border: "none", background: "transparent", color: "var(--text-main)", cursor: "pointer", padding: "0 0.5rem" }}>+</button>
                  </div>
                  <button onClick={() => handleRemoveItem(index)} style={{ border: "none", background: "transparent", color: "var(--status-cancelled)", cursor: "pointer" }} title="Remove Item">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)" }}>No items in order.</div>
            )}
          </div>
        </div>

        {/* Add Product Search */}
        <div style={{ marginBottom: "2rem" }}>
          <h4 style={{ margin: "0 0 1rem 0", color: "var(--accent-primary)" }}>Add New Item</h4>
          <div className="search-bar-container" style={{ marginBottom: "1rem" }}>
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search shop inventory..." 
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {searchQuery && (
            <div style={{ background: "var(--bg-secondary)", borderRadius: "8px", maxHeight: "200px", overflowY: "auto" }}>
              {isSearching ? (
                <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)" }}>Searching...</div>
              ) : availableProducts.length > 0 ? (
                availableProducts.map(product => (
                  <div key={product._id} style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: "0.9rem", fontWeight: 500 }}>{product.name}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>PKR {product.price}</div>
                    </div>
                    <button onClick={() => handleAddProduct(product)} className="icon-btn" style={{ color: "var(--accent-primary)" }} title="Add to Order">
                      <Plus size={18} />
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ padding: "1rem", textAlign: "center", color: "var(--text-muted)" }}>No products found.</div>
              )}
            </div>
          )}
        </div>

        {/* Totals Preview */}
        <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "1.5rem", borderRadius: "8px", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
            <span>Preview Subtotal</span>
            <span>PKR {calculatePreviewSubtotal()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem", color: "var(--text-muted)" }}>
            <span>Delivery Fee</span>
            <span>PKR {order.deliveryFee || 0}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border-color)", fontSize: "1.1rem", fontWeight: "bold" }}>
            <span>Estimated Total</span>
            <span style={{ color: "var(--accent-primary)" }}>PKR {calculatePreviewSubtotal() + (order.deliveryFee || 0)}</span>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--status-cancelled)", marginTop: "1rem", marginBottom: 0 }}>
            Note: Final calculated price is determined securely by the server on save.
          </p>
        </div>

        <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
          <button className="secondary-btn" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button className="primary-btn" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Items & Update Order"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminEditOrderItems;
