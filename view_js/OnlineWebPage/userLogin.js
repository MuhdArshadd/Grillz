document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const messageDiv = document.getElementById('loginMessage');

  form.addEventListener('submit', async (event) => {
    event.preventDefault(); // prevent form from submitting normally

    const email = document.getElementById('emailAddress').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      const response = await fetch('../../controller_php/customerController.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action: "login", email, password })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        messageDiv.textContent = 'Login successful! Redirecting...';
        messageDiv.classList.add('text-success');
        // Optionally redirect after login
        setTimeout(() => window.location.href = 'dashboard.html', 1500);
      } else {
        messageDiv.textContent = data.message || 'Login failed.';
        messageDiv.classList.add('text-danger');
      }
    } catch (error) {
      console.error('Error details:', error);
      messageDiv.textContent = 'An error occurred while logging in.';
      messageDiv.classList.add('text-danger');
    }
  });
});
