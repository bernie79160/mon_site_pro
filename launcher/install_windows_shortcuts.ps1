$ErrorActionPreference = 'Stop'

$rootDir = Split-Path -Parent $PSScriptRoot
$desktop = [Environment]::GetFolderPath('Desktop')
$wsh = New-Object -ComObject WScript.Shell

$startBat = Join-Path $PSScriptRoot 'start_formateur_windows.bat'
$stopBat = Join-Path $PSScriptRoot 'stop_formateur_windows.bat'

$startShortcut = Join-Path $desktop 'Mon Site Pro - Serveur central.lnk'
$stopShortcut = Join-Path $desktop 'Mon Site Pro - Arreter serveur.lnk'

$sc = $wsh.CreateShortcut($startShortcut)
$sc.TargetPath = $startBat
$sc.WorkingDirectory = $rootDir
$sc.IconLocation = 'shell32.dll,13'
$sc.Save()

$st = $wsh.CreateShortcut($stopShortcut)
$st.TargetPath = $stopBat
$st.WorkingDirectory = $rootDir
$st.IconLocation = 'shell32.dll,27'
$st.Save()

Write-Host "[INFO] Raccourcis crees:"
Write-Host "- $startShortcut"
Write-Host "- $stopShortcut"
