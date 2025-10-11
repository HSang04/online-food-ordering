import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import './ResetMatKhau.css';

const ResetMatKhau = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Wrap verifyToken in useCallback to memoize it
  const verifyToken = useCallback(async () => {
    try {
      await axios.post('http://localhost:8080/auth/verify-reset-token', { token });
      setIsTokenValid(true);
      setMessage('');
    } catch (error) {
      setIsTokenValid(false);
      if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else {
        setMessage('Token không hợp lệ hoặc đã hết hạn.');
      }
    } finally {
      setIsVerifying(false);
    }
  }, [token]); // Include token as dependency

  useEffect(() => {
    if (!token) {
      setMessage('Token không hợp lệ hoặc đã hết hạn.');
      setIsVerifying(false);
      return;
    }

    verifyToken();
  }, [token, verifyToken]); // Include verifyToken as dependency

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'Mật khẩu mới không được để trống';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
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
      const response = await axios.post('http://localhost:8080/auth/reset-password', {
        token: token,
        newPassword: formData.newPassword
      });
      
      setIsSuccess(true);
      setMessage(response.data.message || 'Mật khẩu đã được thay đổi thành công!');
      
      // Chuyển hướng về trang đăng nhập sau 3 giây
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      if (error.response?.data?.message) {
        setMessage(error.response.data.message);
      } else if (error.response?.status === 400) {
        setMessage('Token không hợp lệ hoặc đã hết hạn.');
      } else {
        setMessage('Lỗi kết nối máy chủ. Vui lòng thử lại sau.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state khi đang verify token
  if (isVerifying) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-form">
          <div className="loading-section">
            <div className="loading-spinner large"></div>
            <h2>Đang xác thực...</h2>
            <p>Vui lòng chờ trong giây lát</p>
          </div>
        </div>
      </div>
    );
  }

  // Token không hợp lệ
  if (!isTokenValid) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-form">
          <div className="error-section">
            <div className="error-icon">⚠</div>
            <h2>Token không hợp lệ</h2>
            <div className="message error">
              <span>{message}</span>
            </div>
            <div className="form-links">
              <Link to="/forgot-password" className="primary-link">
                Gửi lại email khôi phục
              </Link>
              <p>
                <Link to="/login">Quay lại đăng nhập</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="reset-password-container">
        <div className="reset-password-form">
          <div className="success-section">
            <div className="success-icon">✓</div>
            <h2>Thành công!</h2>
            <div className="message success">
              <span>{message}</span>
            </div>
            <div className="success-info">
              <p>Bạn sẽ được chuyển hướng về trang đăng nhập sau <span id="countdown">3</span> giây...</p>
              <Link to="/login" className="primary-link">
                Đăng nhập ngay
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-container">
      <form className="reset-password-form" onSubmit={handleSubmit}>
        <div className="form-header">
          <h2>Đặt lại mật khẩu</h2>
          <p className="form-description">
            Nhập mật khẩu mới của bạn
          </p>
        </div>

        {message && !isSuccess && (
          <div className="message error">
            <span className="message-icon">⚠</span>
            <span>{message}</span>
          </div>
        )}

        <div className="input-group">
          <label htmlFor="newPassword">
            <span className="label-icon">🔐</span>
            Mật khẩu mới
          </label>
          <input
            type="password"
            id="newPassword"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className={errors.newPassword ? 'error' : ''}
            placeholder="Nhập mật khẩu mới"
            disabled={isLoading}
          />
          {errors.newPassword && <span className="error-message">{errors.newPassword}</span>}
        </div>

        <div className="input-group">
          <label htmlFor="confirmPassword">
            <span className="label-icon">🔒</span>
            Xác nhận mật khẩu
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={errors.confirmPassword ? 'error' : ''}
            placeholder="Nhập lại mật khẩu mới"
            disabled={isLoading}
          />
          {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
        </div>

        <button 
          type="submit" 
          className={`submit-btn ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="loading-spinner"></span>
              Đang cập nhật...
            </>
          ) : (
            'Đặt lại mật khẩu'
          )}
        </button>

        <div className="form-links">
          <p>
            <Link to="/login" className="back-link">
              ← Quay lại đăng nhập
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
};

export default ResetMatKhau;