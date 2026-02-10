# API Usage Monitoring – Backend

Express + MongoDB API for the platform.

## Run locally

```bash
npm install
cp .env   # Set MONGODB_URI, JWT_SECRET, PORT, NODE_ENV
npm run dev
```

Runs at `http://localhost:3001`. Data: MongoDB (Admin, AdminProject, Service, ApiMetric).

Roles: **Admin** sees everything; **User** sees only own projects/services.
