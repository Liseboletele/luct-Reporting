# LUCT Faculty Reporting System
### Mobile Device Programming — BIMP2210 | Assignment 2

A full-stack mobile application for LUCT (Limkokwing University of Creative Technology) faculty lecture reporting.

---

## 📁 Project Structure

```
luct-reporting/
├── backend/                     # Node.js Express API
│   ├── src/
│   │   ├── config/
│   │   │   └── firebase.js      # Firebase Admin SDK init
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── reportController.js
│   │   │   ├── classController.js
│   │   │   ├── attendanceController.js
│   │   │   ├── ratingController.js
│   │   │   └── userController.js
│   │   ├── middleware/
│   │   │   ├── auth.js          # JWT verify + role guard
│   │   │   ├── errorHandler.js
│   │   │   └── validate.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── reportRoutes.js
│   │   │   ├── classRoutes.js
│   │   │   ├── attendanceRoutes.js
│   │   │   ├── ratingRoutes.js
│   │   │   └── userRoutes.js
│   │   └── server.js            # Express entry point
│   ├── .env.example
│   └── package.json
│
└── frontend/                    # React Native (Expo)
    ├── src/
    │   ├── components/
    │   │   └── UI.js            # Reusable components
    │   ├── constants/
    │   │   └── theme.js         # Colors, sizes, fonts
    │   ├── context/
    │   │   └── AuthContext.js   # Global auth state
    │   ├── navigation/
    │   │   └── AppNavigator.js  # Role-based navigation
    │   ├── screens/
    │   │   ├── auth/
    │   │   │   ├── LoginScreen.js
    │   │   │   └── RegisterScreen.js
    │   │   ├── lecturer/
    │   │   │   └── CreateReportScreen.js
    │   │   └── shared/          # Role-aware shared screens
    │   │       ├── DashboardScreen.js
    │   │       ├── ReportsScreen.js
    │   │       ├── ReportDetailScreen.js
    │   │       ├── ClassesScreen.js
    │   │       ├── AttendanceScreen.js
    │   │       ├── RatingsScreen.js
    │   │       ├── MonitorScreen.js
    │   │       ├── UsersScreen.js
    │   │       └── ProfileScreen.js
    │   └── services/
    │       └── api.js           # Axios API service layer
    ├── App.js
    └── package.json
```

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native (Expo) |
| Backend | Node.js v22 + Express |
| Database | Firebase Firestore |
| Auth | JWT + Firebase |
| Excel Export | ExcelJS |
| Secure Storage | expo-secure-store |

---

## 👥 System Roles

| Role | Access |
|------|--------|
| **Student** | Monitor, Attendance, Ratings, Profile |
| **Lecturer** | Submit/Edit Reports, Classes, Attendance, Ratings |
| **Principal Lecturer** | View all faculty reports, Add feedback, Monitoring |
| **Program Leader** | Full access: Manage classes, Users, All reports |

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v22+
- Expo CLI (`npm install -g expo-cli`)
- Firebase project (Firestore + Authentication enabled)
- Android/iOS device or emulator

---

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable **Firestore Database** (in test mode for development)
4. Go to **Project Settings → Service Accounts**
5. Click **Generate new private key** → download JSON
6. Copy values into backend `.env`

---

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your Firebase credentials and JWT secret
npm install
npm run dev       # Development with nodemon
npm start         # Production
```

Backend runs on: `http://localhost:5000`

Health check: `http://localhost:5000/health`

---

### 3. Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit src/services/api.js — update BASE_URL to your machine's local IP
npm install
npx expo start
```

> **Important:** In `src/services/api.js`, change the IP in `BASE_URL` to your machine's local network IP (not localhost — the phone needs to reach your computer). Find it with `ipconfig` (Windows) or `ifconfig` (Mac/Linux).

---

## 📱 Features

### Data Entry (Lecturer Reporting Form)
All fields from the spec are implemented:
- Faculty Name, Class Name, Week of Reporting, Date of Lecture
- Course Name, Course Code, Lecturer's Name
- Actual Students Present, Total Registered Students (auto-filled from class)
- Venue, Scheduled Time, Topic Taught, Learning Outcomes, Recommendations

### Authentication
- Real registration — no hardcoded accounts
- Role-based access control (JWT)
- Secure token storage (expo-secure-store)
- Password change functionality

### Extra Credit ✅
- **Search functionality** on every module (Reports, Classes, Attendance, Ratings, Users)
- **Excel export** of reports (ExcelJS — styled with headers and filters)

---

## 🔗 API Endpoints

| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/profile` | All |
| PUT | `/api/auth/profile` | All |
| PUT | `/api/auth/change-password` | All |
| GET | `/api/reports` | All (filtered by role) |
| POST | `/api/reports` | Lecturer |
| PUT | `/api/reports/:id` | Lecturer (own) |
| POST | `/api/reports/:id/feedback` | PRL, PL |
| DELETE | `/api/reports/:id` | Lecturer (own) |
| GET | `/api/reports/export` | PRL, PL, Lecturer |
| GET/POST | `/api/classes` | All / PL, PRL |
| GET/POST | `/api/attendance` | All / Lecturer |
| GET/POST | `/api/ratings` | All |
| GET | `/api/users` | PRL, PL |
| GET | `/api/users/dashboard/stats` | All |

---

## 📊 Marking Criteria Coverage

| Criterion | Implementation |
|-----------|---------------|
| Frontend (40%) | React Native, Expo, role-based navigation, all screens |
| Backend (40%) | Node.js v22, Express REST API, Firebase Firestore |
| Code Quality (20%) | Clean folder structure, constants, reusable components, controllers |
| **Extra Credit** | Search on all modules + Excel export |

---

## 📬 Submission

1. Push to GitHub:
```bash
git init
git add .
git commit -m "BIMP2210 Assignment 2 - LUCT Reporting System"
git remote add origin https://github.com/YOUR_USERNAME/luct-reporting.git
git push -u origin main
```

2. Host backend on [Railway](https://railway.app), [Render](https://render.com), or [Heroku](https://heroku.com)
3. Submit GitHub link + hosted link to classroom
