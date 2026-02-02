import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
});

export async function previewExcel(file) {
  const fd = new FormData();
  fd.append("file", file);
  const { data } = await api.post("/preview", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function generatePedidos(file, user_email) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("user_email", user_email);
  const { data } = await api.post("/generate", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
