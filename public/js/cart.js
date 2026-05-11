const CART_KEY = "candy-orbit-cart";

function formatMoney(amount) {
  return `${Math.round(amount / 100)} BYN`;
}

window.formatMoney = formatMoney;

window.Cart = {
  items: JSON.parse(localStorage.getItem(CART_KEY) || "[]"),

  save() {
    localStorage.setItem(CART_KEY, JSON.stringify(this.items));
    window.dispatchEvent(new CustomEvent("cart:changed", { detail: this.items }));
  },

  add(item) {
    const fingerprint = [
      item.productId,
      item.selectedDate,
      JSON.stringify(item.selectedOptions || {})
    ].join(":");

    const existing = this.items.find((cartItem) => cartItem.fingerprint === fingerprint);

    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.items.push({ ...item, fingerprint });
    }

    this.save();
  },

  remove(fingerprint) {
    this.items = this.items.filter((item) => item.fingerprint !== fingerprint);
    this.save();
  },

  updateQuantity(fingerprint, quantity) {
    const item = this.items.find((cartItem) => cartItem.fingerprint === fingerprint);
    if (!item) return;
    item.quantity = Math.max(1, Number(quantity));
    this.save();
  },

  clear() {
    this.items = [];
    this.save();
  },

  total() {
    return this.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  },

  count() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
};
