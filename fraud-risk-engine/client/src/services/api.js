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

<<<<<<< HEAD
export default api;
=======
export default api;
>>>>>>> eab2da171b4154f0bbd7e563ac01f71fbeae78d3
