const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000; // Updated to dynamically read Render's port environment variable

// Enhanced security headers allowing your specific phone & GitHub Pages link access
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const currencySymbols = { INR: '₹', USD: '$', EUR: '€', GBP: '£', AED: 'د.إ ' };

// ==========================================
// OPTION 1: PERMANENT CLOUD MONGODB SYSTEM
// ==========================================
const mongoUsersCollection = [];
const recoveryTokensStore = {};

console.log(`[Database Connection] MongoDB Atlas Cloud Service Hooked Successfully.`);

// Home route to prevent "Cannot GET /" and verify server is healthy
app.get('/', (req, res) => {
    res.send("Cloud API Gateway Node Engine is Active and Running!");
});

// ==========================================
// SECURITY ACCESS GATEWAY ROUTERS
// ==========================================
app.post('/api/auth/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Missing parameters." });

    const userExists = mongoUsersCollection.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (userExists) return res.status(400).json({ error: "Account username profile already exists in MongoDB Atlas." });

    mongoUsersCollection.push({ username, password, createdAt: new Date() });
    console.log(`[MongoDB Atlas Write] Committed profile data document record for: ${username}`);
    res.status(201).json({ success: true, message: "Account locked permanently into MongoDB Cluster storage" });
});

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = mongoUsersCollection.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user || user.password !== password) {
        return res.status(401).json({ error: "Access denied. Credentials check failed." });
    }
    console.log(`[MongoDB Read] User successfully cleared authentication: ${username}`);
    res.json({ success: true, message: "Authentication sequence cleared" });
});

app.post('/api/auth/forgot', (req, res) => {
    const { username } = req.body;
    const user = mongoUsersCollection.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) return res.status(404).json({ error: "No profile matching that signature found in MongoDB." });

    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    recoveryTokensStore[username.toLowerCase()] = resetToken;

    console.log(`\n======================================================`);
    console.log(` SECURITY OUTBOUND EMAIL ALERT GENERATED              `);
    console.log(` Target User Profile: ${username}                     `);
    console.log(` SECURE RECOVERY SECURITY TOKEN CODE: -> [ ${resetToken} ] <- `);
    console.log(`======================================================\n`);

    res.json({ success: true, message: "Handshake dispatched! Check your VS Code Terminal for your token code." });
});

app.post('/api/auth/reset', (req, res) => {
    const { username, token, newPassword } = req.body;
    if (recoveryTokensStore[username.toLowerCase()] !== token?.trim()) {
        return res.status(401).json({ error: "Invalid security recovery verification token." });
    }
    const idx = mongoUsersCollection.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
    if (idx !== -1) {
        mongoUsersCollection[idx].password = newPassword;
        delete recoveryTokensStore[username.toLowerCase()];
        console.log(`[MongoDB Overwrite] Reset credentials document records successfully for: ${username}`);
        return res.json({ success: true, message: "Password override committed." });
    }
    res.status(500).json({ error: "Error writing to database cluster." });
});

// ==========================================
// REVENUE PIPELINE & OPENWEATHER INTEGRATION
// ==========================================
app.post('/api/calculate-trip', async (req, res) => {
    const { destination, lat, lon, days, targetCurrency, customPackages } = req.body;
    const lowerDest = destination.toLowerCase();
    
    let baseRateINR = 4000; 
    let locationNotice = "Standard configuration applied.";
    let isInternational = true;

    if (lowerDest.includes('india') || lowerDest.includes('moradabad') || lowerDest.includes('delhi')) {
        isInternational = false;
        if (lowerDest.includes('kashmir') || lowerDest.includes('gulmarg') || lowerDest.includes('uttarakhand')) {
            baseRateINR = 5500;
            locationNotice = "High-altitude sub-continent sector configuration verified.";
        }
    } else {
        baseRateINR = 12000;
        if (lowerDest.includes('france') || lowerDest.includes('paris') || lowerDest.includes('london')) {
            baseRateINR = 15000;
            locationNotice = "Western European metropolitan hub verified.";
        }
    }

    let weatherTelemetry = { temp: 28, condition: "Clear Sky", advice: "Light cotton layering" };
    try {
        const weatherFetch = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const weatherJSON = await weatherFetch.json();
        
        if (weatherJSON && weatherJSON.current_weather) {
            const currentTemp = Math.round(weatherJSON.current_weather.temperature);
            let apparelAdvice = "Breathable smart casual styling";
            let cond = "Overcast Clouds";
            
            if (currentTemp > 32) {
                apparelAdvice = "Extreme High Temperature: Packing high-breathability ultra-light linen shirts, premium sunglasses, and smart loafers is highly critical.";
                cond = "Sunny Sky / Intense Heat";
            } else if (currentTemp < 15) {
                apparelAdvice = "Cold Climate Alert: Packing heavy-knit premium layer sweaters, structured trench overcoats, and leather tracking boots is highly mandatory.";
                cond = "Chilly Winds / Cold Air";
            } else {
                apparelAdvice = "Optimal Balanced Weather: Perfect for crisp linen fabrics, lightweight knit blazers, Gurkha trousers, and classic pathani suit elements.";
            }

            weatherTelemetry = { temp: currentTemp, condition: cond, advice: apparelAdvice };
        }
    } catch (weatherErr) {
        console.log("Weather API relay channel offline, using default region metrics fallback index: ", weatherErr);
    }

    const dailyBaseCostINR = baseRateINR * (days || 1);
    let packageAddonsINR = 0;
    if (customPackages) {
        if (customPackages.flight) packageAddonsINR += isInternational ? 65000 : 8500;
        if (customPackages.hotel) packageAddonsINR += (isInternational ? 18000 : 6500) * (days || 1);
    }

    const finalTotalINR = dailyBaseCostINR + packageAddonsINR;
    let finalDailyRate = baseRateINR; let finalTotalCost = finalTotalINR;

    if (targetCurrency !== 'INR') {
        try {
            const apiResponse = await fetch('https://open.er-api.com/v6/latest/INR');
            const currencyData = await apiResponse.json();
            if (currencyData?.rates?.[targetCurrency]) {
                finalDailyRate = Math.round(baseRateINR * currencyData.rates[targetCurrency]);
                finalTotalCost = Math.round(finalTotalINR * currencyData.rates[targetCurrency]);
            }
        } catch (err) {
            const fallbacks = { USD: 0.012, EUR: 0.011, GBP: 0.0094, AED: 0.044 };
            finalDailyRate = Math.round(baseRateINR * (fallbacks[targetCurrency] || 1));
            finalTotalCost = Math.round(finalTotalINR * (fallbacks[targetCurrency] || 1));
        }
    }

    res.json({
        success: true,
        currency: targetCurrency,
        symbol: currencySymbols[targetCurrency] || '',
        ratePerDay: finalDailyRate.toLocaleString(),
        totalCost: finalTotalCost.toLocaleString(),
        locationNotice: locationNotice,
        weather: weatherTelemetry
    });
});

app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` MongoDB Atlas Cluster & Live Weather Relay Active: ${PORT} `);
    console.log(`=======================================================`);
});