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
const startIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = new L.Icon({
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

const TestMap = () => {
  // State cho tọa độ điểm bắt đầu
  const [startLat, setStartLat] = useState('');
  const [startLon, setStartLon] = useState('');
  
  // State cho tọa độ điểm kết thúc
  const [endLat, setEndLat] = useState('');
  const [endLon, setEndLon] = useState('');
  
  // State cho kết quả
  const [routePath, setRoutePath] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // API endpoint - thay đổi URL này theo backend của bạn
  const API_BASE_URL = 'http://localhost:8080/api';

  const calculateRoute = async () => {
    // Validate input
    if (!startLat || !startLon || !endLat || !endLon) {
      setError('Vui lòng nhập đầy đủ tọa độ');
      return;
    }

    const latStart = parseFloat(startLat);
    const lonStart = parseFloat(startLon);
    const latEnd = parseFloat(endLat);
    const lonEnd = parseFloat(endLon);

    if (isNaN(latStart) || isNaN(lonStart) || isNaN(latEnd) || isNaN(lonEnd)) {
      setError('Tọa độ không hợp lệ. Vui lòng nhập số');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/delivery/route/shortest-path?` + 
        `latStart=${latStart}&lonStart=${lonStart}&latEnd=${latEnd}&lonEnd=${lonEnd}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.routePath) {
        // Convert coordinates to Leaflet format
        const path = data.routePath.map(coord => [coord[0], coord[1]]);
        setRoutePath(path);
        setRouteInfo({
          distance: data.totalDistance,
          summary: data.routeSummary,
          nodeCount: data.nodeCount,
          steps: data.steps || []
        });
        setError(null);
      } else {
        setError(data.message || 'Không tìm thấy đường đi');
        setRoutePath([]);
        setRouteInfo(null);
      }
    } catch (err) {
      console.error('Lỗi khi gọi API:', err);
      setError('Lỗi kết nối đến server: ' + err.message);
      setRoutePath([]);
      setRouteInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAll = () => {
    setStartLat('');
    setStartLon('');
    setEndLat('');
    setEndLon('');
    setRoutePath([]);
    setRouteInfo(null);
    setError(null);
  };

  // Tính toán positions cho map
  const allPositions = [];
  if (startLat && startLon) {
    const lat = parseFloat(startLat);
    const lon = parseFloat(startLon);
    if (!isNaN(lat) && !isNaN(lon)) {
      allPositions.push([lat, lon]);
    }
  }
  if (endLat && endLon) {
    const lat = parseFloat(endLat);
    const lon = parseFloat(endLon);
    if (!isNaN(lat) && !isNaN(lon)) {
      allPositions.push([lat, lon]);
    }
  }

  return (
    <div className="test-map-container">
      <div className="test-map-header">
        <h1>🧪 Test Dijkstra Route Finder</h1>
        <p>Nhập tọa độ 2 điểm để tìm đường đi ngắn nhất bằng thuật toán Dijkstra</p>
      </div>

      {/* Input Panel */}
      <div className="input-panel">
        <div className="input-section">
          <h3>🟢 Điểm bắt đầu (Start Point)</h3>
          <div className="coordinate-inputs">
            <div className="input-group">
              <label>Latitude:</label>
              <input
                type="text"
                value={startLat}
                onChange={(e) => setStartLat(e.target.value)}
                placeholder="Ví dụ: 10.7726"
                className="coord-input"
              />
            </div>
            <div className="input-group">
              <label>Longitude:</label>
              <input
                type="text"
                value={startLon}
                onChange={(e) => setStartLon(e.target.value)}
                placeholder="Ví dụ: 106.6980"
                className="coord-input"
              />
            </div>
          </div>
        </div>

        <div className="input-section">
          <h3>🔴 Điểm kết thúc (End Point)</h3>
          <div className="coordinate-inputs">
            <div className="input-group">
              <label>Latitude:</label>
              <input
                type="text"
                value={endLat}
                onChange={(e) => setEndLat(e.target.value)}
                placeholder="Ví dụ: 10.7797"
                className="coord-input"
              />
            </div>
            <div className="input-group">
              <label>Longitude:</label>
              <input
                type="text"
                value={endLon}
                onChange={(e) => setEndLon(e.target.value)}
                placeholder="Ví dụ: 106.6990"
                className="coord-input"
              />
            </div>
          </div>
        </div>

        <div className="button-group">
          <button 
            onClick={calculateRoute} 
            disabled={isLoading}
            className="btn-calculate"
          >
            {isLoading ? '⏳ Đang tính...' : '🚀 Tìm đường đi'}
          </button>
          <button 
            onClick={clearAll}
            className="btn-clear"
          >
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
          <h3>📊 Kết quả Dijkstra</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Khoảng cách:</span>
              <span className="info-value">{routeInfo.distance.toFixed(2)} km</span>
            </div>
            <div className="info-item">
              <span className="info-label">Số điểm (nodes):</span>
              <span className="info-value">{routeInfo.nodeCount}</span>
            </div>
            <div className="info-item full-width">
              <span className="info-label">Mô tả:</span>
              <span className="info-value">{routeInfo.summary}</span>
            </div>
          </div>
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
          center={[10.7769, 106.7009]}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {allPositions.length > 0 && <AutoFitBounds positions={allPositions} />}

          {/* Marker điểm bắt đầu */}
          {startLat && startLon && !isNaN(parseFloat(startLat)) && !isNaN(parseFloat(startLon)) && (
            <Marker position={[parseFloat(startLat), parseFloat(startLon)]} icon={startIcon}>
              <Popup>
                <div className="map-popup">
                  <strong>🟢 Điểm bắt đầu</strong>
                  <div>Lat: {startLat}</div>
                  <div>Lon: {startLon}</div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Marker điểm kết thúc */}
          {endLat && endLon && !isNaN(parseFloat(endLat)) && !isNaN(parseFloat(endLon)) && (
            <Marker position={[parseFloat(endLat), parseFloat(endLon)]} icon={endIcon}>
              <Popup>
                <div className="map-popup">
                  <strong>🔴 Điểm kết thúc</strong>
                  <div>Lat: {endLat}</div>
                  <div>Lon: {endLon}</div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Vẽ đường đi */}
          {routePath.length > 0 && (
            <Polyline 
              positions={routePath} 
              color="#2563eb" 
              weight={4}
              opacity={0.7}
            />
          )}
        </MapContainer>
      </div>

      {/* Example coordinates */}
      <div className="example-box">
        <h4>💡 Tọa độ mẫu (TP.HCM):</h4>
        <div className="example-list">
          <div className="example-item">
            <strong>Bến Thành → Nhà Thờ Đức Bà:</strong>
            <span>Start: 10.7726, 106.6980 | End: 10.7797, 106.6990</span>
          </div>
          <div className="example-item">
            <strong>Quận 1 → Quận 3:</strong>
            <span>Start: 10.7769, 106.7009 | End: 10.7863, 106.6839</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestMap;