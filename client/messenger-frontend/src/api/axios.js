import axios from "axios";
import { io } from "socket.io-client";

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getConversations = () =>
  api.get("/chat/getConversations");

export const createDirectConversation = (userId) =>
  api.post("/chat/createConversation", { userId });

export const createGroupConversation = (name, userIds) =>
  api.post("/chat/createConversation", { name, userIds });

export const getMessages = (conversationId) =>
  api.get(`/messages/${conversationId}`);

export const sendMessage = (conversationId, text) =>
  api.post("/messages/createMessage", { conversationId, text });

export const searchUsers = (query) =>
  api.get(`/users/search?query=${query}`);

export const markAsSeen = (conversationId) =>
  api.patch(`/messages/${conversationId}/seen`);

export default api;