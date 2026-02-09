# API Usage Monitoring - Backend

Express + MongoDB backend for the API Usage Monitoring Platform.

See [DATA_STORAGE.md](./DATA_STORAGE.md) for where Admin, Service, and ApiMetric data are stored.
Platform flow is documented in comments at the top of `src/server.js`.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env` and set:
   - `MONGODB_URI` (default: `mongodb://localhost:27017/api-usage-monitoring`)
   - `JWT_SECRET` (required for auth; use a strong secret in production)

3. **Start MongoDB**

   Ensure MongoDB is running locally or update `MONGODB_URI` for a remote instance.

4. **Run the server**

   ```bash
   npm run dev
   ```

   Server runs at `http://localhost:3001`.

## API Endpoints

### Auth (Admin sign up / login)

- **POST** `/api/auth/register` – Sign up (first user becomes **owner**, rest become **admin**)
- **POST** `/api/auth/login` – Sign in
- **GET** `/api/auth/me` – Current admin (requires `Authorization: Bearer <token>`)
- **PUT** `/api/auth/change-password` – Change password (requires token)

### Roles

- **Admin** (Super Admin): sees all users, all projects, all services, all usage
- **User**: sees only their own projects, services, usage

### Admins (Admin only)

- **GET** `/api/admins` – List all users (requires Admin token)

### Ingestion (requires X-API-Key)

- **POST** `/api/ingest` – Ingest batched metrics

  Body:
  ```json
  {
    "metrics": [
      {
        "endpoint": "/api/users",
        "method": "GET",
        "statusCode": 200,
        "responseTime": 45,
        "requestCount": 1
      }
    ]
  }
  ```

### Projects (folders) – require auth

- **POST** `/api/projects` – Create project
- **GET** `/api/projects` – List projects (owner: all, admin: own)
- **GET** `/api/projects/tree` – Folder structure
- **GET** `/api/projects/:id` – Get project with services

### Services (APIs under a project) – require auth

- **POST** `/api/services` – Create service (`{"name": "Billing API", "projectId": "..."}`)
- **GET** `/api/services` – List services (owner: all, admin: own)

### Usage – require auth

- **GET** `/api/usage/summary` – (owner: all, admin: own services)
- **GET** `/api/usage/endpoints` – (owner: all, admin: own services)
- **GET** `/api/usage/trends` – (owner: all, admin: own services)

## Project Structure

```
src/
├── controllers/   # Business logic (auth, projects, services, ingest, usage)
├── routes/      # Thin route definitions → call controllers
├── middleware/  # auth (API key), validateIngest, protectAdmin (JWT)
├── models/      # Admin, AdminProject, Service, ApiMetric
├── config/
├── app.js
└── server.js
```

## Quick Test

1. Sign up (first user becomes Admin):
   ```bash
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@test.com","password":"secret123","name":"Admin"}'
   # Use returned token for all protected routes: Authorization: Bearer <token>
   ```

2. Create a project, then a service (with token):
   ```bash
   # Create project (folder)
   curl -X POST http://localhost:3001/api/projects \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"name": "My APIs"}'

   # Create service under project (use project id from above)
   curl -X POST http://localhost:3001/api/services \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"name": "Billing API", "projectId": "PROJECT_ID"}'
   ```

3. Use the returned `apiKey` to ingest metrics:
   ```bash
   curl -X POST http://localhost:3001/api/ingest \
     -H "Content-Type: application/json" \
     -H "X-API-Key: YOUR_API_KEY" \
     -d '{"metrics":[{"endpoint":"/api/users","method":"GET","statusCode":200,"responseTime":50}]}'
   ```

4. Fetch usage (with token):
   ```bash
   curl "http://localhost:3001/api/usage/summary?range=24h" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

5. Get folder structure (with token):
   ```bash
   curl http://localhost:3001/api/projects/tree \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

6. Admin only – list all users:
   ```bash
   curl http://localhost:3001/api/admins \
     -H "Authorization: Bearer ADMIN_TOKEN"
   ```
