import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from '../../../services/axiosInstance';
import './QuanLyCuaHang.css';

// ─── Leaflet icon fix ─────────────────────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const storeIcon = new L.Icon({
  iconUrl:    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl:  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize:   [25, 41],
  iconAnchor: [12, 41],
  popupAnchor:[1, -34],
  shadowSize: [41, 41],
});

// ─── Pan map khi tọa độ thay đổi ─────────────────────────────
const MapPanner = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 16, { animate: true });
  }, [center, map]);
  return null;
};

// ─── Click trên map để chọn tọa độ ──────────────────────────
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// ─── Component chính ─────────────────────────────────────────
const QuanLyCuaHang = () => {
  const [cuaHang, setCuaHang]               = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [isEditing, setIsEditing]           = useState(false);
  const [cuaHangStatus, setCuaHangStatus]   = useState(null);

  const [formData, setFormData] = useState({
    ten: '', diaChi: '', soDienThoai: '',
    gioMoCua: '', gioDongCua: '', viDo: '', kinhDo: '',
  });

  // Map preview state
  const [showMap, setShowMap]               = useState(false);
  const [mapCenter, setMapCenter]           = useState(null);
  const [markerPos, setMarkerPos]           = useState(null);
  const [geocoding, setGeocoding]           = useState(false);
  const [geocodeError, setGeocodeError]     = useState('');
  const [showCoordinateInput, setShowCoordinateInput] = useState(false);

  const geocodeTimer = useRef(null);

  const getAuthToken = () => localStorage.getItem('jwt');

  // ── Fetch cửa hàng ──
  const fetchCuaHang = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/thong-tin-cua-hang', {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setCuaHang(data);
      setError(null);
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      else if (status === 403) setError('Bạn không có quyền truy cập thông tin này.');
      else if (status === 404) setError('Không tìm thấy thông tin cửa hàng.');
      else setError('Không thể tải thông tin cửa hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCuaHangStatus = useCallback(async () => {
    try {
      const { data } = await axios.get('/thong-tin-cua-hang/check-mo', {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      setCuaHangStatus(data);
    } catch {
      if (cuaHang?.gioMoCua && cuaHang?.gioDongCua) {
        const now = new Date();
        const cur = now.getHours() * 60 + now.getMinutes();
        const [oh, om] = cuaHang.gioMoCua.split(':').map(Number);
        const [ch, cm] = cuaHang.gioDongCua.split(':').map(Number);
        const open = oh * 60 + om, close = ch * 60 + cm;
        const isOpen = cur >= open && cur < close;
        setCuaHangStatus({
          isOpen,
          thongTin: isOpen
            ? `Đang mở cửa - Đóng cửa lúc ${cuaHang.gioDongCua}`
            : `Đã đóng cửa - Mở cửa từ ${cuaHang.gioMoCua} đến ${cuaHang.gioDongCua}`,
        });
      }
    }
  }, [cuaHang]);

  useEffect(() => { fetchCuaHang(); }, []); // eslint-disable-line
  useEffect(() => {
    if (!cuaHang) return;
    fetchCuaHangStatus();
    const id = setInterval(fetchCuaHangStatus, 60000);
    return () => clearInterval(id);
  }, [cuaHang, fetchCuaHangStatus]);

  // ── Geocode địa chỉ → tọa độ (dùng API backend /khoang-cach/dia-chi) ──
  const geocodeAddress = useCallback(async (address) => {
    if (!address?.trim() || address.trim().length < 10) return;
    setGeocoding(true);
    setGeocodeError('');
    try {
      const res = await axios.get('/khoang-cach/dia-chi', {
        params: { diaChi: address },
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        timeout: 15000,
      });
      const { lat, lng } = res.data;
      if (lat && lng) {
        setFormData(prev => ({ ...prev, viDo: String(lat), kinhDo: String(lng) }));
        setMarkerPos([lat, lng]);
        setMapCenter([lat, lng]);
        setShowMap(true);
        setGeocodeError('');
      } else {
        setGeocodeError('Không tìm thấy tọa độ. Bạn có thể nhấn trên bản đồ để chọn tay.');
        setShowMap(true);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Không tìm thấy tọa độ. Bạn có thể chọn vị trí trên bản đồ.';
      setGeocodeError(msg);
      setShowMap(true);
    } finally {
      setGeocoding(false);
    }
  }, []);

  // ── Auto-geocode khi địa chỉ thay đổi (debounce 1.5s) ──
  const handleDiaChiChange = (e) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, diaChi: val }));
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(() => geocodeAddress(val), 1500);
  };

  // ── Click trên map → cập nhật tọa độ ──
  const handleMapClick = (lat, lng) => {
    setMarkerPos([lat, lng]);
    setFormData(prev => ({
      ...prev,
      viDo: lat.toFixed(6),
      kinhDo: lng.toFixed(6),
    }));
    setGeocodeError('');
  };

  // ── Mở form edit ──
  const handleEdit = () => {
    const lat = cuaHang?.viDo;
    const lng = cuaHang?.kinhDo;
    setFormData({
      ten:         cuaHang?.ten || '',
      diaChi:      cuaHang?.diaChi || '',
      soDienThoai: cuaHang?.soDienThoai || '',
      gioMoCua:    cuaHang?.gioMoCua?.substring(0, 5) || '',
      gioDongCua:  cuaHang?.gioDongCua?.substring(0, 5) || '',
      viDo:        lat || '',
      kinhDo:      lng || '',
    });
    if (lat && lng) {
      setMarkerPos([lat, lng]);
      setMapCenter([lat, lng]);
      setShowMap(true);
    } else {
      setShowMap(false);
      setMarkerPos(null);
      setMapCenter(null);
    }
    setGeocodeError('');
    setShowCoordinateInput(false);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setShowMap(false);
    setMarkerPos(null);
    setGeocodeError('');
    setShowCoordinateInput(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ── Cập nhật marker khi nhập tọa độ tay ──
  const handleCoordChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    const lat = name === 'viDo'  ? parseFloat(value) : parseFloat(formData.viDo);
    const lng = name === 'kinhDo' ? parseFloat(value) : parseFloat(formData.kinhDo);
    if (!isNaN(lat) && !isNaN(lng)) {
      setMarkerPos([lat, lng]);
      setMapCenter([lat, lng]);
      setShowMap(true);
    }
  };

  const validateForm = () => {
    if (!formData.ten.trim())         { alert('Vui lòng nhập tên cửa hàng'); return false; }
    if (!formData.diaChi.trim())      { alert('Vui lòng nhập địa chỉ'); return false; }
    if (!formData.soDienThoai.trim()) { alert('Vui lòng nhập số điện thoại'); return false; }
    if (!formData.gioMoCua || !formData.gioDongCua) { alert('Vui lòng nhập giờ mở/đóng cửa'); return false; }
    if (isNaN(formData.soDienThoai.replace(/\s/g, ''))) { alert('Số điện thoại chỉ được chứa số'); return false; }
    if (formData.gioMoCua >= formData.gioDongCua) { alert('Giờ mở cửa phải trước giờ đóng cửa'); return false; }
    if (formData.viDo || formData.kinhDo) {
      const v = parseFloat(formData.viDo), k = parseFloat(formData.kinhDo);
      if (isNaN(v) || isNaN(k)) { alert('Vĩ độ và Kinh độ phải là số'); return false; }
      if (v < -90 || v > 90)    { alert('Vĩ độ phải từ -90 đến 90'); return false; }
      if (k < -180 || k > 180)  { alert('Kinh độ phải từ -180 đến 180'); return false; }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const dataToSend = {
        ten:         formData.ten,
        diaChi:      formData.diaChi,
        soDienThoai: formData.soDienThoai,
        gioMoCua:    formData.gioMoCua + ':00',
        gioDongCua:  formData.gioDongCua + ':00',
      };
      if (formData.viDo && formData.kinhDo) {
        dataToSend.viDo  = parseFloat(formData.viDo);
        dataToSend.kinhDo = parseFloat(formData.kinhDo);
      }
      const { data } = await axios.put('/thong-tin-cua-hang', dataToSend, {
        headers: { Authorization: `Bearer ${getAuthToken()}`, 'Content-Type': 'application/json' },
      });
      setCuaHang(data);
      alert('Cập nhật thông tin thành công!');
      setIsEditing(false);
      setShowMap(false);
      await fetchCuaHangStatus();
    } catch (err) {
      const status = err.response?.status;
      const msg    = err.response?.data;
      if (status === 401) alert('Phiên đăng nhập hết hạn.');
      else if (status === 403) alert('Bạn không có quyền cập nhật thông tin này.');
      else if (status === 400) {
        if (typeof msg === 'string' && msg.includes('Khong tim thay toa do')) {
          if (window.confirm(msg + '\n\nBạn có muốn chọn tọa độ trên bản đồ không?')) {
            setShowCoordinateInput(true);
            setShowMap(true);
          }
        } else {
          alert(msg || 'Dữ liệu không hợp lệ.');
        }
      } else {
        alert('Có lỗi xảy ra. Vui lòng thử lại.');
      }
    }
  };

  // ── Loading / Error ──
  if (loading) return (
    <div className="qlch-container">
      <div className="qlch-loading">
        <div className="qlch-spinner" />
        <span>Đang tải thông tin...</span>
      </div>
    </div>
  );

  if (error) return (
    <div className="qlch-container">
      <div className="qlch-error">
        <p>{error}</p>
        <button className="qlch-btn qlch-btn-retry" onClick={() => { setError(null); fetchCuaHang(); }}>
          🔄 Thử lại
        </button>
      </div>
    </div>
  );

  const defaultMapCenter = markerPos || [10.7769, 106.7009];

  return (
    <div className="qlch-container">
      <h2>⚙️ Quản Lý Thông Tin Cửa Hàng</h2>

      {/* Trạng thái mở/đóng */}
      {cuaHangStatus && (
        <div className={`qlch-status-card ${cuaHangStatus.isOpen ? 'open' : 'closed'}`}>
          <div className="qlch-status-indicator">
            <span className={`qlch-status-dot ${cuaHangStatus.isOpen ? 'open' : 'closed'}`} />
            <span className="qlch-status-text">
              {cuaHangStatus.isOpen ? '🟢 ĐANG MỞ CỬA' : '🔴 ĐANG ĐÓNG CỬA'}
            </span>
          </div>
          <p className="qlch-status-info">{cuaHangStatus.thongTin}</p>
        </div>
      )}

      <div className="qlch-card">
        <div className="qlch-card-header">
          <h3>📋 Thông tin cửa hàng</h3>
          {!isEditing && (
            <button className="qlch-btn qlch-btn-edit" onClick={handleEdit}>
              ✏️ Chỉnh sửa
            </button>
          )}
        </div>

        {/* ── VIEW MODE ── */}
        {!isEditing && (
          <>
            <div className="qlch-info-display">
              <InfoRow label="Tên cửa hàng"   value={cuaHang?.ten} />
              <InfoRow label="Địa chỉ"         value={cuaHang?.diaChi} />
              <InfoRow label="Số điện thoại"   value={cuaHang?.soDienThoai} />
              <InfoRow label="Giờ hoạt động"
                value={`${cuaHang?.gioMoCua?.substring(0,5)} - ${cuaHang?.gioDongCua?.substring(0,5)}`} />
              {cuaHang?.viDo && cuaHang?.kinhDo && (
                <InfoRow label="Tọa độ"
                  value={`📍 ${cuaHang.viDo.toFixed(6)}, ${cuaHang.kinhDo.toFixed(6)}`} />
              )}
            </div>

            {/* Map xem vị trí (view mode) */}
            {cuaHang?.viDo && cuaHang?.kinhDo && (
              <div className="qlch-map-preview">
                <div className="qlch-map-label">🗺️ Vị trí cửa hàng trên bản đồ</div>
                <div className="qlch-map-wrapper">
                  <MapContainer
                    center={[cuaHang.viDo, cuaHang.kinhDo]}
                    zoom={16}
                    style={{ width: '100%', height: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap'
                    />
                    <Marker position={[cuaHang.viDo, cuaHang.kinhDo]} icon={storeIcon}>
                      <Popup>
                        <strong>🏪 {cuaHang.ten}</strong><br />
                        {cuaHang.diaChi}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── EDIT MODE ── */}
        {isEditing && (
          <form onSubmit={handleSubmit} className="qlch-form">

            <div className="qlch-form-group">
              <label>Tên cửa hàng</label>
              <input name="ten" value={formData.ten} onChange={handleInputChange} required maxLength="100" />
            </div>

            <div className="qlch-form-group">
              <label>
                Địa chỉ
                {geocoding && <span className="qlch-geocoding-badge">🔍 Đang tìm tọa độ...</span>}
              </label>
              <textarea
                name="diaChi"
                value={formData.diaChi}
                onChange={handleDiaChiChange}
                rows={3}
                required
                maxLength="255"
                placeholder="Nhập địa chỉ chi tiết (số nhà, đường, phường/xã, quận/huyện, thành phố)"
              />
              <small className="qlch-hint">
                💡 Tọa độ sẽ tự động tìm sau khi bạn nhập địa chỉ. Bản đồ sẽ hiện để xác nhận vị trí.
              </small>
              {geocodeError && <p className="qlch-geocode-error">⚠️ {geocodeError}</p>}
            </div>

            <div className="qlch-form-group">
              <label>Số điện thoại</label>
              <input name="soDienThoai" value={formData.soDienThoai} onChange={handleInputChange} required maxLength="15" />
            </div>

            <div className="qlch-form-row">
              <div className="qlch-form-group">
                <label>Giờ mở cửa</label>
                <input type="time" name="gioMoCua" value={formData.gioMoCua} onChange={handleInputChange} required />
              </div>
              <div className="qlch-form-group">
                <label>Giờ đóng cửa</label>
                <input type="time" name="gioDongCua" value={formData.gioDongCua} onChange={handleInputChange} required />
              </div>
            </div>

            {/* Bản đồ xác nhận / chọn tọa độ */}
            {showMap && (
              <div className="qlch-map-edit-section">
                <div className="qlch-map-edit-header">
                  <span>🗺️ Xác nhận vị trí trên bản đồ</span>
                  <span className="qlch-map-hint">Nhấn vào bản đồ để điều chỉnh vị trí chính xác hơn</span>
                </div>
                <div className="qlch-map-wrapper">
                  <MapContainer
                    center={defaultMapCenter}
                    zoom={15}
                    style={{ width: '100%', height: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap'
                    />
                    <MapPanner center={mapCenter} />
                    <MapClickHandler onMapClick={handleMapClick} />
                    {markerPos && (
                      <Marker position={markerPos} icon={storeIcon}>
                        <Popup>📍 {formData.diaChi || 'Vị trí cửa hàng'}</Popup>
                      </Marker>
                    )}
                  </MapContainer>
                </div>
                {markerPos && (
                  <div className="qlch-coord-display">
                    <span>📍 Vĩ độ: <strong>{parseFloat(formData.viDo).toFixed(6)}</strong></span>
                    <span>Kinh độ: <strong>{parseFloat(formData.kinhDo).toFixed(6)}</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* Nút xem / ẩn map nếu chưa hiện */}
            {!showMap && (
              <button
                type="button"
                className="qlch-btn qlch-btn-show-map"
                onClick={() => { setShowMap(true); if (formData.diaChi) geocodeAddress(formData.diaChi); }}
              >
                🗺️ Xem / chọn vị trí trên bản đồ
              </button>
            )}

            {/* Nhập tọa độ thủ công */}
            <div className="qlch-form-group">
              <label className="qlch-checkbox-label">
                <input
                  type="checkbox"
                  checked={showCoordinateInput}
                  onChange={e => setShowCoordinateInput(e.target.checked)}
                />
                Nhập tọa độ thủ công
              </label>
            </div>

            {showCoordinateInput && (
              <div className="qlch-form-row">
                <div className="qlch-form-group">
                  <label>Vĩ độ (Latitude)</label>
                  <input
                    type="number" step="any" name="viDo"
                    value={formData.viDo} onChange={handleCoordChange}
                    placeholder="Ví dụ: 10.762622"
                  />
                  <small className="qlch-hint">Từ -90 đến 90</small>
                </div>
                <div className="qlch-form-group">
                  <label>Kinh độ (Longitude)</label>
                  <input
                    type="number" step="any" name="kinhDo"
                    value={formData.kinhDo} onChange={handleCoordChange}
                    placeholder="Ví dụ: 106.660172"
                  />
                  <small className="qlch-hint">Từ -180 đến 180</small>
                </div>
              </div>
            )}

            <div className="qlch-form-actions">
              <button type="submit" className="qlch-btn qlch-btn-save">💾 Lưu thay đổi</button>
              <button type="button" className="qlch-btn qlch-btn-cancel" onClick={handleCancel}>❌ Hủy</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Sub-component ────────────────────────────────────────────
const InfoRow = ({ label, value }) => (
  <div className="qlch-info-item">
    <span className="qlch-label">{label}:</span>
    <span className="qlch-value">{value}</span>
  </div>
);

export default QuanLyCuaHang;