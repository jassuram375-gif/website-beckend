let globalMapInstance;
let globalMapMarker;
let activeAuthMode = 'login';
let currentSessionUser = null;

// Track calculated trip parameters globally for database storage sync
let activeTripDataCache = null;

const resources = {
    en: {
        translation: {
            app_title: "Global Next-Gen Travel Suite Pro", form_title: "Configure Parameters"
        }
    }
};

i18next.init({ lng: 'en', resources }, function(err, t) { applyTranslations(); });

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        element.innerText = i18next.t(element.getAttribute('data-i18n'));
    });
}

// ACCOUNT DASHBOARD MENU HANDLERS
const accountMenuBtn = document.getElementById('accountMenuBtn');
const authBoxPanel = document.getElementById('authBoxPanel');
const tabLogin = document.getElementById('tabLogin');
const tabRegister = document.getElementById('tabRegister');
const tabRecover = document.getElementById('tabRecover');
const authActionBtn = document.getElementById('authActionBtn');
const authStatusAlert = document.getElementById('authStatusAlert');
const forgotPasswordLink = document.getElementById('forgotPasswordLink');

const lblUsername = document.getElementById('lblUsername');
const lblPassword = document.getElementById('lblPassword');
const authUsernameInput = document.getElementById('authUsername');
const authPasswordInput = document.getElementById('authPassword');
const containerPassword = document.getElementById('containerPassword');
const saveTripBtn = document.getElementById('saveTripBtn');

accountMenuBtn.addEventListener('click', () => {
    authBoxPanel.style.display = authBoxPanel.style.display === 'block' ? 'none' : 'block';
});

function switchToLoginMode() {
    activeAuthMode = 'login';
    tabLogin.className = 'auth-tab active';
    tabRegister.className = 'auth-tab';
    tabRecover.style.display = 'none';
    containerPassword.style.display = 'inline-block';
    forgotPasswordLink.style.display = 'block';
    lblUsername.innerText = "Account Username / Email:";
    lblPassword.innerText = "Account Secure Password:";
    authActionBtn.innerText = "Execute Login";
}

tabLogin.addEventListener('click', switchToLoginMode);
tabRegister.addEventListener('click', () => {
    activeAuthMode = 'register';
    tabRegister.className = 'auth-tab active';
    tabLogin.className = 'auth-tab';
    tabRecover.style.display = 'none';
    containerPassword.style.display = 'inline-block';
    forgotPasswordLink.style.display = 'none';
    lblUsername.innerText = "Account Username / Email:";
    lblPassword.innerText = "Account Secure Password:";
    authActionBtn.innerText = "Register Profile";
});

