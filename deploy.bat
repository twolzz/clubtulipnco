@echo off
setlocal enabledelayedexpansion

REM ============================================================
REM  deploy.bat — commit and push clubtulipnco-main to GitHub.
REM  Double-click this file (or run it from a terminal) whenever
REM  you want to save and publish your changes.
REM ============================================================

cd /d "%~dp0"

echo.
echo === Tulip and Co. — Main Site Deploy ===
echo.

REM --- Make sure this is actually a git repo folder ---
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
    echo ERROR: This folder is not a git repository.
    echo Make sure deploy.bat is sitting inside the clubtulipnco-main folder.
    echo.
    pause
    exit /b 1
)

REM --- Show current branch ---
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD') do set BRANCH=%%b
echo Current branch: %BRANCH%
if /i not "%BRANCH%"=="main" (
    echo.
    echo WARNING: You are not on the "main" branch.
    echo This script pushes whatever branch you're currently on.
    echo.
)

REM --- Show what changed ---
echo.
echo Checking for changes...
echo.
git status --short

git diff --quiet --exit-code
set HAS_UNSTAGED=%errorlevel%
git diff --cached --quiet --exit-code
set HAS_STAGED=%errorlevel%

if %HAS_UNSTAGED%==0 if %HAS_STAGED%==0 (
    echo.
    echo No changes detected. Nothing to commit or push.
    echo.
    pause
    exit /b 0
)

echo.
set /p COMMIT_MSG="Describe this update (used as the commit message): "

if "%COMMIT_MSG%"=="" (
    echo.
    echo No message entered — cancelled. Nothing was committed.
    echo.
    pause
    exit /b 1
)

echo.
echo Staging all changes...
git add -A

echo Committing...
git commit -m "%COMMIT_MSG%"
if errorlevel 1 (
    echo.
    echo ERROR: Commit failed. See the message above.
    echo.
    pause
    exit /b 1
)

echo.
echo Pushing to origin/%BRANCH%...
git push origin %BRANCH%
if errorlevel 1 (
    echo.
    echo ERROR: Push failed. Common causes:
    echo   - No internet connection
    echo   - Someone else pushed changes first ^(try: git pull^)
    echo   - GitHub credentials expired
    echo.
    pause
    exit /b 1
)

echo.
echo === Done! Pushed to origin/%BRANCH%. ===
echo Cloudflare Pages will pick this up and redeploy automatically.
echo.
pause
