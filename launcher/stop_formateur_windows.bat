@echo off
setlocal

set "ROOT_DIR=%~dp0.."
for %%I in ("%ROOT_DIR%") do set "ROOT_DIR=%%~fI"
set "BACKEND_DIR=%ROOT_DIR%\backend"

echo [INFO] Arret des processus sur ports 3001 et 8080...
powershell -NoProfile -Command "$ports = 3001,8080; foreach ($p in $ports) { Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue } }"

echo [INFO] Arret PostgreSQL Docker...
pushd "%BACKEND_DIR%"
call docker compose stop postgres >nul 2>&1
popd

echo [INFO] ✅ Arret termine
exit /b 0
