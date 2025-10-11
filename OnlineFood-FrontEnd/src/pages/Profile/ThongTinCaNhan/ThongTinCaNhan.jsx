import axios from "../../../services/axiosInstance";
import React, { useEffect, useState } from "react";
import "./ThongTinCaNhan.css";

const ThongTinCaNhan = () => {
  const [user, setUser] = useState(null);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [editForm, setEditForm] = useState({
    hoTen: '',
    soDienThoai: '',
    diaChi: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    matKhauCu: '',
    matKhauMoi: '',
    xacNhanMatKhau: ''
  });

  const [deleteForm, setDeleteForm] = useState({
    matKhau: '',
    xacNhan: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [deleteMessage, setDeleteMessage] = useState('');
  
  const idNguoiDung = localStorage.getItem("idNguoiDung");
  const jwt = localStorage.getItem("jwt");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!idNguoiDung || !jwt) return;

      try {
        const response = await axios.get(`/nguoi-dung/secure/${idNguoiDung}`, {
          headers: {
            Authorization: `Bearer ${jwt}`, 
          },
        });
        
        setUser(response.data);
        setEditForm({
          hoTen: response.data.hoTen || '',
          soDienThoai: response.data.soDienThoai || '',
          diaChi: response.data.diaChi || ''
        });
      } catch (error) {
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        if (error.response?.status === 401) {
          setMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
      }
    };

    fetchUserData();
  }, [idNguoiDung, jwt]);

  const handleInfoInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDeleteInputChange = (e) => {
    const { name, value } = e.target;
    setDeleteForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
 
  const handleSaveInfo = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const updateData = {};
      if (editForm.hoTen.trim()) updateData.hoTen = editForm.hoTen.trim();
      if (editForm.soDienThoai.trim()) updateData.soDienThoai = editForm.soDienThoai.trim();
      if (editForm.diaChi.trim()) updateData.diaChi = editForm.diaChi.trim();

      const response = await axios.put(
        `/nguoi-dung/secure/${idNguoiDung}`, 
        updateData,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      setUser({...user, ...response.data});
      setIsEditingInfo(false);
      setMessage('Cập nhật thông tin thành công!');
      
    } catch (error) {
      console.error("Lỗi khi cập nhật thông tin:", error);
      if (error.response?.status === 401) {
        setMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (error.response?.status === 403) {
        setMessage('Bạn không có quyền cập nhật thông tin này.');
      } else {
        setMessage(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thông tin!');
      }
    } finally {
      setLoading(false);
    }
  };
 
  const handleChangePassword = async () => {
    setLoading(true);
    setPasswordMessage('');
    
    if (!passwordForm.matKhauCu.trim()) {
      setPasswordMessage('Vui lòng nhập mật khẩu cũ!');
      setLoading(false);
      return;
    }
    
    if (!passwordForm.matKhauMoi.trim()) {
      setPasswordMessage('Vui lòng nhập mật khẩu mới!');
      setLoading(false);
      return;
    }
    
    if (passwordForm.matKhauMoi !== passwordForm.xacNhanMatKhau) {
      setPasswordMessage('Mật khẩu mới và xác nhận mật khẩu không khớp!');
      setLoading(false);
      return;
    }
    
    if (passwordForm.matKhauMoi.length < 6) {
      setPasswordMessage('Mật khẩu mới phải có ít nhất 6 ký tự!');
      setLoading(false);
      return;
    }
    
    try {
      await axios.put(
        `/nguoi-dung/secure/${idNguoiDung}/change-password`, 
        {
          matKhauCu: passwordForm.matKhauCu,
          matKhauMoi: passwordForm.matKhauMoi
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      setIsChangingPassword(false);
      setPasswordForm({
        matKhauCu: '',
        matKhauMoi: '',
        xacNhanMatKhau: ''
      });
      setPasswordMessage('Đổi mật khẩu thành công!');
      
    } catch (error) {
      console.error("Lỗi khi đổi mật khẩu:", error);
      if (error.response?.status === 401) {
        setPasswordMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (error.response?.status === 400) {
        setPasswordMessage('Mật khẩu cũ không chính xác!');
      } else {
        setPasswordMessage(error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu!');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setDeleteMessage('');
    
    if (!deleteForm.matKhau.trim()) {
      setDeleteMessage('Vui lòng nhập mật khẩu để xác nhận!');
      setLoading(false);
      return;
    }
    
    if (deleteForm.xacNhan !== 'XÓA TÀI KHOẢN') {
      setDeleteMessage('Vui lòng nhập chính xác "XÓA TÀI KHOẢN" để xác nhận!');
      setLoading(false);
      return;
    }
    
    try {
      await axios.delete(
        `/nguoi-dung/secure/${idNguoiDung}`, 
        {
          data: {
            matKhau: deleteForm.matKhau
          },
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      setDeleteMessage('Tài khoản đã được xóa thành công!');
      
      // Đăng xuất sau 2 giây
      setTimeout(() => {
        localStorage.removeItem('jwt');
        localStorage.removeItem('idNguoiDung');
        window.location.href = '/login';
      }, 2000);
      
    } catch (error) {
      console.error("Lỗi khi xóa tài khoản:", error);
      if (error.response?.status === 400) {
        setDeleteMessage('Mật khẩu không chính xác!');
      } else if (error.response?.status === 401) {
        setDeleteMessage('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } else {
        setDeleteMessage(error.response?.data?.message || 'Có lỗi xảy ra khi xóa tài khoản!');
      }
    } finally {
      setLoading(false);
    }
  };
 
  const handleCancelInfo = () => {
    setEditForm({
      hoTen: user.hoTen || '',
      soDienThoai: user.soDienThoai || '',
      diaChi: user.diaChi || ''
    });
    setIsEditingInfo(false);
    setMessage('');
  };

  const handleCancelPassword = () => {
    setPasswordForm({
      matKhauCu: '',
      matKhauMoi: '',
      xacNhanMatKhau: ''
    });
    setIsChangingPassword(false);
    setPasswordMessage('');
  };

  const handleCancelDelete = () => {
    setDeleteForm({
      matKhau: '',
      xacNhan: ''
    });
    setIsDeleting(false);
    setDeleteMessage('');
  };

  if (!user) return <p>Đang tải...</p>;

  return (
    <div className="profile-container">
      <h2>Thông tin cá nhân</h2>
      
      {message && (
        <div className={`message ${message.includes('thành công') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {!isEditingInfo && !isChangingPassword && !isDeleting && (
        <div className="profile-view">
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Họ tên:</strong> {user.hoTen}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Số điện thoại:</strong> {user.soDienThoai}</p>
          <p><strong>Địa chỉ:</strong> {user.diaChi}</p>
          <p><strong>Vai trò:</strong> {user.vaiTro}</p>
          <p><strong>Ngày tạo:</strong> {new Date(user.ngayTao).toLocaleString()}</p>
          
          <div className="profile-actions">
            <button 
              className="edit-btn"
              onClick={() => setIsEditingInfo(true)}
            >
              Chỉnh sửa thông tin
            </button>
            
            <button 
              className="change-password-btn"
              onClick={() => setIsChangingPassword(true)}
            >
              Đổi mật khẩu
            </button>

            <button 
              className="delete-btn"
              onClick={() => setIsDeleting(true)}
            >
              Xóa tài khoản
            </button>
          </div>
        </div>
      )}

      {isEditingInfo && (
        <div className="profile-edit">
          <h3>Chỉnh sửa thông tin cá nhân</h3>
          
          <div className="form-group">
            <label><strong>Username:</strong></label>
            <input
              type="text"
              value={user.username}
              disabled
              className="disabled-input"
              placeholder="Username không thể thay đổi"
            />
          </div>

          <div className="form-group">
            <label><strong>Email:</strong></label>
            <input
              type="email"
              value={user.email}
              disabled
              className="disabled-input"
              placeholder="Email không thể thay đổi"
            />
          </div>

          <div className="form-group">
            <label><span>Họ tên:</span></label>
            <input
              type="text"
              name="hoTen"
              value={editForm.hoTen}
              onChange={handleInfoInputChange}
              placeholder="Nhập họ tên"
            />
          </div>

          <div className="form-group">
            <label><span>Số điện thoại:</span></label>
            <input
              type="tel"
              name="soDienThoai"
              value={editForm.soDienThoai}
              onChange={handleInfoInputChange}
              placeholder="Nhập số điện thoại"
            />
          </div>

          <div className="form-group">
            <label><span>Địa chỉ:</span></label>
            <textarea
              name="diaChi"
              value={editForm.diaChi}
              onChange={handleInfoInputChange}
              placeholder="Nhập địa chỉ"
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button 
              className="save-btn" 
              onClick={handleSaveInfo}
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            
            <button 
              className="cancel-btn" 
              onClick={handleCancelInfo}
              disabled={loading}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {isChangingPassword && (
        <div className="profile-edit password-change">
          <h3>Đổi mật khẩu</h3>
          
          {passwordMessage && (
            <div className={`message ${passwordMessage.includes('thành công') ? 'success' : 'error'}`}>
              {passwordMessage}
            </div>
          )}

          <div className="form-group">
            <label><strong>Mật khẩu cũ:</strong></label>
            <input
              type="password"
              name="matKhauCu"
              value={passwordForm.matKhauCu}
              onChange={handlePasswordInputChange}
              placeholder="Nhập mật khẩu hiện tại"
            />
          </div>

          <div className="form-group">
            <label><strong>Mật khẩu mới:</strong></label>
            <input
              type="password"
              name="matKhauMoi"
              value={passwordForm.matKhauMoi}
              onChange={handlePasswordInputChange}
              placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
            />
          </div>

          <div className="form-group">
            <label><strong>Xác nhận mật khẩu mới:</strong></label>
            <input
              type="password"
              name="xacNhanMatKhau"
              value={passwordForm.xacNhanMatKhau}
              onChange={handlePasswordInputChange}
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>

          <div className="form-actions">
            <button 
              className="save-btn" 
              onClick={handleChangePassword}
              disabled={loading}
            >
              {loading ? 'Đang đổi...' : 'Đổi mật khẩu'}
            </button>
            
            <button 
              className="cancel-btn" 
              onClick={handleCancelPassword}
              disabled={loading}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {isDeleting && (
        <div className="profile-edit delete-form">
          <h3>Xóa tài khoản</h3>
          
          {deleteMessage && (
            <div className={`message ${deleteMessage.includes('thành công') ? 'success' : 'error'}`}>
              {deleteMessage}
            </div>
          )}

          <div className="danger-message">
            <p><strong>NGUY HIỂM:</strong> Hành động này không thể hoàn tác! Tất cả dữ liệu của bạn sẽ bị xóa vĩnh viễn.</p>
          </div>

          <div className="form-group">
            <label><strong>Nhập mật khẩu để xác nhận:</strong></label>
            <input
              type="password"
              name="matKhau"
              value={deleteForm.matKhau}
              onChange={handleDeleteInputChange}
              placeholder="Nhập mật khẩu hiện tại"
            />
          </div>

          <div className="form-group">
            <label><strong>Nhập "XÓA TÀI KHOẢN" để xác nhận:</strong></label>
            <input
              type="text"
              name="xacNhan"
              value={deleteForm.xacNhan}
              onChange={handleDeleteInputChange}
              placeholder="Nhập chính xác: XÓA TÀI KHOẢN"
            />
          </div>

          <div className="form-actions">
            <button 
              className="delete-confirm-btn" 
              onClick={handleDeleteAccount}
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Xóa tài khoản'}
            </button>
            
            <button 
              className="cancel-btn" 
              onClick={handleCancelDelete}
              disabled={loading}
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThongTinCaNhan;