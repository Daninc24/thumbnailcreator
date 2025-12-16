# FFmpeg Installation Fix Script
# This script fixes common installation issues and provides multiple installation methods

Write-Host "FFmpeg Installation Fix Script" -ForegroundColor Green
Write-Host "==============================" -ForegroundColor Green

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "WARNING: Not running as Administrator. Some methods may fail." -ForegroundColor Yellow
    Write-Host "For best results, run PowerShell as Administrator" -ForegroundColor Gray
}

# Method 1: Fix Chocolatey lock file issue
Write-Host "`n=== Method 1: Fix Chocolatey Issue ===" -ForegroundColor Cyan

$lockFile = "C:\ProgramData\chocolatey\lib\c00565a56f0e64a50f2ea5badcb97694d43e0755"
if (Test-Path $lockFile) {
    Write-Host "Found problematic lock file. Attempting to remove..." -ForegroundColor Yellow
    try {
        Remove-Item -Path $lockFile -Force -ErrorAction Stop
        Write-Host "Lock file removed successfully!" -ForegroundColor Green
        
        Write-Host "Retrying Chocolatey installation..." -ForegroundColor Yellow
        & choco install ffmpeg -y
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: FFmpeg installed via Chocolatey!" -ForegroundColor Green
            & ffmpeg -version
            Write-Host "`nPlease restart your backend server." -ForegroundColor Yellow
            Read-Host "Press Enter to exit"
            exit 0
        }
    } catch {
        Write-Host "Could not remove lock file: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Method 2: Direct download and installation
Write-Host "`n=== Method 2: Direct Download Installation ===" -ForegroundColor Cyan

$ffmpegDir = "C:\ffmpeg"
$downloadUrl = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$zipPath = "$env:TEMP\ffmpeg-essentials.zip"

Write-Host "Downloading FFmpeg directly..." -ForegroundColor Yellow

try {
    # Create directory
    if (-not (Test-Path $ffmpegDir)) {
        New-Item -ItemType Directory -Path $ffmpegDir -Force | Out-Null
    }
    
    # Download FFmpeg
    Write-Host "Downloading from: $downloadUrl" -ForegroundColor Gray
    $progressPreference = 'SilentlyContinue'
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath -UseBasicParsing
    $progressPreference = 'Continue'
    
    Write-Host "Download completed! Extracting..." -ForegroundColor Green
    
    # Extract
    Expand-Archive -Path $zipPath -DestinationPath $ffmpegDir -Force
    
    # Find extracted folder and move contents
    $extractedFolders = Get-ChildItem -Path $ffmpegDir -Directory | Where-Object { $_.Name -like "*ffmpeg*" }
    if ($extractedFolders) {
        $sourceFolder = $extractedFolders[0].FullName
        
        # Move bin folder contents
        $sourceBin = Join-Path $sourceFolder "bin"
        $destBin = Join-Path $ffmpegDir "bin"
        
        if (Test-Path $sourceBin) {
            if (-not (Test-Path $destBin)) {
                New-Item -ItemType Directory -Path $destBin -Force | Out-Null
            }
            Copy-Item -Path "$sourceBin\*" -Destination $destBin -Force
        }
        
        # Clean up extracted folder
        Remove-Item -Path $sourceFolder -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # Clean up zip file
    Remove-Item -Path $zipPath -Force -ErrorAction SilentlyContinue
    
    Write-Host "FFmpeg extracted successfully!" -ForegroundColor Green
    
} catch {
    Write-Host "Download failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Trying alternative method..." -ForegroundColor Yellow
}

# Method 3: Add to PATH and verify
Write-Host "`n=== Method 3: Configure PATH ===" -ForegroundColor Cyan

$ffmpegBin = "C:\ffmpeg\bin"
$ffmpegExe = Join-Path $ffmpegBin "ffmpeg.exe"

if (Test-Path $ffmpegExe) {
    Write-Host "FFmpeg executable found at: $ffmpegExe" -ForegroundColor Green
    
    # Add to PATH
    try {
        $currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
        if ($currentPath -notlike "*$ffmpegBin*") {
            Write-Host "Adding to system PATH..." -ForegroundColor Yellow
            $newPath = "$currentPath;$ffmpegBin"
            [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
            Write-Host "Added to system PATH!" -ForegroundColor Green
        }
        
        # Also add to current session
        $env:Path += ";$ffmpegBin"
        
    } catch {
        Write-Host "Could not modify system PATH automatically." -ForegroundColor Yellow
        Write-Host "Please add manually: $ffmpegBin" -ForegroundColor Gray
    }
    
    # Test FFmpeg
    Write-Host "`nTesting FFmpeg..." -ForegroundColor Yellow
    try {
        $version = & $ffmpegExe -version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "SUCCESS: FFmpeg is working!" -ForegroundColor Green
            Write-Host "Version: $($version[0])" -ForegroundColor Cyan
            Write-Host "`nNext steps:" -ForegroundColor Yellow
            Write-Host "1. Restart your backend server" -ForegroundColor White
            Write-Host "2. Refresh your video editor page" -ForegroundColor White
            Write-Host "3. You should see 'Full Video Features Available'" -ForegroundColor White
        } else {
            Write-Host "FFmpeg installed but not responding correctly." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "FFmpeg test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} else {
    Write-Host "FFmpeg executable not found. Trying portable installation..." -ForegroundColor Yellow
    
    # Method 4: Portable installation
    Write-Host "`n=== Method 4: Portable Installation ===" -ForegroundColor Cyan
    
    $portableUrl = "https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip"
    $portableZip = "$env:TEMP\ffmpeg-portable.zip"
    
    try {
        Write-Host "Downloading portable FFmpeg..." -ForegroundColor Yellow
        $progressPreference = 'SilentlyContinue'
        Invoke-WebRequest -Uri $portableUrl -OutFile $portableZip -UseBasicParsing
        $progressPreference = 'Continue'
        
        Write-Host "Extracting portable version..." -ForegroundColor Yellow
        Expand-Archive -Path $portableZip -DestinationPath $ffmpegDir -Force
        
        # Find and move the executable
        $portableExe = Get-ChildItem -Path $ffmpegDir -Recurse -Name "ffmpeg.exe" | Select-Object -First 1
        if ($portableExe) {
            $sourceExe = Join-Path $ffmpegDir $portableExe
            $destExe = Join-Path $ffmpegBin "ffmpeg.exe"
            
            if (-not (Test-Path $ffmpegBin)) {
                New-Item -ItemType Directory -Path $ffmpegBin -Force | Out-Null
            }
            
            Copy-Item -Path $sourceExe -Destination $destExe -Force
            Write-Host "Portable FFmpeg installed!" -ForegroundColor Green
        }
        
        Remove-Item -Path $portableZip -Force -ErrorAction SilentlyContinue
        
    } catch {
        Write-Host "Portable installation failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Final verification
Write-Host "`n=== Final Verification ===" -ForegroundColor Cyan

$finalTest = $false
$testPaths = @(
    "ffmpeg",
    "C:\ffmpeg\bin\ffmpeg.exe",
    "$env:ProgramFiles\ffmpeg\bin\ffmpeg.exe"
)

foreach ($testPath in $testPaths) {
    try {
        $result = & $testPath -version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ FFmpeg working at: $testPath" -ForegroundColor Green
            $finalTest = $true
            break
        }
    } catch {
        # Continue to next path
    }
}

if ($finalTest) {
    Write-Host "`n🎉 SUCCESS! FFmpeg is installed and working!" -ForegroundColor Green
    Write-Host "`nWhat to do next:" -ForegroundColor Yellow
    Write-Host "1. Restart your Node.js backend server" -ForegroundColor White
    Write-Host "2. Open your video editor" -ForegroundColor White
    Write-Host "3. Look for the green 'Full Video Features Available' indicator" -ForegroundColor White
    Write-Host "4. You can now export MP4, GIF, and WebM videos!" -ForegroundColor White
} else {
    Write-Host "`n❌ Installation unsuccessful" -ForegroundColor Red
    Write-Host "`nAlternative options:" -ForegroundColor Yellow
    Write-Host "1. The video editor will work in basic mode without FFmpeg" -ForegroundColor White
    Write-Host "2. Try manual installation from: https://www.gyan.dev/ffmpeg/builds/" -ForegroundColor White
    Write-Host "3. Contact support if you continue having issues" -ForegroundColor White
}

Write-Host "`nScript completed!" -ForegroundColor Green
Read-Host "Press Enter to exit"