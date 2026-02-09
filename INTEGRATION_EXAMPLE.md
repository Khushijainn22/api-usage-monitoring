# How to Add API Usage Monitor to Your App

## Step 1: Copy the middleware folder

Copy the `middleware` folder from this project into your user project's root:

```
your-user-project/
├── middleware/          <- Copy this folder from api-usage-monitoring/
│   ├── index.js
│   └── package.json
├── app.js
├── src/
└── ...
```

## Step 2: Add to your app.js

### 1. Add the require (near the top with other requires):

```javascript
const apiUsageMonitor = require("./middleware");
```

### 2. Add the middleware inside `initializeApp()`, BEFORE `app.use("/", routes)`:

```javascript
// Add this BEFORE app.use("/", routes)
app.use(apiUsageMonitor({
  apiKey: process.env.API_USAGE_API_KEY || "",
  ingestionUrl: process.env.API_USAGE_INGESTION_URL || "http://localhost:3001",
  excludePaths: ["/health"],
}));
```

### 3. Add to your .env file:

```
API_USAGE_API_KEY=your_api_key_from_platform
API_USAGE_INGESTION_URL=http://localhost:3001
```

