
import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:8080/api',
});


instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      alert('Hết phiên hoặc không có quyền! Vui lòng đăng nhập lại.');
    }
    return Promise.reject(error);
  }
);

export default instance;
