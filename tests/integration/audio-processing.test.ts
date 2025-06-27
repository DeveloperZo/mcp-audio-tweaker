import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import AudioProcessor from '../../src/services/audio-processor.js';
import { AudioOperations, ProcessingInput, ProcessingOutput } from '../../src/types/index.js';

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
const mockFs = jest.mocked(fs.promises);
const mockFfmpeg = jest.mocked(await import('fluent-ffmpeg')).default;

describe('Audio Processing Integration', () => {
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

  describe('Single File Processing', () => {
    beforeEach(() => {
      // Mock successful file validation
      mockFs.stat.mockResolvedValue({
        isFile: () => true
      } as any);
      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      // Mock successful FFmpeg execution
      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end') {
          setTimeout(() => callback(), 0);
        }
        return mockCommand;
      });
    });

    it('should process single audio file with volume operations', async () => {
      const operations: AudioOperations = {
        volume: {
          adjust: -3,
          normalize: true,
          targetLUFS: -20
        }
      };

      const result = await audioProcessor.processAudioFile(
        '/input/audio.mp3',
        '/output/processed.mp3',
        operations,
        false
      );

      expect(result.success).toBe(true);
      expect(result.inputFile).toBe('/input/audio.mp3');
      expect(result.outputFile).toBe('/output/processed.mp3');
      expect(result.operations).toEqual(operations);
      expect(result.processingTime).toBeGreaterThan(0);

      // Verify FFmpeg commands were called
      expect(mockCommand.audioFilters).toHaveBeenCalledWith('volume=-3dB');
      expect(mockCommand.audioFilters).toHaveBeenCalledWith('loudnorm=I=-20:LRA=7:tp=-2');
      expect(mockCommand.output).toHaveBeenCalledWith('/output/processed.mp3');
      expect(mockCommand.run).toHaveBeenCalled();
    });

    it('should process single audio file with format operations', async () => {
      const operations: AudioOperations = {
        format: {
          sampleRate: 44100,
          bitrate: 192,
          channels: 2,
          codec: 'mp3'
        }
      };

      const result = await audioProcessor.processAudioFile(
        '/input/audio.wav',
        '/output/converted.mp3',
        operations,
        true
      );

      expect(result.success).toBe(true);

      // Verify format operations were applied
      expect(mockCommand.audioFrequency).toHaveBeenCalledWith(44100);
      expect(mockCommand.audioBitrate).toHaveBeenCalledWith('192k');
      expect(mockCommand.audioChannels).toHaveBeenCalledWith(2);
      expect(mockCommand.audioCodec).toHaveBeenCalledWith('libmp3lame');
    });

    it('should process single audio file with effects operations', async () => {
      const operations: AudioOperations = {
        effects: {
          fadeIn: 1.0,
          fadeOut: 2.0,
          trim: {
            start: 5.0,
            end: 15.0
          },
          loop: {
            enabled: true,
            count: 3
          }
        }
      };

      const result = await audioProcessor.processAudioFile(
        '/input/audio.wav',
        '/output/effects.wav',
        operations,
        false
      );

      expect(result.success).toBe(true);

      // Verify effects were applied
      expect(mockCommand.seekInput).toHaveBeenCalledWith(5.0);
      expect(mockCommand.duration).toHaveBeenCalledWith(10.0);
      expect(mockCommand.audioFilters).toHaveBeenCalledWith([
        'afade=t=in:ss=0:d=1',
        'afade=t=out:st=2:d=1',
        'aloop=loop=2:size=samples'
      ]);
    });

    it('should handle complex operations combination', async () => {
      const operations: AudioOperations = {
        volume: {
          adjust: -6,
          normalize: true,
          targetLUFS: -18
        },
        format: {
          sampleRate: 48000,
          channels: 1,
          codec: 'aac',
          bitrate: 128
        },
        effects: {
          fadeIn: 0.5,
          fadeOut: 1.0
        }
      };

      const result = await audioProcessor.processAudioFile(
        '/input/stereo.wav',
        '/output/mono.m4a',
        operations,
        true
      );

      expect(result.success).toBe(true);

      // Verify all operations were applied
      expect(mockCommand.audioFilters).toHaveBeenCalledWith('volume=-6dB');
      expect(mockCommand.audioFilters).toHaveBeenCalledWith('loudnorm=I=-18:LRA=7:tp=-2');
      expect(mockCommand.audioFrequency).toHaveBeenCalledWith(48000);
      expect(mockCommand.audioChannels).toHaveBeenCalledWith(1);
      expect(mockCommand.audioCodec).toHaveBeenCalledWith('aac');
      expect(mockCommand.audioBitrate).toHaveBeenCalledWith('128k');
      expect(mockCommand.audioFilters).toHaveBeenCalledWith([
        'afade=t=in:ss=0:d=0.5',
        'afade=t=out:st=1:d=1'
      ]);
    });

    it('should handle processing errors gracefully', async () => {
      // Mock FFmpeg error
      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('FFmpeg encoding failed')), 0);
        }
        return mockCommand;
      });

      const operations: AudioOperations = {
        volume: { adjust: -3 }
      };

      const result = await audioProcessor.processAudioFile(
        '/input/audio.mp3',
        '/output/failed.mp3',
        operations,
        false
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('FFmpeg processing failed');
      expect(result.inputFile).toBe('/input/audio.mp3');
      expect(result.outputFile).toBe('/output/failed.mp3');
    });

    it('should handle file validation errors', async () => {
      // Mock file not found
      mockFs.stat.mockRejectedValue(new Error('ENOENT: no such file'));

      const operations: AudioOperations = {
        volume: { adjust: -3 }
      };

      const result = await audioProcessor.processAudioFile(
        '/input/nonexistent.mp3',
        '/output/failed.mp3',
        operations,
        false
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot access input file');
    });

    it('should handle output file conflicts', async () => {
      // Mock existing output file
      mockFs.stat.mockResolvedValue({
        isFile: () => true
      } as any);
      
      // First access call for input validation
      // Second access call for output file check
      mockFs.access
        .mockResolvedValueOnce(undefined)  // Input file exists
        .mockResolvedValueOnce(undefined); // Output file exists

      const operations: AudioOperations = {
        volume: { adjust: -3 }
      };

      const result = await audioProcessor.processAudioFile(
        '/input/audio.mp3',
        '/output/existing.mp3',
        operations,
        false  // Don't overwrite
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Output file already exists');
    });
  });

  describe('Batch Processing', () => {
    beforeEach(() => {
      // Mock successful file validation for all files
      mockFs.stat.mockResolvedValue({
        isFile: () => true
      } as any);
      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      // Mock successful FFmpeg execution
      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end') {
          setTimeout(() => callback(), 0);
        }
        return mockCommand;
      });
    });

    it('should process multiple files in a directory', async () => {
      // Mock glob to return test files
      (mockGlob as jest.Mock).mockResolvedValue([
        '/input/audio1.mp3',
        '/input/audio2.wav',
        '/input/audio3.ogg'
      ]);

      const input: ProcessingInput = {
        directory: '/input',
        pattern: '*.{mp3,wav,ogg}'
      };

      const output: ProcessingOutput = {
        directory: '/output',
        suffix: '_processed'
      };

      const operations: AudioOperations = {
        volume: { normalize: true },
        format: { sampleRate: 44100 }
      };

      const result = await audioProcessor.batchProcessAudio(
        input,
        output,
        operations,
        false
      );

      expect(result.totalFiles).toBe(3);
      expect(result.successfulFiles).toBe(3);
      expect(result.failedFiles).toBe(0);
      expect(result.results).toHaveLength(3);
      expect(result.totalProcessingTime).toBeGreaterThan(0);

      // Verify all files were processed
      expect(result.results[0].inputFile).toBe('/input/audio1.mp3');
      expect(result.results[1].inputFile).toBe('/input/audio2.wav');
      expect(result.results[2].inputFile).toBe('/input/audio3.ogg');

      // Verify FFmpeg was called for each file
      expect(mockCommand.run).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success and failure in batch processing', async () => {
      (mockGlob as jest.Mock).mockResolvedValue([
        '/input/audio1.mp3',
        '/input/audio2.wav'
      ]);

      // Mock one success and one failure
      let callCount = 0;
      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end' && callCount === 0) {
          callCount++;
          setTimeout(() => callback(), 0);
        } else if (event === 'error' && callCount === 1) {
          setTimeout(() => callback(new Error('Processing failed')), 0);
        }
        return mockCommand;
      });

      const input: ProcessingInput = {
        directory: '/input'
      };

      const output: ProcessingOutput = {
        directory: '/output'
      };

      const operations: AudioOperations = {
        format: { codec: 'mp3' }
      };

      const result = await audioProcessor.batchProcessAudio(
        input,
        output,
        operations,
        false
      );

      expect(result.totalFiles).toBe(2);
      expect(result.successfulFiles).toBe(1);
      expect(result.failedFiles).toBe(1);
    });

    it('should handle no files found scenario', async () => {
      (mockGlob as jest.Mock).mockResolvedValue([]);

      const input: ProcessingInput = {
        directory: '/input',
        pattern: '*.unknown'
      };

      const output: ProcessingOutput = {
        directory: '/output'
      };

      const operations: AudioOperations = {};

      await expect(audioProcessor.batchProcessAudio(input, output, operations, false))
        .rejects.toThrow('No audio files found matching the criteria');
    });

    it('should generate correct output paths for batch processing', async () => {
      (mockGlob as jest.Mock).mockResolvedValue([
        '/input/subfolder/music.mp3',
        '/input/voice.wav'
      ]);

      const input: ProcessingInput = {
        directory: '/input'
      };

      const output: ProcessingOutput = {
        directory: '/output',
        suffix: '_optimized',
        format: 'ogg'
      };

      const operations: AudioOperations = {
        format: { codec: 'vorbis' }
      };

      await audioProcessor.batchProcessAudio(input, output, operations, false);

      // Verify correct output paths were generated
      const calls = mockCommand.output.mock.calls;
      expect(calls[0][0]).toMatch(/music_optimized\.ogg$/);
      expect(calls[1][0]).toMatch(/voice_optimized\.ogg$/);
    });
  });

  describe('Queue Management', () => {
    it('should provide queue status information', () => {
      const status = audioProcessor.getQueueStatus();
      
      expect(status).toHaveProperty('size');
      expect(status).toHaveProperty('pending');
      expect(status).toHaveProperty('isPaused');
      expect(typeof status.size).toBe('number');
      expect(typeof status.pending).toBe('number');
      expect(typeof status.isPaused).toBe('boolean');
    });

    it('should allow pausing and resuming the queue', () => {
      // Initial state should not be paused
      expect(audioProcessor.getQueueStatus().isPaused).toBe(false);
      
      // Pause the queue
      audioProcessor.pause();
      expect(audioProcessor.getQueueStatus().isPaused).toBe(true);
      
      // Resume the queue
      audioProcessor.resume();
      expect(audioProcessor.getQueueStatus().isPaused).toBe(false);
    });

    it('should allow clearing the queue', () => {
      audioProcessor.clear();
      
      const status = audioProcessor.getQueueStatus();
      expect(status.size).toBe(0);
      expect(status.pending).toBe(0);
    });
  });

  describe('Codec Mapping', () => {
    beforeEach(() => {
      mockFs.stat.mockResolvedValue({
        isFile: () => true
      } as any);
      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end') {
          setTimeout(() => callback(), 0);
        }
        return mockCommand;
      });
    });

    it('should map codec names correctly', async () => {
      const codecTests = [
        { input: 'pcm', expected: 'pcm_s16le' },
        { input: 'mp3', expected: 'libmp3lame' },
        { input: 'aac', expected: 'aac' },
        { input: 'vorbis', expected: 'libvorbis' },
        { input: 'flac', expected: 'flac' }
      ];

      for (const test of codecTests) {
        jest.clearAllMocks();
        
        const operations: AudioOperations = {
          format: { codec: test.input as any }
        };

        await audioProcessor.processAudioFile(
          '/input/audio.wav',
          '/output/converted.wav',
          operations,
          false
        );

        expect(mockCommand.audioCodec).toHaveBeenCalledWith(test.expected);
      }
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty operations gracefully', async () => {
      mockFs.stat.mockResolvedValue({
        isFile: () => true
      } as any);
      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end') {
          setTimeout(() => callback(), 0);
        }
        return mockCommand;
      });

      const result = await audioProcessor.processAudioFile(
        '/input/audio.mp3',
        '/output/copied.mp3',
        {}, // Empty operations
        false
      );

      expect(result.success).toBe(true);
      
      // Should not have called any modification methods
      expect(mockCommand.audioFilters).not.toHaveBeenCalled();
      expect(mockCommand.audioFrequency).not.toHaveBeenCalled();
      expect(mockCommand.audioChannels).not.toHaveBeenCalled();
    });

    it('should handle invalid input types gracefully', async () => {
      const input: ProcessingInput = {};

      const output: ProcessingOutput = {
        directory: '/output'
      };

      await expect(audioProcessor.batchProcessAudio(input, output, {}, false))
        .rejects.toThrow('No valid input specification provided');
    });

    it('should handle concurrent processing with proper queue management', async () => {
      const processor = new AudioProcessor(1); // Concurrency of 1
      
      mockFs.stat.mockResolvedValue({
        isFile: () => true
      } as any);
      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      let processedCount = 0;
      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end') {
          setTimeout(() => {
            processedCount++;
            callback();
          }, 10);
        }
        return mockCommand;
      });

      // Start multiple processing tasks
      const promises = [
        processor.processAudioFile('/input/1.mp3', '/output/1.mp3', {}, false),
        processor.processAudioFile('/input/2.mp3', '/output/2.mp3', {}, false),
        processor.processAudioFile('/input/3.mp3', '/output/3.mp3', {}, false)
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);
      expect(processedCount).toBe(3);
    });
  });

  describe('Real-world Scenarios', () => {
    beforeEach(() => {
      mockFs.stat.mockResolvedValue({
        isFile: () => true
      } as any);
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
      };

      const result = await audioProcessor.processAudioFile(
        '/input/elevenlabs_voice.wav',
        '/output/game_ready_voice.mp3',
        operations,
        true
      );

      expect(result.success).toBe(true);
      
      // Verify ElevenLabs-specific optimizations
      expect(mockCommand.audioFrequency).toHaveBeenCalledWith(22050);
      expect(mockCommand.audioChannels).toHaveBeenCalledWith(1);
      expect(mockCommand.audioCodec).toHaveBeenCalledWith('libmp3lame');
      expect(mockCommand.audioBitrate).toHaveBeenCalledWith('160k');
      expect(mockCommand.audioFilters).toHaveBeenCalledWith('loudnorm=I=-20:LRA=7:tp=-2');
      expect(mockCommand.audioFilters).toHaveBeenCalledWith([
        'afade=t=in:ss=0:d=0.05',
        'afade=t=out:st=0.1:d=1'
      ]);
    });

    it('should handle game audio asset preparation', async () => {
      (mockGlob as jest.Mock).mockResolvedValue([
        '/assets/music/track1.wav',
        '/assets/sfx/explosion.wav',
        '/assets/voice/dialogue1.wav'
      ]);

      const input: ProcessingInput = {
        directory: '/assets',
        pattern: '**/*.wav'
      };

      const output: ProcessingOutput = {
        directory: '/game/audio',
        suffix: '_game',
        format: 'ogg'
      };

      const operations: AudioOperations = {
        format: {
          codec: 'vorbis',
          bitrate: 192
        },
        volume: {
          normalize: true,
          targetLUFS: -18
        }
      };

      const result = await audioProcessor.batchProcessAudio(
        input,
        output,
        operations,
        true
      );

      expect(result.totalFiles).toBe(3);
      expect(result.successfulFiles).toBe(3);
      
      // Verify game-optimized settings were applied
      expect(mockCommand.audioCodec).toHaveBeenCalledWith('libvorbis');
      expect(mockCommand.audioBitrate).toHaveBeenCalledWith('192k');
      expect(mockCommand.audioFilters).toHaveBeenCalledWith('loudnorm=I=-18:LRA=7:tp=-2');
    });
  });
});
