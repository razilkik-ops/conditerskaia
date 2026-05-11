function todayInputValue(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#039;"
  })[char]);
}

const LOCAL_PRODUCT_ART = {
  "oblachnaya-klubnika": "/assets/lumiere-hero.jpg",
  "mango-disco": "/assets/lumiere-boutique.jpg",
  "shoko-kometa": "/assets/lumiere-hero.jpg",
  "malinovy-kubik": "/assets/lumiere-hero.jpg",
  "makaron-solenaya-karamel": "/assets/lumiere-hero.jpg",
  "ekler-fialkovy-krem": "/assets/lumiere-boutique.jpg",
  "limonnaya-molniya": "/assets/lumiere-hero.jpg"
};

function productImage(product) {
  return LOCAL_PRODUCT_ART[product.slug] || product.imageUrl;
}

function createProductCard(product, selectedDate) {
  const card = document.createElement("article");
  card.className = `product-capsule ${product.type === "CAKE" ? "capsule-cake" : "capsule-dessert"} product-art-${product.slug || "default"}`;
  const imageUrl = productImage(product);
  card.innerHTML = `
    <div class="capsule-media">
      <div class="media-glass">
        <img src="${imageUrl}" alt="${escapeHtml(product.name)}" loading="lazy" />
      </div>
      <span class="category-ticket">${escapeHtml(product.category)}</span>
      <span class="type-pin">${product.type === "CAKE" ? "торт" : "десерт"}</span>
    </div>
    <div class="capsule-copy">
      <div class="capsule-titleline">
        <h3>${escapeHtml(product.name)}</h3>
        <strong>${formatMoney(product.price)}</strong>
      </div>
      <p>${escapeHtml(product.description)}</p>
      <div class="capsule-controls" data-card-slot></div>
    </div>
  `;

  const slot = card.querySelector("[data-card-slot]");

  if (product.type === "CAKE") {
    slot.appendChild(createCakeConfigurator(product, selectedDate));
  } else {
    slot.appendChild(createDessertAvailabilityCard(product, selectedDate));
  }

  return card;
}

function createCakeConfigurator(product, selectedDate) {
  const wrap = document.createElement("div");
  wrap.className = "cake-console";
  const options = product.cakeOptions || [];
  const firstOption = options[0] || { weight: "1.5 кг", filling: "Ваниль", decorStyle: "Кремовый", extraPrice: 0 };

  wrap.innerHTML = `
    <label>Сборка
      <select data-option>
        ${options.map((option, index) => `
          <option value="${index}">${option.weight} / ${option.filling} / +${formatMoney(option.extraPrice)}</option>
        `).join("")}
      </select>
    </label>
    <label>Дата
      <input type="date" data-date value="${selectedDate}" min="${todayInputValue()}" />
    </label>
    <label>Количество
      <input type="number" data-qty min="1" max="5" value="1" />
    </label>
    <div class="mini-display">
      <span data-style>${escapeHtml(firstOption.decorStyle)}</span>
      <strong data-total>${formatMoney(product.price + firstOption.extraPrice)}</strong>
    </div>
    <button class="action-button cool wide" type="button" data-add>Добавить торт</button>
  `;

  const optionInput = wrap.querySelector("[data-option]");
  const qtyInput = wrap.querySelector("[data-qty]");
  const totalEl = wrap.querySelector("[data-total]");
  const styleEl = wrap.querySelector("[data-style]");

  const currentOption = () => options[Number(optionInput.value)] || firstOption;
  const refresh = () => {
    const option = currentOption();
    styleEl.textContent = option.decorStyle;
    totalEl.textContent = formatMoney((product.price + option.extraPrice) * Number(qtyInput.value || 1));
  };

  optionInput.addEventListener("change", refresh);
  qtyInput.addEventListener("input", refresh);

  wrap.querySelector("[data-add]").addEventListener("click", () => {
    const option = currentOption();
    Cart.add({
      productId: product.id,
      name: product.name,
      imageUrl: productImage(product),
      quantity: Number(qtyInput.value || 1),
      selectedDate: wrap.querySelector("[data-date]").value,
      selectedOptions: {
        weight: option.weight,
        filling: option.filling,
        decorStyle: option.decorStyle,
        extraPrice: option.extraPrice
      },
      unitPrice: product.price + option.extraPrice
    });
  });

  return wrap;
}

