import React, { useState } from 'react';
import DonChoNhan from './DonChoNhan';         
import GiaoHang from './GiaoHang';          
import './ShipperDashboard.css';

const ShipperDashboard = () => {
  const [activeTab, setActiveTab] = useState('dang-giao'); // 'cho-nhan' | 'dang-giao'

  return (
    <div className="shipper-dashboard">
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'cho-nhan' ? 'active' : ''}`}
          onClick={() => setActiveTab('cho-nhan')}
        >
           Đơn chờ nhận
        </button>
        <button
          className={`tab-btn ${activeTab === 'dang-giao' ? 'active' : ''}`}
          onClick={() => setActiveTab('dang-giao')}
        >
           Đơn đang giao
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'cho-nhan' && <DonChoNhan />}
        {activeTab === 'dang-giao' && <GiaoHang />}
      </div>
    </div>
  );
};

export default ShipperDashboard;