# MCP Audio Tweaker

A Model Context Protocol (MCP) server for batch audio processing and optimization using FFmpeg. This package provides parameter-based audio modifications including sample rate conversion, bitrate adjustment, volume control, channel configuration, and audio effects.

## Features

- 🎵 **Comprehensive Audio Processing**: Sample rate conversion, bitrate adjustment, volume control, channel configuration
- 🔧 **FFmpeg Integration**: Leverages FFmpeg for robust, cross-platform audio processing
- 📦 **Batch Processing**: Process multiple audio files concurrently with queue management
- 🎯 **Preset System**: Predefined configurations for common use cases (game audio, voice processing, music mastering)
- 🎮 **Game Audio Optimized**: Special presets for mobile, desktop, and console game development
- 🤖 **ElevenLabs Integration**: Optimized preset for ElevenLabs AI voice output
- 🔍 **MCP Compatible**: Full integration with Claude Desktop and other MCP clients
- ⚡ **Concurrent Processing**: Efficient queue-based processing for large batch operations
- 📊 **Detailed Reporting**: Comprehensive processing results and error handling

## Installation

```bash
npm install -g mcp-audio-tweaker
```

### Prerequisites

- Node.js 18.0.0 or higher
- FFmpeg installed and available in system PATH

#### Installing FFmpeg

**Windows:**
```bash
# Using Chocolatey
choco install ffmpeg

# Using winget
winget install FFmpeg
```

**macOS:**
```bash
# Using Homebrew
brew install ffmpeg
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install ffmpeg

# CentOS/RHEL
sudo yum install ffmpeg
```

## Quick Start

### MCP Integration with Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
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

### Standalone Usage

Check system requirements:
```bash
mcp-audio-tweaker --standalone check
```

Process a single file:
```bash
mcp-audio-tweaker --standalone process \
  --input input.wav \
  --output output.mp3 \
  --volume -3 \
  --sample-rate 44100 \
  --bitrate 192 \
  --normalize
```

Batch process with preset:
```bash
mcp-audio-tweaker --standalone batch \
  --input-dir ./audio/raw \
  --output-dir ./audio/processed \
  --preset game-audio-mobile
```

List available presets:
```bash
mcp-audio-tweaker --standalone presets
```

## MCP Tools

### process_audio_file

Process a single audio file with custom operations.

**Parameters:**
- `inputFile` (string): Path to input audio file
- `outputFile` (string): Path for output file
- `operations` (object): Audio processing operations
- `overwrite` (boolean): Whether to overwrite existing files

**Example:**
```json
{
  "inputFile": "/path/to/input.wav",
  "outputFile": "/path/to/output.mp3",
  "operations": {
    "volume": {
      "adjust": -3,
      "normalize": true,
      "targetLUFS": -20
    },
    "format": {
      "sampleRate": 44100,
      "bitrate": 192,
      "channels": 2,
      "codec": "mp3"
    },
    "effects": {
      "fadeIn": 0.1,
      "fadeOut": 0.2
    }
  }
}
```

### batch_process_audio

Process multiple audio files in a directory.

**Parameters:**
- `inputDirectory` (string): Directory containing input files
- `outputDirectory` (string): Directory for processed files
- `filePattern` (string): Glob pattern for file matching
- `operations` (object): Audio processing operations
- `overwrite` (boolean): Whether to overwrite existing files

### apply_preset

Apply predefined audio processing preset.

**Parameters:**
- `inputFile` (string): Path to input audio file
- `outputFile` (string): Path for output file
- `preset` (string): Preset name to apply
- `overwrite` (boolean): Whether to overwrite existing files

**Available Presets:**
- `game-audio-mobile`: Optimized for mobile games
- `game-audio-desktop`: High-quality for desktop games
- `game-audio-console`: Premium quality for consoles
- `elevenLabs-optimize`: Optimizes ElevenLabs AI voice output
- `voice-processing`: General voice and dialogue processing
- `music-mastering`: High-quality music mastering
- `sfx-optimization`: Sound effects and ambient audio

### list_presets

List all available presets with descriptions.

**Parameters:**
- `category` (string, optional): Filter by category (`game`, `voice`, `music`, `effects`)

### get_queue_status

Get current status of the audio processing queue.

## Audio Operations

### Volume Operations

```json
{
  "volume": {
    "adjust": -3,          // Volume adjustment in dB (-60 to +20)
    "normalize": true,     // Apply loudness normalization
    "targetLUFS": -23      // Target LUFS for normalization
  }
}
```

### Format Operations

```json
{
  "format": {
    "sampleRate": 44100,   // Sample rate (8000, 16000, 22050, 44100, 48000, 96000, 192000)
    "bitrate": 192,        // Bitrate in kbps (64-320)
    "channels": 2,         // Channel count (1, 2, 6, 8)
    "codec": "mp3"         // Codec (pcm, mp3, aac, vorbis, flac)
  }
}
```

