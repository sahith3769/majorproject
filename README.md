# 🚀 MRU CSE Placement Portal

This is a **production-ready** Corporate Placement Portal built with the **MERN stack** (MongoDB, Express, React, Node.js) and a powerful **Python Flask ML Service** for job recommendations.

It features a **Classic Official Theme**, role-based access control (Student, Company, Admin), and AI-driven job matching.

## ✨ Key Features
- **Official Interface**: Professional design with "Classic Official" styling and smooth micro-animations.
- **AI Recommendations**: Python-based skill matching to suggest the best jobs for students.
- **Role-Based Dashboards**:
  - **Students**: Upload resumes, view AI matches, track applications.
  - **Companies**: Post jobs, review applicants, manage hiring status.
  - **Admins**: Approve companies and jobs, monitor system-wide stats.
- **Secure Auth**: JWT authentication, OTP code verification, and Admin Account Approval.
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
