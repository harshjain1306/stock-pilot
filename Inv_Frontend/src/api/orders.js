import client from "./client";

export const getOrders = (params) => client.get("/orders/", { params });
export const getOrder = (id) => client.get(`/orders/${id}`);
export const createOrder = (data) => client.post("/orders/", data);
export const updateOrderStatus = (id, status) => client.put(`/orders/${id}/status`, { status });
export const deleteOrder = (id) => client.delete(`/orders/${id}`);
