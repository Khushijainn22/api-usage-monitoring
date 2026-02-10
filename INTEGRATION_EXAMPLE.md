# Add API Usage Monitor to Your App

## 1. Install

```bash
npm install api-usage-monitor
```

## 2. Wire in Express (before routes)

```javascript
const apiUsageMonitor = require('api-usage-monitor');

app.use(apiUsageMonitor({
  apiKey: process.env.API_USAGE_API_KEY,
  ingestionUrl: 'https://api-usage-monitoring.onrender.com',
  excludePaths: ['/health'],
}));
```

## 3. Env

```
API_USAGE_API_KEY=your_api_key_from_platform
```

Get the key: sign up at the platform → Projects → Add service → copy API key.
