import { PresetDefinition } from '../types/index.js';

// Advanced presets that utilize the new capabilities
export const advancedPresets: PresetDefinition[] = [
  {
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
  {
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
  {
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
  {
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
  {
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
  {
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
  },
];

// Update the existing presets list
export const allPresets = [
  // Original presets would be imported here
  ...advancedPresets,
];