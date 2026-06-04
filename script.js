// 1. Grab the form element using the ID "travelForm" from your new HTML
const travelForm = document.getElementById('travelForm');

// 2. Listen for the user to click the "Calculate Trip Cost" button
travelForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevents the page from refreshing automatically

    // 3. Gather the inputs from your new form fields
    const destinationInput = document.getElementById('destination').value;
    const daysInput = document.getElementById('days').value;

    // Create the data package to send to your backend
    const formData = {
        destination: destinationInput,
        days: daysInput
    };

    try {
        // 4. Send a POST request to your LIVE Render backend server (Updated path below)
        const response = await fetch('https://website-beckend.onrender.com/api/calculate-trip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData) // Turn the data into text format
        });

        // 5. Get the response back from the server
        const result = await response.json();

        // 6. Pop up an alert with the processed details
        if (result.success) {
            alert(`Trip Plan Successful!\nDestination: ${destinationInput}\nTotal Estimated Cost: ${result.symbol}${result.totalCost}\nWeather: ${result.weather.temp}°C - ${result.weather.condition}`);
        } else {
            alert('Server processed request but returned an error status.');
        }

    } catch (error) {
        console.error('Error connecting to backend:', error);
        alert('Could not connect to the cloud server. Please check your internet connection or check the Render dashboard logs.');
    }
});