authActionBtn.addEventListener('click', async () => {
    const username = authUsernameInput.value.trim();
    const secretValue = authPasswordInput.value.trim();

    if (!username) {
        alert("Input values required!");
        return;
    }

    authStatusAlert.style.display = 'block';
    authStatusAlert.style.color = '#2563eb';
    authStatusAlert.innerText = "Securing data route link...";

    try {
        const endpoint = activeAuthMode === 'login' ? '/api/auth/login' : '/api/auth/register';
        const response = await fetch(`https://website-beckend.onrender.com${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password: secretValue })
        });
        const data = await response.json();

        if (response.ok) {
            authStatusAlert.style.color = '#10b981';
            authStatusAlert.innerText = data.message;
            currentSessionUser = username;
            accountMenuBtn.innerText = `👤 ${username}`;
            
            // Sync database profile UI cards immediately upon login
            refreshDatabaseLedgerView();
            
            if (activeTripDataCache) {
                saveTripBtn.style.display = 'block';
            }
            
            setTimeout(() => { authBoxPanel.style.display = 'none'; }, 1500);
        } else {
            authStatusAlert.style.color = '#ef4444';
            authStatusAlert.innerText = `Fault: ${data.error}`;
        }
    } catch (err) {
        authStatusAlert.innerText = "Link transaction failure.";
    }
});

// CORE COMPUTATION MATRIX PIPELINE
document.getElementById('calculateBtn').addEventListener('click', async () => {
    const destination = document.getElementById('destination').value.trim();
    const days = document.getElementById('days').value.trim();
    const targetCurrency = document.getElementById('currency').value;
    
    const customPackages = {
        flight: document.getElementById('addFlight').checked,
        hotel: document.getElementById('addHotel').checked,
        guide: document.getElementById('addGuide').checked,
        insurance: document.getElementById('addInsurance').checked
    };

    const costResult = document.getElementById('costResult');
    const systemNotice = document.getElementById('systemNotice');
    const radarStatus = document.getElementById('radarStatus');
    const mapContainer = document.getElementById('mapBoxContainer');
    const weatherContainer = document.getElementById('weatherTelemetryContainer');

    if (!destination || !days) {
        alert("Parameters required!");
        return;
    }

    costResult.style.display = 'block';
    costResult.innerHTML = "<em>Geocoding targets & pinging live telemetry channels...</em>";

    try {
        const geoResponse = await fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(destination) + '&limit=1');
        const geoData = await geoResponse.json();

        if (geoData.length === 0) {
            costResult.innerHTML = "<span style='color:red;'>Coordinates mismatch.</span>";
            return;
        }

        const lat = parseFloat(geoData[0].lat);
        const lon = parseFloat(geoData[0].lon);
        const resolvedName = geoData[0].display_name;
        const cleanCityName = destination.charAt(0).toUpperCase() + destination.slice(1);

        // Fetch price formulas from backend server
        const response = await fetch('https://website-beckend.onrender.com/api/calculate-trip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destination: resolvedName, lat, lon, days: parseInt(days), targetCurrency, customPackages })
        });
        const data = await response.json();

        const googleMapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + lat + ',' + lon;

        // Render cost results metrics
        costResult.innerHTML = '<strong>Customized Total:</strong> <span style="color:#10b981; font-size:18px; font-weight:700;">' + data.symbol + data.totalCost + '</span>';
        radarStatus.innerText = "Radar Active • Telemetry Linked";
        
        systemNotice.innerHTML = `
            <strong>Location:</strong> ${resolvedName}<br><br>
            ${data.locationNotice}<br><br>
            <a href="${googleMapsUrl}" target="_blank" style="display: inline-flex; align-items: center; background: #fff; color: #1f2937; border: 1px solid #d1d5db; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; box-shadow: 0 1px 2px rgba(0,0,0,0.05); margin-top: 5px;">
                📍 Open in Google Maps
            </a>
        `;

        // Cache parameters globally for our impending DB cloud saving pipeline
        activeTripDataCache = {
            destination: cleanCityName,
            fullAddress: resolvedName,
            days: parseInt(days),
            costString: data.symbol + data.totalCost
        };

        if (currentSessionUser) {
            saveTripBtn.style.display = 'block';
        }

        // PURE LIVE WEATHER DECOUPLING NETWORK OVERRIDE ENGINE
        let liveTemp = 24; 
        let liveCondition = "Clear Conditions";
        let liveAdvice = "Comfortable light attire recommended.";
        
        try {
            const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
            const weatherData = await weatherResponse.json();
            if (weatherData && weatherData.current_weather) {
                liveTemp = Math.round(weatherData.current_weather.temperature);
                const wCode = weatherData.current_weather.weathercode;
                
                if (wCode === 0) { liveCondition = "Clear Sky"; liveAdvice = "Light breathable cotton layers recommended."; }
                else if (wCode >= 1 && wCode <= 3) { liveCondition = "Partly Cloudy"; liveAdvice = "Comfortable everyday outfits."; }
                else if (wCode >= 51 && wCode <= 67) { liveCondition = "Rainy / Wet Weather"; liveAdvice = "Waterproof outerwear and umbrellas required."; }
                else if (wCode >= 71 && wCode <= 77) { liveCondition = "Snowfall Matrix"; liveAdvice = "Heavy winter jackets and insulating thermals are mandatory."; }
                else { liveCondition = "Overcast Skies"; liveAdvice = "Windcheaters or light sweaters recommended."; }

                if (liveTemp <= 15) {
                    liveCondition = "Chilly Alpine Climate";
                    liveAdvice = "Bring heavy jackets, warm woolens, and thermal innerwear.";
                }
            }
        } catch (e) {
            if (data.weather) {
                liveTemp = data.weather.temp;
                liveCondition = data.weather.condition;
            }
        }

        // Update main dashboard weather card readout container
        weatherContainer.style.display = 'block';
        weatherContainer.style.background = '#f8fafc';
        weatherContainer.style.borderLeft = '4px solid #3b82f6';
        weatherContainer.style.padding = '14px';
        weatherContainer.style.borderRadius = '0 8px 8px 0';
        weatherContainer.style.marginTop = '15px';
        weatherContainer.style.borderTop = '1px solid #e2e8f0';
        weatherContainer.style.borderRight = '1px solid #e2e8f0';
        weatherContainer.style.borderBottom = '1px solid #e2e8f0';
        
        weatherContainer.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="color: #1e293b; font-size: 14px;">🌤️ Live Climate: ${cleanCityName}</strong>
                <span style="background: #dbeafe; color: #1e40af; font-weight: bold; padding: 4px 10px; border-radius: 20px; font-size: 14px;">
                    ${liveTemp}°C
                </span>
            </div>
            <div style="color: #475569; font-size: 13px; line-height: 1.5;">
                <span style="display: block; margin-bottom: 4px;"><strong>Conditions:</strong> ${liveCondition}</span>
                <span style="color: #2563eb; font-weight: 500;">📌 <strong>Packing Advice:</strong> ${liveAdvice}</span>
            </div>
        `;

        // INJECT MODULE: Generate Smart Interactive Checklist Layouts dynamically inside Tab 2
        generateSmartPackingChecklist(cleanCityName, liveTemp, liveCondition);

        // MAP CONTROLLERS
        mapContainer.style.display = 'block';
        if (!globalMapInstance) {
            globalMapInstance = L.map('mapBoxContainer').setView([lat, lon], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(globalMapInstance);
            globalMapMarker = L.marker([lat, lon]).addTo(globalMapInstance);
        } else {
            globalMapInstance.flyTo([lat, lon], 12, { animate: true, duration: 1.6 });
            globalMapMarker.setLatLng([lat, lon]);
        }
        
        setTimeout(() => { if (globalMapInstance) globalMapInstance.invalidateSize(); }, 450);

    } catch (err) {
        costResult.innerHTML = "<span style='color:red;'>Link transaction offline.</span>";
    }
});

// FEATURE 1: SMART PACKING ENGINE DATA CHECKLIST POPULATOR (TAB 2)
function generateSmartPackingChecklist(city, temperature, condition) {
    const targetBox = document.getElementById('packingListTargetContainer');
    
    // Core essential items list
    let listItems = [
        "Government ID Card & Travel Tickets Documents",
        "Mobile Charger & Power Bank unit",
        "Basic Personal Hygiene kit & Toothbrush"
    ];

    // Dynamic weather addition variables
    if (temperature <= 15) {
        listItems.push("❄️ Heavy Woolen Jacket or Parka");
        listItems.push("❄️ Thermal Innerwear Layers");
        listItems.push("❄️ Warm Gloves & Woolen Socks");
    } else if (condition.includes("Rain") || condition.includes("Wet")) {
        listItems.push("☔ Compact Traveling Umbrella");
        listItems.push("☔ Waterproof Raincoat / Windcheater");
        listItems.push("☔ Quick-dry Towel & Waterproof phone pouch");
    } else {
        listItems.push("☀️ Light Breathable Cotton Clothes");
        listItems.push("☀️ Protective Sunglasses & Sunscreen Lotion");
        listItems.push("☀️ Comfortable Walking/Running Shoes");
    }

    // Render interactive checked item forms structures
    targetBox.innerHTML = `
        <div style="margin-bottom: 15px; padding: 12px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; font-size: 13px; color: #166534; font-weight: 600;">
            ✅ Live Weather Sync Active: Customized list generated for ${city} (${temperature}°C - ${condition})
        </div>
        <div id="packingChecklistForm"></div>
    `;

    const formBox = document.getElementById('packingChecklistForm');
    listItems.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = "pack-list-item";
        itemDiv.innerHTML = `
            <input type="checkbox" id="pack_item_${index}" onchange="togglePackItemText(this)">
            <label for="pack_item_${index}" style="margin:0; cursor:pointer; font-weight:500; color:#334155;">${item}</label>
        `;
        formBox.appendChild(itemDiv);
    });
}

