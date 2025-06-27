import ffmpeg from 'fluent-ffmpeg';
import which from 'which';
import { promises as fs } from 'fs';
import path from 'path';
import winston from 'winston';
import { FFmpegError } from '../types/index.js';

// Configure logger - MUST output to stderr to avoid breaking MCP JSON-RPC protocol
const logger = winston.createLogger({
  level: process.env.AUDIO_TWEAKER_LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      stderrLevels: ['error', 'warn', 'info', 'debug'], // Send all levels to stderr
      format: winston.format.simple()
    })
  ]
});

/**
 * Check if FFmpeg is available on the system
 */
export async function checkFFmpegAvailability(): Promise<boolean> {
  try {
    await which('ffmpeg');
    logger.info('FFmpeg found on system PATH');
    return true;
  } catch (error) {
    logger.warn('FFmpeg not found on system PATH');
    return false;
  }
}

/**
 * Get FFmpeg version information
 */
export async function getFFmpegVersion(): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg.getAvailableFormats((err, formats) => {
      if (err) {
        reject(new FFmpegError(`Failed to get FFmpeg version: ${err.message}`));
        return;
      }
      
      ffmpeg.ffprobe('', (error, metadata) => {
        if (error) {
          reject(new FFmpegError(`Failed to get FFprobe version: ${error.message}`));
          return;
        }
        
        resolve('FFmpeg available with codecs and formats');
      });
    });
  });
}

/**
 * Validate that input file exists and is readable
 */
export async function validateInputFile(filePath: string): Promise<void> {
  try {
    const stats = await fs.stat(filePath);
    if (!stats.isFile()) {
      throw new FFmpegError(`Path is not a file: ${filePath}`);
    }
    
    // Check if file is readable
    await fs.access(filePath, fs.constants.R_OK);
    logger.debug(`Input file validated: ${filePath}`);
  } catch (error) {
    if (error instanceof FFmpegError) {
      throw error;
    }
    throw new FFmpegError(`Cannot access input file: ${filePath} - ${(error as Error).message}`);
  }
}

/**
 * Ensure output directory exists and is writable
 */
export async function ensureOutputDirectory(filePath: string): Promise<void> {
  try {
    const outputDir = path.dirname(filePath);
    await fs.mkdir(outputDir, { recursive: true });
    
    // Check if directory is writable
    await fs.access(outputDir, fs.constants.W_OK);
    logger.debug(`Output directory ensured: ${outputDir}`);
  } catch (error) {
    throw new FFmpegError(`Cannot create or access output directory: ${path.dirname(filePath)} - ${(error as Error).message}`);
  }
}

/**
 * Get audio file metadata using FFprobe
 */
export async function getAudioMetadata(filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new FFmpegError(`FFprobe failed for ${filePath}: ${err.message}`));
        return;
      }
      resolve(metadata);
    });
  });
}

/**
 * Build FFmpeg command with progress tracking
 */
export function createFFmpegCommand(inputPath: string): any {
  const command = ffmpeg(inputPath);
  
  // Add progress logging
  command.on('start', (commandLine) => {
    logger.info(`FFmpeg command started: ${commandLine}`);
  });
  
  command.on('progress', (progress) => {
    logger.debug(`Processing progress: ${progress.percent}% done`);
  });
  
  command.on('stderr', (stderrLine) => {
    logger.debug(`FFmpeg stderr: ${stderrLine}`);
  });
  
  return command;
}

/**
 * Execute FFmpeg command with proper error handling
 */
export async function executeFFmpegCommand(command: any, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    command
      .output(outputPath)
      .on('end', () => {
        logger.info(`FFmpeg processing completed: ${outputPath}`);
        resolve();
      })
      .on('error', (err: Error) => {
        logger.error(`FFmpeg processing failed: ${err.message}`);
        reject(new FFmpegError(`FFmpeg processing failed: ${err.message}`, {
          cause: err
        }));
      })
      .run();
  });
}

/**
 * Generate a safe output filename
 */
export function generateOutputFilename(
  inputPath: string, 
  outputDir?: string, 
  suffix: string = '_processed',
  newExtension?: string
): string {
  const inputDir = path.dirname(inputPath);
  const inputName = path.basename(inputPath, path.extname(inputPath));
  const inputExt = path.extname(inputPath);
  
  const outputDirectory = outputDir || inputDir;
  const extension = newExtension ? `.${newExtension}` : inputExt;
  
  return path.join(outputDirectory, `${inputName}${suffix}${extension}`);
}

/**
 * Check if output file already exists and handle accordingly
 */
export async function handleExistingOutput(outputPath: string, overwrite: boolean = false): Promise<void> {
  try {
    await fs.access(outputPath);
    
    if (!overwrite) {
      throw new FFmpegError(`Output file already exists: ${outputPath}. Use overwrite option to replace.`);
    }
    
    logger.warn(`Overwriting existing file: ${outputPath}`);
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      // File doesn't exist, which is what we want
      return;
    }
    throw error;
  }
}

/**
 * Cleanup temporary files
 */
export async function cleanupTempFiles(filePaths: string[]): Promise<void> {
  for (const filePath of filePaths) {
    try {
      await fs.unlink(filePath);
      logger.debug(`Cleaned up temporary file: ${filePath}`);
    } catch (error) {
      logger.warn(`Failed to cleanup temporary file ${filePath}: ${(error as Error).message}`);
    }
  }
}

export { logger };
