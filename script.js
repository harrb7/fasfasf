// script.js

// --- 1. NAVIGATION ---
function navigate(pageId) {
    const sections = document.querySelectorAll('.section');
    sections.forEach(sec => {
        sec.style.display = 'none';
        sec.classList.remove('active');
    });

    const target = document.getElementById(pageId === 'login' ? 'login' : pageId);
    if (target) {
        target.style.display = 'flex';
        setTimeout(() => target.classList.add('active'), 10);
    }

    const navBtn = document.getElementById('nav-login-btn');
    if (navBtn) {
        if (pageId === 'dashboard') {
            navBtn.innerText = 'Logout';
            navBtn.onclick = logout;
            navBtn.classList.replace('bg-blue-600', 'bg-red-500'); 
        } else {
            navBtn.innerText = 'Login';
            navBtn.onclick = () => navigate('login');
            navBtn.classList.replace('bg-red-500', 'bg-blue-600');
        }
    }
}

// --- 2. LOGIN LOGIC ---
function handleLogin() {
    const keyInput = document.getElementById('license-key').value.trim();
    const statusDiv = document.getElementById('login-status');
    const btn = document.getElementById('login-btn');

    statusDiv.innerHTML = '';
    
    if (!keyInput) {
        statusDiv.innerHTML = '<span class="text-red-400">Please enter a key.</span>';
        return;
    }

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Checking...';
    btn.disabled = true;

    setTimeout(() => {
        if (typeof ALLOWED_KEYS !== 'undefined' && ALLOWED_KEYS.hasOwnProperty(keyInput)) {
            const keyData = ALLOWED_KEYS[keyInput];
            
            // 1. Check Expiration
            if (!checkExpiration(keyData.expiry).isValid) {
                failLogin("Plan Finished.");
                return;
            }

            // 2. Check Device Limit (STRICT MODE)
            const deviceCheck = checkDeviceLimitStrict(keyInput, keyData.maxDevices);
            if (!deviceCheck.allowed) {
                failLogin(`Device Limit Reached (${deviceCheck.count}/${keyData.maxDevices}).`);
                return;
            }

            // --- SUCCESS ---
            statusDiv.innerHTML = '<span class="text-green-400 font-bold">Access Granted!</span>';
            
            sessionStorage.setItem('thumb_current_key', keyInput);

            setTimeout(() => {
                loadUserData(); 
                navigate('dashboard');
                btn.disabled = false;
                btn.innerHTML = 'Unlock';
                document.getElementById('license-key').value = '';
                startSecurityTimer();
            }, 500);

        } else {
            failLogin("Key not found.");
        }
    }, 800);

    function failLogin(msg) {
        statusDiv.innerHTML = `<span class="text-red-500 font-bold">${msg}</span>`;
        btn.innerHTML = 'Unlock';
        btn.disabled = false;
    }
}

// --- 3. AUTO-SAVE ---
function saveUserData() {
    const currentKey = sessionStorage.getItem('thumb_current_key');
    if (!currentKey) return;

    const hName = document.getElementById('home-name');
    const hScore = document.getElementById('home-score');
    const aName = document.getElementById('away-name');
    const aScore = document.getElementById('away-score');

    if (hName && hScore && aName && aScore) {
        const data = {
            hName: hName.value,
            hScore: hScore.value,
            aName: aName.value,
            aScore: aScore.value
        };
        localStorage.setItem('data_' + currentKey, JSON.stringify(data));
    }
}

function loadUserData() {
    const currentKey = sessionStorage.getItem('thumb_current_key');
    if (!currentKey) return;

    const saved = localStorage.getItem('data_' + currentKey);
    if (saved) {
        const data = JSON.parse(saved);
        if(document.getElementById('home-name')) document.getElementById('home-name').value = data.hName || "";
        if(document.getElementById('home-score')) document.getElementById('home-score').value = data.hScore || "";
        if(document.getElementById('away-name')) document.getElementById('away-name').value = data.aName || "";
        if(document.getElementById('away-score')) document.getElementById('away-score').value = data.aScore || "";
    }
}

// --- 4. STARTUP CHECK ---
document.addEventListener("DOMContentLoaded", () => {
    // Clean up old bugged keys
    localStorage.removeItem('thumb_current_key');

    const savedKey = sessionStorage.getItem('thumb_current_key');
    
    if (savedKey && typeof ALLOWED_KEYS !== 'undefined' && ALLOWED_KEYS[savedKey]) {
        if (checkExpiration(ALLOWED_KEYS[savedKey].expiry).isValid) {
            navigate('dashboard');
            loadUserData();
            startSecurityTimer();
        } else {
            logout(); 
        }
    } else {
        navigate('home');
    }
});

// --- 5. HELPERS (STRICT ID SYSTEM) ---

function getSessionId() {
    // 1. Try to get ID from this specific tab (Session)
    let id = sessionStorage.getItem('thumb_tab_id');
    
    // 2. If no ID (New Tab), create one
    if (!id) {
        id = Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('thumb_tab_id', id);
    }
    return id;
}

function checkDeviceLimitStrict(key, maxLimit) {
    const myId = getSessionId();
    
    // Get list of ALL active IDs for this key from Permanent Storage
    let devices = JSON.parse(localStorage.getItem('devices_' + key) || '[]');
    
    // A. Am I already in the list? (I refreshed the page)
    if (devices.includes(myId)) {
        return { allowed: true, count: devices.length };
    }
    
    // B. Is there space for me? (I am a new tab)
    if (devices.length < maxLimit) {
        devices.push(myId);
        localStorage.setItem('devices_' + key, JSON.stringify(devices));
        return { allowed: true, count: devices.length };
    }
    
    // C. No space left
    return { allowed: false, count: devices.length };
}

function checkExpiration(expiryString) {
    return (new Date() > new Date(expiryString)) ? { isValid: false } : { isValid: true };
}

function logout() {
    // When logging out, we should remove THIS tab's ID from the list
    // so the slot becomes free again
    const key = sessionStorage.getItem('thumb_current_key');
    const myId = sessionStorage.getItem('thumb_tab_id');
    
    if (key && myId) {
        let devices = JSON.parse(localStorage.getItem('devices_' + key) || '[]');
        // Filter out my ID
        devices = devices.filter(id => id !== myId);
        localStorage.setItem('devices_' + key, JSON.stringify(devices));
    }

    sessionStorage.removeItem('thumb_current_key');
    navigate('login');
    if (window.securityInterval) clearInterval(window.securityInterval);
}

function startSecurityTimer() {
    if (window.securityInterval) clearInterval(window.securityInterval);
    window.securityInterval = setInterval(() => {
        const key = sessionStorage.getItem('thumb_current_key');
        if (key && ALLOWED_KEYS[key]) {
             if (!checkExpiration(ALLOWED_KEYS[key].expiry).isValid) {
                 alert("Time Up!");
                 logout();
             }
        }
    }, 5000);
}
