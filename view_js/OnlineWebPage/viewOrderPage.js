function updateQuantity(itemId, change) {
  const input = document.getElementById(`quantity${itemId}`);
  const newVal = Math.max(1, parseInt(input.value) + change);
  input.value = newVal;
  updateTotal();
}

function removeItem(itemId) {
  const item = document.getElementById(`item${itemId}`);
  if (item) item.remove();
  updateTotal();
}

function updateTotal() {
  let total = 0;
  const items = document.querySelectorAll('[data-price]');

  items.forEach(item => {
    const price = parseFloat(item.dataset.price);
    const input = item.closest('.item-info').querySelector('input');
    const qty = parseInt(input.value);
    total += price * qty;
  });

  document.getElementById('cartSubtotal').textContent = `RM${total.toFixed(2)}`;
  document.getElementById('totalAmount').textContent = `RM${total.toFixed(2)}`;
}

function cancelOrder() {
  document.getElementById('orderItems').innerHTML = '<p class="text-center text-muted">Your order has been canceled.</p>';
  updateTotal();
}

// Initial calculation
updateTotal();
