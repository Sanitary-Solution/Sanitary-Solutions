import { apiRequest } from "./apiClient";

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, value);
    }
  });
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

const unwrap = (response) => response?.data;

export const loginAdminApi = async ({ username, password }) => {
  const response = await apiRequest("/auth/login", {
    method: "POST",
    body: { username, password },
  });
  return unwrap(response);
};

export const getCurrentUserApi = async () => {
  const response = await apiRequest("/auth/me", { auth: true });
  return unwrap(response);
};

export const changePasswordApi = async ({ currentPassword, newPassword }) => {
  const response = await apiRequest("/auth/change-password", {
    method: "POST",
    auth: true,
    body: { currentPassword, newPassword },
  });
  return response;
};

export const getCategoriesApi = async (params = {}) => {
  const response = await apiRequest(`/categories${buildQueryString(params)}`, { auth: true });
  return unwrap(response) || [];
};

export const createCategoryApi = async (payload) => {
  const response = await apiRequest("/categories", {
    method: "POST",
    auth: true,
    body: payload,
  });
  return unwrap(response);
};

export const updateCategoryApi = async (id, payload) => {
  const response = await apiRequest(`/categories/${id}`, {
    method: "PATCH",
    auth: true,
    body: payload,
  });
  return unwrap(response);
};

export const deleteCategoryApi = async (id) => {
  await apiRequest(`/categories/${id}`, { method: "DELETE", auth: true });
};

export const getBrandsApi = async (params = {}) => {
  const response = await apiRequest(`/brands${buildQueryString(params)}`, { auth: true });
  return unwrap(response) || [];
};

export const createBrandApi = async (payload) => {
  const response = await apiRequest("/brands", {
    method: "POST",
    auth: true,
    body: payload,
  });
  return unwrap(response);
};

export const updateBrandApi = async (id, payload) => {
  const response = await apiRequest(`/brands/${id}`, {
    method: "PATCH",
    auth: true,
    body: payload,
  });
  return unwrap(response);
};

export const deleteBrandApi = async (id) => {
  await apiRequest(`/brands/${id}`, { method: "DELETE", auth: true });
};

export const getProductsApi = async (params = {}) => {
  const response = await apiRequest(`/products${buildQueryString(params)}`, { auth: true });
  return {
    data: unwrap(response) || [],
    meta: response?.meta || null,
  };
};

export const createProductApi = async (payload) => {
  const response = await apiRequest("/products", {
    method: "POST",
    auth: true,
    body: payload,
  });
  return unwrap(response);
};

export const updateProductApi = async (id, payload) => {
  const response = await apiRequest(`/products/${id}`, {
    method: "PATCH",
    auth: true,
    body: payload,
  });
  return unwrap(response);
};

export const deleteProductApi = async (id) => {
  await apiRequest(`/products/${id}`, { method: "DELETE", auth: true });
};

export const getOrdersApi = async (params = {}) => {
  const response = await apiRequest(`/orders${buildQueryString(params)}`, { auth: true });
  return {
    data: unwrap(response) || [],
    meta: response?.meta || null,
  };
};

export const getContactsApi = async (params = {}) => {
  const response = await apiRequest(`/contacts${buildQueryString(params)}`, { auth: true });
  return {
    data: unwrap(response) || [],
    meta: response?.meta || null,
  };
};

export const updateOrderStatusApi = async (id, status) => {
  const response = await apiRequest(`/orders/${id}/status`, {
    method: "PATCH",
    auth: true,
    body: { status },
  });
  return unwrap(response);
};

export const deleteOrderApi = async (id) => {
  await apiRequest(`/orders/${id}`, { method: "DELETE", auth: true });
};

export const deleteContactApi = async (id) => {
  await apiRequest(`/contacts/${id}`, { method: "DELETE", auth: true });
};

export const getQuotesApi = async (params = {}) => {
  const response = await apiRequest(`/quotes${buildQueryString(params)}`, { auth: true });
  return {
    data: unwrap(response) || [],
    meta: response?.meta || null,
  };
};

export const updateQuoteStatusApi = async (id, status) => {
  const response = await apiRequest(`/quotes/${id}/status`, {
    method: "PATCH",
    auth: true,
    body: { status },
  });
  return unwrap(response);
};

export const deleteQuoteApi = async (id) => {
  await apiRequest(`/quotes/${id}`, { method: "DELETE", auth: true });
};

export const getCustomersApi = async (params = {}) => {
  const response = await apiRequest(`/customers${buildQueryString(params)}`, { auth: true });
  return {
    data: unwrap(response) || [],
    meta: response?.meta || null,
  };
};

export const getCustomerByIdApi = async (id) => {
  const response = await apiRequest(`/customers/${id}`, { auth: true });
  return unwrap(response);
};

export const deleteCustomerApi = async (id) => {
  await apiRequest(`/customers/${id}`, { method: "DELETE", auth: true });
};

export const getSettingsApi = async () => {
  const response = await apiRequest("/settings/store", { auth: true });
  return unwrap(response);
};

export const updateSettingsApi = async (payload) => {
  const response = await apiRequest("/settings/store", {
    method: "PATCH",
    auth: true,
    body: payload,
  });
  return unwrap(response);
};

export const getDashboardBundleApi = async (params = {}) => {
  const response = await apiRequest(`/dashboard/bundle${buildQueryString(params)}`, { auth: true });
  return unwrap(response);
};
