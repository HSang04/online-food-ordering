import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from "../../../services/axiosInstance";
import './QuanLyVoucher.css';

const QuanLyVoucher = () => {
  const [vouchers, setVouchers] = useState([]);
  const [searchCode, setSearchCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const jwt = localStorage.getItem('jwt');

  const fetchVouchers = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get('/vouchers', {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      
      if (response.data) {
        const sortedVouchers = response.data.sort((a, b) => 
          new Date(b.hanSuDung) - new Date(a.hanSuDung)
        );
        setVouchers(sortedVouchers);
      }
    } catch (err) {
      console.error('Lỗi khi tải voucher:', err);
      setError('Không thể tải danh sách voucher. Vui lòng thử lại sau.');
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  }, [jwt]);

  useEffect(() => {
    if (jwt) {
      fetchVouchers();
    }
  }, [fetchVouchers, jwt]);

  const deleteVoucher = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa voucher này?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      await axios.delete(`/vouchers/${id}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });

      await fetchVouchers();
    } catch (err) {
      console.error('Lỗi khi xóa voucher:', err);
      setError('Không thể xóa voucher vì voucher đã từng được sử dụng!.');
    } finally {
      setLoading(false);
    }
  };

  const searchVoucher = async () => {
    if (!searchCode.trim()) {
      fetchVouchers();
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`/vouchers/find?ma=${encodeURIComponent(searchCode)}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      
      if (response.data) {
        setVouchers(response.data ? [response.data] : []);
      }
    } catch (err) {
      console.error('Lỗi khi tìm kiếm:', err);
      setError('Không thể tìm kiếm voucher. Vui lòng thử lại.');
      setVouchers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

 
  const getVoucherStatus = (voucher) => {
    const remaining = voucher.soLuong - voucher.daSuDung;
    
    if (!voucher.trangThai) {
     
      if (remaining <= 0) {
        return { status: 'soldout', text: 'Hết lượt', class: 'status-expired' };
      } else {
        return { status: 'expired', text: 'Hết hạn', class: 'status-expired' };
      }
    } else {
      
      if (remaining <= 10) {
        return { status: 'warning', text: 'Sắp hết', class: 'status-warning' };
      } else {
        return { status: 'active', text: 'Hoạt động', class: 'status-active' };
      }
    }
  };

  return (
    <div className="voucher-management">
      <div className="header">
        <h1>Quản Lý Voucher</h1>
        <p className="header-subtitle">Quản lý tất cả voucher khuyến mãi</p>
        
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}
        
        <div className="header-actions">
          <div className="search-box">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Tìm kiếm theo mã voucher..."
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchVoucher()}
                className="search-input"
              />
              <button onClick={searchVoucher} className="search-btn">
                🔍
              </button>
            </div>
          </div>
          
          <button 
            className="add-btn"
            onClick={() => navigate('/voucher/them')}
            disabled={loading}
          >
             Thêm Voucher
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading">
          <div className="loading-spinner"></div>
          Đang tải...
        </div>
      )}

      <div className="voucher-grid">
        {vouchers.map(voucher => {
          const status = getVoucherStatus(voucher);
          return (
            <div key={voucher.id} className={`voucher-card ${status.status}`}>
              <div className="voucher-header">
                <div>
                  <span className="voucher-code">{voucher.maVoucher}</span>
                  <span className={`voucher-status ${status.class}`}>
                    {status.text}
                  </span>
                </div>

              </div>

              <div className="voucher-value">
                <div className="value-display">
                  {voucher.loai === 'PHAN_TRAM' 
                    ? `${voucher.giaTri}%` 
                    : formatCurrency(voucher.giaTri)
                  }
                </div>
                <span className="value-label">Giá trị giảm</span>
              </div>

              <div className="voucher-details">
                <div className="detail-row">
                  <span className="detail-label">Hạn sử dụng:</span>
                  <span className="detail-value">{formatDate(voucher.hanSuDung)}</span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Số lượng:</span>
                  <span className="detail-value">
                    {voucher.soLuong - voucher.daSuDung}/{voucher.soLuong}
                  </span>
                </div>
                
                <div className="detail-row">
                  <span className="detail-label">Đơn tối thiểu:</span>
                  <span className="detail-value">{formatCurrency(voucher.giaToiThieu || 0)}</span>
                </div>
              </div>

              {voucher.moTa && (
                <div className="voucher-description">
                  <p>{voucher.moTa}</p>
                </div>
              )}

              <div className="voucher-actions">
                <button 
                  className="btn-edit"
                  onClick={() => navigate(`/voucher/sua/${voucher.id}`)}
                >
                   Sửa
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => deleteVoucher(voucher.id)}
                >
                   Xóa
                </button>
              </div>

              <div className="voucher-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${(voucher.daSuDung / voucher.soLuong) * 100}%` 
                    }}
                  ></div>
                </div>
                <span className="progress-text">
                  Đã sử dụng: {voucher.daSuDung}/{voucher.soLuong}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {vouchers.length === 0 && !loading && (
        <div className="empty-state">
          <h3>Chưa có voucher nào</h3>
          <p>Hãy tạo voucher đầu tiên cho cửa hàng của bạn</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/voucher/them')}
          >
            Tạo voucher ngay
          </button>
        </div>
      )}
    </div>
  );
};

export default QuanLyVoucher;