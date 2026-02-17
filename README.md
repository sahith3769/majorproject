# 🚀 Smart Placement Portal (Next-Gen Edition)

This is a **production-ready** Smart Placement Portal built with the **MERN stack** (MongoDB, Express, React, Node.js) and a powerful **Python Flask ML Service** for job recommendations.

It features a **Premium Glassmorphic UI**, role-based access control (Student, Company, Admin), and AI-driven job matching.

## ✨ Key Features
- **Modern UI/UX**: Custom "Aurora" dark theme with glassmorphism and smooth animations.
- **AI Recommendations**: Python-based collaborative filtering to match students with jobs based on skills.
- **Role-Based Dashboards**:
  - **Students**: View recommendations, track applications, update profile.
  - **Companies**: Post jobs, view applicants, manage hiring pipeline.
  - **Admins**: Overview of system activity and stats.
- **Secure Auth**: JWT authentication, OTP verification, and role protection.
- **No Docker Required**: Simplified local setup for rapid development.

## 🛠 Prerequisites
1.  **Node.js** (v18+)
2.  **Python** (v3.9+)
3.  **MongoDB** (Must be installed and running locally on port 27017)

## 🚀 Quick Start (Windows)
**Development Mode:**
Double-click `start_app.bat` to launch Dev Server (React Hot Reload + Nodemon).

**Production Mode (Deployment Simulation):**
Double-click `start_prod.bat`. This will:
1. Build the React frontend for production.
2. Launch the Node.js server to serve the optimized build.
3. Simulate a real-world deployment on `http://localhost:5000`.

---

## 📦 Deployment Ready
This application is structured for easy deployment:
- **Frontend**: Can be built via `npm run build` and served via Nginx/Netlify.
- **Backend**: Standard Node.js app, ready for Heroku/Render.
- **ML Service**: Flask app, can be deployed as a microservice (e.g., on Render/PythonAnywhere).

## 🔧 Manual Startup Instructions

If you prefer to run each service manually, follow these steps in separate terminals:

### 1. Database
Ensure your local MongoDB instance is running.
```bash
# Verify MongoDB is running
mongod --version
```

### 2. ML Service (Python/Flask)
Runs on `http://localhost:5001`
```bash
cd ml-service
pip install -r requirements.txt
python app.py
```

### 3. Backend Server (Node.js/Express)
Runs on `http://localhost:5000`
```bash
cd server
npm install
npm run dev
```

### 4. Frontend Client (React)
Runs on `http://localhost:3000`
```bash
cd client
npm install
npm start
```

## ⚙️ Configuration
The application uses `.env` files for configuration.
- **Server**: `.env` manages DB URI, JWT Secret, and Email credentials.
- **Client**: `.env` manages API endpoints.
