// --- planner-bridge.js ---
document.addEventListener('click', async (e) => {
    if (e.target && e.target.textContent.trim() === 'Process Global Matrix') {
        e.preventDefault();
        console.log("Process Global Matrix button clicked!");

        // 1. Find the label element that says "Enter Global Destination:"
        const labels = Array.from(document.querySelectorAll('label, div, p, span'));
        const destinationLabel = labels.find(el => el.textContent.trim().includes('Enter Global Destination:'));
        
        let destinationInput = '';

        // 2. Grab the input field right next to or inside that label
        if (destinationLabel) {
            const nextInput = destinationLabel.nextElementSibling?.querySelector('input') || 
                              destinationLabel.nextElementSibling || 
                              destinationLabel.querySelector('input');
            if (nextInput && nextInput.tagName === 'INPUT') {
                destinationInput = nextInput.value;
            }
        }

        // 3. Absolute fallback: if the label trick missed, check every text input on the page
        if (!destinationInput) {
            const allInputs = document.querySelectorAll('input[type="text"], input:not([type])');
            for (let input of allInputs) {
                if (input.value.trim() !== '') {
                    destinationInput = input.value;
                    break;
                }
            }
        }

        const daysInput = document.getElementById('days') ? document.getElementById('days').value : '5';

        // Final cleanup of the text
        const finalDestinationText = destinationInput.trim() || "Paris";

        const formData = {
            destination: finalDestinationText,
            days: daysInput
        };

        try {
            const response = await fetch('https://website-beckend-1.onrender.com/api/calculate-trip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                // Display exactly what the server processed or what the user typed
                const displayDestination = result.destination || formData.destination;
                alert(`Trip Plan Successful!\nDestination: ${displayDestination}\nTotal Estimated Cost: ${result.symbol}${result.totalCost}\nWeather: ${result.weather.temp}°C - ${result.weather.condition}`);
            } else {
                alert('Server processed request but returned an error status.');
            }

        } catch (error) {
            console.error('Network Error:', error);
            alert(`Waking up the cloud server...\nIf this is the first click in a while, please wait 30-50 seconds for Render to spin up!`);
        }
    }
});
