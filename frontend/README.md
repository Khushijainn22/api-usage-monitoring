# API Usage Monitoring – Frontend

React + Vite dashboard. Use the **deployed app** or run locally.

## Run locally

```bash
npm install
```

Create `frontend/.env`:

```
VITE_API_URL=http://localhost:3001
```

(or `http://localhost:3001` if the backend is local)

```bash
npm run dev
```

App at `http://localhost:5173`.

## Build for production

```bash
VITE_API_URL=https://api.yourdomain.com npm run build
```

Deploy the `dist/` folder.

## Pages

Login, Register, Overview, Projects, Usage, Users (admin only).
