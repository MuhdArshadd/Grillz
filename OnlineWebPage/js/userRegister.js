document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    
    registerForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const registerData = {
            fullName: document.getElementById('fullName').value,
            emailAddress: document.getElementById('emailAddress').value,
            password: document.getElementById('password').value,
            deliveryAddress: document.getElementById('deliveryAddress').value,
            phoneNumber: document.getElementById('phoneNumber').value
        };
        
        try {
            const response = await fetch(`${API_URL}?endpoint=register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registerData)
            });
            
            const data = await response.json();
            const messageElement = document.getElementById('registerMessage');
            
            if (data.status === 'success') {
                messageElement.style.color = 'green';
                messageElement.textContent = data.message;
                
                setTimeout(() => {
                    window.location.href = 'LoginPage.html';
                }, 1500);
            } else {
                messageElement.style.color = 'red';
                messageElement.textContent = data.message;
            }
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('registerMessage').textContent = 'An error occurred. Please try again.';
        }
    });
});
