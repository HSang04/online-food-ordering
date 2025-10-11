import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../services/axiosInstance";
import "./LichSuGiaoDich.css";

const LichSuGiaoDich = () => {
  const navigate = useNavigate();
  const [donHangs, setDonHangs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const jwt = localStorage.getItem("jwt");
  const nguoiDungId = localStorage.getItem("idNguoiDung");

  const ORDER_STATUS = {
    DANG_XU_LY: "DANG_XU_LY",
    DANG_LAM: "DANG_LAM",
    DANG_GIAO: "DANG_GIAO",
    HOAN_THANH: "HOAN_THANH",
    DA_HUY: "DA_HUY"
  };

  const STATUS_LABELS = {
    "Đang xử lý": "Đang xử lý",
    "Đang làm": "Đang làm",
    "Đang giao": "Đang giao",
    "Hoàn thành": "Hoàn thành",
    "Đã hủy": "Đã hủy",
    [ORDER_STATUS.DANG_XU_LY]: "Đang xử lý",
    [ORDER_STATUS.DANG_LAM]: "Đang làm",
    [ORDER_STATUS.DANG_GIAO]: "Đang giao",
    [ORDER_STATUS.HOAN_THANH]: "Hoàn thành",
    [ORDER_STATUS.DA_HUY]: "Đã hủy"
  };

  const STATUS_COLORS = {
    "Đang xử lý": "#ffa500",
    "Đang làm": "#2196f3",
    "Đang giao": "#9c27b0",
    "Hoàn thành": "#4caf50",
    "Đã hủy": "#f44336",
    [ORDER_STATUS.DANG_XU_LY]: "#ffa500",
    [ORDER_STATUS.DANG_LAM]: "#2196f3",
    [ORDER_STATUS.DANG_GIAO]: "#9c27b0",
    [ORDER_STATUS.HOAN_THANH]: "#4caf50",
    [ORDER_STATUS.DA_HUY]: "#f44336"
  };

  const fetchDonHangs = useCallback(async () => {
    try {
      setLoading(true);
     
      
      if (!nguoiDungId) {
        setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        return;
      }
      
      const response = await axios.get(`/don-hang/nguoi-dung/${nguoiDungId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (response.data) {
        const sortedOrders = response.data.sort((a, b) =>
          new Date(b.ngayTao) - new Date(a.ngayTao)
        );
        setDonHangs(sortedOrders);
      }
    } catch (err) {
      console.error("Lỗi khi lấy lịch sử đơn hàng:", err);
      setError("Không thể tải lịch sử đơn hàng. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
 }, [jwt, nguoiDungId]);

  // Lấy chi tiết đơn hàng
  const fetchOrderDetails = async (orderId) => {
    try {
      setLoadingDetails(true);
      console.log("Đang lấy chi tiết đơn hàng:", orderId);

      const response = await axios.get(`/chi-tiet-don-hang/don-hang/${orderId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      if (response.data && Array.isArray(response.data)) {
        const chiTietList = response.data;
        const donHangInfo = chiTietList.length > 0 ? chiTietList[0].donHang : null;

        if (!donHangInfo) {
          throw new Error("Không tìm thấy thông tin đơn hàng");
        }

        const processedChiTiet = chiTietList.map(item => ({
          ...item,
          monAnId: item.monAn?.id || item.monAnId,
          gia: item.donGia || item.gia,
          thanhTien: (item.donGia || item.gia || 0) * (item.soLuong || 0)
        }));

        const completeOrder = {
          ...donHangInfo,
          chiTietDonHang: processedChiTiet,
          tongTienGoc: processedChiTiet.reduce((sum, item) =>
            sum + (item.thanhTien || 0), 0
          )
        };

        console.log("Đơn hàng sau khi xử lý:", completeOrder);
        setSelectedOrder(completeOrder);
      } else {
        const orderFromList = donHangs.find(order => order.id === orderId);
        if (orderFromList) {
          setSelectedOrder(orderFromList);
        } else {
          throw new Error("Không tìm thấy thông tin đơn hàng");
        }
      }
    } catch (err) {
      console.error("Lỗi khi lấy chi tiết đơn hàng:", err);
      const orderFromList = donHangs.find(order => order.id === orderId);
      if (orderFromList) {
        setSelectedOrder(orderFromList);
      } else {
        alert("Không thể tải chi tiết đơn hàng. Vui lòng thử lại!");
        setSelectedOrder(null);
      }
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (jwt) {
      fetchDonHangs();
    }
  }, [fetchDonHangs, jwt]);

 
  const normalizeStatus = (status) => {
    const statusMap = {
      "Đang xử lý": "dang_xu_ly",
      "Đang làm": "dang_lam",
      "Đang giao": "dang_giao",
      "Hoàn thành": "hoan_thanh",
      "Đã hủy": "da_huy"
    };
    return statusMap[status] || status.toLowerCase().replace(/\s+/g, '_');
  };

  
  const filteredOrders = donHangs.filter(order => {
    const normalizedStatus = normalizeStatus(order.trangThai);
    const matchesFilter = filter === "all" || normalizedStatus === filter;
    const matchesSearch = searchTerm === "" ||
      order.id.toString().includes(searchTerm) ||
      order.diaChiGiaoHang?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });


  const getOrderCountByStatus = (status) => {
    if (status === "all") return donHangs.length;
    return donHangs.filter(order => normalizeStatus(order.trangThai) === status).length;
  };


  const cancelOrder = async (orderId) => {
    const confirmCancel = window.confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?");
    if (!confirmCancel) return;

    try {
      setCancelling(true);
      
      
      if (!nguoiDungId) {
        alert("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
        return;
      }

      const response = await axios.patch(`/don-hang/huy/${orderId}?nguoiDungId=${nguoiDungId}`, {}, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        },
      });

      if (response.data) {
        setDonHangs(prev => prev.map(order =>
          order.id === orderId
            ? { ...order, trangThai: "DA_HUY" }
            : order
        ));

        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, trangThai: "DA_HUY" }));
        }

        alert(`Hủy đơn hàng #${orderId} thành công!`);
      }
    } catch (err) {
      console.error("Lỗi khi hủy đơn hàng:", err);
      if (err.response?.status === 400) {
        alert("Không thể hủy đơn hàng ở trạng thái hiện tại!");
      } else if (err.response?.status === 404) {
        alert("Không tìm thấy đơn hàng!");
      } else if (err.response?.status === 403) {
        alert("Bạn không có quyền hủy đơn hàng này!");
      } else {
        alert("Có lỗi xảy ra khi hủy đơn hàng. Vui lòng thử lại!");
      }
    } finally {
      setCancelling(false);
    }
  };

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  const getTimeElapsed = (orderDate) => {
    const now = new Date();
    const created = new Date(orderDate);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} ngày trước`;
    if (diffHours > 0) return `${diffHours} giờ trước`;
    return `${diffMins} phút trước`;
  };


  const openOrderModal = async (order) => {
    setShowModal(true);
    await fetchOrderDetails(order.id);
  };


  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

 
  const canCancelOrder = (status) => {
    return status === "DANG_XU_LY" || status === "Đang xử lý";
  };

  // Kiểm tra xem đơn hàng có thể xem hóa đơn không
  const canViewInvoice = (status) => {
    return status === "HOAN_THANH" || status === "Hoàn thành";
  };

  // Hàm xem hóa đơn
  const viewInvoice = (orderId) => {
    navigate(`/hoa-don/${orderId}`);
  };

  if (loading) {
    return (
      <div className="lichSuGiaoDich-container">
        <div className="lichSuGiaoDich-loadingContainer">
          <div className="lichSuGiaoDich-loadingSpinner"></div>
          <p>Đang tải lịch sử đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lichSuGiaoDich-container">
        <div className="lichSuGiaoDich-errorContainer">
          <h2> Có lỗi xảy ra</h2>
          <p>{error}</p>
          <button onClick={fetchDonHangs} className="lichSuGiaoDich-btnRetry">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lichSuGiaoDich-container">
      <header className="lichSuGiaoDich-pageHeader">
        <h1 className="lichSuGiaoDich-pageTitle">📋 Lịch sử đơn hàng</h1>
        <div className="lichSuGiaoDich-statsRow">
          <div className="lichSuGiaoDich-statCard">
            <span className="lichSuGiaoDich-statNumber">{donHangs.length}</span>
            <span className="lichSuGiaoDich-statLabel">Tổng đơn</span>
          </div>
          <div className="lichSuGiaoDich-statCard lichSuGiaoDich-processing">
            <span className="lichSuGiaoDich-statNumber">
              {getOrderCountByStatus("dang_xu_ly")}
            </span>
            <span className="lichSuGiaoDich-statLabel">Đang xử lý</span>
          </div>
          <div className="lichSuGiaoDich-statCard lichSuGiaoDich-preparing">
            <span className="lichSuGiaoDich-statNumber">
              {getOrderCountByStatus("dang_lam")}
            </span>
            <span className="lichSuGiaoDich-statLabel">Đang làm</span>
          </div>
          <div className="lichSuGiaoDich-statCard lichSuGiaoDich-completed">
            <span className="lichSuGiaoDich-statNumber">
              {getOrderCountByStatus("hoan_thanh")}
            </span>
            <span className="lichSuGiaoDich-statLabel">Hoàn thành</span>
          </div>
        </div>
      </header>

      <div className="lichSuGiaoDich-filtersSection">
        <div className="lichSuGiaoDich-searchBox">
          <input
            type="text"
            placeholder="Tìm theo mã đơn, địa chỉ giao hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="lichSuGiaoDich-searchInput"
          />
          <span className="lichSuGiaoDich-searchIcon">🔍</span>
        </div>

        <div className="lichSuGiaoDich-filterTabs">
          <button
            className={`lichSuGiaoDich-filterTab ${filter === "all" ? "lichSuGiaoDich-active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Tất cả ({getOrderCountByStatus("all")})
          </button>
          <button
            className={`lichSuGiaoDich-filterTab ${filter === "dang_xu_ly" ? "lichSuGiaoDich-active" : ""}`}
            onClick={() => setFilter("dang_xu_ly")}
          >
            Đang xử lý ({getOrderCountByStatus("dang_xu_ly")})
          </button>
          <button
            className={`lichSuGiaoDich-filterTab ${filter === "dang_lam" ? "lichSuGiaoDich-active" : ""}`}
            onClick={() => setFilter("dang_lam")}
          >
            Đang làm ({getOrderCountByStatus("dang_lam")})
          </button>
          <button
            className={`lichSuGiaoDich-filterTab ${filter === "dang_giao" ? "lichSuGiaoDich-active" : ""}`}
            onClick={() => setFilter("dang_giao")}
          >
            Đang giao ({getOrderCountByStatus("dang_giao")})
          </button>
          <button
            className={`lichSuGiaoDich-filterTab ${filter === "hoan_thanh" ? "lichSuGiaoDich-active" : ""}`}
            onClick={() => setFilter("hoan_thanh")}
          >
            Hoàn thành ({getOrderCountByStatus("hoan_thanh")})
          </button>
          <button
            className={`lichSuGiaoDich-filterTab ${filter === "da_huy" ? "lichSuGiaoDich-active" : ""}`}
            onClick={() => setFilter("da_huy")}
          >
            Đã hủy ({getOrderCountByStatus("da_huy")})
          </button>
        </div>
      </div>

      <div className="lichSuGiaoDich-ordersSection">
        {filteredOrders.length === 0 ? (
          <div className="lichSuGiaoDich-emptyState">
            <h3>📭 Không có đơn hàng nào</h3>
            <p>
              {searchTerm ? "Không tìm thấy đơn hàng phù hợp với từ khóa tìm kiếm." : "Bạn chưa có đơn hàng nào."}
            </p>
          </div>
        ) : (
          <div className="lichSuGiaoDich-ordersGrid">
            {filteredOrders.map((order) => (
              <div key={order.id} className="lichSuGiaoDich-orderCard">
                <div className="lichSuGiaoDich-orderHeader">
                  <div className="lichSuGiaoDich-orderId">
                    <strong>Đơn hàng #{order.id}</strong>
                    <span className="lichSuGiaoDich-orderTime">{getTimeElapsed(order.ngayTao)}</span>
                  </div>
                  <div
                    className="lichSuGiaoDich-orderStatus"
                    style={{ backgroundColor: STATUS_COLORS[order.trangThai] }}
                  >
                    {STATUS_LABELS[order.trangThai]}
                  </div>
                </div>

                <div className="lichSuGiaoDich-orderAddress">
                  <span className="lichSuGiaoDich-addressIcon">📍</span>
                  <span className="lichSuGiaoDich-addressText">
                    {order.diaChiGiaoHang || "Chưa có địa chỉ"}
                  </span>
                </div>

                <div className="lichSuGiaoDich-orderDate">
                  <span className="lichSuGiaoDich-dateIcon">📅</span>
                  <span className="lichSuGiaoDich-dateText">
                    {formatDateTime(order.ngayTao)}
                  </span>
                </div>

                {order.ghiChu && (
                  <div className="lichSuGiaoDich-orderNote">
                    <span className="lichSuGiaoDich-noteIcon">📝</span>
                    <span className="lichSuGiaoDich-noteText">{order.ghiChu}</span>
                  </div>
                )}

                <div className="lichSuGiaoDich-orderSummary">
                  <div className="lichSuGiaoDich-itemsCount">
                    Thành tiền:
                  </div>
                  <div className="lichSuGiaoDich-orderTotal">
                    {order.tongTien?.toLocaleString() || "0"}₫
                  </div>
                </div>

                <div className="lichSuGiaoDich-orderActions">
                  <button
                    className="lichSuGiaoDich-btnViewDetails"
                    onClick={() => openOrderModal(order)}
                  >
                    Chi tiết
                  </button>

                  {canCancelOrder(order.trangThai) && (
                    <button
                      className="lichSuGiaoDich-btnCancel"
                      onClick={() => cancelOrder(order.id)}
                      disabled={cancelling}
                    >
                      {cancelling ? "Đang hủy..." : "Hủy đơn"}
                    </button>
                  )}

                  {canViewInvoice(order.trangThai) && (
                    <button
                      className="lichSuGiaoDich-btnViewInvoice"
                      onClick={() => viewInvoice(order.id)}
                    >
                      🧾 Xem hóa đơn
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

  
      {showModal && (
        <div className="lichSuGiaoDich-modalOverlay" onClick={closeModal}>
          <div className="lichSuGiaoDich-modalContent" onClick={(e) => e.stopPropagation()}>
            <div className="lichSuGiaoDich-modalHeader">
              <h2>Chi tiết đơn hàng #{selectedOrder?.id || "..."}</h2>
              <button className="lichSuGiaoDich-btnClose" onClick={closeModal}>✕</button>
            </div>

            <div className="lichSuGiaoDich-modalBody">
              {loadingDetails ? (
                <div className="lichSuGiaoDich-loadingContainer">
                  <div className="lichSuGiaoDich-loadingSpinner"></div>
                  <p>Đang tải chi tiết đơn hàng...</p>
                </div>
              ) : selectedOrder ? (
                <>
                  <div className="lichSuGiaoDich-detailSection">
                    <h3>Thông tin đơn hàng</h3>
                    <div className="lichSuGiaoDich-detailGrid">
                      <div className="lichSuGiaoDich-detailItem">
                        <span className="lichSuGiaoDich-label">Trạng thái:</span>
                        <span
                          className="lichSuGiaoDich-statusBadge"
                          style={{ backgroundColor: STATUS_COLORS[selectedOrder.trangThai] }}
                        >
                          {STATUS_LABELS[selectedOrder.trangThai]}
                        </span>
                      </div>
                      <div className="lichSuGiaoDich-detailItem">
                        <span className="lichSuGiaoDich-label">Thời gian đặt:</span>
                        <span>{formatDateTime(selectedOrder.ngayTao)}</span>
                      </div>
                      <div className="lichSuGiaoDich-detailItem">
                        <span className="lichSuGiaoDich-label">Địa chỉ giao hàng:</span>
                        <span>{selectedOrder.diaChiGiaoHang || "N/A"}</span>
                      </div>
                      <div className="lichSuGiaoDich-detailItem">
                        <span className="lichSuGiaoDich-label">Ghi chú:</span>
                        <span>{selectedOrder.ghiChu || "Không có ghi chú"}</span>
                      </div>
                      <div className="lichSuGiaoDich-detailItem">
                        <span className="lichSuGiaoDich-label">Phương thức thanh toán:</span>
                        <span>{selectedOrder.phuongThucThanhToan === "COD" ? "Tiền mặt khi nhận hàng" : "VNPay"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="lichSuGiaoDich-detailSection">
                    <h3>Chi tiết món ăn</h3>
                    {selectedOrder.chiTietDonHang && selectedOrder.chiTietDonHang.length > 0 ? (
                      <div className="lichSuGiaoDich-itemsList">
                        {selectedOrder.chiTietDonHang.map((item, index) => (
                          <div key={index} className="lichSuGiaoDich-itemRow">
                            <div className="lichSuGiaoDich-itemInfo">
                              {item.monAn?.hinhAnhMonAns?.length > 0 ? (
                                <img
                                  src={item.monAn.hinhAnhMonAns[0].duongDan}
                                  alt={item.monAn?.tenMonAn || "Món ăn"}
                                  className="lichSuGiaoDich-itemImage"
                                />
                              ) : (
                                <div className="lichSuGiaoDich-itemNoImage">🍽️</div>
                              )}
                              <div className="lichSuGiaoDich-itemDetails">
                                <div className="lichSuGiaoDich-itemName">{item.monAn?.tenMonAn || `Món ăn ID: ${item.monAnId}`}</div>
                                <div className="lichSuGiaoDich-itemPrice">
                                  {(item.gia || item.donGia)?.toLocaleString() || "0"}₫ x {item.soLuong || 0}
                                </div>
                                {item.monAn?.khuyenMai && (
                                  <div className="lichSuGiaoDich-itemDiscount">
                                    Khuyến mãi: -{item.monAn.khuyenMai.giaGiam?.toLocaleString()}₫
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="lichSuGiaoDich-itemTotal">
                              {item.thanhTien?.toLocaleString() || ((item.gia || item.donGia || 0) * (item.soLuong || 0))?.toLocaleString() || "0"}₫
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="lichSuGiaoDich-noItems">
                        <p>⚠️ Không có thông tin chi tiết món ăn</p>
                      </div>
                    )}
                  </div>

                  <div className="lichSuGiaoDich-detailSection">
                    <h3>Tổng kết thanh toán</h3>
                    <div className="lichSuGiaoDich-summaryRows">
                      <div className="lichSuGiaoDich-summaryRow">
                        <span>Tạm tính:</span>
                        <span>{selectedOrder.tongTienGoc?.toLocaleString() || selectedOrder.tongTien?.toLocaleString() || "0"}₫</span>
                      </div>
                      {selectedOrder.giamGia > 0 && (
                        <div className="lichSuGiaoDich-summaryRow lichSuGiaoDich-discount">
                          <span>Giảm giá:</span>
                          <span>-{selectedOrder.giamGia?.toLocaleString()}₫</span>
                        </div>
                      )}
                      {selectedOrder.voucher && (
                        <div className="lichSuGiaoDich-summaryRow lichSuGiaoDich-discount">
                          <span>Voucher ({selectedOrder.voucher.maVoucher}):</span>
                          <span>{selectedOrder.voucher.moTa}</span>
                        </div>
                      )}
                      <div className="lichSuGiaoDich-summaryRow lichSuGiaoDich-total">
                        <span>Tổng cộng:</span>
                        <span>{selectedOrder.tongTien?.toLocaleString() || "0"}₫</span>
                      </div>
                    </div>
                  </div>

                  <div className="lichSuGiaoDich-modalActions">
                    {canCancelOrder(selectedOrder.trangThai) && (
                      <button
                        className="lichSuGiaoDich-btnModalCancel"
                        onClick={() => cancelOrder(selectedOrder.id)}
                        disabled={cancelling}
                      >
                        {cancelling ? "Đang hủy..." : "Hủy đơn hàng"}
                      </button>
                    )}
                    
                    {canViewInvoice(selectedOrder.trangThai) && (
                      <button
                        className="lichSuGiaoDich-btnModalViewInvoice"
                        onClick={() => viewInvoice(selectedOrder.id)}
                      >
                        🧾 Xem hóa đơn
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="lichSuGiaoDich-errorContainer">
                  <p>Không thể tải chi tiết đơn hàng</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LichSuGiaoDich;