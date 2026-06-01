import client from "./client";

export const getInventory = (params) => client.get("/inventory/", { params });
export const getLowStock = (params) => client.get("/inventory/low-stock", { params });
export const adjustStock = (productId, data) => client.put(`/inventory/${productId}`, data);
