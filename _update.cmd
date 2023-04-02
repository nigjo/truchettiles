@echo off
setlocal
cd /D "%~dp0."

if exist fliesen.json call :scancurrent

set counter=5000
for /F "delims=*" %%S in ('dir /b/o:-d tiles\*.svg') do (
 set /a counter-=1
 if not defined names~%%~nS call :define %%S
)

rem set names~

echo [>fliesen.json
for /F "delims== tokens=2" %%T in ('set tile~') do call :add %%T >>fliesen.json
rem for /F "delims=*" %%S in ('dir /b/o:-d tiles\*.svg') do call :add %%S >>fliesen.json
echo ]>>fliesen.json

goto :eof
:add
echo %komma%"tiles/%~n1"
set komma=,

goto :eof
:define
REM set /a counter-=1
set num=0000%counter%
set tile~%num:~-4%=%~n1
set names~%~n1=%num:~-4%

goto :eof
:scancurrent
REM for /F %%D in (fliesen.json) do echo ##%%D##
set counter=5000
for /F delims^=^"^ tokens^=2 %%D in (fliesen.json) do (
 set /a counter+=1
 call :define %%D
)
