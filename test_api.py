import requests
import json
import time

BASE_URL = "http://localhost:4000"

def test_workflow():
    print("Starting Live Test Workflow...")
    
    # 1. Health Check
    try:
        res = requests.get(f"{BASE_URL}/api/health")
        print(f"Health: {res.status_code} - {res.json()}")
    except Exception as e:
        print(f"Health Failed: {e}")
        return

    # 2. Register
    email = f"test_{int(time.time())}@example.com"
    reg_data = {
        "email": email,
        "password": "password123",
        "full_name": "Antigravity Tester"
    }
    res = requests.post(f"{BASE_URL}/api/auth/register", json=reg_data)
    if res.status_code == 200:
        data = res.json()
        token = data['token']
        print(f"Register: SUCCESS (User: {email})")
    else:
        print(f"Register Failed: {res.status_code} - {res.text}")
        return

    # 3. Fetch Sites
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/api/sites", headers=headers)
    print(f"Fetch Sites: {res.status_code} - Found {len(res.json())} sites")

    # 4. Trigger Site Generation
    gen_data = {
        "prompt": "A modern landing page for a solar energy company",
        "theme": "velocity-dark"
    }
    res = requests.post(f"{BASE_URL}/api/generate-site", json=gen_data, headers=headers)
    if res.status_code == 200:
        site_id = res.json().get('node_id')
        print(f"Site Generation Triggered: {site_id}")
    else:
        print(f"Site Generation Failed: {res.status_code} - {res.text}")
        return

    # 5. Evolution Status
    res = requests.get(f"{BASE_URL}/api/evolution/status")
    print(f"Evolution Status: {res.status_code}")
    
    # 6. Public site lookup (immediate)
    res = requests.get(f"{BASE_URL}/api/public/sites/{site_id}")
    print(f"Site Lookup: {res.status_code} - Status: {res.json().get('status')}")

    print("\nLIVE TEST COMPLETE.")

if __name__ == "__main__":
    test_workflow()
