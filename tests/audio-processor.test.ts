import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import AudioProcessor from '../src/services/audio-processor.js';
import { getPreset, presetExists } from '../src/utils/presets.js';
import { validateFilePath, validateAudioOperations } from '../src/schemas/validation.js';
import { AudioOperations, ProcessingInput, ProcessingOutput } from '../src/types/index.js';

// Mock dependencies
jest.mock('fluent-ffmpeg');
jest.mock('glob');
jest.mock('fs', () => ({
  promises: {
    stat: jest.fn(),
    access: jest.fn(),
    mkdir: jest.fn(),
    unlink: jest.fn()
  },
  constants: {
    R_OK: 4,
    W_OK: 2,
    F_OK: 0
  }
}));

const mockGlob = jest.mocked(await import('glob')).glob;
const mockFs = jest.mocked((await import('fs')).promises);
const mockFfmpeg = jest.mocked(await import('fluent-ffmpeg')).default;

describe('AudioProcessor', () => {
  let audioProcessor: AudioProcessor;
  let mockCommand: any;

  beforeEach(() => {
    audioProcessor = new AudioProcessor();
    jest.clearAllMocks();
    
    // Setup mock FFmpeg command
    mockCommand = {
      audioFilters: jest.fn().mockReturnThis(),
      audioFrequency: jest.fn().mockReturnThis(),
      audioChannels: jest.fn().mockReturnThis(),
      audioCodec: jest.fn().mockReturnThis(),
      audioBitrate: jest.fn().mockReturnThis(),
      seekInput: jest.fn().mockReturnThis(),
      duration: jest.fn().mockReturnThis(),
      output: jest.fn().mockReturnThis(),
      on: jest.fn().mockReturnThis(),
      run: jest.fn()
    };

    (mockFfmpeg as any).mockReturnValue(mockCommand);
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should create an AudioProcessor instance', () => {
      expect(audioProcessor).toBeInstanceOf(AudioProcessor);
    });

    it('should have queue management methods', () => {
      expect(typeof audioProcessor.getQueueStatus).toBe('function');
      expect(typeof audioProcessor.pause).toBe('function');
      expect(typeof audioProcessor.resume).toBe('function');
      expect(typeof audioProcessor.clear).toBe('function');
    });
  });

  describe('queue status', () => {
    it('should return initial queue status', () => {
      const status = audioProcessor.getQueueStatus();
      expect(status).toHaveProperty('size');
      expect(status).toHaveProperty('pending');
      expect(status).toHaveProperty('isPaused');
    });
  });
});

describe('Presets', () => {
  describe('getPreset', () => {
    it('should return valid preset for game-audio-mobile', () => {
      const preset = getPreset('game-audio-mobile');
      expect(preset).toHaveProperty('name', 'game-audio-mobile');
      expect(preset).toHaveProperty('description');
      expect(preset).toHaveProperty('operations');
      expect(preset).toHaveProperty('outputFormat');
    });

    it('should return valid preset for elevenLabs-optimize', () => {
      const preset = getPreset('elevenLabs-optimize');
      expect(preset).toHaveProperty('name', 'elevenLabs-optimize');
      expect(preset.operations).toHaveProperty('format');
      expect(preset.operations.format).toHaveProperty('channels', 1);
    });

    it('should throw error for invalid preset', () => {
      expect(() => getPreset('invalid-preset' as any)).toThrow();
    });
  });

  describe('presetExists', () => {
    it('should return true for valid presets', () => {
      expect(presetExists('game-audio-mobile')).toBe(true);
      expect(presetExists('elevenLabs-optimize')).toBe(true);
      expect(presetExists('voice-processing')).toBe(true);
    });

    it('should return false for invalid presets', () => {
      expect(presetExists('invalid-preset')).toBe(false);
      expect(presetExists('')).toBe(false);
    });
  });
});

