@echo off
echo FFmpeg Simple Installation Script
echo ==================================
echo.

REM Check if running as administrator
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running as Administrator - Good!
) else (
    echo WARNING: Not running as Administrator
    echo Some operations may fail
    echo.
)

echo Checking for existing FFmpeg installation...
ffmpeg -version >nul 2>&1
if %errorLevel% == 0 (
    echo FFmpeg is already installed!
    ffmpeg -version
    pause
    exit /b 0
)

echo FFmpeg not found. Starting installation...
echo.

REM Create FFmpeg directory
if not exist "C:\ffmpeg" mkdir "C:\ffmpeg"
if not exist "C:\ffmpeg\bin" mkdir "C:\ffmpeg\bin"

echo Downloading FFmpeg...
echo This may take a few minutes...
echo.

REM Download using PowerShell (available on all modern Windows)
powershell -Command "& {[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip' -OutFile '%TEMP%\ffmpeg.zip'}"

if exist "%TEMP%\ffmpeg.zip" (
    echo Download completed! Extracting...
    
    REM Extract using PowerShell
    powershell -Command "& {Expand-Archive -Path '%TEMP%\ffmpeg.zip' -DestinationPath 'C:\ffmpeg' -Force}"
    
    REM Find and move the executable
    for /d %%i in (C:\ffmpeg\ffmpeg-*) do (
        if exist "%%i\bin\ffmpeg.exe" (
            copy "%%i\bin\*" "C:\ffmpeg\bin\" >nul
            rmdir /s /q "%%i"
        )
    )
    
    REM Clean up
    del "%TEMP%\ffmpeg.zip" >nul 2>&1
    
    echo Extraction completed!
) else (
    echo Download failed. Please check your internet connection.
    pause
    exit /b 1
)

REM Add to PATH
echo Adding FFmpeg to system PATH...
setx PATH "%PATH%;C:\ffmpeg\bin" /M >nul 2>&1
if %errorLevel% == 0 (
    echo Added to system PATH successfully!
) else (
    echo Could not add to system PATH automatically.
    echo Please add C:\ffmpeg\bin to your PATH manually.
)

REM Test installation
echo.
echo Testing FFmpeg installation...
"C:\ffmpeg\bin\ffmpeg.exe" -version >nul 2>&1
if %errorLevel% == 0 (
    echo.
    echo SUCCESS! FFmpeg is installed and working!
    echo.
    "C:\ffmpeg\bin\ffmpeg.exe" -version | findstr "ffmpeg version"
    echo.
    echo Next steps:
    echo 1. Restart your backend server
    echo 2. Refresh your video editor
    echo 3. Look for "Full Video Features Available"
    echo.
) else (
    echo Installation completed but FFmpeg test failed.
    echo Please restart your command prompt and try: ffmpeg -version
    echo.
)

echo Installation script completed!
pause