function togglePackItemText(checkbox) {
    const label = checkbox.nextElementSibling;
    if (checkbox.checked) {
        label.style.textDecoration = "line-through";
        label.style.color = "#94a3b8";
    } else {
        label.style.textDecoration = "none";
        label.style.color = "#334155";
    }
}

// FEATURE 2: SECURE USER DATA TRANSACTION TO MONGODB BACKEND INFRASTRUCTURE
saveTripBtn.addEventListener('click', async () => {
    if (!currentSessionUser || !activeTripDataCache) return;

    saveTripBtn.innerText = "⏳ Storing inside MongoDB cluster...";
    saveTripBtn.disabled = true;

    try {
        const response = await fetch('https://website-beckend.onrender.com/api/trips/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: currentSessionUser,
                destination: activeTripDataCache.destination,
                fullAddress: activeTripDataCache.fullAddress,
                days: activeTripDataCache.days,
                cost: activeTripDataCache.costString
            })
        });

        if (response.ok) {
            alert("🎉 Matrix synced successfully to secure MongoDB ledger cloud!");
            saveTripBtn.innerText = "✅ Saved to Cloud Ledger";
            refreshDatabaseLedgerView();
        } else {
            alert("Staging fault during storage sequence allocation.");
            saveTripBtn.innerText = "💾 Save Matrix to Cloud Profile";
            saveTripBtn.disabled = false;
        }
    } catch (e) {
        alert("Database cluster connection loss.");
        saveTripBtn.innerText = "💾 Save Matrix to Cloud Profile";
        saveTripBtn.disabled = false;
    }
});

