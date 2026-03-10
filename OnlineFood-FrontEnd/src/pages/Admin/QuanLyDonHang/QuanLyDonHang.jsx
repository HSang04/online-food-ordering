import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../services/axiosInstance";
import "./QuanLyDonHang.css";

// ─── Constants ───────────────────────────────────────────────
const ORDER_STATUS = {
  DANG_XU_LY: "DANG_XU_LY",
  DANG_LAM:   "DANG_LAM",
  DANG_GIAO:  "DANG_GIAO",
  HOAN_THANH: "HOAN_THANH",
  DA_HUY:     "DA_HUY",
};

const STATUS_LABELS = {
  DANG_XU_LY: "Đang xử lý",
  DANG_LAM:   "Đang làm",
  DANG_GIAO:  "Đang giao",
  HOAN_THANH: "Hoàn thành",
  DA_HUY:     "Đã hủy",
  "Đang xử lý": "Đang xử lý",
  "Đang làm":   "Đang làm",
  "Đang giao":  "Đang giao",
  "Hoàn thành": "Hoàn thành",
  "Đã hủy":     "Đã hủy",
};

const STATUS_COLORS = {
  DANG_XU_LY: "#ffa500",
  DANG_LAM:   "#2196f3",
  DANG_GIAO:  "#9c27b0",
  HOAN_THANH: "#4caf50",
  DA_HUY:     "#f44336",
  "Đang xử lý": "#ffa500",
  "Đang làm":   "#2196f3",
  "Đang giao":  "#9c27b0",
  "Hoàn thành": "#4caf50",
  "Đã hủy":     "#f44336",
};

const FILTER_TABS = [
  { key: "all",        label: "Tất cả" },
  { key: "dang_xu_ly", label: "Đang xử lý" },
  { key: "dang_lam",   label: "Đang làm" },
  { key: "dang_giao",  label: "Đang giao" },
  { key: "hoan_thanh", label: "Hoàn thành" },
  { key: "da_huy",     label: "Đã hủy" },
];

const normalizeStatus = (status) => {
  const map = {
    "Đang xử lý": "dang_xu_ly",
    "Đang làm":   "dang_lam",
    "Đang giao":  "dang_giao",
    "Hoàn thành": "hoan_thanh",
    "Đã hủy":     "da_huy",
  };
  return map[status] || status.toLowerCase().replace(/\s+/g, "_");
};

const formatDateTime = (dt) =>
  new Date(dt).toLocaleString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const getTimeElapsed = (orderDate) => {
  const diff = new Date() - new Date(orderDate);
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  if (days  > 0) return `${days} ngày trước`;
  if (hours > 0) return `${hours} giờ trước`;
  return `${mins} phút trước`;
};

