// PayPal Button Integration
paypal.Buttons({
  createOrder: function (data, actions) {
    const total = document.getElementById('totalAmount').innerText.replace('RM', '');
    return actions.order.create({
      purchase_units: [{
        amount: { value: total }
      }]
    });
  },
  onApprove: function (data, actions) {
    return actions.order.capture().then(function (details) {
      alert('Transaction completed by ' + details.payer.name.given_name);
      placeOrder();
    });
  }
}).render('#paypal-button-container');

// Place Order Function
function placeOrder() {
  const firstName = document.getElementById('firstName').value;
  const lastName = document.getElementById('lastName').value;
  const email = document.getElementById('email').value;
  const phone = document.getElementById('phone').value;

  alert(`Order Placed!\n\nCustomer: ${firstName} ${lastName}\nEmail: ${email}\nPhone: ${phone}`);
}
