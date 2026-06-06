// --- planner-bridge.js ---
document.addEventListener('click', async (e) => {
    if (e.target && e.target.textContent.trim() === 'Process Global Matrix') {
        e.preventDefault();
        console.log("Process Global Matrix button clicked!");

        // FIXED: Improved selector to ensure it catches the destination text field correctly
        const destinationElement = document.querySelector('input[placeholder*="destination" i]') || 
                                   document.querySelector('input[type="text"]') || 
                                   document.querySelector('input:not([type])');
        
        const destinationInput = destinationElement ? destinationElement.value : '';
        const daysInput = document.getElementById('days') ? document.getElementById('days').value : '5';

        const formData = {
            destination: destinationInput || "Uttarakhand",
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
                // FIXED: Fallback to formData if the server responds with undefined for the destination name
                const finalDestination = result.destination || formData.destination;
                alert(`Trip Plan Successful!\nDestination: ${finalDestination}\nTotal Estimated Cost: ${result.symbol}${result.totalCost}\nWeather: ${result.weather.temp}°C - ${result.weather.condition}`);
            } else {
                alert('Server processed request but returned an error status.');
            }

        } catch (error) {
            console.error('Network Error:', error);
            alert(`Waking up the cloud server...\nIf this is the first click in a while, please wait 30-50 seconds for Render to spin up!`);
        }
    }
});
