// keys.js

const ALLOWED_KEYS = {
    // Example 1: Limit to 2 Devices
    "key3": { 
        name: "Standard User", 
        plan: "Standard", 
        expiry: "2025-12-10T15:59:00+02:00",
        maxDevices: 2 
    },

    // Example 2: Limit to 1 Device (Strict)
    "key2": { 
        name: "Solo Admin", 
        plan: "Personal", 
        expiry: "2026-01-01T00:00:00+02:00",
        maxDevices: 1
    },

    // Example 3: Unlimited (High number)
    "key1": { 
        name: "Team Account", 
        plan: "Enterprise", 
        expiry: "2026-01-01T00:00:00+02:00",
        maxDevices: 2
    }
};
