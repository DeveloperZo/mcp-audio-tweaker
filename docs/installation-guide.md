# Installation Guide

Complete installation guide for MCP Audio Packages (mcp-audio-inspector and mcp-audio-tweaker).

## System Requirements

### Supported Operating Systems
- **Windows**: 10 or later (x64)
- **macOS**: 11.0 (Big Sur) or later (Intel and Apple Silicon)
- **Linux**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+ (x64)

### Software Prerequisites
- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher (bundled with Node.js)
- **FFmpeg**: Latest stable version for audio processing

## Step 1: Install Node.js

### Windows
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Run the installer and follow the setup wizard
3. Verify installation:
   ```cmd
   node --version
   npm --version
   ```

### macOS
```bash
# Using Homebrew (recommended)
brew install node

# Or download from nodejs.org
```

### Linux
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# CentOS/RHEL
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install nodejs npm

# Verify installation
node --version
npm --version
```

## Step 2: Install FFmpeg

FFmpeg is required for audio processing operations.

### Windows

**Option 1: Using Chocolatey (Recommended)**
```cmd
# Install Chocolatey first (if not installed)
# Run as Administrator
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install FFmpeg
choco install ffmpeg
```

**Option 2: Using winget**
```cmd
winget install FFmpeg
```

**Option 3: Manual Installation**
1. Download FFmpeg from [ffmpeg.org](https://ffmpeg.org/download.html#build-windows)
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to your system PATH
4. Restart command prompt and verify:
   ```cmd
   ffmpeg -version
   ```

### macOS
```bash
# Using Homebrew (recommended)
brew install ffmpeg

# Verify installation
ffmpeg -version
ffprobe -version
```

### Linux
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# CentOS/RHEL (Enable EPEL first)
sudo yum install epel-release
sudo yum install ffmpeg

# Verify installation
ffmpeg -version
ffprobe -version
```

## Step 3: Install MCP Audio Packages

### Global Installation (Recommended)

Install both packages globally for easy access:

```bash
# Install both packages
npm install -g mcp-audio-inspector mcp-audio-tweaker

# Verify installations
npx mcp-audio-inspector --version
npx mcp-audio-tweaker --version
```

### Local Installation

For project-specific installations:

```bash
# Create a project directory
mkdir audio-processing-project
cd audio-processing-project

# Initialize npm project
npm init -y

# Install packages locally
npm install mcp-audio-inspector mcp-audio-tweaker

# Use with npx
npx mcp-audio-inspector --help
npx mcp-audio-tweaker --help
```

### Development Installation

For development and contributions:

```bash
# Clone repositories
git clone https://github.com/your-org/mcp-audio-inspector.git
git clone https://github.com/your-org/mcp-audio-tweaker.git

# Install dependencies for inspector
cd mcp-audio-inspector
npm install
npm run build
npm link

# Install dependencies for tweaker
cd ../mcp-audio-tweaker
npm install
npm run build
npm link

# Verify linked packages
mcp-audio-inspector --version
mcp-audio-tweaker --version
```

## Step 4: Claude Desktop Integration

### Install Claude Desktop

