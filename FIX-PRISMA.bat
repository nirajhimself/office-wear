@echo off
setlocal
cd /d "%~dp0"
echo.
echo OFFICE WEAR - Prisma repair
 echo.
if not exist .env (
  echo [ERROR] .env is missing.
  echo Copy .env.example to .env and add DATABASE_URL first.
  pause
  exit /b 1
)
echo [1/3] Generating Prisma Client...
call npx prisma generate
if errorlevel 1 goto :fail
echo [2/3] Checking Prisma schema...
call npx prisma validate
if errorlevel 1 goto :fail
echo [3/3] Starting OFFICE WEAR...
call npm run dev
exit /b 0
:fail
echo.
echo Prisma repair failed. Copy the complete error above and send it to me.
pause
exit /b 1
