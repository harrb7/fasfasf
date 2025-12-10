// script.js
const SERVER_URL = "http://127.0.0.1:5000";

// --- NAVIGATION ---
function navigate(pageId) {
    document.querySelectorAll('.section').forEach(sec => {
        sec.style.display = 'none';
        sec.classList.remove('active');
    });
    const target = document.getElementById(pageId);
    if (target) {
        target.style.display = 'flex';
        setTimeout(() => target.classList.add('active'), 10);
    }
}

// --- LOGIN ---
async function handleLogin() {
    // 1. Get Key from Input
    let keyInput = document.getElementById('license-key').value.trim();
    
    // If empty, maybe check if we are auto-logging in from session
    if (!keyInput) {
        keyInput = sessionStorage.getItem('current_key');
    }
    
    if (!keyInput) return;

    // 2. Validate Key exists in keys.js
    if (typeof ALLOWED_KEYS === 'undefined' || !ALLOWED_KEYS[keyInput]) {
        showError("Invalid Key");
        return;
    }

    const keyConfig = ALLOWED_KEYS[keyInput];
    const btn = document.getElementById('login-btn');
    const status = document.getElementById('login-status');

    if(btn) {
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking...';
        btn.disabled = true;
    }
    if(status) status.innerHTML = "";

    try {
        // 3. Get/Create Device ID
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId) {
            deviceId = Math.random().toString(36).substring(2);
            localStorage.setItem('device_id', deviceId);
        }

        // 4. Send to Python Server
        // We send the expiry and limit FROM keys.js so Python can enforce them
        const response = await fetch(`${SERVER_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                key: keyInput, 
                device_id: deviceId,
                max_devices: keyConfig.maxDevices,
                expiry: keyConfig.expiry 
            })
        });

        const result = await response.json();

        if (result.success) {
            // SUCCESS
            sessionStorage.setItem('current_key', keyInput);
            
            // Restore Data
            if (result.data) {
                if(document.getElementById('home-name')) document.getElementById('home-name').value = result.data.hName || "";
                if(document.getElementById('home-score')) document.getElementById('home-score').value = result.data.hScore || "";
                if(document.getElementById('away-name')) document.getElementById('away-name').value = result.data.aName || "";
                if(document.getElementById('away-score')) document.getElementById('away-score').value = result.data.aScore || "";
            }

            if(status) status.innerHTML = '<span class="text-green-400">Connected!</span>';
            setTimeout(() => {
                navigate('dashboard');
                startSecurityCheck(); // Start checking time
            }, 500);
        } else {
            // FAILED (Expired or Limited)
            showError(result.message);
            if (result.message.includes("Expired") || result.message.includes("Finished")) {
                 logout();
            }
        }

    } catch (error) {
        console.error(error);
        showError("Server Offline. Run server.py");
    } finally {
        if(btn) {
            btn.innerHTML = 'Unlock';
            btn.disabled = false;
        }
    }
}

function showError(msg) {
    const status = document.getElementById('login-status');
    if(status) status.innerHTML = `<span class="text-red-500 font-bold">${msg}</span>`;
}

// --- SAVE DATA ---
async function saveUserData() {
    const key = sessionStorage.getItem('current_key');
    if (!key) return;

    const data = {
        hName: document.getElementById('home-name').value,
        hScore: document.getElementById('home-score').value,
        aName: document.getElementById('away-name').value,
        aScore: document.getElementById('away-score').value
    };

    // Save to Python
    await fetch(`${SERVER_URL}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: key, data: data })
    });
}

// --- LOGOUT ---
async function logout() {
    const key = sessionStorage.getItem('current_key');
    const deviceId = localStorage.getItem('device_id');

    if (key) {
        try {
            await fetch(`${SERVER_URL}/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: key, device_id: deviceId })
            });
        } catch(e) { console.log("Logout offline"); }
    }

    sessionStorage.removeItem('current_key');
    // Clear inputs visually
    document.getElementById('license-key').value = "";
    if(document.getElementById('home-name')) document.getElementById('home-name').value = "";
    if(document.getElementById('home-score')) document.getElementById('home-score').value = "";
    if(document.getElementById('away-name')) document.getElementById('away-name').value = "";
    if(document.getElementById('away-score')) document.getElementById('away-score').value = "";
    
    navigate('login');
}

// --- BACKGROUND CHECK (Time Limit) ---
function startSecurityCheck() {
    setInterval(() => {
        const key = sessionStorage.getItem('current_key');
        if(!key || typeof ALLOWED_KEYS === 'undefined') return;
        
        const config = ALLOWED_KEYS[key];
        if(!config) return;

        const now = new Date();
        const expiry = new Date(config.expiry);

        if (now > expiry) {
            alert("Your plan has finished.");
            logout();
        }
    }, 5000); // Check every 5 seconds
}

// --- STARTUP ---
document.addEventListener("DOMContentLoaded", () => {
    // Check if we are already logged in (Refresh page support)
    if (sessionStorage.getItem('current_key')) {
        handleLogin();
    } else {
        navigate('home');
    }
});
