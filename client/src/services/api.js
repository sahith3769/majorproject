import axios from "axios";

const API = axios.create({
  baseURL: "/api",
  withCredentials: true, // MUST HAVE to send cookies
});

// Request Interceptor (attaches accessToken)
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = token;
  }
  return req;
});

// Response Interceptor (catches 401 and refreshes token)
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If we got a 401 Unauthorized and haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Attempt to refresh the access token using the HTTPOnly cookie
        const res = await axios.post("/api/auth/refresh", {}, { withCredentials: true });
        
        // Save the new access token
        localStorage.setItem("token", res.data.token);
        
        // Update the failed request with the new token and retry
        originalRequest.headers.Authorization = res.data.token;
        return API(originalRequest);
      } catch (refreshError) {
        // Refresh token expired or invalid, log out completely
        localStorage.removeItem("token");
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default API;
