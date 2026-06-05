// --- planner-bridge.js ---
document.addEventListener('click', async (e) => {
    if (e.target && e.target.textContent.trim() === 'Process Global Matrix') {
        e.preventDefault();
        console.log("Process Global Matrix button clicked!");

        const inputs = document.querySelectorAll('input[type="text"], input:not([type])');
        const destinationInput = inputs[0] ? inputs[0].value : '';
        const daysInput = document.getElementById('days') ? document.getElementById('days').value : '5';

        const formData = {
            destination: destinationInput || "Uttarakhand",
            days: daysInput
        };

        try {
            // PERFECT CLOUD LINK: Matches your live Render service name with 'beckend'
            const response = await fetch('https://website-beckend-1.onrender.com/api/calculate-trip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                alert(`Trip Plan Successful!\nDestination: ${result.destination}\nTotal Estimated Cost: ${result.symbol}${result.totalCost}\nWeather: ${result.weather.temp}°C - ${result.weather.condition}`);
            } else {
                alert('Server processed request but returned an error status.');
            }

        } catch (error) {
            console.error('Network Error:', error);
            alert(`Waking up the cloud server...\nIf this is the first click in a while, please wait 30-50 seconds for Render to spin up!`);
        }
    }
});
