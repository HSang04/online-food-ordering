import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from "../../../services/axiosInstance";
import './ThemSuaVoucher.css';

const ThemSuaVoucher = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const jwt = localStorage.getItem('jwt');
  
  const [formData, setFormData] = useState({
    maVoucher: '',
    loai: 'PHAN_TRAM',
    giaTri: '',
    hanSuDung: '',
    soLuong: '',
    moTa: '',
    daSuDung: 0,
    giaToiThieu: '',
    trangThai: true,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchVoucherData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/vouchers/${id}`, {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });

        if (response.data) {
          const voucher = response.data;
          setFormData({
            maVoucher: voucher.maVoucher,
            loai: voucher.loai,
            giaTri: voucher.giaTri.toString(),
            hanSuDung: voucher.hanSuDung,
            soLuong: voucher.soLuong.toString(),
            moTa: voucher.moTa || '',
            daSuDung: voucher.daSuDung,
            giaToiThieu: voucher.giaToiThieu?.toString() || '',
            trangThai: voucher.trangThai
          });
        }
      } catch (err) {
        console.error('Lỗi khi tải voucher:', err);
        if (err.response?.status === 400) {
          setError(err.response.data.message || 'Không thể tải thông tin voucher');
        } else {
          setError('Không thể tải thông tin voucher. Vui lòng thử lại.');
        }
      } finally {
        setLoading(false);
      }
    };

    if (isEditing) {
      fetchVoucherData();
    }
  }, [id, isEditing, jwt]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear general error when user makes changes
    if (error) {
      setError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.maVoucher.trim()) {
      newErrors.maVoucher = 'Mã voucher là bắt buộc';
    } else if (formData.maVoucher.length < 3) {
      newErrors.maVoucher = 'Mã voucher phải có ít nhất 3 ký tự';
    } else if (formData.maVoucher.length > 20) {
      newErrors.maVoucher = 'Mã voucher không được vượt quá 20 ký tự';
    }

    if (!formData.giaTri || formData.giaTri <= 0) {
      newErrors.giaTri = 'Giá trị phải lớn hơn 0';
    } else if (formData.loai === 'PHAN_TRAM' && formData.giaTri > 100) {
      newErrors.giaTri = 'Giá trị phần trăm không được vượt quá 100%';
    }

    if (!formData.hanSuDung) {
      newErrors.hanSuDung = 'Hạn sử dụng là bắt buộc';
    } else {
      const selectedDate = new Date(formData.hanSuDung);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.hanSuDung = 'Hạn sử dụng không thể là ngày trong quá khứ';
      }
    }

    if (!formData.soLuong || formData.soLuong <= 0) {
      newErrors.soLuong = 'Số lượng phải lớn hơn 0';
    }

    if (formData.giaToiThieu && formData.giaToiThieu < 0) {
      newErrors.giaToiThieu = 'Giá tối thiểu không thể âm';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const voucherData = {
        ...formData,
        giaTri: parseFloat(formData.giaTri),
        soLuong: parseInt(formData.soLuong),
        giaToiThieu: formData.giaToiThieu ? parseInt(formData.giaToiThieu) : 0
      };

      if (isEditing) {
        await axios.put(`/vouchers/${id}`, voucherData, {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
        });
        setSuccess('Cập nhật voucher thành công!');
      } else {
        await axios.post('/vouchers', voucherData, {
          headers: {
            Authorization: `Bearer ${jwt}`,
            'Content-Type': 'application/json',
          },
        });
        setSuccess('Tạo voucher thành công!');
      }

      // Redirect after 1.5 seconds
      setTimeout(() => {
        navigate('/quan-ly-voucher');
      }, 1500);

    } catch (err) {
      console.error('Lỗi khi lưu voucher:', err);
      
      if (err.response?.status === 400) {
        // Lỗi validation từ server (mã voucher trùng, etc.)
        const errorMessage = err.response.data?.message || 'Dữ liệu không hợp lệ';
        setError(errorMessage);
        
        // Nếu là lỗi mã voucher trùng, focus vào field mã voucher
        if (errorMessage.includes('đã tồn tại')) {
          setErrors(prev => ({
            ...prev,
            maVoucher: errorMessage
          }));
        }
      } else if (err.response?.status === 500) {
        setError('Lỗi hệ thống. Vui lòng thử lại sau.');
      } else {
        setError('Không thể lưu voucher. Vui lòng kiểm tra kết nối và thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading && isEditing && !formData.maVoucher) {
    return (
      <div className="voucher-form-container">
        <div className="loading-page">
          <div className="loading-spinner"></div>
          <span>Đang tải thông tin voucher...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="voucher-form-container">
      <div className="form-header">
        <button 
          className="back-btn"
          onClick={() => navigate('/quan-ly-voucher')}
          type="button"
        >
          ← Quay lại
        </button>
        <div className="form-title">
          <h1>{isEditing ? 'Chỉnh Sửa Voucher' : 'Tạo Voucher Mới'}</h1>
          <p>{isEditing ? 'Cập nhật thông tin voucher' : 'Tạo voucher khuyến mãi mới'}</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">❌</span>
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✅</span>
          {success}
        </div>
      )}

      <div className="form-card">
        <form onSubmit={handleSubmit} className="voucher-form">
          <div className="form-section">
            <h3 className="section-title">Thông tin cơ bản</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="maVoucher">
                  Mã Voucher <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="maVoucher"
                  name="maVoucher"
                  value={formData.maVoucher}
                  onChange={handleInputChange}
                  placeholder="Ví dụ: SUMMER2024 (3-20 ký tự)"
                  className={errors.maVoucher ? 'error' : ''}
                  disabled={loading}
                  maxLength="20"
                />
                {errors.maVoucher && (
                  <span className="error-text">{errors.maVoucher}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="loai">
                  Loại Voucher <span className="required">*</span>
                </label>
                <select
                  id="loai"
                  name="loai"
                  value={formData.loai}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="PHAN_TRAM">Giảm theo phần trăm (%)</option>
                  <option value="TIEN_MAT">Giảm tiền mặt (VND)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="giaTri">
                  Giá Trị Giảm <span className="required">*</span>
                  <span className="input-hint">
                    {formData.loai === 'PHAN_TRAM' ? '(1-100%)' : '(VND)'}
                  </span>
                </label>
                <input
                  type="number"
                  id="giaTri"
                  name="giaTri"
                  value={formData.giaTri}
                  onChange={handleInputChange}
                  placeholder={formData.loai === 'PHAN_TRAM' ? '10' : '50000'}
                  min="0"
                  step={formData.loai === 'PHAN_TRAM' ? '0.1' : '1000'}
                  max={formData.loai === 'PHAN_TRAM' ? '100' : undefined}
                  className={errors.giaTri ? 'error' : ''}
                  disabled={loading}
                />
                {formData.giaTri && formData.loai === 'TIEN_MAT' && (
                  <div className="value-preview">
                    Giá trị: {formatCurrency(formData.giaTri)}
                  </div>
                )}
                {errors.giaTri && (
                  <span className="error-text">{errors.giaTri}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="giaToiThieu">
                  Giá Trị Đơn Hàng Tối Thiểu
                  <span className="input-hint">(VND, không bắt buộc)</span>
                </label>
                <input
                  type="number"
                  id="giaToiThieu"
                  name="giaToiThieu"
                  value={formData.giaToiThieu}
                  onChange={handleInputChange}
                  placeholder="100000"
                  min="0"
                  step="1000"
                  className={errors.giaToiThieu ? 'error' : ''}
                  disabled={loading}
                />
                {formData.giaToiThieu && (
                  <div className="value-preview">
                    Áp dụng cho đơn từ: {formatCurrency(formData.giaToiThieu)}
                  </div>
                )}
                {errors.giaToiThieu && (
                  <span className="error-text">{errors.giaToiThieu}</span>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Số lượng và thời hạn</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="soLuong">
                  Số Lượng <span className="required">*</span>
                </label>
                <input
                  type="number"
                  id="soLuong"
                  name="soLuong"
                  value={formData.soLuong}
                  onChange={handleInputChange}
                  placeholder="100"
                  min="1"
                  className={errors.soLuong ? 'error' : ''}
                  disabled={loading}
                />
                {errors.soLuong && (
                  <span className="error-text">{errors.soLuong}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="hanSuDung">
                  Hạn Sử Dụng <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="hanSuDung"
                  name="hanSuDung"
                  value={formData.hanSuDung}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={errors.hanSuDung ? 'error' : ''}
                  disabled={loading}
                />
                {errors.hanSuDung && (
                  <span className="error-text">{errors.hanSuDung}</span>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="form-row">
                <div className="form-group">
                  <label>Đã Sử Dụng</label>
                  <input
                    type="number"
                    value={formData.daSuDung}
                    disabled
                    className="readonly-input"
                  />
                  <span className="input-hint">Số lượng đã được sử dụng (chỉ đọc)</span>
                </div>
              </div>
            )}
          </div>

          <div className="form-section">
            <h3 className="section-title">Mô tả</h3>
            
            <div className="form-group">
              <label htmlFor="moTa">Mô Tả Chi Tiết</label>
              <textarea
                id="moTa"
                name="moTa"
                value={formData.moTa}
                onChange={handleInputChange}
                rows="4"
                placeholder="Nhập mô tả về voucher, điều kiện sử dụng..."
                disabled={loading}
                maxLength="500"
              />
              <div className="character-count">
                {formData.moTa.length}/500 ký tự
              </div>
            </div>
          </div>

          {(formData.maVoucher || formData.giaTri) && (
            <div className="form-section">
              <h3 className="section-title">Xem trước voucher</h3>
              <div className="voucher-preview">
                <div className="preview-header">
                  <span className="preview-code">
                    {formData.maVoucher || 'MÃ VOUCHER'}
                  </span>
                  <span className="preview-type">
                    {formData.loai === 'PHAN_TRAM' ? 'Phần trăm' : 'Tiền mặt'}
                  </span>
                </div>
                <div className="preview-value">
                  {formData.giaTri ? (
                    formData.loai === 'PHAN_TRAM' 
                      ? `${formData.giaTri}%` 
                      : formatCurrency(formData.giaTri)
                  ) : 'Giá trị'}
                </div>
                <div className="preview-details">
                  <div>Số lượng: {formData.soLuong || '0'}</div>
                  <div>Hạn dùng: {formData.hanSuDung ? new Date(formData.hanSuDung).toLocaleDateString('vi-VN') : 'Chưa chọn'}</div>
                  {formData.giaToiThieu && (
                    <div>Đơn tối thiểu: {formatCurrency(formData.giaToiThieu)}</div>
                  )}
                </div>
                {formData.moTa && (
                  <div className="preview-description">
                    {formData.moTa}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              className="btn-cancel"
              onClick={() => navigate('/quan-ly-voucher')}
              disabled={loading}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="btn-spinner"></div>
                  {isEditing ? 'Đang cập nhật...' : 'Đang tạo...'}
                </>
              ) : (
                <>
                  {isEditing ? 'Cập Nhật' : 'Tạo Voucher'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ThemSuaVoucher;