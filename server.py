import json
import os
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# --- DATABASE FILES ---
DB_FILE = "user_data.json"

# --- IN-MEMORY SESSION STORAGE ---
# This tracks who is logged in right now.
active_sessions = {}  # Format: {"KEY_NAME": ["device_id_1", "device_id_2"]}

# --- HELPER FUNCTIONS ---
def load_data():
    if not os.path.exists(DB_FILE):
        return {}
    with open(DB_FILE, 'r') as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

def save_data(data):
    with open(DB_FILE, 'w') as f:
        json.dump(data, f, indent=4)

# --- ROUTES ---

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    key = data.get('key')
    device_id = data.get('device_id')
    
    # These come from keys.js (Frontend sends them)
    max_devices = data.get('max_devices', 1) 
    expiry_str = data.get('expiry') 

    print(f"🔹 Login Attempt: Key={key} | Device={device_id}")

    # 1. CHECK EXPIRATION (Server Side Check)
    # Format from keys.js is usually ISO: "2025-12-10T15:30:00+02:00"
    if expiry_str:
        try:
            # Simple string comparison works for ISO format dates
            # If current time (ISO) > Expiry Time (ISO), it's expired.
            now_iso = datetime.now().isoformat()
            # We strip the timezone for simple comparison or use simple string compare
            if now_iso > expiry_str and len(expiry_str) > 10: 
                 print(f"❌ Expired: {key}")
                 return jsonify({"success": False, "message": "Plan Finished (Time Expired)"}), 403
        except Exception as e:
            print(f"⚠️ Date Error: {e}")
            pass

    # 2. CHECK DEVICE LIMITS (Strict Logic)
    if key not in active_sessions:
        active_sessions[key] = []

    # If this specific device is NOT in the list...
    if device_id not in active_sessions[key]:
        # ...and the list is FULL...
        if len(active_sessions[key]) >= max_devices:
            print(f"🚫 Device Limit: {key} ({len(active_sessions[key])}/{max_devices})")
            return jsonify({"success": False, "message": "Device Limit Reached"}), 403
        
        # Add new device
        active_sessions[key].append(device_id)
        print(f"✅ Device Added. Active: {active_sessions[key]}")

    # 3. LOAD SAVED DATA
    all_data = load_data()
    user_inputs = all_data.get(key, {})

    return jsonify({
        "success": True, 
        "data": user_inputs
    })

@app.route('/save', methods=['POST'])
def save():
    data = request.json
    key = data.get('key')
    user_inputs = data.get('data')

    if not key:
        return jsonify({"success": False}), 400

    all_data = load_data()
    all_data[key] = user_inputs
    save_data(all_data)
    
    return jsonify({"success": True})

@app.route('/logout', methods=['POST'])
def logout():
    data = request.json
    key = data.get('key')
    device_id = data.get('device_id')

    if key in active_sessions and device_id in active_sessions[key]:
        active_sessions[key].remove(device_id)
        print(f"👋 Logged Out: {key} | Device: {device_id}")

    return jsonify({"success": True})

if __name__ == '__main__':
    print("🚀 SERVER STARTED on http://127.0.0.1:5000")
    print("Waiting for connections...")
    app.run(port=5000, debug=True)