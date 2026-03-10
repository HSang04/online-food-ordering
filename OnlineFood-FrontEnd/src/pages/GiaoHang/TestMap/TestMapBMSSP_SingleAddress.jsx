import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './TestMap.css';

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const restaurantIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
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

// Component auto fit bounds
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

const TestMapBMSSP_SingleAddress = () => {
  // State cho thông tin quán ăn
  const [restaurantInfo, setRestaurantInfo] = useState(null);
  
  // State cho địa chỉ giao hàng
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryCoords, setDeliveryCoords] = useState(null);
  
  // State cho bound (mét)
  const [boundMeters, setBoundMeters] = useState('10000');
  
  // State cho kết quả
  const [routePath, setRoutePath] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State cho so sánh với Dijkstra
  const [dijkstraRoute, setDijkstraRoute] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  
  // API endpoint
  const API_BASE_URL = 'http://localhost:8080/api';
  
  // Load thông tin quán ăn khi component mount
  useEffect(() => {
    fetchRestaurantInfo();
  }, []);
  
  const fetchRestaurantInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/thong-tin-cua-hang`);
      if (!response.ok) {
        throw new Error('Không thể lấy thông tin quán ăn');
      }
      const data = await response.json();
      
      // Lấy quán ăn đầu tiên (hoặc có thể cho user chọn nếu có nhiều quán)
      if (data && data.length > 0) {
        setRestaurantInfo(data[0]);
      } else {
        setError('Không tìm thấy thông tin quán ăn trong hệ thống');
      }
    } catch (err) {
      console.error('Lỗi khi lấy thông tin quán:', err);
      setError('Lỗi khi lấy thông tin quán ăn: ' + err.message);
    }
  };
  
  const geocodeAddress = async () => {
    if (!deliveryAddress.trim()) {
      setError('Vui lòng nhập địa chỉ giao hàng');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Gọi API geocoding từ backend
      const response = await fetch(
        `${API_BASE_URL}/geo/geocode?address=${encodeURIComponent(deliveryAddress)}`
      );
      
      if (!response.ok) {
        throw new Error('Không thể tìm tọa độ cho địa chỉ này');
      }
      
      const coords = await response.json();
      
      if (!coords || coords.length !== 2) {
        throw new Error('Địa chỉ không hợp lệ hoặc không tìm thấy');
      }
      
      setDeliveryCoords(coords);
      return coords;
      
    } catch (err) {
      console.error('Lỗi geocoding:', err);
      setError('Không thể tìm tọa độ: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  const calculateBMSSPRoute = async () => {
    if (!restaurantInfo) {
      setError('Chưa có thông tin quán ăn');
      return;
    }
    
    // Geocode địa chỉ giao hàng
    const coords = await geocodeAddress();
    if (!coords) return;
    
    const [destLat, destLon] = coords;
    const bound = parseFloat(boundMeters);
    
    if (isNaN(bound)) {
      setError('Bound không hợp lệ');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Gọi API BMSSP với tọa độ quán ăn và địa chỉ giao hàng
      const bmsspResponse = await fetch(
        `${API_BASE_URL}/delivery/route/bounded-dijkstra/shortest-path?` +
        `latStart=${restaurantInfo.viDo}&lonStart=${restaurantInfo.kinhDo}&` +
        `latEnd=${destLat}&lonEnd=${destLon}&boundMeters=${bound}`
      );
      
      if (!bmsspResponse.ok) {
        throw new Error(`HTTP error! status: ${bmsspResponse.status}`);
      }
      
      const bmsspData = await bmsspResponse.json();
      
      if (bmsspData.success && bmsspData.routePath) {
        const path = bmsspData.routePath.map(coord => [coord[0], coord[1]]);
        setRoutePath(path);
        setRouteInfo({
          distance: bmsspData.totalDistance,
          duration: bmsspData.estimatedDuration,
          summary: bmsspData.routeSummary,
          nodeCount: bmsspData.nodeCount,
          steps: bmsspData.steps || []
        });
        setError(null);
      } else {
        setError(bmsspData.message || 'Không tìm thấy đường đi với BMSSP');
        setRoutePath([]);
        setRouteInfo(null);
      }
    } catch (err) {
      console.error('Lỗi khi gọi API BMSSP:', err);
      setError('Lỗi kết nối đến server: ' + err.message);
      setRoutePath([]);
      setRouteInfo(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const compareBothAlgorithms = async () => {
    if (!restaurantInfo) {
      setError('Chưa có thông tin quán ăn');
      return;
    }
    
    // Geocode địa chỉ giao hàng
    const coords = await geocodeAddress();
    if (!coords) return;
    
    const [destLat, destLon] = coords;
    const bound = parseFloat(boundMeters);
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Gọi cả 2 API song song
      const [bmsspResponse, dijkstraResponse] = await Promise.all([
        fetch(
          `${API_BASE_URL}/delivery/route/bmssp/shortest-path?` +
          `latStart=${restaurantInfo.viDo}&lonStart=${restaurantInfo.kinhDo}&` +
          `latEnd=${destLat}&lonEnd=${destLon}&boundMeters=${bound}`
        ),
        fetch(
          `${API_BASE_URL}/delivery/route/dijkstra/shortest-path?` +
          `latStart=${restaurantInfo.viDo}&lonStart=${restaurantInfo.kinhDo}&` +
          `latEnd=${destLat}&lonEnd=${destLon}`
        )
      ]);
      
      const bmsspData = await bmsspResponse.json();
      const dijkstraData = await dijkstraResponse.json();
      
      // Set BMSSP route
      if (bmsspData.success && bmsspData.routePath) {
        const path = bmsspData.routePath.map(coord => [coord[0], coord[1]]);
        setRoutePath(path);
        setRouteInfo({
          distance: bmsspData.totalDistance,
          duration: bmsspData.estimatedDuration,
          summary: bmsspData.routeSummary,
          nodeCount: bmsspData.nodeCount,
          algorithm: 'BMSSP'
        });
      }
      
      // Set Dijkstra route
      if (dijkstraData.success && dijkstraData.routePath) {
        setDijkstraRoute({
          path: dijkstraData.routePath.map(coord => [coord[0], coord[1]]),
          distance: dijkstraData.totalDistance,
          duration: dijkstraData.estimatedDuration,
          nodeCount: dijkstraData.nodeCount,
          algorithm: 'Dijkstra'
        });
      }
      
      setShowComparison(true);
      setError(null);
    } catch (err) {
      console.error('Lỗi khi so sánh:', err);
      setError('Lỗi khi so sánh 2 thuật toán: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const clearAll = () => {
    setDeliveryAddress('');
    setDeliveryCoords(null);
    setBoundMeters('10000');
    setRoutePath([]);
    setRouteInfo(null);
    setDijkstraRoute(null);
    setShowComparison(false);
    setError(null);
  };
  
  // Tính toán positions cho map
  const allPositions = [];
  if (restaurantInfo && restaurantInfo.viDo && restaurantInfo.kinhDo) {
    allPositions.push([restaurantInfo.viDo, restaurantInfo.kinhDo]);
  }
  if (deliveryCoords) {
    allPositions.push(deliveryCoords);
  }
  
  return (
    <div className="test-map-container">
      <div className="test-map-header">
        <h1>🍽️ Tìm đường giao hàng - BMSSP Route Finder</h1>
        <p>Từ quán ăn đến địa chỉ khách hàng</p>
      </div>
      
      {/* Restaurant Info */}
      {restaurantInfo && (
        <div className="route-info-box" style={{background: '#fff7ed'}}>
          <h3>🏪 Thông tin quán ăn (Điểm xuất phát)</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Tên quán:</span>
              <span className="info-value">{restaurantInfo.ten}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Địa chỉ:</span>
              <span className="info-value">{restaurantInfo.diaChi}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Tọa độ:</span>
              <span className="info-value">
                {restaurantInfo.viDo?.toFixed(6)}, {restaurantInfo.kinhDo?.toFixed(6)}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Trạng thái:</span>
              <span className="info-value" style={{color: restaurantInfo.isOpen ? '#16a34a' : '#dc2626'}}>
                {restaurantInfo.thongTin}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Input Panel */}
      <div className="input-panel">
        <div className="input-section">
          <h3>📍 Địa chỉ giao hàng (Điểm đến)</h3>
          <div className="input-group">
            <label>Nhập địa chỉ đầy đủ:</label>
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Ví dụ: 123 Nguyễn Huệ, Quận 1, TP.HCM"
              className="coord-input"
              style={{width: '100%'}}
            />
            <small style={{color: '#666', fontSize: '12px'}}>
              Nhập địa chỉ chi tiết (đường, quận/huyện, thành phố)
            </small>
          </div>
          
          {deliveryCoords && (
            <div style={{marginTop: '10px', padding: '10px', background: '#f0fdf4', borderRadius: '5px'}}>
              <strong>✅ Đã tìm thấy tọa độ:</strong>
              <div>Latitude: {deliveryCoords[0]?.toFixed(6)}</div>
              <div>Longitude: {deliveryCoords[1]?.toFixed(6)}</div>
            </div>
          )}
        </div>
        
        <div className="input-section">
          <h3>⚙️ Tham số BMSSP</h3>
          <div className="input-group">
            <label>Bound (meters):</label>
            <input
              type="text"
              value={boundMeters}
              onChange={(e) => setBoundMeters(e.target.value)}
              placeholder="Ví dụ: 10000"
              className="coord-input"
            />
            <small style={{color: '#666', fontSize: '12px'}}>
              Giới hạn tìm kiếm (càng lớn càng chậm nhưng có thể tìm được đường xa hơn)
            </small>
          </div>
        </div>
        
        <div className="button-group">
          <button
            onClick={calculateBMSSPRoute}
            disabled={isLoading}
            className="btn-calculate"
          >
            {isLoading ? '⏳ Đang tính BMSSP...' : '🚀 Tìm đường (BMSSP)'}
          </button>
          
          <button
            onClick={compareBothAlgorithms}
            disabled={isLoading}
            className="btn-calculate"
            style={{background: '#8b5cf6'}}
          >
            {isLoading ? '⏳ Đang so sánh...' : '⚔️ So sánh BMSSP vs Dijkstra'}
          </button>
          
          <button onClick={clearAll} className="btn-clear">
            🗑️ Xóa tất cả
          </button>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}
      
      {/* Route Info */}
      {routeInfo && (
        <div className="route-info-box">
          <h3>📊 Kết quả {routeInfo.algorithm || 'BMSSP'}</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Khoảng cách:</span>
              <span className="info-value">{routeInfo.distance?.toFixed(2)} km</span>
            </div>
            <div className="info-item">
              <span className="info-label">Thời gian:</span>
              <span className="info-value">~{Math.ceil(routeInfo.duration)} phút</span>
            </div>
            <div className="info-item">
              <span className="info-label">Số điểm:</span>
              <span className="info-value">{routeInfo.nodeCount}</span>
            </div>
            <div className="info-item full-width">
              <span className="info-label">Mô tả:</span>
              <span className="info-value">{routeInfo.summary}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Comparison Table */}
      {showComparison && routeInfo && dijkstraRoute && (
        <div className="route-info-box" style={{background: '#f0f9ff'}}>
          <h3>⚔️ So sánh BMSSP vs Dijkstra</h3>
          <table style={{width: '100%', borderCollapse: 'collapse', marginTop: '10px'}}>
            <thead>
              <tr style={{background: '#e0f2fe'}}>
                <th style={{padding: '10px', textAlign: 'left', border: '1px solid #ccc'}}>Thuật toán</th>
                <th style={{padding: '10px', textAlign: 'right', border: '1px solid #ccc'}}>Khoảng cách</th>
                <th style={{padding: '10px', textAlign: 'right', border: '1px solid #ccc'}}>Thời gian</th>
                <th style={{padding: '10px', textAlign: 'right', border: '1px solid #ccc'}}>Số điểm</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{padding: '10px', border: '1px solid #ccc'}}>
                  <strong style={{color: '#8b5cf6'}}>BMSSP</strong>
                </td>
                <td style={{padding: '10px', textAlign: 'right', border: '1px solid #ccc'}}>
                  {routeInfo.distance?.toFixed(2)} km
                </td>
                <td style={{padding: '10px', textAlign: 'right', border: '1px solid #ccc'}}>
                  {Math.ceil(routeInfo.duration)} phút
                </td>
                <td style={{padding: '10px', textAlign: 'right', border: '1px solid #ccc'}}>
                  {routeInfo.nodeCount}
                </td>
              </tr>
              <tr>
                <td style={{padding: '10px', border: '1px solid #ccc'}}>
                  <strong style={{color: '#2563eb'}}>Dijkstra</strong>
                </td>
                <td style={{padding: '10px', textAlign: 'right', border: '1px solid #ccc'}}>
                  {dijkstraRoute.distance?.toFixed(2)} km
                </td>
                <td style={{padding: '10px', textAlign: 'right', border: '1px solid #ccc'}}>
                  {Math.ceil(dijkstraRoute.duration)} phút
                </td>
                <td style={{padding: '10px', textAlign: 'right', border: '1px solid #ccc'}}>
                  {dijkstraRoute.nodeCount}
                </td>
              </tr>
              <tr style={{background: '#fef3c7'}}>
                <td style={{padding: '10px', border: '1px solid #ccc'}}>
                  <strong>Chênh lệch</strong>
                </td>
                <td style={{padding: '10px', textAlign: 'right', border: '1px solid #ccc'}}>
                  {Math.abs(routeInfo.distance - dijkstraRoute.distance).toFixed(2)} km
                </td>
                <td style={{padding: '10px', textAlign: 'right', border: '1px solid #ccc'}}>
                  {Math.abs(Math.ceil(routeInfo.duration) - Math.ceil(dijkstraRoute.duration))} phút
                </td>
                <td style={{padding: '10px', textAlign: 'right', border: '1px solid #ccc'}}>
                  {Math.abs(routeInfo.nodeCount - dijkstraRoute.nodeCount)} điểm
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
      
      {/* Map */}
      <div className="map-wrapper">
        {isLoading && (
          <div className="map-loading-overlay">
            <div className="loading-spinner"></div>
            <div>Đang tính toán đường đi...</div>
          </div>
        )}
        
        <MapContainer
          center={restaurantInfo ? [restaurantInfo.viDo, restaurantInfo.kinhDo] : [10.7769, 106.7009]}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          
          {allPositions.length > 0 && <AutoFitBounds positions={allPositions} />}
          
          {/* Marker quán ăn */}
          {restaurantInfo && restaurantInfo.viDo && restaurantInfo.kinhDo && (
            <Marker 
              position={[restaurantInfo.viDo, restaurantInfo.kinhDo]} 
              icon={restaurantIcon}
            >
              <Popup>
                <div className="map-popup">
                  <strong>🏪 {restaurantInfo.ten}</strong>
                  <div>{restaurantInfo.diaChi}</div>
                  <div>Lat: {restaurantInfo.viDo?.toFixed(6)}</div>
                  <div>Lon: {restaurantInfo.kinhDo?.toFixed(6)}</div>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Marker địa chỉ giao hàng */}
          {deliveryCoords && (
            <Marker 
              position={deliveryCoords} 
              icon={deliveryIcon}
            >
              <Popup>
                <div className="map-popup">
                  <strong>📍 Địa chỉ giao hàng</strong>
                  <div>{deliveryAddress}</div>
                  <div>Lat: {deliveryCoords[0]?.toFixed(6)}</div>
                  <div>Lon: {deliveryCoords[1]?.toFixed(6)}</div>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Vẽ đường BMSSP (màu tím) */}
          {routePath.length > 0 && (
            <Polyline
              positions={routePath}
              color="#8b5cf6"
              weight={4}
              opacity={0.7}
            />
          )}
          
          {/* Vẽ đường Dijkstra (màu xanh, nét đứt) nếu có so sánh */}
          {showComparison && dijkstraRoute && dijkstraRoute.path.length > 0 && (
            <Polyline
              positions={dijkstraRoute.path}
              color="#2563eb"
              weight={3}
              opacity={0.5}
              dashArray="10, 10"
            />
          )}
        </MapContainer>
      </div>
      
      {/* Legend khi có so sánh */}
      {showComparison && (
        <div className="route-info-box">
          <h4>🎨 Chú thích:</h4>
          <div style={{display: 'flex', gap: '20px', marginTop: '10px'}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <div style={{width: '30px', height: '4px', background: '#8b5cf6'}}></div>
              <span>BMSSP (tím)</span>
            </div>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
              <div style={{width: '30px', height: '4px', background: '#2563eb', opacity: 0.5, borderTop: '2px dashed #2563eb'}}></div>
              <span>Dijkstra (xanh nét đứt)</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Example addresses */}
      <div className="example-box">
        <h4>💡 Địa chỉ mẫu để thử:</h4>
        <div className="example-list">
          <div className="example-item">
            <strong>Địa chỉ 1:</strong>
            <span>Nhà Thờ Đức Bà, Quận 1, TP.HCM</span>
          </div>
          <div className="example-item">
            <strong>Địa chỉ 2:</strong>
            <span>Bưu điện Thành phố, Quận 1, TP.HCM</span>
          </div>
          <div className="example-item">
            <strong>Địa chỉ 3:</strong>
            <span>Bến Thành Market, Quận 1, TP.HCM</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestMapBMSSP_SingleAddress;