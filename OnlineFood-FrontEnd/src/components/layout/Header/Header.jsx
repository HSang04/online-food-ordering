import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const dropdownRef = useRef(null);
  const dropdownTriggerRef = useRef(null);

  const isLoggedIn = localStorage.getItem('jwt') !== null;
  const vaiTro = localStorage.getItem('vaiTro');

  const handleLogout = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('vaiTro');
    localStorage.removeItem('idNguoiDung');
    localStorage.removeItem('role');
    navigate('/login');
  };

  const updateDropdownPosition = () => {
    if (dropdownTriggerRef.current) {
      const rect = dropdownTriggerRef.current.getBoundingClientRect();
      
      setDropdownPosition({
        top: rect.bottom + 8, 
        left: rect.left + (rect.width / 2), 
      });
    }
  };

  const toggleDropdown = () => {
    if (!isDropdownOpen) {
      updateDropdownPosition();
    }
    setIsDropdownOpen((prev) => !prev);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          dropdownTriggerRef.current && !dropdownTriggerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };

    const handleResize = () => {
      if (isDropdownOpen) {
        updateDropdownPosition();
      }
    };

    const handleScroll = () => {
      if (isDropdownOpen) {
        updateDropdownPosition();
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      window.addEventListener('resize', handleResize);
      window.addEventListener('scroll', handleScroll);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('scroll', handleScroll);
      };
    }
  }, [isDropdownOpen]);

  const renderDropdown = (items) => (
    <>
      <li className={`nav-item dropdown-container ${isDropdownOpen ? 'show' : ''}`}>
        <span 
          ref={dropdownTriggerRef}
          className="nav-link nav-hover dropdown-toggle" 
          onClick={toggleDropdown}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleDropdown();
            }
          }}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          Quản lý
        </span>
      </li>


      {isDropdownOpen && (
        <div 
          ref={dropdownRef}
          className={`dropdown-menu-custom show`} 
          role="menu"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {items.map(([to, label], index) => (
            <Link 
              key={index}
              className="dropdown-item" 
              to={to} 
              onClick={closeDropdown}
              role="menuitem"
              tabIndex={0}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </>
  );

  const renderMenuByRole = () => {
    const dropdownItemsAdmin = [
      ['/quan-ly-don-hang', 'Quản lý đơn hàng'],
      ['/quan-ly-danh-muc', 'Quản lý danh mục'],
      ['/quan-ly-mon-an', 'Quản lý món ăn'],
      ['/quan-ly-nguoi-dung', 'Quản lý người dùng'],
      ['/quan-ly-voucher', 'Quản lý voucher'],
      ['/quan-ly-giao-dich', 'Quản lý giao dịch'],
       ['/quan-ly-thong-tin', 'Quản lý thông tin cửa hàng'],
    ];

    const dropdownItemsMonAn = [
      ['/quan-ly-danh-muc', 'Quản lý danh mục'],
      ['/quan-ly-mon-an', 'Quản lý món ăn'],
    ];

    if (!isLoggedIn) {
      return (
        <>
          <li className="nav-item"><Link className="nav-link nav-hover" to="/">Trang chủ</Link></li>
          <li className="nav-item"><Link className="nav-link nav-hover" to="/menu">Thực đơn</Link></li>
          {/* <li className="nav-item"><Link className="nav-link nav-hover" to="/cart">Giỏ hàng</Link></li> */}
          <li className="nav-item"><Link className="nav-link nav-hover" to="/login">Đăng nhập</Link></li>
        </>
      );
    }

    switch (vaiTro) {
      case 'ADMIN':
        return (
          <>
            <li className="nav-item"><Link className="nav-link nav-hover" to="/menu">Thực đơn</Link></li>
            {renderDropdown(dropdownItemsAdmin)}
            <li className="nav-item"><Link className="nav-link nav-hover" to="/thong-ke">Thống kê doanh thu</Link></li>
            <li className="nav-item"><Link className="nav-link nav-hover" to="/chat">Tin nhắn</Link></li>
            <li className="nav-item"><Link className="nav-link nav-hover" to="/profile">Hồ sơ</Link></li>
            <li className="nav-item"><span className="nav-link nav-hover logout-btn" onClick={handleLogout}>Đăng xuất</span></li>
          </>
        );

      case 'QUANLY':
        return (
          <>
            <li className="nav-item"><Link className="nav-link nav-hover" to="/menu">Thực đơn</Link></li>
            {renderDropdown(dropdownItemsAdmin)}
            <li className="nav-item"><Link className="nav-link nav-hover" to="/chat">Tin nhắn</Link></li>
            <li className="nav-item"><Link className="nav-link nav-hover" to="/profile">Hồ sơ</Link></li>
            <li className="nav-item"><span className="nav-link nav-hover logout-btn" onClick={handleLogout}>Đăng xuất</span></li>
          </>
        );

      case 'NHANVIEN_QUANLYDONHANG':
        return (
          <>
            <li className="nav-item"><Link className="nav-link nav-hover" to="/menu">Thực đơn</Link></li>
            <li className="nav-item"><Link className="nav-link nav-hover" to="/quan-ly-don-hang">Quản lý đơn hàng</Link></li>
            <li className="nav-item"><Link className="nav-link nav-hover" to="/chat">Tin nhắn</Link></li>
            <li className="nav-item"><Link className="nav-link nav-hover" to="/profile">Hồ sơ</Link></li>
            <li className="nav-item"><span className="nav-link nav-hover logout-btn" onClick={handleLogout}>Đăng xuất</span></li>
          </>
        );

      case 'NHANVIEN_QUANLYMONAN':
        return (
          <>
            <li className="nav-item"><Link className="nav-link nav-hover" to="/menu">Thực đơn</Link></li>
            {renderDropdown(dropdownItemsMonAn)}
            <li className="nav-item"><Link className="nav-link nav-hover" to="/chat">Tin nhắn</Link></li>
            <li className="nav-item"><Link className="nav-link nav-hover" to="/profile">Hồ sơ</Link></li>
            <li className="nav-item"><span className="nav-link nav-hover logout-btn" onClick={handleLogout}>Đăng xuất</span></li>
          </>
        );

      default:
        return (
          <>
            <li className="nav-item"><Link className="nav-link nav-hover" to="/">Trang chủ</Link></li>
            <li className="nav-item"><Link className="nav-link nav-hover" to="/menu">Thực đơn</Link></li>
            <li className="nav-item"><Link className="nav-link nav-hover" to="/cart">Giỏ hàng</Link></li>
            <li className="nav-item"><Link className="nav-link nav-hover" to="/lich-su-giao-dich">Lịch sử giao dịch</Link></li>
            <li className="nav-item"><Link className="nav-link nav-hover" to="/chat">Liên hệ hỗ trợ</Link></li>
            <li className="nav-item"><Link className="nav-link nav-hover" to="/profile">Hồ sơ</Link></li>
            <li className="nav-item"><span className="nav-link nav-hover logout-btn" onClick={handleLogout}>Đăng xuất</span></li>
          </>
        );
    }
  };

  return (
    <nav className="navbar navbar-expand-lg custom-navbar px-4">
      <Link className="navbar-brand" to="/">OU FOOD</Link>
      <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
        <span className="navbar-toggler-icon"></span>
      </button>
      <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
        <ul className="navbar-nav">
          {renderMenuByRole()}
        </ul>
      </div>
    </nav>
  );
};

export default Header;