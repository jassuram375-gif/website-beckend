// --- planner-bridge.js ---

// Local database index map for lightning-fast auto-complete suggestions
const destinationDatabase = [
    "Moradabad, Uttar Pradesh, India",
    "Delhi, NCR, India",
    "Pithoragarh, Uttarakhand, India",
    "Srinagar, Jammu & Kashmir, India",
    "Gulmarg, Jammu & Kashmir, India",
    "Pahalgam, Jammu & Kashmir, India",
    "Lal Kuan, Uttarakhand, India",
    "London, United Kingdom",
    "Paris, France",
    "Dubai, United Arab Emirates"
];

// Global map reference pointer token to prevent map layering conflicts
let globalMapInstance = null;
let globalMarkerInstance = null;

// Wait for the DOM to load before setting up our input listeners
document.addEventListener('DOMContentLoaded', () => {
    const destInput = document.getElementById('destination');
    const suggestionsBox = document.getElementById('autocomplete-suggestions');

    if (destInput && suggestionsBox) {
        // Listen to everything the user types inside the input box
        destInput.addEventListener('input', () => {
            const query = destInput.value.trim().toLowerCase();
            suggestionsBox.innerHTML = ''; // Clear out past results

            if (!query) {
                suggestionsBox.style.display = 'none';
                return;
            }

            // Filter the database for items matching the typed query
            const filtered = destinationDatabase.filter(item => 
                item.toLowerCase().includes(query)
            );

            if (filtered.length > 0) {
                filtered.forEach(city => {
                    const div = document.createElement('div');
                    div.textContent = city;
                    div.style.padding = '12px 14px';
                    div.style.cursor = 'pointer';
                    div.style.fontSize = '13.5px';
                    div.style.borderBottom = '1px solid var(--border-color)';
                    div.style.color = 'var(--text-main)';
                    
                    // Hover background effect
                    div.addEventListener('mouseenter', () => {
                        div.style.background = 'var(--bg-color)';
                    });
                    div.addEventListener('mouseleave', () => {
                        div.style.background = 'transparent';
                    });

                    // When user clicks a suggestion, inject it into the text box
                    div.addEventListener('click', () => {
                        destInput.value = city.split(',')[0]; // Grabs just the city name (e.g., "Moradabad")
                        suggestionsBox.style.display = 'none';
                    });

                    suggestionsBox.appendChild(div);
                });
                suggestionsBox.style.display = 'block';
            } else {
                suggestionsBox.style.display = 'none';
            }
        });

        // Hide suggestions dropdown if user clicks anywhere outside the input box
        document.addEventListener('click', (e) => {
            if (e.target !== destInput && e.target !== suggestionsBox) {
                suggestionsBox.style.display = 'none';
            }
        });
    }
});

