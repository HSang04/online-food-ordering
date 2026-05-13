import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../services/axiosInstance";
import "./GiaoHang.css";

const GiaoHang = () => {
  const navigate = useNavigate();
  const [donHangs, setDonHangs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const intervalRef = useRef(null);

  const jwt = localStorage.getItem("jwt");

  const fetchDonHangDangGiao = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const shipperId = localStorage.getItem("idNguoiDung");

      const response = await axios.get(`/don-hang/shipper/${shipperId}`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });

      if (response.data && Array.isArray(response.data)) {
        const dangGiao = response.data.filter(order => order.trangThai === "DANG_GIAO");
        const sortedOrders = dangGiao.sort((a, b) => new Date(b.ngayTao) - new Date(a.ngayTao));
        setDonHangs(sortedOrders);
      }
    } catch (err) {
      console.error("Lỗi khi lấy đơn đang giao:", err);
      setError("Không thể tải danh sách đơn hàng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  const silentRefresh = useCallback(async () => {
    try {
      const shipperId = localStorage.getItem("idNguoiDung");
      const response = await axios.get(`/don-hang/shipper/${shipperId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      if (response.data) {
        const dangGiao = response.data.filter(order => order.trangThai === "DANG_GIAO");
        const sortedOrders = dangGiao.sort((a, b) => new Date(b.ngayTao) - new Date(a.ngayTao));
        setDonHangs(prevOrders => {
          const hasChanges = JSON.stringify(prevOrders) !== JSON.stringify(sortedOrders);
          return hasChanges ? sortedOrders : prevOrders;
        });
        setLastRefreshTime(new Date());
      }
    } catch (err) {
      console.error("Lỗi khi refresh âm thầm:", err);
    } finally {
      setIsAutoRefreshing(false);
    }
  }, [jwt]);

  useEffect(() => {
    if (jwt && donHangs.length > 0) {
      intervalRef.current = setInterval(() => silentRefresh(), 30000);
      return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }
  }, [jwt, silentRefresh, donHangs.length]);

  useEffect(() => {
    if (jwt) fetchDonHangDangGiao();
  }, [fetchDonHangDangGiao, jwt]);

  // ===== HOÀN THÀNH ĐƠN =====
  const handleHoanThanh = async (orderId, e) => {
    e.stopPropagation();
    if (!window.confirm(`Xác nhận giao thành công đơn hàng #${orderId}?`)) return;

    const shipperId = Number(localStorage.getItem("idNguoiDung"));
    try {
      await axios.patch(`/don-hang/${orderId}/hoan-thanh`, {}, {
        params: { shipperId },
        headers: { Authorization: `Bearer ${jwt}` }
      });
      alert(`✅ Đơn hàng #${orderId} đã giao thành công!`);
      setDonHangs(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      alert(`❌ ${err.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại!"}`);
    }
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getTimeElapsed = (orderDate) => {
    const diffMs = new Date() - new Date(orderDate);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `${diffDays} ngày trước`;
    if (diffHours > 0) return `${diffHours} giờ trước`;
    return `${diffMins} phút trước`;
  };

  const filteredOrders = donHangs.filter(order =>
    searchTerm === "" ||
    order.id.toString().includes(searchTerm) ||
    order.nguoiDung?.hoTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.nguoiDung?.tenNguoiDung?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.diaChiGiaoHang?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (order) => {
    navigate(`/giao-hang/${order.id}`, { state: { order } });
  };

  if (loading) {
    return (
      <div className="giao-hang-container">
        <div className="giao-hang-loading-container">
          <div className="giao-hang-loading-spinner"></div>
          <p>Đang tải danh sách đơn hàng đang giao...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="giao-hang-container">
        <div className="giao-hang-error-container">
          <h2>⚠️ Có lỗi xảy ra</h2>
          <p>{error}</p>
          <button onClick={fetchDonHangDangGiao} className="giao-hang-btn-retry">Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="giao-hang-container">
      <header className="giao-hang-page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 className="giao-hang-page-title">🚚 Đơn hàng đang giao</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {isAutoRefreshing && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{
                  width: '8px', height: '8px',
                  backgroundColor: '#4caf50', borderRadius: '50%',
                  animation: 'giao-hang-pulse 1.5s infinite'
                }}></div>
                <span style={{ fontSize: '12px', color: '#666' }}>Đang cập nhật...</span>
              </div>
            )}
            {lastRefreshTime && (
              <span style={{ fontSize: '12px', color: '#999' }}>
                Cập nhật: {lastRefreshTime.toLocaleTimeString('vi-VN')}
              </span>
            )}
          </div>
        </div>

        <div className="giao-hang-stats-row">
          <div className="giao-hang-stat-card">
            <span className="giao-hang-stat-number">{donHangs.length}</span>
            <span className="giao-hang-stat-label">Đơn đang giao</span>
          </div>
          <div className="giao-hang-stat-card giao-hang-urgent">
            <span className="giao-hang-stat-number">
              {donHangs.filter(order =>
                Math.floor((new Date() - new Date(order.ngayTao)) / 60000) > 30
              ).length}
            </span>
            <span className="giao-hang-stat-label">Quá 30 phút</span>
          </div>
        </div>
      </header>

      <div className="giao-hang-filters-section">
        <div className="giao-hang-search-box">
          <input
            type="text"
            placeholder="Tìm theo mã đơn, tên khách hàng, địa chỉ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="giao-hang-search-input"
          />
          <span className="giao-hang-search-icon">🔍</span>
        </div>
        <button onClick={fetchDonHangDangGiao} className="giao-hang-btn-refresh" disabled={loading}>
          🔄 Làm mới
        </button>
      </div>

      <div className="giao-hang-orders-section">
        {filteredOrders.length === 0 ? (
          <div className="giao-hang-empty-state">
            <h3>📭 Không có đơn hàng nào đang giao</h3>
            <p>{searchTerm ? "Không tìm thấy đơn hàng phù hợp." : "Hiện tại không có đơn hàng nào đang trong quá trình giao."}</p>
          </div>
        ) : (
          <div className="giao-hang-orders-grid">
            {filteredOrders.map((order) => {
              const diffMins = Math.floor((new Date() - new Date(order.ngayTao)) / 60000); // 30p = qua thoi gian
              const isUrgent = diffMins > 30;

              return (
                <div
                  key={order.id}
                  className={`giao-hang-order-card ${isUrgent ? 'urgent' : ''}`}
                  onClick={() => handleViewDetails(order)}
                >
                  {isUrgent && <div className="giao-hang-urgent-badge"> Quá thời gian</div>}

                  <div className="giao-hang-order-header">
                    <div className="giao-hang-order-id">
                      <strong>Đơn hàng #{order.id}</strong>
                      <span className="giao-hang-order-time">{getTimeElapsed(order.ngayTao)}</span>
                    </div>
                    <div className="giao-hang-order-status">🚚 Đang giao</div>
                  </div>

                  <div className="giao-hang-order-customer">
                    <div className="giao-hang-customer-info">
                      <span className="giao-hang-customer-icon">👤</span>
                      <div>
                        <div className="giao-hang-customer-name">
                          {order.nguoiDung?.hoTen || order.nguoiDung?.tenNguoiDung || "N/A"}
                        </div>
                        <div className="giao-hang-customer-phone">
                          📞 {order.nguoiDung?.soDienThoai || order.nguoiDung?.sdt || "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="giao-hang-order-address">
                    <span className="giao-hang-address-icon">📍</span>
                    <span className="giao-hang-address-text">
                      {order.diaChiGiaoHang || order.nguoiDung?.diaChi || "Chưa có địa chỉ"}
                    </span>
                  </div>

                  <div className="giao-hang-order-date">
                    <span className="giao-hang-date-icon">📅</span>
                    <span className="giao-hang-date-text">Đặt lúc: {formatDateTime(order.ngayTao)}</span>
                  </div>

                  {order.ghiChu && (
                    <div className="giao-hang-order-note">
                      <span className="giao-hang-note-icon">📝</span>
                      <span className="giao-hang-note-text">{order.ghiChu}</span>
                    </div>
                  )}

                  <div className="giao-hang-order-summary">
                    <div className="giao-hang-items-count">💰 Tổng tiền:</div>
                    <div className="giao-hang-order-total">
                      {order.tongTien?.toLocaleString() || "0"}₫
                    </div>
                  </div>

                  {/* ===== 2 NÚT HÀNH ĐỘNG ===== */}
                  <div className="giao-hang-order-actions">
                    <button
                      className="giao-hang-btn-view-map"
                      onClick={(e) => { e.stopPropagation(); handleViewDetails(order); }}
                    >
                      🗺️ Đường đi
                    </button>
                    <button
                      className="giao-hang-btn-hoan-thanh"
                      onClick={(e) => handleHoanThanh(order.id, e)}
                    >
                      ✅ Hoàn thành
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default GiaoHang;