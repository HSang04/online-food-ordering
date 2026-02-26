import React, { useState, useEffect, useCallback } from "react";
import axios from "../../../services/axiosInstance";
import "./DonChoNhan.css";

const DonChoNhan = () => {
  const [donChoNhan, setDonChoNhan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const jwt = localStorage.getItem("jwt");

  const fetchDonChoNhan = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get("/don-hang/cho-shipper", {
        headers: { Authorization: `Bearer ${jwt}` }
      });

      if (response.data && Array.isArray(response.data)) {
        const sorted = response.data.sort(
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
    const confirmNhan = window.confirm(
      `Xác nhận nhận đơn hàng #${orderId}?\n\nSau khi nhận, đơn này sẽ chuyển sang trạng thái "Đang giao" và chỉ bạn nhìn thấy.`
    );
    if (!confirmNhan) return;

    // Đảm bảo shipperId là số, không phải string
    const shipperIdNum = Number(localStorage.getItem("idNguoiDung"));
    if (!shipperIdNum || isNaN(shipperIdNum)) {
      alert("❌ Không tìm thấy thông tin shipper. Vui lòng đăng nhập lại!");
      return;
    }

    console.log("Đang nhận đơn:", { orderId, shipperId: shipperIdNum });

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
        alert(`✅ Nhận đơn #${orderId} thành công!`);
        setDonChoNhan(prev => prev.filter(order => order.id !== orderId));
      }
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message || err.message;

      console.error("Lỗi nhận đơn:", { status, msg, response: err.response?.data });

      if (status === 409) {
        alert(`⚠️ Đơn #${orderId} vừa được shipper khác nhận mất!\nDanh sách sẽ được cập nhật.`);
        fetchDonChoNhan();
      } else {
        alert(`❌ Lỗi: ${msg}`);
      }
    }
  };

  const filteredOrders = donChoNhan.filter(order => {
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
                  className="btn-nhan-don"
                >
                  ✅ Nhận đơn
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