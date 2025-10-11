import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from '../../../services/axiosInstance';
import './DeliveryMap.css';

// Fix Leaflet default icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons
const storeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const deliveryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component tự động fit bounds
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

// Component xử lý click map
const MapClickHandler = ({ onMapClick }) => {
  const map = useMap();

  useEffect(() => {
    const handleClick = (e) => {
      if (onMapClick) {
        onMapClick(e.latlng);
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick]);

  return null;
};

const DeliveryMap = ({ 
  mode = 'select', // 'select' | 'tracking' | 'view'
  donHangId = null,
  onLocationSelect = null,
  initialDeliveryLocation = null
}) => {
  const [storeLocation] = useState({ lat: 10.7769, lng: 106.7009 });
  const [deliveryLocation, setDeliveryLocation] = useState(initialDeliveryLocation);
  const [shipperLocation, setShipperLocation] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchAddress, setSearchAddress] = useState('');
  const [trackingInfo, setTrackingInfo] = useState(null);
  
  const trackingIntervalRef = useRef(null);

  // Lấy vị trí hiện tại GPS
  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setDeliveryLocation(location);
          if (onLocationSelect) {
            onLocationSelect(location);
          }
          setIsLoading(false);
        },
        (error) => {
          console.error('Lỗi lấy vị trí:', error);
          alert('Không thể lấy vị trí hiện tại. Vui lòng cho phép truy cập vị trí.');
          setIsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('Trình duyệt không hỗ trợ định vị GPS');
    }
  }, [onLocationSelect]);

  // Tìm kiếm địa chỉ
  const searchAddressLocation = useCallback(async () => {
    if (!searchAddress.trim()) {
      alert('Vui lòng nhập địa chỉ');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}, Ho Chi Minh City, Vietnam&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const location = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
        setDeliveryLocation(location);
        if (onLocationSelect) {
          onLocationSelect(location);
        }
      } else {
        alert('Không tìm thấy địa chỉ. Vui lòng thử với địa chỉ chi tiết hơn.');
      }
    } catch (error) {
      console.error('Lỗi tìm kiếm địa chỉ:', error);
      alert('Có lỗi khi tìm kiếm địa chỉ');
    } finally {
      setIsLoading(false);
    }
  }, [searchAddress, onLocationSelect]);

  // Click chọn vị trí trên map
  const handleMapClick = useCallback((latlng) => {
    if (mode === 'select') {
      setDeliveryLocation(latlng);
      if (onLocationSelect) {
        onLocationSelect(latlng);
      }
    }
  }, [mode, onLocationSelect]);

  // Tính đường đi bằng Dijkstra
  const calculateRoute = useCallback(async () => {
    if (!deliveryLocation) return;

    setIsLoading(true);
    try {
      const response = await axios.get('/delivery/route/store-to-customer', {
        params: {
          customerLat: deliveryLocation.lat,
          customerLon: deliveryLocation.lng
        }
      });

      if (response.data && response.data.success) {
        const path = response.data.routePath.map(coord => [coord[0], coord[1]]);
        setRoutePath(path);
        setRouteInfo({
          distance: response.data.totalDistance,
          duration: response.data.estimatedDuration,
          summary: response.data.routeSummary,
          steps: response.data.steps
        });
      }
    } catch (error) {
      console.error('Lỗi tính đường đi:', error);
      // Fallback: vẽ đường thẳng
      setRoutePath([
        [storeLocation.lat, storeLocation.lng],
        [deliveryLocation.lat, deliveryLocation.lng]
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [deliveryLocation, storeLocation]);

  // Theo dõi vị trí shipper real-time
  const startTracking = useCallback(async () => {
    if (!donHangId) return;

    const fetchShipperLocation = async () => {
      try {
        const response = await axios.get(`/delivery/tracking/current/${donHangId}`);
        if (response.data && response.data.latitude && response.data.longitude) {
          setShipperLocation({
            lat: response.data.latitude,
            lng: response.data.longitude
          });
          setTrackingInfo(response.data);
        }
      } catch (error) {
        console.error('Lỗi lấy vị trí shipper:', error);
      }
    };

    // Fetch ngay lập tức
    await fetchShipperLocation();

    // Sau đó fetch mỗi 5 giây
    trackingIntervalRef.current = setInterval(fetchShipperLocation, 5000);
  }, [donHangId]);

  const stopTracking = useCallback(() => {
    if (trackingIntervalRef.current) {
      clearInterval(trackingIntervalRef.current);
      trackingIntervalRef.current = null;
    }
  }, []);

  // Auto calculate route khi có delivery location
  useEffect(() => {
    if (deliveryLocation && (mode === 'select' || mode === 'view')) {
      calculateRoute();
    }
  }, [deliveryLocation, mode, calculateRoute]);

  // Start/stop tracking
  useEffect(() => {
    if (mode === 'tracking' && donHangId) {
      startTracking();
    }

    return () => {
      stopTracking();
    };
  }, [mode, donHangId, startTracking, stopTracking]);

  // Tính toán positions cho auto fit bounds
  const allPositions = [];
  if (storeLocation) allPositions.push([storeLocation.lat, storeLocation.lng]);
  if (deliveryLocation) allPositions.push([deliveryLocation.lat, deliveryLocation.lng]);
  if (shipperLocation) allPositions.push([shipperLocation.lat, shipperLocation.lng]);

  return (
    <div className="delivery-map-container">
      {/* Control Panel */}
      {mode === 'select' && (
        <div className="map-control-panel">
          <h3>📍 Chọn địa chỉ giao hàng</h3>
          
          <div className="control-group">
            <button 
              onClick={getCurrentLocation}
              disabled={isLoading}
              className="btn-gps"
            >
              📡 Lấy vị trí hiện tại
            </button>
          </div>

          <div className="control-group">
            <div className="search-box">
              <input
                type="text"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchAddressLocation()}
                placeholder="Nhập địa chỉ để tìm kiếm..."
                className="search-input"
              />
              <button 
                onClick={searchAddressLocation}
                disabled={isLoading}
                className="btn-search"
              >
                🔍 Tìm
              </button>
            </div>
          </div>

          <div className="hint-text">
            💡 Hoặc click trực tiếp trên bản đồ để chọn vị trí
          </div>

          {routeInfo && (
            <div className="route-info-panel">
              <h4>📋 Thông tin đường đi</h4>
              <div className="info-item">
                <span>Khoảng cách:</span>
                <strong>{routeInfo.distance?.toFixed(2)} km</strong>
              </div>
              <div className="info-item">
                <span>Thời gian dự kiến:</span>
                <strong>~{Math.ceil(routeInfo.duration)} phút</strong>
              </div>
            </div>
          )}
        </div>
      )}

      {mode === 'tracking' && trackingInfo && (
        <div className="tracking-info-panel">
          <h3>🚴 Theo dõi giao hàng</h3>
          <div className="tracking-status">
            <div className="status-badge">{trackingInfo.statusMessage}</div>
          </div>
          {trackingInfo.distanceToCustomer && (
            <div className="info-item">
              <span>Khoảng cách còn lại:</span>
              <strong>{trackingInfo.distanceToCustomer.toFixed(2)} km</strong>
            </div>
          )}
          {trackingInfo.estimatedArrivalTime && (
            <div className="info-item">
              <span>Thời gian đến dự kiến:</span>
              <strong>~{Math.ceil(trackingInfo.estimatedArrivalTime)} phút</strong>
            </div>
          )}
          {trackingInfo.speed && (
            <div className="info-item">
              <span>Tốc độ:</span>
              <strong>{trackingInfo.speed.toFixed(1)} km/h</strong>
            </div>
          )}
        </div>
      )}

      {/* Map */}
      <div className="map-wrapper">
        {isLoading && (
          <div className="map-loading-overlay">
            <div className="loading-spinner"></div>
            <div>Đang xử lý...</div>
          </div>
        )}

        <MapContainer
          center={[storeLocation.lat, storeLocation.lng]}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {mode === 'select' && <MapClickHandler onMapClick={handleMapClick} />}
          {allPositions.length > 0 && <AutoFitBounds positions={allPositions} />}

          {/* Marker cửa hàng */}
          <Marker position={[storeLocation.lat, storeLocation.lng]} icon={storeIcon}>
            <Popup>
              <div className="map-popup">
                <strong>🏪 Cửa hàng</strong>
                <div>Online Food Store</div>
              </div>
            </Popup>
          </Marker>

          {/* Marker địa chỉ giao hàng */}
          {deliveryLocation && (
            <Marker position={[deliveryLocation.lat, deliveryLocation.lng]} icon={customerIcon}>
              <Popup>
                <div className="map-popup">
                  <strong>📍 Địa chỉ giao hàng</strong>
                  {routeInfo && (
                    <>
                      <div>Khoảng cách: {routeInfo.distance?.toFixed(2)} km</div>
                      <div>Thời gian: ~{Math.ceil(routeInfo.duration)} phút</div>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          )}

          {/* Marker shipper */}
          {shipperLocation && (
            <Marker position={[shipperLocation.lat, shipperLocation.lng]} icon={deliveryIcon}>
              <Popup>
                <div className="map-popup">
                  <strong>🚴 Shipper</strong>
                  <div>{trackingInfo?.statusMessage}</div>
                  {trackingInfo?.speed && (
                    <div>Tốc độ: {trackingInfo.speed.toFixed(1)} km/h</div>
                  )}
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
              dashArray={mode === 'tracking' ? '10, 10' : null}
            />
          )}

          {/* Vẽ đường từ shipper đến khách (nếu đang tracking) */}
          {shipperLocation && deliveryLocation && mode === 'tracking' && (
            <Polyline 
              positions={[
                [shipperLocation.lat, shipperLocation.lng],
                [deliveryLocation.lat, deliveryLocation.lng]
              ]} 
              color="#ef4444" 
              weight={3}
              opacity={0.5}
              dashArray="5, 10"
            />
          )}
        </MapContainer>
      </div>

      {/* Route Steps */}
      {routeInfo?.steps && routeInfo.steps.length > 0 && mode === 'select' && (
        <div className="route-steps-panel">
          <h4>🗺️ Hướng dẫn đường đi</h4>
          <div className="steps-list">
            {routeInfo.steps.map((step, index) => (
              <div key={index} className="step-item">
                <div className="step-number">{index + 1}</div>
                <div className="step-content">
                  <div className="step-instruction">{step.instruction}</div>
                  <div className="step-details">
                    {step.distance?.toFixed(1)} km • ~{Math.ceil(step.duration)} phút
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryMap;