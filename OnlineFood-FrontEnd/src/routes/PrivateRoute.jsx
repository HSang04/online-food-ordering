import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRoles }) => {
  const vaiTro = localStorage.getItem('vaiTro');

  if (!vaiTro || !allowedRoles.includes(vaiTro.toLowerCase())) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};

export default PrivateRoute;
