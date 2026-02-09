# API Usage Monitor - Express Middleware

Tracks API requests and sends metrics to the monitoring platform.

## Setup

1. Copy this folder into your project, or install if published:

   ```bash
   npm install api-usage-monitor
   ```

2. Add the middleware to your Express app **before** your routes:

   ```javascript
   const express = require('express');
   const apiUsageMonitor = require('./middleware'); // or 'api-usage-monitor'

   const app = express();

   // Add this before your routes
   app.use(apiUsageMonitor({
     apiKey: 'YOUR_API_KEY',           // From the platform (Projects → Add service)
     ingestionUrl: 'http://localhost:3001',  // Your platform URL
     excludePaths: ['/health', '/favicon.ico'],  // Optional: paths to skip
   }));

   app.get('/api/users', (req, res) => { ... });
   app.post('/api/login', (req, res) => { ... });

   app.listen(3000);
   ```

3. Run your app. When requests hit your API, metrics are sent automatically.

4. Open the platform dashboard → **Usage** to see endpoint traffic.

## Options

| Option | Required | Description |
|--------|----------|-------------|
| `apiKey` | Yes | Your service API key from the platform |
| `ingestionUrl` | Yes | Platform URL (e.g. `http://localhost:3001`) |
| `excludePaths` | No | Array of paths to skip (e.g. `['/health']`) |

## Production

Set `ingestionUrl` to your deployed platform URL, e.g. `https://your-platform.com`.

## Lost your API key?

Contact admin **khushij2210** to recover your API key.
