import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import AudioProcessor from '../../src/services/audio-processor.js';
import { AudioOperations } from '../../src/types/index.js';

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

describe('Performance and Stress Tests', () => {
  let audioProcessor: AudioProcessor;
  let mockCommand: any;

  beforeEach(() => {
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

    // Mock successful file operations
    mockFs.stat.mockResolvedValue({
      isFile: () => true
    } as any);
    mockFs.access.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Concurrent Processing Performance', () => {
    it('should handle high concurrency levels efficiently', async () => {
      const concurrency = 10;
      audioProcessor = new AudioProcessor(concurrency);

      let processedCount = 0;
      const processingTimes: number[] = [];

      // Mock FFmpeg execution with random processing time
      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end') {
          const delay = Math.random() * 100 + 50; // 50-150ms
          processingTimes.push(delay);
          setTimeout(() => {
            processedCount++;
            callback();
          }, delay);
        }
        return mockCommand;
      });

      const operations: AudioOperations = {
        format: { codec: 'mp3' }
      };

      // Create many concurrent processing tasks
      const tasks = Array.from({ length: 50 }, (_, i) => 
        audioProcessor.processAudioFile(
          `/input/file${i}.wav`,
          `/output/file${i}.mp3`,
          operations,
          false
        )
      );

      const startTime = Date.now();
      const results = await Promise.all(tasks);
      const totalTime = Date.now() - startTime;

      expect(results).toHaveLength(50);
      expect(results.every(r => r.success)).toBe(true);
      expect(processedCount).toBe(50);

      // Performance assertions
      expect(totalTime).toBeLessThan(2000); // Should complete in under 2 seconds
      
      const status = audioProcessor.getQueueStatus();
      expect(status.size).toBe(0);
      expect(status.pending).toBe(0);

      console.log(`Processed ${50} files in ${totalTime}ms with concurrency ${concurrency}`);
    });

    it('should manage queue efficiently under load', async () => {
      audioProcessor = new AudioProcessor(2); // Low concurrency to test queueing

      let completedTasks = 0;
      const taskCompletionTimes: number[] = [];

      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end') {
          setTimeout(() => {
            completedTasks++;
            taskCompletionTimes.push(Date.now());
            callback();
          }, 100); // Fixed 100ms processing time
        }
        return mockCommand;
      });

      // Submit tasks rapidly
      const tasks = Array.from({ length: 20 }, (_, i) => 
        audioProcessor.processAudioFile(
          `/input/stress${i}.wav`,
          `/output/stress${i}.mp3`,
          { volume: { adjust: -3 } },
          false
        )
      );

      // Check queue status during processing
      const initialStatus = audioProcessor.getQueueStatus();
      expect(initialStatus.size).toBeGreaterThan(0);

      await Promise.all(tasks);

      expect(completedTasks).toBe(20);
      
      const finalStatus = audioProcessor.getQueueStatus();
      expect(finalStatus.size).toBe(0);
      expect(finalStatus.pending).toBe(0);
    });
  });

  describe('Large Batch Processing', () => {
    it('should handle large file sets efficiently', async () => {
      audioProcessor = new AudioProcessor(4);

      // Mock a large number of files
      const fileCount = 100;
      const mockFiles = Array.from({ length: fileCount }, (_, i) => 
        `/input/batch/file${i.toString().padStart(3, '0')}.mp3`
      );

      (mockGlob as jest.Mock).mockResolvedValue(mockFiles);

      let processedFiles = 0;
      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end') {
          setTimeout(() => {
            processedFiles++;
            callback();
          }, 10); // Fast processing for large batch test
        }
        return mockCommand;
      });

      const startTime = Date.now();
      const result = await audioProcessor.batchProcessAudio(
        { directory: '/input/batch', pattern: '*.mp3' },
        { directory: '/output/batch' },
        { format: { bitrate: 128 } },
        false
      );
      const processingTime = Date.now() - startTime;

      expect(result.totalFiles).toBe(fileCount);
      expect(result.successfulFiles).toBe(fileCount);
      expect(result.failedFiles).toBe(0);
      expect(processedFiles).toBe(fileCount);

      // Performance expectations for large batches
      expect(processingTime).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(result.totalProcessingTime).toBeGreaterThan(0);

      console.log(`Batch processed ${fileCount} files in ${processingTime}ms`);
    });

    it('should handle memory efficiently with very large batches', async () => {
      audioProcessor = new AudioProcessor(8);

      // Simulate processing 1000 files
      const fileCount = 1000;
      const mockFiles = Array.from({ length: fileCount }, (_, i) => 
        `/input/huge/track${i}.wav`
      );

      (mockGlob as jest.Mock).mockResolvedValue(mockFiles);

      // Track memory usage simulation
      const memoryUsage: number[] = [];
      let currentMemory = 100; // Simulated memory usage in MB

      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'start') {
          currentMemory += 5; // Add 5MB per concurrent task
          memoryUsage.push(currentMemory);
        }
        if (event === 'end') {
          setTimeout(() => {
            currentMemory -= 5; // Release 5MB per completed task
            callback();
          }, 5);
        }
        return mockCommand;
      });

      const result = await audioProcessor.batchProcessAudio(
        { directory: '/input/huge' },
        { directory: '/output/huge' },
        { volume: { normalize: true } },
        false
      );

      expect(result.totalFiles).toBe(fileCount);
      expect(result.successfulFiles).toBe(fileCount);

      // Memory should not grow indefinitely
      const maxMemory = Math.max(...memoryUsage);
      expect(maxMemory).toBeLessThan(200); // Should not exceed 200MB simulated

      console.log(`Max simulated memory usage: ${maxMemory}MB for ${fileCount} files`);
    });
  });

  describe('Complex Operations Performance', () => {
    it('should handle complex audio operations efficiently', async () => {
      audioProcessor = new AudioProcessor(3);

      const complexOperations: AudioOperations = {
        volume: {
          adjust: -6,
          normalize: true,
          targetLUFS: -20
        },
        format: {
          sampleRate: 44100,
          bitrate: 192,
          channels: 2,
          codec: 'vorbis'
        },
        effects: {
          fadeIn: 1.0,
          fadeOut: 2.0,
          trim: { start: 5, end: 30 },
          loop: { enabled: true, count: 2 }
        }
      };

      let operationCount = 0;
      
      // Count the number of operations applied
      mockCommand.audioFilters.mockImplementation(() => {
        operationCount++;
        return mockCommand;
      });
      
      mockCommand.audioFrequency.mockImplementation(() => {
        operationCount++;
        return mockCommand;
      });
      
      mockCommand.audioChannels.mockImplementation(() => {
        operationCount++;
        return mockCommand;
      });
      
      mockCommand.audioCodec.mockImplementation(() => {
        operationCount++;
        return mockCommand;
      });

      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end') {
          setTimeout(() => callback(), 50);
        }
        return mockCommand;
      });

      const startTime = Date.now();
      const result = await audioProcessor.processAudioFile(
        '/input/complex.wav',
        '/output/complex.ogg',
        complexOperations,
        false
      );
      const processingTime = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(operationCount).toBeGreaterThan(5); // Many operations should be applied
      expect(processingTime).toBeLessThan(1000); // Should be fast despite complexity

      console.log(`Complex operations completed in ${processingTime}ms with ${operationCount} operations`);
    });

    it('should handle edge case parameter combinations', async () => {
      audioProcessor = new AudioProcessor(2);

      const edgeCaseOperations: AudioOperations[] = [
        // Extreme volume adjustments
        { volume: { adjust: -60 } },
        { volume: { adjust: 20 } },
        
        // Unusual format combinations
        { format: { sampleRate: 8000, channels: 8, bitrate: 320 } },
        { format: { sampleRate: 192000, channels: 1, bitrate: 64 } },
        
        // Complex effects
        { effects: { fadeIn: 0.001, fadeOut: 0.001, trim: { start: 0, end: 0.1 } } },
        { effects: { loop: { enabled: true, count: 100 } } },
        
        // All parameters at extremes
        {
          volume: { adjust: -60, normalize: true, targetLUFS: -30 },
          format: { sampleRate: 8000, bitrate: 64, channels: 1, codec: 'mp3' },
          effects: { fadeIn: 10, fadeOut: 10, trim: { start: 60, end: 120 } }
        }
      ];

      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end') {
          setTimeout(() => callback(), 25);
        }
        return mockCommand;
      });

      const results = await Promise.all(
        edgeCaseOperations.map((ops, i) =>
          audioProcessor.processAudioFile(
            `/input/edge${i}.wav`,
            `/output/edge${i}.mp3`,
            ops,
            false
          )
        )
      );

      expect(results.every(r => r.success)).toBe(true);
      expect(results).toHaveLength(edgeCaseOperations.length);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover gracefully from intermittent FFmpeg failures', async () => {
      audioProcessor = new AudioProcessor(3);

      let attemptCount = 0;
      const failureRate = 0.3; // 30% failure rate

      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        attemptCount++;
        
        if (event === 'error' && Math.random() < failureRate) {
          setTimeout(() => callback(new Error('Simulated FFmpeg failure')), 10);
        } else if (event === 'end') {
          setTimeout(() => callback(), 50);
        }
        return mockCommand;
      });

      const tasks = Array.from({ length: 20 }, (_, i) =>
        audioProcessor.processAudioFile(
          `/input/unstable${i}.wav`,
          `/output/unstable${i}.mp3`,
          { format: { codec: 'mp3' } },
          false
        )
      );

      const results = await Promise.all(tasks);

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      expect(successCount + failureCount).toBe(20);
      expect(successCount).toBeGreaterThan(0); // Should have some successes
      expect(failureCount).toBeGreaterThan(0); // Should have some failures (due to simulation)

      // All failed results should have error messages
      results.filter(r => !r.success).forEach(result => {
        expect(result.error).toContain('FFmpeg processing failed');
      });

      console.log(`Resilience test: ${successCount} successes, ${failureCount} failures from ${attemptCount} attempts`);
    });

    it('should handle resource exhaustion scenarios', async () => {
      audioProcessor = new AudioProcessor(1); // Very limited concurrency

      let resourceUsage = 0;
      const maxResources = 5;

      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'start') {
          resourceUsage++;
          if (resourceUsage > maxResources) {
            // Simulate resource exhaustion
            setTimeout(() => callback(new Error('Resource exhausted')), 10);
            return mockCommand;
          }
        }
        
        if (event === 'end') {
          setTimeout(() => {
            resourceUsage = Math.max(0, resourceUsage - 1);
            callback();
          }, 100);
        }
        
        if (event === 'error') {
          setTimeout(() => {
            resourceUsage = Math.max(0, resourceUsage - 1);
            callback(new Error('Resource exhausted'));
          }, 10);
        }
        
        return mockCommand;
      });

      const tasks = Array.from({ length: 10 }, (_, i) =>
        audioProcessor.processAudioFile(
          `/input/resource${i}.wav`,
          `/output/resource${i}.mp3`,
          { volume: { adjust: -3 } },
          false
        )
      );

      const results = await Promise.all(tasks);

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      expect(successCount + failureCount).toBe(10);
      
      // Should handle resource limits gracefully
      expect(resourceUsage).toBeLessThanOrEqual(maxResources);

      console.log(`Resource test: ${successCount} successes, ${failureCount} failures with max ${maxResources} resources`);
    });
  });

  describe('Benchmark and Timing Tests', () => {
    it('should meet performance benchmarks for single file processing', async () => {
      audioProcessor = new AudioProcessor(1);

      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end') {
          setTimeout(() => callback(), 100); // Fixed processing time
        }
        return mockCommand;
      });

      const startTime = Date.now();
      const result = await audioProcessor.processAudioFile(
        '/input/benchmark.wav',
        '/output/benchmark.mp3',
        { format: { codec: 'mp3' } },
        false
      );
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.processingTime).toBeGreaterThan(90); // Should include FFmpeg time
      expect(result.processingTime).toBeLessThan(200); // Plus overhead
      expect(endTime - startTime).toBeLessThan(300); // Total wall clock time

      console.log(`Benchmark: Total time ${endTime - startTime}ms, Processing time ${result.processingTime}ms`);
    });

    it('should scale efficiently with batch size', async () => {
      const batchSizes = [10, 50, 100];
      const results: Array<{ size: number; time: number; throughput: number }> = [];

      for (const batchSize of batchSizes) {
        audioProcessor = new AudioProcessor(4);

        const mockFiles = Array.from({ length: batchSize }, (_, i) => 
          `/input/scale${i}.mp3`
        );

        (mockGlob as jest.Mock).mockResolvedValue(mockFiles);

        mockCommand.on.mockImplementation((event: string, callback: Function) => {
          if (event === 'end') {
            setTimeout(() => callback(), 20); // Fast processing for scaling test
          }
          return mockCommand;
        });

        const startTime = Date.now();
        const result = await audioProcessor.batchProcessAudio(
          { directory: '/input/scale' },
          { directory: '/output/scale' },
          { volume: { adjust: -3 } },
          false
        );
        const totalTime = Date.now() - startTime;

        const throughput = batchSize / (totalTime / 1000); // Files per second

        results.push({
          size: batchSize,
          time: totalTime,
          throughput
        });

        expect(result.successfulFiles).toBe(batchSize);
      }

      // Throughput should generally increase with batch size (efficiency gains)
      expect(results[2].throughput).toBeGreaterThan(results[0].throughput * 0.8);

      console.log('Scaling results:');
      results.forEach(r => {
        console.log(`  ${r.size} files: ${r.time}ms (${r.throughput.toFixed(2)} files/sec)`);
      });
    });
  });

  describe('Memory and Resource Management', () => {
    it('should not leak resources during long processing sessions', async () => {
      audioProcessor = new AudioProcessor(2);

      let activeConnections = 0;
      const maxActiveConnections = 0;

      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'start') {
          activeConnections++;
        }
        if (event === 'end' || event === 'error') {
          setTimeout(() => {
            activeConnections--;
            callback();
          }, 30);
        }
        return mockCommand;
      });

      // Simulate a long session with many operations
      for (let batch = 0; batch < 5; batch++) {
        const tasks = Array.from({ length: 10 }, (_, i) =>
          audioProcessor.processAudioFile(
            `/input/session${batch}_${i}.wav`,
            `/output/session${batch}_${i}.mp3`,
            { format: { codec: 'mp3' } },
            false
          )
        );

        await Promise.all(tasks);

        // Check for resource leaks
        expect(activeConnections).toBeLessThanOrEqual(2); // Should not exceed concurrency
        
        const status = audioProcessor.getQueueStatus();
        expect(status.size).toBe(0); // Queue should be empty between batches
      }

      expect(activeConnections).toBe(0); // All resources should be released
      console.log(`Long session completed without resource leaks`);
    });

    it('should handle queue pause and resume under load', async () => {
      audioProcessor = new AudioProcessor(3);

      let processedCount = 0;
      mockCommand.on.mockImplementation((event: string, callback: Function) => {
        if (event === 'end') {
          setTimeout(() => {
            processedCount++;
            callback();
          }, 100);
        }
        return mockCommand;
      });

      // Submit many tasks
      const tasks = Array.from({ length: 20 }, (_, i) =>
        audioProcessor.processAudioFile(
          `/input/pause${i}.wav`,
          `/output/pause${i}.mp3`,
          { volume: { adjust: -3 } },
          false
        )
      );

      // Let some tasks start
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Pause processing
      audioProcessor.pause();
      expect(audioProcessor.getQueueStatus().isPaused).toBe(true);
      
      const pausedCount = processedCount;
      
      // Wait and ensure no new tasks complete while paused
      await new Promise(resolve => setTimeout(resolve, 200));
      expect(processedCount).toBe(pausedCount); // Should not increase
      
      // Resume processing
      audioProcessor.resume();
      expect(audioProcessor.getQueueStatus().isPaused).toBe(false);
      
      // Wait for completion
      await Promise.all(tasks);
      
      expect(processedCount).toBe(20);
      console.log(`Pause/resume test: Paused at ${pausedCount}, completed ${processedCount}`);
    });
  });
});
