# 🔍 FindMe — Missing Persons AI System v2.0

A full-featured, web-based system to help reunite missing persons with their families.
Built with FastAPI + React, featuring AI face recognition, role-based access control, and a complete admin panel.

![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-2.0-009688?logo=fastapi)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Arch Linux](https://img.shields.io/badge/OS-Arch%20Linux-1793D1?logo=arch-linux)

---

## ✨ Features (v2.0)

| # | Feature | Description |
|---|---------|-------------|
| P.3.1 | **Auth & User Management** | Register/login with hashed passwords, session tokens (7-day expiry), JWT-style Bearer auth |
| P.3.2 / P.4.2 | **Submission Form** | Upload photo + detailed fields (age, height, national code, location, contact info) — requires login |
| P.3.3 / P.4.3 | **Search & Filtering** | Metadata filters (name, status, age range, location, national code) + AI face-match endpoint |
| P.4.1 | **Showcase / Display** | Paginated card grid with status filter, full detail pages, click-to-expand |
| P.3.4 | **Admin Control Panel** | Stats dashboard, pending approval queue, approve/reject reports, user management |
| P.2.4 / P.5.2 | **Security (RBAC)** | Role-based access (user/admin), SHA-256 hashing, random image filenames, temp file cleanup |
| P.6.2 | **Documentation** | In-app docs page (user guide + admin guide + API reference + security architecture) |

---

## 🛠️ Tech Stack

**Backend:** Python 3.11 · FastAPI · SQLAlchemy (SQLite) · DeepFace (VGG-Face) · Uvicorn  
**Frontend:** React 19 (Vite) · CSS3 Glassmorphism · RTL Layout · Fetch API

---

## 🚀 Running Locally

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
TF_CPP_MIN_LOG_LEVEL=3 uvicorn main:app --reload
```

Backend runs at: `http://127.0.0.1:8000`  
Swagger UI:      `http://127.0.0.1:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

---

## 🔐 Default Admin Credentials

| Field    | Value       |
|----------|-------------|
| Username | `admin`     |
| Password | `admin1234` |

> ⚠️ Change the default password immediately in production.

---

## 📁 Project Structure

```
missing-persons-ai/
├── backend/
│   ├── main.py              # FastAPI app: Auth, RBAC, Persons, Admin endpoints
│   ├── requirements.txt
│   └── images/              # Uploaded images (gitignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Root router with Navbar
│   │   ├── App.css          # Global styles (glassmorphism + RTL)
│   │   ├── AuthContext.jsx  # Auth state (login/register/logout)
│   │   ├── api.js           # Central API helper
│   │   └── pages/
│   │       ├── HomePage.jsx     # Landing page with stats
│   │       ├── AuthPage.jsx     # Login & Registration (P.3.1)
│   │       ├── SubmitPage.jsx   # Report submission form (P.3.2)
│   │       ├── ShowcasePage.jsx # Grid display of all cases (P.4.1)
│   │       ├── DetailPage.jsx   # Full detail view of a case
│   │       ├── SearchPage.jsx   # Metadata + AI face search (P.3.3)
│   │       ├── AdminPage.jsx    # Admin control panel (P.3.4)
│   │       └── DocsPage.jsx     # User & tech documentation (P.6.2)
│   └── package.json
└── README.md
```

---

## 🔒 Security Architecture

- **Passwords:** SHA-256 hashed before storage
- **Sessions:** 256-bit random tokens, 7-day TTL, stored in DB
- **RBAC:** Two roles — `user` (submit + search) and `admin` (full access)
- **File Safety:** Random hex filenames prevent path guessing; temp files deleted immediately
- **Approval Flow:** All submissions are held pending until an admin approves them

---

## 📜 AI Tools Disclosure

1. **Core Feature:** DeepFace (VGG-Face) for facial embedding & similarity matching  
2. **Development:** Claude Sonnet (Anthropic) for code generation and architecture design

---

## 📜 License

MIT — open-source, built to help communities.
