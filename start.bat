@echo off
echo ====================================================
echo Starting Intelligent Product Support Assistant
echo ====================================================

echo [1/2] Launching Node.js Backend on http://localhost:5000...
start cmd /k "cd backend && npm start"

timeout /t 2 /nobreak >nul

echo [2/2] Launching React Frontend on http://localhost:5173...
start cmd /k "cd frontend && npm run dev"

echo.
echo Application is running!
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo ====================================================
