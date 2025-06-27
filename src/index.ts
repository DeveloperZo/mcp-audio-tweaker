#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { Command } from 'commander';
import { tools, registerTools } from './tools/index.js';
import { checkFFmpegAvailability, getFFmpegVersion, logger } from './utils/ffmpeg.js';
import AudioProcessor from './services/audio-processor.js';
import { getPreset, listPresets } from './utils/presets.js';
import {
  ProcessAudioFileInputSchema,
  BatchProcessAudioInputSchema,
  ApplyPresetInputSchema
} from './schemas/validation.js';

const APP_NAME = 'mcp-audio-tweaker';
const APP_VERSION = '1.0.0';

/**
 * Initialize MCP server
 */
async function initializeMCPServer(): Promise<Server> {
  // Check FFmpeg availability
  const ffmpegAvailable = await checkFFmpegAvailability();
  if (!ffmpegAvailable) {
    logger.warn('FFmpeg not found. Some functionality may be limited.');
  }

  // Create MCP server
  const server = new Server(
    {
      name: APP_NAME,
      version: APP_VERSION,
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  // Register list tools handler
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools
    };
  });

  // Register tool execution handlers
  registerTools(server);

  logger.info(`${APP_NAME} v${APP_VERSION} initialized`);
  return server;
}

/**
 * Start MCP server with STDIO transport
 */
async function startMCPServer(): Promise<void> {
  try {
    const server = await initializeMCPServer();
    const transport = new StdioServerTransport();
    
    await server.connect(transport);
    logger.info('MCP server started with STDIO transport');
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT, shutting down gracefully...');
      await server.close();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, shutting down gracefully...');
      await server.close();
      process.exit(0);
    });
    
  } catch (error) {
    logger.error(`Failed to start MCP server: ${(error as Error).message}`);
    process.exit(1);
  }
}

/**
 * Standalone mode for testing and direct usage
 */
async function standaloneMode(program: Command): Promise<void> {
  const audioProcessor = new AudioProcessor();
  
  program
    .command('process')
    .description('Process a single audio file')
    .requiredOption('-i, --input <file>', 'Input audio file')
    .requiredOption('-o, --output <file>', 'Output audio file')
    .option('-v, --volume <adjustment>', 'Volume adjustment in dB (-60 to 20)')
    .option('-s, --sample-rate <rate>', 'Sample rate (8000, 16000, 22050, 44100, 48000, 96000, 192000)')
    .option('-b, --bitrate <rate>', 'Bitrate in kbps (64-320)')
    .option('-c, --channels <count>', 'Number of channels (1, 2, 6, 8)')
    .option('--normalize', 'Normalize audio')
    .option('--fade-in <seconds>', 'Fade in duration in seconds')
    .option('--fade-out <seconds>', 'Fade out duration in seconds')
    .option('--overwrite', 'Overwrite existing output file')
    .action(async (options) => {
      try {
        const operations: any = {};
        
        // Build operations from CLI options
        if (options.volume || options.normalize) {
          operations.volume = {};
          if (options.volume) operations.volume.adjust = parseFloat(options.volume);
          if (options.normalize) operations.volume.normalize = true;
        }
        
        if (options.sampleRate || options.bitrate || options.channels) {
          operations.format = {};
          if (options.sampleRate) operations.format.sampleRate = parseInt(options.sampleRate);
          if (options.bitrate) operations.format.bitrate = parseInt(options.bitrate);
          if (options.channels) operations.format.channels = parseInt(options.channels);
        }
        
        if (options.fadeIn || options.fadeOut) {
          operations.effects = {};
          if (options.fadeIn) operations.effects.fadeIn = parseFloat(options.fadeIn);
          if (options.fadeOut) operations.effects.fadeOut = parseFloat(options.fadeOut);
        }
        
        console.log('Processing audio file...');
        const result = await audioProcessor.processAudioFile(
          options.input,
          options.output,
          operations,
          options.overwrite
        );
        
        console.log(JSON.stringify(result, null, 2));
        
      } catch (error) {
        console.error('Processing failed:', (error as Error).message);
        process.exit(1);
      }
    });

  program
    .command('batch')
    .description('Batch process audio files in a directory')
    .requiredOption('-i, --input-dir <directory>', 'Input directory')
    .requiredOption('-o, --output-dir <directory>', 'Output directory')
    .option('-p, --pattern <pattern>', 'File pattern', '*.{mp3,wav,ogg,flac,m4a,aac}')
    .option('--preset <name>', 'Use predefined preset')
    .option('--overwrite', 'Overwrite existing output files')
    .action(async (options) => {
      try {
        let operations: any = {};
        
        if (options.preset) {
          const preset = getPreset(options.preset as any);
          operations = preset.operations;
          console.log(`Using preset: ${preset.name} - ${preset.description}`);
        }
        
        console.log('Batch processing audio files...');
        const result = await audioProcessor.batchProcessAudio(
          { directory: options.inputDir, pattern: options.pattern },
          { directory: options.outputDir },
          operations,
          options.overwrite
        );
        
        console.log(JSON.stringify(result, null, 2));
        
      } catch (error) {
        console.error('Batch processing failed:', (error as Error).message);
        process.exit(1);
      }
    });

  program
    .command('presets')
    .description('List available presets')
    .option('-c, --category <category>', 'Filter by category (game, voice, music, effects)')
    .action(async (options) => {
      try {
        const { getPresetsByCategory } = await import('./utils/presets.js');
        const presets = options.category ? 
          getPresetsByCategory(options.category) : 
          listPresets();
        
        console.log('Available presets:');
        presets.forEach(preset => {
          console.log(`\n${preset.name}:`);
          console.log(`  Description: ${preset.description}`);
          console.log(`  Output Format: ${preset.outputFormat}`);
          console.log(`  Operations: ${JSON.stringify(preset.operations, null, 4)}`);
        });
        
      } catch (error) {
        console.error('Failed to list presets:', (error as Error).message);
        process.exit(1);
      }
    });

  program
    .command('check')
    .description('Check system requirements and FFmpeg availability')
    .action(async () => {
      try {
        console.log(`${APP_NAME} v${APP_VERSION}`);
        console.log('System Check:');
        
        const ffmpegAvailable = await checkFFmpegAvailability();
        console.log(`FFmpeg Available: ${ffmpegAvailable ? '✓' : '✗'}`);
        
        if (ffmpegAvailable) {
          try {
            const version = await getFFmpegVersion();
            console.log(`FFmpeg Status: ${version}`);
          } catch (error) {
            console.log(`FFmpeg Status: Available but version check failed`);
          }
        }
        
        console.log(`Node.js Version: ${process.version}`);
        console.log(`Platform: ${process.platform}`);
        
      } catch (error) {
        console.error('System check failed:', (error as Error).message);
        process.exit(1);
      }
    });
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const program = new Command();
  
  program
    .name(APP_NAME)
    .description('MCP server for batch audio processing and optimization using FFmpeg')
    .version(APP_VERSION);

  program
    .option('--standalone', 'Run in standalone mode for testing')
    .option('--log-level <level>', 'Set log level (debug, info, warn, error)', 'info');

  // Set log level from environment or CLI
  process.env.AUDIO_TWEAKER_LOG_LEVEL = program.opts().logLevel || process.env.AUDIO_TWEAKER_LOG_LEVEL;

  program.parse();
  const options = program.opts();

  if (options.standalone) {
    // Add standalone commands and parse again
    await standaloneMode(program);
    program.parse();
  } else {
    // Start MCP server
    await startMCPServer();
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the application
main().catch((error) => {
  logger.error('Application failed to start:', error);
  process.exit(1);
});
