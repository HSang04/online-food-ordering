import axios from 'axios';

const instance = axios.create({
   baseURL: `${process.env.REACT_APP_API_URL}/api`,
   headers: {
     'ngrok-skip-browser-warning': 'true' 
   }
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
    return Promise.reject(error);
  }
);

export default instance;