import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header/Header';
import Footer from './components/layout/Footer/Footer';
import TrangChu from './pages/Home/TrangChu/TrangChu';
import DangNhap from './pages/Auth/DangNhap/DangNhap';
import DangKy from './pages/Auth/DangKy/DangKy';
import ThongTinCaNhan from './pages/Profile/ThongTinCaNhan/ThongTinCaNhan';
import QuanLyDanhMuc from './pages/Admin/QuanLyDanhMuc/QuanLyDanhMuc';
import RequireAuth, { RequireAdmin, RequireOrderManagement, RequireFoodManagement } from './routes/RequireAuth';
import Unauthorized from './pages/Unauthorized/Unauthorized';
import QuanLyMonAn from './pages/Admin/QuanLyMonAn/QuanLyMonAn';
import ThemSuaMonAn from './pages/Admin/QuanLyMonAn/ThemSuaMonAn';
import MenuMonAn from './pages/Home/MenuMonAn/MenuMonAn'
import ChiTietMonAn from './pages/Home/ChiTietMonAn/ChiTietMonAn'
import GioHang from './pages/Profile/GioHang/GioHang';
import ThanhToan from './pages/Pay/ThanhToan/ThanhToan'
import QuanLyDonHang from './pages/Admin/QuanLyDonHang/QuanLyDonHang'
import QuanLyNguoiDung from './pages/Admin/QuanLyNguoiDung/QuanLyNguoiDung';
import ChiTietNguoiDung from './pages/Admin/QuanLyNguoiDung/ChiTietNguoiDung';
import QuanLyVoucher from './pages/Admin/QuanLyVoucher/QuanLyVoucher';
import ThemSuaVoucher from './pages/Admin/QuanLyVoucher/ThemSuaVoucher';
import LichSuGiaoDich from './pages/Profile/LichSuGiaoDich/LichSuGiaoDich';
import QuenMatKhau from './pages/Auth/QuenMatKhau/QuenMatKhau';
import ResetMatKhau from './pages/Auth/QuenMatKhau/ResetMatKhau';

import VNPayResult from './pages/Pay/KetQua/VNPayResult';
import HoaDon from './pages/Profile/HoaDon/HoaDon';
import ThongKe from './pages/Admin/ThongKe/ThongKe';

import TinNhan from './pages/Profile/TinNhan/TinNhan';
import QuanLyCuaHang from './pages/Admin/QuanLyCuaHang/QuanLyCuaHang';
import QuanLyGiaoDich from './pages/Admin/QuanLyGiaoDich/QuanLyGiaoDich';

const App = () => {
  return (
    <Router>
      <Header />
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<TrangChu />} />
          <Route path="/login" element={<DangNhap />} />
          <Route path="/signup" element={<DangKy />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/menu" element={<MenuMonAn />} />
          <Route path="/chi-tiet-mon-an/:id" element={<ChiTietMonAn />} />
          <Route path="/forgot-password" element={<QuenMatKhau />} />
          <Route path="/reset-password" element={<ResetMatKhau />} />
          <Route path="/vnpay-result" element={<VNPayResult />} />
          <Route path="/payment-result" element={<VNPayResult />} />

          <Route path="/profile" element={<RequireAuth requireLogin={true}><ThongTinCaNhan /></RequireAuth>} />
          <Route path="/cart" element={<RequireAuth allowedRoles={['KHACHHANG']}><GioHang /></RequireAuth>} />
          <Route path="/pay" element={<RequireAuth allowedRoles={['KHACHHANG']}><ThanhToan /></RequireAuth>} />
          <Route path="/lich-su-giao-dich" element={<RequireAuth allowedRoles={['KHACHHANG']}><LichSuGiaoDich /></RequireAuth>} />
          <Route path="/hoa-don/:donHangId" element={<RequireAuth allowedRoles={['KHACHHANG']}><HoaDon /></RequireAuth>} />
          <Route path="/chat" element={<RequireAuth allowedRoles={['ADMIN', 'QUANLY', 'NHANVIEN_QUANLYDONHANG', 'NHANVIEN_QUANLYMONAN', 'KHACHHANG']}><TinNhan /></RequireAuth>} />

          <Route path="/quan-ly-don-hang" element={<RequireOrderManagement><QuanLyDonHang /></RequireOrderManagement>} />
          <Route path="/quan-ly-danh-muc" element={<RequireFoodManagement><QuanLyDanhMuc /></RequireFoodManagement>} />
          <Route path="/quan-ly-mon-an" element={<RequireFoodManagement><QuanLyMonAn /></RequireFoodManagement>} />
          <Route path="/them-sua-mon-an" element={<RequireFoodManagement><ThemSuaMonAn /></RequireFoodManagement>} />
          <Route path="/them-sua-mon-an/:id" element={<RequireFoodManagement><ThemSuaMonAn /></RequireFoodManagement>} />

          <Route path="/nguoi-dung" element={<RequireAuth allowedRoles={['ADMIN', 'QUANLY']}><ChiTietNguoiDung /></RequireAuth>} />
          <Route path="/nguoi-dung/:id" element={<RequireAuth allowedRoles={['ADMIN', 'QUANLY']}><ChiTietNguoiDung /></RequireAuth>} />
          <Route path="/quan-ly-nguoi-dung" element={<RequireAuth allowedRoles={['ADMIN', 'QUANLY']}><QuanLyNguoiDung /></RequireAuth>} />
          <Route path="/quan-ly-voucher" element={<RequireAuth allowedRoles={['ADMIN', 'QUANLY']}><QuanLyVoucher /></RequireAuth>} />
          <Route path="/voucher/them" element={<RequireAuth allowedRoles={['ADMIN', 'QUANLY']}><ThemSuaVoucher /></RequireAuth>} />
          <Route path="/voucher/sua/:id" element={<RequireAuth allowedRoles={['ADMIN', 'QUANLY']}><ThemSuaVoucher /></RequireAuth>} />
          <Route path="/quan-ly-giao-dich" element={<RequireAuth allowedRoles={['ADMIN', 'QUANLY']}><QuanLyGiaoDich /></RequireAuth>} />
          <Route path="/quan-ly-thong-tin" element={<RequireAuth allowedRoles={['ADMIN', 'QUANLY']}><QuanLyCuaHang /></RequireAuth>} />

          <Route path="/thong-ke" element={<RequireAdmin><ThongKe /></RequireAdmin>} />
        </Routes>
      </div>
      <Footer />
    </Router>
  );
};

export default App;