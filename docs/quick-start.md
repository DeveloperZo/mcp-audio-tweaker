# Quick Start Tutorial

Get up and running with MCP Audio Packages in 15 minutes. This tutorial covers installation, basic configuration, and your first audio processing tasks.

## What You'll Learn

- Install and configure MCP Audio Packages
- Set up Claude Desktop integration
- Analyze audio files with Audio Inspector
- Process audio files with Audio Tweaker
- Use presets for common audio tasks

## Prerequisites

- Windows 10+, macOS 11+, or Linux (Ubuntu 20.04+)
- 30 minutes of time
- A few sample audio files (WAV, MP3, or OGG format)

---

## Step 1: Installation (5 minutes)

### Install Node.js

1. Download and install Node.js 18+ from [nodejs.org](https://nodejs.org/)
2. Verify installation:
   ```bash
   node --version  # Should show v18.0.0 or higher
   npm --version   # Should show 8.0.0 or higher
   ```

### Install FFmpeg

**Windows (using Chocolatey):**
```bash
choco install ffmpeg
```

**macOS (using Homebrew):**
```bash
brew install ffmpeg
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update && sudo apt install ffmpeg
```

**Verify FFmpeg:**
```bash
ffmpeg -version
```

### Install MCP Audio Packages

```bash
# Install both packages globally
npm install -g mcp-audio-inspector mcp-audio-tweaker

# Verify installation
npx mcp-audio-inspector --version
npx mcp-audio-tweaker --version
```

---

## Step 2: Test Standalone Mode (5 minutes)

Before integrating with Claude Desktop, let's test the packages independently.

### Test Audio Inspector

```bash
# Check supported formats
npx mcp-audio-inspector --standalone --list-formats

# Analyze a sample audio file (replace with your file path)
npx mcp-audio-inspector --standalone "/path/to/your/audio.wav"
```

**Example output:**
```json
{
  "success": true,
  "data": {
    "file": {
      "path": "/path/to/your/audio.wav",
      "name": "audio.wav",
      "size": 1048576,
      "modified": "2025-06-27T14:30:00.000Z"
    },
    "format": {
      "container": "WAV",
      "codec": "PCM",
      "lossless": true,
      "duration": 10.5,
      "bitrate": 1411,
      "sampleRate": 44100,
      "channels": 2
    },
    "gameAudio": {
      "suitableForLoop": true,
      "recommendedCompressionFormat": "OGG",
      "estimatedMemoryUsage": 924000
    }
  }
}
```

### Test Audio Tweaker

```bash
# Check system requirements
npx mcp-audio-tweaker --standalone check

# List available presets
npx mcp-audio-tweaker --standalone presets

# Process a sample file with a preset
npx mcp-audio-tweaker --standalone process \
  --input "/path/to/input.wav" \
  --output "/path/to/output.mp3" \
  --preset "game-audio-mobile"
```

---

## Step 3: Claude Desktop Integration (3 minutes)

### Install Claude Desktop

1. Download from [claude.ai](https://claude.ai/download)
2. Install and sign in to your account

### Configure MCP Servers

1. Find your Claude Desktop configuration file:
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Create or edit the file with this configuration:

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
        "AUDIO_TWEAKER_LOG_LEVEL": "info"
      }
    }
  }
}
```

3. **Restart Claude Desktop**

### Verify Integration

Open Claude Desktop and start a new conversation:

```
@audio-inspector What audio formats do you support?
```

You should see a response listing supported audio formats. If you get an error, check the [Troubleshooting Guide](../troubleshooting.md).

---

## Step 4: Your First Audio Analysis (5 minutes)

Let's analyze an audio file using Claude Desktop.

### Basic Analysis

```
@audio-inspector Please analyze this audio file and provide game development recommendations:
/path/to/your/audio.wav
```

**What you'll see:**
- Complete metadata about the file
- Audio format details (sample rate, bit depth, duration)
- Game-specific recommendations (compression format, memory usage)
- Platform optimization suggestions

### Batch Analysis

```
@audio-inspector Analyze all audio files in this directory and provide a summary report:
/path/to/your/audio/directory
```

This will process multiple files and give you a comprehensive overview of your audio assets.

---

## Step 5: Your First Audio Processing (7 minutes)

Now let's process audio files using Audio Tweaker.

### Using Presets

**Mobile Game Optimization:**
```
@audio-tweaker Apply the mobile game audio preset to this file:
Input: /path/to/music.wav
Output: /path/to/music-mobile.ogg
```

**ElevenLabs Voice Optimization:**
```
@audio-tweaker Apply the elevenLabs-optimize preset to this AI voice file:
Input: /path/to/elevenlabs-voice.wav
Output: /path/to/optimized-voice.mp3
```

### Custom Processing

**Volume Normalization:**
```
@audio-tweaker Process this audio file with the following operations:
- Normalize to -23 LUFS
- Convert to 44.1kHz MP3 at 192 kbps
- Add 0.1 second fade in and fade out

