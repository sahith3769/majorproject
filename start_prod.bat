@echo off
echo ===================================================
echo   SMART PLACEMENT PORTAL - Production Mode
echo ===================================================
echo.
echo Step 1: Building Frontend...
cd client
call npm install
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo Frontend build failed!
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo Step 2: Preparing Backend...
cd server
if not exist node_modules (
    call npm install
)

echo.
echo Step 3: Launching Production Server...
echo (Serving frontend from client/build)
set NODE_ENV=production
node server.js
pause
