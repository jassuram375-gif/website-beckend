// --- script.js ---

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
        // 4. Send a POST request to your local Express backend server
        const response = await fetch('http://localhost:3000/api/plan-trip', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData) // Turn the data into text format
        });

        // 5. Get the response back from the server
        const result = await response.json();

        // 6. Pop up an alert with the processed details
        alert(`Trip Plan Successful!\nDestination: ${result.destination}\nTotal Estimated Cost: ₹${result.totalCost}`);

    } catch (error) {
        console.error('Error connecting to backend:', error);
        alert('Could not connect to the server. Make sure your terminal is running "node index.js"!');
    }
});