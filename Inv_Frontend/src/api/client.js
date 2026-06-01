import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://inv-backend-ccy7.onrender.com/api/v1",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.message || err.message || "Something went wrong";
    return Promise.reject({ ...err, userMessage: message });
  }
);

export default client;
