// Check if user is logged in
function isUserLoggedIn() {
    return sessionStorage.getItem('userLoggedIn') === 'true';
  }
  
  // Get user data
  function getUserData() {
    const userData = sessionStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  }
  
  // Handle authentication redirects
  function handleAuthRedirect(targetPage) {
    if (!isUserLoggedIn()) {
        localStorage.setItem('redirectAfterLogin', targetPage);
        window.location.href = 'LoginPage.html';
        return false;
    }
    return true;
  }
  
  // Handle login form submission
  document.addEventListener('DOMContentLoaded', function() {
      const loginForm = document.getElementById('loginForm');
      if (loginForm) {
          loginForm.addEventListener('submit', function(e) {
              e.preventDefault();
              handleLogin(e);
          });
      }
  });
  
  // Function to update all navigation bars
  function updateAllNavigationBars() {
      // Find all navigation bars and update them
      const navbars = document.querySelectorAll('#navbar-placeholder');
      navbars.forEach(navbar => {
          if (navbar.updateNavigation) {
              navbar.updateNavigation();
          }
      });
  }
  
  // Login function
  async function loginUser(email, password) {
      try {
          const response = await fetch('http://localhost/Grillz/OnlineWebPage/php/customerController.php?endpoint=login', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 
                  email: email,
                  password: password 
              })
          });
  
          const data = await response.json();
          
          if (data.status === 'success') {
              // Store user session data
              sessionStorage.setItem('userLoggedIn', 'true');
              sessionStorage.setItem('userData', JSON.stringify(data.user));
              
              // Update navigation using the global navigationManager
              if (window.navigationManager) {
                  window.navigationManager.updateNavigation();
              }
              
              return { success: true, message: data.message };
          } else {
              return { success: false, message: data.message };
          }
      } catch (error) {
          console.error('Login error:', error);
          return { success: false, message: 'An error occurred during login' };
      }
  }
  
  // Handle login form submission
  async function handleLogin(event) {
      event.preventDefault();
      
      const loginData = {
          emailAddress: document.getElementById('emailAddress').value,
          password: document.getElementById('password').value
      };
      
      try {
          const loginResult = await loginUser(loginData.emailAddress, loginData.password);
          const messageElement = document.getElementById('loginMessage');
          
          if (loginResult.success) {
              messageElement.style.color = 'green';
              messageElement.textContent = loginResult.message;
              
              // Handle redirect
              const redirectUrl = localStorage.getItem('redirectAfterLogin') || 'MenuPage.html';
              localStorage.removeItem('redirectAfterLogin');
              
              setTimeout(() => {
                  window.location.href = redirectUrl;
              }, 1500);
          } else {
              messageElement.style.color = 'red';
              messageElement.textContent = loginResult.message;
          }
      } catch (error) {
          console.error('Error:', error);
          document.getElementById('loginMessage').textContent = 'An error occurred. Please try again.';
      }
  }
  
  // Logout function
  function logoutUser() {
      sessionStorage.removeItem('userLoggedIn');
      sessionStorage.removeItem('userData');
      
      // Update navigation using the global navigationManager
      if (window.navigationManager) {
          window.navigationManager.updateNavigation();
      }
      
      window.location.href = 'LoginPage.html';
  }
  
  // Example of how to use stored user data in other pages
  function displayUserInfo() {
      const userData = getUserData();
      if (userData) {
          // Example usage:
          console.log('Logged in user:', userData.full_name);
          console.log('Email:', userData.email);
          // etc...
      }
  }
  
  // Add a function to check and update navigation on page load
  function initializeNavigation() {
      if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', updateAllNavigationBars);
      } else {
          updateAllNavigationBars();
      }
  }
  
  // Initialize navigation when script loads
  initializeNavigation();
  
  // Listen for storage changes in other tabs
  window.addEventListener('storage', function(e) {
      if (e.key === 'userLoggedIn' || e.key === 'userData') {
          updateAllNavigationBars();
      }
  });