import axios from "axios";
import cookie from "react-cookies";

export const BASE_URL = "http://localhost:8080";

export const endpoints = {
  LOGIN: `${BASE_URL}/auth/login`,
  SIGNUP: "/auth/signup",
};

export const authAxios = () => {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${cookie.load("token")}`,
    },
  });
};

export default axios.create({
  baseURL: BASE_URL,
});