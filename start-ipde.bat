@echo off
title Start IPDE Project
color 0b
echo ===================================================
echo             Starting IPDE Project...
echo ===================================================
echo.

echo Starting Backend Server on port 5000...
start "IPDE Backend Server" cmd /k "npm run dev --prefix backend"

echo Starting Frontend Server on port 3000...
start "IPDE Frontend Server" cmd /k "npm run dev --prefix frontend"

echo.
echo Starting Localtunnel to expose the Frontend on a live link...
echo The live link will be printed in the new terminal window.
echo.
echo ***************************************************
echo IMPORTANT: When opening the live link:
echo 1. It may ask for a password (your public IP address).
echo 2. To find your public IP address, visit: https://ipv4.icanhazip.com
echo 3. Paste that IP address into the localtunnel page to access the app.
echo ***************************************************
echo.

start "IPDE Localtunnel" cmd /k "npx localtunnel --port 3000"

echo.
echo All processes started! 
echo Keep the new terminal windows open while you are using the app.
echo You can close this window now.
echo.
pause
