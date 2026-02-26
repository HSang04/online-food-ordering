import React, { useState, useEffect, useCallback } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import axios from '../../../services/axiosInstance';
import './ThongKe.css';

const ThongKe = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dateRange, setDateRange] = useState({
    tuNgay: new Date().toISOString().split('T')[0],
    denNgay: new Date().toISOString().split('T')[0]
  });
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedMonthYear, setSelectedMonthYear] = useState(new Date().getFullYear());

  const [dashboardData, setDashboardData] = useState(null);
  const [doanhThuData, setDoanhThuData] = useState(null);
  const [doanhThuThangData, setDoanhThuThangData] = useState(null);
  const [monBanChayData, setMonBanChayData] = useState(null);
  const [voucherData, setVoucherData] = useState(null);
  const [shipperData, setShipperData] = useState(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  const jwt = localStorage.getItem('jwt');

  // ===== EXPORT EXCEL =====
  const exportToExcel = () => {
    let workbook = XLSX.utils.book_new();
    let fileName = '';

    switch (activeTab) {
      case 'dashboard':
        if (dashboardData) {
          const tongQuanData = [
            ['BÁO CÁO TỔNG QUAN'],
            ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
            [],
            ['Thống kê theo thời gian', '', 'Doanh thu', 'Số đơn hàng', 'Doanh thu TB'],
            ['Hôm nay', '', dashboardData.tongQuan.homNay?.tongDoanhThu || 0, dashboardData.tongQuan.homNay?.tongSoDon || 0, dashboardData.tongQuan.homNay?.doanhThuTrungBinh || 0],
            ['Tuần qua', '', dashboardData.tongQuan.tuanQua?.tongDoanhThu || 0, dashboardData.tongQuan.tuanQua?.tongSoDon || 0, dashboardData.tongQuan.tuanQua?.doanhThuTrungBinh || 0],
            ['Tháng qua', '', dashboardData.tongQuan.thangQua?.tongDoanhThu || 0, dashboardData.tongQuan.thangQua?.tongSoDon || 0, dashboardData.tongQuan.thangQua?.doanhThuTrungBinh || 0],
            [], ['Top 5 món bán chạy'], ['STT', 'Tên món ăn', 'Số lượng bán', 'Doanh thu']
          ];
          dashboardData.monBanChay?.topMonAn?.slice(0, 5).forEach((item, index) => {
            tongQuanData.push([index + 1, item.tenMonAn, item.soLuongBan, item.doanhThu]);
          });
          const ws = XLSX.utils.aoa_to_sheet(tongQuanData);
          XLSX.utils.book_append_sheet(workbook, ws, 'Tổng quan');
          fileName = 'BaoCao_TongQuan';
        }
        break;

      case 'doanhThu':
        if (doanhThuData) {
          const data = [
            ['BÁO CÁO DOANH THU THEO NGÀY'],
            ['Từ ngày:', dateRange.tuNgay, 'Đến ngày:', dateRange.denNgay],
            [], ['Tổng doanh thu:', doanhThuData.tongDoanhThu],
            ['Tổng đơn hàng:', doanhThuData.tongSoDon],
            [], ['Ngày', 'Doanh thu', 'Số đơn hàng']
          ];
          doanhThuData.chartData?.forEach(item => data.push([item.ngay, item.doanhThu, item.soDon]));
          XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(data), 'Doanh thu theo ngày');
          fileName = `BaoCao_DoanhThu_${dateRange.tuNgay}_${dateRange.denNgay}`;
        }
        break;

      case 'doanhThuThang':
        if (doanhThuThangData) {
          const data = [
            ['BÁO CÁO DOANH THU THEO THÁNG'], ['Năm:', selectedYear],
            [], ['Tổng doanh thu:', doanhThuThangData.tongDoanhThu],
            [], ['Tháng', 'Doanh thu', 'Số đơn hàng']
          ];
          doanhThuThangData.chartData?.forEach(item => data.push([`Tháng ${item.thang}`, item.doanhThu, item.soDon]));
          XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(data), 'Doanh thu theo tháng');
          fileName = `BaoCao_DoanhThuThang_${selectedYear}`;
        }
        break;

      case 'monBanChay':
        if (monBanChayData) {
          const data = [
            ['BÁO CÁO MÓN ĂN BÁN CHẠY'],
            ['Từ ngày:', dateRange.tuNgay, 'Đến ngày:', dateRange.denNgay],
            [], ['Hạng', 'Tên món ăn', 'Số lượng bán', 'Doanh thu', 'Đơn giá TB']
          ];
          monBanChayData.topMonAn?.forEach((item, i) => data.push([i + 1, item.tenMonAn, item.soLuongBan, item.doanhThu, item.donGiaTrungBinh]));
          XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(data), 'Món bán chạy');
          fileName = `BaoCao_MonBanChay_${dateRange.tuNgay}_${dateRange.denNgay}`;
        }
        break;

      case 'voucher':
        if (voucherData) {
          const data = [
            ['BÁO CÁO VOUCHER'], ['Từ ngày:', dateRange.tuNgay, 'Đến ngày:', dateRange.denNgay],
            [], ['Mã voucher', 'Loại', 'Giá trị', 'Số lượt sử dụng']
          ];
          voucherData.voucherData?.forEach(v => data.push([v.maVoucher, v.loai === 'PHAN_TRAM' ? 'Phần trăm' : 'Số tiền', v.loai === 'PHAN_TRAM' ? `${v.giaTri}%` : v.giaTri, v.soLuotSuDung]));
          XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(data), 'Thống kê voucher');
          fileName = `BaoCao_Voucher_${dateRange.tuNgay}_${dateRange.denNgay}`;
        }
        break;

      case 'shipper':
        if (shipperData) {
          const data = [
            ['BÁO CÁO THỐNG KÊ SHIPPER'],
            ['Tháng:', selectedMonth, 'Năm:', selectedMonthYear],
            ['Ngày xuất:', new Date().toLocaleDateString('vi-VN')],
            [],
            ['Tổng shipper:', shipperData.tongShipper],
            ['Tổng đơn hoàn thành:', shipperData.tongDonHoanThanh],
            [],
            ['Họ tên', 'SĐT', 'Tổng đơn', 'Đơn đúng hạn', 'Đơn trễ', 'Tỉ lệ trễ (%)']
          ];
          shipperData.danhSachShipper?.forEach(s => {
            data.push([s.hoTen, s.soDienThoai, s.tongDon, s.donDungHan, s.donTre, s.tiLeTre]);
          });
          XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(data), 'Thống kê shipper');
          fileName = `BaoCao_Shipper_Thang${selectedMonth}_${selectedMonthYear}`;
        }
        break;

      default:
        alert('Không có dữ liệu để xuất!');
        return;
    }

    if (workbook.SheetNames?.length > 0) {
      XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } else {
      alert('Không có dữ liệu để xuất!');
    }
  };

  // ===== FETCH FUNCTIONS =====
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/thong-ke/dashboard', { headers: { Authorization: `Bearer ${jwt}` } });
      setDashboardData(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [jwt]);

  const fetchDoanhThuTheoNgay = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/thong-ke/doanh-thu/ngay', {
        params: { tuNgay: dateRange.tuNgay, denNgay: dateRange.denNgay },
        headers: { Authorization: `Bearer ${jwt}` }
      });
      const data = res.data;
      const chartData = Object.entries(data.doanhThuTheoNgay).map(([ngay, doanhThu]) => ({
        ngay, doanhThu, soDon: data.soDonTheoNgay[ngay] || 0
      }));
      setDoanhThuData({ ...data, chartData });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [jwt, dateRange]);

  const fetchDoanhThuTheoThang = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/thong-ke/doanh-thu/thang', {
        params: { nam: selectedYear },
        headers: { Authorization: `Bearer ${jwt}` }
      });
      const data = res.data;
      const chartData = Object.entries(data.doanhThuTheoThang).map(([thang, doanhThu]) => ({
        thang, doanhThu, soDon: data.soDonTheoThang[thang] || 0
      }));
      setDoanhThuThangData({ ...data, chartData });
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [jwt, selectedYear]);

  const fetchMonBanChay = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/thong-ke/mon-an/ban-chay', {
        params: { tuNgay: dateRange.tuNgay, denNgay: dateRange.denNgay, limit: 10 },
        headers: { Authorization: `Bearer ${jwt}` }
      });
      setMonBanChayData(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [jwt, dateRange]);

  const fetchVoucherStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/thong-ke/voucher', {
        params: { tuNgay: dateRange.tuNgay, denNgay: dateRange.denNgay },
        headers: { Authorization: `Bearer ${jwt}` }
      });
      setVoucherData(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [jwt, dateRange]);

  const fetchShipperStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/thong-ke/shipper', {
        params: { thang: selectedMonth, nam: selectedMonthYear },
        headers: { Authorization: `Bearer ${jwt}` }
      });
      setShipperData(res.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [jwt, selectedMonth, selectedMonthYear]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  useEffect(() => {
    switch (activeTab) {
      case 'doanhThu': fetchDoanhThuTheoNgay(); break;
      case 'doanhThuThang': fetchDoanhThuTheoThang(); break;
      case 'monBanChay': fetchMonBanChay(); break;
      case 'voucher': fetchVoucherStats(); break;
      case 'shipper': fetchShipperStats(); break;
      default: break;
    }
  }, [activeTab, fetchDoanhThuTheoNgay, fetchDoanhThuTheoThang, fetchMonBanChay, fetchVoucherStats, fetchShipperStats]);

  const formatCurrency = (v) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
  const formatNumber = (v) => new Intl.NumberFormat('vi-VN').format(v);
  const getPercentageChange = (cur, prev) => prev === 0 ? 0 : ((cur - prev) / prev * 100).toFixed(1);

  if (loading && !dashboardData) {
    return (
      <div className="thong-ke-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu thống kê...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="thong-ke-container">
      <header className="thong-ke-header">
        <h1>📊 Thống kê & Báo cáo</h1>
        <div className="header-controls">
          <div className="date-controls">
            {activeTab === 'shipper' ? (
              // Controls riêng cho tab shipper
              <div className="date-range">
                <label>Tháng:</label>
                <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                  ))}
                </select>
                <label>Năm:</label>
                <select value={selectedMonthYear} onChange={(e) => setSelectedMonthYear(parseInt(e.target.value))}>
                  {Array.from({ length: 5 }, (_, i) => {
                    const y = new Date().getFullYear() - i;
                    return <option key={y} value={y}>{y}</option>;
                  })}
                </select>
              </div>
            ) : (
              <>
                <div className="date-range">
                  <label>Từ ngày:</label>
                  <input type="date" value={dateRange.tuNgay} onChange={(e) => setDateRange(prev => ({ ...prev, tuNgay: e.target.value }))} />
                  <label>Đến ngày:</label>
                  <input type="date" value={dateRange.denNgay} onChange={(e) => setDateRange(prev => ({ ...prev, denNgay: e.target.value }))} />
                </div>
                <div className="year-selector">
                  <label>Năm:</label>
                  <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}>
                    {Array.from({ length: 5 }, (_, i) => {
                      const y = new Date().getFullYear() - i;
                      return <option key={y} value={y}>{y}</option>;
                    })}
                  </select>
                </div>
              </>
            )}
          </div>
          <button className="export-btn" onClick={exportToExcel}>📥 Xuất Excel</button>
        </div>
      </header>

      <nav className="thong-ke-tabs">
        {[
          { key: 'dashboard', label: '📈 Tổng quan' },
          { key: 'doanhThu', label: '💰 Doanh thu theo ngày' },
          { key: 'doanhThuThang', label: '📅 Doanh thu theo tháng' },
          { key: 'monBanChay', label: '🍽️ Món bán chạy' },
          { key: 'voucher', label: '🎫 Voucher' },
          { key: 'shipper', label: '🚚 Shipper' },
        ].map(t => (
          <button key={t.key} className={`tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </nav>

      <main className="thong-ke-content">

        {/* ===== DASHBOARD ===== */}
        {activeTab === 'dashboard' && dashboardData && (
          <div className="dashboard-section">
            <div className="stats-overview">
              <div className="stat-card today">
                <div className="stat-header"><h3>📅 Hôm nay</h3><span className="stat-icon">💰</span></div>
                <div className="stat-content">
                  <div className="stat-value">{formatCurrency(dashboardData.tongQuan.homNay?.tongDoanhThu || 0)}</div>
                  <div className="stat-details"><span>{dashboardData.tongQuan.homNay?.tongSoDon || 0} đơn hàng</span></div>
                </div>
              </div>
              <div className="stat-card week">
                <div className="stat-header"><h3>📈 Tuần qua</h3><span className="stat-icon">📊</span></div>
                <div className="stat-content">
                  <div className="stat-value">{formatCurrency(dashboardData.tongQuan.tuanQua?.tongDoanhThu || 0)}</div>
                  <div className="stat-details">
                    <span>{dashboardData.tongQuan.tuanQua?.tongSoDon || 0} đơn hàng</span>
                    <span>TB: {formatCurrency(dashboardData.tongQuan.tuanQua?.doanhThuTrungBinh || 0)}</span>
                  </div>
                </div>
              </div>
              <div className="stat-card month">
                <div className="stat-header"><h3>📊 Tháng qua</h3><span className="stat-icon">📈</span></div>
                <div className="stat-content">
                  <div className="stat-value">{formatCurrency(dashboardData.tongQuan.thangQua?.tongDoanhThu || 0)}</div>
                  <div className="stat-details">
                    <span>{dashboardData.tongQuan.thangQua?.tongSoDon || 0} đơn hàng</span>
                    <span>TB: {formatCurrency(dashboardData.tongQuan.thangQua?.doanhThuTrungBinh || 0)}</span>
                  </div>
                </div>
              </div>
              <div className="stat-card growth">
                <div className="stat-header"><h3>📈 Tăng trưởng</h3><span className="stat-icon">🎯</span></div>
                <div className="stat-content">
                  <div className="stat-value growth-rate">
                    {getPercentageChange(dashboardData.tongQuan.homNay?.tongDoanhThu || 0, dashboardData.tongQuan.homQua?.tongDoanhThu || 0)}%
                  </div>
                  <div className="stat-details"><span>So với hôm qua</span></div>
                </div>
              </div>
            </div>

            <div className="dashboard-charts">
              <div className="chart-section">
                <h3>🏆 Top 5 món bán chạy (7 ngày qua)</h3>
                <div className="top-items-list">
                  {dashboardData.monBanChay?.topMonAn?.slice(0, 5).map((item, index) => (
                    <div key={index} className="top-item">
                      <div className="item-rank">#{index + 1}</div>
                      <div className="item-info">
                        <div className="item-name">{item.tenMonAn}</div>
                        <div className="item-stats">Đã bán: <strong>{formatNumber(item.soLuongBan)}</strong> | Doanh thu: <strong>{formatCurrency(item.doanhThu)}</strong></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="chart-section">
                <h3>📊 Trạng thái đơn hàng</h3>
                <div className="status-stats">
                  {Object.entries(dashboardData.tongQuan.thongKeTrangThai || {}).map(([status, count]) => (
                    <div key={status} className={`status-item ${status.toLowerCase()}`}>
                      <div className="status-count">{formatNumber(count)}</div>
                      <div className="status-label">
                        {status === 'DANG_XU_LY' && 'Đang xử lý'}
                        {status === 'DANG_LAM' && 'Đang làm'}
                        {status === 'DANG_GIAO' && 'Đang giao'}
                        {status === 'HOAN_THANH' && 'Hoàn thành'}
                        {status === 'DA_HUY' && 'Đã hủy'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== DOANH THU NGÀY ===== */}
        {activeTab === 'doanhThu' && doanhThuData && (
          <div className="revenue-section">
            <div className="section-summary">
              <div className="summary-card"><h3>💰 Tổng doanh thu</h3><div className="summary-value">{formatCurrency(doanhThuData.tongDoanhThu)}</div></div>
              <div className="summary-card"><h3>📦 Tổng đơn hàng</h3><div className="summary-value">{formatNumber(doanhThuData.tongSoDon)}</div></div>
              <div className="summary-card"><h3>📈 Doanh thu TB/đơn</h3><div className="summary-value">{formatCurrency(doanhThuData.doanhThuTrungBinh)}</div></div>
            </div>
            <div className="chart-container">
              <h3>📊 Biểu đồ doanh thu theo ngày</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={doanhThuData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="ngay" /><YAxis />
                  <Tooltip formatter={(v) => formatCurrency(v)} /><Legend />
                  <Line type="monotone" dataKey="doanhThu" stroke="#8884d8" strokeWidth={3} name="Doanh thu" />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-container">
              <h3>📦 Số lượng đơn hàng theo ngày</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={doanhThuData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="ngay" /><YAxis />
                  <Tooltip /><Legend />
                  <Bar dataKey="soDon" fill="#82ca9d" name="Số đơn hàng" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ===== DOANH THU THÁNG ===== */}
        {activeTab === 'doanhThuThang' && doanhThuThangData && (
          <div className="monthly-revenue-section">
            <div className="section-summary">
              <div className="summary-card"><h3>💰 Tổng doanh thu năm {selectedYear}</h3><div className="summary-value">{formatCurrency(doanhThuThangData.tongDoanhThu)}</div></div>
              <div className="summary-card"><h3>📦 Tổng đơn hàng</h3><div className="summary-value">{formatNumber(doanhThuThangData.tongSoDon)}</div></div>
              <div className="summary-card"><h3>📊 TB tháng</h3><div className="summary-value">{formatCurrency(doanhThuThangData.tongDoanhThu / 12)}</div></div>
            </div>
            <div className="chart-container">
              <h3>📊 Doanh thu theo tháng năm {selectedYear}</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={doanhThuThangData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="thang" /><YAxis />
                  <Tooltip formatter={(v) => formatCurrency(v)} /><Legend />
                  <Bar dataKey="doanhThu" fill="#8884d8" name="Doanh thu" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ===== MÓN BÁN CHẠY ===== */}
        {activeTab === 'monBanChay' && monBanChayData && (
          <div className="bestseller-section">
            <div className="section-summary">
              <div className="summary-card"><h3>🍽️ Tổng món ăn khác nhau</h3><div className="summary-value">{monBanChayData.soMonKhacNhau}</div></div>
              <div className="summary-card"><h3>📦 Tổng số lượng bán</h3><div className="summary-value">{formatNumber(monBanChayData.tongSoLuongBan)}</div></div>
              <div className="summary-card"><h3>💰 Doanh thu món ăn</h3><div className="summary-value">{formatCurrency(monBanChayData.tongDoanhThuMonAn)}</div></div>
            </div>
            <div className="bestseller-list">
              <h3>🏆 Top món ăn bán chạy nhất</h3>
              <div className="items-table">
                <div className="table-header"><div>Hạng</div><div>Tên món ăn</div><div>Số lượng bán</div><div>Doanh thu</div><div>Đơn giá TB</div></div>
                {monBanChayData.topMonAn?.map((item, index) => (
                  <div key={index} className="table-row">
                    <div className="rank">#{index + 1}</div>
                    <div className="item-name">{item.tenMonAn}</div>
                    <div className="quantity">{formatNumber(item.soLuongBan)}</div>
                    <div className="revenue">{formatCurrency(item.doanhThu)}</div>
                    <div className="avg-price">{formatCurrency(item.donGiaTrungBinh)}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="chart-container">
              <h3>📊 Biểu đồ tròn top 8 món bán chạy</h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie data={monBanChayData.topMonAn?.slice(0, 8)} cx="50%" cy="50%" labelLine={false}
                    label={({ tenMonAn, percent }) => `${tenMonAn} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={120} dataKey="soLuongBan">
                    {monBanChayData.topMonAn?.slice(0, 8).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => formatNumber(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ===== VOUCHER ===== */}
        {activeTab === 'voucher' && voucherData && (
          <div className="voucher-section">
            <div className="section-summary">
              <div className="summary-card"><h3>🎫 Voucher khác nhau</h3><div className="summary-value">{voucherData.soVoucherKhacNhau}</div></div>
              <div className="summary-card"><h3>🔥 Tổng lượt sử dụng</h3><div className="summary-value">{formatNumber(voucherData.tongLuotSuDung)}</div></div>
            </div>
            <div className="voucher-list">
              <h3>📊 Thống kê voucher đã sử dụng</h3>
              <div className="voucher-table">
                <div className="table-header"><div>Mã voucher</div><div>Loại</div><div>Giá trị</div><div>Lượt dùng</div></div>
                {voucherData.voucherData?.map((voucher, index) => (
                  <div key={index} className="table-row">
                    <div className="voucher-code">{voucher.maVoucher}</div>
                    <div className="voucher-type">{voucher.loai === 'PHAN_TRAM' ? '% Giảm' : '₫ Giảm'}</div>
                    <div className="voucher-value">{voucher.loai === 'PHAN_TRAM' ? `${voucher.giaTri}%` : formatCurrency(voucher.giaTri)}</div>
                    <div className="usage-count">{formatNumber(voucher.soLuotSuDung)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===== SHIPPER ===== */}
        {activeTab === 'shipper' && (
          <div className="shipper-section">
            {shipperData ? (
              <>
                {/* Tổng quan */}
                <div className="section-summary">
                  <div className="summary-card shipper-blue">
                    <h3>🚚 Tổng shipper</h3>
                    <div className="summary-value">{shipperData.tongShipper}</div>
                  </div>
                  <div className="summary-card shipper-green">
                    <h3>✅ Tổng đơn hoàn thành</h3>
                    <div className="summary-value">{formatNumber(shipperData.tongDonHoanThanh)}</div>
                  </div>
                  <div className="summary-card shipper-orange">
                    <h3>⚠️ Tổng đơn trễ</h3>
                    <div className="summary-value">
                      {shipperData.danhSachShipper?.reduce((sum, s) => sum + (s.donTre || 0), 0)}
                    </div>
                  </div>
                </div>

                {/* Biểu đồ cột so sánh shipper */}
                {shipperData.danhSachShipper?.length > 0 && (
                  <div className="chart-container">
                    <h3>📊 So sánh đơn hàng giữa các shipper — Tháng {selectedMonth}/{selectedMonthYear}</h3>
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart data={shipperData.danhSachShipper} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hoTen" angle={-30} textAnchor="end" interval={0} tick={{ fontSize: 12 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="donDungHan" fill="#4caf50" name="Đúng hạn" stackId="a" />
                        <Bar dataKey="donTre" fill="#f44336" name="Trễ (>1 tiếng)" stackId="a" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Bảng chi tiết */}
                <div className="shipper-list">
                  <h3>📋 Bảng chi tiết từng shipper</h3>
                  <div className="shipper-table">
                    <div className="shipper-table-header">
                      <div>Họ tên</div>
                      <div>SĐT</div>
                      <div>Tổng đơn</div>
                      <div>Đúng hạn</div>
                      <div>Trễ</div>
                      <div>Tỉ lệ trễ</div>
                    </div>
                    {shipperData.danhSachShipper?.map((shipper, index) => (
                      <div key={index} className={`shipper-table-row ${shipper.tiLeTre > 30 ? 'row-warning' : ''}`}>
                        <div className="shipper-name">
                          <span className="shipper-avatar">{shipper.hoTen?.charAt(0)?.toUpperCase()}</span>
                          {shipper.hoTen}
                        </div>
                        <div className="shipper-phone">{shipper.soDienThoai || '—'}</div>
                        <div className="shipper-total"><strong>{shipper.tongDon}</strong></div>
                        <div className="shipper-ontime" style={{ color: '#27ae60' }}>
                          ✅ {shipper.donDungHan}
                        </div>
                        <div className="shipper-late" style={{ color: '#e53e3e' }}>
                          ⚠️ {shipper.donTre}
                        </div>
                        <div className="shipper-rate">
                          <span className={`rate-badge ${shipper.tiLeTre > 30 ? 'rate-bad' : shipper.tiLeTre > 10 ? 'rate-warn' : 'rate-good'}`}>
                            {shipper.tiLeTre}%
                          </span>
                        </div>
                      </div>
                    ))}

                    {shipperData.danhSachShipper?.length === 0 && (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                        📭 Không có dữ liệu shipper trong tháng này
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px', color: '#999' }}>
                <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
                <p>Đang tải dữ liệu shipper...</p>
              </div>
            )}
          </div>
        )}

      </main>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      )}
    </div>
  );
};

export default ThongKe;