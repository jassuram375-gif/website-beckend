// --- index.js ---
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS and JSON parsing so our frontend can talk to the backend
app.use(cors());
app.use(express.json());

// Our travel destination database (Cost per day in Rupees)
const destinationDatabase = {
    "uttarakhand": { name: "Uttarakhand", baseCostPerDay: 3000 },
    "srinagar": { name: "Srinagar", baseCostPerDay: 4500 },
    "manali": { name: "Manali", baseCostPerDay: 3500 },
    "gulmarg": { name: "Gulmarg", baseCostPerDay: 5000 },
    "pahalgam": { name: "Pahalgam", baseCostPerDay: 4000 }
};

// The API Route that processes the form submission
app.post('/api/plan-trip', (req, res) => {
    // 1. Grab the destination and days sent by script.js
    const { destination, days } = req.body;

    if (!destination || !days) {
        return res.status(400).json({ error: "Missing destination or days!" });
    }

    // 2. Clean up the text input to look it up in our database (lowercase)
    const searchKey = destination.trim().toLowerCase();
    const match = destinationDatabase[searchKey];

    let finalDestinationName = destination;
    let costPerDay = 2500; // Default budget cost if destination isn't in our database

    if (match) {
        finalDestinationName = match.name;
        costPerDay = match.baseCostPerDay;
    }

    // 3. Calculate the total cost
    const totalCost = costPerDay * parseInt(days);

    // 4. Send the EXACT object structure back that script.js is looking for
    res.json({
        destination: finalDestinationName,
        totalCost: totalCost
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running beautifully on http://localhost:${PORT}`);
});