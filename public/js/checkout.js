const checkoutForm = document.querySelector("[data-checkout-form]");
const addressField = document.querySelector("[data-address-field]");
const checkoutMessage = document.querySelector("[data-checkout-message]");

function serializeCheckout(form) {
  const data = new FormData(form);
  return {
    customerName: data.get("customerName"),
    customerEmail: data.get("customerEmail"),
    customerPhone: data.get("customerPhone"),
    fulfillmentType: data.get("fulfillmentType"),
    deliveryAddress: data.get("deliveryAddress") || null,
    pickupDateTime: data.get("pickupDateTime"),
    comment: data.get("comment") || null,
    orderType: "STANDARD",
    items: Cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      selectedDate: item.selectedDate,
      selectedOptions: item.selectedOptions || {}
    }))
  };
}

checkoutForm?.addEventListener("change", () => {
  const isDelivery = new FormData(checkoutForm).get("fulfillmentType") === "DELIVERY";
  addressField?.classList.toggle("hidden", !isDelivery);
});

checkoutForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!Cart.items.length) {
    checkoutMessage.textContent = "Добавьте хотя бы один десерт или торт в корзину.";
    checkoutMessage.className = "form-message error";
    return;
  }

  const button = checkoutForm.querySelector("button[type='submit']");
  button.disabled = true;
  button.textContent = "Создаём заказ...";
  checkoutMessage.textContent = "";

  try {
    const result = await Api.createOrder(serializeCheckout(checkoutForm));
    Cart.clear();
    checkoutMessage.textContent = result.message;
    checkoutMessage.className = "form-message success";
    window.location.href = result.paymentUrl;
  } catch (error) {
    checkoutMessage.textContent = error.message;
    checkoutMessage.className = "form-message error";
  } finally {
    button.disabled = false;
    button.textContent = "Оплатить онлайн";
  }
});
