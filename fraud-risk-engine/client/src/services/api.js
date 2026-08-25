import axios from "axios";

const api = axios.create({
    baseURL: "https://dhanrakshak-backend-lpt8.onrender.com/api",
    timeout: 60000,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;