// FEATURE 3: DYNAMIC REAL-TIME READOUT GENERATOR FOR ONLINE MONGO PROFILE LEDGERS (TAB 3)
async function refreshDatabaseLedgerView() {
    const container = document.getElementById('cloudDataContainer');
    if (!currentSessionUser) return;

    container.innerHTML = "<em>Pinging MongoDB server clusters...</em>";

    try {
        const response = await fetch(`https://website-beckend.onrender.com/api/trips/user/${currentSessionUser}`);
        const savedTrips = await response.json();

        if (!savedTrips || savedTrips.length === 0) {
            container.innerHTML = `
                <div style="padding:20px; color:#64748b;">
                    🍃 Cloud link active, but no matrices saved yet. Configure variables on the Core Engine tab and hit save!
                </div>`;
            return;
        }

        container.innerHTML = `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:15px; text-align:left;" id="dbGridBox"></div>`;
        const grid = document.getElementById('dbGridBox');

        savedTrips.forEach(trip => {
            const element = document.createElement('div');
            element.style.background = "#fff";
            element.style.border = "1px solid var(--border-color)";
            element.style.padding = "16px";
            element.style.borderRadius = "10px";
            element.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)";
            
            element.innerHTML = `
                <div style="font-weight:700; color:var(--text-main); font-size:15px; margin-bottom:6px;">📍 ${trip.destination}</div>
                <div style="font-size:12px; color:var(--text-muted); line-height:1.4; margin-bottom:10px;">${trip.fullAddress}</div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px dashed #e2e8f0; padding-top:10px; font-size:13px;">
                    <span style="color:#64748b; font-weight:500;">⏱️ Duration: ${trip.days} Days</span>
                    <span style="background:#ecfdf5; color:#059669; font-weight:700; padding:3px 8px; border-radius:6px;">${trip.cost}</span>
                </div>
            `;
            grid.appendChild(element);
        });

    } catch (e) {
        container.innerHTML = "<span style='color:red;'>Could not fetch database records. Ensure your backend server is online!</span>";
    }
}