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
  iconSize:   [25, 41], iconAnchor: [12, 41],
  popupAnchor:[1, -34],  shadowSize: [41, 41],
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

const formatDateTime = (dt) =>
  new Date(dt).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const BOUND_METERS = 30000;
const PHI_SHIP     = 30000;
const MIEN_PHI_TU  = 200000;

// ─── Component ───────────────────────────────────────────────
const ChiTietGiaoHang = () => {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();

  const jwt       = localStorage.getItem('jwt');
  const shipperId = Number(localStorage.getItem('idNguoiDung'));
  const authHeader = { Authorization: `Bearer ${jwt}` };

  // ── Route mode: 'gps' = GPS->điểm giao, 'store' = quán->điểm giao ──
  const [routeMode, setRouteMode] = useState('gps');

  const [donHang,         setDonHang]         = useState(null);
  const [storeInfo,       setStoreInfo]       = useState(null);
  const [routePathGps,    setRoutePathGps]    = useState([]);
  const [routePathStore,  setRoutePathStore]  = useState([]);
  const [routeInfoGps,    setRouteInfoGps]    = useState(null);
  const [routeInfoStore,  setRouteInfoStore]  = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  const [loadingOrder,    setLoadingOrder]    = useState(true);
  const [loadingRouteGps,   setLoadingRouteGps]   = useState(false);
  const [loadingRouteStore, setLoadingRouteStore] = useState(false);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationError,   setLocationError]   = useState(null);
  const [routeErrorGps,   setRouteErrorGps]   = useState(null);
  const [routeErrorStore, setRouteErrorStore] = useState(null);

  // Derived từ routeMode
  const routePath     = routeMode === 'gps' ? routePathGps    : routePathStore;
  const routeInfo     = routeMode === 'gps' ? routeInfoGps    : routeInfoStore;
  const loadingRoute  = routeMode === 'gps' ? loadingRouteGps : loadingRouteStore;
  const routeError    = routeMode === 'gps' ? routeErrorGps   : routeErrorStore;

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

  const fetchStoreInfo = useCallback(async () => {
    try {
      const { data } = await axios.get('/thong-tin-cua-hang');
      if (data) setStoreInfo(data);
    } catch {}
  }, []);

  const fetchOrderDetails = useCallback(async (orderId) => {
    try {
      setLoadingOrder(true);
      const { data: order } = await axios.get(`/don-hang/${orderId}`, { headers: authHeader });
      if (!checkOwnership(order)) return;
      setDonHang(order);
    } catch (err) {
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

  // ── Tính đường từ CỬA HÀNG đến điểm giao ──
  const calculateRouteFromStore = useCallback(async (order, store) => {
    if (!order?.latGiaoHang || !order?.lonGiaoHang || !store) return;
    setLoadingRouteStore(true);
    setRouteErrorStore(null);
    try {
      const { data } = await axios.get('/delivery/route/bounded-dijkstra/shortest-path', {
        params: {
          latStart: store.viDo, lonStart: store.kinhDo,
          latEnd:   order.latGiaoHang, lonEnd: order.lonGiaoHang,
          boundMeters: BOUND_METERS,
        },
      });
      if (data.success && data.routePath) {
        setRoutePathStore(data.routePath.map(c => [c[0], c[1]]));
        setRouteInfoStore({
          distance:  data.totalDistance,
          duration:  data.estimatedDuration,
          summary:   data.routeSummary,
          nodeCount: data.nodeCount,
        });
      } else {
        setRouteErrorStore(data.message || 'Không tìm thấy đường đi');
      }
    } catch {
      setRouteErrorStore('Không thể tính đường đi từ cửa hàng.');
    } finally {
      setLoadingRouteStore(false);
    }
  }, []);

  // ── Tính đường từ GPS đến điểm giao ──
  const calculateRouteFromGps = useCallback(async (gpsLat, gpsLon, order) => {
    if (!order?.latGiaoHang || !order?.lonGiaoHang || !gpsLat || !gpsLon) return;
    setLoadingRouteGps(true);
    setRouteErrorGps(null);
    try {
      const { data } = await axios.get('/delivery/route/bounded-dijkstra/shortest-path', {
        params: {
          latStart: gpsLat, lonStart: gpsLon,
          latEnd:   order.latGiaoHang, lonEnd: order.lonGiaoHang,
          boundMeters: BOUND_METERS,
        },
      });
      if (data.success && data.routePath) {
        setRoutePathGps(data.routePath.map(c => [c[0], c[1]]));
        setRouteInfoGps({
          distance:  data.totalDistance,
          duration:  data.estimatedDuration,
          summary:   data.routeSummary,
          nodeCount: data.nodeCount,
        });
      } else {
        setRouteErrorGps(data.message || 'Không tìm thấy đường từ vị trí của bạn');
      }
    } catch {
      setRouteErrorGps('Không thể tính đường từ vị trí GPS của bạn.');
    } finally {
      setLoadingRouteGps(false);
    }
  }, []);

  // ── GPS ──
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt không hỗ trợ định vị GPS');
      return;
    }
    setLoadingLocation(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const loc = {
          lat: coords.latitude, lon: coords.longitude,
          accuracy: coords.accuracy, timestamp: new Date(),
        };
        setCurrentLocation(loc);
        setLoadingLocation(false);
        // Tự tính đường GPS->điểm giao ngay khi lấy được vị trí
        if (donHang) calculateRouteFromGps(coords.latitude, coords.longitude, donHang);
      },
      (err) => {
        const msgs = {
          [err.PERMISSION_DENIED]:    'Bạn đã từ chối quyền truy cập vị trí',
          [err.POSITION_UNAVAILABLE]: 'Thông tin vị trí không khả dụng',
          [err.TIMEOUT]:              'Hết thời gian chờ lấy vị trí',
        };
        setLocationError(msgs[err.code] || 'Không thể lấy vị trí hiện tại');
        setLoadingLocation(false);
        // Nếu không lấy được GPS -> tự chuyển sang route từ cửa hàng
        setRouteMode('store');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [donHang, calculateRouteFromGps]);

  // ── Complete delivery ──
  const handleCompleteDelivery = async () => {
    const isCOD = donHang.hoaDon?.phuongThuc !== 'VNPAY';
    const phiShip = (donHang.tongTien || 0) >= MIEN_PHI_TU ? 0 : PHI_SHIP;
    const tongThuTien = isCOD ? (donHang.tongTien || 0) + phiShip : 0;

    if (!window.confirm(
      `Xác nhận hoàn thành giao hàng cho đơn #${donHang.id}?\n\n` +
      `Khách hàng: ${donHang.nguoiDung?.hoTen || donHang.nguoiDung?.tenNguoiDung}\n` +
      (isCOD
        ? `💰 Cần thu: ${tongThuTien.toLocaleString()}₫ (tiền mặt)\n`
        : `✅ Đã thanh toán VNPay — không thu tiền\n`) +
      `\nSau khi xác nhận, đơn hàng sẽ chuyển sang trạng thái "Hoàn thành".`
    )) return;

    setLoadingComplete(true);
    try {
      await axios.patch(`/don-hang/${donHang.id}/hoan-thanh`, {}, { params: { shipperId }, headers: authHeader });
      try { await axios.put(`/hoa-don/cap-nhat-hoan-thanh/${donHang.id}`, {}, { headers: authHeader }); } catch {}
      alert('✅ Đơn hàng đã được hoàn thành!');
      navigate('/quan-ly/giao-hang');
    } catch (err) {
      if (err.response?.status === 403) alert('⚠️ Bạn không phải shipper của đơn hàng này!');
      else alert(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại!');
    } finally {
      setLoadingComplete(false);
    }
  };

  // ── Effects ──
  useEffect(() => { fetchStoreInfo(); }, [fetchStoreInfo]);

  useEffect(() => {
    const orderFromState = location.state?.order;
    if (orderFromState) {
      if (!checkOwnership(orderFromState)) return;
      setDonHang(orderFromState);
      setLoadingOrder(false);
    } else if (id) {
      fetchOrderDetails(id);
    }
  }, [id]); // eslint-disable-line

  // Khi có donHang: lấy GPS (tự tính route GPS) + tính route từ store
  useEffect(() => {
    if (donHang) {
      getCurrentLocation();
      if (storeInfo) calculateRouteFromStore(donHang, storeInfo);
    }
  }, [donHang]); // eslint-disable-line

  useEffect(() => {
    if (donHang && storeInfo) calculateRouteFromStore(donHang, storeInfo);
  }, [storeInfo]); // eslint-disable-line

  // ── Map ──
  const allPositions = [
    routeMode === 'store' && storeInfo?.viDo ? [storeInfo.viDo, storeInfo.kinhDo] : null,
    routeMode === 'gps'   && currentLocation ? [currentLocation.lat, currentLocation.lon] : null,
    donHang?.latGiaoHang  ? [donHang.latGiaoHang, donHang.lonGiaoHang] : null,
  ].filter(Boolean);

  const mapCenter = currentLocation
    ? [currentLocation.lat, currentLocation.lon]
    : storeInfo ? [storeInfo.viDo, storeInfo.kinhDo] : [10.7769, 106.7009];

  const isCOD       = donHang?.hoaDon?.phuongThuc !== 'VNPAY';
  const phiShip     = (donHang?.tongTien || 0) >= MIEN_PHI_TU ? 0 : PHI_SHIP;
  const tongThuTien = isCOD ? (donHang?.tongTien || 0) + phiShip : 0;

  if (loadingOrder) {
    return (
      <div className="ctgh-container">
        <div className="ctgh-loading">
          <div className="ctgh-spinner" />
          <p>Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }
  if (!donHang) return null;

  return (
    <div className="ctgh-container">

      {/* ── HEADER ── */}
      <header className="ctgh-header">
        <button onClick={() => navigate('/quan-ly/giao-hang')} className="ctgh-btn-back">
          ← Quay lại
        </button>
        <h1 className="ctgh-header-title">🚚 Đơn #{donHang.id}</h1>
      </header>

      {/* ── BẢN ĐỒ (đặt lên đầu trên mobile) ── */}
      <div className="ctgh-map-section">

        {/* Toggle chế độ đường đi */}
        <div className="ctgh-route-toggle">
          <button
            className={`ctgh-toggle-btn ${routeMode === 'gps' ? 'active' : ''}`}
            onClick={() => setRouteMode('gps')}
          >
            📍 Từ vị trí của bạn
          </button>
          <button
            className={`ctgh-toggle-btn ${routeMode === 'store' ? 'active' : ''}`}
            onClick={() => setRouteMode('store')}
          >
            🏪 Từ cửa hàng
          </button>
        </div>

        {/* Route info badge */}
        {routeInfo && (
          <div className="ctgh-route-badge">
            <span>📏 {routeInfo.distance?.toFixed(1)} km</span>
            <span>⏱ ~{Math.ceil(routeInfo.duration)} phút</span>
            <span>📍 {routeInfo.nodeCount} điểm</span>
          </div>
        )}
        {loadingRoute && (
          <div className="ctgh-route-loading">
            <div className="ctgh-spinner small" /> Đang tính đường đi...
          </div>
        )}
        {routeError && !routeInfo && (
          <div className="ctgh-route-error">
            ⚠️ {routeError}
            <button onClick={() =>
              routeMode === 'gps'
                ? calculateRouteFromGps(currentLocation?.lat, currentLocation?.lon, donHang)
                : calculateRouteFromStore(donHang, storeInfo)
            }>🔄 Thử lại</button>
          </div>
        )}

        {/* GPS không có -> cảnh báo khi ở chế độ GPS */}
        {routeMode === 'gps' && !currentLocation && !loadingLocation && (
          <div className="ctgh-gps-warning">
            ⚠️ Chưa lấy được vị trí GPS.
            <button onClick={getCurrentLocation}>🔄 Thử lại GPS</button>
          </div>
        )}

        {/* Bản đồ */}
        <div className="ctgh-map-wrap">
          <MapContainer center={mapCenter} zoom={14} style={{ width: '100%', height: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {allPositions.length > 0 && <AutoFitBounds positions={allPositions} />}

            {/* Marker cửa hàng */}
            {storeInfo?.viDo && storeInfo?.kinhDo && (
              <Marker position={[storeInfo.viDo, storeInfo.kinhDo]} icon={storeIcon}>
                <Popup><strong>🏪 {storeInfo.ten}</strong><div>{storeInfo.diaChi}</div></Popup>
              </Marker>
            )}

            {/* Marker điểm giao */}
            {donHang.latGiaoHang && donHang.lonGiaoHang && (
              <Marker position={[donHang.latGiaoHang, donHang.lonGiaoHang]} icon={deliveryIcon}>
                <Popup>
                  <strong>📍 Điểm giao hàng</strong>
                  <div>{donHang.diaChiGiaoHang}</div>
                  <div>{donHang.nguoiDung?.hoTen || donHang.nguoiDung?.tenNguoiDung}</div>
                </Popup>
              </Marker>
            )}

            {/* Marker vị trí GPS */}
            {currentLocation && (
              <Marker position={[currentLocation.lat, currentLocation.lon]} icon={currentLocationIcon}>
                <Popup>
                  <strong>📍 Vị trí của bạn</strong>
                  <div>±{Math.round(currentLocation.accuracy)}m</div>
                </Popup>
              </Marker>
            )}

            {/* Đường đi */}
            {routePath.length > 0 && (
              <Polyline
                positions={routePath}
                color={routeMode === 'gps' ? '#3b82f6' : '#8b5cf6'}
                weight={5} opacity={0.8}
              />
            )}
          </MapContainer>
        </div>

        {/* Legend */}
        <div className="ctgh-legend">
          {routeMode === 'store' && <span><span className="ctgh-dot green"/>Cửa hàng</span>}
          {routeMode === 'gps'   && <span><span className="ctgh-dot blue"/>Vị trí bạn</span>}
          <span><span className="ctgh-dot red"/>Điểm giao</span>
          <span><span className="ctgh-line" style={{ background: routeMode === 'gps' ? '#3b82f6' : '#8b5cf6' }}/>Đường đi</span>
        </div>
      </div>

      {/* ── THANH TOÁN ── */}
      <div className={`ctgh-card ctgh-payment ${isCOD ? 'cod' : 'vnpay'}`}>
        <h3>💰 Thanh toán</h3>
        {isCOD ? (
          <>
            <div className="ctgh-payment-badge cod">⚠️ CẦN THU TIỀN MẶT</div>
            <div className="ctgh-payment-rows">
              <div className="ctgh-payment-row"><span>Tiền hàng</span><span>{donHang.tongTien?.toLocaleString()}₫</span></div>
              <div className="ctgh-payment-row"><span>Phí ship</span><span>{phiShip === 0 ? 'Miễn phí' : `${phiShip.toLocaleString()}₫`}</span></div>
              <div className="ctgh-payment-row total"><span>Tổng thu</span><span>{tongThuTien.toLocaleString()}₫</span></div>
            </div>
          </>
        ) : (
          <>
            <div className="ctgh-payment-badge vnpay">✅ ĐÃ THANH TOÁN VNPAY</div>
            <div className="ctgh-payment-rows">
              <div className="ctgh-payment-row"><span>Số tiền</span><span>{donHang.tongTien?.toLocaleString()}₫</span></div>
              <div className="ctgh-payment-row"><span>Trạng thái</span><span className="paid">Không cần thu tiền</span></div>
            </div>
          </>
        )}
      </div>

      {/* ── GHI CHÚ ── */}
      {donHang.ghiChu && (
        <div className="ctgh-card ctgh-note">
          <h3>📝 Ghi chú từ khách</h3>
          <p>{donHang.ghiChu}</p>
        </div>
      )}

      {/* ── THÔNG TIN KHÁCH ── */}
      <div className="ctgh-card">
        <h3>👤 Khách hàng</h3>
        <div className="ctgh-info-rows">
          <div className="ctgh-info-row"><span>Tên</span><span>{donHang.nguoiDung?.hoTen || donHang.nguoiDung?.tenNguoiDung || 'N/A'}</span></div>
          <div className="ctgh-info-row"><span>SĐT</span>
            <a href={`tel:${donHang.nguoiDung?.soDienThoai || donHang.nguoiDung?.sdt}`} className="ctgh-phone-link">
              📞 {donHang.nguoiDung?.soDienThoai || donHang.nguoiDung?.sdt || 'N/A'}
            </a>
          </div>
        </div>
      </div>

      {/* ── ĐỊA CHỈ ── */}
      <div className="ctgh-card ctgh-address-card">
        <h3>📍 Địa chỉ giao hàng</h3>
        <p className="ctgh-address-text">{donHang.diaChiGiaoHang || 'Chưa có địa chỉ'}</p>
        {donHang.latGiaoHang && donHang.lonGiaoHang && (
          <a
            href={`https://www.google.com/maps?q=${donHang.latGiaoHang},${donHang.lonGiaoHang}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ctgh-open-maps"
          >
            🗺️ Mở Google Maps
          </a>
        )}
      </div>

      {/* ── GPS INFO ── */}
      <div className="ctgh-card ctgh-gps-card">
        <h3>📍 Vị trí GPS của bạn</h3>
        {loadingLocation && <div className="ctgh-gps-loading"><div className="ctgh-spinner small"/>Đang lấy vị trí...</div>}
        {locationError && (
          <div className="ctgh-gps-error">
            ⚠️ {locationError}
            <button onClick={getCurrentLocation}>🔄 Thử lại</button>
          </div>
        )}
        {currentLocation && !loadingLocation && (
          <div className="ctgh-gps-info">
            <div className="ctgh-info-row"><span>Vĩ độ</span><span className="mono">{currentLocation.lat.toFixed(6)}</span></div>
            <div className="ctgh-info-row"><span>Kinh độ</span><span className="mono">{currentLocation.lon.toFixed(6)}</span></div>
            <div className="ctgh-info-row"><span>Độ chính xác</span><span>±{Math.round(currentLocation.accuracy)}m</span></div>
            <button onClick={getCurrentLocation} className="ctgh-btn-refresh-gps">🔄 Cập nhật vị trí</button>
          </div>
        )}
      </div>

      {/* ── CHI TIẾT ĐƠN ── */}
      <div className="ctgh-card">
        <h3>📦 Chi tiết đơn hàng</h3>
        <div className="ctgh-info-rows">
          <div className="ctgh-info-row"><span>Thời gian đặt</span><span>{formatDateTime(donHang.ngayTao)}</span></div>
          <div className="ctgh-info-row"><span>Tổng tiền hàng</span><span className="ctgh-highlight">{donHang.tongTien?.toLocaleString()}₫</span></div>
        </div>
      </div>

      {/* ── NÚT HOÀN THÀNH ── */}
      <div className="ctgh-complete-section">
        <button
          onClick={handleCompleteDelivery}
          disabled={loadingComplete}
          className="ctgh-btn-complete"
        >
          {loadingComplete ? '⏳ Đang xử lý...' : '✅ Hoàn thành giao hàng'}
        </button>
      </div>

    </div>
  );
};

export default ChiTietGiaoHang;