describe('Validation', () => {
  describe('validateFilePath', () => {
    it('should validate supported audio file extensions', () => {
      expect(validateFilePath('test.mp3')).toBe(true);
      expect(validateFilePath('test.wav')).toBe(true);
      expect(validateFilePath('test.ogg')).toBe(true);
      expect(validateFilePath('test.flac')).toBe(true);
      expect(validateFilePath('test.m4a')).toBe(true);
      expect(validateFilePath('test.aac')).toBe(true);
    });

    it('should reject unsupported file extensions', () => {
      expect(validateFilePath('test.txt')).toBe(false);
      expect(validateFilePath('test.jpg')).toBe(false);
      expect(validateFilePath('test')).toBe(false);
      expect(validateFilePath('')).toBe(false);
    });

    it('should handle case insensitive extensions', () => {
      expect(validateFilePath('test.MP3')).toBe(true);
      expect(validateFilePath('test.WAV')).toBe(true);
    });
  });

  describe('validateAudioOperations', () => {
    it('should validate valid operations', () => {
      const validOperations = {
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
        }
      };
      expect(validateAudioOperations(validOperations)).toBe(true);
    });

    it('should reject invalid volume values', () => {
      const invalidOperations = {
        volume: {
          adjust: 100 // Too high
        }
      };
      expect(validateAudioOperations(invalidOperations)).toBe(false);
    });

    it('should reject invalid sample rates', () => {
      const invalidOperations = {
        format: {
          sampleRate: 32000 // Not in enum
        }
      };
      expect(validateAudioOperations(invalidOperations)).toBe(false);
    });
  });
});

  describe('Batch Processing', () => {
    beforeEach(() => {
      mockFs.stat.mockResolvedValue({ isFile: () => true } as any);
      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);
      
      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end') {
          setTimeout(() => callback(), 0);
        }
        return mockCommand;
      });
    });

    it('should process multiple files in batch', async () => {
      const mockFiles = ['/input/file1.mp3', '/input/file2.wav', '/input/file3.ogg'];
      (mockGlob as jest.Mock).mockResolvedValue(mockFiles);

      const input: ProcessingInput = {
        directory: '/input',
        pattern: '*.{mp3,wav,ogg}'
      };
      
      const output: ProcessingOutput = {
        directory: '/output',
        suffix: '_processed'
      };
      
      const operations: AudioOperations = {
        volume: { normalize: true }
      };

      const result = await audioProcessor.batchProcessAudio(input, output, operations, false);

      expect(result.totalFiles).toBe(3);
      expect(result.successfulFiles).toBe(3);
      expect(result.failedFiles).toBe(0);
      expect(result.results).toHaveLength(3);
      expect(mockCommand.run).toHaveBeenCalledTimes(3);
    });

    it('should handle no files found', async () => {
      (mockGlob as jest.Mock).mockResolvedValue([]);

      const input: ProcessingInput = { directory: '/empty' };
      const output: ProcessingOutput = { directory: '/output' };

      await expect(audioProcessor.batchProcessAudio(input, output, {}, false))
        .rejects.toThrow('No audio files found');
    });
  });

  describe('Real-world Scenarios', () => {
    beforeEach(() => {
      mockFs.stat.mockResolvedValue({ isFile: () => true } as any);
      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);
      
      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end') {
          setTimeout(() => callback(), 0);
        }
        return mockCommand;
      });
    });

    it('should handle ElevenLabs voice optimization workflow', async () => {
      const operations: AudioOperations = {
        format: {
          sampleRate: 22050,
          channels: 1,
          codec: 'mp3',
          bitrate: 160
        },
        volume: {
          normalize: true,
          targetLUFS: -20
        },
        effects: {
          fadeIn: 0.05,
          fadeOut: 0.1
        }
      };

      const result = await audioProcessor.processAudioFile(
        '/input/elevenlabs_voice.wav',
        '/output/game_voice.mp3',
        operations,
        true
      );

      expect(result.success).toBe(true);
      expect(mockCommand.audioFrequency).toHaveBeenCalledWith(22050);
      expect(mockCommand.audioChannels).toHaveBeenCalledWith(1);
      expect(mockCommand.audioCodec).toHaveBeenCalledWith('libmp3lame');
      expect(mockCommand.audioBitrate).toHaveBeenCalledWith('160k');
      expect(mockCommand.audioFilters).toHaveBeenCalledWith('loudnorm=I=-20:LRA=7:tp=-2');
    });

    it('should handle game audio optimization workflow', async () => {
      const operations: AudioOperations = {
        format: {
          sampleRate: 44100,
          channels: 2,
          codec: 'vorbis',
          bitrate: 192
        },
        volume: {
          normalize: true,
          targetLUFS: -18
        }
      };

      const result = await audioProcessor.processAudioFile(
        '/input/game_music.wav',
        '/output/game_music.ogg',
        operations,
        false
      );

      expect(result.success).toBe(true);
      expect(mockCommand.audioCodec).toHaveBeenCalledWith('libvorbis');
      expect(mockCommand.audioBitrate).toHaveBeenCalledWith('192k');
    });
  });

describe('Error Handling', () => {
  it('should handle FFmpeg not found gracefully', async () => {
    // Mock which to throw error
    const { default: which } = await import('which');
    (which as jest.Mock).mockRejectedValueOnce(new Error('Command not found'));
    
    const { checkFFmpegAvailability } = await import('../src/utils/ffmpeg.js');
    const available = await checkFFmpegAvailability();
    expect(available).toBe(false);
  });

  it('should handle processing failures gracefully', async () => {
    mockFs.stat.mockResolvedValue({ isFile: () => true } as any);
    mockFs.access.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined);

    // Mock FFmpeg failure
    mockCommand.on.mockImplementation((event: string, callback: Function) => {
      if (event === 'error') {
        setTimeout(() => callback(new Error('FFmpeg processing failed')), 0);
      }
      return mockCommand;
    });

    const result = await audioProcessor.processAudioFile(
      '/input/test.mp3',
      '/output/failed.mp3',
      { volume: { adjust: -3 } },
      false
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('FFmpeg processing failed');
  });
});
