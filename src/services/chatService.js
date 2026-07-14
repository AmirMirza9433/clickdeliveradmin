import API from "./api";

const SOCKET_BASE = API.defaults.baseURL.replace(/\/api\/?$/, "/");

export const chatService = {
  getSocketBaseUrl: () => SOCKET_BASE,

  getConversations: async () => {
    const response = await API.get("/chat/conversations");
    return response.data;
  },

  getAllConversations: async () => {
    const response = await API.get("/chat/admin/conversations");
    return response.data;
  },

  getChatUsers: async () => {
    const response = await API.get("/chat/admin/users");
    return response.data;
  },

  startConversation: async (participantId) => {
    const response = await API.post("/chat/conversations", { participantId });
    return response.data;
  },

  getMessages: async (conversationId) => {
    const response = await API.get(
      `/chat/conversations/${conversationId}/messages`,
    );
    return response.data;
  },

  sendMessage: async (conversationId, payload) => {
    const response = await API.post(
      `/chat/conversations/${conversationId}/messages`,
      payload,
    );
    return response.data;
  },

  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append("image", file);
    const response = await API.post("/upload/image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  uploadVideo: async (file) => {
    const formData = new FormData();
    formData.append("video", file);
    const response = await API.post("/upload/video", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  uploadFile: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await API.post("/upload/file", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};
