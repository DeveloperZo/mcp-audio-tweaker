import { PresetDefinition, PresetName } from '../types/index.js';

export const PRESETS: Record<PresetName, PresetDefinition> = {
  'game-audio-mobile': {
    name: 'game-audio-mobile',
    description: 'Optimized for mobile game audio - compressed and efficient',
    operations: {
      format: {
        sampleRate: 22050,
        bitrate: 128,
        channels: 2,
        codec: 'aac'
      },
      volume: {
        normalize: true,
        targetLUFS: -16
      }
    },
    outputFormat: 'm4a'
  },
  
  'game-audio-desktop': {
    name: 'game-audio-desktop',
    description: 'High-quality audio for desktop games',
    operations: {
      format: {
        sampleRate: 44100,
        bitrate: 192,
        channels: 2,
        codec: 'vorbis'
      },
      volume: {
        normalize: true,
        targetLUFS: -18
      }
    },
    outputFormat: 'ogg'
  },
  
  'game-audio-console': {
    name: 'game-audio-console',
    description: 'Premium quality for console gaming platforms',
    operations: {
      format: {
        sampleRate: 48000,
        channels: 2,
        codec: 'pcm'
      },
      volume: {
        normalize: true,
        targetLUFS: -20
      }
    },
    outputFormat: 'wav'
  },
  
  'elevenLabs-optimize': {
    name: 'elevenLabs-optimize',
    description: 'Optimizes ElevenLabs AI voice output for game integration',
    operations: {
      format: {
        sampleRate: 22050,
        bitrate: 160,
        channels: 1,
        codec: 'mp3'
      },
      volume: {
        normalize: true,
        targetLUFS: -20
      },
      effects: {
        fadeIn: 0.05,
        fadeOut: 0.1
      }
    },
    outputFormat: 'mp3'
  },
  
  'voice-processing': {
    name: 'voice-processing',
    description: 'General voice and dialogue processing',
    operations: {
      format: {
        sampleRate: 22050,
        bitrate: 128,
        channels: 1,
        codec: 'mp3'
      },
      volume: {
        normalize: true,
        targetLUFS: -23
      },
      effects: {
        fadeIn: 0.02,
        fadeOut: 0.05
      }
    },
    outputFormat: 'mp3'
  },
  
  'music-mastering': {
    name: 'music-mastering',
    description: 'High-quality music mastering preset',
    operations: {
      format: {
        sampleRate: 44100,
        channels: 2,
        codec: 'flac'
      },
      volume: {
        normalize: true,
        targetLUFS: -14
      }
    },
    outputFormat: 'flac'
  },
  
  'sfx-optimization': {
    name: 'sfx-optimization',
    description: 'Optimized for sound effects and ambient audio',
    operations: {
      format: {
        sampleRate: 44100,
        bitrate: 160,
        channels: 1,
        codec: 'vorbis'
      },
      volume: {
        normalize: true,
        targetLUFS: -18
      }
    },
    outputFormat: 'ogg'
  },

  // Advanced presets defined directly
  'deep-mechanical': {
    name: 'deep-mechanical',
    description: 'Deep, mechanical sound with harmonic richness - perfect for unit cube captures',
    operations: {
      advanced: {
        pitch: { semitones: -3, preserveFormants: true },
        harmonics: { octaveDown: 0.3, fifthUp: 0.2 },
        spectral: { bassBoost: 4, midCut: -2, warmth: 0.4 },
        dynamics: {
          compressor: {
            threshold: -18,
            ratio: 3,
            attack: 5,
            release: 100,
          },
        },
      },
      volume: { normalize: true, targetLUFS: -18 },
    },
    outputFormat: 'wav',
  },

  'bright-crystalline': {
    name: 'bright-crystalline',
    description: 'Bright, crystalline sound with sparkle - great for special cubes',
    operations: {
      advanced: {
        pitch: { semitones: 2 },
        harmonics: { octaveUp: 0.25, thirdUp: 0.15 },
        spectral: { trebleBoost: 5, brightness: 0.6, warmth: 0.2 },
        modulation: {
          chorus: { rate: 0.5, depth: 0.3, delay: 15 },
        },
      },
      volume: { normalize: true, targetLUFS: -16 },
    },
    outputFormat: 'wav',
  },

  'variation-pack': {
    name: 'variation-pack',
    description: 'Generate 5 variations with controlled randomness',
    operations: {
      advanced: {
        variations: {
          count: 5,
          pitchRange: 2,
          volumeRange: 3,
          spectralRange: 2,
          seed: 42,
        },
      },
      volume: { normalize: true },
    },
    outputFormat: 'wav',
  },

  'layered-impact': {
    name: 'layered-impact',
    description: 'Self-layered sound for maximum impact',
    operations: {
      advanced: {
        layering: {
          layers: [
            { blend: 'mix', volume: 0.8 },
            { blend: 'add', volume: 0.4, pitch: 12, delay: 50 },
            { blend: 'add', volume: 0.3, pitch: -12, delay: 25 },
          ],
        },
        dynamics: {
          compressor: {
            threshold: -12,
            ratio: 4,
            attack: 1,
            release: 50,
          },
          limiter: {
            threshold: -6,
            release: 30,
          },
        },
      },
      volume: { normalize: true, targetLUFS: -14 },
    },
    outputFormat: 'wav',
  },

  'space-ambient': {
    name: 'space-ambient',
    description: 'Spacious, ambient processing with modulation',
    operations: {
      advanced: {
        spatial: {
          stereoWidth: 1.5,
          reverbSend: 0.4,
          delayTime: 150,
          delayFeedback: 0.25,
        },
        modulation: {
          tremolo: { rate: 0.3, depth: 0.2 },
          chorus: { rate: 0.2, depth: 0.4, delay: 25 },
        },
        spectral: { warmth: 0.5, brightness: 0.3 },
      },
      volume: { normalize: true, targetLUFS: -20 },
    },
    outputFormat: 'wav',
  },

  'punchy-game-sfx': {
    name: 'punchy-game-sfx',
    description: 'Tight, punchy sound optimized for game audio',
    operations: {
      advanced: {
        dynamics: {
          gate: {
            threshold: -40,
            ratio: 10,
            attack: 1,
            release: 10,
          },
          compressor: {
            threshold: -20,
            ratio: 6,
            attack: 0.5,
            release: 25,
            knee: 4,
          },
          limiter: {
            threshold: -3,
            release: 5,
          },
        },
        spectral: { bassBoost: 2, trebleBoost: 3 },
      },
      effects: {
        fadeIn: 0.001,
        fadeOut: 0.02,
      },
      volume: { normalize: true, targetLUFS: -16 },
    },
    outputFormat: 'wav',
  }
};

