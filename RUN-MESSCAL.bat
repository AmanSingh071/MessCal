@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Node.js 18+ is required. Install Node.js first.&pause&exit /b 1)
echo Installing/checking dependencies...
call npm install
if errorlevel 1 (echo npm install failed.&pause&exit /b 1)
echo.
echo Starting MessCal...
echo Open http://localhost:3000 in your browser.
echo Keep this window open.
echo.
call npm start
pause
