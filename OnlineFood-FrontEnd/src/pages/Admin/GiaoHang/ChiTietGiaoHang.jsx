import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from '../../../services/axiosInstance';
import './ChiTietGiaoHang.css';

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const storeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const currentLocationIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Auto fit bounds component
const AutoFitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [positions, map]);
  return null;
};

const ChiTietGiaoHang = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [donHang, setDonHang] = useState(location.state?.order || null);
  const [chiTietDonHang, setChiTietDonHang] = useState([]);
  const [storeInfo, setStoreInfo] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  
  // GPS Location states
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  
  const [loadingOrder, setLoadingOrder] = useState(!donHang);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [error, setError] = useState(null);

  const jwt = localStorage.getItem("jwt");
  const BOUND_METERS = 30000; // 30km

  // Fetch store info
  useEffect(() => {
    fetchStoreInfo();
  }, []);

  // Fetch order if not in state
  useEffect(() => {
    if (!donHang && id) {
      fetchOrderDetails(id);
    }
  }, [id, donHang]);

  // Calculate route when order has coordinates
  useEffect(() => {
    if (donHang && donHang.latGiaoHang && donHang.lonGiaoHang && storeInfo) {
      calculateRoute();
    }
  }, [donHang, storeInfo]);

  // Get current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt không hỗ trợ định vị GPS');
      return;
    }

    setLoadingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setCurrentLocation({
          lat: latitude,
          lon: longitude,
          accuracy: accuracy,
          timestamp: new Date()
        });
        setLoadingLocation(false);
        console.log('Vị trí hiện tại:', { latitude, longitude, accuracy });
      },
      (error) => {
        let errorMessage = 'Không thể lấy vị trí hiện tại';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Bạn đã từ chối quyền truy cập vị trí';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Thông tin vị trí không khả dụng';
            break;
          case error.TIMEOUT:
            errorMessage = 'Hết thời gian chờ lấy vị trí';
            break;
        }
        setLocationError(errorMessage);
        setLoadingLocation(false);
        console.error('Lỗi GPS:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const fetchStoreInfo = async () => {
    try {
      const response = await axios.get('/thong-tin-cua-hang');
      if (response.data) {
        setStoreInfo(response.data);
      }
    } catch (err) {
      console.error('Lỗi khi lấy thông tin cửa hàng:', err);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    try {
      setLoadingOrder(true);
      const [orderRes, detailsRes] = await Promise.all([
        axios.get(`/don-hang/${orderId}`, {
          headers: { Authorization: `Bearer ${jwt}` }
        }),
        axios.get(`/chi-tiet-don-hang/don-hang/${orderId}`, {
          headers: { Authorization: `Bearer ${jwt}` }
        })
      ]);

      if (orderRes.data) {
        setDonHang(orderRes.data);
      }

      if (detailsRes.data && Array.isArray(detailsRes.data)) {
        setChiTietDonHang(detailsRes.data);
      }
    } catch (err) {
      console.error('Lỗi khi lấy chi tiết đơn hàng:', err);
      setError('Không thể tải thông tin đơn hàng');
    } finally {
      setLoadingOrder(false);
    }
  };

  const calculateRoute = async () => {
    if (!donHang.latGiaoHang || !donHang.lonGiaoHang) {
      setError('Đơn hàng chưa có tọa độ giao hàng');
      return;
    }

    setLoadingRoute(true);
    setError(null);

    try {
      const response = await axios.get('/delivery/route/bmssp/shortest-path', {
        params: {
          latStart: storeInfo.viDo,
          lonStart: storeInfo.kinhDo,
          latEnd: donHang.latGiaoHang,
          lonEnd: donHang.lonGiaoHang,
          boundMeters: BOUND_METERS
        }
      });

      const data = response.data;

      if (data.success && data.routePath) {
        const path = data.routePath.map(coord => [coord[0], coord[1]]);
        setRoutePath(path);
        setRouteInfo({
          distance: data.totalDistance,
          duration: data.estimatedDuration,
          summary: data.routeSummary,
          nodeCount: data.nodeCount
        });
      } else {
        setError(data.message || 'Không tìm thấy đường đi');
      }
    } catch (err) {
      console.error('Lỗi khi tính đường đi:', err);
      setError('Không thể tính đường đi. Vui lòng thử lại!');
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleCompleteDelivery = async () => {
    const confirmComplete = window.confirm(
      `Xác nhận hoàn thành giao hàng cho đơn #${donHang.id}?\n\n` +
      `Khách hàng: ${donHang.nguoiDung?.hoTen || donHang.nguoiDung?.tenNguoiDung}\n` +
      `Tổng tiền: ${donHang.tongTien?.toLocaleString()}₫\n\n` +
      `Sau khi xác nhận, đơn hàng sẽ chuyển sang trạng thái "Hoàn thành" và hóa đơn sẽ được cập nhật.`
    );

    if (!confirmComplete) return;

    setLoadingComplete(true);

    try {
      const response = await axios.patch(
        `/don-hang/trang-thai/${donHang.id}`,
        { trangThai: 'HOAN_THANH' },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data) {
        // Cập nhật hóa đơn
        try {
          await axios.put(`/hoa-don/cap-nhat-hoan-thanh/${donHang.id}`, {}, {
            headers: { Authorization: `Bearer ${jwt}` }
          });
        } catch (invoiceError) {
          console.error('Lỗi khi cập nhật hóa đơn:', invoiceError);
        }

        alert('✅ Đơn hàng đã được hoàn thành!\nHóa đơn đã được cập nhật trạng thái thanh toán.');
        navigate('/quan-ly/giao-hang');
      }
    } catch (err) {
      console.error('Lỗi khi hoàn thành đơn hàng:', err);
      alert('Có lỗi xảy ra khi cập nhật trạng thái. Vui lòng thử lại!');
    } finally {
      setLoadingComplete(false);
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

  if (loadingOrder) {
    return (
      <div className="chi-tiet-giao-hang-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (!donHang) {
    return (
      <div className="chi-tiet-giao-hang-container">
        <div className="error-container">
          <h2>⚠️ Không tìm thấy đơn hàng</h2>
          <button onClick={() => navigate('/quan-ly/giao-hang')} className="btn-back">
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  const allPositions = [];
  if (storeInfo?.viDo && storeInfo?.kinhDo) {
    allPositions.push([storeInfo.viDo, storeInfo.kinhDo]);
  }
  if (donHang.latGiaoHang && donHang.lonGiaoHang) {
    allPositions.push([donHang.latGiaoHang, donHang.lonGiaoHang]);
  }
  if (currentLocation) {
    allPositions.push([currentLocation.lat, currentLocation.lon]);
  }

  return (
    <div className="chi-tiet-giao-hang-container">
      {/* Header */}
      <header className="chi-tiet-giao-hang-header">
        <div className="header-top">
          <button onClick={() => navigate('/quan-ly/giao-hang')} className="btn-back">
            ⬅️ Quay lại
          </button>
          <h1>🚚 Chi tiết giao hàng #{donHang.id}</h1>
        </div>
      </header>

      <div className="chi-tiet-giao-hang-content">
        {/* Order Info Panel */}
        <div className="info-panel">
          {/* Current Location Info */}
          <div className="info-section">
            <h3>📍 Vị trí hiện tại của bạn</h3>
            {loadingLocation && (
              <div className="location-loading">
                <div className="loading-spinner small"></div>
                <span>Đang lấy vị trí GPS...</span>
              </div>
            )}
            {locationError && (
              <div className="location-error">
                <span>⚠️ {locationError}</span>
                <button onClick={getCurrentLocation} className="btn-retry-location">
                  🔄 Thử lại
                </button>
              </div>
            )}
            {currentLocation && !loadingLocation && (
              <div className="location-info">
                <div className="location-item">
                  <span className="location-label">Vĩ độ:</span>
                  <span className="location-value">{currentLocation.lat.toFixed(6)}</span>
                </div>
                <div className="location-item">
                  <span className="location-label">Kinh độ:</span>
                  <span className="location-value">{currentLocation.lon.toFixed(6)}</span>
                </div>
                <div className="location-item">
                  <span className="location-label">Độ chính xác:</span>
                  <span className="location-value">±{Math.round(currentLocation.accuracy)}m</span>
                </div>
                <div className="location-item">
                  <span className="location-label">Thời gian:</span>
                  <span className="location-value">{currentLocation.timestamp.toLocaleTimeString('vi-VN')}</span>
                </div>
                <button onClick={getCurrentLocation} className="btn-refresh-location">
                  🔄 Cập nhật vị trí
                </button>
              </div>
            )}
          </div>

          {/* Customer Info */}
          <div className="info-section">
            <h3>👤 Thông tin khách hàng</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Tên:</span>
                <span className="info-value">{donHang.nguoiDung?.hoTen || donHang.nguoiDung?.tenNguoiDung || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">SĐT:</span>
                <span className="info-value">{donHang.nguoiDung?.soDienThoai || donHang.nguoiDung?.sdt || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Email:</span>
                <span className="info-value">{donHang.nguoiDung?.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="info-section">
            <h3>📍 Địa chỉ giao hàng</h3>
            <div className="address-box">
              <p className="address-text">{donHang.diaChiGiaoHang || 'Chưa có địa chỉ'}</p>
              {donHang.latGiaoHang && donHang.lonGiaoHang && (
                <p className="coordinates">
                  Tọa độ: {donHang.latGiaoHang.toFixed(6)}, {donHang.lonGiaoHang.toFixed(6)}
                </p>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div className="info-section">
            <h3>📦 Chi tiết đơn hàng</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Thời gian đặt:</span>
                <span className="info-value">{formatDateTime(donHang.ngayTao)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Tổng tiền:</span>
                <span className="info-value highlight">{donHang.tongTien?.toLocaleString()}₫</span>
              </div>
              {donHang.ghiChu && (
                <div className="info-item full-width">
                  <span className="info-label">Ghi chú:</span>
                  <span className="info-value">{donHang.ghiChu}</span>
                </div>
              )}
            </div>
          </div>

          {/* Route Info */}
          {routeInfo && (
            <div className="info-section route-info-section">
              <h3>🗺️ Thông tin đường đi</h3>
              <div className="route-stats">
                <div className="route-stat">
                  <span className="route-stat-icon">📏</span>
                  <div>
                    <div className="route-stat-value">{routeInfo.distance?.toFixed(2)} km</div>
                    <div className="route-stat-label">Khoảng cách</div>
                  </div>
                </div>
                <div className="route-stat">
                  <span className="route-stat-icon">⏱️</span>
                  <div>
                    <div className="route-stat-value">~{Math.ceil(routeInfo.duration)} phút</div>
                    <div className="route-stat-label">Thời gian</div>
                  </div>
                </div>
                <div className="route-stat">
                  <span className="route-stat-icon">📍</span>
                  <div>
                    <div className="route-stat-value">{routeInfo.nodeCount}</div>
                    <div className="route-stat-label">Điểm trên đường</div>
                  </div>
                </div>
              </div>
              <p className="route-summary">{routeInfo.summary}</p>
            </div>
          )}

          {/* Error Message */}
          {error && !routeInfo && (
            <div className="error-message">
              ⚠️ {error}
              <button onClick={calculateRoute} className="btn-retry" disabled={loadingRoute}>
                {loadingRoute ? 'Đang tính...' : '🔄 Thử lại'}
              </button>
            </div>
          )}

          {/* Complete Button */}
          <div className="action-section">
            <button
              onClick={handleCompleteDelivery}
              disabled={loadingComplete}
              className="btn-complete-delivery"
            >
              {loadingComplete ? '⏳ Đang xử lý...' : '✅ Hoàn thành giao hàng'}
            </button>
          </div>
        </div>

        {/* Map Panel */}
        <div className="map-panel">
          <div className="map-header">
            <h3>🗺️ Bản đồ đường đi</h3>
            {loadingRoute && (
              <div className="map-loading-badge">
                <div className="loading-spinner small"></div>
                <span>Đang tính đường đi...</span>
              </div>
            )}
          </div>

          <div className="map-wrapper">
            <MapContainer
              center={
                currentLocation 
                  ? [currentLocation.lat, currentLocation.lon]
                  : storeInfo 
                    ? [storeInfo.viDo, storeInfo.kinhDo] 
                    : [10.7769, 106.7009]
              }
              zoom={13}
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {allPositions.length > 0 && <AutoFitBounds positions={allPositions} />}

              {/* Store Marker */}
              {storeInfo?.viDo && storeInfo?.kinhDo && (
                <Marker position={[storeInfo.viDo, storeInfo.kinhDo]} icon={storeIcon}>
                  <Popup>
                    <div className="map-popup">
                      <strong>🏪 {storeInfo.ten}</strong>
                      <div>{storeInfo.diaChi}</div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Delivery Marker */}
              {donHang.latGiaoHang && donHang.lonGiaoHang && (
                <Marker position={[donHang.latGiaoHang, donHang.lonGiaoHang]} icon={deliveryIcon}>
                  <Popup>
                    <div className="map-popup">
                      <strong>📍 Điểm giao hàng</strong>
                      <div>{donHang.diaChiGiaoHang}</div>
                      <div style={{ marginTop: '5px', fontSize: '12px' }}>
                        {donHang.nguoiDung?.hoTen || donHang.nguoiDung?.tenNguoiDung}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Current Location Marker */}
              {currentLocation && (
                <Marker position={[currentLocation.lat, currentLocation.lon]} icon={currentLocationIcon}>
                  <Popup>
                    <div className="map-popup">
                      <strong>📍 Vị trí của bạn</strong>
                      <div style={{ marginTop: '5px', fontSize: '12px' }}>
                        Độ chính xác: ±{Math.round(currentLocation.accuracy)}m
                      </div>
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        {currentLocation.timestamp.toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Route Polyline */}
              {routePath.length > 0 && (
                <Polyline 
                  positions={routePath} 
                  color="#8b5cf6" 
                  weight={4} 
                  opacity={0.7} 
                />
              )}
            </MapContainer>
          </div>

          {/* Map Legend */}
          <div className="map-legend">
            <div className="legend-item">
              <div className="legend-marker green"></div>
              <span>Cửa hàng</span>
            </div>
            <div className="legend-item">
              <div className="legend-marker red"></div>
              <span>Điểm giao hàng</span>
            </div>
            <div className="legend-item">
              <div className="legend-marker blue"></div>
              <span>Vị trí của bạn</span>
            </div>
            <div className="legend-item">
              <div className="legend-line"></div>
              <span>Đường đi (BMSSP)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChiTietGiaoHang;