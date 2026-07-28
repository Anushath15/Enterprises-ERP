# Senthil Enterprises ERP

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Project Overview

**What is Senthil Enterprises ERP?**
Senthil Enterprises ERP is a custom-built, full-stack Enterprise Resource Planning application designed exclusively for the operational workflows of hardware, electrical, plumbing, and sanitary retail shops. 

**Why it was built**
Legacy systems often lack offline resilience and force users into rigid workflows. This ERP was engineered to address these pain points with a **dual-mode architecture**. It functions entirely offline via LocalStorage during internet outages and seamlessly transitions to a centralized PostgreSQL/FastAPI backend when online.

**Target Users**
Shop owners, billing clerks, and inventory managers.

**Business Problems Solved**
- Inaccurate stock tracking.
- Complicated customer and dealer credit management.
- Daily cash reconciliation errors.
- Lack of offline billing resilience.

## Features

- **Authentication**: JWT-based Role-Based Access Control (Admin/Staff).
- **Dashboard**: Real-time KPIs for Sales, Purchases, Cash, and Inventory.
- **POS Billing**: Lightning-fast offline/online cart system with GST support.
- **Product Management**: Hierarchical SKU, Category, and Brand management.
- **Customer Management**: Unified directory with outstanding credit tracking.
- **Dealer Management**: Unified directory with payable credit tracking.
- **Purchases**: Inbound stock handling that automatically credits dealers.
- **Sales/Purchase Returns**: Configurable return handling (V2).
- **Expenses**: Daily operational cost tracking.
- **Daily Closing**: Automated cash-in-hand reconciliation.
- **Reports**: Transactional, financial, and inventory analytics.

## Technology Stack

**Frontend**
- Vanilla JavaScript (Zero build step)
- HTML5 / CSS3
- TailwindCSS (Utility styling)

**Backend**
- Python 3.11+
- FastAPI (High-performance web framework)
- SQLAlchemy (ORM)
- Alembic (Database migrations)
- PostgreSQL (Primary Data Store)
- JWT (Authentication)

## Architecture Overview

The system utilizes a **Single Page Application (SPA)** frontend talking to a **REST API** backend. 
A unique `IDataProvider` abstraction layer allows the frontend to swap between `OfflineDataProvider` (LocalStorage) and `ApiDataProvider` (FastAPI) via a single environment toggle. 
The backend adheres to a strict layered architecture: `Router` -> `Service` -> `Repository` -> `Database`.

## Folder Structure

```text
root/
├── backend/
│   ├── alembic/             # Database migrations
│   ├── app/
│   │   ├── api/             # REST endpoints (Routers)
│   │   ├── core/            # Configuration & Security
│   │   ├── database/        # DB connection & Session
│   │   ├── exceptions/      # Global error handlers
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── repositories/    # Database queries
│   │   ├── schemas/         # Pydantic validation models
│   │   ├── security/        # JWT & Password hashing
│   │   └── services/        # Business logic
│   ├── tests/               # Pytest suite
│   ├── main.py              # Application entrypoint
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── assets/              # CSS, Images
│   ├── components/          # Reusable UI parts
│   ├── config/              # env.js (API vs Offline mode)
│   ├── core/                # Router, Auth, ApiClient
│   ├── data/                # Data Providers
│   ├── pages/               # Page controllers & HTML views
│   └── app.js               # Frontend entrypoint
└── index.html               # SPA root
```

## Installation & Setup

### Prerequisites
- Python 3.11+
- PostgreSQL 15+
- Node.js (Optional, for running a local static server)

### 1. Database Setup
```bash
createdb senthil_erp
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # (Windows: venv\Scripts\activate)
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your DATABASE_URL
alembic upgrade head
python init_db.py  # Creates default admin user
```

### 3. Frontend Setup
The frontend is Vanilla JS. Simply serve the root directory.
```bash
# Using Python
python -m http.server 5500
# Using Node
npx serve . -p 5500
```

## Running the Application

### Online Mode (Production)
1. Ensure `frontend/config/env.js` has `API_MODE = 'online'`.
2. Start the backend: `uvicorn app.main:app --reload --port 8000`
3. Serve the frontend: `http://localhost:5500`

### Offline Mode (Development/Fallback)
1. Ensure `frontend/config/env.js` has `API_MODE = 'offline'`.
2. Serve the frontend. The backend is not required. Data persists in LocalStorage.

## API & Database
Read the detailed `API_DOCUMENTATION.md` and `DATABASE_ER_DIAGRAM.md` for deep technical integrations.

## Future Roadmap
See `VERSION_2_BACKLOG.md` for upcoming features including Cloud Synchronization, Barcode Scanning, and Mobile Apps.

## License
MIT License. Created exclusively for Senthil Enterprises.
