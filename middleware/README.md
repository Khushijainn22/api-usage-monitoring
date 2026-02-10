# api-usage-monitor

Express middleware: send API request metrics to the monitoring platform.

**Platform:** https://api-usage-monitoring.vercel.app (sign up, create a project/service, copy API key)

## Install

```bash
npm install api-usage-monitor
```

## Use

Add **before** your routes:

```javascript
const apiUsageMonitor = require('api-usage-monitor');

app.use(apiUsageMonitor({
  apiKey: 'YOUR_API_KEY',      // From platform: Projects → Add service
  ingestionUrl: 'https://api-usage-monitoring.onrender.com',
  excludePaths: ['/health'],    // optional
}));
```

## Options

| Option        | Required | Description                    |
|---------------|----------|--------------------------------|
| `apiKey`      | Yes      | Service API key from platform  |
| `ingestionUrl`| Yes      | `https://api-usage-monitoring.onrender.com` |
| `excludePaths`| No       | Paths to skip (e.g. `['/health']`) |

Lost key? Contact admin **khushij2210@gmail.com**.
