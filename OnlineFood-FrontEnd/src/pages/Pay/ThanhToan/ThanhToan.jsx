import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../../../services/axiosInstance";
import MapConfirmModal from "./MapConfirmModal";
import "./ThanhToan.css";

const ThanhToan = () => {
  const { state } = useLocation();
  const navigate = useNavigate();

  const [gioHang, setGioHang] = useState([]);
  const [tongTienGoc, setTongTienGoc] = useState(0);
  const [diaChi, setDiaChi] = useState("");
  const [diaChiCu, setDiaChiCu] = useState("");
  const [ghiChu, setGhiChu] = useState("");
  const [voucher, setVoucher] = useState("");
  const [voucherData, setVoucherData] = useState(null);
  const [giamGia, setGiamGia] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phuongThucThanhToan, setPhuongThucThanhToan] = useState("COD");

  // Map confirm state
  const [showMapModal, setShowMapModal] = useState(false);
  const [mapLat, setMapLat] = useState(null);
  const [mapLng, setMapLng] = useState(null);
  const [confirmedLat, setConfirmedLat] = useState(null);
  const [confirmedLng, setConfirmedLng] = useState(null);

  const nguoiDungId = localStorage.getItem("idNguoiDung");
  const jwt = localStorage.getItem("jwt");

  const PHI_SHIP = 30000;
  const MIEN_PHI_SHIP_TU = 200000;

  useEffect(() => {
    if (state?.gioHang) setGioHang(state.gioHang);
    if (state?.tongTien || state?.thongKe?.tongTien) {
      setTongTienGoc(state?.tongTien || state?.thongKe?.tongTien);
    }
  }, [state]);

  const tinhGiaThucTe = useCallback((monAn) => {
    if (monAn?.khuyenMai?.giaGiam && monAn.khuyenMai.giaGiam > 0) {
      return monAn.khuyenMai.giaGiam;
    }
    return monAn?.gia || 0;
  }, []);

  useEffect(() => {
    if (tongTienGoc === 0 && gioHang.length > 0) {
      const calculatedTotal = gioHang.reduce((sum, item) => {
        return sum + tinhGiaThucTe(item.monAn) * item.soLuong;
      }, 0);
      setTongTienGoc(calculatedTotal);
    }
  }, [gioHang, tinhGiaThucTe, tongTienGoc]);

  useEffect(() => {
    const fetchDiaChiCu = async () => {
      try {
        const res = await axios.get(`/nguoi-dung/${nguoiDungId}`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        const diaChiCuData = res.data?.diaChi || "";
        setDiaChiCu(diaChiCuData);
        setDiaChi(diaChiCuData);
      } catch (err) {
        console.error("Lỗi khi lấy địa chỉ:", err);
      }
    };
    if (nguoiDungId) fetchDiaChiCu();
  }, [nguoiDungId, jwt]);

  // Reset confirmed location khi dia chi thay doi
  useEffect(() => {
    setConfirmedLat(null);
    setConfirmedLng(null);
  }, [diaChi]);

  const tinhPhiShip = () => {
    const tongTienSauGiamGia = tongTienGoc - giamGia;
    return tongTienSauGiamGia >= MIEN_PHI_SHIP_TU ? 0 : PHI_SHIP;
  };

  const phiShip = tinhPhiShip();
  const tongTienDonHang = tongTienGoc - giamGia;
  const tongTienThanhToan = tongTienDonHang + phiShip;

  // ── Kiem tra vi tri tren ban do ──────────────────────────
  const handleKiemTraViTri = async () => {
    if (!diaChi.trim()) {
      alert("Vui lòng nhập địa chỉ trước!");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get("/khoang-cach/dia-chi", {
        params: { diaChi },
        timeout: 10000,
      });
      if (res.data?.lat && res.data?.lng) {
        setMapLat(res.data.lat);
        setMapLng(res.data.lng);
        setShowMapModal(true);
      } else {
        alert("Không thể xác định vị trí. Vui lòng nhập địa chỉ chi tiết hơn.");
      }
    } catch (err) {
      if (err.code === "ECONNABORTED") {
        alert(
          "⚠️ Không thể xác định địa chỉ\n\n" +
          "Vui lòng nhập địa chỉ cụ thể hơn, ví dụ:\n" +
          "• \"40 Ngô Đức Kế, Phường Sài Gòn, Quận 1\"\n" +
          "• \"Chợ Bến Thành, Quận 1, TP.HCM\""
        );
      } else {
        alert("Không thể tìm địa chỉ. Vui lòng thử lại!");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMapConfirm = (lat, lng) => {
    setConfirmedLat(lat);
    setConfirmedLng(lng);
    setShowMapModal(false);
  };

  if (!state || !gioHang || gioHang.length === 0) {
    return (
      <div className="thanh-toan-container">
        <div className="error-container">
          <h2>⚠️ Không có dữ liệu đơn hàng</h2>
          <p>Vui lòng quay lại giỏ hàng và thử lại.</p>
          <button className="btn-back-to-cart" onClick={() => navigate("/gio-hang")}>
            Quay lại giỏ hàng
          </button>
        </div>
      </div>
    );
  }

  const hasValidItems = gioHang.every(
    (item) =>
      item.monAnId &&
      item.monAn &&
      item.monAn.tenMonAn &&
      item.soLuong > 0 &&
      (item.monAn.gia > 0 ||
        (item.monAn.khuyenMai && item.monAn.khuyenMai.giaGiam > 0))
  );

  if (!hasValidItems) {
    return (
      <div className="thanh-toan-container">
        <div className="error-container">
          <h2>⚠️ Dữ liệu giỏ hàng không hợp lệ</h2>
          <p>Có lỗi với dữ liệu giỏ hàng. Vui lòng quay lại và thử lại.</p>
          <button className="btn-back-to-cart" onClick={() => navigate("/gio-hang")}>
            Quay lại giỏ hàng
          </button>
        </div>
      </div>
    );
  }

  const handleCheckVoucher = async () => {
    if (!voucher.trim()) { setError("Vui lòng nhập mã voucher"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(`/vouchers/find`, {
        params: { ma: voucher, tongTien: tongTienGoc },
      });
      const data = res.data;
      if (data.valid) {
        setVoucherData(data.voucher);
        setGiamGia(data.discountAmount || 0);
        setError("");
        alert("Áp dụng voucher thành công!");
      } else {
        setError(data.message);
        setVoucherData(null);
        setGiamGia(0);
      }
    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response.data?.message || "Mã voucher không hợp lệ!");
      } else {
        setError("Có lỗi xảy ra khi kiểm tra voucher!");
      }
      setVoucherData(null);
      setGiamGia(0);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVoucher = () => {
    setVoucher("");
    setVoucherData(null);
    setGiamGia(0);
    setError("");
  };

  const taoDuLieuDonHang = (khoangCach, latGH, lonGH) => ({
    nguoiDungId: parseInt(nguoiDungId),
    diaChiGiaoHang: diaChi,
    ghiChu: ghiChu.trim() || null,
    tongTien: tongTienDonHang,
    tongTienGoc,
    giamGia,
    voucherId: voucherData?.id || null,
    khoangCach,
    phuongThucThanhToan,
    latGiaoHang: latGH,
    lonGiaoHang: lonGH,
    chiTietDonHang: gioHang.map((item) => ({
      monAnId: item.monAnId,
      soLuong: item.soLuong,
      gia: tinhGiaThucTe(item.monAn),
      thanhTien: item.soLuong * tinhGiaThucTe(item.monAn),
    })),
  });

  const handleVNPayPayment = async (khoangCach, latGH, lonGH) => {
    const donHangData = taoDuLieuDonHang(khoangCach, latGH, lonGH);
    sessionStorage.setItem("pendingOrder", JSON.stringify(donHangData));
    sessionStorage.setItem("cartToDelete", nguoiDungId);
    const tempOrderId = Date.now();
    const response = await axios.get("/create-payment", {
      params: { bookingId: tempOrderId.toString(), amount: tongTienThanhToan, bankCode: "" },
    });
    if (response.data.code === "00") {
      window.location.href = response.data.paymentUrl;
    } else {
      throw new Error(response.data.message || "Lỗi tạo thanh toán VNPay");
    }
  };

  const handleDatHang = async () => {
    if (!diaChi.trim()) {
      alert("Vui lòng chọn hoặc nhập địa chỉ giao hàng");
      return;
    }

    // Bat buoc phai xac nhan vi tri tren ban do
    if (!confirmedLat || !confirmedLng) {
      alert(
        "⚠️ Vui lòng xác nhận vị trí giao hàng!\n\n" +
        "Nhấn nút \"🗺️ Kiểm tra vị trí\" để xem và xác nhận vị trí trên bản đồ trước khi đặt hàng."
      );
      return;
    }

    setLoading(true);
    try {
      // Dung toa do da xac nhan tren ban do
      const latGiaoHang = confirmedLat;
      const lonGiaoHang = confirmedLng;

      // Van goi API de lay khoang cach chinh xac
      let khoangCach;
      try {
        const distanceRes = await axios.get("/khoang-cach/dia-chi", {
          params: { diaChi },
          timeout: 10000,
        });
        khoangCach = distanceRes.data.khoangCach_km;
      } catch {
        // Neu API loi, tinh khoang cach tu toa do cua hang
        khoangCach = 5; // fallback mac dinh
      }

      if (khoangCach > 20) {
        alert(
          `Rất tiếc, địa chỉ của quý khách (cách ${khoangCach.toFixed(1)} km) nằm ngoài phạm vi giao hàng.\n\n` +
          "Chúng tôi chỉ phục vụ trong bán kính 20km."
        );
        setLoading(false);
        return;
      }

      const phuongThucText =
        phuongThucThanhToan === "COD" ? "Tiền mặt khi nhận hàng" : "Ví điện tử VNPay";

      const confirmOrder = window.confirm(
        `Xác nhận đặt hàng:\n\n` +
        `• Địa chỉ giao hàng: ${diaChi}\n` +
        `• Khoảng cách: ${khoangCach.toFixed(1)} km\n` +
        `• Thời gian giao hàng dự kiến: ${Math.ceil(khoangCach * 2 + 20)} phút\n` +
        `• Phương thức thanh toán: ${phuongThucText}\n` +
        `${ghiChu.trim() ? `• Ghi chú: ${ghiChu}\n` : ""}` +
        `${voucherData ? `• Voucher: ${voucherData.maVoucher} (-${giamGia.toLocaleString()}₫)\n` : ""}` +
        `• Tổng tiền đơn hàng: ${tongTienDonHang.toLocaleString()}₫\n` +
        `• Phí giao hàng: ${phiShip === 0 ? "Miễn phí" : "30.000₫"}\n` +
        `• Tổng tiền thanh toán: ${tongTienThanhToan.toLocaleString()}₫\n\n` +
        `Bạn có muốn tiếp tục đặt hàng không?`
      );
      if (!confirmOrder) { setLoading(false); return; }

      if (phuongThucThanhToan === "VNPAY") {
        await handleVNPayPayment(khoangCach, latGiaoHang, lonGiaoHang);
      } else {
        const donHangData = taoDuLieuDonHang(khoangCach, latGiaoHang, lonGiaoHang);
        const response = await axios.post("/don-hang/dat-hang", donHangData);
        if (response.data) {
          const donHangId = response.data.id;
          try { await axios.delete(`/gio-hang/${nguoiDungId}/clear`); } catch {}
          try { await axios.post(`/hoa-don/tao-tu-don-hang/${donHangId}`); } catch {}

          let msg = "Đặt hàng thành công! Bạn sẽ thanh toán tiền mặt khi nhận hàng.";
          if (phiShip === 0) msg += "\n\n🎉 Đơn hàng được MIỄN PHÍ GIAO HÀNG!";

          alert(msg);
          navigate("/", {
            state: {
              donHangId,
              tongTien: tongTienThanhToan,
              phuongThucThanhToan: "COD",
              message: "Đặt hàng thành công!",
            },
          });
        }
      }
    } catch (err) {
      console.error("Lỗi khi đặt hàng:", err);
      if (err.response?.status === 400) {
        const msg = err.response?.data?.message || "Có lỗi xảy ra khi đặt hàng";
        if (msg.includes("Voucher")) { alert(msg); handleRemoveVoucher(); }
        else alert(msg);
      } else {
        alert(err.message || "Có lỗi xảy ra. Vui lòng thử lại!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="thanh-toan-container">
      <h2 className="page-title">🧾 Xác nhận thanh toán</h2>

      {/* San pham */}
      <div className="section">
        <h3 className="section-title">Sản phẩm đã chọn</h3>
        <div className="product-list">
          {gioHang.map((item) => {
            const giaThucTe = tinhGiaThucTe(item.monAn);
            const thanhTien = item.soLuong * giaThucTe;
            return (
              <div key={item.id} className="product-item">
                <div className="product-info">
                  <img
                    src={item.monAn?.hinhAnhMonAns?.[0]?.duongDan || "/default.jpg"}
                    alt={item.monAn?.tenMonAn}
                    className="product-image"
                  />
                  <div className="product-details">
                    <div className="product-name">{item.monAn?.tenMonAn}</div>
                    <div className="product-price-quantity">
                      {giaThucTe.toLocaleString()}₫ x {item.soLuong}
                    </div>
                    {item.monAn?.khuyenMai && (
                      <div className="discount-badge">Có khuyến mãi</div>
                    )}
                  </div>
                </div>
                <div className="item-total">{thanhTien.toLocaleString()}₫</div>
              </div>
            );
          })}
          <div className="subtotal">
            <span>Tạm tính:</span>
            <span>{tongTienGoc.toLocaleString()}₫</span>
          </div>
        </div>
      </div>

      {/* Dia chi */}
      <div className="section">
        <h3 className="section-title">Địa chỉ nhận hàng</h3>
        <div className="address-section">
          {diaChiCu && (
            <label className="address-option">
              <input
                type="radio"
                name="diaChi"
                value={diaChiCu}
                onChange={(e) => setDiaChi(e.target.value)}
                checked={diaChi === diaChiCu}
                className="radio-input"
              />
              <div className="address-label">
                <span>Sử dụng địa chỉ mặc định:</span>
                <span className="saved-address">{diaChiCu}</span>
              </div>
            </label>
          )}

          <label className="address-option">
            <input
              type="radio"
              name="diaChi"
              value="new"
              onChange={() => setDiaChi("")}
              checked={diaChi !== diaChiCu}
              className="radio-input"
            />
            <span>Nhập địa chỉ mới:</span>
          </label>

          <input
            type="text"
            value={diaChi !== diaChiCu ? diaChi : ""}
            onChange={(e) => setDiaChi(e.target.value)}
            placeholder="Nhập địa chỉ chi tiết (số nhà, tên đường, phường, quận)..."
            disabled={diaChi === diaChiCu}
            className={`address-input ${diaChi === diaChiCu ? "disabled" : ""}`}
          />

          {/* Nut kiem tra vi tri */}
          <button
            type="button"
            onClick={handleKiemTraViTri}
            disabled={loading || !diaChi.trim()}
            className="btn-check-location"
          >
            {loading ? "Đang tìm vị trí..." : "🗺️ Kiểm tra vị trí trên bản đồ"}
          </button>

          {/* Hien thi vi tri da xac nhan */}
          {confirmedLat && confirmedLng && (
            <div className="location-confirmed">
              ✅ Đã xác nhận vị trí giao hàng
              <span className="location-coords">
                ({confirmedLat.toFixed(5)}, {confirmedLng.toFixed(5)})
              </span>
              <button
                type="button"
                className="btn-recheck"
                onClick={handleKiemTraViTri}
              >
                Kiểm tra lại
              </button>
            </div>
          )}

          {/* Canh bao chua xac nhan */}
          {!confirmedLat && diaChi.trim() && (
            <div className="location-warning">
              ⚠️ Vui lòng nhấn "Kiểm tra vị trí" để xác nhận địa chỉ trước khi đặt hàng
            </div>
          )}

          <div className="address-hint">
            <div className="hint-item">
              <span className="hint-icon">💡</span>
              <span>Nhập địa chỉ chi tiết: số nhà, tên đường, phường/xã.</span>
            </div>
            <div className="hint-item">
              <span className="hint-icon">📍</span>
              <span>Ví dụ: "40 Ngô Đức Kế, Phường Sài Gòn", "UBND Tp. Hồ Chí Minh"</span>
            </div>
          </div>
        </div>
      </div>

      {/* Phuong thuc thanh toan */}
      <div className="section">
        <h3 className="section-title">💳 Phương thức thanh toán</h3>
        <div className="payment-method-section">
          <div className="payment-options">
            <label className="payment-option">
              <input
                type="radio"
                name="phuongThucThanhToan"
                value="COD"
                checked={phuongThucThanhToan === "COD"}
                onChange={(e) => setPhuongThucThanhToan(e.target.value)}
                className="radio-input"
              />
              <div className="payment-method-info">
                <div className="payment-method-name">
                  <span className="payment-icon">💵</span>
                  <span>Thanh toán khi nhận hàng (COD)</span>
                </div>
                <div className="payment-method-desc">
                  Thanh toán bằng tiền mặt khi shipper giao hàng
                </div>
              </div>
            </label>

            <label className="payment-option">
              <input
                type="radio"
                name="phuongThucThanhToan"
                value="VNPAY"
                checked={phuongThucThanhToan === "VNPAY"}
                onChange={(e) => setPhuongThucThanhToan(e.target.value)}
                className="radio-input"
              />
              <div className="payment-method-info">
                <div className="payment-method-name">
                  <span className="payment-icon">💳</span>
                  <span>Thanh toán qua cổng VNPay</span>
                </div>
                <div className="payment-method-desc">
                  Thanh toán online qua ví điện tử, ngân hàng, thẻ quốc tế
                </div>
              </div>
            </label>
          </div>

          {phuongThucThanhToan === "VNPAY" && (
            <div className="vnpay-options">
              <div className="vnpay-note">
                <div className="note-item">
                  <span className="note-icon">ℹ️</span>
                  <span>Bạn sẽ được chuyển hướng đến cổng thanh toán VNPay</span>
                </div>
                <div className="note-item">
                  <span className="note-icon">💳</span>
                  <span>Hỗ trợ: Ví VNPay, ATM nội địa, Visa/Mastercard, QR Code</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ghi chu */}
      <div className="section">
        <h3 className="section-title">📝 Ghi chú đơn hàng</h3>
        <div className="note-section">
          <textarea
            value={ghiChu}
            onChange={(e) => setGhiChu(e.target.value)}
            placeholder="Nhập ghi chú (nếu có)..."
            className="note-textarea"
            maxLength={500}
            rows={4}
          />
        </div>
      </div>

      {/* Phi ship */}
      <div className="section">
        <h3 className="section-title">🚚 Thông tin giao hàng & Phí ship</h3>
        <div className="delivery-info">
          <div className="shipping-fee-info">
            {phiShip === 0 ? (
              <div className="free-shipping">
                <span className="shipping-icon">🎉</span>
                <div className="shipping-details">
                  <div className="shipping-status">MIỄN PHÍ GIAO HÀNG</div>
                  <div className="shipping-condition">
                    Đơn hàng từ {MIEN_PHI_SHIP_TU.toLocaleString()}₫ được miễn phí ship!
                  </div>
                </div>
              </div>
            ) : (
              <div className="paid-shipping">
                <span className="shipping-icon">📦</span>
                <div className="shipping-details">
                  <div className="shipping-fee">Phí giao hàng: {phiShip.toLocaleString()}₫</div>
                  <div className="shipping-promotion">
                    💡 Mua thêm {(MIEN_PHI_SHIP_TU - (tongTienGoc - giamGia)).toLocaleString()}₫ để MIỄN PHÍ SHIP!
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="delivery-note">
            <div className="note-item">
              <span className="note-icon">🚚</span>
              <span>Phạm vi giao hàng: Trong bán kính 20km từ cửa hàng</span>
            </div>
            <div className="note-item">
              <span className="note-icon">⏰</span>
              <span>Thời gian giao hàng: Từ 30-60 phút tùy khoảng cách</span>
            </div>
          </div>
        </div>
      </div>

      {/* Voucher */}
      <div className="section">
        <h3 className="section-title">🎫 Mã giảm giá</h3>
        <div className="voucher-section">
          <div className="voucher-input-group">
            <input
              type="text"
              value={voucher}
              onChange={(e) => setVoucher(e.target.value.toUpperCase())}
              placeholder="Nhập mã giảm giá"
              className="voucher-input"
              disabled={loading}
            />
            <button
              onClick={handleCheckVoucher}
              disabled={loading || !voucher.trim()}
              className="btn-apply-voucher"
            >
              {loading ? "Đang kiểm tra..." : "Áp dụng"}
            </button>
          </div>
          {error && <div className="error-message">❌ {error}</div>}
          {voucherData && (
            <div className="voucher-applied">
              <div className="voucher-info">
                <span className="voucher-name">✅ {voucherData.maVoucher}</span>
                <span className="voucher-discount">-{giamGia.toLocaleString()}₫</span>
              </div>
              <button onClick={handleRemoveVoucher} className="btn-remove-voucher">
                🗑️ Xóa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tong tien */}
      <div className="section">
        <div className="total-section">
          <div className="total-row">
            <span>Tạm tính:</span>
            <span>{tongTienGoc.toLocaleString()}₫</span>
          </div>
          {giamGia > 0 && (
            <div className="total-row discount">
              <span>Giảm giá:</span>
              <span>-{giamGia.toLocaleString()}₫</span>
            </div>
          )}
          <div className="total-row shipping">
            <span>Phí giao hàng:</span>
            <span className={phiShip === 0 ? "free-shipping-text" : "shipping-fee-text"}>
              {phiShip === 0 ? "Miễn phí" : `${phiShip.toLocaleString()}₫`}
            </span>
          </div>
          <div className="total-row final-total">
            <span>Tổng cộng:</span>
            <span>{tongTienThanhToan.toLocaleString()}₫</span>
          </div>
        </div>

        <div className="action-buttons">
          <button onClick={() => navigate("/gio-hang")} className="btn-back">
            ⬅️ Quay lại giỏ hàng
          </button>
          <button
            onClick={handleDatHang}
            disabled={loading || !diaChi.trim() || !confirmedLat}
            className="btn-order"
            title={
              !confirmedLat
                ? "Vui lòng xác nhận vị trí trên bản đồ trước"
                : loading
                ? "Đang xử lý..."
                : "Xác nhận đặt hàng"
            }
          >
            {loading
              ? "Đang xử lý..."
              : phuongThucThanhToan === "VNPAY"
              ? "💳 Thanh toán VNPay"
              : "🛒 Xác nhận đặt hàng"}
          </button>
        </div>
      </div>

      {/* Map confirm modal */}
      <MapConfirmModal
        isOpen={showMapModal}
        lat={mapLat}
        lng={mapLng}
        diaChi={diaChi}
        onConfirm={handleMapConfirm}
        onCancel={() => setShowMapModal(false)}
      />
    </div>
  );
};

export default ThanhToan;