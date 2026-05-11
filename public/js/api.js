window.Api = {
  async request(url, options = {}) {
    const response = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      ...options
    });

    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await response.json() : null;

    if (!response.ok) {
      const error = new Error(payload?.message || "Ошибка запроса");
      error.payload = payload;
      throw error;
    }

    return payload;
  },

  getProducts() {
    return this.request("/api/products");
  },

  checkAvailability(productId, date, quantity = 1) {
    const params = new URLSearchParams({ productId, date, quantity });
    return this.request(`/api/products/availability?${params.toString()}`);
  },

  createOrder(payload) {
    return this.request("/api/orders", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  register(payload) {
    return this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  login(payload) {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },

  logout() {
    return this.request("/api/auth/logout", { method: "POST" });
  },

  me() {
    return this.request("/api/auth/me");
  },

  getMyOrders() {
    return this.request("/api/orders/my");
  },

  getOrders() {
    return this.request("/api/admin/orders");
  },

  updateOrder(id, payload) {
    return this.request(`/api/admin/orders/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    });
  }
};
