import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from '../../../services/axiosInstance';
import './ChiTietGiaoHang.css';

// ─── Leaflet icon fix ─────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const makeIcon = (color) => new L.Icon({
  iconUrl:    `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl:  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize:   [25, 41],
  iconAnchor: [12, 41],
  popupAnchor:[1, -34],
  shadowSize: [41, 41],
});

const storeIcon           = makeIcon('green');
const deliveryIcon        = makeIcon('red');
const currentLocationIcon = makeIcon('blue');

// ─── Auto-fit bounds ──────────────────────────────────────────
const AutoFitBounds = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions?.length > 0) {
      map.fitBounds(L.latLngBounds(positions), { padding: [50, 50] });
    }
  }, [positions, map]);
  return null;
};

// ─── Helpers ──────────────────────────────────────────────────
const formatDateTime = (dt) =>
  new Date(dt).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const BOUND_METERS = 30000;

// ─── Component ───────────────────────────────────────────────
const ChiTietGiaoHang = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const location     = useLocation();

  const jwt        = localStorage.getItem('jwt');
  const shipperId  = Number(localStorage.getItem('idNguoiDung'));
  const authHeader = { Authorization: `Bearer ${jwt}` };

  // ── State ──
  const [donHang,         setDonHang]         = useState(null);
  const [storeInfo,       setStoreInfo]       = useState(null);
  const [routePath,       setRoutePath]       = useState([]);
  const [routeInfo,       setRouteInfo]       = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  const [loadingOrder,    setLoadingOrder]    = useState(true);
  const [loadingRoute,    setLoadingRoute]    = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError,   setLocationError]   = useState(null);
  const [routeError,      setRouteError]      = useState(null);

  // ── Ownership check ──────────────────────────────────────
  const checkOwnership = useCallback((order) => {
    const isOwner = order?.nvGiaoHang?.id === shipperId;
    if (!isOwner) {
      alert('⚠️ Bạn không có quyền xem đơn hàng này!');
      navigate('/quan-ly/giao-hang', { replace: true });
      return false;
    }
    return true;
  }, [shipperId, navigate]);

  // ── Fetch store info ──
  const fetchStoreInfo = useCallback(async () => {
    try {
      const { data } = await axios.get('/thong-tin-cua-hang');
      if (data) setStoreInfo(data);
    } catch (err) {
      console.error('Lỗi khi lấy thông tin cửa hàng:', err);
    }
  }, []);

  // ── Fetch order details ──
  const fetchOrderDetails = useCallback(async (orderId) => {
    try {
      setLoadingOrder(true);
      const { data: order } = await axios.get(`/don-hang/${orderId}`, { headers: authHeader });

      // ── OWNERSHIP CHECK ──
      if (!checkOwnership(order)) return;

      setDonHang(order);
    } catch (err) {
      console.error('Lỗi khi lấy chi tiết đơn hàng:', err);
      // Backend trả 403 → không phải đơn của shipper này
      if (err.response?.status === 403) {
        alert('⚠️ Bạn không có quyền xem đơn hàng này!');
        navigate('/quan-ly/giao-hang', { replace: true });
        return;
      }
      alert('Không thể tải thông tin đơn hàng. Vui lòng thử lại!');
      navigate('/quan-ly/giao-hang', { replace: true });
    } finally {
      setLoadingOrder(false);
    }
  }, [jwt, checkOwnership, navigate]); // eslint-disable-line

  // ── Calculate route ──
  const calculateRoute = useCallback(async (order, store) => {
    if (!order?.latGiaoHang || !order?.lonGiaoHang || !store) return;

    setLoadingRoute(true);
    setRouteError(null);

    try {
      const { data } = await axios.get('/delivery/route/bmssp/shortest-path', {
        params: {
          latStart:    store.viDo,
          lonStart:    store.kinhDo,
          latEnd:      order.latGiaoHang,
          lonEnd:      order.lonGiaoHang,
          boundMeters: BOUND_METERS,
        },
      });

      if (data.success && data.routePath) {
        setRoutePath(data.routePath.map(c => [c[0], c[1]]));
        setRouteInfo({
          distance:  data.totalDistance,
          duration:  data.estimatedDuration,
          summary:   data.routeSummary,
          nodeCount: data.nodeCount,
        });
      } else {
        setRouteError(data.message || 'Không tìm thấy đường đi');
      }
    } catch {
      setRouteError('Không thể tính đường đi. Vui lòng thử lại!');
    } finally {
      setLoadingRoute(false);
    }
  }, []);

  // ── GPS location ──
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt không hỗ trợ định vị GPS');
      return;
    }
    setLoadingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCurrentLocation({
          lat:       coords.latitude,
          lon:       coords.longitude,
          accuracy:  coords.accuracy,
          timestamp: new Date(),
        });
        setLoadingLocation(false);
      },
      (err) => {
        const msgs = {
          [err.PERMISSION_DENIED]:     'Bạn đã từ chối quyền truy cập vị trí',
          [err.POSITION_UNAVAILABLE]:  'Thông tin vị trí không khả dụng',
          [err.TIMEOUT]:               'Hết thời gian chờ lấy vị trí',
        };
        setLocationError(msgs[err.code] || 'Không thể lấy vị trí hiện tại');
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // ── Complete delivery ──
  const handleCompleteDelivery = async () => {
    if (!window.confirm(
      `Xác nhận hoàn thành giao hàng cho đơn #${donHang.id}?\n\n` +
      `Khách hàng: ${donHang.nguoiDung?.hoTen || donHang.nguoiDung?.tenNguoiDung}\n` +
      `Tổng tiền: ${donHang.tongTien?.toLocaleString()}₫\n\n` +
      `Sau khi xác nhận, đơn hàng sẽ chuyển sang trạng thái "Hoàn thành".`
    )) return;

    setLoadingComplete(true);
    try {
      await axios.patch(
        `/don-hang/${donHang.id}/hoan-thanh`,
        {},
        { params: { shipperId }, headers: authHeader }
      );

      // Cập nhật hóa đơn (non-critical)
      try {
        await axios.put(`/hoa-don/cap-nhat-hoan-thanh/${donHang.id}`, {}, { headers: authHeader });
      } catch {
        // bỏ qua nếu lỗi
      }

      alert('✅ Đơn hàng đã được hoàn thành!\nHóa đơn đã được cập nhật trạng thái thanh toán.');
      navigate('/quan-ly/giao-hang');
    } catch (err) {
      const status = err.response?.status;
      if (status === 403) {
        alert('⚠️ Bạn không phải shipper của đơn hàng này!');
      } else {
        alert(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật trạng thái. Vui lòng thử lại!');
      }
    } finally {
      setLoadingComplete(false);
    }
  };

  // ── Effects ──
  useEffect(() => { fetchStoreInfo(); }, [fetchStoreInfo]);
  useEffect(() => { getCurrentLocation(); }, [getCurrentLocation]);

  useEffect(() => {
    const orderFromState = location.state?.order;
    if (orderFromState) {
      // Đơn truyền qua state vẫn phải verify ownership
      if (!checkOwnership(orderFromState)) return;
      setDonHang(orderFromState);
      setLoadingOrder(false);
    } else if (id) {
      fetchOrderDetails(id);
    }
  }, [id]); // eslint-disable-line

  useEffect(() => {
    if (donHang && storeInfo) calculateRoute(donHang, storeInfo);
  }, [donHang, storeInfo, calculateRoute]);

  // ── Map positions ──
  const allPositions = [
    storeInfo?.viDo && storeInfo?.kinhDo ? [storeInfo.viDo, storeInfo.kinhDo] : null,
    donHang?.latGiaoHang && donHang?.lonGiaoHang ? [donHang.latGiaoHang, donHang.lonGiaoHang] : null,
    currentLocation ? [currentLocation.lat, currentLocation.lon] : null,
  ].filter(Boolean);

  const mapCenter = currentLocation
    ? [currentLocation.lat, currentLocation.lon]
    : storeInfo
      ? [storeInfo.viDo, storeInfo.kinhDo]
      : [10.7769, 106.7009];

  // ── Render guards ──
  if (loadingOrder) {
    return (
      <div className="chi-tiet-giao-hang-container">
        <div className="loading-container">
          <div className="loading-spinner" />
          <p>Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (!donHang) return null; // đã redirect trong checkOwnership

  // ── Main render ──
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

        {/* ── Info panel ── */}
        <div className="info-panel">

          {/* GPS */}
          <div className="info-section">
            <h3>📍 Vị trí hiện tại của bạn</h3>
            {loadingLocation && (
              <div className="location-loading">
                <div className="loading-spinner small" />
                <span>Đang lấy vị trí GPS...</span>
              </div>
            )}
            {locationError && (
              <div className="location-error">
                <span>⚠️ {locationError}</span>
                <button onClick={getCurrentLocation} className="btn-retry-location">🔄 Thử lại</button>
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

          {/* Customer */}
          <div className="info-section">
            <h3>👤 Thông tin khách hàng</h3>
            <div className="info-grid">
              <InfoItem label="Tên"   value={donHang.nguoiDung?.hoTen || donHang.nguoiDung?.tenNguoiDung || 'N/A'} />
              <InfoItem label="SĐT"   value={donHang.nguoiDung?.soDienThoai || donHang.nguoiDung?.sdt || 'N/A'} />
              <InfoItem label="Email" value={donHang.nguoiDung?.email || 'N/A'} />
            </div>
          </div>

          {/* Address */}
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

          {/* Order info */}
          <div className="info-section">
            <h3>📦 Chi tiết đơn hàng</h3>
            <div className="info-grid">
              <InfoItem label="Thời gian đặt" value={formatDateTime(donHang.ngayTao)} />
              <InfoItem label="Tổng tiền" valueClassName="highlight" value={`${donHang.tongTien?.toLocaleString()}₫`} />
              {donHang.ghiChu && <InfoItem label="Ghi chú" value={donHang.ghiChu} fullWidth />}
            </div>
          </div>

          {/* Route info */}
          {routeInfo && (
            <div className="info-section route-info-section">
              <h3>🗺️ Thông tin đường đi</h3>
              <div className="route-stats">
                <RouteStat icon="📏" value={`${routeInfo.distance?.toFixed(2)} km`}       label="Khoảng cách" />
                <RouteStat icon="⏱️" value={`~${Math.ceil(routeInfo.duration)} phút`}     label="Thời gian" />
                <RouteStat icon="📍" value={routeInfo.nodeCount}                           label="Điểm trên đường" />
              </div>
              <p className="route-summary">{routeInfo.summary}</p>
            </div>
          )}

          {/* Route error */}
          {routeError && !routeInfo && (
            <div className="error-message">
              ⚠️ {routeError}
              <button onClick={() => calculateRoute(donHang, storeInfo)} className="btn-retry" disabled={loadingRoute}>
                {loadingRoute ? 'Đang tính...' : '🔄 Thử lại'}
              </button>
            </div>
          )}

          {/* Complete button */}
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

        {/* ── Map panel ── */}
        <div className="map-panel">
          <div className="map-header">
            <h3>🗺️ Bản đồ đường đi</h3>
            {loadingRoute && (
              <div className="map-loading-badge">
                <div className="loading-spinner small" />
                <span>Đang tính đường đi...</span>
              </div>
            )}
          </div>

          <div className="map-wrapper">
            <MapContainer center={mapCenter} zoom={13} style={{ width: '100%', height: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />

              {allPositions.length > 0 && <AutoFitBounds positions={allPositions} />}

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

              {donHang.latGiaoHang && donHang.lonGiaoHang && (
                <Marker position={[donHang.latGiaoHang, donHang.lonGiaoHang]} icon={deliveryIcon}>
                  <Popup>
                    <div className="map-popup">
                      <strong>📍 Điểm giao hàng</strong>
                      <div>{donHang.diaChiGiaoHang}</div>
                      <div style={{ marginTop: 5, fontSize: 12 }}>
                        {donHang.nguoiDung?.hoTen || donHang.nguoiDung?.tenNguoiDung}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {currentLocation && (
                <Marker position={[currentLocation.lat, currentLocation.lon]} icon={currentLocationIcon}>
                  <Popup>
                    <div className="map-popup">
                      <strong>📍 Vị trí của bạn</strong>
                      <div style={{ marginTop: 5, fontSize: 12 }}>
                        Độ chính xác: ±{Math.round(currentLocation.accuracy)}m
                      </div>
                      <div style={{ fontSize: 11, color: '#999' }}>
                        {currentLocation.timestamp.toLocaleString('vi-VN')}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )}

              {routePath.length > 0 && (
                <Polyline positions={routePath} color="#8b5cf6" weight={4} opacity={0.7} />
              )}
            </MapContainer>
          </div>

          <div className="map-legend">
            <div className="legend-item"><div className="legend-marker green" /><span>Cửa hàng</span></div>
            <div className="legend-item"><div className="legend-marker red"   /><span>Điểm giao hàng</span></div>
            <div className="legend-item"><div className="legend-marker blue"  /><span>Vị trí của bạn</span></div>
            <div className="legend-item"><div className="legend-line"         /><span>Đường đi (BMSSP)</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Tiny sub-components ──────────────────────────────────────
const InfoItem = ({ label, value, valueClassName = '', fullWidth = false }) => (
  <div className={`info-item${fullWidth ? ' full-width' : ''}`}>
    <span className="info-label">{label}:</span>
    <span className={`info-value${valueClassName ? ` ${valueClassName}` : ''}`}>{value}</span>
  </div>
);

const RouteStat = ({ icon, value, label }) => (
  <div className="route-stat">
    <span className="route-stat-icon">{icon}</span>
    <div>
      <div className="route-stat-value">{value}</div>
      <div className="route-stat-label">{label}</div>
    </div>
  </div>
);

export default ChiTietGiaoHang;