import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from "../../../services/axiosInstance";
import './QuanLyNguoiDung.css';

const QuanLyNguoiDung = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('active'); 
  const [successMessage, setSuccessMessage] = useState('');

  const jwt = localStorage.getItem('jwt');
  const currentUserRole = localStorage.getItem('vaiTro'); 

  const USER_ROLES = {
    ADMIN: 'ADMIN',
    QUANLY: 'Quản lý',
    NHANVIEN_QUANLYDONHANG: 'NV Quản lý đơn hàng',
    NHANVIEN_QUANLYMONAN: 'NV Quản lý món ăn',
    KHACHHANG: 'Khách hàng'
  };

  const STATUS_OPTIONS = {
    active: 'Đang hoạt động',
    inactive: 'Đã vô hiệu hóa'
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


  const isCurrentUserHighLevel = () => {
    return HIGH_LEVEL_ROLES.includes(currentUserRole);
  };

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      
      navigate(location.pathname, { replace: true });
      
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    }
  }, [location, navigate]);

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

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      let endpoint = '/nguoi-dung';
      if (filterStatus === 'active') {
        endpoint = '/nguoi-dung'; 
      } else if (filterStatus === 'inactive') {
        endpoint = '/nguoi-dung/vo-hieu-hoa';
      }
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      console.log('Fetched users:', response.data);
      setUsers(response.data);
    } catch (err) {
      handleApiError(err, 'Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }, [jwt, filterStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreate = () => {

    if (!isCurrentUserHighLevel()) {
      setError('Bạn không có quyền tạo người dùng mới');
      return;
    }
    navigate('/nguoi-dung');
  };

  const handleView = (user) => {
    if (!user || !user.id) {
      setError('Không thể xem: Thông tin user không hợp lệ');
      return;
    }
    navigate(`/nguoi-dung/${user.id}`);
  };

  const handleEdit = (user) => {
    if (!user || !user.id) {
      setError('Không thể chỉnh sửa: Thông tin user không hợp lệ');
      return;
    }


    if (!canEditUser(user.vaiTro)) {
      setError('Bạn không có quyền chỉnh sửa người dùng này');
      return;
    }

    navigate(`/nguoi-dung/${user.id}?mode=edit`);
  };

  const handleDeactivate = async (user) => {
    if (!user || !user.id) {
      setError('Không thể vô hiệu hóa: Thông tin user không hợp lệ');
      return;
    }

   
    if (!canEditUser(user.vaiTro)) {
      setError('Bạn không có quyền vô hiệu hóa người dùng này');
      return;
    }
    
    if (window.confirm(`Bạn có chắc chắn muốn vô hiệu hóa người dùng "${user.hoTen}"?`)) {
      try {
        await axios.patch(`/nguoi-dung/${user.id}/vo-hieu-hoa`, {}, {
          headers: { Authorization: `Bearer ${jwt}` }
        });
        setSuccessMessage('Đã vô hiệu hóa người dùng thành công');
        fetchUsers();
      } catch (err) {
        handleApiError(err, 'Không thể vô hiệu hóa người dùng');
      }
    }
  };

  const handleActivate = async (user) => {
    if (!user || !user.id) {
      setError('Không thể kích hoạt: Thông tin user không hợp lệ');
      return;
    }


    if (!canEditUser(user.vaiTro)) {
      setError('Bạn không có quyền kích hoạt người dùng này');
      return;
    }
    
    if (window.confirm(`Bạn có chắc chắn muốn kích hoạt lại người dùng "${user.hoTen}"?`)) {
      try {
        await axios.patch(`/nguoi-dung/${user.id}/kich-hoat`, {}, {
          headers: { Authorization: `Bearer ${jwt}` }
        });
        setSuccessMessage('Đã kích hoạt người dùng thành công');
        fetchUsers(); 
      } catch (err) {
        handleApiError(err, 'Không thể kích hoạt người dùng');
      }
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.hoTen || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === '' || user.vaiTro === filterRole;
    
    let matchesStatus = true;
    if (filterStatus === 'active') {
      matchesStatus = user.trangThai === true;
    } else if (filterStatus === 'inactive') {
      matchesStatus = user.trangThai === false;
    }
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h1>Quản lý người dùng</h1>
        {isCurrentUserHighLevel() && (
          <button className="btn btn-primary" onClick={handleCreate}>
            <i className="icon-plus"></i>
            Thêm người dùng
          </button>
        )}
      </div>

      {successMessage && (
        <div className="success-message">
          {successMessage}
          <button 
            className="message-close"
            onClick={() => setSuccessMessage('')}
          >
            ×
          </button>
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
          <button 
            className="message-close"
            onClick={() => setError('')}
          >
            ×
          </button>
        </div>
      )}

      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, username, email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-select">
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">Tất cả vai trò</option>
            {Object.entries(USER_ROLES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="filter-select">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            {Object.entries(STATUS_OPTIONS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="loading">Đang tải...</div>
        ) : (
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => {
                const userCanEdit = canEditUser(user.vaiTro);
                
                return (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.hoTen}</td>
                    <td>{user.email}</td>
                    <td>{user.soDienThoai || 'N/A'}</td>
                    <td>
                      <span className={`role-badge role-${(user.vaiTro || '').toLowerCase()}`}>
                        {USER_ROLES[user.vaiTro] || user.vaiTro}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.trangThai ? 'status-active' : 'status-inactive'}`}>
                        {user.trangThai ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                
                        <button
                          className="btn btn-info btn-sm"
                          onClick={() => handleView(user)}
                          title="Xem chi tiết"
                          disabled={loading}
                        >
                          <i className="icon-eye"></i>
                        </button>

                        {userCanEdit && (
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => handleEdit(user)}
                            title="Chỉnh sửa"
                            disabled={loading}
                          >
                            <i className="icon-edit"></i>
                          </button>
                        )}

         
                        {userCanEdit && (
                          user.trangThai ? (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeactivate(user)}
                              title="Vô hiệu hóa"
                              disabled={loading}
                            >
                              <i className="icon-ban"></i>
                            </button>
                          ) : (
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleActivate(user)}
                              title="Kích hoạt"
                              disabled={loading}
                            >
                              <i className="icon-check"></i>
                            </button>
                          )
                        )}

                       
                        {!userCanEdit && (
                          <span className="no-permission-indicator" title="Bạn không có quyền chỉnh sửa người dùng này">
                            <i className="icon-lock"></i>
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {filteredUsers.length === 0 && !loading && (
        <div className="no-data">Không có dữ liệu</div>
      )}
    </div>
  );
};

export default QuanLyNguoiDung;