// Main click router interface calculation script
document.addEventListener('click', async (e) => {
    if (e.target && e.target.textContent.trim() === 'Process Global Matrix') {
        e.preventDefault();
        console.log("Process Global Matrix button clicked!");

        const destinationField = document.getElementById('destination');
        const daysField = document.getElementById('days');
        
        const destinationValue = destinationField ? destinationField.value.trim() : 'Moradabad';
        const daysValue = daysField ? daysField.value : '5';

        const formData = {
            destination: destinationValue || "Moradabad",
            days: daysValue
        };

        const targetDisplay = document.getElementById('results-display-wrapper');
        const mapContainer = document.getElementById('mapBoxContainer');

        try {
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
                
                const currentTemp = result.weather ? result.weather.temp : 24;
                const currentCondition = result.weather ? result.weather.condition : "Clear Overcast";
                const clothingAdvice = result.weather ? result.weather.advice : "Optimal Balanced Weather: Perfect for crisp linen fabrics and lightweight regular trousers.";

                // Render out our core matrix calculations text card
                targetDisplay.innerHTML = `
                    <div class="ui-result-card-inner">
                        <h3 style="margin: 0 0 15px 0; font-size: 15px; text-align: left; color: var(--text-main); border-bottom: 2px solid var(--accent-blue); padding-bottom: 8px; font-weight: 700;">
                            🌍 ${displayDestination.toUpperCase()} MATRIX COMPLETED
                        </h3>
                        <div class="ui-result-item" style="margin-bottom: 10px; font-size: 13px;">
                            <span>📅 Total Duration:</span>
                            <strong style="color: var(--text-main);">${formData.days} Days</strong>
                        </div>
                        <div class="ui-result-item" style="margin-bottom: 10px; font-size: 13px;">
                            <span>🌤️ Current Climate:</span>
                            <strong style="color: var(--text-main);">${currentTemp}°C — ${currentCondition}</strong>
                        </div>
                        <div class="ui-result-item" style="margin-bottom: 15px; font-size: 13px;">
                            <span>💰 Calculation Matrix Total:</span>
                            <strong style="color: #059669; font-size: 16px;">${result.symbol}${result.totalCost.toLocaleString()}</strong>
                        </div>
                        
                        <div class="clothing-advice-highlight-box" style="padding: 14px; border-radius: 10px; margin-top: 12px; font-size: 13px; line-height: 1.5; text-align: left;">
                            👕 <strong>Smart Style Engine Recommendation:</strong><br>
                            <span id="weather-clothing-advice">${clothingAdvice}</span>
                        </div>
                    </div>
                `;

                if (document.getElementById('liveSyncStatusBanner')) {
                    document.getElementById('liveSyncStatusBanner').style.display = 'block';
                }

                // ==========================================
                // GEOGRAPHICAL RADAR: LEAFLET MAP ENGINE INTERFACING
                // ==========================================
                if (mapContainer) {
                    mapContainer.style.display = 'block'; // Make the map visible!
                    
                    // Fallback map lookups if specific telemetry lat/lon values aren't populated
                    let lat = 28.8386; // Default: Moradabad Coordinates
                    let lon = 78.7733;

                    // Match coordinate parameters based on standard region keywords
                    const lowerDest = displayDestination.toLowerCase();
                    if (lowerDest.includes('pithoragarh')) { lat = 29.5829; lon = 80.2182; }
                    else if (lowerDest.includes('delhi')) { lat = 28.6139; lon = 77.2090; }
                    else if (lowerDest.includes('london')) { lat = 51.5074; lon = -0.1278; }
                    else if (lowerDest.includes('paris')) { lat = 48.8566; lon = 2.3522; }
                    else if (lowerDest.includes('dubai')) { lat = 25.2048; lon = 55.2708; }
                    else if (lowerDest.includes('srinagar')) { lat = 34.0837; lon = 74.7973; }
                    else if (lowerDest.includes('gulmarg')) { lat = 34.0484; lon = 74.3805; }
                    else if (lowerDest.includes('pahalgam')) { lat = 34.0161; lon = 75.3150; }
                    else if (lowerDest.includes('lal kuan')) { lat = 29.0734; lon = 79.5103; }

                    // Initialize Leaflet Map view if it doesn't exist yet
                    if (!globalMapInstance) {
                        globalMapInstance = L.map('mapBoxContainer').setView([lat, lon], 11);
                        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                            attribution: '© OpenStreetMap contributors'
                        }).addTo(globalMapInstance);
                    } else {
                        // Fly smoothly to the new destination if map is already rendered
                        globalMapInstance.flyTo([lat, lon], 11, { animate: true, duration: 1.5 });
                    }

                    // Remove old pins to prevent cluttered UI screens
                    if (globalMarkerInstance) {
                        globalMapInstance.removeLayer(globalMarkerInstance);
                    }

                    // Drop a brand new, highly visible pinpoint marker on the grid coordinate
                    globalMarkerInstance = L.marker([lat, lon]).addTo(globalMapInstance)
                        .bindPopup(`<b>${displayDestination}</b><br>Radar Telemetry Channel Synced.`)
                        .openPopup();

                    // Force Leaflet to resize correctly within responsive wrapper grids
                    setTimeout(() => { globalMapInstance.invalidateSize(); }, 300);
                }

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
