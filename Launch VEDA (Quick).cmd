@echo off
title VEDA - AI Scientist Platform [Quick Launch]

:: Quick launch - assumes dependencies are already installed
echo Starting VEDA Desktop...

cd /d "%~dp0electron"
call npm start
cd /d "%~dp0"
