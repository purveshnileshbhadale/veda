@echo off
cd /d "C:\Users\PURVESH\OneDrive\Desktop\VEDA\frontend"
echo Starting frontend at %DATE% %TIME% > "%TEMP%\veda-frontend-test.log"
npm run dev >> "%TEMP%\veda-frontend-test.log" 2>&1
