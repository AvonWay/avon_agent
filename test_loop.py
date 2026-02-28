import requests
import time

BASE_URL = "http://localhost:4000/api/test"

def run_autonomous_loop():
    # 1. Trigger a new architectural test
    print("🚀 Triggering build test...")
    trigger = requests.post(f"{BASE_URL}/trigger", json={"template": "ecommerce-dashboard"})
    
    # 2. Poll for status (Simulated Linting/Hydration Check)
    while True:
        status = requests.get(f"{BASE_URL}/status").json()
        if status['state'] == 'error':
            print(f"⚠️ Error detected: {status['log']}")
            
            # 3. Refactor automatically via Avon_Bot logic
            print("🛠 Sending to Avon_Bot for refactoring...")
            refactor = requests.patch(f"{BASE_URL}/refactor", json={
                "error_log": status['log'],
                "code": status['faulty_code']
            })
            print("✅ Code refactored.")
            
        elif status['state'] == 'success':
            # 4. Deploy the optimized build
            requests.post(f"{BASE_URL}/deploy-local")
            print("🏁 Build optimized and deployed locally!")
            break
        
        time.sleep(5) # Wait for simulation cycles

if __name__ == "__main__":
    run_autonomous_loop()
