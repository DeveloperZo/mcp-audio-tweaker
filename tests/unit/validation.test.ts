import { describe, it, expect } from '@jest/globals';
import {
  FilePathSchema,
  VolumeOperationSchema,
  FormatOperationSchema,
  EffectsOperationSchema,
  AudioOperationsSchema,
  ProcessingInputSchema,
  ProcessingOutputSchema,
  PresetNameSchema,
  ProcessAudioFileInputSchema,
  BatchProcessAudioInputSchema,
  ApplyPresetInputSchema,
  validateFilePath,
  validateAudioOperations,
  validateProcessingParameters
} from '../../src/schemas/validation.js';

describe('Validation Schemas', () => {
  describe('FilePathSchema', () => {
    it('should validate supported audio file extensions', () => {
      const validPaths = [
        'audio.mp3',
        'music.wav', 
        'sound.ogg',
        'voice.flac',
        'track.m4a',
        'clip.aac',
        '/path/to/file.MP3',
        'C:\\Windows\\audio.WAV'
      ];

      validPaths.forEach(path => {
        expect(() => FilePathSchema.parse(path)).not.toThrow();
      });
    });

    it('should reject unsupported file extensions', () => {
      const invalidPaths = [
        'document.txt',
        'image.jpg',
        'video.mp4',
        'data.json',
        'file.pdf',
        'audio',
        '',
        'audio.',
        '.mp3'
      ];

      invalidPaths.forEach(path => {
        expect(() => FilePathSchema.parse(path)).toThrow();
      });
    });

    it('should handle case insensitive extensions', () => {
      const casePaths = [
        'file.MP3',
        'file.Mp3',
        'file.mP3',
        'file.WAV',
        'file.OGG',
        'file.FLAC',
        'file.M4A',
        'file.AAC'
      ];

      casePaths.forEach(path => {
        expect(() => FilePathSchema.parse(path)).not.toThrow();
      });
    });
  });

  describe('VolumeOperationSchema', () => {
    it('should validate volume adjustment within range', () => {
      const validOperations = [
        { adjust: -60 },
        { adjust: 0 },
        { adjust: 20 },
        { adjust: -10.5 },
        { normalize: true },
        { normalize: false },
        { targetLUFS: -23 },
        { targetLUFS: -16 },
        { adjust: -6, normalize: true, targetLUFS: -20 }
      ];

      validOperations.forEach(op => {
        expect(() => VolumeOperationSchema.parse(op)).not.toThrow();
      });
    });

    it('should reject volume adjustment outside range', () => {
      const invalidOperations = [
        { adjust: -61 },
        { adjust: 21 },
        { adjust: 100 },
        { adjust: -100 }
      ];

      invalidOperations.forEach(op => {
        expect(() => VolumeOperationSchema.parse(op)).toThrow();
      });
    });

    it('should apply default values correctly', () => {
      const result = VolumeOperationSchema.parse({ normalize: true });
      expect(result.normalize).toBe(true);
    });

    it('should handle empty object', () => {
      const result = VolumeOperationSchema.parse({});
      expect(result).toEqual({});
    });
  });

  describe('FormatOperationSchema', () => {
    it('should validate all format parameters', () => {
      const validFormats = [
        { sampleRate: 44100 },
        { bitrate: 192 },
        { channels: 2 },
        { codec: 'mp3' },
        { 
          sampleRate: 48000,
          bitrate: 320,
          channels: 1,
          codec: 'aac'
        }
      ];

      validFormats.forEach(format => {
        expect(() => FormatOperationSchema.parse(format)).not.toThrow();
      });
    });

    it('should reject invalid sample rates', () => {
      const invalidSampleRates = [
        { sampleRate: 32000 },
        { sampleRate: 11025 },
        { sampleRate: 88200 }
      ];

      invalidSampleRates.forEach(format => {
        expect(() => FormatOperationSchema.parse(format)).toThrow();
      });
    });

    it('should reject invalid bitrates', () => {
      const invalidBitrates = [
        { bitrate: 32 },
        { bitrate: 63 },
        { bitrate: 321 },
        { bitrate: 1000 }
      ];

      invalidBitrates.forEach(format => {
        expect(() => FormatOperationSchema.parse(format)).toThrow();
      });
    });

    it('should reject invalid channel counts', () => {
      const invalidChannels = [
        { channels: 0 },
        { channels: 3 },
        { channels: 4 },
        { channels: 5 },
        { channels: 7 },
        { channels: 16 }
      ];

      invalidChannels.forEach(format => {
        expect(() => FormatOperationSchema.parse(format)).toThrow();
      });
    });

    it('should reject invalid codecs', () => {
      const invalidCodecs = [
        { codec: 'mp4' },
        { codec: 'wav' },
        { codec: 'unknown' },
        { codec: '' }
      ];

      invalidCodecs.forEach(format => {
        expect(() => FormatOperationSchema.parse(format)).toThrow();
      });
    });
  });

  describe('EffectsOperationSchema', () => {
    it('should validate fade effects', () => {
      const validEffects = [
        { fadeIn: 0 },
        { fadeIn: 2.5 },
        { fadeOut: 1.0 },
        { fadeIn: 1, fadeOut: 2 }
      ];

      validEffects.forEach(effect => {
        expect(() => EffectsOperationSchema.parse(effect)).not.toThrow();
      });
    });

    it('should validate trim effects', () => {
      const validTrims = [
        { trim: { start: 0, end: 10 } },
        { trim: { start: 5.5, end: 15.2 } },
        { trim: { start: 0, end: 0 } }
      ];

      validTrims.forEach(effect => {
        expect(() => EffectsOperationSchema.parse(effect)).not.toThrow();
      });
    });

    it('should validate loop effects', () => {
      const validLoops = [
        { loop: { enabled: true, count: 1 } },
        { loop: { enabled: false, count: 1 } },
        { loop: { enabled: true, count: 5 } }
      ];

      validLoops.forEach(effect => {
        expect(() => EffectsOperationSchema.parse(effect)).not.toThrow();
      });
    });

    it('should reject negative fade values', () => {
      const invalidFades = [
        { fadeIn: -1 },
        { fadeOut: -0.1 }
      ];

      invalidFades.forEach(effect => {
        expect(() => EffectsOperationSchema.parse(effect)).toThrow();
      });
    });

    it('should reject negative trim values', () => {
      const invalidTrims = [
        { trim: { start: -1, end: 10 } },
        { trim: { start: 0, end: -1 } },
        { trim: { start: -5, end: -1 } }
      ];

      invalidTrims.forEach(effect => {
        expect(() => EffectsOperationSchema.parse(effect)).toThrow();
      });
    });

    it('should reject invalid loop counts', () => {
      const invalidLoops = [
        { loop: { enabled: true, count: 0 } },
        { loop: { enabled: true, count: -1 } }
      ];

      invalidLoops.forEach(effect => {
        expect(() => EffectsOperationSchema.parse(effect)).toThrow();
      });
    });
  });

  describe('AudioOperationsSchema', () => {
    it('should validate complete operations', () => {
      const validOperations = [
        {},
        { volume: { adjust: -3 } },
        { format: { sampleRate: 44100 } },
        { effects: { fadeIn: 1 } },
        {
          volume: { adjust: -6, normalize: true },
          format: { sampleRate: 48000, channels: 2 },
          effects: { fadeIn: 1, fadeOut: 2, trim: { start: 0, end: 30 } }
        }
      ];

      validOperations.forEach(ops => {
        expect(() => AudioOperationsSchema.parse(ops)).not.toThrow();
      });
    });

    it('should allow empty operations object', () => {
      const result = AudioOperationsSchema.parse({});
      expect(result).toEqual({});
    });
  });

  describe('ProcessingInputSchema', () => {
    it('should validate file input', () => {
      const validInputs = [
        { file: '/path/to/audio.mp3' },
        { file: 'audio.wav', pattern: '*.wav' }
      ];

      validInputs.forEach(input => {
        expect(() => ProcessingInputSchema.parse(input)).not.toThrow();
      });
    });

    it('should validate directory input', () => {
      const validInputs = [
        { directory: '/path/to/audio' },
        { directory: '/audio', pattern: '*.mp3' }
      ];

      validInputs.forEach(input => {
        expect(() => ProcessingInputSchema.parse(input)).not.toThrow();
      });
    });

    it('should reject input without file or directory', () => {
      const invalidInputs = [
        {},
        { pattern: '*.mp3' },
        { file: '', directory: '' }
      ];

      invalidInputs.forEach(input => {
        expect(() => ProcessingInputSchema.parse(input)).toThrow();
      });
    });
  });

  describe('ProcessingOutputSchema', () => {
    it('should validate output configurations', () => {
      const validOutputs = [
        { file: '/output/audio.mp3' },
        { directory: '/output' },
        { directory: '/output', suffix: '_processed' },
        { directory: '/output', format: 'mp3' },
        { 
          directory: '/output',
          suffix: '_optimized',
          format: 'wav'
        }
      ];

      validOutputs.forEach(output => {
        expect(() => ProcessingOutputSchema.parse(output)).not.toThrow();
      });
    });

    it('should apply default suffix', () => {
      const result = ProcessingOutputSchema.parse({ directory: '/output' });
      expect(result.suffix).toBe('_processed');
    });

    it('should allow empty output for defaults', () => {
      const result = ProcessingOutputSchema.parse({});
      expect(result.suffix).toBe('_processed');
    });
  });

  describe('PresetNameSchema', () => {
    it('should validate all preset names', () => {
      const validPresets = [
        'game-audio-mobile',
        'game-audio-desktop',
        'game-audio-console',
        'elevenLabs-optimize',
        'voice-processing',
        'music-mastering',
        'sfx-optimization'
      ];

      validPresets.forEach(preset => {
        expect(() => PresetNameSchema.parse(preset)).not.toThrow();
      });
    });

    it('should reject invalid preset names', () => {
      const invalidPresets = [
        'invalid-preset',
        'game-audio',
        'optimization',
        '',
        'custom-preset'
      ];

      invalidPresets.forEach(preset => {
        expect(() => PresetNameSchema.parse(preset)).toThrow();
      });
    });
  });

  describe('MCP Tool Input Schemas', () => {
    describe('ProcessAudioFileInputSchema', () => {
      it('should validate process audio file input', () => {
        const validInput = {
          inputFile: 'audio.mp3',
          outputFile: 'processed.mp3',
          operations: {
            volume: { adjust: -3 },
            format: { sampleRate: 44100 }
          }
        };

        expect(() => ProcessAudioFileInputSchema.parse(validInput)).not.toThrow();
      });

      it('should reject invalid input file', () => {
        const invalidInput = {
          inputFile: 'document.txt',
          outputFile: 'processed.mp3',
          operations: {}
        };

        expect(() => ProcessAudioFileInputSchema.parse(invalidInput)).toThrow();
      });
    });

    describe('BatchProcessAudioInputSchema', () => {
      it('should validate batch processing input', () => {
        const validInput = {
          inputDirectory: '/input',
          outputDirectory: '/output',
          operations: {
            volume: { normalize: true }
          }
        };

        expect(() => BatchProcessAudioInputSchema.parse(validInput)).not.toThrow();
      });

      it('should apply default file pattern', () => {
        const input = {
          inputDirectory: '/input',
          outputDirectory: '/output',
          operations: {}
        };

        const result = BatchProcessAudioInputSchema.parse(input);
        expect(result.filePattern).toBe('*.{mp3,wav,ogg,flac,m4a,aac}');
      });
    });

    describe('ApplyPresetInputSchema', () => {
      it('should validate preset application input', () => {
        const validInput = {
          inputFile: 'audio.mp3',
          outputFile: 'processed.mp3',
          preset: 'game-audio-mobile'
        };

        expect(() => ApplyPresetInputSchema.parse(validInput)).not.toThrow();
      });

      it('should reject invalid preset', () => {
        const invalidInput = {
          inputFile: 'audio.mp3',
          outputFile: 'processed.mp3',
          preset: 'invalid-preset'
        };

        expect(() => ApplyPresetInputSchema.parse(invalidInput)).toThrow();
      });
    });
  });

  describe('Validation Helper Functions', () => {
    describe('validateFilePath', () => {
      it('should return true for valid paths', () => {
        expect(validateFilePath('audio.mp3')).toBe(true);
        expect(validateFilePath('sound.wav')).toBe(true);
        expect(validateFilePath('/path/to/music.flac')).toBe(true);
      });

      it('should return false for invalid paths', () => {
        expect(validateFilePath('document.txt')).toBe(false);
        expect(validateFilePath('')).toBe(false);
        expect(validateFilePath('audio')).toBe(false);
      });
    });

    describe('validateAudioOperations', () => {
      it('should return true for valid operations', () => {
        const validOps = {
          volume: { adjust: -3 },
          format: { sampleRate: 44100 }
        };
        
        expect(validateAudioOperations(validOps)).toBe(true);
        expect(validateAudioOperations({})).toBe(true);
      });

      it('should return false for invalid operations', () => {
        const invalidOps = {
          volume: { adjust: 100 },
          format: { sampleRate: 32000 }
        };
        
        expect(validateAudioOperations(invalidOps)).toBe(false);
        expect(validateAudioOperations(null)).toBe(false);
        expect(validateAudioOperations(undefined)).toBe(false);
      });
    });

    describe('validateProcessingParameters', () => {
      it('should return true for valid parameters', () => {
        const validParams = {
          input: { file: 'audio.mp3' },
          output: { directory: '/output' },
          operations: { volume: { adjust: -3 } }
        };
        
        expect(validateProcessingParameters(validParams)).toBe(true);
      });

      it('should return false for invalid parameters', () => {
        const invalidParams = {
          input: {},
          output: { directory: '/output' }
        };
        
        expect(validateProcessingParameters(invalidParams)).toBe(false);
        expect(validateProcessingParameters(null)).toBe(false);
      });
    });
  });

  describe('Edge Cases and Boundary Values', () => {
    it('should handle volume adjustment boundary values', () => {
      expect(() => VolumeOperationSchema.parse({ adjust: -60 })).not.toThrow();
      expect(() => VolumeOperationSchema.parse({ adjust: 20 })).not.toThrow();
      expect(() => VolumeOperationSchema.parse({ adjust: -60.1 })).toThrow();
      expect(() => VolumeOperationSchema.parse({ adjust: 20.1 })).toThrow();
    });

    it('should handle bitrate boundary values', () => {
      expect(() => FormatOperationSchema.parse({ bitrate: 64 })).not.toThrow();
      expect(() => FormatOperationSchema.parse({ bitrate: 320 })).not.toThrow();
      expect(() => FormatOperationSchema.parse({ bitrate: 63 })).toThrow();
      expect(() => FormatOperationSchema.parse({ bitrate: 321 })).toThrow();
    });

    it('should handle zero values appropriately', () => {
      expect(() => EffectsOperationSchema.parse({ fadeIn: 0 })).not.toThrow();
      expect(() => EffectsOperationSchema.parse({ trim: { start: 0, end: 0 } })).not.toThrow();
      expect(() => EffectsOperationSchema.parse({ loop: { enabled: true, count: 1 } })).not.toThrow();
    });

    it('should handle very large valid values', () => {
      expect(() => FormatOperationSchema.parse({ sampleRate: 192000 })).not.toThrow();
      expect(() => EffectsOperationSchema.parse({ fadeIn: 999999 })).not.toThrow();
      expect(() => EffectsOperationSchema.parse({ trim: { start: 0, end: 999999 } })).not.toThrow();
    });
  });
});
