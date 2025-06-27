# Troubleshooting Guide

Comprehensive troubleshooting guide for MCP Audio Packages covering common issues, error messages, and their solutions.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Runtime Errors](#runtime-errors)
- [Performance Issues](#performance-issues)
- [Claude Desktop Integration](#claude-desktop-integration)
- [FFmpeg Issues](#ffmpeg-issues)
- [File Format Issues](#file-format-issues)
- [Network and Proxy Issues](#network-and-proxy-issues)
- [Debug and Logging](#debug-and-logging)

---

## Installation Issues

### Node.js and npm Issues

#### Issue: `node: command not found`

**Symptoms:**
- Terminal/command prompt returns "command not found" when running `node`
- Installation fails with Node.js not found error

**Solutions:**
1. **Verify Node.js installation:**
   ```bash
   # Check if Node.js is installed
   which node  # Unix/macOS
   where node  # Windows
   ```

2. **Install or reinstall Node.js:**
   - Download from [nodejs.org](https://nodejs.org/)
   - Use package manager:
     ```bash
     # macOS
     brew install node
     
     # Windows (with Chocolatey)
     choco install nodejs
     
     # Linux (Ubuntu/Debian)
     curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
     sudo apt-get install -y nodejs
     ```

3. **Fix PATH environment variable:**
   ```bash
   # Add to ~/.bashrc, ~/.zshrc, or equivalent
   export PATH="/usr/local/bin:$PATH"
   
   # Reload shell configuration
   source ~/.bashrc
   ```

#### Issue: npm permission errors

**Symptoms:**
- `EACCES` permission errors during global package installation
- `npm install -g` fails with permission denied

**Solutions:**
1. **Configure npm to use a different directory:**
   ```bash
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   ```

2. **Use npx instead of global installation:**
   ```bash
   # Use packages without global installation
   npx mcp-audio-inspector --help
   npx mcp-audio-tweaker --help
   ```

3. **Fix npm permissions (macOS/Linux):**
   ```bash
   sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
   ```

### Package Installation Issues

#### Issue: Package installation fails with network errors

**Symptoms:**
- `npm install` timeout errors
- Network connectivity issues
- Registry access problems

**Solutions:**
1. **Clear npm cache:**
   ```bash
   npm cache clean --force
   npm cache verify
   ```

2. **Use different registry:**
   ```bash
   npm install --registry https://registry.npmjs.org/
   
   # Or set permanently
   npm config set registry https://registry.npmjs.org/
   ```

3. **Configure proxy settings:**
   ```bash
   npm config set proxy http://proxy.company.com:8080
   npm config set https-proxy https://proxy.company.com:8080
   ```

#### Issue: Version compatibility errors

**Symptoms:**
- `engine` compatibility warnings
- Dependency version conflicts

**Solutions:**
1. **Update Node.js to required version:**
   ```bash
   # Check current version
   node --version
   
   # Update using package manager or download from nodejs.org
   ```

2. **Force compatible version:**
   ```bash
   npm install --engine-strict=false
   ```

---

## Runtime Errors

### Audio Inspector Errors

#### Error: `FILE_NOT_FOUND`

**Symptoms:**
```json
{
  "error": {
    "code": "FILE_NOT_FOUND",
    "message": "Audio file not found or not accessible"
  }
}
```

**Solutions:**
1. **Verify file path:**
   ```bash
   # Check if file exists
   ls -la /path/to/audio.wav
   
   # Use absolute path
   npx mcp-audio-inspector --standalone "$(pwd)/audio.wav"
   ```

2. **Check file permissions:**
   ```bash
   # Make file readable
   chmod 644 /path/to/audio.wav
   ```

3. **Use proper path escaping:**
   ```bash
   # Escape spaces and special characters
   npx mcp-audio-inspector --standalone "/path/to/file with spaces.wav"
   ```

#### Error: `UNSUPPORTED_FORMAT`

**Symptoms:**
- Audio format not recognized
- Both music-metadata and FFprobe fail

**Solutions:**
1. **Check supported formats:**
   ```bash
   npx mcp-audio-inspector --standalone --list-formats
   ```

2. **Install/update FFmpeg:**
   ```bash
   # Update FFmpeg to latest version
   brew upgrade ffmpeg  # macOS
   sudo apt update && sudo apt upgrade ffmpeg  # Linux
   ```

3. **Convert file to supported format:**
   ```bash
   ffmpeg -i input.exotic_format output.wav
   ```

#### Error: `METADATA_EXTRACTION_FAILED`

**Symptoms:**
- Metadata extraction fails on seemingly valid files
- Timeout errors during processing

**Solutions:**
1. **Increase timeout:**
   ```json
   {
     "env": {
       "MUSIC_METADATA_TIMEOUT": "60000"
     }
   }
   ```

2. **Check file integrity:**
   ```bash
   # Test file with FFprobe
   ffprobe -v error -show_format -show_streams input.wav
   ```

3. **Try fallback mode:**
   ```bash
   # Force FFprobe fallback
   FORCE_FFPROBE=true npx mcp-audio-inspector --standalone input.wav
   ```

### Audio Tweaker Errors

#### Error: `FFMPEG_NOT_FOUND`

**Symptoms:**
```json
{
  "error": {
    "code": "FFMPEG_NOT_FOUND",
    "message": "FFmpeg executable not found in PATH"
  }
}
```

**Solutions:**
1. **Install FFmpeg:**
   ```bash
   # macOS
   brew install ffmpeg
   
   # Windows
   choco install ffmpeg
   
   # Linux
   sudo apt install ffmpeg
   ```

2. **Set explicit path:**
   ```json
   {
     "env": {
       "FFMPEG_PATH": "/usr/local/bin/ffmpeg",
       "FFPROBE_PATH": "/usr/local/bin/ffprobe"
     }
   }
   ```

3. **Verify installation:**
   ```bash
   ffmpeg -version
   which ffmpeg
   ```

#### Error: `PROCESSING_FAILED`

**Symptoms:**
- FFmpeg command fails during execution
- Audio processing operations fail

**Solutions:**
1. **Check FFmpeg command:**
   ```bash
   # Enable debug logging to see FFmpeg commands
   AUDIO_TWEAKER_LOG_LEVEL=debug npx mcp-audio-tweaker --standalone process --input input.wav --output output.mp3
   ```

2. **Test FFmpeg directly:**
   ```bash
   # Test basic conversion
   ffmpeg -i input.wav output.mp3
   ```

3. **Check available codecs:**
   ```bash
   # List available encoders
   ffmpeg -encoders | grep -i mp3
   ```

#### Error: `INVALID_PARAMETERS`

**Symptoms:**
- Parameter validation fails
- Invalid operation specifications

**Solutions:**
1. **Check parameter ranges:**
   ```json
   {
     "volume": {
       "adjust": -3,        // Must be between -60 and +20
       "targetLUFS": -23    // Must be between -60 and 0
     },
     "format": {
       "sampleRate": 44100, // Must be: 8000, 16000, 22050, 44100, 48000, 96000, 192000
       "bitrate": 192,      // Must be between 64 and 320
       "channels": 2        // Must be: 1, 2, 6, 8
     }
   }
   ```

2. **Validate preset names:**
   ```bash
   # List available presets
   npx mcp-audio-tweaker --standalone presets
   ```

---

## Performance Issues

### Slow Processing

#### Issue: Audio processing takes too long

**Symptoms:**
- Long processing times for audio files
- High CPU usage
- System becomes unresponsive

**Solutions:**
1. **Optimize concurrency settings:**
   ```json
   {
     "env": {
       "AUDIO_TWEAKER_MAX_CONCURRENCY": "2"  // Reduce for lower-end systems
     }
   }
   ```

2. **Use faster storage:**
   ```json
   {
     "env": {
       "AUDIO_TWEAKER_TEMP_DIR": "/path/to/ssd/temp"
     }
   }
   ```

3. **Process smaller batches:**
   ```bash
   # Process files in smaller groups
   find /audio/dir -name "*.wav" | head -10 | xargs -I {} npx mcp-audio-tweaker --standalone process --input {} --output {}.mp3
   ```

### Memory Issues

#### Issue: Out of memory errors

**Symptoms:**
- `JavaScript heap out of memory` errors
- System freezes during processing
- Large memory usage

**Solutions:**
1. **Increase Node.js memory limit:**
   ```bash
   export NODE_OPTIONS="--max-old-space-size=8192"  # 8GB
   npx mcp-audio-tweaker --standalone batch --input-dir /large/audio/dir
   ```

2. **Set file size limits:**
   ```json
   {
     "env": {
       "MAX_FILE_SIZE": "104857600"  // 100MB limit
     }
   }
   ```

3. **Process files sequentially:**
   ```json
   {
     "env": {
       "AUDIO_TWEAKER_MAX_CONCURRENCY": "1"
     }
   }
   ```

---

## Claude Desktop Integration

### MCP Server Issues

#### Issue: MCP servers not appearing in Claude Desktop

**Symptoms:**
- `@audio-inspector` and `@audio-tweaker` commands not recognized
- MCP tools not available in conversation

**Solutions:**
1. **Verify configuration file location:**
   ```bash
   # Find configuration file
   # Windows: %APPDATA%\Claude\claude_desktop_config.json
   # macOS: ~/Library/Application Support/Claude/claude_desktop_config.json
   # Linux: ~/.config/Claude/claude_desktop_config.json
   ```

2. **Validate JSON syntax:**
   ```bash
   # Check JSON syntax
   python -m json.tool claude_desktop_config.json
   # or
   jq . claude_desktop_config.json
   ```

3. **Check package installation:**
   ```bash
   # Verify packages are accessible
   npx mcp-audio-inspector --version
   npx mcp-audio-tweaker --version
   ```

4. **Restart Claude Desktop** after configuration changes

#### Issue: "Tool not found" errors in Claude Desktop

**Symptoms:**
- Error messages when trying to use MCP tools
- Server connection failures

**Solutions:**
1. **Test packages in standalone mode:**
   ```bash
   npx mcp-audio-inspector --standalone --help
   npx mcp-audio-tweaker --standalone check
   ```

2. **Check environment variables:**
   ```json
   {
     "mcpServers": {
       "audio-inspector": {
         "command": "npx",
         "args": ["-y", "mcp-audio-inspector"],
         "env": {
           "PATH": "/usr/local/bin:/usr/bin:/bin",
           "AUDIO_INSPECTOR_LOG_LEVEL": "debug"
         }
       }
     }
   }
   ```

3. **Use absolute paths:**
   ```json
   {
     "mcpServers": {
       "audio-inspector": {
         "command": "/usr/local/bin/node",
         "args": ["/usr/local/lib/node_modules/mcp-audio-inspector/index.js"]
       }
     }
   }
   ```

### Connection Issues

#### Issue: MCP server fails to start

**Symptoms:**
- Server startup errors in Claude Desktop logs
- Connection timeouts

**Solutions:**
1. **Enable debug logging:**
   ```json
   {
     "env": {
       "AUDIO_INSPECTOR_LOG_LEVEL": "debug",
       "AUDIO_TWEAKER_LOG_LEVEL": "debug"
     }
   }
   ```

2. **Check server logs:**
   ```bash
   # Start server manually to see error messages
   npx mcp-audio-inspector 2>&1 | tee debug.log
   ```

3. **Verify dependencies:**
   ```bash
   # Check all dependencies are installed
   npm list -g mcp-audio-inspector mcp-audio-tweaker
   ```

---

## FFmpeg Issues

### Installation Problems

#### Issue: FFmpeg not found or outdated

**Symptoms:**
- `ffmpeg: command not found`
- Codec not supported errors
- Old FFmpeg version issues

**Solutions:**
1. **Install/update FFmpeg:**
   ```bash
   # macOS
   brew install ffmpeg
   brew upgrade ffmpeg
   
   # Windows
   choco install ffmpeg
   choco upgrade ffmpeg
   
   # Linux (Ubuntu/Debian)
   sudo apt update
   sudo apt install ffmpeg
   sudo apt upgrade ffmpeg
   ```

2. **Verify FFmpeg capabilities:**
   ```bash
   ffmpeg -version
   ffmpeg -codecs | grep -i mp3
   ffmpeg -encoders | grep -i aac
   ```

3. **Build FFmpeg with required codecs:**
   ```bash
   # Download and compile FFmpeg with specific codecs
   git clone https://git.ffmpeg.org/ffmpeg.git ffmpeg
   cd ffmpeg
   ./configure --enable-libmp3lame --enable-libfdk-aac
   make -j4
   sudo make install
   ```

### Path Issues

#### Issue: FFmpeg installed but not detected

**Symptoms:**
- FFmpeg works in terminal but not in MCP packages
- Path-related errors

**Solutions:**
1. **Set explicit paths in configuration:**
   ```json
   {
     "env": {
       "FFMPEG_PATH": "/usr/local/bin/ffmpeg",
       "FFPROBE_PATH": "/usr/local/bin/ffprobe"
     }
   }
   ```

2. **Update system PATH:**
   ```bash
   # Add FFmpeg to PATH
   export PATH="/usr/local/bin:$PATH"
   
   # Make permanent
   echo 'export PATH="/usr/local/bin:$PATH"' >> ~/.bashrc
   source ~/.bashrc
   ```

3. **Use which/where to find FFmpeg:**
   ```bash
   # Find FFmpeg location
   which ffmpeg  # Unix/macOS
   where ffmpeg  # Windows
   ```

---

## File Format Issues

### Unsupported Formats

#### Issue: Audio format not supported

**Symptoms:**
- `UNSUPPORTED_FORMAT` errors
- Files not processed

**Solutions:**
1. **Check format support:**
   ```bash
   # List supported formats
   npx mcp-audio-inspector --standalone --list-formats
   ffmpeg -formats | grep -i audio
   ```

2. **Convert to supported format:**
   ```bash
   # Convert using FFmpeg
   ffmpeg -i input.exotic_format output.wav
   ffmpeg -i input.wma output.mp3
   ```

3. **Enable format fallback:**
   ```json
   {
     "env": {
       "FORCE_FFPROBE": "true"
     }
   }
   ```

### Corrupted Files

#### Issue: Audio files appear corrupted

**Symptoms:**
- Extraction fails on specific files
- Partial metadata only
- FFmpeg reports format errors

**Solutions:**
1. **Test file integrity:**
   ```bash
   # Check file with FFprobe
   ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels input.wav
   
   # Attempt repair
   ffmpeg -i corrupted.wav -c:a copy repaired.wav
   ```

2. **Skip corrupted files in batch processing:**
   ```bash
   # Continue processing even with some failures
   find /audio/dir -name "*.wav" -exec sh -c 'ffprobe -v error "$1" && echo "$1 is valid"' _ {} \;
   ```

---

## Network and Proxy Issues

### Corporate Environment

#### Issue: npm/package installation fails behind corporate firewall

**Symptoms:**
- Network timeout during package installation
- SSL/TLS certificate errors
- Proxy authentication required

**Solutions:**
1. **Configure npm proxy:**
   ```bash
   npm config set proxy http://username:password@proxy.company.com:8080
   npm config set https-proxy https://username:password@proxy.company.com:8080
   npm config set strict-ssl false  # Only if necessary
   ```

2. **Use internal registry:**
   ```bash
   npm config set registry http://internal-npm-registry.company.com/
   ```

3. **Download packages manually:**
   ```bash
   # Download .tgz files manually and install
   npm install ./mcp-audio-inspector-1.0.0.tgz
   ```

---

## Debug and Logging

### Enable Debug Mode

#### Complete debug configuration

```json
{
  "mcpServers": {
    "audio-inspector": {
      "command": "npx",
      "args": ["-y", "mcp-audio-inspector"],
      "env": {
        "AUDIO_INSPECTOR_LOG_LEVEL": "debug",
        "NODE_ENV": "development",
        "DEBUG": "*"
      }
    },
    "audio-tweaker": {
      "command": "npx", 
      "args": ["-y", "mcp-audio-tweaker"],
      "env": {
        "AUDIO_TWEAKER_LOG_LEVEL": "debug",
        "NODE_ENV": "development",
        "DEBUG": "*"
      }
    }
  }
}
```

### Log Analysis

#### Common log patterns to look for

1. **Startup errors:**
   ```
   Error: Cannot find module 'music-metadata'
   Error: spawn ffmpeg ENOENT
   ```

2. **Processing errors:**
   ```
   FFmpeg command failed: [command details]
   Metadata extraction timeout after 30000ms
   ```

3. **Configuration errors:**
   ```
   Invalid parameter: sampleRate must be one of [8000, 16000, ...]
   Preset not found: invalid-preset-name
   ```

### Collecting Diagnostic Information

#### Create diagnostic report

```bash
#!/bin/bash
# diagnostic-report.sh

echo "=== System Information ===" > diagnostic-report.txt
uname -a >> diagnostic-report.txt
echo "" >> diagnostic-report.txt

echo "=== Node.js Version ===" >> diagnostic-report.txt
node --version >> diagnostic-report.txt
npm --version >> diagnostic-report.txt
echo "" >> diagnostic-report.txt

echo "=== FFmpeg Information ===" >> diagnostic-report.txt
ffmpeg -version 2>&1 >> diagnostic-report.txt
echo "" >> diagnostic-report.txt

echo "=== Package Versions ===" >> diagnostic-report.txt
npm list -g mcp-audio-inspector mcp-audio-tweaker 2>&1 >> diagnostic-report.txt
echo "" >> diagnostic-report.txt

echo "=== Package Tests ===" >> diagnostic-report.txt
npx mcp-audio-inspector --version 2>&1 >> diagnostic-report.txt
npx mcp-audio-tweaker --version 2>&1 >> diagnostic-report.txt
echo "" >> diagnostic-report.txt

echo "=== Claude Desktop Config ===" >> diagnostic-report.txt
cat ~/.config/Claude/claude_desktop_config.json 2>&1 >> diagnostic-report.txt

echo "Diagnostic report saved to diagnostic-report.txt"
```

---

## Getting Help

### Before Reporting Issues

1. **Check this troubleshooting guide** for known solutions
2. **Search existing issues** on GitHub
3. **Test in standalone mode** to isolate the problem
4. **Collect diagnostic information** as shown above
5. **Try the latest version** of packages

### Reporting Bugs

Include the following information in bug reports:

1. **System information**: OS, Node.js version, FFmpeg version
2. **Package versions**: Exact versions of MCP packages
3. **Error messages**: Complete error output and logs
4. **Reproduction steps**: Minimal steps to reproduce the issue
5. **Configuration**: Claude Desktop configuration (sanitized)
6. **Sample files**: If possible, provide sample audio files that demonstrate the issue

### Community Support

- **GitHub Issues**: [MCP Audio Packages Issues](https://github.com/your-org/mcp-audio-packages/issues)
- **GitHub Discussions**: [Community Discussions](https://github.com/your-org/mcp-audio-packages/discussions)
- **Documentation**: [Full Documentation](../README.md)

### Professional Support

For enterprise support and custom implementations, contact the Infinity Cube development team.

---

## Quick Reference

### Essential Commands

```bash
# Check package versions
npx mcp-audio-inspector --version
npx mcp-audio-tweaker --version

# Test packages in standalone mode
npx mcp-audio-inspector --standalone /path/to/test.wav
npx mcp-audio-tweaker --standalone check

# Check FFmpeg installation
ffmpeg -version
which ffmpeg

# Validate Claude Desktop configuration
python -m json.tool ~/.config/Claude/claude_desktop_config.json

# Enable debug logging
export AUDIO_INSPECTOR_LOG_LEVEL=debug
export AUDIO_TWEAKER_LOG_LEVEL=debug
```

### Common File Locations

| Component | Windows | macOS | Linux |
|-----------|---------|-------|-------|
| Claude Desktop Config | `%APPDATA%\Claude\claude_desktop_config.json` | `~/Library/Application Support/Claude/claude_desktop_config.json` | `~/.config/Claude/claude_desktop_config.json` |
| Node.js Global Packages | `%APPDATA%\npm\node_modules` | `/usr/local/lib/node_modules` | `/usr/local/lib/node_modules` |
| FFmpeg Binary | `C:\ffmpeg\bin\ffmpeg.exe` | `/usr/local/bin/ffmpeg` | `/usr/bin/ffmpeg` |

This troubleshooting guide should help resolve most common issues. If you encounter problems not covered here, please refer to the GitHub repository or community support channels.
