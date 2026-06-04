let globalMapInstance;
let globalMapMarker;
let activeAuthMode = 'login';

// i18n Language configurations
const resources = {
    en: {
        translation: {
            app_title: "Global Next-Gen Travel Suite Pro", form_title: "Configure Parameters",
            label_dest: "Enter Global Destination:", label_days: "Number of Days:",
            label_customize: "Customize Your Package Add-ons:", label_currency: "Target Display Currency:",
            btn_calculate: "Process Global Matrix", radar_title: "Geographical Radar",
            radar_await: "Awaiting System Input Coordinates...", radar_desc: "Select your target language, enter any worldwide destination, choose your package criteria, and run the engine calculation matrix.",
            pack_flights: "Roundtrip Flights Included", pack_hotel: "5-Star Luxury Stay Upgrade",
            pack_guide: "Private Local Culinary Guide", pack_insurance: "Worldwide Medical Insurance"
        }
    }
};

i18next.init({ lng: 'en', resources }, function(err, t) { applyTranslations(); });

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        element.innerText = i18next.t(element.getAttribute('data-i18n'));
    });
}

// ACCOUNT MENU HANDLERS
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

forgotPasswordLink.addEventListener('click', () => {
    activeAuthMode = 'forgot';
    tabRecover.style.display = 'inline-block';
    tabRecover.className = 'auth-tab active';
    tabLogin.className = 'auth-tab';
    tabRegister.className = 'auth-tab';
    containerPassword.style.display = 'none';
    lblUsername.innerText = "Enter Registered Email:";
    authActionBtn.innerText = "Send Recovery Code";
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
        if (activeAuthMode === 'reset') {
            const cachedUser = authActionBtn.getAttribute('data-user-cache');
            const response = await fetch('https://website-beckend.onrender.com/api/auth/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: cachedUser, token: username, newPassword: secretValue })
            });
            const data = await response.json();
            if (response.ok) {
                authStatusAlert.style.color = '#10b981';
                authStatusAlert.innerText = "Password modified successfully!";
                setTimeout(() => { switchToLoginMode(); authStatusAlert.style.display='none'; }, 2000);
            } else {
                authStatusAlert.style.color = '#ef4444';
                authStatusAlert.innerText = `Fault: ${data.error}`;
            }
            return;
        }

        const endpoint = activeAuthMode === 'login' ? '/api/auth/login' : (activeAuthMode === 'register' ? '/api/auth/register' : '/api/auth/forgot');
        const response = await fetch(`https://website-beckend.onrender.com${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password: secretValue })
        });
        const data = await response.json();

        if (response.ok) {
            authStatusAlert.style.color = '#10b981';
            authStatusAlert.innerText = data.message;
            if (activeAuthMode === 'login' || activeAuthMode === 'register') {
                accountMenuBtn.innerText = `User: ${username}`;
                setTimeout(() => { authBoxPanel.style.display = 'none'; }, 2000);
            } else if (activeAuthMode === 'forgot') {
                authActionBtn.setAttribute('data-user-cache', username);
                activeAuthMode = 'reset';
                containerPassword.style.display = 'inline-block';
                forgotPasswordLink.style.display = 'none';
                lblUsername.innerText = "Enter Token Code:";
                lblPassword.innerText = "Enter New Password:";
                authUsernameInput.value = ""; authPasswordInput.value = "";
                authActionBtn.innerText = "Submit Overrides";
            }
        } else {
            authStatusAlert.style.color = '#ef4444';
            authStatusAlert.innerText = `Fault: ${data.error}`;
        }
    } catch (err) {
        authStatusAlert.innerText = "Link transaction failure.";
    }
});

// CORE MASTER PIPELINE INTERCEPTOR WITH WEATHER OUTLOOK CHANNELS
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
        const geoResponse = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(destination)}&limit=1`);
        const geoData = await geoResponse.json();

        if (geoData.length === 0) {
            costResult.innerHTML = "<span style='color:red;'>Coordinates mismatch.</span>";
            return;
        }

        const lat = parseFloat(geoData[0].lat);
        const lon = parseFloat(geoData[0].lon);
        const resolvedName = geoData[0].display_name;
        
        const cleanCityName = destination.charAt(0).toUpperCase() + destination.slice(1);

        const response = await fetch('https://website-beckend.onrender.com/api/calculate-trip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ destination: resolvedName, lat, lon, days: parseInt(days), targetCurrency, customPackages })
        });
        const data = await response.json();

        // FIXED: Replaced corrupted syntax with true template literals for real-time accuracy
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;

        // Display cost parameters
        costResult.innerHTML = `<strong>Customized Total:</strong> <span style="color:#10b981; font-size:18px; font-weight:700;">${data.symbol}${data.totalCost}</span>`;
        radarStatus.innerText = "Radar Active • Telemetry Linked";
        
        systemNotice.innerHTML = `
            <strong>Location:</strong> ${resolvedName}<br><br>
            ${data.locationNotice}<br><br>
            <a href="${googleMapsUrl}" target="_blank" style="display: inline-flex; align-items: center; background: #fff; color: #1f2937; border: 1px solid #d1d5db; padding: 8px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; box-shadow: 0 1px 2px rgba(0,0,0,0.05); margin-top: 5px;">
                <span style="color: #ea4335; margin-right: 6px; font-size: 14px;">📍</span> Open in Google Maps
            </a>
        `;

        // REAL-TIME WEATHER TELEMETRY CARD DESIGN
        if (data.weather) {
            weatherContainer.style.display = 'block';
            weatherContainer.style.background = '#f8fafc';
            weatherContainer.style.borderLeft = '4px solid #3b82f6';
            weatherContainer.style.padding = '14px';
            weatherContainer.style.borderRadius = '0 8px 8px 0';
            weatherContainer.style.marginTop = '15px';
            
            weatherContainer.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong style="color: #1e293b; font-size: 14px;">🌤️ Live Climate: ${cleanCityName}</strong>
                    <span style="background: #dbeafe; color: #1e40af; font-weight: bold; padding: 4px 10px; border-radius: 20px; font-size: 14px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                        ${data.weather.temp}°C
                    </span>
                </div>
                <div style="color: #475569; font-size: 13px; line-height: 1.5;">
                    <span style="display: block; margin-bottom: 4px;"><strong>Conditions:</strong> ${data.weather.condition}</span>
                    <span style="color: #2563eb; font-weight: 500;">📌 <strong>Packing Advice:</strong> ${data.weather.advice}</span>
                </div>
            `;
        }

        // REAL-TIME SMOOTH GEOGRAPHICAL MAP SWEEP (flyTo Animation)
        mapContainer.style.display = 'block';
        if (!globalMapInstance) {
            globalMapInstance = L.map('mapBoxContainer').setView([lat, lon], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(globalMapInstance);
            globalMapMarker = L.marker([lat, lon]).addTo(globalMapInstance);
        } else {
            globalMapInstance.flyTo([lat, lon], 12, {
                animate: true,
                duration: 1.6
            });
            globalMapMarker.setLatLng([lat, lon]);
        }
        
        setTimeout(() => {
            if (globalMapInstance) globalMapInstance.invalidateSize();
        }, 450);

    } catch (err) {
        costResult.innerHTML = "<span style='color:red;'>Link offline. Check backend logs!</span>";
    }
});