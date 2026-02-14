# VELOCITY BUILD PLAN - Local Dev Server

To initialize a local development server with Hot Module Replacement (HMR) and Watch Mode, execute the following commands in sequence.

## 1. Scaffold the Node

```bash
# Create a fresh Vite environment for high-velocity development
npm create vite@latest avon-dev-node -- --template vanilla
```

## 2. Initialize Environment

```bash
cd avon-dev-node
npm install
```

## 3. Power Up (HMR & Watch Mode)

```bash
# This starts the dev server with Hot Module Replacement enabled
# Build files are watched natively by Vite
npm run dev
```

## 4. Supabase Link (Avon Protocol)

```bash
# Register this new deployment node with the local deployment ledger (Simulated)
echo "Registering site_id: avon-dev-node-$(date +%s)"
```

---
**Status:** Ready to execute.
**Local URL:** Typically `http://localhost:5173` (Vite Default)
