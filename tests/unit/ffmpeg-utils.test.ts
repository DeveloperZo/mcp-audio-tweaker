import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import {
  checkFFmpegAvailability,
  getFFmpegVersion,
  validateInputFile,
  ensureOutputDirectory,
  generateOutputFilename,
  handleExistingOutput,
  createFFmpegCommand,
  executeFFmpegCommand,
  getAudioMetadata,
  cleanupTempFiles
} from '../../src/utils/ffmpeg.js';
import { FFmpegError } from '../../src/types/index.js';

// Mock dependencies
jest.mock('which');
jest.mock('fluent-ffmpeg');
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

const mockWhich = jest.mocked(await import('which')).default;
const mockFfmpeg = jest.mocked(await import('fluent-ffmpeg')).default;
const mockFs = jest.mocked(fs.promises);

describe('FFmpeg Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkFFmpegAvailability', () => {
    it('should return true when FFmpeg is available', async () => {
      mockWhich.mockResolvedValue('/usr/bin/ffmpeg');
      
      const result = await checkFFmpegAvailability();
      
      expect(result).toBe(true);
      expect(mockWhich).toHaveBeenCalledWith('ffmpeg');
    });

    it('should return false when FFmpeg is not available', async () => {
      mockWhich.mockRejectedValue(new Error('Command not found'));
      
      const result = await checkFFmpegAvailability();
      
      expect(result).toBe(false);
    });
  });

  describe('getFFmpegVersion', () => {
    it('should return version info when FFmpeg is available', async () => {
      const mockCommand = {
        getAvailableFormats: jest.fn(),
        ffprobe: jest.fn()
      };
      
      (mockFfmpeg as any).getAvailableFormats = jest.fn((callback) => {
        callback(null, { mp3: {}, wav: {} });
      });
      
      (mockFfmpeg as any).ffprobe = jest.fn((path, callback) => {
        callback(null, { format: { format_name: 'mp3' } });
      });

      const result = await getFFmpegVersion();
      
      expect(result).toBe('FFmpeg available with codecs and formats');
    });

    it('should reject when FFmpeg formats are not available', async () => {
      (mockFfmpeg as any).getAvailableFormats = jest.fn((callback) => {
        callback(new Error('FFmpeg not found'), null);
      });

      await expect(getFFmpegVersion()).rejects.toThrow(FFmpegError);
    });
  });

  describe('validateInputFile', () => {
    it('should validate existing readable file', async () => {
      mockFs.stat.mockResolvedValue({
        isFile: () => true
      } as any);
      mockFs.access.mockResolvedValue(undefined);

      await expect(validateInputFile('/path/to/audio.mp3')).resolves.toBeUndefined();
      
      expect(mockFs.stat).toHaveBeenCalledWith('/path/to/audio.mp3');
      expect(mockFs.access).toHaveBeenCalledWith('/path/to/audio.mp3', fs.constants.R_OK);
    });

    it('should throw error for non-existent file', async () => {
      mockFs.stat.mockRejectedValue(new Error('ENOENT: no such file'));

      await expect(validateInputFile('/path/to/nonexistent.mp3'))
        .rejects.toThrow(FFmpegError);
    });

    it('should throw error for directory path', async () => {
      mockFs.stat.mockResolvedValue({
        isFile: () => false
      } as any);

      await expect(validateInputFile('/path/to/directory'))
        .rejects.toThrow('Path is not a file');
    });

    it('should throw error for unreadable file', async () => {
      mockFs.stat.mockResolvedValue({
        isFile: () => true
      } as any);
      mockFs.access.mockRejectedValue(new Error('EACCES: permission denied'));

      await expect(validateInputFile('/path/to/unreadable.mp3'))
        .rejects.toThrow(FFmpegError);
    });
  });

  describe('ensureOutputDirectory', () => {
    it('should create directory structure and verify write access', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.access.mockResolvedValue(undefined);

      await expect(ensureOutputDirectory('/output/dir/file.mp3')).resolves.toBeUndefined();
      
      expect(mockFs.mkdir).toHaveBeenCalledWith('/output/dir', { recursive: true });
      expect(mockFs.access).toHaveBeenCalledWith('/output/dir', fs.constants.W_OK);
    });

    it('should throw error when directory creation fails', async () => {
      mockFs.mkdir.mockRejectedValue(new Error('EACCES: permission denied'));

      await expect(ensureOutputDirectory('/protected/dir/file.mp3'))
        .rejects.toThrow(FFmpegError);
    });

    it('should throw error when directory is not writable', async () => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.access.mockRejectedValue(new Error('EACCES: permission denied'));

      await expect(ensureOutputDirectory('/readonly/dir/file.mp3'))
        .rejects.toThrow(FFmpegError);
    });
  });

  describe('generateOutputFilename', () => {
    it('should generate filename with default suffix', () => {
      const result = generateOutputFilename('/input/audio.mp3');
      
      expect(result).toBe('/input/audio_processed.mp3');
    });

    it('should generate filename with custom suffix', () => {
      const result = generateOutputFilename('/input/audio.mp3', undefined, '_optimized');
      
      expect(result).toBe('/input/audio_optimized.mp3');
    });

    it('should generate filename with output directory', () => {
      const result = generateOutputFilename('/input/audio.mp3', '/output');
      
      expect(result).toBe('/output/audio_processed.mp3');
    });

    it('should generate filename with new extension', () => {
      const result = generateOutputFilename('/input/audio.wav', undefined, '_converted', 'mp3');
      
      expect(result).toBe('/input/audio_converted.mp3');
    });

    it('should handle paths without extension', () => {
      const result = generateOutputFilename('/input/audio', undefined, '_processed', 'mp3');
      
      expect(result).toBe('/input/audio_processed.mp3');
    });
  });

  describe('handleExistingOutput', () => {
    it('should allow processing when output file does not exist', async () => {
      mockFs.access.mockRejectedValue({ code: 'ENOENT' });

      await expect(handleExistingOutput('/output/new.mp3', false)).resolves.toBeUndefined();
    });

    it('should allow overwrite when file exists and overwrite is true', async () => {
      mockFs.access.mockResolvedValue(undefined);

      await expect(handleExistingOutput('/output/existing.mp3', true)).resolves.toBeUndefined();
    });

    it('should throw error when file exists and overwrite is false', async () => {
      mockFs.access.mockResolvedValue(undefined);

      await expect(handleExistingOutput('/output/existing.mp3', false))
        .rejects.toThrow('Output file already exists');
    });

    it('should propagate non-ENOENT access errors', async () => {
      mockFs.access.mockRejectedValue(new Error('EACCES: permission denied'));

      await expect(handleExistingOutput('/output/file.mp3', false))
        .rejects.toThrow('EACCES: permission denied');
    });
  });

  describe('createFFmpegCommand', () => {
    it('should create FFmpeg command with progress tracking', () => {
      const mockCommand = {
        on: jest.fn().mockReturnThis()
      };
      
      (mockFfmpeg as any).mockReturnValue(mockCommand);

      const result = createFFmpegCommand('/input/audio.mp3');

      expect(mockFfmpeg).toHaveBeenCalledWith('/input/audio.mp3');
      expect(result).toBe(mockCommand);
      expect(mockCommand.on).toHaveBeenCalledWith('start', expect.any(Function));
      expect(mockCommand.on).toHaveBeenCalledWith('progress', expect.any(Function));
      expect(mockCommand.on).toHaveBeenCalledWith('stderr', expect.any(Function));
    });
  });

  describe('executeFFmpegCommand', () => {
    it('should execute command successfully', async () => {
      const mockCommand = {
        output: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        run: jest.fn()
      };

      // Simulate successful execution
      mockCommand.on.mockImplementation((event, callback) => {
        if (event === 'end') {
          setTimeout(() => callback(), 0);
        }
        return mockCommand;
      });

      await expect(executeFFmpegCommand(mockCommand, '/output/audio.mp3'))
        .resolves.toBeUndefined();

      expect(mockCommand.output).toHaveBeenCalledWith('/output/audio.mp3');
      expect(mockCommand.run).toHaveBeenCalled();
    });

    it('should handle FFmpeg execution errors', async () => {
      const mockCommand = {
        output: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
        run: jest.fn()
      };

      const testError = new Error('FFmpeg failed');

      // Simulate error during execution
      mockCommand.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(testError), 0);
        }
        return mockCommand;
      });

      await expect(executeFFmpegCommand(mockCommand, '/output/audio.mp3'))
        .rejects.toThrow(FFmpegError);
    });
  });

  describe('getAudioMetadata', () => {
    it('should return metadata for valid audio file', async () => {
      const mockMetadata = {
        format: {
          duration: 10.5,
          bit_rate: 192000,
          format_name: 'mp3'
        },
        streams: [{
          codec_name: 'mp3',
          sample_rate: 44100,
          channels: 2
        }]
      };

      (mockFfmpeg as any).ffprobe = jest.fn((path, callback) => {
        callback(null, mockMetadata);
      });

      const result = await getAudioMetadata('/path/to/audio.mp3');

      expect(result).toEqual(mockMetadata);
      expect(mockFfmpeg.ffprobe).toHaveBeenCalledWith('/path/to/audio.mp3', expect.any(Function));
    });

    it('should throw FFmpegError when ffprobe fails', async () => {
      (mockFfmpeg as any).ffprobe = jest.fn((path, callback) => {
        callback(new Error('Invalid file format'), null);
      });

      await expect(getAudioMetadata('/path/to/invalid.file'))
        .rejects.toThrow(FFmpegError);
    });
  });

  describe('cleanupTempFiles', () => {
    it('should remove all temporary files successfully', async () => {
      mockFs.unlink.mockResolvedValue(undefined);
      
      const tempFiles = ['/tmp/file1.mp3', '/tmp/file2.wav'];
      
      await expect(cleanupTempFiles(tempFiles)).resolves.toBeUndefined();
      
      expect(mockFs.unlink).toHaveBeenCalledTimes(2);
      expect(mockFs.unlink).toHaveBeenCalledWith('/tmp/file1.mp3');
      expect(mockFs.unlink).toHaveBeenCalledWith('/tmp/file2.wav');
    });

    it('should continue cleanup even if some files fail to delete', async () => {
      mockFs.unlink
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('File not found'))
        .mockResolvedValueOnce(undefined);
      
      const tempFiles = ['/tmp/file1.mp3', '/tmp/missing.wav', '/tmp/file3.ogg'];
      
      await expect(cleanupTempFiles(tempFiles)).resolves.toBeUndefined();
      
      expect(mockFs.unlink).toHaveBeenCalledTimes(3);
    });

    it('should handle empty file list', async () => {
      await expect(cleanupTempFiles([])).resolves.toBeUndefined();
      
      expect(mockFs.unlink).not.toHaveBeenCalled();
    });
  });
});
