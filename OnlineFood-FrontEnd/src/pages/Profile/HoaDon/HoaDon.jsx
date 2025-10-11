import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../../services/axiosInstance';
import './HoaDon.css';

const HoaDon = () => {
  const { donHangId } = useParams();
  const navigate = useNavigate();
  const [hoaDon, setHoaDon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHoaDon = async () => {
      try {
     
        const jwt = localStorage.getItem('jwt');
        const vaiTro = localStorage.getItem('vaiTro');
        const idNguoiDung = localStorage.getItem('idNguoiDung');

        console.log('Debug - Role:', vaiTro);
        
        if (!jwt || !idNguoiDung) {
          setError('Vui lòng đăng nhập để xem hóa đơn');
          return;
        }

      
        const userResponse = await axios.get(`/nguoi-dung/secure/${idNguoiDung}`, {
          headers: {
            Authorization: `Bearer ${jwt}`, 
          },
        });
        
        const userEmail = userResponse.data.email;
        
       
        const response = await axios.get(`/hoa-don/don-hang/${donHangId}`, {
          headers: {
            'Authorization': `Bearer ${jwt}`,
            'User-Email': userEmail,
            'User-Role': vaiTro 
          }
        });
        
        setHoaDon(response.data);
      } catch (err) {
        console.error('Lỗi khi tải hóa đơn:', err);
        
        if (err.response?.status === 401) {
          setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
         
          setTimeout(() => {
            localStorage.removeItem('jwt');
            localStorage.removeItem('idNguoiDung');
            localStorage.removeItem('vaiTro');
            navigate('/login');
          }, 3000);
        } else if (err.response?.status === 403) {
          setError('Bạn không có quyền xem hóa đơn này. Chỉ có thể xem hóa đơn của chính mình.');
        } else if (err.response?.status === 404) {
          setError('Không tìm thấy hóa đơn cho đơn hàng này');
        } else {
          setError('Có lỗi xảy ra khi tải hóa đơn');
        }
      } finally {
        setLoading(false);
      }
    };

    if (donHangId) {
      fetchHoaDon();
    }
  }, [donHangId, navigate]);

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const dt = new Date(dateString);
    if (isNaN(dt)) return "";
    return dt.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getPhuongThucText = (phuongThuc) => {
    switch (phuongThuc) {
      case 'COD':
        return 'Tiền mặt khi nhận hàng';
      case 'VNPAY':
        return 'Thanh toán VNPay';
      default:
        return phuongThuc;
    }
  };

  const getTrangThaiThanhToan = (trangThai) => {
    switch (trangThai) {
      case 'DA_THANH_TOAN':
        return 'Đã thanh toán';
      case 'CHUA_THANH_TOAN':
        return 'Chưa thanh toán';
      case 'HUY':
        return 'Đã hủy';
      default:
        return trangThai;
    }
  };

  const calculateThanhTien = (item) => {
    return item.donGia * item.soLuong;
  };


  const calculateVoucherDiscount = (voucher, tongTienGoc) => {
    if (!voucher || !tongTienGoc) return 0;
    if (voucher.loai === 'PHAN_TRAM') {
      const discountAmount = (tongTienGoc * voucher.giaTri) / 100;
      return Math.round(discountAmount);
    } else if (voucher.loai === 'TIEN_MAT') {
     
      return Math.min(voucher.giaTri, tongTienGoc);
    }
    
    return 0;
  };

  if (loading) return <div className="loading">Đang tải hóa đơn...</div>;
  
  
  if (error) {
    return (
      <div className="hoa-don-container">
        <div className="error-container" style={{
          textAlign: 'center', 
          padding: '2rem',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          margin: '2rem 0'
        }}>
          <div className="error-icon" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            {error.includes('quyền') ? '🚫' : '❌'}
          </div>
          <h3 style={{ color: '#856404', marginBottom: '1rem' }}>
            {error.includes('quyền') ? 'Truy cập bị từ chối' : 'Có lỗi xảy ra'}
          </h3>
          <p style={{ color: '#856404', marginBottom: '1.5rem' }}>{error}</p>
          <div className="action-buttons">
            {!error.includes('đăng nhập') && (
              <button 
                onClick={() => navigate('/lich-su-giao-dich')} 
                className="primary-button"
                style={{
                  backgroundColor: '#007bff',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '4px',
                  marginRight: '0.5rem',
                  cursor: 'pointer'
                }}
              >
                📋 Xem lịch sử giao dịch
              </button>
            )}
            <button 
              onClick={() => navigate('/')} 
              className="secondary-button"
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🏠 Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (!hoaDon) return <div className="error">📋 Không tìm thấy hóa đơn</div>;

  // Tính toán các giá trị cần thiết
  const tongTienGoc = hoaDon.donHang.chiTietDonHang?.reduce((sum, item) => {
    return sum + calculateThanhTien(item);
  }, 0) || 0;

  const voucherDiscount = hoaDon.donHang.voucher 
    ? calculateVoucherDiscount(hoaDon.donHang.voucher, tongTienGoc)
    : 0;

  const tongTienSauGiamGia = tongTienGoc - voucherDiscount;

  return (
    <div className="hoa-don-container">
      <div className="hoa-don-content">
        <div className="invoice-header">
          <h1 className="invoice-title">HÓA ĐƠN ĐIỆN TỬ</h1>
          <p>OU Food</p>
          <p> 40E Ngô Đức Kế, Phường Sài Gòn, TP.HCM | 📞 1900 2403</p>
        </div>

        <div className="invoice-info">
          <div>
            <strong>Số hóa đơn:</strong> #{hoaDon.id}<br/>
            <strong>Ngày tạo:</strong> {formatDate(hoaDon.thoiGianThanhToan)}
          </div>
          <div>
            <strong>Mã giao dịch:</strong> {hoaDon.maGD || 'N/A'}<br/>
            <strong>Phương thức:</strong> {getPhuongThucText(hoaDon.phuongThuc)}
          </div>
        </div>

        <div className="invoice-details">
          <h4>Thông tin khách hàng</h4>
          <div className="detail-row">
            <span> Họ tên:</span>
            <span>{hoaDon.hoTen}</span>
          </div>
          <div className="detail-row">
            <span> Số điện thoại:</span>
            <span>{hoaDon.soDienThoai}</span>
          </div>
          <div className="detail-row">
            <span>Địa chỉ giao hàng:</span>
            <span>{hoaDon.diaChi}</span>
          </div>
        </div>

        <div className="invoice-details">
          <h4>Thông tin đơn hàng</h4>
          <div className="detail-row">
            <span> Mã đơn hàng:</span>
            <span>#{hoaDon.donHang.id}</span>
          </div>
          <div className="detail-row">
            <span>Ngày đặt hàng:</span>
            <span>{formatDate(hoaDon.donHang.ngayTao)}</span>
          </div>
        </div>

        <div className="invoice-details">
          <h4>Chi tiết đơn hàng</h4>
          <table className="order-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên món ăn</th>
                <th>Số lượng</th>
                <th>Đơn giá</th>
                <th>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {hoaDon.donHang.chiTietDonHang?.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>{item.monAn?.tenMonAn || 'N/A'}</td>
                  <td>{item.soLuong}</td>
                  <td>{item.donGia?.toLocaleString()}₫</td>
                  <td>{calculateThanhTien(item)?.toLocaleString()}₫</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        
        {hoaDon.donHang.voucher && (
          <div className="invoice-details voucher-section">
            <h4>🎫 Thông tin voucher đã sử dụng</h4>
            <div className="detail-row">
              <span>Mã voucher:</span>
              <span className="voucher-code">{hoaDon.donHang.voucher.maVoucher}</span>
            </div>
            {hoaDon.donHang.voucher.moTa && (
              <div className="detail-row">
                <span>Mô tả:</span>
                <span>{hoaDon.donHang.voucher.moTa}</span>
              </div>
            )}
            <div className="detail-row">
              <span>Loại giảm giá:</span>
              <span>
                {hoaDon.donHang.voucher.loai === 'PHAN_TRAM' 
                  ? `${hoaDon.donHang.voucher.giaTri}%` 
                  : `${hoaDon.donHang.voucher.giaTri?.toLocaleString()}₫`}
              </span>
            </div>
            <div className="detail-row voucher-discount">
              <span>Số tiền được giảm:</span>
              <span>-{voucherDiscount.toLocaleString()}₫</span>
            </div>
          </div>
        )}

        <div className="total-section">
       
          {hoaDon.donHang.voucher && (
            <div className="detail-row">
              <span>Tạm tính:</span>
              <span>{tongTienGoc.toLocaleString()}₫</span>
            </div>
          )}
          
      
          {hoaDon.donHang.voucher && voucherDiscount > 0 && (
            <div className="detail-row discount-row">
              <span>Giảm giá voucher:</span>
              <span className="discount-amount">-{voucherDiscount.toLocaleString()}₫</span>
            </div>
          )}
          
          <div className="detail-row total-amount">
            <span> Tổng tiền thanh toán:</span>
            <span>{tongTienSauGiamGia.toLocaleString()}₫</span>
          </div>
          <div className="detail-row">
            <span>Trạng thái thanh toán:</span>
            <span>{getTrangThaiThanhToan(hoaDon.trangThai)}</span>
          </div>
          <div className="detail-row">
            <span>Thời gian thanh toán:</span>
            <span>{formatDate(hoaDon.thoiGianThanhToan)}</span>
          </div>
        </div>

       
        {tongTienSauGiamGia < 200000 && (
          <div className="shipping-note">
            <div className="note-header">📦 Thông tin giao hàng</div>
            <div className="note-content">
              <p><strong>Phí giao hàng:</strong> 30.000₫ </p>
              <p><em>* Phí giao hàng không bao gồm trong hóa đơn này.</em></p>
            </div>
          </div>
        )}
     
        <div className="invoice-footer">
          <p><strong>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</strong></p>
          {hoaDon.donHang.voucher && voucherDiscount > 0 && (
            <p><em>🎉 Bạn đã tiết kiệm được {voucherDiscount.toLocaleString()}₫ với voucher {hoaDon.donHang.voucher.maVoucher}!</em></p>
          )}
          <p>Hóa đơn được tạo tự động bởi hệ thống - {new Date().toLocaleString('vi-VN')}</p>
        </div>

      
        <div className="action-buttons no-print">
          <button onClick={handlePrint} className="print-button">
             In hóa đơn
          </button>
          <button onClick={() => navigate('/lich-su-giao-dich')} className="secondary-button">
             Xem đơn hàng
          </button>
          <button onClick={() => navigate('/')} className="primary-button">
             Về trang chủ
          </button>
        </div>
      </div>
    </div>
  );
};

export default HoaDon;