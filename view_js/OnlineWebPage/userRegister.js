document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('registerForm');
  const messageDiv = document.getElementById('registerMessage');

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const data = {
      action: 'register',
      fullname: form.fullName.value.trim(),
      email: form.emailAddress.value.trim(),
      password: form.password.value,
      deliveryAddress: form.deliveryAddress.value.trim(),
      phoneNumber: form.phoneNumber.value.trim()
    };

    try {
      const response = await fetch('../../controller_php/customerController.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      messageDiv.textContent = result.message;
      messageDiv.className = result.success ? 'text-success' : 'text-danger';

      if (result.success) {
        form.reset();
      }
    } catch (error) {
      console.error('Error:', error);
      messageDiv.textContent = 'An error occurred. Please try again.';
      messageDiv.className = 'text-danger';
    }
  });
});
