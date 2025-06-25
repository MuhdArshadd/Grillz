const orders = [
  { id: "GRZ123456", status: "Preparing" },
  { id: "GRZ123457", status: "Delivered" },
  { id: "GRZ123458", status: "Cancelled" }
];

function renderOrderList() {
  const container = document.getElementById("order-list-container");

  container.innerHTML = orders.map(order => `
    <div class="order-card" onclick="goToHistory('${order.id}')">
      <div class="order-details">
        <div class="order-id">Order ID: ${order.id}</div>
        <div class="order-status">Status: ${order.status}</div>
      </div>
      <div class="arrow-icon">
        <i class="fas fa-chevron-right"></i>
      </div>
    </div>
  `).join('');
}

function goToHistory(orderId) {
  // Pass order ID if needed via query string or local storage
  window.location.href = `UserOrderHistoryPage.html?orderId=${orderId}`;
}

document.addEventListener("DOMContentLoaded", renderOrderList);
