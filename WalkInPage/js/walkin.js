document.addEventListener('DOMContentLoaded', function() {
    // Get table ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tableId = urlParams.get('table');
    
    if (!tableId) {
        alert('Invalid table QR code');
        window.location.href = 'HomePage.html';
        return;
    }

    // Display table number
    document.getElementById('tableNumber').textContent = tableId;

    // Handle form submission
    document.getElementById('visitorForm').addEventListener('submit', handleVisitorRegistration);
});

async function handleVisitorRegistration(event) {
    event.preventDefault();

    const tableId = new URLSearchParams(window.location.search).get('table');
    const visitorName = document.getElementById('visitorName').value;
    const visitorPhone = document.getElementById('visitorPhone').value;

    try {
        const response = await fetch('http://localhost/Grillz-1/OnlineWebPage/php/customerController.php?endpoint=registerVisitor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tableId: tableId,
                visitorName: visitorName,
                visitorPhone: visitorPhone
            })
        });

        const result = await response.json();
        
        if (result.success) {
            // Store visitor info in session
            sessionStorage.setItem('visitorData', JSON.stringify({
                visitorId: result.visitorId,
                tableId: tableId,
                name: visitorName,
                phone: visitorPhone,
                isWalkIn: true
            }));
            
            // Redirect to menu page
            window.location.href = `MenuPage.html?mode=walkIn&table=${tableId}`;
        } else {
            alert(result.message || 'Failed to register visitor');
        }
    } catch (error) {
        console.error('Error registering visitor:', error);
        alert('An error occurred while registering. Please try again.');
    }
}
