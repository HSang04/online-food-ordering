import React, { useEffect, useState } from "react";
import axios from "../../../services/axiosInstance";
import { useNavigate } from "react-router-dom";
import './QuanLyMonAn.css';

const QuanLyMonAn = () => {
  const [dsMonAn, setDsMonAn] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const res = await axios.get('/mon-an/dto');
      setDsMonAn(res.data);
    } catch (err) {
      console.error("Lỗi lấy danh sách món ăn:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const timKiem = async () => {
    try {
      const res = await axios.get(`/mon-an/search/dto?keyword=${keyword}`);
      setDsMonAn(res.data);
    } catch (err) {
      console.error("Lỗi tìm kiếm", err);
    }
  };

  const xoaMonAn = async (id) => {
    if (window.confirm("Bạn có chắc muốn xóa?")) {
      try {
        await axios.delete(`/mon-an/${id}`);
        fetchData();
      } catch (err) {
        console.error("Lỗi xóa món ăn", err);
      }
    }
  };

  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === "asc" ? "desc" : "asc";
    setSortField(field);
    setSortDirection(newDirection);

    const sorted = [...dsMonAn].sort((a, b) => {
      let aValue, bValue;

      if (field === "danhMuc") {
        aValue = a.danhMuc?.tenDanhMuc || "";
        bValue = b.danhMuc?.tenDanhMuc || "";
      } else if (field === "trangThai") {
        aValue = a.trangThai;
        bValue = b.trangThai;
      } else if (field === "gia") {

        aValue = a.coKhuyenMai ? a.giaKhuyenMai : a.gia;
        bValue = b.coKhuyenMai ? b.giaKhuyenMai : b.gia;
      } else {
        aValue = a[field];
        bValue = b[field];
      }

      if (aValue < bValue) return newDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return newDirection === "asc" ? 1 : -1;
      return 0;
    });

    setDsMonAn(sorted);
  };


  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };


  const renderPrice = (mon) => {
    if (mon.coKhuyenMai) {
      return (
        <div className="price-container">
          <div className="sale-price">
            {formatPrice(mon.giaKhuyenMai)}
            {mon.phanTramGiamGia > 0 && (
              <span className="discount-badge">-{mon.phanTramGiamGia}%</span>
            )}
          </div>
          <div className="original-price">
            {formatPrice(mon.gia)}
          </div>
        </div>
      );
    } else {
      return (
        <div className="normal-price">
          {formatPrice(mon.gia)}
        </div>
      );
    }
  };

  return (
    <div className="monan-container">
      <h2 className="title">Quản lý món ăn</h2>
      <div className="search-bar">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm kiếm món ăn..."
          className="search-input"
        />
        <button onClick={timKiem} className="btn-search">Tìm</button>
        <button onClick={() => navigate("/them-sua-mon-an")} className="btn-add">Thêm món ăn</button>
      </div>

      <div className="sort-buttons">
        <button onClick={() => handleSort("gia")} className="btn-sort">
          Sắp xếp theo Giá {sortField === "gia" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
        </button>
        <button onClick={() => handleSort("danhMuc")} className="btn-sort">
          Sắp xếp theo Danh mục {sortField === "danhMuc" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
        </button>
        <button onClick={() => handleSort("trangThai")} className="btn-sort">
          Sắp xếp theo Trạng thái {sortField === "trangThai" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
        </button>
      </div>

      <table className="monan-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên món</th>
            <th>Danh mục</th>
            <th>Ảnh</th>
            <th>Giá</th>
            <th>Mô tả</th>
            <th>Trạng thái</th> 
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {dsMonAn.map((mon) => (
            <tr key={mon.id}>
              <td>{mon.id}</td>
              <td>{mon.tenMonAn}</td>
              <td>{mon.danhMuc?.tenDanhMuc || "Không có"}</td>
              <td>
                {mon.hinhAnhMonAns?.length > 0 ? (
                  <img
                    src={mon.hinhAnhMonAns[0].duongDan}
                    alt="Ảnh món ăn"
                    className="monan-img"
                  />
                ) : (
                  <span className="no-img">Không có ảnh</span>
                )}
              </td>
              <td>{renderPrice(mon)}</td>
              <td>{mon.moTa}</td>
              <td>
                <span className={`status ${mon.trangThai === 1 ? 'active' : 'inactive'}`}>
                  {mon.trangThai === 1 ? "Đang bán" : "Ngừng kinh doanh"}
                </span>
              </td>
              <td>
                <button
                  onClick={() => navigate(`/them-sua-mon-an/${mon.id}`)}
                  className="btn-edit"
                >
                  Sửa
                </button>
                <button
                  onClick={() => xoaMonAn(mon.id)}
                  className="btn-delete"
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QuanLyMonAn;