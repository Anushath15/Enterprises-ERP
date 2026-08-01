# Folder Structure

```
Senthil Enterprises/
├── frontend/
│   ├── app.js                    # Router & Main Entry Point
│   ├── components/
│   │   ├── transaction/          # The Generic Transaction Framework
│   │   │   ├── reducers/         # Generic slice reducers (itemReducer, etc.)
│   │   │   ├── EntityLookup.js
│   │   │   ├── TransactionTable.js
│   │   │   └── ...
│   │   └── ui/                   # Shared UI Design System (Cards, Modals)
│   ├── config/
│   │   └── env.js                # Global configuration (Offline vs API)
│   ├── pages/
│   │   ├── sales/                # Sales-specific Module
│   │   │   ├── SalesConfig.js
│   │   │   └── salesReducer.js
│   │   ├── purchases/            # Purchase-specific Module
│   │   └── ...
│   └── services/
│       ├── domain/               # Business Logic Abstraction Layer
│       │   ├── customerService.js
│       │   ├── inventoryService.js
│       │   └── ...
│       ├── dataProvider.js       # The Data Router (Multiplexer)
│       ├── offlineDataProvider.js# LocalStorage Database Implementation
│       ├── notificationService.js# Global UI Toast/Alert system
│       └── ...
├── docs/                         # Architecture Documentation
└── scripts/
    └── run_transaction_qa.js     # Universal UI Test Automation Runner
```
