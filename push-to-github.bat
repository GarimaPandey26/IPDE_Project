@echo off
title Push to GitHub
color 0a
echo ===================================================
echo             Pushing Project to GitHub...
echo ===================================================
echo.
echo This terminal will now push the code to your repository:
echo https://github.com/GarimaPandey26/IPDE_Project
echo.
echo If a GitHub popup window appears, please click "Sign in with your browser"
echo and authenticate. This allows you to securely upload the code.
echo.
echo Running: git push -u origin master
echo.
git push -u origin master
echo.
echo ===================================================
if %ERRORLEVEL% NEQ 0 (
    color 0c
    echo Push failed. Please make sure you have internet access and write permissions to the repository.
) else (
    echo Push completed successfully!
)
echo ===================================================
echo.
pause