1. Download Claude Desktop from [claude.ai](https://claude.ai/download)
2. Install the application
3. Create account and sign in

### Configure MCP Servers

1. Locate your Claude Desktop configuration file:
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Create or edit the configuration file:

```json
{
  "mcpServers": {
    "audio-inspector": {
      "command": "npx",
      "args": ["-y", "mcp-audio-inspector"],
      "env": {
        "AUDIO_INSPECTOR_LOG_LEVEL": "info"
      }
    },
    "audio-tweaker": {
      "command": "npx",
      "args": ["-y", "mcp-audio-tweaker"],
      "env": {
        "AUDIO_TWEAKER_LOG_LEVEL": "info",
        "AUDIO_TWEAKER_MAX_CONCURRENCY": "2"
      }
    }
  }
}
```

3. Restart Claude Desktop
4. Verify integration by typing `@audio-inspector` or `@audio-tweaker` in a conversation

## Step 5: Verify Installation

### Test Audio Inspector

```bash
# Test standalone mode
npx mcp-audio-inspector --standalone --help

# Test with a sample audio file (if available)
npx mcp-audio-inspector --standalone /path/to/sample.mp3
```

### Test Audio Tweaker

```bash
# Test standalone mode
npx mcp-audio-tweaker --standalone check

# List available presets
npx mcp-audio-tweaker --standalone presets

# Test with a sample file (if available)
npx mcp-audio-tweaker --standalone process \
  --input /path/to/input.wav \
  --output /path/to/output.mp3 \
  --preset game-audio-mobile
```

### Test Claude Desktop Integration

1. Open Claude Desktop
2. Start a new conversation
3. Type: `@audio-inspector list supported formats`
4. Type: `@audio-tweaker list available presets`

## Troubleshooting Common Installation Issues

### Node.js Issues

**Problem**: `node: command not found`
**Solution**: 
- Ensure Node.js is properly installed
- Restart terminal/command prompt
- Check PATH environment variable

**Problem**: `npm: command not found`
**Solution**:
- Reinstall Node.js (npm is bundled)
- Check npm installation: `which npm` (Unix) or `where npm` (Windows)

### FFmpeg Issues

**Problem**: `ffmpeg: command not found`
**Solution**:
- Verify FFmpeg installation: `ffmpeg -version`
- Check PATH environment variable
- Reinstall FFmpeg using package manager

**Problem**: FFmpeg installed but not detected
**Solution**:
- Set explicit path in environment variables:
  ```json
  {
    "env": {
      "FFMPEG_PATH": "/path/to/ffmpeg",
      "FFPROBE_PATH": "/path/to/ffprobe"
    }
  }
  ```

### Package Installation Issues

**Problem**: `npm install` fails with permission errors
**Solution**:
```bash
# Fix npm permissions (Unix/macOS)
sudo chown -R $(whoami) ~/.npm
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH

# Or use npx instead of global installation
npx mcp-audio-inspector
```

**Problem**: Network/proxy issues during installation
**Solution**:
```bash
# Configure npm proxy
npm config set proxy http://your-proxy:port
npm config set https-proxy https://your-proxy:port

# Or use alternative registry
npm install --registry https://registry.npmjs.org/
```

### Claude Desktop Integration Issues

**Problem**: MCP servers not appearing in Claude Desktop
**Solution**:
- Verify configuration file location and syntax
- Check that packages are globally installed or use full paths
- Restart Claude Desktop after configuration changes
- Check Claude Desktop logs for error messages

**Problem**: "Tool not found" errors
**Solution**:
- Verify packages are properly installed: `npx mcp-audio-inspector --version`
- Check environment variables in configuration
- Test packages in standalone mode first

## Performance Optimization

### System Recommendations

**Minimum System Requirements:**
- RAM: 4GB
- Storage: 1GB free space
- CPU: Dual-core processor

**Recommended System Requirements:**
- RAM: 8GB or more
- Storage: 5GB free space (for temporary processing files)
- CPU: Quad-core processor or better
- SSD storage for faster file I/O

### Configuration Tuning

```json
{
  "mcpServers": {
    "audio-inspector": {
      "env": {
        "MAX_FILE_SIZE": "500000000",
        "MUSIC_METADATA_TIMEOUT": "30000"
      }
    },
    "audio-tweaker": {
      "env": {
        "AUDIO_TWEAKER_MAX_CONCURRENCY": "4",
        "FFMPEG_TIMEOUT": "300000",
        "AUDIO_TWEAKER_TEMP_DIR": "/tmp/audio-processing"
      }
    }
  }
}
```

## Next Steps

After successful installation:

1. Read the [API Reference](api-reference.md) for detailed usage information
2. Follow the [Quick Start Tutorial](tutorials/quick-start.md) for hands-on examples
3. Explore [Game Audio Workflow](tutorials/game-audio-workflow.md) for specialized use cases
4. Check [Troubleshooting Guide](troubleshooting.md) for common issues and solutions

## Getting Help

- **Documentation**: [Full documentation](../README.md)
- **Issues**: [GitHub Issues](https://github.com/your-org/mcp-audio-packages/issues)
- **Community**: [Discussions](https://github.com/your-org/mcp-audio-packages/discussions)
- **Support**: Contact the Infinity Cube development team

## License

MIT License - See [LICENSE](../LICENSE) for details.
