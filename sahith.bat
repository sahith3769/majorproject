@echo off
echo ===================================================
echo Starting Smart Placement Portal (Local MERN Stack)
echo ===================================================

echo.
echo 1. Starting MongoDB (Ensure it is installed and running!)
echo    If MongoDB is not running, this might fail.
echo.

echo 2. Installing and Starting ML Service (Python)...
start "ML Service" cmd /k "cd ml-service && pip install -r requirements.txt && python app.py"

echo 3. Installing and Starting Backend Server (Node.js)...
start "Backend Server" cmd /k "cd server && npm install && npm run dev"

echo 4. Installing and Starting Client (React)...
start "Client Frontend" cmd /k "cd client && npm install && npm start"

echo.
echo All services are launching in separate windows.
echo - Backend: http://localhost:5000
echo - ML Service: http://localhost:5001
echo - Frontend: http://localhost:3000
echo.
pause
