// Sample static order data with image paths and dates added
const order = {
  id: "ORD123456",
  date: "June 13, 2025",
  status: "Preparing",
  estimatedDelivery: "June 15, 2025",
  deliveryAddress: "123 Food Street, Kuala Lumpur, 50450",
  items: [
    {
      name: "Grilled Chicken Burger",
      quantity: 2,
      price: 15.5,
      image: "../../assets/images/cheese_lover_burger.png",
    },
    {
      name: "Sweet Potato Fries",
      quantity: 1,
      price: 7,
      image: "../../assets/images/chicken_deluxe_burger.png",
    },
    {
      name: "Lemon Iced Tea",
      quantity: 2,
      price: 4.5,
      image: "../../assets/images/grilled_beef_burger.png",
    },
  ],
  tracking: [
    { status: "Order Received", date: "June 13, 2025 - 12:30 PM", completed: true },
    { status: "Preparing", date: "June 13, 2025 - 1:15 PM", completed: true },
    { status: "Out for Delivery", date: "June 13, 2025 - 1:30 PM", completed: true },
    { status: "Delivered", date: "June 13, 2025 - 1:40 PM", completed: true }
  ]
};

// Populate Order Summary with images
function renderOrderSummary() {
  const container = document.getElementById("summary-container");

  const total = order.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  container.innerHTML = `
    <div class="summary-item">
      <div class="label">Order Date</div>
      <div class="value">${order.date}</div>
    </div>
    <div class="summary-item">
      <div class="label">Estimated Delivery</div>
      <div class="value">${order.estimatedDelivery}</div>
    </div>
    <div class="summary-item">
      <div class="label">Delivery Address</div>
      <div class="value text-truncate">${order.deliveryAddress}</div>
    </div>
    <hr />
    <h5 class="mt-3 mb-3 text-brown-dark">Order Items</h5>
    <div class="order-items-list">
      ${order.items
        .map(
          (item) => `
        <div class="order-item d-flex">
          <img src="${item.image}" alt="${item.name}" class="order-item-img me-3" width="80" height="80" />
          <div class="order-item-details flex-grow-1">
            <div class="d-flex justify-content-between">
              <div class="order-item-name">${item.name}</div>
              <div class="order-item-price">RM ${(item.price * item.quantity).toFixed(2)}</div>
            </div>
            <div class="text-muted small">Quantity: ${item.quantity}</div>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
    <hr />
    <div class="summary-item total-price">
      <div class="label">Total Amount</div>
      <div class="value">RM ${total.toFixed(2)}</div>
    </div>
  `;
}

function renderOrderTracking() {
  const container = document.getElementById("tracking-container");

  container.innerHTML = `
    ${order.tracking
      .map(
        (step, index) => `
      <div class="tracking-step ${step.completed ? "completed" : index === 2 ? "active" : ""}">
        <div class="step-icon">${step.completed ? "<i class='fas fa-check'></i>" : index + 1}</div>
        <div class="step-content">
          <div class="step-label">${step.status}</div>
          <div class="step-date">${step.date}</div>
        </div>
      </div>
    `
      )
      .join("")}
  `;
}

function init() {
  renderOrderSummary();
  renderOrderTracking();
  
  // Update page title with order number
  document.title = `Order #${order.id} - Grillz`;
}

window.addEventListener("DOMContentLoaded", init);