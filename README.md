# 🌟 Vertrowd Academics — Student & Teacher Management System

Vertrowd Academics is a modern, premium, full-stack Academic Management & Productivity Portal. Built using React, Node.js, Express, and MongoDB, the system features role-based routing, real-time analytics, a complete student grading system, class attendance logs, sticky notes, a study focus timer, and a persisted dark/light theme switch.

---

## 🚀 Key Features

### 🔐 Authentication & Role-Based Access
* **Role Separation**: Tailored dashboards for **Students** and **Teachers/Admins**.
* **Secure JWT Sessions**: Cryptographic JSON Web Tokens (JWT) for secure session persistence.
* **Bcrypt Password Hashing**: Zero-plaintext password storage in MongoDB.

### 🎓 Student Dashboard
* **Academic Marks**: Real-time access to subject-wise scores, codes, and letter grades.
* **Attendance Analytics**: Visually tracking cumulative attendance percentages and individual logs.
* **Task Planner**: Categorized TODO planner with priority markers (`High`, `Medium`, `Low`) and due dates.
* **Pomodoro Focus Timer**: Dedicated focus tracker with customizable sessions logging time directly to the database.
* **Sticky Notes**: Color-coded, draggable-style digital journal note boards for instant study tracking.
* **Class Notices**: Real-time read-only access to notices pushed by the teaching staff.

### 🏫 Teacher & Admin Dashboard
* **Overview Analytics**: Instant insights on student count, performance metrics, and general notices.
* **Student Roster (CRUD)**: Complete portal to register new students, edit profiles (safe from bcrypt hash duplication issues), and delete inactive student accounts.
* **Grading Portal**: Add, edit, or delete grades and marks for any registered student. Letters grades (`A`, `B`, `C`, `D`, `F`) are calculated automatically.
* **Batch Attendance Logging**: Mark present/absent logs for multiple students simultaneously on any calendar date.
* **Notice Management**: Draft, schedule, and delete class announcements targeting specific roles or all users.

### 🌓 Theme Customization
* Smooth **Dark/Light Mode** toggle sitting in the navigation bar.
* Implemented using React `ThemeContext` and CSS custom variables mapped to `document.documentElement`.
* Remembers user preference across sessions via `localStorage` integration.

---

## 🛠️ Technology Stack

| Tier | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19 | Single Page Application framework |
| | Vite 8 | Ultra-fast frontend build tooling |
| | React Router v7 | Declarative routing & Private route protection |
| | Axios | HTTP client for consuming API endpoints |
| | Lucide React | Modern, unified SVG iconography |
| **Backend** | Node.js / Express | Fast, unopinionated REST API service |
| **Database** | MongoDB | Document-oriented NoSQL database |
| | Mongoose | Elegant object-relational mapping (ORM) for schema modeling |
| **Auth & Security** | JWT / BcryptJS | JWT signature verification & password salting/hashing |

---

## 📂 Project Structure

```
Student-management/
├── backend/                  # Express REST API Server
│   ├── config/               # DB Connection setup
│   ├── middleware/           # Auth validation (protect, authorize)
│   ├── models/               # Mongoose Schemas (User, Student, Notice, Task, Note, FocusSession)
│   ├── routes/               # API Router Handlers
│   ├── server.js             # Express application Entrypoint
│   └── .env                  # Backend environment secrets configuration
│
└── frontend/                 # React & Vite client app
    ├── public/               # Static assets & icons
    ├── src/
    │   ├── components/       # Dashboards & router guards
    │   ├── context/          # State providers (AuthContext, ThemeContext)
    │   ├── pages/            # Login, Registration, and Main Dashboard pages
    │   ├── utils/            # Helper utilities
    │   ├── App.css           # Global core layout styles (with Theme Variables)
    │   ├── App.jsx           # Root routes configuration
    │   └── main.jsx          # Vite React entry mount
```

---

## ⚙️ Installation & Setup

### Prerequisites
* **Node.js** (v18.x or higher recommended)
* **MongoDB** (Local instance or MongoDB Atlas cluster connection string)

