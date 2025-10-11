import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Eye, RefreshCw, DollarSign, CreditCard, Clock, CheckCircle, XCircle, AlertCircle, FileText, User, Package } from 'lucide-react';
import axios from '../../../services/axiosInstance';
import './QuanLyGiaoDich.css';

const QuanLyGiaoDich = () => {
  const [hoaDonList, setHoaDonList] = useState([]);
  const [filteredHoaDon, setFilteredHoaDon] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHoaDon, setSelectedHoaDon] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    trangThai: 'ALL',
    phuongThuc: 'ALL',
    ngayBatDau: '',
    ngayKetThuc: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const getAuthToken = () => {
    return localStorage.getItem('jwt');
  };

  const loadHoaDonData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
        const jwt = getAuthToken();
        const response = await axios.get('/hoa-don', {
        headers: {
            'Authorization': `Bearer ${jwt}`
        }
        });

        const sortedData = response.data.sort((a, b) => {
        return new Date(b.thoiGianThanhToan) - new Date(a.thoiGianThanhToan);
        });

        setHoaDonList(sortedData);
        setFilteredHoaDon(sortedData);
    } catch (error) {
        console.error('Lỗi khi tải dữ liệu hóa đơn:', error);
        setError('Có lỗi xảy ra khi tải dữ liệu hóa đơn: ' + (error.response?.data?.message || error.message));
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHoaDonData();
  }, [loadHoaDonData]);

  const viewHoaDonDetail = async (hoaDonId, donHangId) => {
    setLoading(true);
    try {
        const jwt = getAuthToken();
        const vaiTro = localStorage.getItem('vaiTro');
        const idNguoiDung = localStorage.getItem('idNguoiDung');

        if (!jwt || !idNguoiDung) {
        alert('Vui lòng đăng nhập để xem hóa đơn');
        return;
        }

        const userResponse = await axios.get(`/nguoi-dung/secure/${idNguoiDung}`, {
        headers: {
            Authorization: `Bearer ${jwt}`, 
        },
        });
        
        const userEmail = userResponse.data.email;

        const response = await axios.get(`/hoa-don/don-hang/${donHangId}`, {
        headers: {
            'Authorization': `Bearer ${jwt}`,
            'User-Email': userEmail,
            'User-Role': vaiTro
        }
        });

        setSelectedHoaDon(response.data);
        setShowDetailModal(true);
    } catch (error) {
        console.error('Lỗi khi xem chi tiết hóa đơn:', error);
        
        if (error.response?.status === 401) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (error.response?.status === 403) {
        alert('Bạn không có quyền xem hóa đơn này.');
        } else if (error.response?.status === 404) {
        alert('Không tìm thấy hóa đơn cho đơn hàng này');
        } else {
        alert('Có lỗi xảy ra khi xem chi tiết hóa đơn: ' + (error.response?.data?.message || error.message));
        }
    } finally {
        setLoading(false);
    }
  };

  const capNhatThanhToanHoanThanh = async (donHangId) => {
    if (!window.confirm('Xác nhận đã nhận được thanh toán cho đơn hàng này?')) {
      return;
    }

    setLoading(true);
    try {
      const jwt = getAuthToken();
      const response = await axios.put(`/hoa-don/cap-nhat-hoan-thanh/${donHangId}`, {}, {
        headers: {
          'Authorization': `Bearer ${jwt}`,
        }
      });

      alert(response.data.message || 'Đã cập nhật trạng thái thanh toán thành công');
      await loadHoaDonData();
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái:', error);
      alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = useCallback(() => {
    let filtered = hoaDonList;

    if (searchTerm) {
    filtered = filtered.filter(hd => 
        hd.hoTen?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hd.maGD?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hd.soDienThoai?.includes(searchTerm) ||
        hd.donHang?.id?.toString().includes(searchTerm) ||
        hd.id?.toString().includes(searchTerm)
    );
    }

    if (filters.trangThai !== 'ALL') {
    filtered = filtered.filter(hd => hd.trangThai === filters.trangThai);
    }

    if (filters.phuongThuc !== 'ALL') {
    filtered = filtered.filter(hd => hd.phuongThuc === filters.phuongThuc);
    }

    if (filters.ngayBatDau && filters.ngayKetThuc) {
    filtered = filtered.filter(hd => {
        const ngayThanhToan = new Date(hd.thoiGianThanhToan);
        const ngayBatDau = new Date(filters.ngayBatDau);
        const ngayKetThuc = new Date(filters.ngayKetThuc);
        ngayKetThuc.setHours(23, 59, 59, 999);
        return ngayThanhToan >= ngayBatDau && ngayThanhToan <= ngayKetThuc;
    });
    }

    filtered.sort((a, b) => {
    return new Date(b.thoiGianThanhToan) - new Date(a.thoiGianThanhToan);
    });

    setFilteredHoaDon(filtered);
    setCurrentPage(1);
  }, [hoaDonList, searchTerm, filters]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      trangThai: 'ALL',
      phuongThuc: 'ALL',
      ngayBatDau: '',
      ngayKetThuc: ''
    });
    setSearchTerm('');
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHoaDon.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHoaDon.length / itemsPerPage);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (trangThai) => {
    const statusConfig = {
      'DA_THANH_TOAN': { 
        icon: CheckCircle, 
        className: 'quanlygiaodich-status-badge paid', 
        text: 'Đã thanh toán' 
      },
      'CHUA_THANH_TOAN': { 
        icon: Clock, 
        className: 'quanlygiaodich-status-badge pending', 
        text: 'Chưa thanh toán' 
      },
      'HUY': { 
        icon: XCircle, 
        className: 'quanlygiaodich-status-badge cancelled', 
        text: 'Đã hủy' 
      }
    };

    const config = statusConfig[trangThai] || { 
      icon: AlertCircle, 
      className: 'quanlygiaodich-status-badge default', 
      text: trangThai 
    };
    
    const Icon = config.icon;

    return (
      <span className={config.className}>
        <Icon className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const getPaymentMethodBadge = (phuongThuc) => {
    const methodConfig = {
      'COD': { className: 'quanlygiaodich-payment-badge cod', text: 'Tiền mặt' },
      'VNPAY': { className: 'quanlygiaodich-payment-badge vnpay', text: 'VNPay' }
    };

    const config = methodConfig[phuongThuc] || { 
      className: 'quanlygiaodich-payment-badge default', 
      text: phuongThuc 
    };

    return (
      <span className={config.className}>
        <CreditCard className="w-3 h-3" />
        {config.text}
      </span>
    );
  };

  const statistics = {
    tongSoHoaDon: filteredHoaDon.length,
    daThanhToan: filteredHoaDon.filter(hd => hd.trangThai === 'DA_THANH_TOAN').length,
    chuaThanhToan: filteredHoaDon.filter(hd => hd.trangThai === 'CHUA_THANH_TOAN').length,
    tongDoanhThu: filteredHoaDon
      .filter(hd => hd.trangThai === 'DA_THANH_TOAN')
      .reduce((sum, hd) => sum + (hd.tongTien || 0), 0)
  };

  return (
    <div className="quanlygiaodich-container">
      <div className="quanlygiaodich-wrapper">
        <div className="quanlygiaodich-header">
          <div className="quanlygiaodich-header-content">
            <div className="quanlygiaodich-header-info">
              <h1>
                <FileText className="w-8 h-8 mr-3 text-blue-600" />
                Quản lý giao dịch
              </h1>
              <p>Quản lý và theo dõi các hóa đơn thanh toán</p>
            </div>
            <button
              onClick={loadHoaDonData}
              disabled={loading}
              className="quanlygiaodich-refresh-btn"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'quanlygiaodich-loading-spinner' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>

      
        {error && (
          <div className="quanlygiaodich-error-alert">
            <div className="quanlygiaodich-error-content">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          </div>
        )}

     
        <div className="quanlygiaodich-stats">
          <div className="quanlygiaodich-stat-card">
            <div className="quanlygiaodich-stat-content">
              <div className="quanlygiaodich-stat-icon blue">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="quanlygiaodich-stat-info">
                <p>Tổng hóa đơn</p>
                <p>{statistics.tongSoHoaDon}</p>
              </div>
            </div>
          </div>

          <div className="quanlygiaodich-stat-card">
            <div className="quanlygiaodich-stat-content">
              <div className="quanlygiaodich-stat-icon green">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="quanlygiaodich-stat-info">
                <p>Đã thanh toán</p>
                <p>{statistics.daThanhToan}</p>
              </div>
            </div>
          </div>

          <div className="quanlygiaodich-stat-card">
            <div className="quanlygiaodich-stat-content">
              <div className="quanlygiaodich-stat-icon yellow">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="quanlygiaodich-stat-info">
                <p>Chưa thanh toán</p>
                <p>{statistics.chuaThanhToan}</p>
              </div>
            </div>
          </div>

          <div className="quanlygiaodich-stat-card">
            <div className="quanlygiaodich-stat-content">
              <div className="quanlygiaodich-stat-icon purple">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
              <div className="quanlygiaodich-stat-info">
                <p>Tổng doanh thu</p>
                <p>{formatCurrency(statistics.tongDoanhThu)}</p>
              </div>
            </div>
          </div>
        </div>

     
        <div className="quanlygiaodich-filters">
          <div className="quanlygiaodich-filters-grid">
            <div className="quanlygiaodich-search-wrapper">
              <Search className="quanlygiaodich-search-icon" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="quanlygiaodich-search-input"
              />
            </div>

            <select
              value={filters.trangThai}
              onChange={(e) => handleFilterChange('trangThai', e.target.value)}
              className="quanlygiaodich-select"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="DA_THANH_TOAN">Đã thanh toán</option>
              <option value="CHUA_THANH_TOAN">Chưa thanh toán</option>
              <option value="HUY">Đã hủy</option>
            </select>

            <select
              value={filters.phuongThuc}
              onChange={(e) => handleFilterChange('phuongThuc', e.target.value)}
              className="quanlygiaodich-select"
            >
              <option value="ALL">Tất cả phương thức</option>
              <option value="COD">Tiền mặt (COD)</option>
              <option value="VNPAY">VNPay</option>
            </select>

            <input
              type="date"
              value={filters.ngayBatDau}
              onChange={(e) => handleFilterChange('ngayBatDau', e.target.value)}
              className="quanlygiaodich-date-input"
            />

            <input
              type="date"
              value={filters.ngayKetThuc}
              onChange={(e) => handleFilterChange('ngayKetThuc', e.target.value)}
              className="quanlygiaodich-date-input"
            />
          </div>

          <div className="quanlygiaodich-filters-footer">
            <span className="quanlygiaodich-result-count">
              Tìm thấy {filteredHoaDon.length} hóa đơn
            </span>
            <div
              onClick={resetFilters}
              className="quanlygiaodich-reset-filters"
            >
              <Filter className="w-4 h-4" />
              Xóa bộ lọc
            </div>
          </div>
        </div>

    
        <div className="quanlygiaodich-table-container">
          {loading ? (
            <div className="quanlygiaodich-loading">
              <div className="quanlygiaodich-loading-spinner"></div>
              <p className="quanlygiaodich-loading-text">Đang tải dữ liệu...</p>
            </div>
          ) : (
            <>
              <div className="quanlygiaodich-table-wrapper">
                <table className="quanlygiaodich-table">
                  <thead className="quanlygiaodich-table-header">
                    <tr>
                      <th>Hóa đơn</th>
                      <th>Khách hàng</th>
                      <th>Thời gian</th>
                      <th>Tổng tiền</th>
                      <th>Phương thức</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="quanlygiaodich-table-body">
                    {currentItems.map((hoaDon) => (
                      <tr key={hoaDon.id} className="quanlygiaodich-table-row">
                        <td className="quanlygiaodich-table-cell">
                          <div className="quanlygiaodich-invoice-info">
                            <div className="quanlygiaodich-invoice-id">
                              #{hoaDon.id}
                            </div>
                            <div className="quanlygiaodich-order-id">
                              Đơn hàng: #{hoaDon.donHang?.id}
                            </div>
                            {hoaDon.maGD && (
                              <div className="quanlygiaodich-transaction-id">
                                Mã GD: {hoaDon.maGD}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="quanlygiaodich-table-cell">
                          <div className="quanlygiaodich-customer-info">
                            <div className="quanlygiaodich-customer-avatar">
                              <div className="quanlygiaodich-avatar-placeholder">
                                <User className="w-5 h-5 text-gray-600" />
                              </div>
                            </div>
                            <div className="quanlygiaodich-customer-details">
                              <div className="quanlygiaodich-customer-name">
                                {hoaDon.hoTen}
                              </div>
                              <div className="quanlygiaodich-customer-phone">
                                {hoaDon.soDienThoai}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="quanlygiaodich-table-cell">
                          <div className="quanlygiaodich-date-text">
                            {formatDate(hoaDon.thoiGianThanhToan)}
                          </div>
                        </td>
                        <td className="quanlygiaodich-table-cell">
                          <div className="quanlygiaodich-amount">
                            {formatCurrency(hoaDon.tongTien)}
                          </div>
                        </td>
                        <td className="quanlygiaodich-table-cell">
                          {getPaymentMethodBadge(hoaDon.phuongThuc)}
                        </td>
                        <td className="quanlygiaodich-table-cell">
                          {getStatusBadge(hoaDon.trangThai)}
                        </td>
                        <td className="quanlygiaodich-table-cell">
                          <div className="quanlygiaodich-actions">
                            <button
                              onClick={() => viewHoaDonDetail(hoaDon.id, hoaDon.donHang?.id)}
                              className="quanlygiaodich-action-btn view"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {hoaDon.phuongThuc === 'COD' && hoaDon.trangThai === 'CHUA_THANH_TOAN' && (
                              <button
                                onClick={() => capNhatThanhToanHoanThanh(hoaDon.donHang?.id)}
                                className="quanlygiaodich-action-btn confirm"
                                title="Xác nhận đã thanh toán"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

             
              {totalPages > 1 && (
                <div className="quanlygiaodich-pagination">
                  <div className="quanlygiaodich-pagination-mobile">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="quanlygiaodich-pagination-btn"
                    >
                      Trước
                    </button>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="quanlygiaodich-pagination-btn"
                    >
                      Sau
                    </button>
                  </div>
                  <div className="quanlygiaodich-pagination-desktop">
                    <div>
                      <p className="quanlygiaodich-pagination-info">
                        Hiển thị{' '}
                        <span>{indexOfFirstItem + 1}</span> đến{' '}
                        <span>
                          {Math.min(indexOfLastItem, filteredHoaDon.length)}
                        </span>{' '}
                        trong tổng số{' '}
                        <span>{filteredHoaDon.length}</span> kết quả
                      </p>
                    </div>
                    <div>
                      <nav className="quanlygiaodich-pagination-nav">
                        {Array.from({ length: totalPages }, (_, i) => (
                          <button
                            key={i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                            className={`quanlygiaodich-pagination-number ${
                              currentPage === i + 1 ? 'active' : ''
                            }`}
                          >
                            {i + 1}
                          </button>
                        ))}
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showDetailModal && selectedHoaDon && (
        <div className="quanlygiaodich-modal-overlay">
          <div className="quanlygiaodich-modal-container">
            <div className="quanlygiaodich-modal-header">
              <h3 className="quanlygiaodich-modal-title">
                Chi tiết hóa đơn #{selectedHoaDon.id}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="quanlygiaodich-modal-close"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="quanlygiaodich-modal-content">
              <div className="quanlygiaodich-modal-sections">
                <div className="quanlygiaodich-modal-section">
                  <h4 className="quanlygiaodich-modal-section-title">
                    <FileText className="w-4 h-4" />
                    Thông tin hóa đơn
                  </h4>
                  <div className="quanlygiaodich-modal-section-content">
                    <div className="quanlygiaodich-modal-row">
                      <span className="quanlygiaodich-modal-label">Mã hóa đơn:</span>
                      <span className="quanlygiaodich-modal-value">#{selectedHoaDon.id}</span>
                    </div>
                    <div className="quanlygiaodich-modal-row">
                      <span className="quanlygiaodich-modal-label">Đơn hàng:</span>
                      <span className="quanlygiaodich-modal-value">#{selectedHoaDon.donHang?.id}</span>
                    </div>
                    <div className="quanlygiaodich-modal-row">
                      <span className="quanlygiaodich-modal-label">Mã giao dịch:</span>
                      <span className="quanlygiaodich-modal-value">{selectedHoaDon.maGD}</span>
                    </div>
                    <div className="quanlygiaodich-modal-row">
                      <span className="quanlygiaodich-modal-label">Thời gian:</span>
                      <span className="quanlygiaodich-modal-value">
                        {formatDate(selectedHoaDon.thoiGianThanhToan)}
                      </span>
                    </div>
                    <div className="quanlygiaodich-modal-row">
                      <span className="quanlygiaodich-modal-label">Phương thức:</span>
                      <span>{getPaymentMethodBadge(selectedHoaDon.phuongThuc)}</span>
                    </div>
                    <div className="quanlygiaodich-modal-row">
                      <span className="quanlygiaodich-modal-label">Trạng thái:</span>
                      <span>{getStatusBadge(selectedHoaDon.trangThai)}</span>
                    </div>
                    <div className="quanlygiaodich-modal-row">
                      <span className="quanlygiaodich-modal-label">Tổng tiền:</span>
                      <span className="quanlygiaodich-modal-value large">
                        {formatCurrency(selectedHoaDon.tongTien)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="quanlygiaodich-modal-section">
                  <h4 className="quanlygiaodich-modal-section-title">
                    <User className="w-4 h-4" />
                    Thông tin khách hàng
                  </h4>
                  <div className="quanlygiaodich-modal-section-content">
                    <div className="quanlygiaodich-modal-row">
                      <span className="quanlygiaodich-modal-label">Họ tên:</span>
                      <span className="quanlygiaodich-modal-value">{selectedHoaDon.hoTen}</span>
                    </div>
                    <div className="quanlygiaodich-modal-row">
                      <span className="quanlygiaodich-modal-label">Số điện thoại:</span>
                      <span className="quanlygiaodich-modal-value">{selectedHoaDon.soDienThoai}</span>
                    </div>
                    {selectedHoaDon.donHang?.nguoiDung?.email && (
                      <div className="quanlygiaodich-modal-row">
                        <span className="quanlygiaodich-modal-label">Email:</span>
                        <span className="quanlygiaodich-modal-value">{selectedHoaDon.donHang.nguoiDung.email}</span>
                      </div>
                    )}
                    <div className="quanlygiaodich-modal-row column">
                      <span className="quanlygiaodich-modal-label">Địa chỉ giao hàng:</span>
                      <span className="quanlygiaodich-modal-value break-words">
                        {selectedHoaDon.diaChi}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedHoaDon.donHang && (
                <div className="quanlygiaodich-order-section">
                  <h4 className="quanlygiaodich-modal-section-title">
                    <Package className="w-4 h-4" />
                    Thông tin đơn hàng
                  </h4>
                  <div className="quanlygiaodich-order-details">
                    <div className="quanlygiaodich-order-grid">
                      <div className="quanlygiaodich-modal-row">
                        <span className="quanlygiaodich-modal-label">Trạng thái đơn hàng:</span>
                        <span className="quanlygiaodich-modal-value">
                          {selectedHoaDon.donHang.trangThai}
                        </span>
                      </div>
                      {selectedHoaDon.donHang.ghiChu && (
                        <div className="quanlygiaodich-order-note">
                          <span className="quanlygiaodich-modal-label">Ghi chú:</span>
                          <p className="quanlygiaodich-modal-value">
                            {selectedHoaDon.donHang.ghiChu}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="quanlygiaodich-modal-actions">
                {selectedHoaDon.phuongThuc === 'COD' && 
                 selectedHoaDon.trangThai === 'CHUA_THANH_TOAN' && (
                  <button
                    onClick={() => {
                      capNhatThanhToanHoanThanh(selectedHoaDon.donHang?.id);
                      setShowDetailModal(false);
                    }}
                    className="quanlygiaodich-modal-btn confirm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Xác nhận đã thanh toán
                  </button>
                )}
                
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="quanlygiaodich-modal-btn close"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuanLyGiaoDich;