import React, { useState, useEffect, useRef } from 'react';
import axios from '../../../services/axiosInstance';
import './ShipperLocation.css';

const ShipperLocationUpdater = ({ donHangId, onLocationUpdate }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [status, setStatus] = useState('PICKING_UP');
  const [error, setError] = useState(null);
  const [batteryLevel, setBatteryLevel] = useState(100);
  
  const watchIdRef = useRef(null);
  const updateIntervalRef = useRef(null);

  // Lấy thông tin pin (nếu trình duyệt hỗ trợ)
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        setBatteryLevel(battery.level * 100);
        
        battery.addEventListener('levelchange', () => {
          setBatteryLevel(battery.level * 100);
        });
      });
    }
  }, []);

  // Cập nhật vị trí lên server
  const updateLocationToServer = async (position) => {
    try {
      const locationData = {
        donHangId: donHangId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        speed: position.coords.speed ? position.coords.speed * 3.6 : 0, // m/s to km/h
        heading: position.coords.heading || null,
        status: status,
        accuracy: position.coords.accuracy,
        batteryLevel: batteryLevel
      };

      const response = await axios.post('/delivery/tracking/update-location', locationData);
      
      if (response.data) {
        setCurrentLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: new Date()
        });
        
        if (onLocationUpdate) {
          onLocationUpdate(response.data);
        }
        
        setError(null);
      }
    } catch (err) {
      console.error('Lỗi cập nhật vị trí:', err);
      setError('Không thể cập nhật vị trí');
    }
  };

  // Bắt đầu theo dõi vị trí
  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị GPS');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    // Watch position real-time
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        updateLocationToServer(position);
      },
      (err) => {
        console.error('Lỗi GPS:', err);
        setError(`Lỗi GPS: ${err.message}`);
      },
      options
    );

    setIsTracking(true);
    setError(null);
  };

  // Dừng theo dõi
  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
    
    setIsTracking(false);
  };

  // Cleanup
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  return (
    <div className="shipper-location-updater">
      <div className="updater-header">
        <h3>📍 Cập nhật vị trí giao hàng</h3>
        <div className="battery-indicator">
          🔋 {Math.round(batteryLevel)}%
        </div>
      </div>

      <div className="status-selector">
        <label>Trạng thái hiện tại:</label>
        <select 
          value={status} 
          onChange={(e) => setStatus(e.target.value)}
          className="status-select"
        >
          <option value="WAITING">Đang chờ</option>
          <option value="PICKING_UP">Đang đến lấy hàng</option>
          <option value="PICKED_UP">Đã lấy hàng</option>
          <option value="DELIVERING">Đang giao hàng</option>
          <option value="NEAR_CUSTOMER">Gần đến khách</option>
          <option value="DELIVERED">Đã giao thành công</option>
          <option value="FAILED">Giao thất bại</option>
          <option value="RETURNING">Đang quay về</option>
        </select>
      </div>

      {currentLocation && (
        <div className="current-location-info">
          <div className="location-item">
            <span className="label">Vĩ độ:</span>
            <span className="value">{currentLocation.lat.toFixed(6)}</span>
          </div>
          <div className="location-item">
            <span className="label">Kinh độ:</span>
            <span className="value">{currentLocation.lng.toFixed(6)}</span>
          </div>
          <div className="location-item">
            <span className="label">Cập nhật lúc:</span>
            <span className="value">
              {currentLocation.timestamp.toLocaleTimeString('vi-VN')}
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <div className="tracking-controls">
        {!isTracking ? (
          <button 
            onClick={startTracking}
            className="btn-start-tracking"
          >
            ▶️ Bắt đầu theo dõi
          </button>
        ) : (
          <button 
            onClick={stopTracking}
            className="btn-stop-tracking"
          >
            ⏸️ Tạm dừng
          </button>
        )}
      </div>

      {isTracking && (
        <div className="tracking-status">
          <div className="status-indicator active"></div>
          <span>Đang theo dõi vị trí...</span>
        </div>
      )}
    </div>
  );
};

export default ShipperLocationUpdater;