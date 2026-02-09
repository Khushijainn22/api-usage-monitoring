# API Usage Monitoring - Frontend

React + Vite frontend for the API Usage Monitoring Platform.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the backend** (from `../backend`)

   ```bash
   npm run dev
   ```

3. **Run the frontend**

   ```bash
   npm run dev
   ```

   App runs at `http://localhost:5173`. API requests are proxied to `http://localhost:3001`.

## Production

Set `VITE_API_URL` to your backend URL before building:

```bash
VITE_API_URL=https://api.yourdomain.com npm run build
```

## Pages

- **Login / Register** – Auth (first user becomes owner)
- **Overview** – Dashboard with stats and project tree
- **Projects** – Create projects and services, get API keys
- **Usage** – Traffic charts and top endpoints
- **Admins** – List all admins (owner only)
