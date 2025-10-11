import React, { useEffect, useState } from 'react';
import axios from '../../../services/axiosInstance';
import './QuanLyDanhMuc.css';

const QuanLyDanhMuc = () => {
  const [danhMucs, setDanhMucs] = useState([]);
  const [form, setForm] = useState({ id: null, tenDanhMuc: '', moTa: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchDanhMucs();
  }, []);

  const fetchDanhMucs = async () => {
    try {
      const res = await axios.get('/danh-muc');
      setDanhMucs(res.data);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách:', err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await axios.put(`/danh-muc/${form.id}`, form);
      } else {
        await axios.post('/danh-muc', form);
      }
      setForm({ id: null, tenDanhMuc: '', moTa: '' });
      setIsEditing(false);
      fetchDanhMucs();
    } catch (err) {
      console.error('Lỗi khi lưu danh mục:', err);
    }
  };

  const handleEdit = (dm) => {
    setForm(dm);
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa?')) {
      try {
        await axios.delete(`/danh-muc/${id}`);
        fetchDanhMucs();
      } catch (err) {
        console.error('Lỗi khi xóa:', err);
      }
    }
  };

  return (
    <div className="container-danhmuc">
      <h2>Quản Lý Danh Mục</h2>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên danh mục</label>
            <input
              type="text"
              name="tenDanhMuc"
              value={form.tenDanhMuc}
              onChange={handleChange}
              placeholder="Nhập tên danh mục"
              required
            />
          </div>

          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              name="moTa"
              value={form.moTa}
              onChange={handleChange}
              placeholder="Nhập mô tả"
            />
          </div>

          <button type="submit" className="btn-save">
            {isEditing ? 'Cập nhật' : 'Thêm mới'}
          </button>
        </form>
      </div>

      <div className="list-container">
        <h3>Danh sách danh mục</h3>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên danh mục</th>
              <th>Mô tả</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {danhMucs.map((dm) => (
              <tr key={dm.id}>
                <td>{dm.id}</td>
                <td>{dm.tenDanhMuc}</td>
                <td>{dm.moTa}</td>
                <td>
                  <button className="btn-edit" onClick={() => handleEdit(dm)}>
                    Sửa
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(dm.id)}>
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {danhMucs.length === 0 && (
              <tr>
                <td colSpan="4">Không có danh mục nào.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuanLyDanhMuc;
