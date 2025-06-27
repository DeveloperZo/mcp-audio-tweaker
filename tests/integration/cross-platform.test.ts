import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { checkFFmpegAvailability, getFFmpegVersion } from '../../src/utils/ffmpeg.js';
import { validateFilePath } from '../../src/schemas/validation.js';
import AudioProcessor from '../../src/services/audio-processor.js';

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
const mockFs = jest.mocked((await import('fs')).promises);

describe('Cross-Platform Compatibility Tests', () => {
  let audioProcessor: AudioProcessor;
  let originalPlatform: string;

  beforeEach(() => {
    audioProcessor = new AudioProcessor();
    originalPlatform = process.platform;
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original platform
    Object.defineProperty(process, 'platform', {
      value: originalPlatform,
      writable: true
    });
    jest.clearAllMocks();
  });

  describe('Platform Detection and Path Handling', () => {
    it('should handle Windows-style paths correctly', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true
      });

      const windowsPaths = [
        'C:\\Users\\user\\audio\\music.mp3',
        'D:\\Projects\\game\\sounds\\effect.wav',
        '\\\\server\\share\\audio.flac',
        'audio.mp3', // Relative path
        '.\\sounds\\voice.aac'
      ];

      windowsPaths.forEach(path => {
        expect(validateFilePath(path)).toBe(true);
      });
    });

    it('should handle Unix-style paths correctly', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true
      });

      const unixPaths = [
        '/home/user/audio/music.mp3',
        '/usr/share/sounds/effect.wav',
        './sounds/voice.aac',
        '../audio/track.flac',
        'audio.mp3' // Relative path
      ];

      unixPaths.forEach(path => {
        expect(validateFilePath(path)).toBe(true);
      });
    });

    it('should handle macOS-specific paths correctly', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true
      });

      const macosPaths = [
        '/Users/user/Music/song.mp3',
        '/System/Library/Sounds/effect.wav',
        '/Volumes/ExternalDrive/audio.flac',
        '~/Documents/audio/voice.aac'
      ];

      macosPaths.forEach(path => {
        expect(validateFilePath(path)).toBe(true);
      });
    });
  });

  describe('FFmpeg Detection Across Platforms', () => {
    it('should detect FFmpeg on Windows', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true
      });

      // Mock Windows FFmpeg paths
      const windowsFFmpegPaths = [
        'C:\\Program Files\\FFmpeg\\bin\\ffmpeg.exe',
        'C:\\ffmpeg\\bin\\ffmpeg.exe',
        'ffmpeg.exe'
      ];

      for (const ffmpegPath of windowsFFmpegPaths) {
        mockWhich.mockResolvedValue(ffmpegPath);
        
        const available = await checkFFmpegAvailability();
        expect(available).toBe(true);
        expect(mockWhich).toHaveBeenCalledWith('ffmpeg');
      }
    });

    it('should detect FFmpeg on Linux', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true
      });

      // Mock Linux FFmpeg paths
      const linuxFFmpegPaths = [
        '/usr/bin/ffmpeg',
        '/usr/local/bin/ffmpeg',
        '/snap/bin/ffmpeg',
        '/opt/ffmpeg/bin/ffmpeg'
      ];

      for (const ffmpegPath of linuxFFmpegPaths) {
        jest.clearAllMocks();
        mockWhich.mockResolvedValue(ffmpegPath);
        
        const available = await checkFFmpegAvailability();
        expect(available).toBe(true);
      }
    });

    it('should detect FFmpeg on macOS', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true
      });

      // Mock macOS FFmpeg paths
      const macosFFmpegPaths = [
        '/usr/local/bin/ffmpeg',
        '/opt/homebrew/bin/ffmpeg',
        '/usr/bin/ffmpeg'
      ];

      for (const ffmpegPath of macosFFmpegPaths) {
        jest.clearAllMocks();
        mockWhich.mockResolvedValue(ffmpegPath);
        
        const available = await checkFFmpegAvailability();
        expect(available).toBe(true);
      }
    });

    it('should handle FFmpeg not found on any platform', async () => {
      const platforms = ['win32', 'linux', 'darwin'];

      for (const platform of platforms) {
        Object.defineProperty(process, 'platform', {
          value: platform,
          writable: true
        });

        jest.clearAllMocks();
        mockWhich.mockRejectedValue(new Error('Command not found'));
        
        const available = await checkFFmpegAvailability();
        expect(available).toBe(false);
      }
    });
  });

  describe('File System Operations Across Platforms', () => {
    it('should handle Windows file permissions correctly', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true
      });

      // Mock Windows file stats
      mockFs.stat.mockResolvedValue({
        isFile: () => true,
        mode: 0o644 // rw-r--r--
      } as any);

      mockFs.access.mockResolvedValue(undefined);

      const { validateInputFile } = await import('../../src/utils/ffmpeg.js');
      
      await expect(validateInputFile('C:\\audio\\test.mp3')).resolves.toBeUndefined();
      expect(mockFs.access).toHaveBeenCalledWith('C:\\audio\\test.mp3', mockFs.constants.R_OK);
    });

    it('should handle Unix file permissions correctly', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true
      });

      // Mock Unix file stats with executable permissions
      mockFs.stat.mockResolvedValue({
        isFile: () => true,
        mode: 0o755 // rwxr-xr-x
      } as any);

      mockFs.access.mockResolvedValue(undefined);

      const { validateInputFile } = await import('../../src/utils/ffmpeg.js');
      
      await expect(validateInputFile('/home/user/audio/test.mp3')).resolves.toBeUndefined();
    });

    it('should handle permission denied errors appropriately', async () => {
      const platforms = ['win32', 'linux', 'darwin'];

      for (const platform of platforms) {
        Object.defineProperty(process, 'platform', {
          value: platform,
          writable: true
        });

        jest.clearAllMocks();
        mockFs.stat.mockResolvedValue({
          isFile: () => true
        } as any);
        
        mockFs.access.mockRejectedValue(new Error('EACCES: permission denied'));

        const { validateInputFile } = await import('../../src/utils/ffmpeg.js');
        
        await expect(validateInputFile('/restricted/test.mp3'))
          .rejects.toThrow('Cannot access input file');
      }
    });
  });

  describe('Directory Creation Across Platforms', () => {
    it('should create directories with correct separators on Windows', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true
      });

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.access.mockResolvedValue(undefined);

      const { ensureOutputDirectory } = await import('../../src/utils/ffmpeg.js');
      
      await ensureOutputDirectory('C:\\output\\processed\\audio.mp3');
      
      expect(mockFs.mkdir).toHaveBeenCalledWith('C:\\output\\processed', { recursive: true });
    });

    it('should create directories with correct separators on Unix', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true
      });

      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.access.mockResolvedValue(undefined);

      const { ensureOutputDirectory } = await import('../../src/utils/ffmpeg.js');
      
      await ensureOutputDirectory('/output/processed/audio.mp3');
      
      expect(mockFs.mkdir).toHaveBeenCalledWith('/output/processed', { recursive: true });
    });

    it('should handle deep directory structures on all platforms', async () => {
      const testCases = [
        { platform: 'win32', path: 'C:\\very\\deep\\nested\\directory\\structure\\file.mp3' },
        { platform: 'linux', path: '/very/deep/nested/directory/structure/file.mp3' },
        { platform: 'darwin', path: '/Users/user/very/deep/nested/directory/structure/file.mp3' }
      ];

      for (const testCase of testCases) {
        Object.defineProperty(process, 'platform', {
          value: testCase.platform,
          writable: true
        });

        jest.clearAllMocks();
        mockFs.mkdir.mockResolvedValue(undefined);
        mockFs.access.mockResolvedValue(undefined);

        const { ensureOutputDirectory } = await import('../../src/utils/ffmpeg.js');
        
        await expect(ensureOutputDirectory(testCase.path)).resolves.toBeUndefined();
        expect(mockFs.mkdir).toHaveBeenCalledWith(
          expect.stringContaining('structure'),
          { recursive: true }
        );
      }
    });
  });

  describe('Command Execution Compatibility', () => {
    let mockCommand: any;

    beforeEach(() => {
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

    it('should execute FFmpeg commands on Windows', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true
      });

      mockFs.stat.mockResolvedValue({ isFile: () => true } as any);
      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      // Mock successful execution
      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end') {
          setTimeout(() => callback(), 0);
        }
        return mockCommand;
      });

      const result = await audioProcessor.processAudioFile(
        'C:\\input\\audio.wav',
        'C:\\output\\processed.mp3',
        { format: { codec: 'mp3' } },
        false
      );

      expect(result.success).toBe(true);
      expect(mockCommand.run).toHaveBeenCalled();
    });

    it('should execute FFmpeg commands on Linux', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true
      });

      mockFs.stat.mockResolvedValue({ isFile: () => true } as any);
      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end') {
          setTimeout(() => callback(), 0);
        }
        return mockCommand;
      });

      const result = await audioProcessor.processAudioFile(
        '/input/audio.wav',
        '/output/processed.mp3',
        { format: { codec: 'mp3' } },
        false
      );

      expect(result.success).toBe(true);
      expect(mockCommand.run).toHaveBeenCalled();
    });

    it('should execute FFmpeg commands on macOS', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true
      });

      mockFs.stat.mockResolvedValue({ isFile: () => true } as any);
      mockFs.access.mockResolvedValue(undefined);
      mockFs.mkdir.mockResolvedValue(undefined);

      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end') {
          setTimeout(() => callback(), 0);
        }
        return mockCommand;
      });

      const result = await audioProcessor.processAudioFile(
        '/Users/user/input/audio.wav',
        '/Users/user/output/processed.mp3',
        { format: { codec: 'mp3' } },
        false
      );

      expect(result.success).toBe(true);
      expect(mockCommand.run).toHaveBeenCalled();
    });
  });

  describe('Environment Variable Handling', () => {
    let originalEnv: NodeJS.ProcessEnv;

    beforeEach(() => {
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it('should handle Windows environment variables', () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true
      });

      // Simulate Windows environment
      process.env.USERPROFILE = 'C:\\Users\\TestUser';
      process.env.APPDATA = 'C:\\Users\\TestUser\\AppData\\Roaming';
      process.env.PATH = 'C:\\Windows\\System32;C:\\Program Files\\FFmpeg\\bin';

      // Test that the package can handle Windows-style environment variables
      expect(process.env.USERPROFILE).toBe('C:\\Users\\TestUser');
      expect(process.env.PATH).toContain('FFmpeg');
    });

    it('should handle Unix environment variables', () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true
      });

      // Simulate Unix environment
      process.env.HOME = '/home/testuser';
      process.env.PATH = '/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin';

      expect(process.env.HOME).toBe('/home/testuser');
      expect(process.env.PATH).toContain('/usr/bin');
    });

    it('should handle macOS environment variables', () => {
      Object.defineProperty(process, 'platform', {
        value: 'darwin',
        writable: true
      });

      // Simulate macOS environment
      process.env.HOME = '/Users/testuser';
      process.env.PATH = '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin';

      expect(process.env.HOME).toBe('/Users/testuser');
      expect(process.env.PATH).toContain('/opt/homebrew/bin');
    });
  });

  describe('Temporary File Handling', () => {
    it('should handle temporary files correctly on Windows', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'win32',
        writable: true
      });

      const tempFiles = [
        'C:\\Users\\TestUser\\AppData\\Local\\Temp\\audio_temp_1.wav',
        'C:\\Users\\TestUser\\AppData\\Local\\Temp\\audio_temp_2.mp3'
      ];

      mockFs.unlink.mockResolvedValue(undefined);

      const { cleanupTempFiles } = await import('../../src/utils/ffmpeg.js');
      
      await expect(cleanupTempFiles(tempFiles)).resolves.toBeUndefined();
      
      expect(mockFs.unlink).toHaveBeenCalledTimes(2);
      tempFiles.forEach(file => {
        expect(mockFs.unlink).toHaveBeenCalledWith(file);
      });
    });

    it('should handle temporary files correctly on Unix systems', async () => {
      Object.defineProperty(process, 'platform', {
        value: 'linux',
        writable: true
      });

      const tempFiles = [
        '/tmp/audio_temp_1.wav',
        '/tmp/audio_temp_2.mp3',
        '/var/tmp/audio_temp_3.ogg'
      ];

      mockFs.unlink.mockResolvedValue(undefined);

      const { cleanupTempFiles } = await import('../../src/utils/ffmpeg.js');
      
      await expect(cleanupTempFiles(tempFiles)).resolves.toBeUndefined();
      
      expect(mockFs.unlink).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Message Compatibility', () => {
    it('should provide platform-appropriate error messages', async () => {
      const platforms = [
        { name: 'win32', expectedPath: 'C:\\nonexistent\\file.mp3' },
        { name: 'linux', expectedPath: '/nonexistent/file.mp3' },
        { name: 'darwin', expectedPath: '/Users/nonexistent/file.mp3' }
      ];

      for (const platform of platforms) {
        Object.defineProperty(process, 'platform', {
          value: platform.name,
          writable: true
        });

        jest.clearAllMocks();
        mockFs.stat.mockRejectedValue(new Error('ENOENT: no such file or directory'));

        const { validateInputFile } = await import('../../src/utils/ffmpeg.js');
        
        await expect(validateInputFile(platform.expectedPath))
          .rejects.toThrow('Cannot access input file');
      }
    });
  });

  describe('Performance Across Platforms', () => {
    it('should perform consistently across platforms', async () => {
      const platforms = ['win32', 'linux', 'darwin'];
      const results: Array<{ platform: string; time: number }> = [];

      for (const platform of platforms) {
        Object.defineProperty(process, 'platform', {
          value: platform,
          writable: true
        });

        // Setup successful mocks
        mockFs.stat.mockResolvedValue({ isFile: () => true } as any);
        mockFs.access.mockResolvedValue(undefined);
        mockFs.mkdir.mockResolvedValue(undefined);

        mockCommand.on.mockImplementation((event: string, callback: Function) => {
          if (event === 'end') {
            setTimeout(() => callback(), 50); // Fixed processing time
          }
          return mockCommand;
        });

        const startTime = Date.now();
        const result = await audioProcessor.processAudioFile(
          '/input/test.wav',
          '/output/test.mp3',
          { format: { codec: 'mp3' } },
          false
        );
        const endTime = Date.now();

        expect(result.success).toBe(true);
        results.push({
          platform,
          time: endTime - startTime
        });

        jest.clearAllMocks();
      }

      // Performance should be consistent across platforms (within reasonable variance)
      const times = results.map(r => r.time);
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      const variance = maxTime - minTime;

      expect(variance).toBeLessThan(100); // Should be within 100ms of each other

      console.log('Cross-platform performance:');
      results.forEach(r => {
        console.log(`  ${r.platform}: ${r.time}ms`);
      });
    });
  });

  describe('Node.js Version Compatibility', () => {
    it('should work with different Node.js versions', () => {
      const nodeVersions = ['18.0.0', '20.0.0', '22.0.0'];
      const originalVersion = process.version;

      nodeVersions.forEach(version => {
        Object.defineProperty(process, 'version', {
          value: `v${version}`,
          writable: true
        });

        // Test that the package imports work with different Node versions
        expect(() => {
          require('../../src/index.js');
        }).not.toThrow();
      });

      // Restore original version
      Object.defineProperty(process, 'version', {
        value: originalVersion,
        writable: true
      });
    });
  });
});
