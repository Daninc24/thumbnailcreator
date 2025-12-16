# FFmpeg Installation Guide

FFmpeg is required for full video creation functionality in the thumbnail generator. The system will work in basic mode without FFmpeg, but installing it unlocks MP4/GIF export, audio mixing, and advanced video processing.

## Windows Installation

### Option 1: Automated Installation Script (Recommended)
1. Download the installation script: `install-ffmpeg-windows.ps1`
2. Right-click PowerShell and select "Run as Administrator"
3. Navigate to the script location and run:
   ```powershell
   .\install-ffmpeg-windows.ps1
   ```
4. Follow the on-screen instructions
5. Restart your backend server after installation

### Option 2: Using Chocolatey
1. Open PowerShell as Administrator
2. Install Chocolatey (if not already installed):
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```
3. Install FFmpeg: `choco install ffmpeg`
4. Restart your terminal and backend server

### Option 3: Manual Installation
1. Download FFmpeg from: https://www.gyan.dev/ffmpeg/builds/
2. Extract the files to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to your system PATH:
   - Open System Properties → Advanced → Environment Variables
   - Edit the PATH variable and add `C:\ffmpeg\bin`
   - Restart your command prompt/IDE

### Option 4: Using Scoop
1. Install Scoop: https://scoop.sh/
2. Run: `scoop install ffmpeg`

## macOS Installation

### Option 1: Using Homebrew (Recommended)
```bash
brew install ffmpeg
```

### Option 2: Using MacPorts
```bash
sudo port install ffmpeg
```

## Linux Installation

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install ffmpeg
```

### CentOS/RHEL/Fedora
```bash
# CentOS/RHEL
sudo yum install ffmpeg

# Fedora
sudo dnf install ffmpeg
```

### Arch Linux
```bash
sudo pacman -S ffmpeg
```

## Verify Installation

After installation, verify FFmpeg is working by running:
```bash
ffmpeg -version
```

You should see version information and available codecs.

## Troubleshooting

### FFmpeg not found
- Make sure FFmpeg is in your system PATH
- Restart your terminal/IDE after installation
- Try running `where ffmpeg` (Windows) or `which ffmpeg` (macOS/Linux) to locate the binary

### Permission Issues
- On Windows, run as Administrator
- On macOS/Linux, use `sudo` for system-wide installation

### Video Creation Still Not Working
1. Restart the backend server after installing FFmpeg
2. Check the server logs for FFmpeg-related errors
3. Ensure the uploads directory has write permissions

## Video Creation Features

### Without FFmpeg (Basic Mode)
- Canvas-based video preview
- Layer management and editing
- Template selection and customization
- Basic video project creation
- JSON export for project data

### With FFmpeg (Full Features)
- All basic mode features plus:
- Create animated videos from templates
- Convert static thumbnails to animated videos
- Export in multiple formats (MP4, GIF, WebM)
- Audio mixing and background music
- Voice recording integration
- Advanced video encoding options
- Platform-optimized exports (YouTube, TikTok, Instagram)
- Use various animation effects (fade, zoom, slide, pulse)

## Current System Status

The video editor will automatically detect FFmpeg availability and show:
- 🟢 **Full Video Features Available** - FFmpeg is installed and working
- 🟡 **Basic Mode - Install FFmpeg for Full Features** - Limited functionality

## Quick Installation Check

After installation, verify FFmpeg is working:
```bash
ffmpeg -version
```

You should see version information. If not, restart your terminal and try again.

## Performance Notes

- Video processing is CPU-intensive
- Higher quality settings take longer to process
- GIF format is smaller but lower quality
- MP4 format provides the best quality-to-size ratio

For any issues, check the server logs or contact support.