Input: /path/to/raw-audio.wav
Output: /path/to/processed-audio.mp3
```

### Batch Processing

**Convert Directory of Files:**
```
@audio-tweaker Convert all WAV files in /audio/raw/ to mobile-optimized OGG format using the game-audio-mobile preset. Save results to /audio/processed/
```

---

## Step 6: Understanding the Results

### Audio Inspector Results

When you analyze a file, pay attention to these key sections:

**Format Information:**
- `duration`: Length of audio in seconds
- `sampleRate`: Audio quality (22kHz for mobile, 44.1kHz for desktop)
- `bitrate`: Data rate (affects file size and quality)
- `lossless`: Whether the format preserves original quality

**Game Audio Analysis:**
- `suitableForLoop`: Whether audio can loop seamlessly
- `recommendedCompressionFormat`: Best format for your use case
- `estimatedMemoryUsage`: How much RAM the audio will use
- `platformOptimizations`: Specific recommendations for mobile/desktop/console

### Audio Tweaker Results

Processing results show:
- `processingTime`: How long the operation took
- `inputSize` vs `outputSize`: File size comparison
- `compressionRatio`: How much compression was achieved
- `operationsApplied`: List of all processing steps

---

## Common Use Cases

### Game Development Workflow

1. **Voice Assets from ElevenLabs:**
   ```
   @audio-tweaker Apply elevenLabs-optimize preset to convert AI voice to game-ready format
   ```

2. **Background Music Optimization:**
   ```
   @audio-tweaker Convert background music to platform-specific formats:
   - Desktop: 44.1kHz stereo MP3
   - Mobile: 22kHz mono OGG  
   - Console: 48kHz stereo FLAC
   ```

3. **Sound Effects Processing:**
   ```
   @audio-tweaker Batch process SFX directory with sfx-optimization preset
   ```

### Content Creation Workflow

1. **Audio Analysis for Quality Control:**
   ```
   @audio-inspector Analyze all recorded audio and identify any quality issues
   ```

2. **Consistent Audio Levels:**
   ```
   @audio-tweaker Normalize all audio files to -23 LUFS for broadcast standards
   ```

---

## Next Steps

Congratulations! You now have MCP Audio Packages running and know the basics. Here's what to explore next:

### Advanced Tutorials
- [Game Audio Workflow](game-audio-workflow.md) - Complete game development pipeline
- [ElevenLabs Integration](elevenlabs-integration.md) - AI voice processing workflow
- [Batch Processing Guide](batch-processing.md) - Efficient mass audio processing

### Deep Dive
- [API Reference](../api-reference.md) - Complete API documentation
- [Preset Customization](preset-customization.md) - Create your own processing presets
- [Advanced Configuration](advanced-configuration.md) - Performance tuning and optimization

### Community
- [GitHub Repository](https://github.com/your-org/mcp-audio-packages) - Source code and issues
- [Community Discussions](https://github.com/your-org/mcp-audio-packages/discussions) - Share tips and get help

---

## Troubleshooting

If you encounter issues:

1. **Check the basics:**
   - Verify Node.js and FFmpeg are installed
   - Test packages in standalone mode first
   - Restart Claude Desktop after configuration changes

2. **Common fixes:**
   - Clear npm cache: `npm cache clean --force`
   - Reinstall packages: `npm uninstall -g mcp-audio-inspector mcp-audio-tweaker && npm install -g mcp-audio-inspector mcp-audio-tweaker`
   - Check file paths use absolute paths

3. **Get detailed help:**
   - Read the [Troubleshooting Guide](../troubleshooting.md)
   - Enable debug logging in your configuration
   - Check GitHub issues for similar problems

---

## Summary

You've successfully:
- ✅ Installed MCP Audio Packages and dependencies
- ✅ Configured Claude Desktop integration
- ✅ Analyzed audio files with Audio Inspector
- ✅ Processed audio files with Audio Tweaker
- ✅ Used presets for common audio tasks

The MCP Audio Packages are now ready to streamline your audio workflow. Whether you're developing games, creating content, or processing AI-generated voice, these tools provide professional-grade audio processing capabilities directly within Claude Desktop.

Happy audio processing! 🎵
