import React, { useState, useEffect, useCallback } from "react";
import axios from "../../../services/axiosInstance";
import "./DonChoNhan.css";

const DonChoNhan = () => {
  const [donChoNhan, setDonChoNhan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  // Track loading state per đơn để disable nút khi đang xử lý
  const [nhanDonLoading, setNhanDonLoading] = useState({});
  // Toast notification thay cho alert
  const [toast, setToast] = useState(null);

  const jwt = localStorage.getItem("jwt");

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchDonChoNhan = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/don-hang/cho-shipper", {
        headers: { Authorization: `Bearer ${jwt}` }
      });

      if (response.data && Array.isArray(response.data)) {
        // ✅ Lọc chỉ đơn có nv_giao_hang === null (chưa có shipper nào nhận)
         console.log("📦 Data từ API:", JSON.stringify(response.data[0], null, 2));
        const filtered = response.data.filter(
          (order) => order.nvGiaoHang === null || order.nv_giao_hang === null
        );

        const sorted = filtered.sort(
          (a, b) => new Date(b.ngayTao) - new Date(a.ngayTao)
        );
        setDonChoNhan(sorted);
      }
    } catch (err) {
      console.error("Lỗi khi lấy danh sách đơn chờ nhận:", err);
      setError("Không thể tải danh sách đơn chờ nhận. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => {
    if (jwt) {
      fetchDonChoNhan();
      // Auto refresh mỗi 15s vì đơn chờ thay đổi nhanh (có thể bị shipper khác lấy)
      const interval = setInterval(fetchDonChoNhan, 15000);
      return () => clearInterval(interval);
    }
  }, [fetchDonChoNhan, jwt]);

  const handleNhanDon = async (orderId) => {
    // Tránh double-click: nếu đang xử lý thì bỏ qua
    if (nhanDonLoading[orderId]) return;

    const shipperIdNum = Number(localStorage.getItem("idNguoiDung"));
    if (!shipperIdNum || isNaN(shipperIdNum)) {
      showToast("❌ Không tìm thấy thông tin shipper. Vui lòng đăng nhập lại!", "error");
      return;
    }

    // Disable nút ngay lập tức
    setNhanDonLoading((prev) => ({ ...prev, [orderId]: true }));

    try {
      const response = await axios.patch(
        `/don-hang/${orderId}/nhan`,
        {},
        {
          params: { shipperId: shipperIdNum },
          headers: { Authorization: `Bearer ${jwt}` }
        }
      );

      if (response.data) {
        showToast(`✅ Nhận đơn #${orderId} thành công!`, "success");
        // Xóa đơn khỏi danh sách ngay lập tức (không cần chờ refresh)
        setDonChoNhan((prev) => prev.filter((order) => order.id !== orderId));
      }
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message;

      console.error("Lỗi nhận đơn:", { status, msg, response: err.response?.data });

      if (status === 409) {
        showToast(`⚠️ Đơn #${orderId} vừa được shipper khác nhận mất!`, "warning");
        // Refresh danh sách để loại đơn đã bị lấy
        fetchDonChoNhan();
      } else {
        showToast(`❌ Lỗi: ${msg}`, "error");
        // Re-enable nút nếu lỗi khác (để shipper thử lại)
        setNhanDonLoading((prev) => ({ ...prev, [orderId]: false }));
      }
    }
  };

  const filteredOrders = donChoNhan.filter((order) => {
    return (
      searchTerm === "" ||
      order.id.toString().includes(searchTerm) ||
      order.nguoiDung?.hoTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.diaChiGiaoHang?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="don-cho-nhan-container">
        <div className="loading">Đang tải danh sách đơn chờ nhận...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="don-cho-nhan-container">
        <div className="error-message">
          ⚠️ {error}
          <button onClick={fetchDonChoNhan} className="btn-retry">
            🔄 Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="don-cho-nhan-container">
      {/* Toast notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      <header className="don-cho-nhan-header">
        <h1>📥 Đơn hàng chờ nhận</h1>
        <p>Tổng: {donChoNhan.length} đơn đang chờ</p>
      </header>

      <div className="don-cho-nhan-search">
        <input
          type="text"
          placeholder="🔍 Tìm kiếm theo mã đơn, tên khách, hoặc địa chỉ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button onClick={fetchDonChoNhan} className="btn-refresh">
          🔄 Làm mới
        </button>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <p>📭 Không có đơn hàng nào chờ nhận</p>
          {searchTerm && (
            <p className="sub-text">
              Không tìm thấy kết quả cho từ khóa "{searchTerm}"
            </p>
          )}
        </div>
      ) : (
        <div className="don-cho-nhan-list">
          {filteredOrders.map((order) => (
            <div key={order.id} className="don-item">
              <div className="don-item-header">
                <h3>Đơn hàng #{order.id}</h3>
                <span className="don-status">Chờ nhận</span>
              </div>

              <div className="don-item-body">
                <div className="don-info-row">
                  <span className="label">👤 Khách hàng:</span>
                  <span className="value">
                    {order.nguoiDung?.hoTen || order.nguoiDung?.tenNguoiDung || "N/A"}
                  </span>
                </div>

                <div className="don-info-row">
                  <span className="label">📞 Điện thoại:</span>
                  <span className="value">
                    {order.nguoiDung?.soDienThoai || order.nguoiDung?.sdt || "N/A"}
                  </span>
                </div>

                <div className="don-info-row">
                  <span className="label">📍 Địa chỉ:</span>
                  <span className="value">{order.diaChiGiaoHang || "Chưa có"}</span>
                </div>

                <div className="don-info-row">
                  <span className="label">💰 Tổng tiền:</span>
                  <span className="value highlight">
                    {order.tongTien?.toLocaleString()}₫
                  </span>
                </div>

                <div className="don-info-row">
                  <span className="label">📅 Thời gian đặt:</span>
                  <span className="value">{formatDateTime(order.ngayTao)}</span>
                </div>

                {order.ghiChu && (
                  <div className="don-info-row">
                    <span className="label">📝 Ghi chú:</span>
                    <span className="value">{order.ghiChu}</span>
                  </div>
                )}
              </div>

              <div className="don-item-footer">
                <button
                  onClick={() => handleNhanDon(order.id)}
                  className={`btn-nhan-don ${nhanDonLoading[order.id] ? "loading" : ""}`}
                  disabled={!!nhanDonLoading[order.id]}
                >
                  {nhanDonLoading[order.id] ? "⏳ Đang xử lý..." : "✅ Nhận đơn"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DonChoNhan;