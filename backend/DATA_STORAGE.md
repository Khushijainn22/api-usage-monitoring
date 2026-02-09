# Where Data Is Stored

## MongoDB Collections

| Collection   | Purpose                                   | When Used      |
|-------------|-------------------------------------------|----------------|
| **Admin**   | Platform accounts: email, password, name, role (admin/user) | Step 1: Sign-up. First user = Admin |
| **Project** | Folders for organizing APIs: name         | Admin creates projects |
| **Service** | APIs under a project: name, apiKey, projectId | Step 2: Create Service |
| **ApiMetric** | Usage metrics: endpoint, method, statusCode, responseTime, etc. | Step 6: Middleware sends, we save |

## Hierarchy

```
Admin
  └── Project (folder)
        └── Service (API)
              └── ApiMetric (usage data)
```

## Current State

- **Admin**: Model exists. Sign-up/login not yet implemented.
- **Project**: Folders. Admin creates Project first, then Services under it.
- **Service**: Requires `projectId`. Belongs to a Project.
- **ApiMetric**: Stored with `serviceId`. Usage API supports `?projectId=...` to aggregate by project.
