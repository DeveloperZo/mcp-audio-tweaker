#!/usr/bin/env node

/**
 * Example usage of mcp-audio-tweaker in standalone mode
 * This demonstrates how to use the package programmatically
 */

import AudioProcessor from '../build/services/audio-processor.js';
import { getPreset } from '../build/utils/presets.js';
import { checkFFmpegAvailability } from '../build/utils/ffmpeg.js';

async function main() {
  console.log('MCP Audio Tweaker - Example Usage\n');

  // Check if FFmpeg is available
  console.log('1. Checking FFmpeg availability...');
  const ffmpegAvailable = await checkFFmpegAvailability();
  console.log(`   FFmpeg available: ${ffmpegAvailable ? '✓' : '✗'}\n`);

  if (!ffmpegAvailable) {
    console.log('   Please install FFmpeg to run audio processing examples.');
    console.log('   Visit: https://ffmpeg.org/download.html\n');
    return;
  }

  // Create audio processor instance
  const audioProcessor = new AudioProcessor();

  // Example 1: List available presets
  console.log('2. Available presets:');
  const { listPresets } = await import('../build/utils/presets.js');
  const presets = listPresets();
  presets.forEach(preset => {
    console.log(`   - ${preset.name}: ${preset.description}`);
  });
  console.log();

  // Example 2: Show ElevenLabs optimization preset
  console.log('3. ElevenLabs optimization preset details:');
  const elevenLabsPreset = getPreset('elevenLabs-optimize');
  console.log(JSON.stringify(elevenLabsPreset, null, 2));
  console.log();

  // Example 3: Show queue status
  console.log('4. Current queue status:');
  const queueStatus = audioProcessor.getQueueStatus();
  console.log(JSON.stringify(queueStatus, null, 2));
  console.log();

  // Example 4: Demonstrate validation
  console.log('5. File path validation examples:');
  const { validateFilePath } = await import('../build/schemas/validation.js');
  const testFiles = [
    'audio.mp3',
    'voice.wav', 
    'music.flac',
    'invalid.txt',
    'no-extension'
  ];
  
  testFiles.forEach(file => {
    const isValid = validateFilePath(file);
    console.log(`   ${file}: ${isValid ? '✓' : '✗'}`);
  });
  console.log();

  // Example 5: Show audio operations structure
  console.log('6. Example audio operations:');
  const exampleOperations = {
    volume: {
      adjust: -3,
      normalize: true,
      targetLUFS: -20
    },
    format: {
      sampleRate: 44100,
      bitrate: 192,
      channels: 2,
      codec: 'mp3'
    },
    effects: {
      fadeIn: 0.1,
      fadeOut: 0.2
    }
  };
  console.log(JSON.stringify(exampleOperations, null, 2));
  console.log();

  console.log('Example completed! 🎵');
  console.log('\nTo process actual audio files, use:');
  console.log('  mcp-audio-tweaker --standalone process --help');
  console.log('  mcp-audio-tweaker --standalone batch --help');
}

main().catch(error => {
  console.error('Example failed:', error.message);
  process.exit(1);
});