### Effects Operations

```json
{
  "effects": {
    "fadeIn": 0.1,         // Fade in duration in seconds
    "fadeOut": 0.2,        // Fade out duration in seconds
    "trim": {              // Trim audio
      "start": 1.0,        // Start time in seconds
      "end": 30.0          // End time in seconds
    },
    "loop": {              // Loop audio
      "enabled": true,
      "count": 3           // Number of loops
    }
  }
}
```

## Claude Desktop Usage Examples

### Optimize ElevenLabs Voice Output

```
@audio-tweaker Apply the elevenLabs-optimize preset to the file /audio/voice-output.wav and save it as /audio/optimized-voice.mp3
```

### Batch Process Game Audio

```
@audio-tweaker Process all WAV files in /game-assets/audio/raw/ using the game-audio-mobile preset and save them to /game-assets/audio/mobile/
```

### Custom Voice Processing

```
@audio-tweaker Process /recordings/dialogue.wav with the following operations: normalize audio to -20 LUFS, convert to 22kHz mono MP3 at 128kbps, add 0.05s fade in and 0.1s fade out, and save as /processed/dialogue.mp3
```

### Check Audio Processing Status

```
@audio-tweaker What's the current status of the audio processing queue?
```

## Workflow Integration

### Game Development Workflow

1. **Generate AI Voice with ElevenLabs**
2. **Optimize with MCP Audio Tweaker**: Apply `elevenLabs-optimize` preset
3. **Platform-specific Processing**: Use `game-audio-mobile`, `game-audio-desktop`, or `game-audio-console` presets
4. **Integration**: Import optimized audio into game engine

### Music Production Workflow

1. **Record/Import Audio**
2. **Master with Audio Tweaker**: Apply `music-mastering` preset
3. **Platform Optimization**: Create platform-specific versions
4. **Distribution**: Export in required formats

## Configuration

### Environment Variables

- `AUDIO_TWEAKER_LOG_LEVEL`: Set logging level (`debug`, `info`, `warn`, `error`)
- `FFMPEG_PATH`: Custom FFmpeg binary path (optional)

### Advanced Configuration

The package supports advanced FFmpeg configurations through direct parameter passing. See the FFmpeg documentation for additional options.

## Error Handling

The package provides comprehensive error handling with specific error codes:

- `FILE_NOT_FOUND`: Input file does not exist
- `FFMPEG_NOT_FOUND`: FFmpeg not installed or not in PATH
- `INVALID_PARAMETERS`: Processing parameters validation failed
- `OUTPUT_WRITE_FAILED`: Cannot write to output location
- `PROCESSING_FAILED`: FFmpeg processing failed
- `PRESET_NOT_FOUND`: Requested preset does not exist

## Performance

- **Concurrent Processing**: Default 2 concurrent operations (configurable)
- **Queue Management**: Efficient processing queue with pause/resume capabilities
- **Memory Efficient**: Streams audio data without loading entire files into memory
- **Cross-platform**: Optimized for Windows, macOS, and Linux

## Supported Formats

**Input Formats:** MP3, WAV, OGG, FLAC, M4A, AAC
**Output Formats:** MP3, WAV, OGG, FLAC, M4A, AAC

## Development

### Building from Source

```bash
git clone https://github.com/your-org/mcp-audio-tweaker.git
cd mcp-audio-tweaker
npm install
npm run build
```

### Running Tests

```bash
npm test
npm run test:coverage
npm run test:ffmpeg
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## Complete Documentation

This README provides a quick overview. For comprehensive documentation:

### 🚀 Getting Started
- **[Installation Guide](/docs/installation-guide.md)**: Complete setup instructions
- **[Quick Start Tutorial](/docs/quick-start.md)**: Get running in 15 minutes
- **[API Reference](/docs/api-reference.md)**: Complete API documentation

### 🔧 Support & Troubleshooting
- **[Troubleshooting Guide](/docs/troubleshooting.md)**: Common issues and solutions
- **[Contributing Guide](/docs/contributing.md)**: How to contribute to the project

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/DeveloperZo/mcp-audio-tweaker/issues)
- **Documentation**: [README](https://github.com/DeveloperZo/mcp-audio-tweaker#readme)
- **Community**: [Discussions](https://github.com/DeveloperZo/mcp-audio-tweaker/discussions)

## Acknowledgments

- Built with [FFmpeg](https://ffmpeg.org/) for audio processing
- Uses [Model Context Protocol](https://github.com/modelcontextprotocol) for Claude Desktop integration
- Designed for [Infinity Cube](https://github.com/your-org/infinity-cube) game audio workflow
