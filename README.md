# PICT Smart CIE Evaluation Platform

A complete, production-ready MERN stack web application for managing **Continuous Internal Evaluation (CIE)** using rubric-based grading in engineering colleges.

## 🚀 Features

- **Role-Based Access** — Admin & Faculty roles with JWT authentication
- **Academic Structure** — Manage Academic Years → Classes → Subjects → Students
- **Rubric-Based Grading** — Create activities with customizable 1–5 scale rubrics
- **AG Grid Grading** — Interactive spreadsheet-style grading interface
- **Auto Scoring** — Automatic score calculation and final result computation (out of 15)
- **Excel Import/Export** — Bulk student import and results export via ExcelJS
- **PDF Reports** — Generate formatted PDF reports with PDFKit
- **AI-Powered Tools** — Rubric generation, guideline suggestions, student feedback, class insights, and NAAC/NBA report generation (OpenAI / Gemini compatible)
- **Activity Templates** — Reusable templates with default rubrics
- **Faculty Rubric Library** — Personal library of saved rubrics
- **Docker Deployment** — Full Docker Compose setup with MongoDB, Backend, and Nginx-served Frontend

## 📁 Project Structure

```
pict-cie-platform/
├── docker-compose.yml
├── nginx/default.conf
├── .env.example
├── backend/
│   ├── Dockerfile
│   ├── server.js
│   ├── config/          # env.js, db.js
│   ├── models/          # 14 Mongoose models
│   ├── middleware/       # auth, roleCheck, rateLimiter, errorHandler, upload
│   ├── controllers/     # 11 controllers
│   ├── routes/          # 11 route files
│   ├── services/        # aiService, scoringEngine, excelService, pdfService
│   └── utils/           # seed.js, helpers.js
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── vite.config.js
    └── src/
        ├── api/axios.js
        ├── context/AuthContext.jsx
        ├── layouts/MainLayout.jsx
        ├── components/  # Modal, RubricEditor
        └── pages/       # 13 pages
```

## 🛠️ Setup

### Prerequisites
- Node.js 20+
- MongoDB 7+ (or Docker)
- npm

### Local Development

1. **Clone & install**
   ```bash
   cd pict-cie-platform

   # Backend
   cd backend
   cp .env.example .env   # Edit .env with your values
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

2. **Seed admin user**
   ```bash
   cd backend
   node utils/seed.js
   ```

3. **Run**
   ```bash
   # Terminal 1 — Backend
   cd backend && npm run dev

   # Terminal 2 — Frontend
   cd frontend && npm run dev
   ```

4. Open http://localhost:3000

### Docker Deployment

```bash
cp .env.example .env  # Edit with production values
docker-compose up --build -d
```

App will be available at http://localhost

## 🔑 Default Credentials

| Role  | Email           | Password   |
|-------|-----------------|------------|
| Admin | admin@pict.edu  | Admin@123  |

*(Change immediately after first login)*

## 🤖 AI Configuration

Set in `backend/.env`:

```env
# For OpenAI
AI_PROVIDER=openai
AI_API_KEY=sk-...

# For Google Gemini (OpenAI-compatible endpoint)
AI_PROVIDER=gemini
AI_API_KEY=your-gemini-key
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_MODEL=gemini-2.0-flash
```

## 📝 API Endpoints

| Group          | Base Path              | Auth     |
|----------------|------------------------|----------|
| Auth           | `/api/auth`            | Public/JWT |
| Academic Years | `/api/academic-years`  | JWT      |
| Classes        | `/api/classes`         | JWT      |
| Subjects       | `/api/subjects`        | JWT      |
| Students       | `/api/students`        | JWT      |
| Activities     | `/api/activities`      | JWT      |
| Rubrics        | `/api/rubrics`         | JWT      |
| Scores         | `/api/scores`          | JWT      |
| Exports        | `/api/exports`         | JWT      |
| AI             | `/api/ai`              | JWT      |
| Admin          | `/api/admin`           | Admin    |

## 📄 License

MIT
