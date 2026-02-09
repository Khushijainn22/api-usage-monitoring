/**
 * PLATFORM FLOW (Super Admin = you, Admins = your customers who use the platform)
 *
 * 1. Admin signs up on your platform
 *    → Admin data stored in Admin collection (email, password, name)
 *
 * 2. Admin creates Project (folder) → creates Service (API) under it
 *    POST /api/projects  {"name": "Backend APIs"}
 *    POST /api/services  {"name": "Billing API", "projectId": "..."}
 *    → Service created, API key returned (stored in Service collection)
 *
 * 3. Admin saves the API key in their backend
 *
 * 4. Admin installs your middleware in their backend
 *
 * 5. When their backend serves requests:
 *    Middleware collects metrics → Sends to your platform with X-API-Key
 *
 * 6. Your platform:
 *    - Looks up: which Service has this API key? (auth.js)
 *    - Saves metrics with that serviceId (ingest.js)
 *    → Metrics tied to Admin's API (ApiMetric collection)
 *
 * 7. Admin opens your dashboard
 *    → Sees usage and performance for their APIs (usage.js)
 */
require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 3001;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('Endpoints:');
      console.log('  POST /api/auth/register - Sign up');
      console.log('  POST /api/auth/login    - Sign in');
      console.log('  GET  /api/auth/me       - Current admin (Bearer token)');
      console.log('  GET  /api/admins       - List users (Admin only)');
      console.log('  POST /api/projects   - Create project (folder)');
      console.log('  GET  /api/projects/tree - Folder structure');
      console.log('  POST /api/services   - Create service under project');
      console.log('  POST /api/ingest     - Ingest metrics (requires X-API-Key)');
      console.log('  GET  /api/usage/*   - Dashboard API');
    });
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

