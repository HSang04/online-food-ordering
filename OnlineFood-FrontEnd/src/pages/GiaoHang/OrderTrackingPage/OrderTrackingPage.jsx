import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import DeliveryMapComponent from './DeliveryMapComponent';
import axios from '../../../services/axiosInstance';
import './OrderTracking.css';

const OrderTrackingPage = () => {
  const { donHangId } = useParams();
  const [donHang, setDonHang] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDonHang = async () => {
      try {
        const response = await axios.get(`/don-hang/${donHangId}`);
        setDonHang(response.data);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải thông tin đơn hàng');
        setLoading(false);
      }
    };

    if (donHangId) {
      fetchDonHang();
    }
  }, [donHangId]);

  if (loading) {
    return (
      <div className="tracking-container">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error || !donHang) {
    return (
      <div className="tracking-container">
        <div className="error">{error || 'Không tìm thấy đơn hàng'}</div>
      </div>
    );
  }

  return (
    <div className="tracking-container">
      <div className="tracking-header">
        <h1>🚚 Theo dõi đơn hàng #{donHangId}</h1>
        <div className="order-status">
          <span className={`status-badge status-${donHang.trangThai?.toLowerCase()}`}>
            {donHang.trangThai}
          </span>
        </div>
      </div>

      <div className="tracking-content">
        <div className="order-info-card">
          <h3>📋 Thông tin đơn hàng</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Địa chỉ giao hàng:</span>
              <span className="value">{donHang.diaChiGiaoHang}</span>
            </div>
            <div className="info-item">
              <span className="label">Tổng tiền:</span>
              <span className="value">{donHang.tongTien?.toLocaleString()}₫</span>
            </div>
            <div className="info-item">
              <span className="label">Ngày đặt:</span>
              <span className="value">
                {new Date(donHang.ngayTao).toLocaleString('vi-VN')}
              </span>
            </div>
            {donHang.ghiChu && (
              <div className="info-item full-width">
                <span className="label">Ghi chú:</span>
                <span className="value">{donHang.ghiChu}</span>
              </div>
            )}
          </div>
        </div>

        <div className="map-card">
          <h3>🗺️ Vị trí giao hàng</h3>
          {donHang.latGiaoHang && donHang.lonGiaoHang ? (
            <DeliveryMapComponent
              mode="tracking"
              donHangId={donHangId}
              initialDeliveryLocation={{
                lat: donHang.latGiaoHang,
                lng: donHang.lonGiaoHang
              }}
            />
          ) : (
            <div className="no-location">
              <p>Chưa có thông tin vị trí giao hàng</p>
            </div>
          )}
        </div>

        <div className="order-items-card">
          <h3>🍔 Chi tiết món ăn</h3>
          <div className="items-list">
            {donHang.chiTietDonHang?.map((item, index) => (
              <div key={index} className="item-row">
                <div className="item-name">
                  {item.monAn?.tenMonAn}
                  <span className="item-quantity">x{item.soLuong}</span>
                </div>
                <div className="item-price">
                  {item.thanhTien?.toLocaleString()}₫
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;