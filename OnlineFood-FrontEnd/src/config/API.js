import axios from "axios";
import cookie from "react-cookies";

export const BASE_URL = process.env.REACT_APP_API_URL ;

export const endpoints = {
  LOGIN: `${BASE_URL}/auth/login`,
  SIGNUP: "/auth/signup",
};

export const authAxios = () => {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${cookie.load("token")}`,
      'ngrok-skip-browser-warning': 'true'  
    },
  });
};

export default axios.create({
  baseURL: BASE_URL,
  headers: {
    'ngrok-skip-browser-warning': 'true'  
  }
});