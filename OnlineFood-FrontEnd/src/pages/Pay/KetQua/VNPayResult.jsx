import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from '../../../services/axiosInstance';
import './VNPayResult.css';

const VNPayResult = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [paymentResult, setPaymentResult] = useState(null);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [donHangId, setDonHangId] = useState(null);

  useEffect(() => {
    const handlePaymentResult = async () => {
      try {
        const urlParams = new URLSearchParams(location.search);
        const queryParams = {};
        
      
        for (let [key, value] of urlParams.entries()) {
          queryParams[key] = value;
        }

        console.log('VNPay callback params:', queryParams);
        setDebugInfo(`Params nhận được: ${JSON.stringify(queryParams, null, 2)}`);

      
        if (!queryParams.vnp_TxnRef || !queryParams.vnp_ResponseCode) {
          throw new Error('Thiếu thông tin thanh toán cần thiết');
        }

 
        const fullUrl = axios.defaults.baseURL + '/payment-result';
        console.log('Đang gọi API:', fullUrl);
        setDebugInfo(prev => prev + `\n\nĐang gọi API: ${fullUrl}`);

    
        const response = await axios.get('/payment-result', {
          params: queryParams,
          timeout: 10000 
        });

        console.log('Payment result:', response.data);
        setPaymentResult(response.data);

      
        if (response.data.code === '00') {
          await handleSuccessfulPayment(queryParams);
        }

      } catch (err) {
        console.error('Lỗi xử lý kết quả thanh toán:', err);
        
        let errorMessage = '';
        let debugDetail = '';
        
        if (err.response) {
         
          console.error('Response error:', err.response);
          errorMessage = `Lỗi ${err.response.status}: ${err.response.data?.message || err.response.statusText}`;
          debugDetail = `Response Status: ${err.response.status}\nResponse Data: ${JSON.stringify(err.response.data, null, 2)}`;
        } else if (err.request) {
          
          console.error('Network error:', err.request);
          errorMessage = 'Không thể kết nối đến server. Kiểm tra:\n1. Backend có đang chạy?\n2. Port có đúng là 8080?\n3. CORS có được cấu hình?';
          debugDetail = `Request: ${err.request}`;
        } else {
     
          console.error('Error:', err.message);
          errorMessage = `Có lỗi xảy ra: ${err.message}`;
          debugDetail = err.message;
        }
        
        setError(errorMessage);
        setDebugInfo(prev => prev + `\n\nLỗi chi tiết: ${debugDetail}`);
      } finally {
        setLoading(false);
      }
    };

    handlePaymentResult();
  }, [location.search]);


  const handleSuccessfulPayment = async (queryParams) => {
    try {
      console.log('Thanh toán thành công, đang tạo đơn hàng...');
      
   
      const pendingOrderData = sessionStorage.getItem('pendingOrder');
      const cartToDeleteUserId = sessionStorage.getItem('cartToDelete');
      
      if (!pendingOrderData) {
        throw new Error('Không tìm thấy thông tin đơn hàng đã lưu');
      }

      const donHangData = JSON.parse(pendingOrderData);
      console.log('Dữ liệu đơn hàng từ sessionStorage:', donHangData);

    
      const donHangResponse = await axios.post('/don-hang/dat-hang', donHangData);
      
      if (donHangResponse.data && donHangResponse.data.id) {
        const createdDonHangId = donHangResponse.data.id;
        setDonHangId(createdDonHangId);
        console.log('Tạo đơn hàng thành công với ID:', createdDonHangId);

        
        if (cartToDeleteUserId) {
          try {
            await axios.delete(`/gio-hang/${cartToDeleteUserId}/clear`);
            console.log('Xóa giỏ hàng thành công');
          } catch (clearError) {
            console.error('Lỗi khi xóa giỏ hàng:', clearError);
          }
        }

       
        const vnpTransactionNo = queryParams.vnp_TransactionNo;
        if (vnpTransactionNo) {
          try {
            console.log('Đang tạo hóa đơn VNPay cho đơn hàng:', createdDonHangId);
            
            const hoaDonResponse = await axios.post('/hoa-don/tao-vnpay', {
              donHangId: createdDonHangId,
              vnpTransactionNo: vnpTransactionNo
            });
            
            console.log('Tạo hóa đơn VNPay thành công:', hoaDonResponse.data);
            
          } catch (hoaDonError) {
            console.error('Lỗi khi tạo hóa đơn VNPay:', hoaDonError);
          
          }
        }

    
        sessionStorage.removeItem('pendingOrder');
        sessionStorage.removeItem('cartToDelete');

      } else {
        throw new Error('Không thể tạo đơn hàng');
      }

    } catch (err) {
      console.error('Lỗi khi tạo đơn hàng sau thanh toán thành công:', err);
      setError(prev => prev + '\n\nLỗi khi tạo đơn hàng: ' + err.message);
    }
  };


  const handleDirectProcessing = async () => {
    const urlParams = new URLSearchParams(location.search);
    const vnp_ResponseCode = urlParams.get('vnp_ResponseCode');
    
    if (vnp_ResponseCode === '00') {
   
      const queryParams = {};
      for (let [key, value] of urlParams.entries()) {
        queryParams[key] = value;
      }

      setPaymentResult({
        code: '00',
        message: 'Payment successful (processed locally)',
        transactionId: urlParams.get('vnp_TransactionNo')
      });


      await handleSuccessfulPayment(queryParams);
    } else {
   
      setPaymentResult({
        code: vnp_ResponseCode,
        message: `Payment failed with code: ${vnp_ResponseCode}`
      });
    }
    
    setLoading(false);
  };

  const getStatusMessage = () => {
    if (!paymentResult) return '';

    switch (paymentResult.code) {
      case '00':
        return {
          icon: '✅',
          title: 'Thanh toán thành công!',
          message: 'Đơn hàng của bạn đã được thanh toán và tạo thành công. Chúng tôi sẽ xử lý và giao hàng trong thời gian sớm nhất.',
          type: 'success'
        };
      case '24':
        return {
          icon: '❌',
          title: 'Giao dịch bị hủy',
          message: 'Bạn đã hủy giao dịch thanh toán.',
          type: 'cancelled'
        };
      case '11':
        return {
          title: 'Giao dịch hết hạn',
          message: 'Thời gian thanh toán đã hết hạn.',
          type: 'expired'
        };
      default:
        return {
          icon: '❌',
          title: 'Thanh toán thất bại',
          message: paymentResult.message || 'Giao dịch không thành công.',
          type: 'failed'
        };
    }
  };

  const handleContinueShopping = () => {
    navigate('/');
  };

  const handleViewOrders = () => {
    navigate('/lich-su-giao-dich');
  };

  const handleViewInvoice = () => {
    if (donHangId) {
      navigate(`/hoa-don/${donHangId}`);
    } else {
      
      const donHangIdFromUrl = new URLSearchParams(location.search).get('vnp_TxnRef');
      if (donHangIdFromUrl) {
        navigate(`/hoa-don/${donHangIdFromUrl}`);
      }
    }
  };

  const handleRetryPayment = () => {
    navigate('/gio-hang');
  };

  if (loading) {
    return (
      <div className="vnpay-result-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h2>Đang xử lý kết quả thanh toán...</h2>
          <p>Vui lòng chờ trong giây lát</p>
          <div className="loading-steps">
            <div className="step">✓ Xác thực thanh toán</div>
            <div className="step">Tạo đơn hàng</div>
            <div className="step">Tạo hóa đơn</div>
            <div className="step">Cập nhật trạng thái</div>
          </div>
          
         
          <div style={{ marginTop: '20px' }}>
            <button 
              onClick={handleDirectProcessing} 
              className="btn-secondary"
              style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
            >
              Xử lý trực tiếp (nếu API lỗi)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vnpay-result-container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Có lỗi xảy ra</h2>
          <p style={{ whiteSpace: 'pre-line' }}>{error}</p>
          
       
          <details style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Debug Information (Click to expand)</summary>
            <pre style={{ fontSize: '12px', overflow: 'auto', marginTop: '10px' }}>
              {debugInfo}
            </pre>
          </details>
          
          <div className="action-buttons" style={{ marginTop: '20px' }}>
            <button onClick={handleDirectProcessing} className="btn-primary">
              Xử lý trực tiếp
            </button>
            <button onClick={handleContinueShopping} className="btn-secondary">
              Về trang chủ
            </button>
            <button onClick={handleViewOrders} className="btn-secondary">
              Xem đơn hàng
            </button>
          </div>
        </div>
      </div>
    );
  }

  const status = getStatusMessage();

  return (
    <div className="vnpay-result-container">
      <div className={`result-container ${status.type}`}>
        <div className="result-icon">{status.icon}</div>
        <h1 className="result-title">{status.title}</h1>
        <p className="result-message">{status.message}</p>

        {paymentResult && (
          <div className="transaction-details">
            <h3>Thông tin giao dịch</h3>
            <div className="detail-row">
              <span className="label">Mã đơn hàng:</span>
              <span className="value">{donHangId || new URLSearchParams(location.search).get('vnp_TxnRef')}</span>
            </div>
            {paymentResult.transactionId && (
              <div className="detail-row">
                <span className="label">Mã giao dịch VNPay:</span>
                <span className="value">{paymentResult.transactionId}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="label">Số tiền:</span>
              <span className="value">
                {Math.round(parseInt(new URLSearchParams(location.search).get('vnp_Amount') || '0') / 100).toLocaleString()}₫
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Mã phản hồi:</span>
              <span className="value">{new URLSearchParams(location.search).get('vnp_ResponseCode')}</span>
            </div>
            <div className="detail-row">
              <span className="label">Thời gian thanh toán:</span>
              <span className="value">{new URLSearchParams(location.search).get('vnp_PayDate')}</span>
            </div>
          </div>
        )}

        <div className="action-buttons">
          {status.type === 'success' ? (
            <>
              <button onClick={handleViewInvoice} className="btn-primary">
                🧾 Xem hóa đơn
              </button>
              <button onClick={handleViewOrders} className="btn-secondary">
                📋 Xem đơn hàng của tôi
              </button>
              <button onClick={handleContinueShopping} className="btn-secondary">
                🛒 Tiếp tục mua sắm
              </button>
            </>
          ) : (
            <>
              <button onClick={handleRetryPayment} className="btn-primary">
                🔄 Thử lại thanh toán
              </button>
              <button onClick={handleViewOrders} className="btn-secondary">
                📋 Xem đơn hàng
              </button>
              <button onClick={handleContinueShopping} className="btn-secondary">
                🏠 Về trang chủ
              </button>
            </>
          )}
        </div>

        {status.type === 'success' && (
          <div className="success-note">
            <div className="note-item">
              <span className="note-icon">📞</span>
              <span>Nếu có thắc mắc, vui lòng liên hệ hotline: 1900 2403</span>
            </div>
            <div className="note-item">
              <span className="note-icon">📧</span>
              <span>Xin cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của chúng tôi. Chúng tôi rất mong được phục vụ quý khách lần sau. </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VNPayResult;