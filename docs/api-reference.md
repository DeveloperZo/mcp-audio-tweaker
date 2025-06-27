# API Reference

Complete API reference for MCP Audio Packages including all tools, parameters, and response formats.

## Table of Contents

- [Audio Inspector API](#audio-inspector-api)
- [Audio Tweaker API](#audio-tweaker-api)
- [Common Types](#common-types)
- [Error Handling](#error-handling)
- [Environment Variables](#environment-variables)

---

## Audio Inspector API

The Audio Inspector provides comprehensive audio file analysis through MCP tools.

### Tools

#### analyze_audio_file

Analyze a single audio file and extract comprehensive metadata.

**Parameters:**
- `filePath` (string, required): Absolute path to the audio file
- `includeGameAnalysis` (boolean, optional): Include game-specific analysis recommendations (default: true)

**Example Request:**
```json
{
  "tool": "analyze_audio_file",
  "arguments": {
    "filePath": "/path/to/audio.wav",
    "includeGameAnalysis": true
  }
}
```

**Response Schema:**
```json
{
  "success": true,
  "data": {
    "file": {
      "path": "string",
      "name": "string",
      "size": "number",
      "modified": "ISO 8601 date string"
    },
    "format": {
      "container": "string",
      "codec": "string", 
      "lossless": "boolean",
      "duration": "number",
      "bitrate": "number",
      "sampleRate": "number",
      "channels": "number",
      "bitsPerSample": "number"
    },
    "tags": {
      "title": "string",
      "artist": "string",
      "album": "string",
      "year": "number",
      "genre": "string",
      "track": "number",
      "comment": "string"
    },
    "gameAudio": {
      "suitableForLoop": "boolean",
      "recommendedCompressionFormat": "string",
      "estimatedMemoryUsage": "number",
      "platformOptimizations": {
        "mobile": "string",
        "desktop": "string",
        "console": "string"
      },
      "compressionRatio": "number",
      "gameDevNotes": "string"
    }
  }
}
```

#### analyze_audio_batch

Analyze all audio files in a directory and provide batch results.

**Parameters:**
- `directoryPath` (string, required): Absolute path to directory containing audio files
- `recursive` (boolean, optional): Search subdirectories recursively (default: false)
- `includeGameAnalysis` (boolean, optional): Include game-specific analysis (default: true)
- `filePattern` (string, optional): Glob pattern for file matching (default: "*")

**Example Request:**
```json
{
  "tool": "analyze_audio_batch",
  "arguments": {
    "directoryPath": "/path/to/audio/directory",
    "recursive": true,
    "includeGameAnalysis": true,
    "filePattern": "*.{wav,mp3,ogg}"
  }
}
```

**Response Schema:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalFiles": "number",
      "processedFiles": "number", 
      "failedFiles": "number",
      "totalDuration": "number",
      "totalSize": "number"
    },
    "files": [
      {
        // Same schema as analyze_audio_file response
      }
    ],
    "errors": [
      {
        "file": "string",
        "error": "string",
        "code": "string"
      }
    ]
  }
}
```

#### get_supported_formats

Get list of supported audio formats and their capabilities.

**Parameters:** None

**Response Schema:**
```json
{
  "success": true,
  "data": {
    "primaryFormats": [
      {
        "extension": "string",
        "mimeType": "string",
        "description": "string",
        "supports": {
          "metadata": "boolean",
          "streaming": "boolean",
          "tags": "boolean"
        }
      }
    ],
    "fallbackFormats": [
      {
        "extension": "string",
        "description": "string",
        "requiresFFprobe": "boolean"
      }
    ]
  }
}
```

---

## Audio Tweaker API

The Audio Tweaker provides comprehensive audio processing capabilities through MCP tools.

### Tools

#### process_audio_file

Process a single audio file with specified operations.

**Parameters:**
- `inputFile` (string, required): Absolute path to input audio file
- `outputFile` (string, required): Absolute path for output file
- `operations` (object, required): Audio processing operations to apply
- `overwrite` (boolean, optional): Whether to overwrite existing output file (default: false)

**Operations Object Schema:**
```json
{
  "volume": {
    "adjust": "number (-60 to +20)",
    "normalize": "boolean",
    "targetLUFS": "number (-60 to 0)"
  },
  "format": {
    "sampleRate": "number (8000, 16000, 22050, 44100, 48000, 96000, 192000)",
    "bitrate": "number (64-320)",
    "channels": "number (1, 2, 6, 8)",
    "codec": "string (pcm, mp3, aac, vorbis, flac)"
  },
  "effects": {
    "fadeIn": "number (seconds)",
    "fadeOut": "number (seconds)",
    "trim": {
      "start": "number (seconds)",
      "end": "number (seconds)"
    },
    "loop": {
      "enabled": "boolean",
      "count": "number"
    }
  }
}
```

**Example Request:**
```json
{
  "tool": "process_audio_file",
  "arguments": {
    "inputFile": "/path/to/input.wav",
    "outputFile": "/path/to/output.mp3",
    "operations": {
      "volume": {
        "normalize": true,
        "targetLUFS": -23
      },
      "format": {
        "sampleRate": 44100,
        "bitrate": 192,
        "codec": "mp3"
      },
      "effects": {
        "fadeIn": 0.1,
        "fadeOut": 0.2
      }
    },
    "overwrite": true
  }
}
```

**Response Schema:**
```json
{
  "success": true,
  "data": {
    "inputFile": "string",
    "outputFile": "string",
    "processingTime": "number",
    "inputSize": "number",
    "outputSize": "number",
    "compressionRatio": "number",
    "operationsApplied": "array",
    "ffmpegCommand": "string"
  }
}
```

#### batch_process_audio

Process multiple audio files in a directory with the same operations.

**Parameters:**
- `inputDirectory` (string, required): Directory containing input files
- `outputDirectory` (string, required): Directory for processed files
- `filePattern` (string, optional): Glob pattern for file matching (default: "*")
- `operations` (object, required): Audio processing operations (same schema as process_audio_file)
- `overwrite` (boolean, optional): Whether to overwrite existing files (default: false)

**Response Schema:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalFiles": "number",
      "processedFiles": "number",
      "failedFiles": "number",
      "totalProcessingTime": "number",
      "totalInputSize": "number",
      "totalOutputSize": "number"
    },
    "results": [
      {
        // Same schema as process_audio_file response
      }
    ],
    "errors": [
      {
        "file": "string",
        "error": "string",
        "code": "string"
      }
    ]
  }
}
```

#### apply_preset

Apply a predefined audio processing preset to a file.

**Parameters:**
- `inputFile` (string, required): Path to input audio file
- `outputFile` (string, required): Path for output file
- `preset` (string, required): Preset name to apply
- `overwrite` (boolean, optional): Whether to overwrite existing file (default: false)

**Available Presets:**
- `game-audio-mobile`: Optimized for mobile games (22kHz, OGG, -20 LUFS)
- `game-audio-desktop`: High-quality for desktop games (44.1kHz, MP3, -16 LUFS)
- `game-audio-console`: Premium quality for consoles (48kHz, FLAC, -14 LUFS)
- `elevenLabs-optimize`: Optimizes ElevenLabs AI voice output (22kHz, mono, MP3)
- `voice-processing`: General voice and dialogue processing (16kHz, mono, AAC)
- `music-mastering`: High-quality music mastering (44.1kHz, stereo, FLAC)
- `sfx-optimization`: Sound effects and ambient audio (44.1kHz, OGG, -18 LUFS)

**Response Schema:**
```json
{
  "success": true,
  "data": {
    "inputFile": "string",
    "outputFile": "string",
    "presetApplied": "string",
    "presetOperations": "object",
    "processingTime": "number",
    "inputSize": "number",
    "outputSize": "number"
  }
}
```

#### list_presets

List all available presets with their descriptions and operations.

**Parameters:**
- `category` (string, optional): Filter by category (`game`, `voice`, `music`, `effects`)

**Response Schema:**
```json
{
  "success": true,
  "data": {
    "presets": [
      {
        "name": "string",
        "category": "string",
        "description": "string",
        "operations": "object",
        "useCases": "array of strings"
      }
    ]
  }
}
```

#### get_queue_status

Get current status of the audio processing queue.

**Parameters:** None

**Response Schema:**
```json
{
  "success": true,
  "data": {
    "queueLength": "number",
    "activeJobs": "number",
    "completedJobs": "number",
    "failedJobs": "number",
    "currentJobs": [
      {
        "id": "string",
        "inputFile": "string",
        "outputFile": "string",
        "progress": "number (0-100)",
        "startTime": "ISO 8601 date string"
      }
    ]
  }
}
```

---

## Common Types

### File Information
```typescript
interface FileInfo {
  path: string;           // Absolute file path
  name: string;           // File name with extension
  size: number;           // File size in bytes
  modified: string;       // ISO 8601 date string
}
```

### Audio Format Information
```typescript
interface AudioFormat {
  container: string;      // Container format (WAV, MP3, OGG, etc.)
  codec: string;          // Audio codec (PCM, MP3, Vorbis, etc.)
  lossless: boolean;      // Whether format is lossless
  duration: number;       // Duration in seconds
  bitrate: number;        // Bitrate in kbps
  sampleRate: number;     // Sample rate in Hz
  channels: number;       // Number of audio channels
  bitsPerSample?: number; // Bit depth (for PCM formats)
}
```

### Audio Tags
```typescript
interface AudioTags {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  genre?: string;
  track?: number;
  comment?: string;
}
```

### Game Audio Analysis
```typescript
interface GameAudioAnalysis {
  suitableForLoop: boolean;              // Whether audio is suitable for looping
  recommendedCompressionFormat: string;   // Recommended format for compression
  estimatedMemoryUsage: number;          // Estimated memory usage in bytes
  platformOptimizations: {
    mobile: string;                      // Mobile platform recommendations
    desktop: string;                     // Desktop platform recommendations
    console: string;                     // Console platform recommendations
  };
  compressionRatio: number;              // Recommended compression ratio
  gameDevNotes: string;                  // Actionable development notes
}
```

---

## Error Handling

### Error Response Schema
```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": "object",
    "timestamp": "ISO 8601 date string"
  }
}
```

### Error Codes

#### Audio Inspector Error Codes
- `FILE_NOT_FOUND`: Input file does not exist or is not accessible
- `UNSUPPORTED_FORMAT`: Audio format is not supported by any available library
- `METADATA_EXTRACTION_FAILED`: Failed to extract metadata from file
- `FFPROBE_UNAVAILABLE`: FFprobe fallback is not available
- `CORRUPTED_FILE`: Audio file appears to be corrupted
- `PERMISSION_DENIED`: Insufficient permissions to read file
- `TIMEOUT`: Metadata extraction timed out

#### Audio Tweaker Error Codes
- `FILE_NOT_FOUND`: Input file does not exist
- `FFMPEG_NOT_FOUND`: FFmpeg is not installed or not in PATH
- `INVALID_PARAMETERS`: Processing parameters failed validation
- `OUTPUT_WRITE_FAILED`: Cannot write to output location
- `PROCESSING_FAILED`: FFmpeg processing operation failed
- `PRESET_NOT_FOUND`: Requested preset does not exist
- `INSUFFICIENT_DISK_SPACE`: Not enough disk space for output file
- `CODEC_NOT_SUPPORTED`: Requested codec is not available in FFmpeg build
- `QUEUE_FULL`: Processing queue has reached maximum capacity

### Error Handling Best Practices

1. **Always check the `success` field** in responses
2. **Use error codes for programmatic handling** rather than parsing messages
3. **Log error details** for debugging purposes
4. **Implement retry logic** for transient errors (timeouts, disk space)
5. **Validate parameters** before making API calls

---

## Environment Variables

### Audio Inspector Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `AUDIO_INSPECTOR_LOG_LEVEL` | Logging level | `info` | `debug`, `info`, `warn`, `error` |
| `FFPROBE_PATH` | Custom FFprobe binary path | Auto-detected | `/usr/local/bin/ffprobe` |
| `MUSIC_METADATA_TIMEOUT` | Metadata extraction timeout (ms) | `30000` | `60000` |
| `MAX_FILE_SIZE` | Maximum file size to process (bytes) | `524288000` | `1073741824` |
| `TEMP_DIR` | Temporary directory for processing | System temp | `/tmp/audio-inspector` |

### Audio Tweaker Environment Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `AUDIO_TWEAKER_LOG_LEVEL` | Logging level | `info` | `debug`, `info`, `warn`, `error` |
| `FFMPEG_PATH` | Custom FFmpeg binary path | Auto-detected | `/usr/local/bin/ffmpeg` |
| `AUDIO_TWEAKER_MAX_CONCURRENCY` | Max concurrent processes | `2` | `4` |
| `AUDIO_TWEAKER_TEMP_DIR` | Temporary directory | System temp | `/tmp/audio-tweaker` |
| `FFMPEG_TIMEOUT` | FFmpeg operation timeout (ms) | `300000` | `600000` |
| `QUEUE_MAX_SIZE` | Maximum queue size | `100` | `200` |

### Claude Desktop Configuration Example

```json
{
  "mcpServers": {
    "audio-inspector": {
      "command": "npx",
      "args": ["-y", "mcp-audio-inspector"],
      "env": {
        "AUDIO_INSPECTOR_LOG_LEVEL": "info",
        "MAX_FILE_SIZE": "1073741824",
        "MUSIC_METADATA_TIMEOUT": "60000"
      }
    },
    "audio-tweaker": {
      "command": "npx",
      "args": ["-y", "mcp-audio-tweaker"],
      "env": {
        "AUDIO_TWEAKER_LOG_LEVEL": "info",
        "AUDIO_TWEAKER_MAX_CONCURRENCY": "4",
        "FFMPEG_TIMEOUT": "600000"
      }
    }
  }
}
```

---

## Rate Limiting and Performance

### Request Limits
- **Audio Inspector**: No built-in rate limiting (limited by file I/O)
- **Audio Tweaker**: Queue-based processing with configurable concurrency

### Performance Considerations
- **File Size**: Larger files take longer to process
- **Concurrent Operations**: Limited by `AUDIO_TWEAKER_MAX_CONCURRENCY`
- **Disk I/O**: SSD storage recommended for better performance
- **Memory Usage**: Large files may require significant memory

### Optimization Tips
1. **Use appropriate file sizes** - avoid processing unnecessarily large files
2. **Batch operations** when possible for better efficiency
3. **Monitor system resources** during heavy processing
4. **Use presets** instead of custom operations when suitable
5. **Configure temp directories** on fast storage

---

## Version Compatibility

| API Version | Inspector Version | Tweaker Version | Claude Desktop |
|-------------|-------------------|-----------------|----------------|
| 1.0.0 | 1.0.0+ | 1.0.0+ | Latest |

### Breaking Changes
- **Version 1.0.0**: Initial API release

### Deprecation Policy
- Deprecated features will be marked in documentation
- Minimum 6 months notice before removal
- Migration guides provided for breaking changes

---

For more information, see:
- [Installation Guide](installation-guide.md)
- [Tutorials](tutorials/)
- [Troubleshooting Guide](troubleshooting.md)
- [GitHub Repository](https://github.com/your-org/mcp-audio-packages)
