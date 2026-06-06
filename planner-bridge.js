// --- planner-bridge.js ---
document.addEventListener('click', async (e) => {
    if (e.target && e.target.textContent.trim() === 'Process Global Matrix') {
        e.preventDefault();
        console.log("Process Global Matrix button clicked!");

        // 1. Target form elements explicitly via explicit DOM ID mappings
        const destinationField = document.getElementById('destination');
        const daysField = document.getElementById('days');
        
        const destinationValue = destinationField ? destinationField.value.trim() : 'Moradabad';
        const daysValue = daysField ? daysField.value : '5';

        const formData = {
            destination: destinationValue || "Moradabad",
            days: daysValue
        };

        // Target the display wrapper container inside Geographical Radar card
        const targetDisplay = document.getElementById('results-display-wrapper');

        try {
            // Inject an elegant on-screen active loading indicator state
            if (targetDisplay) {
                targetDisplay.innerHTML = `
                    <div style="text-align: center; padding: 15px;">
                        <strong style="color: var(--accent-blue); display: block; margin-bottom: 5px; animation: pulse 1.5s infinite;">⚡ Processing Global Matrix...</strong>
                        <span style="font-size: 12px; color: var(--text-muted);">Requesting Render Cloud Microservice...</span>
                    </div>
                `;
            }

            const response = await fetch('https://website-beckend-1.onrender.com/api/calculate-trip', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success && targetDisplay) {
                const displayDestination = result.destination || formData.destination;
                
                // Inject the cloud microservice calculation properties cleanly into the UI grid wrapper
                targetDisplay.innerHTML = `
                    <div class="ui-result-card-inner">
                        <h3 style="margin: 0 0 15px 0; font-size: 15px; text-align: left; color: var(--text-main); border-bottom: 2px solid var(--accent-blue); padding-bottom: 8px; font-weight: 700;">
                            🌍 ${displayDestination.toUpperCase()} MATRIX COMPLETED
                        </h3>
                        <div class="ui-result-item">
                            <span>📅 Total Duration:</span>
                            <strong style="color: var(--text-main);">${formData.days} Days</strong>
                        </div>
                        <div class="ui-result-item">
                            <span>🌤️ Current Climate:</span>
                            <strong style="color: var(--text-main);">${result.weather.temp}°C — ${result.weather.condition}</strong>
                        </div>
                        <div class="ui-result-item">
                            <span>💰 Calculation Matrix Total:</span>
                            <strong style="color: #059669; font-size: 16px;">${result.symbol}${result.totalCost.toLocaleString()}</strong>
                        </div>
                    </div>
                `;
            } else {
                if (targetDisplay) {
                    targetDisplay.innerHTML = `<strong style="color: #ef4444;">⚠️ Core cloud cluster returned a processing fault.</strong>`;
                }
            }

        } catch (error) {
            console.error('Network Error:', error);
            if (targetDisplay) {
                targetDisplay.innerHTML = `
                    <div style="text-align: left; background: #fff9db; border-left: 4px solid #f59f00; padding: 12px; border-radius: 6px;">
                        <strong style="color: #f08c00; display: block; margin-bottom: 4px; font-size: 13px;">☁️ Synchronizing Cloud Clusters...</strong>
                        <span style="font-size: 12px; color: #665c00; line-height: 1.4; display: block;">
                            Render microservices are waking up from a deep energy sleep cycle. Please wait 30-40 seconds for full ledger initialization and re-click!
                        </span>
                    </div>
                `;
            }
        }
    }
});
