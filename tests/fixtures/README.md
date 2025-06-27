# Test Fixtures

This directory contains test assets and fixtures used by the test suite.

## Audio Test Files

### Sample Audio Files
- `sample.mp3` - Short MP3 file for basic testing (44.1kHz, stereo, 128kbps)
- `sample.wav` - Uncompressed WAV file for quality testing (44.1kHz, stereo, 16-bit)
- `sample.ogg` - Ogg Vorbis file for format testing
- `sample.flac` - Lossless FLAC file for high-quality testing
- `sample.m4a` - AAC file for mobile testing
- `sample.aac` - Raw AAC file for codec testing

### Special Test Cases
- `mono.wav` - Mono audio file for channel testing
- `48khz.wav` - 48kHz sample rate file
- `large.wav` - Large file for stress testing (>100MB)
- `tiny.mp3` - Very small file for edge case testing (<1KB)
- `silent.wav` - Silent audio for null input testing
- `corrupt.mp3` - Intentionally corrupted file for error testing

### ElevenLabs Test Files
- `elevenlabs_voice.wav` - Simulated ElevenLabs AI voice output
- `elevenlabs_processed.mp3` - Expected result after optimization

### Game Audio Test Files
- `game_music.ogg` - Background music example
- `game_sfx.wav` - Sound effect example
- `game_voice.mp3` - Dialogue example

## JSON Test Data

### Processing Configurations
- `test_operations.json` - Sample audio operations for testing
- `test_presets.json` - Custom preset definitions for testing
- `batch_config.json` - Batch processing configurations

### Expected Results
- `expected_metadata.json` - Expected metadata extraction results
- `expected_processing_results.json` - Expected processing outcomes

## Usage in Tests

Test files should be accessed using relative paths from the test directory:

```typescript
import path from 'path';

const fixturesDir = path.join(__dirname, '..', 'fixtures');
const sampleAudio = path.join(fixturesDir, 'sample.mp3');
```

## Note

Due to Git LFS limitations, actual audio files are not included in the repository. Tests should generate mock files or use very small sample files where necessary.
