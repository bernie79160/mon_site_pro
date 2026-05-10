@echo off
setlocal

echo [INFO] Etat du serveur central

set "API=0"
set "WEB=0"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":3001 .*LISTENING"') do set "API=1"
for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":8080 .*LISTENING"') do set "WEB=1"

if "%API%"=="1" (echo [OK] API backend active (port 3001)) else (echo [WARN] API backend inactive (port 3001))
if "%WEB%"=="1" (echo [OK] Interface web active (port 8080)) else (echo [WARN] Interface web inactive (port 8080))

docker info >nul 2>&1
if errorlevel 1 (
  echo [WARN] Docker indisponible
) else (
  for /f %%i in ('docker inspect -f "{{.State.Status}}" mon_site_pro_postgres 2^>nul') do set "PGSTATE=%%i"
  if "%PGSTATE%"=="running" (
    echo [OK] PostgreSQL Docker actif
  ) else (
    if defined PGSTATE (echo [WARN] PostgreSQL Docker etat=%PGSTATE%) else (echo [WARN] Container PostgreSQL introuvable)
  )
)

for /f %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike '169.*' -and $_.IPAddress -ne '127.0.0.1'} | Select-Object -First 1 -ExpandProperty IPAddress)"') do set "LAN_IP=%%i"
if defined LAN_IP echo [INFO] URL eleves: http://%LAN_IP%:8080

echo [INFO] URL locale: http://localhost:8080

echo [INFO] API locale: http://localhost:3001
