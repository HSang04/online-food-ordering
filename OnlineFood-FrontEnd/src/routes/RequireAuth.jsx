import React from 'react';
import { Navigate } from 'react-router-dom';


const RequireAuth = ({ children, allowedRoles = [], requireLogin = true }) => {
  const token = localStorage.getItem('jwt');
  const vaiTro = localStorage.getItem('vaiTro');


  if (requireLogin && !token) {
    return <Navigate to="/login" replace />;
  }

 
  if (allowedRoles.length === 0) {
    return children;
  }


  if (!allowedRoles.includes(vaiTro)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

const RequireAdmin = ({ children }) => {
  const vaiTro = localStorage.getItem('vaiTro');

  if (vaiTro !== 'ADMIN') {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};


const RequireManagement = ({ children }) => {
  const vaiTro = localStorage.getItem('vaiTro');
  
  const allowedRoles = [
    'ADMIN', 
    'QUANLY', 
    'NHANVIEN_QUANLYDONHANG', 
    'NHANVIEN_QUANLYMONAN'
  ];

  if (!allowedRoles.includes(vaiTro)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};


const RequireOrderManagement = ({ children }) => {
  const vaiTro = localStorage.getItem('vaiTro');
  
  const allowedRoles = [
    'ADMIN', 
    'QUANLY', 
    'NHANVIEN_QUANLYDONHANG'
  ];

  if (!allowedRoles.includes(vaiTro)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};


const RequireFoodManagement = ({ children }) => {
  const vaiTro = localStorage.getItem('vaiTro');
  
  const allowedRoles = [
    'ADMIN', 
    'QUANLY', 
    'NHANVIEN_QUANLYMONAN'
  ];

  if (!allowedRoles.includes(vaiTro)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RequireAuth;
export { 
  RequireAdmin, 
  RequireManagement, 
  RequireOrderManagement, 
  RequireFoodManagement 
};