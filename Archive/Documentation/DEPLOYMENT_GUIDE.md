# Deployment Guide

This guide details how to securely deploy Senthil Enterprises ERP into a production environment.

## 1. System Requirements
- Ubuntu 22.04 LTS (or similar Linux distro)
- PostgreSQL 15+
- Python 3.11+
- Nginx
- SSL Certificate (Let's Encrypt / Certbot)

## 2. Database Preparation
```bash
sudo -u postgres psql
CREATE DATABASE senthil_erp;
CREATE USER erp_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE senthil_erp TO erp_user;
```

## 3. Backend Deployment (Gunicorn + Uvicorn)

1. **Clone & Install**
   ```bash
   git clone https://github.com/your-org/senthil-erp.git
   cd senthil-erp/backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

2. **Environment Variables**
   Create a `.env` file in the `backend/` directory:
   ```env
   PROJECT_NAME="Senthil Enterprises ERP API"
   DATABASE_URL="postgresql://erp_user:your_strong_password@localhost/senthil_erp"
   SECRET_KEY="generate-a-secure-random-key"
   BACKEND_CORS_ORIGINS='["https://erp.senthilenterprises.com"]'
   ```

3. **Migrate Database**
   ```bash
   alembic upgrade head
   python init_db.py
   ```

4. **Systemd Service**
   Create `/etc/systemd/system/senthilerp.service`:
   ```ini
   [Unit]
   Description=Gunicorn instance to serve Senthil ERP
   After=network.target

   [Service]
   User=ubuntu
   Group=www-data
   WorkingDirectory=/home/ubuntu/senthil-erp/backend
   Environment="PATH=/home/ubuntu/senthil-erp/backend/venv/bin"
   ExecStart=/home/ubuntu/senthil-erp/backend/venv/bin/gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8000

   [Install]
   WantedBy=multi-user.target
   ```
   ```bash
   sudo systemctl start senthilerp
   sudo systemctl enable senthilerp
   ```

## 4. Frontend Deployment (Nginx)

1. Configure Nginx `/etc/nginx/sites-available/senthil-erp`:
   ```nginx
   server {
       listen 80;
       server_name erp.senthilenterprises.com;

       # Serve Frontend SPA
       location / {
           root /home/ubuntu/senthil-erp/frontend;
           index index.html;
           try_files $uri $uri/ /index.html;
       }

       # Proxy Backend API
       location /api/ {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

2. **Enable & Secure**
   ```bash
   sudo ln -s /etc/nginx/sites-available/senthil-erp /etc/nginx/sites-enabled
   sudo nginx -t
   sudo systemctl restart nginx
   sudo certbot --nginx -d erp.senthilenterprises.com
   ```

## 5. Monitoring & Rollback
- View logs: `journalctl -u senthilerp -f`
- Rollback DB: `alembic downgrade -1`
