import axios from "axios";

const API = axios.create({
  baseURL: "https://assignment-backend-123.onrender.com"
});

export default API;