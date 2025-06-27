import ffmpeg from 'fluent-ffmpeg';
import { glob } from 'glob';
import PQueue from 'p-queue';
import path from 'path';
import { promises as fs } from 'fs';
import {
  AudioOperations,
  ProcessingResult,
  BatchProcessingResult,
  FFmpegError,
  ProcessingInput,
  ProcessingOutput
} from '../types/index.js';
import {
  createFFmpegCommand,
  executeFFmpegCommand,
  validateInputFile,
  ensureOutputDirectory,
  generateOutputFilename,
  handleExistingOutput,
  logger
} from '../utils/ffmpeg.js';

export class BaseAudioProcessor {
  protected queue: PQueue;
  
  constructor(concurrency: number = 2) {
    this.queue = new PQueue({ concurrency });
  }

  /**
   * Process a single audio file with specified operations
   */
  async processAudioFile(
    inputFile: string,
    outputFile: string,
    operations: AudioOperations,
    overwrite: boolean = false
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Validate input
      await validateInputFile(inputFile);
      await ensureOutputDirectory(outputFile);
      await handleExistingOutput(outputFile, overwrite);
      
      // Create FFmpeg command
      const command = createFFmpegCommand(inputFile);
      
      // Apply operations
      this.applyOperationsToCommand(command, operations);
      
      // Execute command
      await executeFFmpegCommand(command, outputFile);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        inputFile,
        outputFile,
        processingTime,
        operations
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      return {
        success: false,
        inputFile,
        outputFile,
        processingTime,
        operations,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process multiple audio files in a directory
   */
  async batchProcessAudio(
    input: ProcessingInput,
    output: ProcessingOutput,
    operations: AudioOperations,
    overwrite: boolean = false
  ): Promise<BatchProcessingResult> {
    const startTime = Date.now();
    
    try {
      // Find input files
      const inputFiles = await this.findInputFiles(input);
      
      if (inputFiles.length === 0) {
        throw new FFmpegError('No audio files found matching the criteria');
      }
      
      logger.info(`Found ${inputFiles.length} files to process`);
      
      // Process files with concurrency control via PQueue
      const processingPromises = inputFiles.map((inputFile) =>
        this.queue.add(async () => {
          const outputFile = this.generateBatchOutputPath(inputFile, input, output);
          // Create a new command for each file
          const command = createFFmpegCommand(inputFile);
          // Apply operations
          this.applyOperationsToCommand(command, operations);
          // Execute command
          return this.processAudioFile(inputFile, outputFile, operations, overwrite);
        })
      );

      const allResults = await Promise.all(processingPromises);
      const results: ProcessingResult[] = allResults.filter((r): r is ProcessingResult => !!r);
      
      const totalProcessingTime = Date.now() - startTime;
      const successfulFiles = results.filter(r => r.success).length;
      const failedFiles = results.length - successfulFiles;
      
      return {
        totalFiles: results.length,
        successfulFiles,
        failedFiles,
        results,
        totalProcessingTime
      };
      
    } catch (error) {
      throw new FFmpegError(`Batch processing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Apply audio operations to FFmpeg command - to be overridden by subclasses
   */
  protected applyOperationsToCommand(command: any, operations: AudioOperations): void {
    // Apply volume operations
    if (operations.volume) {
      if (operations.volume.adjust !== undefined) {
        command.audioFilters(`volume=${operations.volume.adjust}dB`);
      }
      
      if (operations.volume.normalize) {
        const targetLUFS = operations.volume.targetLUFS || -23;
        command.audioFilters(`loudnorm=I=${targetLUFS}:LRA=7:tp=-2`);
      }
    }
    
    // Apply format operations
    if (operations.format) {
      if (operations.format.sampleRate) {
        command.audioFrequency(operations.format.sampleRate);
      }
      
      if (operations.format.channels) {
        command.audioChannels(operations.format.channels);
      }
      
      if (operations.format.codec) {
        command.audioCodec(this.mapCodecToFFmpeg(operations.format.codec));
      }
      
      if (operations.format.bitrate) {
        command.audioBitrate(`${operations.format.bitrate}k`);
      }
    }
    
    // Apply effects
    if (operations.effects) {
      const filters: string[] = [];
      
      if (operations.effects.fadeIn !== undefined) {
        filters.push(`afade=t=in:ss=0:d=${operations.effects.fadeIn}`);
      }
      
      if (operations.effects.fadeOut !== undefined) {
        filters.push(`afade=t=out:st=${operations.effects.fadeOut}:d=1`);
      }
      
      if (operations.effects.trim) {
        command.seekInput(operations.effects.trim.start);
        if (operations.effects.trim.end > operations.effects.trim.start) {
          const duration = operations.effects.trim.end - operations.effects.trim.start;
          command.duration(duration);
        }
      }
      
      if (filters.length > 0) {
        command.audioFilters(filters);
      }
      
      if (operations.effects.loop?.enabled && operations.effects.loop.count > 1) {
        // For looping, we need to handle it differently
        filters.push(`aloop=loop=${operations.effects.loop.count - 1}:size=samples`);
      }
    }
  }

  /**
   * Map codec names to FFmpeg codec names
   */
  protected mapCodecToFFmpeg(codec: string): string {
    const codecMap: Record<string, string> = {
      'pcm': 'pcm_s16le',
      'mp3': 'libmp3lame',
      'aac': 'aac',
      'vorbis': 'libvorbis',
      'flac': 'flac'
    };
    
    return codecMap[codec] || codec;
  }

  /**
   * Find input files based on input specification
   */
  protected async findInputFiles(input: ProcessingInput): Promise<string[]> {
    if (input.file) {
      return [input.file];
    }
    
    if (input.directory) {
      const pattern = input.pattern || '*.{mp3,wav,ogg,flac,m4a,aac}';
      const searchPattern = path.join(input.directory, pattern);
      
      const files = await glob(searchPattern, {
        ignore: ['**/node_modules/**', '**/.git/**'],
        absolute: true
      });
      
      return files;
    }
    
    throw new FFmpegError('No valid input specification provided');
  }

  /**
   * Generate output path for batch processing
   */
  protected generateBatchOutputPath(
    inputFile: string,
    input: ProcessingInput,
    output: ProcessingOutput
  ): string {
    if (output.file) {
      return output.file;
    }
    
    if (output.directory) {
      const relativePath = input.directory ? 
        path.relative(input.directory, inputFile) : 
        path.basename(inputFile);
      
      const suffix = output.suffix || '_processed';
      const extension = output.format ? `.${output.format}` : path.extname(inputFile);
      const nameWithoutExt = path.basename(relativePath, path.extname(relativePath));
      
      return path.join(output.directory, `${nameWithoutExt}${suffix}${extension}`);
    }
    
    // Default: same directory with suffix
    return generateOutputFilename(inputFile, undefined, output.suffix, output.format);
  }

  /**
   * Get processing queue status
   */
  getQueueStatus() {
    return {
      size: this.queue.size,
      pending: this.queue.pending,
      isPaused: this.queue.isPaused
    };
  }

  /**
   * Pause processing queue
   */
  pause(): void {
    this.queue.pause();
  }

  /**
   * Resume processing queue
   */
  resume(): void {
    this.queue.start();
  }

  /**
   * Clear processing queue
   */
  clear(): void {
    this.queue.clear();
  }
}

export default BaseAudioProcessor;