### 1. Configure the Backend
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the `backend` directory:
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=7d
   ```
4. Launch the development server:
   ```bash
   npm run dev
   ```
   *The backend server will run on `http://localhost:5000`.*

### 2. Configure the Frontend
1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Boot the Vite development client:
   ```bash
   npm run dev
   ```
   *The frontend client will run on `http://localhost:5173`.*

---

## 📡 API Endpoints Documentation

All endpoints are prefixed with `/api`.

### 🔑 Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Registers a new user (default role: `student`) |
| `POST` | `/auth/login` | Public | Validates credentials and returns JWT token |
| `GET` | `/auth/me` | Private | Retrieves current logged-in user details |

### 🎓 Students (`/api/students`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/students/profile` | Student | Fetches current logged-in student's complete profile |
| `PUT` | `/students/profile` | Student | Updates student contact information |
| `GET` | `/students/marks` | Student | Fetches subject marks list |
| `GET` | `/students/attendance` | Student | Fetches student attendance history and percentage stats |
| `GET` | `/students` | Teacher/Admin | Retrieves all student profiles with user associations |
| `POST` | `/students/:id/marks` | Teacher/Admin | Adds or updates academic marks for a student ID |
| `DELETE` | `/students/:id/marks/:code` | Teacher/Admin | Removes specific subject grading using subject code |
| `POST` | `/students/:id/attendance` | Teacher/Admin | Logs/updates attendance for a single student on a date |
| `POST` | `/students/attendance/batch` | Teacher/Admin | Batch updates attendance records for the class |
| `PUT` | `/students/admin/:id` | Teacher/Admin | Edits profile data (name, email, roll number, grades, class details) |
| `DELETE` | `/students/admin/:id` | Teacher/Admin | Deletes a student profile and their matching login credential record |

### 📋 Notices (`/api/notices`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/notices` | Private | Fetches notices matching current user's role |
| `POST` | `/notices` | Teacher/Admin | Creates and publishes a new announcement |
| `DELETE` | `/notices/:id` | Teacher/Admin | Removes an announcement |

### ⚡ Productivity Tooling (`/api/productivity`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/productivity/tasks` | Private | Get active task board cards |
| `POST` | `/productivity/tasks` | Private | Create a new task card |
| `PUT` | `/productivity/tasks/:id` | Private | Update task completion status/due dates |
| `DELETE` | `/productivity/tasks/:id` | Private | Remove a task |
| `GET` | `/productivity/notes` | Private | Get sticky study notes |
| `POST` | `/productivity/notes` | Private | Post a color-coded sticky note |
| `PUT` | `/productivity/notes/:id` | Private | Edit sticky note text or color |
| `DELETE` | `/productivity/notes/:id` | Private | Remove a sticky note |
| `GET` | `/productivity/focus` | Private | Retrieve Pomodoro history and accumulated minutes |
| `POST` | `/productivity/focus` | Private | Log a completed focus session duration |

---

## 🎨 Theme Customization & Design System
The frontend UI incorporates modern glassmorphism features with customized layouts. Theme colors are configured dynamically in [App.css](file:///c:/Users/rudra/OneDrive/Desktop/uptoskill/Student-management/frontend/src/App.css) using CSS Custom Properties:

```css
/* Theme variables snippet */
:root[data-theme="dark"] {
  --bg-primary: #0a0e17;
  --bg-secondary: #161f30;
  --bg-glass: rgba(22, 31, 48, 0.7);
  --border-glass: rgba(255, 255, 255, 0.08);
  --text-primary: #ffffff;
  --text-secondary: #94a3b8;
  --accent-color: #6366f1;
}

:root[data-theme="light"] {
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-glass: rgba(255, 255, 255, 0.75);
  --border-glass: rgba(0, 0, 0, 0.06);
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --accent-color: #4f46e5;
}
```

Whenever the toggle button is clicked, React calls `toggleTheme()` from the custom hook `useTheme()`, which switches the `data-theme` attribute on the `<html>` root, instantly cascading design variables globally.

---

## 🔒 License
This project is licensed under the MIT License.
