const loginBox = document.querySelector("[data-login-box]");
const consoleBox = document.querySelector("[data-orders-console]");
const loginForm = document.querySelector("[data-login-form]");
const loginMessage = document.querySelector("[data-login-message]");
const table = document.querySelector("[data-orders-table]");
const adminState = document.querySelector("[data-admin-state]");
let orders = [];

function formatMoney(amount) {
  return `${Math.round(amount / 100)} BYN`;
}

function statusBadge(status, type = "order") {
  const labels = {
    NEW: "Новый",
    CONFIRMED: "Подтверждён",
    IN_PROGRESS: "Готовится",
    READY: "Готов",
    COMPLETED: "Завершён",
    CANCELLED: "Отменён",
    PENDING: "Ожидает",
    PAID: "Оплачен",
    FAILED: "Ошибка",
    REFUNDED: "Возврат"
  };
  return `<span class="status-badge ${type}-${status.toLowerCase()}">${labels[status] || status}</span>`;
}

function renderMetrics() {
  document.querySelector("[data-metric-new]").textContent = orders.filter((order) => order.status === "NEW").length;
  document.querySelector("[data-metric-paid]").textContent = orders.filter((order) => order.paymentStatus === "PAID").length;
  const revenue = orders
    .filter((order) => order.paymentStatus === "PAID")
    .reduce((sum, order) => sum + order.totalAmount, 0);
  document.querySelector("[data-metric-revenue]").textContent = formatMoney(revenue);
}

function renderOrders() {
  if (!orders.length) {
    table.innerHTML = `<tr><td colspan="6" class="empty-table">Заказов пока нет.</td></tr>`;
    renderMetrics();
    return;
  }

  table.innerHTML = orders.map((order) => `
    <tr>
      <td><strong>#${order.id.slice(-6).toUpperCase()}</strong><small>${new Date(order.createdAt).toLocaleString("ru-RU")}</small></td>
      <td><strong>${CandyEscape(order.customerName)}</strong><small>${CandyEscape(order.customerPhone)}<br>${CandyEscape(order.customerEmail)}</small></td>
      <td>${order.items.map((item) => `<span class="item-chip">${CandyEscape(item.product.name)} x${item.quantity}</span>`).join("")}</td>
      <td><strong>${order.fulfillmentType === "PICKUP" ? "Самовывоз" : "Доставка"}</strong><small>${new Date(order.pickupDateTime).toLocaleString("ru-RU")}</small></td>
      <td><strong>${formatMoney(order.totalAmount)}</strong></td>
      <td>
        <div class="badge-stack">${statusBadge(order.status)}${statusBadge(order.paymentStatus, "payment")}</div>
        <select data-status="${order.id}">
          ${["NEW", "CONFIRMED", "IN_PROGRESS", "READY", "COMPLETED", "CANCELLED"].map((status) => `<option value="${status}" ${status === order.status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </td>
    </tr>
  `).join("");

  table.querySelectorAll("[data-status]").forEach((select) => {
    select.addEventListener("change", async () => {
      const { order } = await Api.updateOrder(select.dataset.status, { status: select.value });
      upsertOrder(order);
    });
  });

  renderMetrics();
}

function CandyEscape(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function upsertOrder(order) {
  const index = orders.findIndex((item) => item.id === order.id);
  if (index >= 0) {
    orders[index] = order;
  } else {
    orders.unshift(order);
  }
  renderOrders();
}

async function loadOrders() {
  const result = await Api.getOrders();
  orders = result.orders;
  adminState.textContent = "Поток подключён. Новые оплаты и заказы появятся без перезагрузки.";
  renderOrders();
}

function showConsole() {
  loginBox.classList.add("hidden");
  consoleBox.classList.remove("hidden");
  loadOrders();
  const socket = io();
  socket.emit("admin:join");
  ["order:created", "order:updated", "order:paid"].forEach((event) => {
    socket.on(event, upsertOrder);
  });
}

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(loginForm));
  loginMessage.textContent = "";
  try {
    const { user } = await Api.login(data);
    if (!user.isAdmin) throw new Error("У пользователя нет прав администратора");
    showConsole();
  } catch (error) {
    loginMessage.textContent = error.message;
    loginMessage.className = "form-message error";
  }
});

document.querySelector("[data-logout]")?.addEventListener("click", async () => {
  await Api.logout();
  window.location.reload();
});

Api.me().then(({ user }) => {
  if (user?.isAdmin) showConsole();
}).catch(() => {});
