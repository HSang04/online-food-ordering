import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../../services/axiosInstance";
import './MenuMonAn.css';

const MenuMonAn = () => {
  const [dsMonAn, setDsMonAn] = useState([]);
  const [dsMonAnGoc, setDsMonAnGoc] = useState([]);
  const [dsDanhMuc, setDsDanhMuc] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("khuyen-mai"); // Mặc định sắp xếp theo khuyến mãi
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  const navigate = useNavigate();


  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  }, []); 

  const fetchMonAn = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/mon-an/active'); 
      
      // Fetch thống kê đánh giá cho mỗi món ăn
      const monAnWithRatings = await Promise.all(
        res.data.map(async (mon) => {
          try {
            const ratingRes = await axios.get(`/danh-gia-mon-an/mon-an/${mon.id}/thong-ke`);
            return {
              ...mon,
              thongKeDanhGia: ratingRes.data
            };
          } catch (error) {
            // Nếu không có đánh giá, trả về món ăn với thông tin rating mặc định
            return {
              ...mon,
              thongKeDanhGia: {
                diemTrungBinh: 0,
                tongSoDanhGia: 0
              }
            };
          }
        })
      );
      
      setDsMonAn(monAnWithRatings);
      setDsMonAnGoc(monAnWithRatings);
    } catch (err) {
      console.error("Lỗi lấy danh sách món ăn:", err);
      try {
        const res = await axios.get('/mon-an');
        const activeItems = res.data.filter(mon => mon.trangThai === 1); 
        setDsMonAn(activeItems);
        setDsMonAnGoc(activeItems);
      } catch (fallbackErr) {
        console.error("Lỗi lấy danh sách món ăn (fallback):", fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchDanhMuc = async () => {
    try {
      const res = await axios.get('/danh-muc');
      setDsDanhMuc(res.data);
    } catch (err) {
      console.error("Lỗi lấy danh mục:", err);
    }
  };

  useEffect(() => {
    fetchMonAn();
    fetchDanhMuc();
  }, []);

  const applyFilters = useCallback(() => {
    let filteredData = [...dsMonAnGoc];

    if (keyword.trim()) {
      filteredData = filteredData.filter(mon =>
        mon.tenMonAn.toLowerCase().includes(keyword.toLowerCase()) ||
        mon.moTa?.toLowerCase().includes(keyword.toLowerCase())
      );
    }

    if (selectedCategory) {
      filteredData = filteredData.filter(mon => 
        mon.danhMuc?.id === selectedCategory || mon.danhMucId === selectedCategory ||
        mon.danhMuc?.id === parseInt(selectedCategory) || mon.danhMucId === parseInt(selectedCategory)
      );
    }

    if (sortBy) {
      filteredData = filteredData.sort((a, b) => {
        switch (sortBy) {
          case "gia-tang":
            return a.giaKhuyenMai - b.giaKhuyenMai;
          case "gia-giam":
            return b.giaKhuyenMai - a.giaKhuyenMai;
          case "khuyen-mai":
            // Sắp xếp ưu tiên món có khuyến mãi và phần trăm giảm giá cao nhất
            const aPromoScore = a.coKhuyenMai ? (a.phanTramGiamGia || 0) : -1;
            const bPromoScore = b.coKhuyenMai ? (b.phanTramGiamGia || 0) : -1;
            return bPromoScore - aPromoScore;
          case "rating-cao":
            return (b.thongKeDanhGia?.diemTrungBinh || 0) - (a.thongKeDanhGia?.diemTrungBinh || 0);
          case "ban-chay":
            return (b.soLuongDaBan || 0) - (a.soLuongDaBan || 0);
          default:
            return 0;
        }
      });
    }

    setDsMonAn(filteredData);
    setCurrentPage(1);
  }, [dsMonAnGoc, keyword, selectedCategory, sortBy]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dsMonAn.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(dsMonAn.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    // Cuộn lên đầu trang khi chuyển trang
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setSidebarOpen(false);
    // Cuộn lên đầu trang khi thay đổi danh mục
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFilter = () => {
    setKeyword("");
    setSelectedCategory("");
    setSortBy("khuyen-mai"); // Reset về mặc định là khuyến mãi
    setCurrentPage(1);
    // Cuộn lên đầu trang khi reset filter
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPaginationPages = () => {
    const pages = [];
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);

    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => paginate(1)}
          className="page-btn"
        >
          1
        </button>
      );
      
      if (startPage > 2) {
        pages.push(<span key="dots1" className="page-dots">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => paginate(i)}
          className={`page-btn ${i === currentPage ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<span key="dots2" className="page-dots">...</span>);
      }
      
      pages.push(
        <button
          key={totalPages}
          onClick={() => paginate(totalPages)}
          className="page-btn"
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <div className="restaurant-layout">
      <div className="top-header">
        <div className="container">
          <div className="header-content">
            <button 
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <i className="fas fa-bars"></i>
              <span>DANH MỤC MÓN ĂN</span>
            </button>
            
            <div className="search-bar">
              <div className="search-input-wrapper">
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Tìm kiếm món ăn..."
                  className="main-search"
                  onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="filter-bar">
        <div className="container">
          <div className="filter-controls">
            <div className="filter-options">
              <button className="filter-btn">
                <i className="fas fa-filter"></i>
                Bộ lọc
              </button>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="">Sắp xếp theo</option>
                <option value="khuyen-mai">Khuyến mãi hot</option>
                <option value="gia-tang">Giá: Thấp đến cao</option>
                <option value="gia-giam">Giá: Cao đến thấp</option>
                <option value="rating-cao">Đánh giá cao nhất</option>
                <option value="ban-chay">Bán chạy nhất</option>
              </select>

              {(selectedCategory || sortBy !== "khuyen-mai" || keyword) && (
                <button onClick={resetFilter} className="reset-btn">
                  <i className="fas fa-times"></i>
                  Đặt lại bộ lọc
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="container">
          <div className="content-wrapper">
            <div className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
              <div className="sidebar-header">
                <h3>
                  <i className="fas fa-utensils"></i>
                  DANH MỤC MÓN ĂN
                </h3>
              </div>
              
              <div className="category-list">
                <div 
                  className={`category-item ${!selectedCategory ? 'active' : ''}`}
                  onClick={() => handleCategorySelect("")}
                >
                  <span>TẤT CẢ MÓN ĂN</span>
                </div>
                
                {dsDanhMuc.map((category) => (
                  <div 
                    key={category.id}
                    className={`category-item ${selectedCategory === category.id.toString() ? 'active' : ''}`}
                    onClick={() => handleCategorySelect(category.id.toString())}
                  >
                    <span>{category.tenDanhMuc.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>

            {sidebarOpen && (
              <div 
                className="sidebar-overlay"
                onClick={() => setSidebarOpen(false)}
              ></div>
            )}

            <div className="main-section">
              {loading && (
                <div className="loading-wrapper">
                  <div className="loading-spinner"></div>
                  <p>Đang tải...</p>
                </div>
              )}

              {dsMonAn.length > 0 && (
                <div className="pagination-info">
                  Hiển thị {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, dsMonAn.length)} của {dsMonAn.length} món ăn
                  {dsMonAn.filter(mon => mon.coKhuyenMai).length > 0 && (
                    <span className="promotion-count">
                      • {dsMonAn.filter(mon => mon.coKhuyenMai).length} món đang có khuyến mãi
                    </span>
                  )}
            
                  {sortBy === "khuyen-mai" && (
                    <span className="default-sort-info">
                      • Ưu tiên hiển thị khuyến mãi hot nhất
                    </span>
                  )}
                </div>
              )}

              <div className="products-grid">
                {currentItems.length > 0 ? (
                  currentItems.map((mon, index) => {
                    return (
                      <div key={mon.id || `mon-${index}`} className="product-card">
                        {mon.coKhuyenMai && mon.phanTramGiamGia > 0 && (
                          <div className="sale-badge">
                            Giảm {mon.phanTramGiamGia}%
                          </div>
                        )}
                        
                      
                        {(mon.soLuongDaBan || 0) >= 50 && (
                          <div className="bestseller-badge">
                            <i className="fas fa-fire"></i>
                            Bán chạy
                          </div>
                        )}
                        
                        <div 
                          className="product-image clickable"
                          onClick={() => navigate(`/chi-tiet-mon-an/${mon.id}`)}
                        >
                          {mon.hinhAnhMonAns?.length > 0 ? (
                            <img
                              src={mon.hinhAnhMonAns[0].duongDan}
                              alt={mon.tenMonAn}
                              className="dish-image"
                            />
                          ) : (
                            <div className="no-image">
                              <i className="fas fa-utensils"></i>
                            </div>
                          )}
                        </div>
                        
                        <div className="product-info">
                          <div className="product-labels">
                            <span className="label">{mon.danhMuc?.tenDanhMuc || "Món ăn"}</span>
                          </div>
                          
                          <h3 
                            className="product-name clickable"
                            onClick={() => navigate(`/chi-tiet-mon-an/${mon.id}`)}
                          >
                            {mon.tenMonAn}
                          </h3>

                       
                          <div className="product-stats">
                            {(mon.soLuongDaBan || 0) > 0 && (
                              <div className="sold-info">
                                <i className="fas fa-shopping-cart"></i>
                                <span className="sold-number">{mon.soLuongDaBan}</span>
                                <span className="sold-text">đã bán</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="price-section">
                            {mon.coKhuyenMai ? (
                              <div>
                                <div className="price-promotion">
                                  {mon.giaKhuyenMai.toLocaleString()} đ
                                </div>
                                <div className="price-original">
                                  {mon.gia.toLocaleString()} đ
                                </div>
                              </div>
                            ) : (
                              <div className="price-normal">
                                {mon.gia.toLocaleString()} đ
                              </div>
                            )}
                          </div>
                          
                          <button 
                            className="buy-btn"
                            onClick={() => navigate(`/chi-tiet-mon-an/${mon.id}`)}
                          >
                            XEM CHI TIẾT
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  !loading && (
                    <div className="no-results">
                      <i className="fas fa-search"></i>
                      <h3>Không tìm thấy món ăn nào</h3>
                      <p>Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                    </div>
                  )
                )}
              </div>

              {totalPages > 1 && (
                <div className="pagination-container">
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-btn"
                  >
                    <i className="fas fa-chevron-left"></i> Trước
                  </button>

                  <div className="pagination-pages">
                    {renderPaginationPages()}
                  </div>

                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-btn"
                  >
                    Sau <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MenuMonAn;