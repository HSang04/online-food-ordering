import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './QuenMatKhau.css';

const QuenMatKhau = () => {
  const [formData, setFormData] = useState({
    email: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('');

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email không được để trống';
    } else if (!/^[A-Za-z0-9+_.-]+@(.+)$/.test(formData.email)) {
      newErrors.email = 'Định dạng email không hợp lệ';
    }
    
    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setMessage('');

    try {
      const response = await axios.post('http://localhost:8080/auth/forgot-password', formData);
      
      setIsSuccess(true);
      setMessage(response.data.message || 'Email khôi phục mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.');
      
      // Reset form
      setFormData({ email: '' });
      
    } catch (error) {
      setIsSuccess(false);
      
      if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else if (error.response?.status === 404) {
        setMessage('Email không tồn tại trong hệ thống.');
      } else if (error.response?.status === 403) {
        setMessage('Tài khoản đã bị vô hiệu hóa.');
      } else {
        setMessage('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <form className="forgot-password-form" onSubmit={handleSubmit}>
        <div className="form-header">
          <h2>Quên mật khẩu?</h2>
          <p className="form-description">
            Nhập email của bạn và chúng tôi sẽ gửi link khôi phục mật khẩu
          </p>
        </div>

        {message && (
          <div className={`message ${isSuccess ? 'success' : 'error'}`}>
            <span className="message-icon">
              {isSuccess ? '✓' : '⚠'}
            </span>
            <span>{message}</span>
          </div>
        )}

        {!isSuccess && (
          <>
            <div className="input-group">
              <label htmlFor="email">
                <span className="label-icon">✉</span>
                Địa chỉ Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                placeholder="Nhập địa chỉ email của bạn"
                disabled={isLoading}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <button 
              type="submit" 
              className={`submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Đang gửi...
                </>
              ) : (
                'Gửi email khôi phục'
              )}
            </button>
          </>
        )}

        <div className="form-links">
          <p>
            <Link to="/login" className="back-link">
              ← Quay lại đăng nhập
            </Link>
          </p>
          <p>
            Chưa có tài khoản? <Link to="/signup">Đăng ký ngay</Link>
          </p>
        </div>

        {isSuccess && (
          <div className="success-actions">
            <p className="success-note">
              <strong>Lưu ý:</strong> Link khôi phục có hiệu lực trong 15 phút. 
              Hãy kiểm tra cả thư mục spam nếu không thấy email.
            </p>
            <button 
              type="button" 
              className="resend-btn"
              onClick={() => {
                setIsSuccess(false);
                setMessage('');
                setFormData({ email: formData.email });
              }}
            >
              Gửi lại email
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default QuenMatKhau;