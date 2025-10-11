import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './DangKy.css';

const DangKy = () => {
  const [formData, setFormData] = useState({
    username: '',
    matKhau: '',
    email: '',
    soDienThoai: '',
    diaChi: '',
    hoTen: ''
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username) {
      newErrors.username = 'Tên người dùng không được để trống';
    }
    if (!formData.hoTen) {
      newErrors.hoTen = 'Họ tên không được để trống';
    }
    if (!formData.email) {
      newErrors.email = 'Email không được để trống';
    }
    if (!formData.soDienThoai) {
      newErrors.soDienThoai = 'Số điện thoại không được để trống';
    }
    if (!formData.diaChi) {
      newErrors.diaChi = 'Địa chỉ không được để trống';
    }
    if (!formData.matKhau) {
      newErrors.matKhau = 'Mật khẩu không được để trống';
    } else if (formData.matKhau.length < 6) {
      newErrors.matKhau = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  const validationErrors = validateForm();
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }

  try {
    await axios.post('http://localhost:8080/auth/signup', formData);
    alert('Đăng ký thành công! Hãy đăng nhập.');
    navigate('/login');
  } catch (error) {
    console.error('Lỗi đăng ký:', error);
    
    let errorMessage = 'Không thể kết nối máy chủ';
    
    if (error.response) {
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else {
        errorMessage = `Lỗi server: ${error.response.status}`;
      }
    } else if (error.request) {
      errorMessage = 'Không thể kết nối tới máy chủ';
    } else {
      errorMessage = error.message || 'Đã có lỗi xảy ra';
    }
    
    alert('Lỗi đăng ký: ' + errorMessage);
  }
};
  return (
    <div className="login-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <h2>Đăng ký tài khoản</h2>

        <label htmlFor="username">Tài khoản</label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className={errors.username ? 'error' : ''}
          placeholder="Nhập tên người dùng"
        />
        {errors.username && <span className="error-message">{errors.username}</span>}

         <label htmlFor="matKhau">Mật khẩu</label>
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


        <label htmlFor="hoTen">Họ tên</label>
        <input
          type="text"
          id="hoTen"
          name="hoTen"
          value={formData.hoTen}
          onChange={handleChange}
          className={errors.hoTen ? 'error' : ''}
          placeholder="Nhập họ tên"
        />
        {errors.hoTen && <span className="error-message">{errors.hoTen}</span>}

       
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={errors.email ? 'error' : ''}
          placeholder="Nhập email"
        />
        {errors.email && <span className="error-message">{errors.email}</span>}

        <label htmlFor="soDienThoai">Số điện thoại</label>
        <input
          type="text"
          id="soDienThoai"
          name="soDienThoai"
          value={formData.soDienThoai}
          onChange={handleChange}
          className={errors.soDienThoai ? 'error' : ''}
          placeholder="Nhập số điện thoại"
        />
        {errors.soDienThoai && <span className="error-message">{errors.soDienThoai}</span>}

        <label htmlFor="diaChi">Địa chỉ</label>
        <input
          type="text"
          id="diaChi"
          name="diaChi"
          value={formData.diaChi}
          onChange={handleChange}
          className={errors.diaChi ? 'error' : ''}
          placeholder="Nhập địa chỉ"
        />
        {errors.diaChi && <span className="error-message">{errors.diaChi}</span>}

        <button type="submit">Đăng ký</button>

        <p style={{ marginTop: '16px' }}>
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </form>
    </div>
  );
};

export default DangKy;
