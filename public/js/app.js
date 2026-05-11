const stateEl = document.querySelector("[data-products-state]");
const dessertsGrid = document.querySelector("[data-desserts-grid]");
const cakesGrid = document.querySelector("[data-cakes-grid]");
const dessertDate = document.querySelector("[data-dessert-date]");
const drawer = document.querySelector("[data-cart-drawer]");

let allProducts = [];

function openCart() {
  drawer?.classList.add("open");
  drawer?.setAttribute("aria-hidden", "false");
}

function closeCart() {
  drawer?.classList.remove("open");
  drawer?.setAttribute("aria-hidden", "true");
}

function renderProducts() {
  const date = dessertDate.value;
  dessertsGrid.innerHTML = "";
  cakesGrid.innerHTML = "";

  allProducts
    .filter((product) => product.type === "DESSERT")
    .forEach((product) => dessertsGrid.appendChild(CandyComponents.createProductCard(product, date)));

  allProducts
    .filter((product) => product.type === "CAKE")
    .forEach((product) => cakesGrid.appendChild(CandyComponents.createProductCard(product, date)));
}

async function initProducts() {
  dessertDate.value = CandyComponents.todayInputValue();
  dessertDate.min = CandyComponents.todayInputValue();

  try {
    const { products } = await Api.getProducts();
    allProducts = products;
    stateEl.classList.add("hidden");
    renderProducts();
  } catch (error) {
    stateEl.textContent = "Не получилось загрузить витрину. Проверьте сервер и базу данных.";
    stateEl.classList.add("error");
  }
}

document.querySelectorAll("[data-open-cart]").forEach((button) => button.addEventListener("click", openCart));
document.querySelectorAll("[data-close-cart]").forEach((button) => button.addEventListener("click", closeCart));
dessertDate?.addEventListener("change", renderProducts);
window.addEventListener("cart:changed", () => {
  CandyComponents.renderCart();
  openCart();
});

initProducts();
CandyComponents.renderCart();
