# Microservices Shared Models Case Study

This project demonstrates a scalable architecture for sharing TypeORM models across multiple services using a shared library approach. It is designed for microservices that need type safety, schema consistency, and independent deployment.

---

## 📦 Project Structure

```bash
.
├── lerna.json
├── package-lock.json
├── package.json
└── packages
    ├── service-a
    │   ├── docker-compose.dev.yml
    │   ├── docker-compose.yml
    │   ├── Dockerfile
    │   ├── jest.config.js
    │   ├── package.json
    │   ├── scripts
    │   │   └── init.sql
    │   ├── src
    │   │   ├── app.ts
    │   │   ├── config
    │   │   │   └── database.ts
    │   │   ├── features
    │   │   │   ├── orders
    │   │   │   └── users
    │   │   ├── index.ts
    │   │   ├── repositories
    │   │   │   └── base.repository.ts
    │   │   ├── scripts
    │   │   │   ├── run-migrations.ts
    │   │   │   └── seed.ts
    │   │   ├── test
    │   │   │   └── setup.ts
    │   │   └── utils
    │   │       └── validate-id-param.ts
    │   ├── tsconfig.json
    │   └── tsconfig.tsbuildinfo
    ├── service-b
    │   ├── package.json
    │   ├── src
    │   │   ├── app.ts
    │   │   ├── config
    │   │   │   └── database.ts
    │   │   ├── features
    │   │   │   ├── analytics
    │   │   │   └── sync
    │   │   ├── index.ts
    │   │   ├── scripts
    │   │   │   └── run-migrations.ts
    │   │   ├── services
    │   │   │   └── external.service.ts
    │   │   └── utils
    │   │       └── validate-userId-param.ts
    │   └── tsconfig.json
    └── shared-models
        ├── package.json
        ├── src
        │   ├── dtos
        │   │   ├── order.dto.ts
        │   │   └── user.dto.ts
        │   ├── entities
        │   │   ├── Order.entity.ts
        │   │   └── User.entity.ts
        │   ├── index.ts
        │   ├── migrations
        │   │   ├── 1640000000000-CreateUsers.ts.ts
        │   │   └── 1640000000001-CreateOrders.ts
        │   ├── types
        │   │   └── api.types.ts
        │   └── utils
        │       ├── database.ts
        │       └── version.ts
        └── tsconfig.json
```


- `shared-models`: Contains TypeORM entities, DTOs, migrations, and utilities shared across services.
- `service-a`: Handles core application logic (CRUD, validation, business rules) - a logistics app.
- `service-b`: Performs analytics and uses shared models for reporting and sync.

---

## ⚙️ Tech Stack

- **TypeScript** – full type safety across services
- **TypeORM** – database ORM
- **Express** – REST API framework
- **MySQL** – relational database (Docker)
- **Lerna** – monorepo management
- **Docker & Docker Compose** – service orchestration
- **Jest** – testing
- **GitHub Actions** – CI/CD pipeline

---

## 🚀 Setup Instructions

> Make sure you have `Node.js`, `npm`, and `Docker` installed.

### 1. Install all dependencies:

```bash
npm install
npm run setup
cd packages/service-a
docker-compose -f docker-compose.dev.yml up -d mysql

# start docker and make sure it is running
cd ../..
npm run migrate:service-a && migrate:service-b
npm run seed:service-a
npm run dev

# Verification
curl http://localhost:3001/health
curl http://localhost:3002/api/analytics/dashboard
```

## 📂 Environment Setup

Each service uses its own .env.local file:

Example for service-a:
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=service_a_db
SCHEMA_VERSION=1.2.0
´´´

## 🔐 Key Features

- Shared Library Pattern with semantic versioning

- Centralized migrations, decentralized execution

- Clean Architecture (controllers → services → repositories)

- Input validation via class-validator

- Token-based authentication middleware

- Connection pooling, caching, and health checks

- Inter-service communication with graceful error handling


## 🧠 Architecture Summary

- Shared models are defined once in @company/shared-models

- Each service installs the package and runs migrations independently

- Semantic versioning ensures backward compatibility

- Future-ready for Kafka, API Gateway, domain splitting, and more