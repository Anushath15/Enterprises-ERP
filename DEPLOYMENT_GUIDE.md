# Senthil Enterprises ERP - Deployment Guide

This guide outlines the production deployment strategy for the Senthil Enterprises ERP.

## 1. Prerequisites

- **Server**: Ubuntu 22.04 LTS (Recommended) or Windows Server.
- **Database**: PostgreSQL 16+.
- **Runtime**: Python 3.12+ (Backend), Node.js (for serving static frontend).
- **Reverse Proxy**: Nginx or Caddy.

## 2. Backend Deployment (FastAPI)

1. **Clone the Repository**:
   ```bash
   git clone <repo-url>
   cd senthil-erp/backend
   ```

2. **Environment Configuration**:
   Create a `.env` file in the `backend/` directory:
   ```env
   DATABASE_URL=postgresql+psycopg://user:password@localhost:5432/senthil_erp
   SECRET_KEY=generate-a-secure-random-256-bit-key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   ```

3. **Database Migration**:
   Run Alembic to establish the database schema:
   ```bash
   alembic upgrade head
   ```
   *Note: Migration `006_auth_schema` will automatically seed the initial `admin` user with password `admin123`.*

4. **Run the Application**:
   Use Uvicorn with Gunicorn for production concurrency:
   ```bash
   gunicorn -k uvicorn.workers.UvicornWorker app.main:app --workers 4 --bind 0.0.0.0:8000
   ```

## 3. Frontend Deployment

1. **Configure Environment**:
   Edit `frontend/config/env.js`:
   ```javascript
   export const config = {
     API_MODE: 'online',
     API_BASE_URL: 'https://api.senthilenterprises.com/api/v1'
   };
   ```

2. **Static Hosting**:
   The frontend is a vanilla SPA. It does not require a build step. Simply host the `frontend/` directory using Nginx, Apache, or any static file server.

   *Nginx Example Configuration*:
   ```nginx
   server {
       listen 80;
       server_name erp.senthilenterprises.com;
       root /var/www/senthil-erp/frontend;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

## 4. Continuous Integration (Automated Testing)

Before any major release, ensure the Backend Integration Test Suite passes:
```bash
cd backend
python -m pytest tests/integration/test_business_workflows.py -v
```
This suite verifies:
- Cross-module transaction safety (Sales vs Inventory).
- Insufficient stock rollbacks.
- Financial metric consistency.