/**
 * Get preset by name
 */
export function getPreset(name: PresetName): PresetDefinition {
  const preset = PRESETS[name];
  if (!preset) {
    throw new Error(`Preset '${name}' not found`);
  }
  return preset;
}

/**
 * List all available presets
 */
export function listPresets(): PresetDefinition[] {
  return Object.values(PRESETS);
}

/**
 * Get preset names only
 */
export function getPresetNames(): PresetName[] {
  return Object.keys(PRESETS) as PresetName[];
}

/**
 * Check if preset exists
 */
export function presetExists(name: string): name is PresetName {
  return name in PRESETS;
}

/**
 * Get presets filtered by category
 */
export function getPresetsByCategory(category: 'game' | 'voice' | 'music' | 'effects'): PresetDefinition[] {
  const gamePresets = ['game-audio-mobile', 'game-audio-desktop', 'game-audio-console'];
  const voicePresets = ['elevenLabs-optimize', 'voice-processing'];
  const musicPresets = ['music-mastering'];
  const effectsPresets = ['sfx-optimization'];
  
  let presetNames: PresetName[] = [];
  
  switch (category) {
    case 'game':
      presetNames = gamePresets as PresetName[];
      break;
    case 'voice':
      presetNames = voicePresets as PresetName[];
      break;
    case 'music':
      presetNames = musicPresets as PresetName[];
      break;
    case 'effects':
      presetNames = effectsPresets as PresetName[];
      break;
  }
  
  return presetNames.map(name => PRESETS[name]);
}