// ─── Component ───────────────────────────────────────────────
const QuanLyDonHang = () => {
  const navigate  = useNavigate();
  const jwt       = localStorage.getItem("jwt");
  const vaiTro    = localStorage.getItem("vaiTro");
  const isPrivileged = vaiTro === "ADMIN" || vaiTro === "QUANLY";

  // ── State ──
  const [donHangs,        setDonHangs]        = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState("");
  const [filter,          setFilter]          = useState("all");
  const [searchTerm,      setSearchTerm]      = useState("");
  const [updating,        setUpdating]        = useState(false);
  const [isAutoRefreshing,setIsAutoRefreshing]= useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);

  // Detail modal
  const [selectedOrder,   setSelectedOrder]   = useState(null);
  const [showModal,       setShowModal]       = useState(false);
  const [loadingDetails,  setLoadingDetails]  = useState(false);
  const [loadingInvoice,  setLoadingInvoice]  = useState({});

  // Shipper management (chỉ ADMIN / QUANLY)
  const [danhSachShipper,    setDanhSachShipper]    = useState([]);
  const [showDoiShipperModal,setShowDoiShipperModal] = useState(false);
  const [doiShipperOrderId,  setDoiShipperOrderId]  = useState(null);
  const [selectedShipperId,  setSelectedShipperId]  = useState("");
  const [loadingDoiShipper,  setLoadingDoiShipper]  = useState(false);

  const intervalRef = useRef(null);

  // ── Helpers ──
  const authHeader = { Authorization: `Bearer ${jwt}` };

  const startInterval = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(silentRefresh, 30000);
  }, []); // eslint-disable-line

  // ── Data fetching ──
  const fetchDonHangs = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/don-hang", { headers: authHeader });
      if (data) {
        setDonHangs([...data].sort((a, b) => new Date(b.ngayTao) - new Date(a.ngayTao)));
      }
    } catch {
      setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [jwt]); // eslint-disable-line

  const silentRefresh = useCallback(async () => {
    try {
      setIsAutoRefreshing(true);
      const { data } = await axios.get("/don-hang", { headers: authHeader });
      if (data) {
        const sorted = [...data].sort((a, b) => new Date(b.ngayTao) - new Date(a.ngayTao));
        setDonHangs(prev =>
          JSON.stringify(prev) !== JSON.stringify(sorted) ? sorted : prev
        );
        setLastRefreshTime(new Date());
      }
    } catch {
      // silent
    } finally {
      setIsAutoRefreshing(false);
    }
  }, [jwt]); // eslint-disable-line

  const fetchOrderDetails = async (orderId) => {
    try {
      setLoadingDetails(true);
      const { data } = await axios.get(`/chi-tiet-don-hang/don-hang/${orderId}`, {
        headers: authHeader,
      });
      if (Array.isArray(data) && data.length > 0) {
        const donHangInfo = data[0].donHang;
        const chiTiet = data.map((item) => ({
          ...item,
          gia:      item.donGia || item.gia,
          thanhTien: (item.donGia || item.gia || 0) * (item.soLuong || 0),
        }));
        setSelectedOrder({
          ...donHangInfo,
          chiTietDonHang: chiTiet,
          tongTienGoc: chiTiet.reduce((s, i) => s + (i.thanhTien || 0), 0),
        });
      } else {
        const fallback = donHangs.find((o) => o.id === orderId);
        setSelectedOrder(fallback || null);
      }
    } catch {
      const fallback = donHangs.find((o) => o.id === orderId);
      if (fallback) setSelectedOrder(fallback);
      else {
        alert("Không thể tải chi tiết đơn hàng. Vui lòng thử lại!");
        setSelectedOrder(null);
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  const fetchDanhSachShipper = useCallback(async () => {
    try {
      const { data } = await axios.get("/don-hang/danh-sach-shipper", {
        headers: authHeader,
      });
      if (data) setDanhSachShipper(data);
    } catch {
      // silent
    }
  }, [jwt]); // eslint-disable-line

  // ── Effects ──
  useEffect(() => {
    if (jwt) {
      fetchDonHangs();
      if (isPrivileged) fetchDanhSachShipper();
    }
  }, [fetchDonHangs, jwt]); // eslint-disable-line

  useEffect(() => {
    if (jwt && donHangs.length > 0 && !showModal) {
      startInterval();
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [jwt, donHangs.length, showModal]); // eslint-disable-line

  // ── Order actions ──
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setUpdating(true);
      const { data } = await axios.patch(
        `/don-hang/trang-thai/${orderId}`,
        { trangThai: newStatus },
        { headers: { ...authHeader, "Content-Type": "application/json" } }
      );
      if (data) {
        if (newStatus === "HOAN_THANH") {
          try {
            await axios.put(`/hoa-don/cap-nhat-hoan-thanh/${orderId}`, {}, { headers: authHeader });
          } catch { /* invoice update failure is non-critical */ }
        }
        setDonHangs(prev => prev.map(o => o.id === orderId ? { ...o, trangThai: newStatus } : o));
        if (selectedOrder?.id === orderId) setSelectedOrder(prev => ({ ...prev, trangThai: newStatus }));
        const msg = newStatus === "HOAN_THANH"
          ? "Đơn hàng đã hoàn thành và hóa đơn đã được cập nhật!"
          : `Cập nhật trạng thái đơn hàng #${orderId} thành công!`;
        alert(msg);
        setTimeout(silentRefresh, 1000);
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 400) alert("Trạng thái không hợp lệ. Vui lòng thử lại!");
      else if (status === 404) alert("Không tìm thấy đơn hàng. Vui lòng làm mới trang!");
      else alert("Có lỗi xảy ra khi cập nhật trạng thái. Vui lòng thử lại!");
    } finally {
      setUpdating(false);
    }
  };

  const handleViewInvoice = async (orderId) => {
    const ALLOWED_ROLES = ["ADMIN", "QUANLY", "NHANVIEN_QUANLYDONHANG"];
    if (!ALLOWED_ROLES.includes(vaiTro)) {
      alert("Bạn không có quyền xem hóa đơn!");
      return;
    }
    try {
      setLoadingInvoice(prev => ({ ...prev, [orderId]: true }));

      try {
        // Thử lấy hóa đơn đã có
        await axios.get(`/hoa-don/don-hang/${orderId}`, { headers: authHeader });
      } catch (err) {
        if (err.response?.status === 404) {
          // Chưa có → tạo mới
          await axios.post(`/hoa-don/tao-tu-don-hang/${orderId}`, {}, { headers: authHeader });
        } else if (err.response?.status === 401) {
          alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!");
          return;
        } else if (err.response?.status === 403) {
          alert("Bạn không có quyền xem hóa đơn này!");
          return;
        } else {
          throw err;
        }
      }

      navigate(`/hoa-don/${orderId}`);
    } catch (err) {
      alert(err.response?.data?.message || "Không thể truy cập hóa đơn. Vui lòng thử lại!");
    } finally {
      setLoadingInvoice(prev => ({ ...prev, [orderId]: false }));
    }
  };

  // ── Shipper actions (chỉ ADMIN / QUANLY) ──
  const handleResetShipper = async (orderId) => {
    if (!window.confirm(
      `Xác nhận trả đơn #${orderId} về chờ giao lại?\n\nShipper hiện tại sẽ bị gỡ khỏi đơn này.`
    )) return;
    try {
      setUpdating(true);
      await axios.patch(`/don-hang/${orderId}/reset-shipper`, {}, { headers: authHeader });
      alert(`✅ Đã trả đơn #${orderId} về trạng thái chờ giao lại!`);
      setDonHangs(prev =>
        prev.map(o => o.id === orderId ? { ...o, trangThai: "DANG_LAM", nvGiaoHang: null } : o)
      );
      if (selectedOrder?.id === orderId)
        setSelectedOrder(prev => ({ ...prev, trangThai: "DANG_LAM", nvGiaoHang: null }));
      silentRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setUpdating(false);
    }
  };

  const openDoiShipperModal = (orderId) => {
    setDoiShipperOrderId(orderId);
    setSelectedShipperId("");
    setShowDoiShipperModal(true);
  };

  const handleDoiShipper = async () => {
    if (!selectedShipperId) { alert("Vui lòng chọn shipper!"); return; }
    try {
      setLoadingDoiShipper(true);
      const { data } = await axios.patch(
        `/don-hang/${doiShipperOrderId}/doi-shipper`,
        {},
        { params: { shipperId: selectedShipperId }, headers: authHeader }
      );
      alert(`✅ Đã đổi shipper cho đơn #${doiShipperOrderId} thành công!`);
      setShowDoiShipperModal(false);
      if (selectedOrder?.id === doiShipperOrderId)
        setSelectedOrder(prev => ({ ...prev, nvGiaoHang: data.nvGiaoHang }));
      silentRefresh();
    } catch (err) {
      alert(err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!");
    } finally {
      setLoadingDoiShipper(false);
    }
  };

  // ── Modal helpers ──
  const openOrderModal = async (order) => {
    setShowModal(true);
    await fetchOrderDetails(order.id);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  // ── Derived data ──
  const getOrderCountByStatus = (status) => {
    if (status === "all") return donHangs.length;
    return donHangs.filter(o => normalizeStatus(o.trangThai) === status).length;
  };

  const filteredOrders = donHangs.filter((order) => {
    const matchFilter = filter === "all" || normalizeStatus(order.trangThai) === filter;
    const q = searchTerm.toLowerCase();
    const matchSearch =
      !searchTerm ||
      order.id.toString().includes(searchTerm) ||
      order.nguoiDung?.hoTen?.toLowerCase().includes(q) ||
      order.nguoiDung?.tenNguoiDung?.toLowerCase().includes(q) ||
      order.diaChiGiaoHang?.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  // ── Render guards ──
  if (loading) {
    return (
      <div className="ql-dh-container">
        <div className="ql-dh-center-box">
          <div className="ql-dh-spinner" />
          <p>Đang tải danh sách đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ql-dh-container">
        <div className="ql-dh-center-box">
          <h2>⚠️ Có lỗi xảy ra</h2>
          <p>{error}</p>
          <button onClick={fetchDonHangs} className="ql-dh-btn ql-dh-btn--primary">Thử lại</button>
        </div>
      </div>
    );
  }

  // ── Main render ──
  return (
    <div className="ql-dh-container">

      {/* ── Header ── */}
      <header className="ql-dh-header">
        <div className="ql-dh-header__top">
          <h1 className="ql-dh-header__title">📋 Quản lý đơn hàng</h1>
          <div className="ql-dh-header__refresh-info">
            {isAutoRefreshing && (
              <span className="ql-dh-refresh-dot-wrap">
                <span className="ql-dh-refresh-dot" />
                Đang cập nhật...
              </span>
            )}
            {lastRefreshTime && (
              <span className="ql-dh-refresh-time">
                Cập nhật: {lastRefreshTime.toLocaleTimeString("vi-VN")}
              </span>
            )}
          </div>
        </div>

        <div className="ql-dh-stats">
          {[
            { label: "Tổng đơn",    key: "all",        cls: "" },
            { label: "Đang xử lý", key: "dang_xu_ly", cls: "ql-dh-stats__card--processing" },
            { label: "Đang làm",   key: "dang_lam",   cls: "ql-dh-stats__card--preparing" },
            { label: "Đang giao",  key: "dang_giao",  cls: "ql-dh-stats__card--delivering" },
            { label: "Hoàn thành", key: "hoan_thanh", cls: "ql-dh-stats__card--completed" },
          ].map(({ label, key, cls }) => (
            <div key={key} className={`ql-dh-stats__card ${cls}`}>
              <span className="ql-dh-stats__num">{getOrderCountByStatus(key)}</span>
              <span className="ql-dh-stats__label">{label}</span>
            </div>
          ))}
        </div>
      </header>

      {/* ── Filters ── */}
      <section className="ql-dh-filters">
        <div className="ql-dh-search">
          <input
            type="text"
            placeholder="Tìm theo mã đơn, tên khách hàng, địa chỉ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ql-dh-search__input"
          />
          <span className="ql-dh-search__icon">🔍</span>
        </div>
        <div className="ql-dh-tabs">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`ql-dh-tab ${filter === tab.key ? "ql-dh-tab--active" : ""}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label} ({getOrderCountByStatus(tab.key)})
            </button>
          ))}
        </div>
      </section>

      {/* ── Order grid ── */}
      <section className="ql-dh-orders">
        {filteredOrders.length === 0 ? (
          <div className="ql-dh-empty">
            <h3>📭 Không có đơn hàng nào</h3>
            <p>
              {searchTerm
                ? "Không tìm thấy đơn hàng phù hợp với từ khóa tìm kiếm."
                : "Chưa có đơn hàng nào trong hệ thống."}
            </p>
          </div>
        ) : (
          <div className="ql-dh-grid">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                updating={updating}
                loadingInvoice={loadingInvoice}
                isPrivileged={isPrivileged}
                onViewDetail={() => openOrderModal(order)}
                onViewInvoice={() => handleViewInvoice(order.id)}
                onUpdateStatus={updateOrderStatus}
                onResetShipper={handleResetShipper}
                onOpenDoiShipper={openDoiShipperModal}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Detail modal ── */}
      {showModal && (
        <div className="ql-dh-overlay" onClick={closeModal}>
          <div className="ql-dh-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ql-dh-modal__header">
              <h2>Chi tiết đơn hàng #{selectedOrder?.id || "..."}</h2>
              <button className="ql-dh-modal__close" onClick={closeModal}>✕</button>
            </div>
            <div className="ql-dh-modal__body">
              {loadingDetails ? (
                <div className="ql-dh-center-box">
                  <div className="ql-dh-spinner" />
                  <p>Đang tải chi tiết đơn hàng...</p>
                </div>
              ) : selectedOrder ? (
                <OrderDetail
                  order={selectedOrder}
                  updating={updating}
                  loadingInvoice={loadingInvoice}
                  isPrivileged={isPrivileged}
                  onViewInvoice={handleViewInvoice}
                  onUpdateStatus={updateOrderStatus}
                  onResetShipper={handleResetShipper}
                  onOpenDoiShipper={openDoiShipperModal}
                />
              ) : (
                <p className="ql-dh-center-box">Không thể tải chi tiết đơn hàng</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Đổi shipper modal (chỉ ADMIN / QUANLY) ── */}
      {showDoiShipperModal && isPrivileged && (
        <div className="ql-dh-overlay" onClick={() => setShowDoiShipperModal(false)}>
          <div className="ql-dh-modal ql-dh-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="ql-dh-modal__header">
              <h2>🔄 Đổi Shipper — Đơn #{doiShipperOrderId}</h2>
              <button className="ql-dh-modal__close" onClick={() => setShowDoiShipperModal(false)}>✕</button>
            </div>
            <div className="ql-dh-modal__body">
              <p className="ql-dh-modal__desc">Chọn shipper mới để giao đơn hàng này:</p>
              <select
                value={selectedShipperId}
                onChange={(e) => setSelectedShipperId(e.target.value)}
                className="ql-dh-select"
              >
                <option value="">-- Chọn shipper --</option>
                {danhSachShipper.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.hoTen || s.tenNguoiDung} — {s.soDienThoai || s.sdt || "N/A"}
                  </option>
                ))}
              </select>
              <div className="ql-dh-modal__actions">
                <button
                  className="ql-dh-btn ql-dh-btn--ghost"
                  onClick={() => setShowDoiShipperModal(false)}
                >
                  Hủy
                </button>
                <button
                  className="ql-dh-btn ql-dh-btn--purple"
                  onClick={handleDoiShipper}
                  disabled={loadingDoiShipper || !selectedShipperId}
                >
                  {loadingDoiShipper ? "Đang xử lý..." : "✅ Xác nhận đổi"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────

const OrderCard = ({
  order, updating, loadingInvoice, isPrivileged,
  onViewDetail, onViewInvoice, onUpdateStatus, onResetShipper, onOpenDoiShipper,
}) => (
  <div className="ql-dh-card">
    {/* Header */}
    <div className="ql-dh-card__header">
      <div>
        <strong className="ql-dh-card__id">Đơn hàng #{order.id}</strong>
        <span className="ql-dh-card__time">{getTimeElapsed(order.ngayTao)}</span>
      </div>
      <span className="ql-dh-badge" style={{ backgroundColor: STATUS_COLORS[order.trangThai] }}>
        {STATUS_LABELS[order.trangThai]}
      </span>
    </div>

    {/* Customer */}
    <div className="ql-dh-card__row">
      <span>👤</span>
      <div>
        <div className="ql-dh-card__name">
          {order.nguoiDung?.hoTen || order.nguoiDung?.tenNguoiDung || "N/A"}
        </div>
        <div className="ql-dh-card__phone">
          {order.nguoiDung?.soDienThoai || order.nguoiDung?.sdt || "N/A"}
        </div>
      </div>
    </div>

    {/* Address */}
    <div className="ql-dh-card__address">
      <span>📍</span>
      <span>{order.diaChiGiaoHang || order.nguoiDung?.diaChi || "Chưa có địa chỉ"}</span>
    </div>

    {/* Shipper (khi đang giao) */}
    {order.trangThai === ORDER_STATUS.DANG_GIAO && (
      <div className="ql-dh-card__shipper">
        <span>🚚</span>
        <span>
          {order.nvGiaoHang
            ? `Shipper: ${order.nvGiaoHang.hoTen || order.nvGiaoHang.tenNguoiDung} — ${order.nvGiaoHang.soDienThoai || ""}`
            : "Chưa có shipper nhận"}
        </span>
      </div>
    )}

    {/* Date */}
    <div className="ql-dh-card__row ql-dh-card__row--sm">
      <span>📅</span>
      <span>{formatDateTime(order.ngayTao)}</span>
    </div>

    {/* Note */}
    {order.ghiChu && (
      <div className="ql-dh-card__note">
        <span>📝</span>
        <span>{order.ghiChu}</span>
      </div>
    )}

    {/* Total */}
    <div className="ql-dh-card__summary">
      <span>💰 Thành tiền:</span>
      <span className="ql-dh-card__total">{order.tongTien?.toLocaleString() || "0"}₫</span>
    </div>

    {/* Actions */}
    <div className="ql-dh-card__actions">
      <button className="ql-dh-btn ql-dh-btn--gray" onClick={onViewDetail}>Chi tiết</button>

      <button
        className="ql-dh-btn ql-dh-btn--teal"
        onClick={onViewInvoice}
        disabled={loadingInvoice[order.id]}
      >
        {loadingInvoice[order.id] ? "..." : "🧾 Hóa đơn"}
      </button>

      {order.trangThai === ORDER_STATUS.DANG_XU_LY && (
        <button className="ql-dh-btn ql-dh-btn--green" onClick={() => onUpdateStatus(order.id, "DANG_LAM")} disabled={updating}>
          Nhận đơn
        </button>
      )}
      {order.trangThai === ORDER_STATUS.DANG_LAM && (
        <button className="ql-dh-btn ql-dh-btn--blue" onClick={() => onUpdateStatus(order.id, "DANG_GIAO")} disabled={updating}>
          Bắt đầu giao
        </button>
      )}
      {order.trangThai === ORDER_STATUS.DANG_GIAO && (
        <button className="ql-dh-btn ql-dh-btn--teal" onClick={() => onUpdateStatus(order.id, "HOAN_THANH")} disabled={updating}>
          Hoàn thành
        </button>
      )}

      {/* Chỉ ADMIN / QUANLY */}
      {order.trangThai === ORDER_STATUS.DANG_GIAO && isPrivileged && (
        <>
          <button className="ql-dh-btn ql-dh-btn--orange" onClick={() => onResetShipper(order.id)} disabled={updating} title="Trả đơn về chờ giao lại">
            ↩️ Reset
          </button>
          <button className="ql-dh-btn ql-dh-btn--purple" onClick={() => onOpenDoiShipper(order.id)} disabled={updating} title="Gán shipper khác">
            🔄 Đổi shipper
          </button>
        </>
      )}
    </div>
  </div>
);

const OrderDetail = ({
  order, updating, loadingInvoice, isPrivileged,
  onViewInvoice, onUpdateStatus, onResetShipper, onOpenDoiShipper,
}) => (
  <>
    {/* Thông tin khách hàng */}
    <DetailSection title="Thông tin khách hàng">
      <DetailGrid>
        <DetailItem label="Tên"   value={order.nguoiDung?.hoTen || order.nguoiDung?.tenNguoiDung || "N/A"} />
        <DetailItem label="SĐT"   value={order.nguoiDung?.soDienThoai || order.nguoiDung?.sdt || "N/A"} />
        <DetailItem label="Email" value={order.nguoiDung?.email || "N/A"} />
      </DetailGrid>
    </DetailSection>

    {/* Thông tin đơn hàng */}
    <DetailSection title="Thông tin đơn hàng">
      <DetailGrid>
        <DetailItem label="Trạng thái">
          <span className="ql-dh-badge" style={{ backgroundColor: STATUS_COLORS[order.trangThai] }}>
            {STATUS_LABELS[order.trangThai]}
          </span>
        </DetailItem>
        <DetailItem label="Thời gian đặt"      value={formatDateTime(order.ngayTao)} />
        <DetailItem label="Địa chỉ giao hàng"  value={order.diaChiGiaoHang || order.nguoiDung?.diaChi || "N/A"} />
        <DetailItem label="Ghi chú"             value={order.ghiChu || "Không có ghi chú"} />
        <DetailItem label="🚚 Shipper">
          {order.nvGiaoHang
            ? <span className="ql-dh-detail__shipper-name">{order.nvGiaoHang.hoTen || order.nvGiaoHang.tenNguoiDung}</span>
            : <span className="ql-dh-detail__no-shipper">Chưa có shipper nhận</span>
          }
        </DetailItem>
        {order.nvGiaoHang && (
          <DetailItem label="📞 SĐT Shipper" value={order.nvGiaoHang.soDienThoai || "N/A"} />
        )}
      </DetailGrid>
    </DetailSection>

    {/* Chi tiết món ăn */}
    <DetailSection title="Chi tiết món ăn">
      {order.chiTietDonHang?.length > 0 ? (
        <div className="ql-dh-items">
          {order.chiTietDonHang.map((item, i) => (
            <div key={i} className="ql-dh-item">
              <div className="ql-dh-item__info">
                {item.monAn?.hinhAnhMonAns?.length > 0
                  ? <img src={item.monAn.hinhAnhMonAns[0].duongDan} alt={item.monAn.tenMonAn} className="ql-dh-item__img" />
                  : <div className="ql-dh-item__no-img">🍽️</div>
                }
                <div>
                  <div className="ql-dh-item__name">{item.monAn?.tenMonAn || `Món ăn ID: ${item.monAnId}`}</div>
                  <div className="ql-dh-item__price">
                    {(item.gia || item.donGia)?.toLocaleString() || "0"}₫ × {item.soLuong || 0}
                  </div>
                </div>
              </div>
              <div className="ql-dh-item__total">
                {((item.gia || item.donGia || 0) * (item.soLuong || 0)).toLocaleString()}₫
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ql-dh-no-items">
          <p>⚠️ Không có thông tin chi tiết món ăn</p>
          <p>Dữ liệu chi tiết món ăn chưa được load từ server</p>
        </div>
      )}
    </DetailSection>

    {/* Tổng kết */}
    <DetailSection title="Tổng kết thanh toán">
      <div className="ql-dh-summary">
        <div className="ql-dh-summary__row">
          <span>Tạm tính:</span>
          <span>{(order.tongTienGoc || order.tongTien)?.toLocaleString() || "0"}₫</span>
        </div>
        {order.giamGia > 0 && (
          <div className="ql-dh-summary__row ql-dh-summary__row--discount">
            <span>Giảm giá:</span>
            <span>-{order.giamGia.toLocaleString()}₫</span>
          </div>
        )}
        {order.voucher && (
          <div className="ql-dh-summary__row ql-dh-summary__row--discount">
            <span>Voucher ({order.voucher.maVoucher}):</span>
            <span>{order.voucher.moTa}</span>
          </div>
        )}
        <div className="ql-dh-summary__row ql-dh-summary__row--total">
          <span>Tổng cộng:</span>
          <span className="ql-dh-summary__total-value">{order.tongTien?.toLocaleString() || "0"}₫</span>
        </div>
      </div>
    </DetailSection>

    {/* Modal actions */}
    <div className="ql-dh-modal__actions">
      <button
        className="ql-dh-btn ql-dh-btn--teal"
        onClick={() => onViewInvoice(order.id)}
        disabled={loadingInvoice[order.id]}
      >
        {loadingInvoice[order.id] ? "Đang tải..." : "🧾 Xem/In hóa đơn"}
      </button>

      {order.trangThai === ORDER_STATUS.DANG_XU_LY && (
        <button className="ql-dh-btn ql-dh-btn--green" onClick={() => onUpdateStatus(order.id, "DANG_LAM")} disabled={updating}>
          {updating ? "Đang xử lý..." : "Nhận đơn hàng"}
        </button>
      )}
      {order.trangThai === ORDER_STATUS.DANG_LAM && (
        <button className="ql-dh-btn ql-dh-btn--blue" onClick={() => onUpdateStatus(order.id, "DANG_GIAO")} disabled={updating}>
          {updating ? "Đang xử lý..." : "Bắt đầu giao hàng"}
        </button>
      )}
      {order.trangThai === ORDER_STATUS.DANG_GIAO && (
        <button className="ql-dh-btn ql-dh-btn--teal" onClick={() => onUpdateStatus(order.id, "HOAN_THANH")} disabled={updating}>
          {updating ? "Đang xử lý..." : "Hoàn thành giao hàng"}
        </button>
      )}

      {/* Chỉ ADMIN / QUANLY */}
      {order.trangThai === ORDER_STATUS.DANG_GIAO && isPrivileged && (
        <>
          <button className="ql-dh-btn ql-dh-btn--orange" onClick={() => onResetShipper(order.id)} disabled={updating}>
            {updating ? "Đang xử lý..." : "↩️ Trả về chờ giao"}
          </button>
          <button className="ql-dh-btn ql-dh-btn--purple" onClick={() => onOpenDoiShipper(order.id)} disabled={updating}>
            🔄 Đổi shipper
          </button>
        </>
      )}
    </div>
  </>
);

// ─── Tiny reusable pieces ─────────────────────────────────────
const DetailSection = ({ title, children }) => (
  <div className="ql-dh-detail-section">
    <h3 className="ql-dh-detail-section__title">{title}</h3>
    {children}
  </div>
);

const DetailGrid = ({ children }) => (
  <div className="ql-dh-detail-grid">{children}</div>
);

const DetailItem = ({ label, value, children }) => (
  <div className="ql-dh-detail-item">
    <span className="ql-dh-detail-item__label">{label}</span>
    {children ?? <span className="ql-dh-detail-item__value">{value}</span>}
  </div>
);

export default QuanLyDonHang;