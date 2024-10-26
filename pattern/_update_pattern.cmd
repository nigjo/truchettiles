@echo off
setlocal

cd /D "%~dp0.."
if exist pattern.json call :scanCurrent

for %%P in (pattern\*.json) do if not defined pattern_%%~nxP (
  call :addPattern %%P
)

set first=
(
echo([
for /F "tokens=2 delims==" %%P in ('set pattern~') do (
  if defined first (
    echo(,"pattern/%%~nxP"
  ) else (
    set first=1
    echo( "pattern/%%~nxP"
  )
)
echo(]
)>pattern.json

REM set pattern~
REM set pattern_
REM echo %maxnum%

goto :eof
:addPattern
set /a maxnum+=40
call :setPattern %maxnum% %1
echo ** %1:  "position": %maxnum%,

goto :eof
:scanCurrent
set maxnum=0
for /F "delims=, " %%F in (pattern.json) do (
  if exist "pattern\%%~nxF" (
    REM echo ## %%~F:
    REM findstr /L "position" "pattern\%%~F"
    for /F "tokens=2 delims=:, " %%P in ('findstr /L "position" "pattern\%%~nxF"') do (
      call :setPattern %%P "pattern\%%~nxF"
    )
  )
)
goto :eof
:setPattern
set "pos=0000%1"
REM echo "pattern~%pos:~-4%=%~2"
set "pattern~%pos:~-4%=%~nx2"
set "pattern_%~nx2=%1"
if %1 GTR %maxnum% set maxnum=%1