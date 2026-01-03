@echo off
cd /d "%~dp0"
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"
call "%~dp0gradlew.bat" assembleDebug
exit /b %errorlevel%
