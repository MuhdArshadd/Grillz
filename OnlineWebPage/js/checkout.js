function placeOrder() {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();

  // Basic validation
  if (!firstName || !lastName || !email || !phone) {
    alert("Please fill in all required shipping information.");
    return;
  }

  const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
  if (!paymentMethod) {
    alert("Please select a payment method.");
    return;
  }

  // Simulate order placement (e.g., send to backend or store locally)
  const orderId = 'GRZ' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  document.getElementById('orderIdDisplay').textContent = orderId;

  // Show confirmation modal
  const modal = new bootstrap.Modal(document.getElementById('orderConfirmationModal'));
  modal.show();
}
