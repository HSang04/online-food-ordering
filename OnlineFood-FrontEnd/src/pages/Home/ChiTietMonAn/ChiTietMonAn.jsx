import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../../services/axiosInstance";
import './ChiTietMonAn.css';

const ChiTietMonAn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [monAn, setMonAn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [dsMonAnLienQuan, setDsMonAnLienQuan] = useState([]);
  
  const [danhGiaList, setDanhGiaList] = useState([]);
  const [thongKeDanhGia, setThongKeDanhGia] = useState(null);
  const [danhGiaCuaToi, setDanhGiaCuaToi] = useState(null);
  const [loadingDanhGia, setLoadingDanhGia] = useState(false);
  const [sapXepDanhGia, setSapXepDanhGia] = useState("moi_nhat");
  
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    soSao: 5,
    noiDung: ""
  });

  const idNguoiDung = localStorage.getItem("idNguoiDung");
  const isLoggedIn = !!idNguoiDung;

  // Reset quantity về 1 khi chuyển sang món ăn khác (id thay đổi)
  useEffect(() => {
    setQuantity(1);
    setSelectedImage(0); // Reset selected image về 0 luôn
    
    // Scroll lên đầu trang mỗi khi chuyển sang món ăn khác
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, [id]); 

  const fetchChiTietMonAn = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/mon-an/${id}/dto`);
      setMonAn(res.data);
      
      if (res.data.danhMuc?.id) {
        const relatedRes = await axios.get(`/mon-an/category/${res.data.danhMuc.id}`);
        setDsMonAnLienQuan(relatedRes.data.filter(item => item.id !== parseInt(id)).slice(0, 4));
      }
    } catch (err) {
      console.error("Lỗi lấy chi tiết món ăn:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchDanhGia = useCallback(async () => {
    setLoadingDanhGia(true);
    try {
      
      const danhGiaRes = await axios.get(`/danh-gia-mon-an/mon-an/${id}?sapXep=${sapXepDanhGia}`);
      setDanhGiaList(danhGiaRes.data);

    
      const thongKeRes = await axios.get(`/danh-gia-mon-an/mon-an/${id}/thong-ke`);
      setThongKeDanhGia(thongKeRes.data);

   
      if (isLoggedIn) {
        try {
          const myReviewRes = await axios.get(`/danh-gia-mon-an/mon-an/${id}/nguoi-dung/${idNguoiDung}`);
          setDanhGiaCuaToi(myReviewRes.data);
          setReviewForm({
            soSao: myReviewRes.data.soSao,
            noiDung: myReviewRes.data.noiDung || ""
          });
        } catch (error) {
        
          setDanhGiaCuaToi(null);
          setReviewForm({ soSao: 5, noiDung: "" });
        }
      }
    } catch (err) {
      console.error("Lỗi lấy đánh giá:", err);
    } finally {
      setLoadingDanhGia(false);
    }
  }, [id, sapXepDanhGia, idNguoiDung, isLoggedIn]);

  useEffect(() => {
    fetchChiTietMonAn();
  }, [fetchChiTietMonAn]);

  useEffect(() => {
    if (monAn) {
      fetchDanhGia();
    }
  }, [monAn, fetchDanhGia]);

  const handleQuantityChange = (type) => {
    if (type === 'increase') {
      setQuantity(prev => prev + 1);
    } else {
      setQuantity(prev => prev > 1 ? prev - 1 : 1);
    }
  };

  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      alert("Bạn cần đăng nhập trước khi thêm vào giỏ hàng.");
      return;
    }

    try {
      await axios.post(`/gio-hang/${idNguoiDung}/add`, null, {
        params: {
          monAnId: monAn.id,
          soLuong: quantity
        }
      });

      alert(`Đã thêm ${quantity} "${monAn.tenMonAn}" vào giỏ hàng!`);
    } catch (error) {
      console.error("Lỗi thêm vào giỏ:", error);
      alert("Thêm vào giỏ hàng thất bại.");
    }
  };

  const handleBuyNow = async () => {
    if (!isLoggedIn) {
      alert("Bạn cần đăng nhập trước khi đặt hàng.");
      return;
    }

    try {
      await axios.post(`/gio-hang/${idNguoiDung}/add`, null, {
        params: {
          monAnId: monAn.id,
          soLuong: quantity
        }
      });

      navigate('/cart');
    } catch (error) {
      console.error("Lỗi đặt hàng:", error);
      alert("Đặt hàng thất bại.");
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!isLoggedIn) {
      alert("Bạn cần đăng nhập để đánh giá món ăn.");
      return;
    }

    if (!reviewForm.noiDung.trim()) {
      alert("Vui lòng nhập nội dung đánh giá.");
      return;
    }

    try {
      await axios.post(`/danh-gia-mon-an/mon-an/${id}/nguoi-dung/${idNguoiDung}`, {
        soSao: reviewForm.soSao,
        noiDung: reviewForm.noiDung.trim()
      });

      alert(danhGiaCuaToi ? "Cập nhật đánh giá thành công!" : "Thêm đánh giá thành công!");
      setShowReviewForm(false);
      fetchDanhGia(); // Refresh danh sách đánh giá
    } catch (error) {
      console.error("Lỗi gửi đánh giá:", error);
      alert("Gửi đánh giá thất bại.");
    }
  };

  const handleDeleteReview = async () => {
    if (!danhGiaCuaToi || !window.confirm("Bạn có chắc muốn xóa đánh giá này?")) {
      return;
    }

    try {
      await axios.delete(`/danh-gia-mon-an/${danhGiaCuaToi.id}`);
      alert("Xóa đánh giá thành công!");
      setDanhGiaCuaToi(null);
      setReviewForm({ soSao: 5, noiDung: "" });
      fetchDanhGia();
    } catch (error) {
      console.error("Lỗi xóa đánh giá:", error);
      alert("Xóa đánh giá thất bại.");
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const calculateTotalPrice = () => {
    const giaHienThi = monAn.coKhuyenMai ? monAn.giaKhuyenMai : monAn.gia;
    return giaHienThi * quantity;
  };

  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating, interactive = false, onStarClick = null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= rating ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
          onClick={() => interactive && onStarClick && onStarClick(i)}
          style={{
            color: i <= rating ? '#ffc107' : '#e4e5e9',
            cursor: interactive ? 'pointer' : 'default',
            fontSize: interactive ? '1.5rem' : '1rem',
            marginRight: '2px'
          }}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin món ăn...</p>
      </div>
    );
  }

  if (!monAn) {
    return (
      <div className="error-container">
        <i className="fas fa-exclamation-triangle"></i>
        <h2>Không tìm thấy món ăn</h2>
        <button onClick={() => navigate('/menu')} className="back-btn">
          Quay lại menu
        </button>
      </div>
    );
  }

  return (
    <div className="chi-tiet-container">
      
      <div className="breadcrumb">
        <span onClick={() => navigate('/menu')} className="breadcrumb-item">
          Menu
        </span>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-item active">{monAn.tenMonAn}</span>
      </div>

      <div className="chi-tiet-content">
      
        <div className="image-section">
          <div className="main-image">
            {monAn.hinhAnhMonAns && monAn.hinhAnhMonAns.length > 0 ? (
              <img
                src={monAn.hinhAnhMonAns[selectedImage]?.duongDan}
                alt={monAn.tenMonAn}
                className="main-dish-img"
              />
            ) : (
              <div className="no-main-image">
                <i className="fas fa-utensils"></i>
                <span>Không có ảnh</span>
              </div>
            )}
          </div>
          
          {monAn.hinhAnhMonAns && monAn.hinhAnhMonAns.length > 1 && (
            <div className="thumbnail-list">
              {monAn.hinhAnhMonAns.map((img, index) => (
                <div
                  key={index}
                  className={`thumbnail ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                >
                  <img src={img.duongDan} alt={`${monAn.tenMonAn} ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        
        <div className="info-section">
          <div className="dish-header">
            <h1 className="dish-title">{monAn.tenMonAn}</h1>
            <span className="category-tag">
              {monAn.danhMuc?.tenDanhMuc || "Khác"}
            </span>
            
         
            {thongKeDanhGia && thongKeDanhGia.tongSoDanhGia > 0 && (
              <div className="simple-rating-info">
                <div className="rating-stars">
                  {renderStars(Math.round(thongKeDanhGia.diemTrungBinh))}
                </div>
                <span className="rating-text">
                  {thongKeDanhGia.diemTrungBinh}/5 ({thongKeDanhGia.tongSoDanhGia} đánh giá)
                </span>
              </div>
            )}
          </div>

        
          <div className="price-section">
            {monAn.coKhuyenMai ? (
              <div className="price-with-promotion">
                <div className="price-row">
                  <span className="current-price">
                    {formatPrice(monAn.giaKhuyenMai)}
                  </span>
                  <span className="original-price">
                    {formatPrice(monAn.gia)}
                  </span>
                </div>
                <div className="discount-info">
                  <span className="discount-badge">
                    -{monAn.phanTramGiamGia}%
                  </span>
                  <span className="savings-text">
                    Tiết kiệm: {formatPrice(monAn.soTienTietKiem || (monAn.gia - monAn.giaKhuyenMai))}
                  </span>
                </div>
              </div>
            ) : (
              <span className="current-price">
                {formatPrice(monAn.gia)}
              </span>
            )}
          </div>

          <div className="description-section">
            <h3>Mô tả món ăn</h3>
            <p className="description-text">
              {monAn.moTa || "Chưa có mô tả cho món ăn này."}
            </p>
          </div>

         
          <div className="order-section">
            <div className="quantity-selector">
              <label>Số lượng:</label>
              <div className="quantity-controls">
                <button 
                    onClick={() => handleQuantityChange('decrease')}
                    className="quantity-btn decrease"
                    disabled={quantity <= 1}
                >
                    –
                </button>
                <span className="quantity-display">{quantity}</span>
                <button 
                    onClick={() => handleQuantityChange('increase')}
                    className="quantity-btn increase"
                >
                    +
                </button>
              </div>
            </div>

            <div className="total-price">
              <span>Tổng cộng: </span>
              <span className="total-amount">{formatPrice(calculateTotalPrice())}</span>
              {monAn.coKhuyenMai && (
                <div className="total-savings" style={{ fontSize: "0.9rem", color: "#28a745", marginTop: "5px" }}>
                  (Tiết kiệm: {formatPrice((monAn.gia - monAn.giaKhuyenMai) * quantity)})
                </div>
              )}
            </div>

            <div className="action-buttons">
              <button onClick={handleAddToCart} className="add-to-cart-btn">
                <i className="fas fa-cart-plus"></i>
                Thêm vào giỏ hàng
              </button>
              <button onClick={handleBuyNow} className="buy-now-btn">
                <i className="fas fa-bolt"></i>
                Đặt ngay
              </button>
            </div>
          </div>
        </div>
      </div>

    
      <div className="reviews-section">
        <div className="reviews-header">
          <h2 className="reviews-title">
            Đánh giá món ăn
            {thongKeDanhGia && (
              <span className="reviews-count">({thongKeDanhGia.tongSoDanhGia} đánh giá)</span>
            )}
          </h2>
        </div>

       
        {thongKeDanhGia && thongKeDanhGia.tongSoDanhGia > 0 && (
          <div className="rating-summary">
            <div className="rating-overview">
              <div className="rating-stars">
                {renderStars(Math.round(thongKeDanhGia.diemTrungBinh))}
              </div>
              <span className="rating-text">
                {thongKeDanhGia.diemTrungBinh}/5 ({thongKeDanhGia.tongSoDanhGia} đánh giá)
              </span>
            </div>
            <div className="rating-distribution">
              {thongKeDanhGia.phanPhoSao.map((count, index) => (
                <div key={index} className="rating-bar">
                  <span className="star-count">{index + 1}★</span>
                  <div className="bar">
                    <div 
                      className="bar-fill" 
                      style={{
                        width: `${(count / thongKeDanhGia.tongSoDanhGia) * 100}%`
                      }}
                    />
                  </div>
                  <span className="count-text">{count}</span>
                </div>
              )).reverse()}
            </div>
          </div>
        )}

      
        {isLoggedIn && (
          <div className="my-review-section">
            {danhGiaCuaToi ? (
              <div className="my-review-card">
                <div className="my-review-header">
                  <h4>Đánh giá của tôi</h4>
                  <div className="my-review-actions">
                    <button 
                      className="edit-review-btn"
                      onClick={() => setShowReviewForm(true)}
                    >
                      <i className="fas fa-edit"></i> Sửa
                    </button>
                    <button 
                      className="delete-review-btn"
                      onClick={handleDeleteReview}
                    >
                      <i className="fas fa-trash"></i> Xóa
                    </button>
                  </div>
                </div>
                <div className="my-review-content">
                  <div className="review-rating">
                    {renderStars(danhGiaCuaToi.soSao)}
                  </div>
                  <p className="review-text">{danhGiaCuaToi.noiDung}</p>
                  <span className="review-date">
                    {formatDateTime(danhGiaCuaToi.thoiGianDanhGia)}
                  </span>
                </div>
              </div>
            ) : (
              <button 
                className="add-review-btn"
                onClick={() => setShowReviewForm(true)}
              >
                <i className="fas fa-star"></i>
                Viết đánh giá
              </button>
            )}
          </div>
        )}

        {!isLoggedIn && (
          <div className="login-prompt">
            <p>Đăng nhập để viết đánh giá</p>
          </div>
        )}

       
        {showReviewForm && (
          <div className="review-modal-overlay" onClick={() => setShowReviewForm(false)}>
            <div className="review-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{danhGiaCuaToi ? 'Sửa đánh giá' : 'Viết đánh giá'}</h3>
                <button 
                  className="close-modal-btn"
                  onClick={() => setShowReviewForm(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <form onSubmit={handleSubmitReview} className="review-form">
                <div className="form-group">
                  <label>Đánh giá sao:</label>
                  <div className="star-rating">
                    {renderStars(reviewForm.soSao, true, (rating) => 
                      setReviewForm(prev => ({...prev, soSao: rating}))
                    )}
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="noiDung">Nội dung đánh giá:</label>
                  <textarea
                    id="noiDung"
                    value={reviewForm.noiDung}
                    onChange={(e) => setReviewForm(prev => ({...prev, noiDung: e.target.value}))}
                    placeholder="Chia sẻ trải nghiệm của bạn về món ăn này..."
                    rows="4"
                    required
                  />
                </div>
                
                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowReviewForm(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="submit-btn">
                    {danhGiaCuaToi ? 'Cập nhật' : 'Gửi đánh giá'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

       
        <div className="reviews-list-section">
          <div className="reviews-controls">
            <label htmlFor="sortSelect">Sắp xếp theo:</label>
            <select
              id="sortSelect"
              value={sapXepDanhGia}
              onChange={(e) => setSapXepDanhGia(e.target.value)}
              className="sort-select"
            >
              <option value="moi_nhat">Mới nhất</option>
              <option value="cu_nhat">Cũ nhất</option>
              <option value="tich_cuc">Tích cực</option>
              <option value="tieu_cuc">Tiêu cực</option>
            </select>
          </div>

          {loadingDanhGia ? (
            <div className="loading-reviews">
              <div className="loading-spinner"></div>
              <p>Đang tải đánh giá...</p>
            </div>
          ) : danhGiaList.length > 0 ? (
            <div className="reviews-list">
              {danhGiaList.map((danhGia) => (
                <div key={danhGia.id} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <span className="reviewer-name">
                        {danhGia.nguoiDung?.hoTen }
                      </span>
                      <div className="review-rating">
                        {renderStars(danhGia.soSao)}
                      </div>
                    </div>
                    <span className="review-date">
                      {formatDateTime(danhGia.thoiGianDanhGia)}
                    </span>
                  </div>
                  <div className="review-content">
                    <p className="review-text">{danhGia.noiDung}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-reviews">
              <i className="fas fa-comment-slash"></i>
              <p>Chưa có đánh giá nào cho món ăn này.</p>
              {isLoggedIn && (
                <button 
                  className="add-review-btn"
                  onClick={() => setShowReviewForm(true)}
                >
                  Hãy là người đầu tiên đánh giá!
                </button>
              )}
            </div>
          )}
        </div>
      </div>

     
      {dsMonAnLienQuan.length > 0 && (
        <div className="related-section">
          <h2 className="related-title">Món ăn liên quan</h2>
          <div className="related-grid">
            {dsMonAnLienQuan.map((mon) => (
              <div 
                key={mon.id} 
                className="related-card"
                onClick={() => navigate(`/chi-tiet-mon-an/${mon.id}`)}
              >
                <div className="related-image">
                  {mon.hinhAnhMonAns?.length > 0 ? (
                    <img
                      src={mon.hinhAnhMonAns[0].duongDan}
                      alt={mon.tenMonAn}
                    />
                  ) : (
                    <div className="no-related-image">
                      <i className="fas fa-utensils"></i>
                    </div>
                  )}
                </div>
                <div className="related-info">
                  <h4 className="related-name">{mon.tenMonAn}</h4>
                  <div className="related-price-section">
                    {mon.coKhuyenMai ? (
                      <>
                        <span className="related-current-price" style={{ color: "red", fontWeight: "bold" }}>
                          {formatPrice(mon.giaKhuyenMai)}
                        </span>
                        <span className="related-original-price" style={{ 
                          textDecoration: "line-through", 
                          color: "gray", 
                          marginLeft: "5px", 
                          fontSize: "12px" 
                        }}>
                          {formatPrice(mon.gia)}
                        </span>
                      </>
                    ) : (
                      <span className="related-price">{formatPrice(mon.gia)}</span>
                    )}
                  </div>
                  {mon.coKhuyenMai && (
                    <div className="related-discount-badge" style={{ 
                      backgroundColor: "red", 
                      color: "white", 
                      padding: "2px 6px", 
                      borderRadius: "3px", 
                      fontSize: "10px",
                      marginTop: "4px",
                      display: "inline-block"
                    }}>
                      -{mon.phanTramGiamGia}%
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    
      <div className="back-to-menu">
        <button 
          onClick={() => navigate('/menu')} 
          className="back-menu-btn"
        >
          <i className="fas fa-arrow-left"></i>
          Quay lại menu
        </button>
      </div>
    </div>
  );
};

export default ChiTietMonAn;