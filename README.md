# Order Management System (OMS)

A full-featured Order Management System designed for handling orders, clients, restaurant/cafe menus, and sales analytics. The project features a client-server architecture, containerization with Docker, interactive Swagger API documentation, and an automated integration test suite.

---

## 🛠 Tech Stack

- **Backend:**
  - **Runtime & Framework:** Node.js, Express
  - **Database & ORM:** MySQL 8.0, Sequelize ORM (SQLite in-memory for testing)
  - **Authentication:** JWT (JSON Web Tokens), bcrypt
  - **API Documentation:** Swagger UI (`swagger-ui-express`)
  - **Testing:** Jest, Supertest
- **Frontend:**
  - **Bundler & Dev Server:** Vite
  - **Core Technologies:** Vanilla JavaScript (ES Modules), HTML5, CSS3
- **DevOps & Tooling:**
  - Docker, Docker Compose

---

## 📁 Project Structure

```text
Order-management-system/
├── client/                 # Frontend client (Vite + Web Application)
│   ├── public/             # HTML pages and static assets
│   ├── src/                # Scripts, business logic, and UI modules
│   ├── package.json
│   └── vite.config.js      # Vite configuration (proxies /api to localhost:9000)
├── server/                 # Backend REST API (Node.js + Express)
│   ├── config/             # Environment configuration and app settings
│   ├── controllers/        # Request handlers / controllers
│   ├── docs/               # OpenAPI / Swagger specification
│   ├── middleware/         # Middleware (auth, validation, logging, errors)
│   ├── models/             # Sequelize models (User, Order, Dish, etc.)
│   ├── routes/             # API routes
│   ├── scripts/            # Database initialization and seed scripts (seed.js)
│   ├── services/           # Business logic services
│   ├── static/             # Uploaded files and media (dish images)
│   ├── tests/              # Jest integration and unit tests
│   ├── utils/              # Helper utilities (logger, parsers)
│   ├── Dockerfile          # Backend Dockerfile
│   ├── index.js            # Server entry point
│   └── package.json
├── docker-compose.yml      # Multi-container orchestration (MySQL + Backend)
└── README.md
```

---

## 🚀 Getting Started

### Option 1: Run with Docker Compose (Recommended)

The quickest way to start the application along with the MySQL database:

1. Ensure you have [Docker](https://www.docker.com/) and Docker Compose installed.
2. Build and start the containers:
   ```bash
   docker-compose up -d --build
   ```
3. Services will be available at:
   - **Backend API:** `http://localhost:9000`
   - **Swagger UI:** `http://localhost:9000/api-docs`
   - **MySQL:** port `3306`

---

### Option 2: Manual Local Setup

#### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- A running [MySQL](https://www.mysql.com/) server

#### 1. Backend Setup (`server`)

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```
4. Update the database credentials in `.env`:
   ```env
   PORT=9000
   DB_NAME=orders_system
   DB_USER=root
   DB_PASSWORD=admin
   DB_HOST=localhost
   DB_PORT=3306
   SECRET_KEY=your_super_secret_jwt_key_here
   ```
5. *(Optional)* Seed initial test data into the database:
   ```bash
   npm run seed
   ```
6. Start the server:
   ```bash
   # Development mode with watch:
   npm run dev

   # Or standard start:
   npm start
   ```

#### 2. Frontend Setup (`client`)

1. Open a new terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and visit:
   ```
   http://localhost:3000
   ```

---

## 📖 API Documentation (Swagger)

Once the backend is running, the interactive OpenAPI / Swagger documentation is accessible at:
- **URL:** [http://localhost:9000/api-docs](http://localhost:9000/api-docs)

The Swagger UI provides documentation for all endpoints, schemas, authorization requirements, and an interactive interface to test API requests.

---

## 🧪 Testing

The backend includes automated integration and unit tests built with **Jest** and **Supertest**. Tests run against an isolated in-memory SQLite database, ensuring test runs do not alter your primary MySQL database.

To execute the test suite:
```bash
cd server
npm test
```

---

## 🔐 Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Backend server port | `9000` |
| `DB_NAME` | MySQL database name | `orders_system` |
| `DB_USER` | MySQL database user | `root` |
| `DB_PASSWORD` | MySQL database password | `admin` |
| `DB_HOST` | Database host | `localhost` (or `db` in Docker) |
| `DB_PORT` | Database port | `3306` |
| `SECRET_KEY` | Secret key used for signing JWT tokens | - |
| `CLIENT_URL` | Allowed origins for CORS | `http://localhost:3000,http://localhost:5500` |
