import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <div className="logo-circle">OU</div>
              <h3>OU FOOD</h3>
            </div>
            <p>
              Mang đến những bữa ăn ngon nhất với dịch vụ giao hàng tận nơi nhanh chóng và tiện lợi.
            </p>
          </div>

          <div className="footer-section">
            <h4>Liên kết nhanh</h4>
            <ul>
              <li><button>Về chúng tôi</button></li>
              <li><button>Thực đơn</button></li>
              <li><button>Khuyến mãi</button></li>
              <li><button>Đối tác</button></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Hỗ trợ</h4>
            <ul>
              <li><button>Trung tâm trợ giúp</button></li>
              <li><button>Chính sách</button></li>
              <li><button>Điều khoản</button></li>
              <li><button>Bảo mật</button></li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Liên hệ</h4>
            <div className="contact-info">
              <div className="contact-item"><span className="icon">📞</span> 1900 2403</div>
              <div className="contact-item"><span className="icon">✉️</span> 2251010079sang@ou.edu.vn </div>
              <div className="contact-item"><span className="icon">📍</span> 40 Ngô Đức Kế, phường Sài Gòn, TP. Hồ Chí Minh</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
