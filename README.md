<div align="center">
  <h1>🚀 Smart Placement Portal</h1>
  <p>An AI-driven campus recruitment and placement management system.</p>
  
  ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
  ![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
  ![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
  ![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
  ![HuggingFace](https://img.shields.io/badge/%F0%9F%A4%97_Hugging_Face-Spaces-FFD21E?style=for-the-badge)
</div>

<br />

## 📖 Overview
The **Smart Placement Portal** revolutionizes the college recruitment process by bridging the gap between Students, College Administrators, and Corporate Recruiters. Leveraging Natural Language Processing (NLP) and Machine Learning, the system automatically parses student resumes, extracts skills, and intelligently matches them against job opportunities using Cosine Similarity.

Packed with industry-standard features—including secure JWT Refresh Token rotation via HTTP-Only cookies, Role-Based Access Control (RBAC), and automated email notifications—this portal is built for scale, security, and exceptional user experience.

---

## ✨ Core Features

### 👩‍🎓 For Students
- **AI Resume Parsing**: Upload your PDF/Docx resume. Our integrated Python ML Service automatically extracts complex skills using NLP.
- **Intelligent Job Recommendations**: Discover the jobs you are a perfect fit for. Our ML engine calculates your **Skill Match Score** against required job skills.
- **One-Click Applications**: Instantly apply to active job postings and track your real-time application status (Accepted, Rejected, Pending).

### 🏢 For Companies
- **Streamlined Recruitment**: Post job opportunities with exact skill, salary, and experience requirements.
- **Applicant Tracking**: View a unified dashboard of all applicants. Download student CVs and seamlessly Accept or Reject candidates.

### 🛡️ For Administrators
- **System Control**: Act as the ultimate gatekeeper. Approve new Company accounts before they can interact with students.
- **Job Vetting**: Review and securely approve Job Postings to ensure authenticity and quality control.

### 🔐 Enterprise Security
- **Dual JWT Authentication**: Short-lived (15m) access tokens matched with long-lived (7d) refresh tokens.
- **XSS Protection**: Refresh tokens are stored strictly in backend HTTP-Only Cookies.
- **Seamless Token Rotation**: Frontend Axios interceptors automatically silently renew expired tokens.

---

## 🛠️ Technology Stack

| Architecture Layer | Technologies Used |
| :--- | :--- |
| **Frontend Platform** | React.js, React Router, Axios, Custom CSS Modules, Toastify |
| **Backend API Gateway** | Node.js, Express.js, Mongoose, JSON Web Tokens, Nodemailer |
| **Database** | MongoDB Atlas (NoSQL) |
| **Machine Learning Microservice** | Python, Flask, Scikit-Learn (TF-IDF, Cosine Similarity), PDFMiner |
| **Cloud Hosting** | **Render** (Node/React), **Hugging Face Spaces** (Python ML) |

---

## 🚀 Live Demo Deployments

- **Web Application (React + Node.js)**  
  [https://cseplacement.onrender.com](https://cseplacement.onrender.com)
- **AI Analytics Service (Hugging Face Spaces)**  
  [https://cseplacement7-smart-placement-ml.hf.space](https://cseplacement7-smart-placement-ml.hf.space)

---

## 💻 Local Development Setup

To run this incredible project locally, you will need to start both the Node.js Server and the Python ML Service, alongside the React Frontend.

### 1. Requirements
Ensure you have installed:
- [Node.js](https://nodejs.org/) (v16+)
- [Python](https://www.python.org/downloads/) (3.9+)
- [MongoDB Atlas Account](https://www.mongodb.com/cloud/atlas) or Local MongoDB URI

### 2. Environment Variables
Create `.env` files in both `/server` and `/ml-service`.

**`server/.env`**
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=super_secret_jwt_key
REFRESH_TOKEN_SECRET=super_secret_refresh_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
ML_SERVICE_URL=http://localhost:5001 # OR the Hugging Face Deployment URL
NODE_ENV=development
```

**`ml-service/.env`** (Optional, only if adapting ML models)
```env
PORT=5001
```

### 3. Installation & Run Instructions

**Open 3 separate terminal instances:**

**Terminal 1: Node.js Backend Server**
```bash
cd server
npm install
npm run dev
```

**Terminal 2: Python ML Microservice**
```bash
cd ml-service
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python app.py
```

**Terminal 3: React Frontend Webpack**
```bash
cd client
npm install
npm start
```

The React Application will now be running on `http://localhost:3000`.

---
*Built with ❤️ for Modern Campus Recruitment.*