function createDessertAvailabilityCard(product, selectedDate) {
  const wrap = document.createElement("div");
  wrap.className = "stock-console";
  wrap.innerHTML = `
    <div class="stock-display" data-availability>
      <span class="status-light loading"></span>
      <span>Проверяем остатки...</span>
    </div>
    <label>Количество
      <input type="number" data-qty min="1" max="20" value="1" />
    </label>
    <button class="action-button cool wide" type="button" data-add disabled>Добавить десерт</button>
  `;

  const qtyInput = wrap.querySelector("[data-qty]");
  const availabilityEl = wrap.querySelector("[data-availability]");
  const button = wrap.querySelector("[data-add]");

  async function refresh() {
    availabilityEl.innerHTML = `<span class="status-light loading"></span><span>Проверяем остатки...</span>`;
    button.disabled = true;

    try {
      const { availability } = await Api.checkAvailability(product.id, selectedDate, Number(qtyInput.value || 1));
      const left = availability.quantityAvailable ?? "много";
      availabilityEl.innerHTML = `
        <span class="status-light ${availability.canOrder ? "ok" : "bad"}"></span>
        <span>${availability.message}. Осталось: ${left}</span>
      `;
      button.disabled = !availability.canOrder;
    } catch (error) {
      availabilityEl.innerHTML = `<span class="status-light bad"></span><span>${escapeHtml(error.message)}</span>`;
    }
  }

  qtyInput.addEventListener("input", refresh);
  button.addEventListener("click", () => {
    Cart.add({
      productId: product.id,
      name: product.name,
      imageUrl: productImage(product),
      quantity: Number(qtyInput.value || 1),
      selectedDate,
      selectedOptions: {},
      unitPrice: product.price
    });
  });

  refresh();
  return wrap;
}

function renderCart() {
  const itemsEl = document.querySelector("[data-cart-items]");
  const emptyEl = document.querySelector("[data-cart-empty]");
  const totalEls = document.querySelectorAll("[data-cart-total], [data-checkout-total]");
  const countEl = document.querySelector("[data-cart-count]");

  if (!itemsEl) return;

  itemsEl.innerHTML = Cart.items.map((item) => `
    <article class="bag-line">
      <div class="bag-thumb"><img src="${item.imageUrl}" alt="${escapeHtml(item.name)}" /></div>
      <div class="bag-meta">
        <strong>${escapeHtml(item.name)}</strong>
        <small>${item.selectedDate}${item.selectedOptions?.weight ? ` / ${escapeHtml(item.selectedOptions.weight)}` : ""}</small>
        <div class="bag-controls">
          <input type="number" min="1" value="${item.quantity}" data-cart-qty="${item.fingerprint}" />
          <button type="button" data-cart-remove="${item.fingerprint}">Удалить</button>
        </div>
      </div>
      <b>${formatMoney(item.unitPrice * item.quantity)}</b>
    </article>
  `).join("");

  emptyEl.classList.toggle("hidden", Cart.items.length > 0);
  totalEls.forEach((el) => { el.textContent = formatMoney(Cart.total()); });
  if (countEl) countEl.textContent = Cart.count();

  itemsEl.querySelectorAll("[data-cart-remove]").forEach((button) => {
    button.addEventListener("click", () => Cart.remove(button.dataset.cartRemove));
  });
  itemsEl.querySelectorAll("[data-cart-qty]").forEach((input) => {
    input.addEventListener("change", () => Cart.updateQuantity(input.dataset.cartQty, input.value));
  });
}

window.CandyComponents = {
  todayInputValue,
  createProductCard,
  renderCart,
  escapeHtml
};
