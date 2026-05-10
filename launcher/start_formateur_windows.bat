@echo off
setlocal enabledelayedexpansion

set "ROOT_DIR=%~dp0.."
for %%I in ("%ROOT_DIR%") do set "ROOT_DIR=%%~fI"
set "BACKEND_DIR=%ROOT_DIR%\backend"

echo [INFO] Verification des prerequis...
where docker >nul 2>&1 || (echo [ERREUR] Docker non trouve.& exit /b 1)
where npm >nul 2>&1 || (echo [ERREUR] npm non trouve.& exit /b 1)
where node >nul 2>&1 || (echo [ERREUR] Node.js non trouve.& exit /b 1)
where python >nul 2>&1 || where python3 >nul 2>&1 || (echo [ERREUR] Python non trouve.& exit /b 1)

docker info >nul 2>&1 || (echo [ERREUR] Docker ne repond pas. Ouvrez Docker Desktop puis relancez.& exit /b 1)

if not exist "%BACKEND_DIR%\.env" (
  if exist "%BACKEND_DIR%\.env.example" (
    echo [INFO] Copie de .env.example vers .env
    copy "%BACKEND_DIR%\.env.example" "%BACKEND_DIR%\.env" >nul
  )
)

if not exist "%BACKEND_DIR%\node_modules" (
  echo [INFO] Installation des dependances backend...
  pushd "%BACKEND_DIR%"
  call npm install || (popd & echo [ERREUR] npm install backend a echoue.& exit /b 1)
  popd
)

echo [INFO] Demarrage PostgreSQL (Docker)...
pushd "%BACKEND_DIR%"
call docker compose up -d postgres || (popd & echo [ERREUR] Echec docker compose.& exit /b 1)

call npx prisma generate >nul 2>&1
call npx prisma migrate deploy >nul 2>&1
popd

set "API_RUNNING=0"
set "WEB_RUNNING=0"

for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":3001 .*LISTENING"') do (
  set "API_RUNNING=1"
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":8080 .*LISTENING"') do (
  set "WEB_RUNNING=1"
)

if "%API_RUNNING%"=="1" (
  echo [INFO] API deja active sur le port 3001.
) else (
  echo [INFO] Demarrage API Fastify...
  start "MonSitePro API" cmd /k "cd /d "%BACKEND_DIR%" && npm run start"
)

if "%WEB_RUNNING%"=="1" (
  echo [INFO] Interface web deja active sur le port 8080.
) else (
  echo [INFO] Demarrage interface web...
  start "MonSitePro Frontend" cmd /k "cd /d "%ROOT_DIR%" && python -m http.server 8080 --bind 0.0.0.0"
)

timeout /t 2 >nul

echo [INFO] Ouverture application...
start "" "http://localhost:8080"

echo [INFO] ✅ Serveur central demarre
for /f %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike '169.*' -and $_.IPAddress -ne '127.0.0.1'} | Select-Object -First 1 -ExpandProperty IPAddress)"') do set "LAN_IP=%%i"
if defined LAN_IP echo [INFO] URL eleves: http://%LAN_IP%:8080

echo [INFO] Pour arreter: launcher\stop_formateur_windows.bat
exit /b 0
