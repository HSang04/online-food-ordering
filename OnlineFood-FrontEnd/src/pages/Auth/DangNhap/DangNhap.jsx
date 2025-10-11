import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './DangNhap.css';


const DangNhap = () => {
  const [formData, setFormData] = useState({
    username: '',
    matKhau: ''
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Tài khoản không được để trống';
    if (!formData.matKhau) newErrors.matKhau = 'Mật khẩu không được để trống';
    else if (formData.matKhau.length < 6) newErrors.matKhau = 'Mật khẩu phải có ít nhất 6 ký tự';
    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      const validationErrors = validateForm();
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      try {
        const response = await axios.post('http://localhost:8080/auth/login', formData);
        if (response.data.jwt) {
          localStorage.setItem('jwt', response.data.jwt);
          localStorage.setItem('idNguoiDung', response.data.id);
          localStorage.setItem('vaiTro', response.data.role);
          navigate('/');
        }
      } catch (error) {
        const errorMessage =
          error.response?.data?.message ||
          (error.response?.status === 401
            ? 'Tài khoản hoặc mật khẩu không đúng'
            : 'Lỗi kết nối máy chủ');
        alert(errorMessage);
      }
    };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleSubmit}>
        <h2>Chào mừng trở lại!</h2>

        <div className="input-group">
          <label htmlFor="username">Tài khoản</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={errors.username ? 'error' : ''}
            placeholder="Nhập tên tài khoản"
          />
          {errors.username && <span className="error-message">{errors.username}</span>}
        </div>

        <div className="input-group">
          <label htmlFor="matKhau"> Mật khẩu</label>
          <input
            type="password"
            id="matKhau"
            name="matKhau"
            value={formData.matKhau}
            onChange={handleChange}
            className={errors.matKhau ? 'error' : ''}
            placeholder="Nhập mật khẩu"
          />
          {errors.matKhau && <span className="error-message">{errors.matKhau}</span>}
        </div>

        <button type="submit">Đăng nhập</button>

        <div className="login-links">
          <p>Chưa có tài khoản? <Link to="/signup">Đăng ký</Link></p>
          <p><Link to="/forgot-password" className="forgot-link">Quên mật khẩu?</Link></p>
        </div>
      </form>
    </div>
  );
};

export default DangNhap;
