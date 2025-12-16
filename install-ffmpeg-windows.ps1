# FFmpeg Installation Script for Windows
# Run this script in PowerShell as Administrator

Write-Host "FFmpeg Installation Script for Video Creator" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Checking for existing FFmpeg installation..." -ForegroundColor Yellow

# Check if FFmpeg is already installed
try {
    $ffmpegVersion = & ffmpeg -version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "FFmpeg is already installed!" -ForegroundColor Green
        Write-Host "Version: $($ffmpegVersion[0])" -ForegroundColor Cyan
        Read-Host "Press Enter to exit"
        exit 0
    }
} catch {
    Write-Host "FFmpeg not found. Proceeding with installation..." -ForegroundColor Yellow
}

# Method 1: Try Chocolatey installation
Write-Host "`nMethod 1: Installing via Chocolatey..." -ForegroundColor Cyan

try {
    # Check if Chocolatey is installed
    $chocoVersion = & choco --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Chocolatey found. Installing FFmpeg..." -ForegroundColor Green
        & choco install ffmpeg -y
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "FFmpeg installed successfully via Chocolatey!" -ForegroundColor Green
            Write-Host "Please restart your backend server to enable video features." -ForegroundColor Yellow
            Read-Host "Press Enter to exit"
            exit 0
        }
    } else {
        Write-Host "Chocolatey not found. Installing Chocolatey first..." -ForegroundColor Yellow
        
        # Install Chocolatey
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Refresh environment variables
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        Write-Host "Chocolatey installed. Now installing FFmpeg..." -ForegroundColor Green
        & choco install ffmpeg -y
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "FFmpeg installed successfully!" -ForegroundColor Green
            Write-Host "Please restart your backend server to enable video features." -ForegroundColor Yellow
            Read-Host "Press Enter to exit"
            exit 0
        }
    }
} catch {
    Write-Host "Chocolatey installation failed. Trying manual method..." -ForegroundColor Yellow
}

# Method 2: Manual installation
Write-Host "`nMethod 2: Manual installation..." -ForegroundColor Cyan

$ffmpegDir = "C:\ffmpeg"
$ffmpegBin = "$ffmpegDir\bin"

# Create directory
if (-not (Test-Path $ffmpegDir)) {
    New-Item -ItemType Directory -Path $ffmpegDir -Force | Out-Null
    Write-Host "Created directory: $ffmpegDir" -ForegroundColor Green
}

Write-Host "Downloading FFmpeg..." -ForegroundColor Yellow
Write-Host "This may take a few minutes depending on your internet connection." -ForegroundColor Gray

try {
    # Download FFmpeg (using a reliable build)
    $downloadUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
    $zipPath = "$env:TEMP\ffmpeg.zip"
    
    # Download with progress
    $webClient = New-Object System.Net.WebClient
    $webClient.DownloadFile($downloadUrl, $zipPath)
    
    Write-Host "Download completed. Extracting..." -ForegroundColor Green
    
    # Extract
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $ffmpegDir)
    
    # Find the extracted folder and move contents
    $extractedFolder = Get-ChildItem -Path $ffmpegDir -Directory | Where-Object { $_.Name -like "*ffmpeg*" } | Select-Object -First 1
    if ($extractedFolder) {
        # Move contents to main ffmpeg directory
        Get-ChildItem -Path $extractedFolder.FullName -Recurse | Move-Item -Destination $ffmpegDir -Force
        Remove-Item -Path $extractedFolder.FullName -Recurse -Force
    }
    
    # Clean up
    Remove-Item -Path $zipPath -Force
    
    Write-Host "FFmpeg extracted successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "Download failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please download manually from: https://www.gyan.dev/ffmpeg/builds/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Add to PATH
Write-Host "Adding FFmpeg to system PATH..." -ForegroundColor Yellow

try {
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
    if ($currentPath -notlike "*$ffmpegBin*") {
        $newPath = "$currentPath;$ffmpegBin"
        [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
        Write-Host "FFmpeg added to system PATH!" -ForegroundColor Green
    } else {
        Write-Host "FFmpeg already in PATH!" -ForegroundColor Green
    }
} catch {
    Write-Host "Failed to add to PATH. Please add manually:" -ForegroundColor Red
    Write-Host "1. Open System Properties > Advanced > Environment Variables" -ForegroundColor Yellow
    Write-Host "2. Edit the PATH variable and add: $ffmpegBin" -ForegroundColor Yellow
}

# Verify installation
Write-Host "`nVerifying installation..." -ForegroundColor Yellow

# Refresh PATH for current session
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

try {
    $ffmpegVersion = & "$ffmpegBin\ffmpeg.exe" -version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "SUCCESS: FFmpeg installed and working!" -ForegroundColor Green
        Write-Host "Version: $($ffmpegVersion[0])" -ForegroundColor Cyan
        Write-Host "`nNext steps:" -ForegroundColor Yellow
        Write-Host "1. Restart your backend server" -ForegroundColor White
        Write-Host "2. The video creator will now have full functionality" -ForegroundColor White
        Write-Host "3. You can now export MP4, GIF, and WebM videos" -ForegroundColor White
    } else {
        Write-Host "Installation completed but verification failed." -ForegroundColor Yellow
        Write-Host "Please restart your terminal and try: ffmpeg -version" -ForegroundColor Gray
    }
} catch {
    Write-Host "Installation completed but verification failed." -ForegroundColor Yellow
    Write-Host "Please restart your terminal and try: ffmpeg -version" -ForegroundColor Gray
}

Write-Host "`nInstallation script completed!" -ForegroundColor Green
Read-Host "Press Enter to exit"