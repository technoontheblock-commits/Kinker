@echo off
echo Git Konfiguration...

cd /d "%~dp0"

REM Git Konfiguration
git config user.email "info@kinker.ch"
git config user.name "KINKER Basel"

REM Initialisieren und Commit
git init
git add .
git commit -m "Initial commit: KINKER Basel website"

REM Remote und Push
git remote add origin https://github.com/technoontheblock-commits/Kinker.git
git branch -M main
git push -u origin main

pause
