import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from "../../../services/axiosInstance";
import './ChiTietNguoiDung.css';

const ChiTietNguoiDung = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('view'); // xem - xoa - sua
 
  const [formData, setFormData] = useState({
    username: '',
    matKhau: '',
    hoTen: '',
    email: '',
    soDienThoai: '',
    diaChi: '',
    vaiTro: 'KHACHHANG'
  });

  const [originalData, setOriginalData] = useState({});

 
  const jwt = localStorage.getItem('jwt');
  const currentUserRole = localStorage.getItem('vaiTro'); 

  const USER_ROLES = {
    ADMIN: 'Admin',
    QUANLY: 'Quản lý',
    NHANVIEN_QUANLYDONHANG: 'NV Quản lý đơn hàng',
    NHANVIEN_QUANLYMONAN: 'NV Quản lý món ăn',
    NHANVIEN_GIAOHANG: 'NV Giao hàng',
    KHACHHANG: 'Khách hàng'
  };

 
  const HIGH_LEVEL_ROLES = ['ADMIN', 'QUANLY'];


  const canEditUser = (targetUserRole) => {
    if (currentUserRole === 'ADMIN') {
      return true; 
    }
    
    if (currentUserRole === 'QUANLY') {
    
      return !HIGH_LEVEL_ROLES.includes(targetUserRole);
    }
    
    return false; 
  };

 
  const isCurrentUserAdmin = () => {
    return currentUserRole === 'ADMIN';
  };

 
  const isCurrentUserHighLevel = () => {
    return HIGH_LEVEL_ROLES.includes(currentUserRole);
  };

 
  const getAvailableRoles = () => {
    if (isCurrentUserAdmin()) {
      return USER_ROLES; 
    } else if (currentUserRole === 'QUANLY') {
     
      const filteredRoles = {};
      Object.entries(USER_ROLES).forEach(([key, label]) => {
        if (!HIGH_LEVEL_ROLES.includes(key)) {
          filteredRoles[key] = label;
        }
      });
      return filteredRoles;
    } else {
      return {}; 
    }
  };

  const handleApiError = (err, defaultMessage) => {
    console.error('API Error:', err);
    if (err.response) {
      const errorMsg = err.response.data?.message || err.response.data?.error || defaultMessage;
      setError(`${defaultMessage}: ${errorMsg}`);
    } else if (err.request) {
      setError('Không thể kết nối đến server');
    } else {
      setError(defaultMessage);
    }
  };

  const fetchUserDetail = useCallback(async (userId) => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/nguoi-dung/${userId}`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      
      const userData = response.data;
      setFormData({
        username: userData.username || '',
        matKhau: '',
        hoTen: userData.hoTen || '',
        email: userData.email || '',
        soDienThoai: userData.soDienThoai || '',
        diaChi: userData.diaChi || '',
        vaiTro: userData.vaiTro || 'KHACHHANG'
      });
      setOriginalData(userData);
      
    } catch (err) {
      handleApiError(err, 'Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => {
    if (!id) {
      setMode('create');
    } else {
      const urlMode = searchParams.get('mode');
      if (urlMode === 'edit') {
        setMode('edit');
      } else {
        setMode('view'); 
      }
      fetchUserDetail(id);
    }
  }, [id, searchParams, fetchUserDetail]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError('Username không được để trống');
      return false;
    }
    if (!formData.hoTen.trim()) {
      setError('Họ tên không được để trống');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email không được để trống');
      return false;
    }
    if (mode === 'create' && !formData.matKhau.trim()) {
      setError('Mật khẩu không được để trống');
      return false;
    }
    if (mode === 'create' && formData.matKhau.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return false;
    }

  
    if (currentUserRole === 'QUANLY' && HIGH_LEVEL_ROLES.includes(formData.vaiTro)) {
      setError('Bạn không có quyền tạo/chỉnh sửa người dùng với vai trò Admin hoặc Quản lý');
      return false;
    }


    if (mode === 'edit' && !canEditUser(originalData.vaiTro)) {
      setError('Bạn không có quyền chỉnh sửa người dùng này');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'create') {
        console.log('Creating user with data:', formData);
        
        await axios.post('http://localhost:8080/auth/signup-by-admin', formData, {
          headers: { Authorization: `Bearer ${jwt}` }
        });
        
        navigate('/quan-ly-nguoi-dung', { 
          state: { message: 'Tạo người dùng thành công' } 
        });
        
      } else if (mode === 'edit') {
        console.log('Updating user:', id, 'with data:', formData);
        
        const updateData = {
          hoTen: formData.hoTen.trim(),
          email: formData.email.trim(),
          soDienThoai: formData.soDienThoai.trim(),
          diaChi: formData.diaChi.trim(),
          vaiTro: formData.vaiTro
        };
        
        if (formData.matKhau.trim()) {
          updateData.matKhau = formData.matKhau;
        }
        
        await axios.put(`/nguoi-dung/${id}`, updateData, {
          headers: { Authorization: `Bearer ${jwt}` }
        });
        
        navigate(`/nguoi-dung/${id}`, { replace: true });
        setMode('view');
        fetchUserDetail(id);
        setError('');
        
        setTimeout(() => {
          console.log('Cập nhật người dùng thành công');
        }, 100);
      }
      
    } catch (err) {
      const errorMsg = mode === 'create' ? 'Không thể tạo người dùng' : 'Không thể cập nhật người dùng';
      handleApiError(err, errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVoHieuHoa = async () => {
    if (!id) return;

   
    if (!canEditUser(originalData.vaiTro)) {
      setError('Bạn không có quyền vô hiệu hóa người dùng này');
      return;
    }

    const isConfirmed = window.confirm(
      `Bạn có chắc chắn muốn vô hiệu hóa người dùng "${formData.hoTen}"?\n\nNgười dùng sẽ không thể đăng nhập sau khi bị vô hiệu hóa.`
    );
    
    if (!isConfirmed) {
      return; 
    }
    
    console.log('Deactivating user:', id);
    setLoading(true);
    setError('');
    
    try {
      await axios.patch(`/nguoi-dung/${id}/vo-hieu-hoa`, {}, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      
      console.log('User deactivated successfully');
      navigate('/quan-ly-nguoi-dung', { 
        state: { message: 'Vô hiệu hóa người dùng thành công' } 
      });
      
    } catch (err) {
      handleApiError(err, 'Không thể vô hiệu hóa người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleKichHoat = async () => {
    if (!id) return;

    // Kiểm tra quyền kích hoạt
    if (!canEditUser(originalData.vaiTro)) {
      setError('Bạn không có quyền kích hoạt người dùng này');
      return;
    }

    const isConfirmed = window.confirm(
      `Bạn có chắc chắn muốn kích hoạt lại người dùng "${formData.hoTen}"?\n\nNgười dùng sẽ có thể đăng nhập trở lại sau khi được kích hoạt.`
    );
    
    if (!isConfirmed) {
      return; 
    }
    
    console.log('Activating user:', id);
    setLoading(true);
    setError('');
    
    try {
      await axios.patch(`/nguoi-dung/${id}/kich-hoat`, {}, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      
      console.log('User activated successfully');
      navigate('/quan-ly-nguoi-dung', { 
        state: { message: 'Kích hoạt người dùng thành công' } 
      });
      
    } catch (err) {
      handleApiError(err, 'Không thể kích hoạt người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleXoaNguoiDung = async () => {
    if (!id) return;

   
    if (!canEditUser(originalData.vaiTro)) {
      setError('Bạn không có quyền xóa người dùng này');
      return;
    }

    const isConfirmed = window.confirm(
      ` CẢNH BÁO: Bạn có chắc chắn muốn XÓA người dùng "${formData.hoTen}"?\n\n` +
      `Hành động này sẽ:\n` +
      `• Xóa vĩnh viễn tất cả thông tin cá nhân\n` +
      `• Đặt trạng thái về "đã xóa"\n` +
      `• Không thể hoàn tác!\n\n` +
      `Nhấn OK để xác nhận xóa người dùng.`
    );
    
    if (!isConfirmed) {
      return; 
    }
    
    console.log('Deleting user:', id);
    setLoading(true);
    setError('');
    
    try {
      await axios.delete(`/nguoi-dung/${id}`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      
      console.log('User deleted successfully');
      navigate('/quan-ly-nguoi-dung', { 
        state: { message: 'Xóa người dùng thành công' } 
      });
      
    } catch (err) {
      handleApiError(err, 'Không thể xóa người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    if (!canEditUser(originalData.vaiTro)) {
      setError('Bạn không có quyền chỉnh sửa người dùng này');
      return;
    }
    navigate(`/nguoi-dung/${id}?mode=edit`);
  };

  const handleCancelEdit = () => {
    navigate(`/nguoi-dung/${id}`, { replace: true });
  };

  const handleBack = () => {
    navigate('/quan-ly-nguoi-dung');
  };

  const getPageTitle = () => {
    switch (mode) {
      case 'create':
        return 'Thêm người dùng mới';
      case 'edit':
        return 'Chỉnh sửa người dùng';
      case 'view':
      default:
        return 'Chi tiết người dùng';
    }
  };

  const isReadOnly = mode === 'view';
  const availableRoles = getAvailableRoles();
  const userCanEdit = id ? canEditUser(originalData.vaiTro) : isCurrentUserHighLevel();

  return (
    <div className="user-detail">
      <div className="user-detail-header">
        <div className="header-left">
          <button className="btn btn-secondary btn-back" onClick={handleBack}>
            <i className="icon-arrow-left"></i>
            Quay lại
          </button>
          <h1>{getPageTitle()}</h1>
        </div>
        
        {mode === 'view' && id && userCanEdit && (
          <div className="header-actions">
            <button className="btn btn-warning" onClick={handleEdit}>
              <i className="icon-edit"></i>
              Chỉnh sửa
            </button>

          
            <div className="status-info">
              <span className={`status-badge ${originalData.trangThai ? 'status-active' : 'status-inactive'}`}>
                {originalData.trangThai ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
              </span>
            </div>

       
            {originalData.trangThai ? (
              <button 
                className="btn btn-warning"
                onClick={handleVoHieuHoa} 
              >
                <i className="icon-ban"></i>
                Vô hiệu hóa
              </button>
            ) : (
              <button 
                className="btn btn-success"
                onClick={handleKichHoat} 
              >
                <i className="icon-check"></i>
                Kích hoạt
              </button>
            )}
          </div>
        )}

     
        {mode === 'view' && id && !userCanEdit && (
          <div className="header-actions">
            <div className="permission-warning">
              <i className="icon-lock"></i>
              Bạn không có quyền chỉnh sửa người dùng này
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button 
            className="error-close"
            onClick={() => setError('')}
          >
            ×
          </button>
        </div>
      )}

      {loading && mode === 'view' ? (
        <div className="loading-container">
          <div className="loading">Đang tải...</div>
        </div>
      ) : (
        <div className="user-detail-content">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Thông tin cơ bản</h3>
              
              <div className="form-row">
                {id && (
                  <div className="form-group">
                    <label>ID</label>
                    <input type="text" value={originalData.id || ''} disabled />
                  </div>
                )}
                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    disabled={isReadOnly || mode === 'edit'} 
                    required
                    maxLength="50"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Họ tên *</label>
                  <input
                    type="text"
                    name="hoTen"
                    value={formData.hoTen}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                    required
                    maxLength="100"
                  />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                    required
                    maxLength="100"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    name="soDienThoai"
                    value={formData.soDienThoai}
                    onChange={handleInputChange}
                    disabled={isReadOnly}
                    maxLength="15"
                  />
                </div>
                <div className="form-group">
                  <label>Vai trò *</label>
                  {isReadOnly ? (
                    <input 
                      type="text" 
                      value={USER_ROLES[formData.vaiTro] || formData.vaiTro} 
                      disabled 
                    />
                  ) : (
                    <div>
                      <select
                        name="vaiTro"
                        value={formData.vaiTro}
                        onChange={handleInputChange}
                        required
                      >
                        {Object.entries(availableRoles).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                      {currentUserRole === 'QUANLY' && (
                        <small className="permission-note">
                          <i className="icon-info"></i>
                          Bạn không có quyền tạo tài khoản Admin hoặc Quản lý
                        </small>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Địa chỉ</label>
                <textarea
                  name="diaChi"
                  value={formData.diaChi}
                  onChange={handleInputChange}
                  disabled={isReadOnly}
                  rows="3"
                  maxLength="255"
                />
              </div>

              {mode === 'view' && id && (
                <div className="form-group">
                  <label>Trạng thái</label>
                  <div className="status-display">
                    <span className={`status-badge ${originalData.trangThai ? 'status-active' : 'status-inactive'}`}>
                      {originalData.trangThai ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
                    </span>
                    <span className="status-description">
                      {originalData.trangThai 
                        ? 'Người dùng có thể đăng nhập và sử dụng hệ thống'
                        : 'Người dùng không thể đăng nhập và sử dụng hệ thống'
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>

            {!isReadOnly && (
              <div className="form-section">
                <h3>Bảo mật</h3>
                <div className="form-group">
                  <label>
                    Mật khẩu {mode === 'create' ? '*' : '(để trống nếu không đổi)'}
                  </label>
                  <input
                    type="password"
                    name="matKhau"
                    value={formData.matKhau}
                    onChange={handleInputChange}
                    required={mode === 'create'}
                    minLength={mode === 'create' ? "6" : "0"}
                    maxLength="100"
                    placeholder={mode === 'edit' ? 'Nhập mật khẩu mới nếu muốn thay đổi' : ''}
                  />
                </div>
              </div>
            )}

            <div className="form-actions">
              {mode === 'view' ? (
                <div className="view-actions">
                  <button type="button" className="btn btn-secondary" onClick={handleBack}>
                    Quay lại danh sách
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={mode === 'create' ? handleBack : handleCancelEdit}
                    disabled={loading}
                  >
                    {mode === 'create' ? 'Hủy' : 'Hủy chỉnh sửa'}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Đang xử lý...' : (mode === 'create' ? 'Tạo người dùng' : 'Cập nhật')}
                  </button>

                  {mode === 'edit' && id && userCanEdit && (
                    <button
                      type="button"
                      className="btn btn-danger btn-delete-user"
                      onClick={handleXoaNguoiDung}
                      disabled={loading}
                    >
                      <i className="icon-trash"></i>
                      {loading ? 'Đang xóa...' : 'Xóa người dùng'}
                    </button>
                  )}
                </>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChiTietNguoiDung;