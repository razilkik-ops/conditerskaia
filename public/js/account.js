const accountAuth = document.querySelector("[data-account-auth]");
const accountPanel = document.querySelector("[data-account-panel]");
const accountName = document.querySelector("[data-account-name]");
const accountEmail = document.querySelector("[data-account-email]");
const accountOrders = document.querySelector("[data-account-orders]");
const accountCartItems = document.querySelector("[data-account-cart-items]");
const accountCartEmpty = document.querySelector("[data-account-cart-empty]");
const accountCartTotal = document.querySelector("[data-account-cart-total]");
const accountMessage = document.querySelector("[data-account-message]");
const registerMessage = document.querySelector("[data-register-message]");
const publicLoginForm = document.querySelector("[data-login-form-public]");
const registerForm = document.querySelector("[data-register-form]");

let currentAccount = null;

const ORDER_LABELS = {
  NEW: "Новый",
  CONFIRMED: "Подтверждён",
  IN_PROGRESS: "Готовится",
  READY: "Готов к выдаче",
  COMPLETED: "Завершён",
  CANCELLED: "Отменён"
};

const PAYMENT_LABELS = {
  PENDING: "Ожидает оплаты",
  PAID: "Оплачен",
  FAILED: "Ошибка оплаты",
  REFUNDED: "Возврат"
};

function accountEscape(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

function statusClass(status) {
  return String(status || "").toLowerCase();
}

function statusBadge(status, labels, prefix) {
  return `<span class="status-badge ${prefix}-${statusClass(status)}">${labels[status] || status}</span>`;
}

function formatAccountDate(value) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function fillCheckout(user) {
  const form = document.querySelector("[data-checkout-form]");
  if (!form || !user) return;

  const name = form.elements.customerName;
  const email = form.elements.customerEmail;
  const phone = form.elements.customerPhone;
  if (name && !name.value) name.value = user.name || "";
  if (email && !email.value) email.value = user.email || "";
  if (phone && !phone.value) phone.value = user.phone || "";
}

function renderAccount(user) {
  currentAccount = user;
  accountAuth?.classList.toggle("hidden", Boolean(user));
  accountPanel?.classList.toggle("hidden", !user);

  if (!user) return;

  accountName.textContent = user.name;
  accountEmail.textContent = user.email;
  fillCheckout(user);
  renderAccountCart();
  loadAccountOrders();
}

function renderAccountCart() {
  if (!accountCartItems || !accountCartEmpty || !accountCartTotal) return;

  accountCartItems.innerHTML = Cart.items.map((item) => `
    <article class="account-cart-line">
      <img src="${item.imageUrl}" alt="${accountEscape(item.name)}" />
      <div>
        <strong>${accountEscape(item.name)}</strong>
        <small>${item.quantity} шт. · ${formatMoney(item.unitPrice * item.quantity)}</small>
      </div>
    </article>
  `).join("");

  accountCartEmpty.classList.toggle("hidden", Cart.items.length > 0);
  accountCartTotal.textContent = formatMoney(Cart.total());
}

function renderOrders(orders = []) {
  if (!orders.length) {
    accountOrders.innerHTML = `<div class="load-panel">У вас пока нет заказов. После оформления они появятся здесь.</div>`;
    return;
  }

  accountOrders.innerHTML = orders.map((order) => `
    <article class="order-card">
      <div class="order-card-head">
        <div>
          <strong>Заказ #${order.id.slice(-6).toUpperCase()}</strong>
          <small>${formatAccountDate(order.createdAt)}</small>
        </div>
        <div class="order-statuses">
          ${statusBadge(order.status, ORDER_LABELS, "status")}
          ${statusBadge(order.paymentStatus, PAYMENT_LABELS, "payment")}
        </div>
      </div>
      <div class="order-items">
        ${order.items.map((item) => `<span class="order-pill">${accountEscape(item.product.name)} x${item.quantity}</span>`).join("")}
      </div>
      <div class="order-card-foot">
        <span>${order.fulfillmentType === "PICKUP" ? "Самовывоз" : "Доставка"}: ${formatAccountDate(order.pickupDateTime)}</span>
        <strong>${formatMoney(order.totalAmount)}</strong>
      </div>
    </article>
  `).join("");
}

async function loadAccountOrders() {
  if (!currentAccount || !accountOrders) return;

  accountOrders.innerHTML = `<div class="load-panel">Загружаем историю заказов...</div>`;
  try {
    const { orders } = await Api.getMyOrders();
    renderOrders(orders);
  } catch (error) {
    accountOrders.innerHTML = `<div class="load-panel error">${accountEscape(error.message)}</div>`;
  }
}

function setTab(tab) {
  document.querySelectorAll("[data-account-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.accountTab === tab);
  });
  publicLoginForm?.classList.toggle("hidden", tab !== "login");
  registerForm?.classList.toggle("hidden", tab !== "register");
}

document.querySelectorAll("[data-account-tab]").forEach((button) => {
  button.addEventListener("click", () => setTab(button.dataset.accountTab));
});

publicLoginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  accountMessage.textContent = "";

  try {
    const { user } = await Api.login(Object.fromEntries(new FormData(publicLoginForm)));
    renderAccount(user);
  } catch (error) {
    accountMessage.textContent = error.message;
    accountMessage.className = "form-message error";
  }
});

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  registerMessage.textContent = "";

  try {
    const { user } = await Api.register(Object.fromEntries(new FormData(registerForm)));
    renderAccount(user);
  } catch (error) {
    registerMessage.textContent = error.message;
    registerMessage.className = "form-message error";
  }
});

document.querySelector("[data-account-logout]")?.addEventListener("click", async () => {
  await Api.logout();
  currentAccount = null;
  renderAccount(null);
  setTab("login");
});

document.querySelector("[data-refresh-orders]")?.addEventListener("click", loadAccountOrders);
window.addEventListener("cart:changed", renderAccountCart);
window.addEventListener("account:refresh-orders", loadAccountOrders);

Api.me()
  .then(({ user }) => renderAccount(user && !user.isAdmin ? user : null))
  .catch(() => renderAccount(null));
