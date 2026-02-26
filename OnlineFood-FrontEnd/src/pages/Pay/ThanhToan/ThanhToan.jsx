import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "../../../services/axiosInstance";
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

  const nguoiDungId = localStorage.getItem("idNguoiDung");
  const jwt = localStorage.getItem("jwt");

  // Phí ship constants
  const PHI_SHIP = 30000; 
  const MIEN_PHI_SHIP_TU = 200000; 

  useEffect(() => {
    if (state?.gioHang) {
      setGioHang(state.gioHang);
    }
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
        const gia = tinhGiaThucTe(item.monAn);
        return sum + (gia * item.soLuong);
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
    
    if (nguoiDungId) {
      fetchDiaChiCu();
    }
  }, [nguoiDungId, jwt]);

  const tinhPhiShip = () => {
    const tongTienSauGiamGia = tongTienGoc - giamGia;
    return tongTienSauGiamGia >= MIEN_PHI_SHIP_TU ? 0 : PHI_SHIP;
  };

  const phiShip = tinhPhiShip();
  const tongTienDonHang = tongTienGoc - giamGia;
  const tongTienThanhToan = tongTienDonHang + phiShip;

  if (!state || !gioHang || gioHang.length === 0) {
    return (
      <div className="thanh-toan-container">
        <div className="error-container">
          <h2>⚠️ Không có dữ liệu đơn hàng</h2>
          <p>Vui lòng quay lại giỏ hàng và thử lại.</p>
          <button 
            className="btn-back-to-cart" 
            onClick={() => navigate("/gio-hang")}
          >
            Quay lại giỏ hàng
          </button>
        </div>
      </div>
    );
  }

  const hasValidItems = gioHang.every(item => 
    item.monAnId && 
    item.monAn && 
    item.monAn.tenMonAn && 
    item.soLuong > 0 &&
    (item.monAn.gia > 0 || (item.monAn.khuyenMai && item.monAn.khuyenMai.giaGiam > 0))
  );

  if (!hasValidItems) {
    return (
      <div className="thanh-toan-container">
        <div className="error-container">
          <h2>⚠️ Dữ liệu giỏ hàng không hợp lệ</h2>
          <p>Có lỗi với dữ liệu giỏ hàng. Vui lòng quay lại và thử lại.</p>
          <button 
            className="btn-back-to-cart" 
            onClick={() => navigate("/gio-hang")}
          >
            Quay lại giỏ hàng
          </button>
        </div>
      </div>
    );
  }

  const handleCheckVoucher = async () => {
    if (!voucher.trim()) {
      setError("Vui lòng nhập mã voucher");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`/vouchers/find`, {
        params: {
          ma: voucher,
          tongTien: tongTienGoc
        }
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
      console.error("Lỗi khi kiểm tra voucher:", err);
      
      if (err.response?.status === 400) {
        const errorData = err.response.data;
        setError(errorData.message || "Mã voucher không hợp lệ!");
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

  const taoDuLieuDonHang = (khoangCach, latGiaoHang, lonGiaoHang) => {
    return {
      nguoiDungId: parseInt(nguoiDungId),
      diaChiGiaoHang: diaChi,
      ghiChu: ghiChu.trim() || null,
      tongTien: tongTienDonHang, 
      tongTienGoc: tongTienGoc,
      giamGia: giamGia,
      voucherId: voucherData?.id || null,
      khoangCach: khoangCach,
      phuongThucThanhToan: phuongThucThanhToan,
      // ✅ THÊM TỌA ĐỘ GIAO HÀNG
      latGiaoHang: latGiaoHang,
      lonGiaoHang: lonGiaoHang,
      chiTietDonHang: gioHang.map(item => ({
        monAnId: item.monAnId,
        soLuong: item.soLuong,
        gia: tinhGiaThucTe(item.monAn),
        thanhTien: item.soLuong * tinhGiaThucTe(item.monAn)
      }))
    };
  };

  const handleVNPayPayment = async (khoangCach, latGiaoHang, lonGiaoHang) => {
    try {
      console.log("Đang chuẩn bị thanh toán VNPay...");
      
      const donHangData = taoDuLieuDonHang(khoangCach, latGiaoHang, lonGiaoHang);
      sessionStorage.setItem('pendingOrder', JSON.stringify(donHangData));
      sessionStorage.setItem('cartToDelete', nguoiDungId);
      
      const tempOrderId = Date.now();
      
      const response = await axios.get('/create-payment', {
        params: {
          bookingId: tempOrderId.toString(),
          amount: tongTienThanhToan, 
          bankCode: ""
        }
      });

      console.log("Phản hồi từ API create-payment:", response.data);

      if (response.data.code === "00") {
        window.location.href = response.data.paymentUrl;
      } else {
        console.error("Lỗi VNPay - Mã code khác 00:", response.data);
        throw new Error(response.data.message || "Lỗi tạo thanh toán VNPay");
      }
    } catch (err) {
      console.error("Lỗi khi tạo thanh toán VNPay:", err);
      if (err.response) {
        console.error("Status:", err.response.status);
        console.error("Headers:", err.response.headers);
        console.error("Data:", err.response.data);
      } else {
        console.error("Message:", err.message);
      }
      throw new Error("Không thể tạo thanh toán VNPay. Vui lòng thử lại!");
    }
  };

  const handleDatHang = async () => {
    if (!diaChi.trim()) {
      alert("Vui lòng chọn hoặc nhập địa chỉ giao hàng");
      return;
    }

    setLoading(true);

    try {
      console.log("Đang kiểm tra khoảng cách giao hàng...");
      const distanceRes = await axios.get("/khoang-cach/dia-chi", {
        params: { diaChi: diaChi },
      });

      if (!distanceRes.data || distanceRes.data.khoangCach_km === undefined) {
        alert("Không thể xác định khoảng cách giao hàng. Vui lòng kiểm tra lại địa chỉ.");
        setLoading(false);
        return;
      }

      const khoangCach = distanceRes.data.khoangCach_km;
      // ✅ LẤY TỌA ĐỘ TỪ API
      const latGiaoHang = distanceRes.data.lat;
      const lonGiaoHang = distanceRes.data.lng;
      
      console.log(`Khoảng cách: ${khoangCach} km, Tọa độ: (${latGiaoHang}, ${lonGiaoHang})`);

      if (khoangCach > 20) {
        alert(
          `Rất tiếc, địa chỉ của quý khách (cách ${khoangCach.toFixed(1)} km) nằm ngoài phạm vi giao hàng của chúng tôi.\n\n` +
          "Để đảm bảo chất lượng và độ tươi ngon tốt nhất của thực phẩm, chúng tôi chỉ phục vụ trong bán kính 20km.\n\n" +
          "Xin quý khách vui lòng thông cảm và cân nhắc đặt hàng tại địa chỉ gần hơn!"
        );
        setLoading(false);
        return;
      }

      const phuongThucText = phuongThucThanhToan === "COD" ? "Tiền mặt khi nhận hàng" : "Ví điện tử VNPay";
      
      const confirmOrder = window.confirm(
        `Xác nhận đặt hàng:\n\n` +
        `• Địa chỉ giao hàng: ${diaChi}\n` +
        `• Khoảng cách: ${khoangCach.toFixed(1)} km\n` +
        `• Thời gian giao hàng dự kiến: ${Math.ceil(khoangCach * 2 + 20)} phút\n` +
        `• Phương thức thanh toán: ${phuongThucText}\n` +
        `${ghiChu.trim() ? `• Ghi chú: ${ghiChu}\n` : ''}` +
        `${voucherData ? `• Voucher: ${voucherData.maVoucher} (-${giamGia.toLocaleString()}₫)\n` : ''}` +
        `• Tổng tiền đơn hàng: ${tongTienDonHang.toLocaleString()}₫\n` +
        `• Phí giao hàng: 30.000₫\n` +
        `• Tổng tiền thanh toán: ${tongTienThanhToan.toLocaleString()}₫\n\n` +
        `Bạn có muốn tiếp tục đặt hàng không?`
      );

      if (!confirmOrder) {
        setLoading(false);
        return;
      }

      if (phuongThucThanhToan === "VNPAY") {
        await handleVNPayPayment(khoangCach, latGiaoHang, lonGiaoHang);
      } else {
        // ✅ TRUYỀN TỌA ĐỘ VÀO ĐƠN HÀNG
        const donHangData = taoDuLieuDonHang(khoangCach, latGiaoHang, lonGiaoHang);

        console.log("Dữ liệu đặt hàng COD:", donHangData);
        
        const response = await axios.post('/don-hang/dat-hang', donHangData);
        
        if (response.data) {
          const donHangId = response.data.id;
          
          try {
            await axios.delete(`/gio-hang/${nguoiDungId}/clear`);
          } catch (clearError) {
            console.error("Lỗi khi xóa giỏ hàng:", clearError);
          }
       
          try {
            console.log("Tạo hóa đơn COD cho đơn hàng:", donHangId);
            await axios.post(`/hoa-don/tao-tu-don-hang/${donHangId}`);
            console.log("Tạo hóa đơn COD thành công");
          } catch (hoaDonError) {
            console.error("Lỗi khi tạo hóa đơn COD:", hoaDonError);
          }
          
          let thongBaoThanhCong = "Đặt hàng thành công! Hóa đơn đã được tạo. Bạn sẽ thanh toán tiền mặt khi nhận hàng.";
          if (phiShip === 0) {
            thongBaoThanhCong += "\n\n🎉 Chúc mừng! Đơn hàng của bạn được MIỄN PHÍ GIAO HÀNG!";
          } else {
            thongBaoThanhCong += `\n\n📦 Phí giao hàng: ${phiShip.toLocaleString()}₫ (đã bao gồm trong tổng tiền)`;
          }
          
          alert(thongBaoThanhCong);
          navigate('/', { 
            state: { 
              donHangId: donHangId,
              tongTien: tongTienThanhToan,
              phuongThucThanhToan: "COD",
              message: "Đặt hàng thành công! Hóa đơn đã được tạo."
            } 
          });
        }
      }
      
    } catch (err) {
      console.error("Lỗi khi đặt hàng:", err);
      
      if (err.response?.status === 400 && err.config?.url?.includes('khoang-cach/dia-chi')) {
        const errorMessage = err.response?.data?.error || "Không thể xác định vị trí địa chỉ";
        
        alert(
          `⚠️ Lỗi xác định địa chỉ giao hàng\n\n` +
          `${errorMessage}\n\n` +
          `😔 Rất tiếc, chúng tôi không thể xác định chính xác vị trí địa chỉ bạn nhập.\n\n` +
          `💡 Gợi ý:\n` +
          `• Vui lòng nhập địa chỉ chi tiết hơn (số nhà, tên đường, phường/xã)\n` +
          `• Hoặc thử nhập một địa chỉ gần đó (ví dụ: tên đường chính, chợ gần nhà)\n` +
          `• Nếu vẫn gặp lỗi, bạn có thể nhập địa chỉ gần nhất có thể và ghi chú thêm địa chỉ ở phần ghi chú\n` +
          `• Mong quý khách thông cảm vì sự bất tiện này!\n\n` +
          `📞 Hoặc liên hệ hotline để được hỗ trợ: 1900 2403`
        );
      } else if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.message || "Có lỗi xảy ra khi đặt hàng";
        
        if (errorMessage.includes("Voucher không hợp lệ")) {
          alert(errorMessage + "\nVui lòng kiểm tra lại voucher hoặc đặt hàng không dùng voucher.");
          handleRemoveVoucher();
        } else if (errorMessage.includes("khoảng cách")) {
          alert("Lỗi khi tính khoảng cách giao hàng. Vui lòng kiểm tra lại địa chỉ.");
        } else {
          alert(errorMessage);
        }
      } else {
        alert(err.message || "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="thanh-toan-container">
      <h2 className="page-title">🧾 Xác nhận thanh toán</h2>

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
                    src={item.monAn?.hinhAnhMonAns?.[0]?.duongDan || item.monAn?.hinhAnhUrl || "/default.jpg"}
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
                <div className="item-total">
                  {thanhTien.toLocaleString()}₫
                </div>
              </div>
            );
          })}
          
          <div className="subtotal">
            <span>Tạm tính:</span>
            <span>{tongTienGoc.toLocaleString()}₫</span>
          </div>
        </div>
      </div>

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
            className={`address-input ${diaChi === diaChiCu ? 'disabled' : ''}`}
          />
          
          <div className="address-hint">
            <div className="hint-item">
              <span className="hint-icon">💡</span>
              <span>Để đảm bảo giao hàng chính xác, vui lòng nhập địa chỉ chi tiết: số nhà, tên đường, phường/xã hoặc tên một địa danh.</span>
            </div>
            <div className="hint-item">
              <span className="hint-icon">📍</span>
              <span>Ví dụ: "40 Ngô Đức Kế, Phường Sài Gòn", "UBND Tp. Hồ Chí Minh"</span>
            </div>
          </div>
        </div>
      </div>

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
                  <span>Bạn sẽ được chuyển hướng đến cổng thanh toán VNPay để lựa chọn phương thức và hoàn tất giao dịch</span>
                </div>
                <div className="note-item">
                  <span className="note-icon">💳</span>
                  <span>Hỗ trợ thanh toán qua: Ví VNPay, ATM nội địa, Visa/Mastercard, QR Code</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="section">
        <h3 className="section-title">📝 Ghi chú đơn hàng</h3>
        <div className="note-section">
          <textarea
            value={ghiChu}
            onChange={(e) => setGhiChu(e.target.value)}
            placeholder="Nhập ghi chú cho đơn hàng (nếu có)... Ví dụ: hướng dẫn đến địa chỉ, yêu cầu đặc biệt..."
            className="note-textarea"
            maxLength={500}
            rows={4}
          />
        </div>
      </div>

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
            <div className="note-item">
              <span className="note-icon">💡</span>
              <span>Khoảng cách và thời gian giao hàng sẽ được tính toán khi đặt hàng</span>
            </div>
            <div className="note-item">
              <span className="note-icon">📱</span>
              <span>Shipper sẽ liên hệ trước khi giao hàng nếu cần hướng dẫn thêm</span>
            </div>
          </div>
        </div>
      </div>

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

          {error && (
            <div className="error-message">❌ {error}</div>
          )}

          {voucherData && (
            <div className="voucher-applied">
              <div className="voucher-info">
                <span className="voucher-name">✅ {voucherData.maVoucher}</span>
                <span className="voucher-discount">-{giamGia.toLocaleString()}₫</span>
              </div>
              {voucherData.moTa && (
                <div className="voucher-description">
                  📋 {voucherData.moTa}
                </div>
              )}
              <button 
                onClick={handleRemoveVoucher}
                className="btn-remove-voucher"
              >
                🗑️ Xóa
              </button>
            </div>
          )}
        </div>
      </div>

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
          
          {phiShip > 0 && (
            <div className="shipping-promotion-note">
              💡 Mua thêm {(MIEN_PHI_SHIP_TU - (tongTienGoc - giamGia)).toLocaleString()}₫ để được miễn phí giao hàng!
            </div>
          )}
        </div>

        <div className="action-buttons">
          <button 
            onClick={() => navigate("/gio-hang")}
            className="btn-back"
          >
            ⬅️ Quay lại giỏ hàng
          </button>
          <button 
            onClick={handleDatHang}
            disabled={loading || !diaChi.trim()}
            className="btn-order"
            title={
              loading 
                ? "Đang xử lý..." 
                : !diaChi.trim()
                  ? "Vui lòng chọn địa chỉ giao hàng"
                  : "Xác nhận đặt hàng"
            }
          >
            {loading ? "Đang xử lý..." : phuongThucThanhToan === "VNPAY" ? "💳 Thanh toán VNPay" : "🛒 Xác nhận đặt hàng"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ThanhToan;