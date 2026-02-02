import React, { useState, useEffect } from 'react';
import axios from '../../../services/axiosInstance';
import './QuanLyCuaHang.css';

const QuanLyCuaHang = () => {
  const [cuaHang, setCuaHang] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    ten: '',
    diaChi: '',
    soDienThoai: '',
    gioMoCua: '',
    gioDongCua: '',
    viDo: '',
    kinhDo: ''
  });
  const [cuaHangStatus, setCuaHangStatus] = useState(null);
  const [showCoordinateInput, setShowCoordinateInput] = useState(false);
 
  const getAuthToken = () => {
    return localStorage.getItem('jwt');
  };

  const fetchCuaHang = async () => {
    try {
      setLoading(true);
      const jwt = getAuthToken();
      
      const response = await axios.get('/thong-tin-cua-hang', {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      
      setCuaHang(response.data);
      setError(null);
      
    } catch (err) {
      console.error('Lỗi khi tải thông tin cửa hàng:', err);
      
      if (err.response?.status === 401) {
        setError('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else if (err.response?.status === 403) {
        setError('Bạn không có quyền truy cập thông tin này.');
      } else if (err.response?.status === 404) {
        setError('Không tìm thấy thông tin cửa hàng.');
      } else {
        setError('Không thể tải thông tin cửa hàng. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCuaHangStatus = async () => {
    try {
      const jwt = getAuthToken();
      
      const response = await axios.get('/thong-tin-cua-hang/check-mo', {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      
      setCuaHangStatus(response.data);
      
    } catch (err) {
      console.error('Lỗi khi kiểm tra trạng thái:', err);
      
      if (cuaHang?.gioMoCua && cuaHang?.gioDongCua) {
        const currentTime = new Date();
        const currentHour = currentTime.getHours();
        const currentMinute = currentTime.getMinutes();
        const currentTimeMinutes = currentHour * 60 + currentMinute;
        
        const [openHour, openMinute] = cuaHang.gioMoCua.split(':').map(Number);
        const [closeHour, closeMinute] = cuaHang.gioDongCua.split(':').map(Number);
        const openTimeMinutes = openHour * 60 + openMinute;
        const closeTimeMinutes = closeHour * 60 + closeMinute;
        
        const isOpen = currentTimeMinutes >= openTimeMinutes && currentTimeMinutes < closeTimeMinutes;

        setCuaHangStatus({
          isOpen: isOpen, 
          thongTin: isOpen ? 
              `Đang mở cửa - Đóng cửa lúc ${cuaHang.gioDongCua}` : 
              `Đã đóng cửa - Mở cửa từ ${cuaHang.gioMoCua} đến ${cuaHang.gioDongCua}`,
          gioMoCua: cuaHang.gioMoCua,
          gioDongCua: cuaHang.gioDongCua
        });
      }
    }
  };

  useEffect(() => {
    fetchCuaHang();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (cuaHang) {
      fetchCuaHangStatus();
      
      const interval = setInterval(fetchCuaHangStatus, 60000);
      return () => clearInterval(interval);
    }
  }, [cuaHang]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEdit = () => {
    setFormData({
      ten: cuaHang.ten || '',
      diaChi: cuaHang.diaChi || '',
      soDienThoai: cuaHang.soDienThoai || '',
      gioMoCua: cuaHang.gioMoCua?.substring(0, 5) || '',
      gioDongCua: cuaHang.gioDongCua?.substring(0, 5) || '',
      viDo: cuaHang.viDo || '',
      kinhDo: cuaHang.kinhDo || ''
    });
    setIsEditing(true);
    setShowCoordinateInput(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setShowCoordinateInput(false);
    setFormData({
      ten: '',
      diaChi: '',
      soDienThoai: '',
      gioMoCua: '',
      gioDongCua: '',
      viDo: '',
      kinhDo: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.ten.trim()) {
      alert('Vui lòng nhập tên cửa hàng');
      return false;
    }
    if (!formData.diaChi.trim()) {
      alert('Vui lòng nhập địa chỉ');
      return false;
    }
    if (!formData.soDienThoai.trim()) {
      alert('Vui lòng nhập số điện thoại');
      return false;
    }
    if (!formData.gioMoCua || !formData.gioDongCua) {
      alert('Vui lòng nhập đầy đủ giờ mở cửa và đóng cửa');
      return false;
    }
    
    if (isNaN(formData.soDienThoai.replace(/\s/g, ''))) {
      alert('Số điện thoại chỉ được chứa số');
      return false;
    }
    
    if (formData.gioMoCua >= formData.gioDongCua) {
      alert('Giờ mở cửa phải trước giờ đóng cửa');
      return false;
    }

    // Validate tọa độ nếu đang nhập
    if (showCoordinateInput) {
      if (!formData.viDo || !formData.kinhDo) {
        alert('Vui lòng nhập đầy đủ Vĩ độ và Kinh độ');
        return false;
      }
      const viDo = parseFloat(formData.viDo);
      const kinhDo = parseFloat(formData.kinhDo);
      
      if (isNaN(viDo) || isNaN(kinhDo)) {
        alert('Vĩ độ và Kinh độ phải là số');
        return false;
      }
      
      if (viDo < -90 || viDo > 90) {
        alert('Vĩ độ phải từ -90 đến 90');
        return false;
      }
      
      if (kinhDo < -180 || kinhDo > 180) {
        alert('Kinh độ phải từ -180 đến 180');
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const jwt = getAuthToken();
      const dataToSend = {
        ten: formData.ten,
        diaChi: formData.diaChi,
        soDienThoai: formData.soDienThoai,
        gioMoCua: formData.gioMoCua + ':00',
        gioDongCua: formData.gioDongCua + ':00'
      };

      // Thêm tọa độ nếu người dùng nhập
      if (showCoordinateInput && formData.viDo && formData.kinhDo) {
        dataToSend.viDo = parseFloat(formData.viDo);
        dataToSend.kinhDo = parseFloat(formData.kinhDo);
      }

      const response = await axios.put('/thong-tin-cua-hang', dataToSend, {
        headers: {
          Authorization: `Bearer ${jwt}`,
          'Content-Type': 'application/json'
        },
      });
      
      setCuaHang(response.data);
      
      alert('Cập nhật thông tin thành công!');
      setIsEditing(false);
      setShowCoordinateInput(false);
      
      await fetchCuaHangStatus();
      
    } catch (err) {
      console.error('Lỗi khi cập nhật:', err);
      
      const errorMsg = err.response?.data;
      
      if (err.response?.status === 401) {
        alert('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
      } else if (err.response?.status === 403) {
        alert('Bạn không có quyền cập nhật thông tin này.');
      } else if (err.response?.status === 400) {
        // Hiển thị thông báo lỗi từ server
        if (typeof errorMsg === 'string' && errorMsg.includes('Khong tim thay toa do')) {
          const confirmManual = window.confirm(
            errorMsg + '\n\nBạn có muốn nhập tọa độ thủ công không?'
          );
          if (confirmManual) {
            setShowCoordinateInput(true);
          }
        } else {
          alert(errorMsg || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
        }
      } else {
        alert('Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại.');
      }
    }
  };

  const handleRetry = () => {
    setError(null);
    fetchCuaHang();
  };

  if (loading) {
    return (
      <div className="quanlycuahang-container">
        <div className="quanlycuahang-loading">
          <div className="quanlycuahang-loading-spinner"></div>
          <span>Đang tải thông tin...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quanlycuahang-container">
        <div className="quanlycuahang-error-message">
          <p>{error}</p>
          <button className="quanlycuahang-btn-retry" onClick={handleRetry}>
            🔄 Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quanlycuahang-container">
      <h2>⚙️ Quản Lý Thông Tin Cửa Hàng</h2>
    
      {cuaHangStatus && (
        <div className={`quanlycuahang-status-card ${cuaHangStatus.isOpen ? 'quanlycuahang-open' : 'quanlycuahang-closed'}`}>
          <div className="quanlycuahang-status-indicator">
            <span className={`quanlycuahang-status-dot ${cuaHangStatus.isOpen ? 'quanlycuahang-open' : 'quanlycuahang-closed'}`}></span>
            <span className="quanlycuahang-status-text">
              {cuaHangStatus.isOpen ? '🟢 ĐANG MỞ CỬA' : '🔴 ĐANG ĐÓNG CỬA'}
            </span>
          </div>
          <p className="quanlycuahang-status-info">{cuaHangStatus.thongTin}</p>
        </div>
      )}

      <div className="quanlycuahang-info-card">
        <div className="quanlycuahang-card-header">
          <h3>📋 Thông tin cửa hàng</h3>
          {!isEditing && (
            <button className="quanlycuahang-btn-edit" onClick={handleEdit}>
              ✏️ Chỉnh sửa
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="quanlycuahang-edit-form">
            <div className="quanlycuahang-form-group">
              <label htmlFor="ten">Tên cửa hàng:</label>
              <input
                id="ten"
                type="text"
                name="ten"
                value={formData.ten}
                onChange={handleInputChange}
                required
                maxLength="100"
              />
            </div>

            <div className="quanlycuahang-form-group">
              <label htmlFor="diaChi">Địa chỉ:</label>
              <textarea
                id="diaChi"
                name="diaChi"
                value={formData.diaChi}
                onChange={handleInputChange}
                rows={3}
                required
                maxLength="255"
                placeholder="Nhập địa chỉ chi tiết (số nhà, đường, phường/xã, quận/huyện, thành phố)"
              />
              <small style={{color: '#666', fontSize: '0.85em'}}>
                💡 Địa chỉ càng chi tiết càng tìm được tọa độ chính xác
              </small>
            </div>

            <div className="quanlycuahang-form-group">
              <label htmlFor="soDienThoai">Số điện thoại:</label>
              <input
                id="soDienThoai"
                type="text"
                name="soDienThoai"
                value={formData.soDienThoai}
                onChange={handleInputChange}
                required
                maxLength="15"
              />
            </div>

            <div className="quanlycuahang-form-row">
              <div className="quanlycuahang-form-group">
                <label htmlFor="gioMoCua">Giờ mở cửa:</label>
                <input
                  id="gioMoCua"
                  type="time"
                  name="gioMoCua"
                  value={formData.gioMoCua}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="quanlycuahang-form-group">
                <label htmlFor="gioDongCua">Giờ đóng cửa:</label>
                <input
                  id="gioDongCua"
                  type="time"
                  name="gioDongCua"
                  value={formData.gioDongCua}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Toggle nhập tọa độ thủ công */}
            <div className="quanlycuahang-form-group">
              <label>
                <input
                  type="checkbox"
                  checked={showCoordinateInput}
                  onChange={(e) => setShowCoordinateInput(e.target.checked)}
                />
                {' '}Nhập tọa độ thủ công (Vĩ độ, Kinh độ)
              </label>
            </div>

            {showCoordinateInput && (
              <div className="quanlycuahang-form-row">
                <div className="quanlycuahang-form-group">
                  <label htmlFor="viDo">Vĩ độ (Latitude):</label>
                  <input
                    id="viDo"
                    type="number"
                    step="any"
                    name="viDo"
                    value={formData.viDo}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: 10.762622"
                  />
                  <small style={{color: '#666', fontSize: '0.85em'}}>
                    📍 Từ -90 đến 90
                  </small>
                </div>

                <div className="quanlycuahang-form-group">
                  <label htmlFor="kinhDo">Kinh độ (Longitude):</label>
                  <input
                    id="kinhDo"
                    type="number"
                    step="any"
                    name="kinhDo"
                    value={formData.kinhDo}
                    onChange={handleInputChange}
                    placeholder="Ví dụ: 106.660172"
                  />
                  <small style={{color: '#666', fontSize: '0.85em'}}>
                    📍 Từ -180 đến 180
                  </small>
                </div>
              </div>
            )}

            <div className="quanlycuahang-form-actions">
              <button type="submit" className="quanlycuahang-btn-save">
                💾 Lưu thay đổi
              </button>
              <button type="button" className="quanlycuahang-btn-cancel" onClick={handleCancel}>
                ❌ Hủy
              </button>
            </div>
          </form>
        ) : (
          <div className="quanlycuahang-info-display">
            <div className="quanlycuahang-info-item">
              <span className="quanlycuahang-label">Tên cửa hàng:</span>
              <span className="quanlycuahang-value">{cuaHang?.ten}</span>
            </div>

            <div className="quanlycuahang-info-item">
              <span className="quanlycuahang-label">Địa chỉ:</span>
              <span className="quanlycuahang-value">{cuaHang?.diaChi}</span>
            </div>

            <div className="quanlycuahang-info-item">
              <span className="quanlycuahang-label">Số điện thoại:</span>
              <span className="quanlycuahang-value">{cuaHang?.soDienThoai}</span>
            </div>

            <div className="quanlycuahang-info-item">
              <span className="quanlycuahang-label">Giờ hoạt động:</span>
              <span className="quanlycuahang-value">
                {cuaHang?.gioMoCua?.substring(0, 5)} - {cuaHang?.gioDongCua?.substring(0, 5)}
              </span>
            </div>

            {cuaHang?.viDo && cuaHang?.kinhDo && (
              <div className="quanlycuahang-info-item">
                <span className="quanlycuahang-label">Tọa độ:</span>
                <span className="quanlycuahang-value">
                  📍 {cuaHang.viDo.toFixed(6)}, {cuaHang.kinhDo.toFixed(6)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuanLyCuaHang;