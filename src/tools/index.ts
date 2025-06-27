import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, Tool } from '@modelcontextprotocol/sdk/types.js';
import AudioProcessor from '../services/audio-processor.js';
import AdvancedAudioProcessor from '../services/advanced-audio-processor.js';
import { getPreset } from '../utils/presets.js';
import {
  ProcessAudioFileInputSchema,
  BatchProcessAudioInputSchema,
  ApplyPresetInputSchema
} from '../schemas/validation.js';
import { logger } from '../utils/ffmpeg.js';

const audioProcessor = new AudioProcessor();
const advancedProcessor = new AdvancedAudioProcessor();

/**
 * Process a single audio file tool
 */
export const processAudioFileTool: Tool = {
  name: 'process_audio_file',
  description: 'Apply audio processing operations to a single file using FFmpeg',
  inputSchema: {
    type: 'object',
    properties: {
      inputFile: {
        type: 'string',
        description: 'Path to input audio file'
      },
      outputFile: {
        type: 'string',
        description: 'Path for output file'
      },
      operations: {
        type: 'object',
        description: 'Audio processing operations to apply',
        properties: {
          volume: {
            type: 'object',
            properties: {
              adjust: { type: 'number', minimum: -60, maximum: 20 },
              normalize: { type: 'boolean' },
              targetLUFS: { type: 'number' }
            }
          },
          format: {
            type: 'object',
            properties: {
              sampleRate: { type: 'number', enum: [8000, 16000, 22050, 44100, 48000, 96000, 192000] },
              bitrate: { type: 'number', minimum: 64, maximum: 320 },
              channels: { type: 'number', enum: [1, 2, 6, 8] },
              codec: { type: 'string', enum: ['pcm', 'mp3', 'aac', 'vorbis', 'flac'] }
            }
          },
          effects: {
            type: 'object',
            properties: {
              fadeIn: { type: 'number', minimum: 0 },
              fadeOut: { type: 'number', minimum: 0 },
              trim: {
                type: 'object',
                properties: {
                  start: { type: 'number', minimum: 0 },
                  end: { type: 'number', minimum: 0 }
                }
              },
              loop: {
                type: 'object',
                properties: {
                  enabled: { type: 'boolean' },
                  count: { type: 'number', minimum: 1 }
                }
              }
            }
          }
        }
      },
      overwrite: {
        type: 'boolean',
        description: 'Whether to overwrite existing output files',
        default: false
      }
    },
    required: ['inputFile', 'outputFile', 'operations']
  }
};

/**
 * Batch process audio files tool
 */
export const batchProcessAudioTool: Tool = {
  name: 'batch_process_audio',
  description: 'Apply audio processing operations to multiple files in a directory',
  inputSchema: {
    type: 'object',
    properties: {
      inputDirectory: {
        type: 'string',
        description: 'Directory containing input files'
      },
      outputDirectory: {
        type: 'string',
        description: 'Directory for processed files'
      },
      filePattern: {
        type: 'string',
        description: 'Glob pattern for file matching',
        default: '*.{mp3,wav,ogg,flac,m4a,aac}'
      },
      operations: {
        type: 'object',
        description: 'Audio processing operations to apply (same as process_audio_file)'
      },
      overwrite: {
        type: 'boolean',
        description: 'Whether to overwrite existing output files',
        default: false
      }
    },
    required: ['inputDirectory', 'outputDirectory', 'operations']
  }
};

/**
 * Apply preset tool
 */
export const applyPresetTool: Tool = {
  name: 'apply_preset',
  description: 'Apply predefined audio processing preset optimized for specific use cases',
  inputSchema: {
    type: 'object',
    properties: {
      inputFile: {
        type: 'string',
        description: 'Path to input audio file'
      },
      outputFile: {
        type: 'string',
        description: 'Path for output file'
      },
      preset: {
        type: 'string',
        description: 'Preset name to apply',
        enum: [
          'game-audio-mobile',
          'game-audio-desktop',
          'game-audio-console',
          'elevenLabs-optimize',
          'voice-processing',
          'music-mastering',
          'sfx-optimization',
          'deep-mechanical',
          'bright-crystalline',
          'variation-pack',
          'layered-impact',
          'space-ambient',
          'punchy-game-sfx'
        ]
      },
      overwrite: {
        type: 'boolean',
        description: 'Whether to overwrite existing output files',
        default: false
      }
    },
    required: ['inputFile', 'outputFile', 'preset']
  }
};

/**
 * List available presets tool
 */
export const listPresetsTool: Tool = {
  name: 'list_presets',
  description: 'List all available audio processing presets with their descriptions',
  inputSchema: {
    type: 'object',
    properties: {
      category: {
        type: 'string',
        description: 'Filter presets by category',
        enum: ['game', 'voice', 'music', 'effects'],
        optional: true
      }
    }
  }
};

/**
 * Get processing queue status tool
 */
export const getQueueStatusTool: Tool = {
  name: 'get_queue_status',
  description: 'Get current status of the audio processing queue',
  inputSchema: {
    type: 'object',
    properties: {}
  }
};

/**
 * Generate sound variations tool
 */
export const generateVariationsTool: Tool = {
  name: 'generate_variations',
  description: 'Generate multiple variations of a sound from a single input - perfect for creating sound families',
  inputSchema: {
    type: 'object',
    properties: {
      inputFile: {
        type: 'string',
        description: 'Path to input audio file'
      },
      outputDirectory: {
        type: 'string',
        description: 'Directory for output variations'
      },
      count: {
        type: 'number',
        description: 'Number of variations to generate (1-20)',
        minimum: 1,
        maximum: 20,
        default: 5
      },
      pitchRange: {
        type: 'number',
        description: 'Pitch variation range in semitones (±)',
        minimum: 0,
        maximum: 12,
        default: 2
      },
      volumeRange: {
        type: 'number',
        description: 'Volume variation range in dB (±)',
        minimum: 0,
        maximum: 10,
        default: 3
      },
      spectralRange: {
        type: 'number',
        description: 'Spectral variation range in dB (±)',
        minimum: 0,
        maximum: 6,
        default: 2
      },
      seed: {
        type: 'number',
        description: 'Random seed for reproducible variations',
        optional: true
      },
      overwrite: {
        type: 'boolean',
        description: 'Whether to overwrite existing output files',
        default: false
      }
    },
    required: ['inputFile', 'outputDirectory']
  }
};

/**
 * Create harmonic variations tool
 */
export const createHarmonicsTool: Tool = {
  name: 'create_harmonics',
  description: 'Create harmonic variations by adding octaves and musical intervals',
  inputSchema: {
    type: 'object',
    properties: {
      inputFile: {
        type: 'string',
        description: 'Path to input audio file'
      },
      outputDirectory: {
        type: 'string',
        description: 'Directory for harmonic variations'
      },
      octaveUp: {
        type: 'number',
        description: 'Mix level for octave up (0-1)',
        minimum: 0,
        maximum: 1,
        optional: true
      },
      octaveDown: {
        type: 'number',
        description: 'Mix level for octave down (0-1)',
        minimum: 0,
        maximum: 1,
        optional: true
      },
      fifthUp: {
        type: 'number',
        description: 'Mix level for perfect fifth up (0-1)',
        minimum: 0,
        maximum: 1,
        optional: true
      },
      thirdUp: {
        type: 'number',
        description: 'Mix level for major third up (0-1)',
        minimum: 0,
        maximum: 1,
        optional: true
      },
      overwrite: {
        type: 'boolean',
        description: 'Whether to overwrite existing output files',
        default: false
      }
    },
    required: ['inputFile', 'outputDirectory']
  }
};

/**
 * Advanced audio processing tool
 */
export const advancedProcessTool: Tool = {
  name: 'advanced_process',
  description: 'Apply advanced audio processing including pitch shifting, spectral processing, dynamics, and spatial effects',
  inputSchema: {
    type: 'object',
    properties: {
      inputFile: {
        type: 'string',
        description: 'Path to input audio file'
      },
      outputFile: {
        type: 'string',
        description: 'Path for output file'
      },
      pitch: {
        type: 'object',
        description: 'Pitch shifting operations',
        properties: {
          semitones: { type: 'number', minimum: -12, maximum: 12 },
          cents: { type: 'number', minimum: -100, maximum: 100 },
          preserveFormants: { type: 'boolean' }
        },
        optional: true
      },
      tempo: {
        type: 'object',
        description: 'Tempo adjustment operations',
        properties: {
          factor: { type: 'number', minimum: 0.5, maximum: 2.0 },
          preservePitch: { type: 'boolean' }
        },
        optional: true
      },
      spectral: {
        type: 'object',
        description: 'Spectral processing operations',
        properties: {
          bassBoost: { type: 'number', minimum: -12, maximum: 12 },
          trebleBoost: { type: 'number', minimum: -12, maximum: 12 },
          midCut: { type: 'number', minimum: -12, maximum: 12 },
          warmth: { type: 'number', minimum: 0, maximum: 1 },
          brightness: { type: 'number', minimum: 0, maximum: 1 }
        },
        optional: true
      },
      dynamics: {
        type: 'object',
        description: 'Dynamics processing operations',
        properties: {
          compressor: {
            type: 'object',
            properties: {
              threshold: { type: 'number', minimum: -60, maximum: 0 },
              ratio: { type: 'number', minimum: 1, maximum: 20 },
              attack: { type: 'number', minimum: 0.1, maximum: 100 },
              release: { type: 'number', minimum: 1, maximum: 1000 }
            }
          },
          gate: {
            type: 'object',
            properties: {
              threshold: { type: 'number', minimum: -80, maximum: 0 },
              ratio: { type: 'number', minimum: 1, maximum: 20 }
            }
          }
        },
        optional: true
      },
      spatial: {
        type: 'object',
        description: 'Spatial processing operations',
        properties: {
          stereoWidth: { type: 'number', minimum: 0, maximum: 2 },
          panPosition: { type: 'number', minimum: -1, maximum: 1 },
          reverbSend: { type: 'number', minimum: 0, maximum: 1 },
          delayTime: { type: 'number', minimum: 0, maximum: 1000 },
          delayFeedback: { type: 'number', minimum: 0, maximum: 0.95 }
        },
        optional: true
      },
      overwrite: {
        type: 'boolean',
        description: 'Whether to overwrite existing output files',
        default: false
      }
    },
    required: ['inputFile', 'outputFile']
  }
};

/**
 * Layer multiple sounds tool
 */
export const layerSoundsTool: Tool = {
  name: 'layer_sounds',
  description: 'Layer multiple sounds together with advanced blending and timing',
  inputSchema: {
    type: 'object',
    properties: {
      inputFiles: {
        type: 'array',
        description: 'Array of input file paths to layer',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 8
      },
      outputFile: {
        type: 'string',
        description: 'Path for output file'
      },
      layers: {
        type: 'array',
        description: 'Layer configuration for each input',
        items: {
          type: 'object',
          properties: {
            blend: { type: 'string', enum: ['mix', 'multiply', 'add', 'subtract'] },
            delay: { type: 'number', minimum: 0, maximum: 5000 },
            pitch: { type: 'number', minimum: -12, maximum: 12 },
            volume: { type: 'number', minimum: 0, maximum: 2 },
            pan: { type: 'number', minimum: -1, maximum: 1 }
          },
          required: ['blend']
        }
      },
      overwrite: {
        type: 'boolean',
        description: 'Whether to overwrite existing output files',
        default: false
      }
    },
    required: ['inputFiles', 'outputFile', 'layers']
  }
};

/**
 * Register all tools with the MCP server
 */
export function registerTools(server: Server): void {
  // Register process_audio_file tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    try {
      switch (name) {
        case 'process_audio_file': {
          try {
            const input = ProcessAudioFileInputSchema.parse(args);
            const result = await audioProcessor.processAudioFile(
              input.inputFile,
              input.outputFile,
              input.operations,
              (args as any).overwrite || false
            );
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          } catch (validationError) {
            // If validation fails, try with the advanced processor
            const result = await advancedProcessor.processAudioFile(
              (args as any).inputFile,
              (args as any).outputFile,
              (args as any).operations,
              (args as any).overwrite || false
            );
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          }
        }
        
        case 'batch_process_audio': {
          try {
            const input = BatchProcessAudioInputSchema.parse(args);
            const result = await audioProcessor.batchProcessAudio(
              { directory: input.inputDirectory, pattern: input.filePattern },
              { directory: input.outputDirectory },
              input.operations,
              (args as any).overwrite || false
            );
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          } catch (validationError) {
            // If validation fails, try with the advanced processor
            const result = await advancedProcessor.batchProcessAudio(
              { directory: (args as any).inputDirectory, pattern: (args as any).filePattern },
              { directory: (args as any).outputDirectory },
              (args as any).operations,
              (args as any).overwrite || false
            );
            
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2)
                }
              ]
            };
          }
        }
        
        case 'apply_preset': {
          const input = ApplyPresetInputSchema.parse(args);
          const preset = getPreset(input.preset);
          
          const result = await audioProcessor.processAudioFile(
            input.inputFile,
            input.outputFile,
            preset.operations,
            (args as any).overwrite || false
          );
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  ...result,
                  presetUsed: preset.name,
                  presetDescription: preset.description
                }, null, 2)
              }
            ]
          };
        }
        
        case 'list_presets': {
          const { listPresets, getPresetsByCategory } = await import('../utils/presets.js');
          const category = (args as any)?.category;
          
          const presets = category ? getPresetsByCategory(category) : listPresets();
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(presets, null, 2)
              }
            ]
          };
        }
        
        case 'get_queue_status': {
          const status = audioProcessor.getQueueStatus();
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(status, null, 2)
              }
            ]
          };
        }
        
        case 'generate_variations': {
          const input = args as any;
          const variations = {
            count: input.count || 5,
            pitchRange: input.pitchRange || 2,
            volumeRange: input.volumeRange || 3,
            spectralRange: input.spectralRange || 2,
            seed: input.seed
          };
          
          const results = await advancedProcessor.generateVariations(
            input.inputFile,
            input.outputDirectory,
            variations,
            undefined,
            input.overwrite || false
          );
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  variationsGenerated: results.length,
                  results: results
                }, null, 2)
              }
            ]
          };
        }
        
        case 'create_harmonics': {
          const input = args as any;
          const harmonics = {
            octaveUp: input.octaveUp,
            octaveDown: input.octaveDown,
            fifthUp: input.fifthUp,
            thirdUp: input.thirdUp
          };
          
          const results = await advancedProcessor.createHarmonicVariations(
            input.inputFile,
            input.outputDirectory,
            harmonics,
            input.overwrite || false
          );
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  harmonicsCreated: results.length,
                  results: results
                }, null, 2)
              }
            ]
          };
        }
        
        case 'advanced_process': {
          const input = args as any;
          const operations = {
            advanced: {
              pitch: input.pitch,
              tempo: input.tempo,
              spectral: input.spectral,
              dynamics: input.dynamics,
              spatial: input.spatial
            }
          };
          
          const result = await advancedProcessor.processAudioFile(
            input.inputFile,
            input.outputFile,
            operations,
            input.overwrite || false
          );
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }
        
        case 'layer_sounds': {
          const input = args as any;
          const layering = {
            layers: input.layers
          };
          
          const result = await advancedProcessor.layerSounds(
            input.inputFiles,
            input.outputFile,
            layering,
            input.overwrite || false
          );
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(result, null, 2)
              }
            ]
          };
        }
        
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      logger.error(`Tool execution failed: ${(error as Error).message}`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: {
                code: 'TOOL_EXECUTION_FAILED',
                message: (error as Error).message,
                tool: name
              }
            }, null, 2)
          }
        ],
        isError: true
      };
    }
  });
}

export const tools = [
  processAudioFileTool,
  batchProcessAudioTool,
  applyPresetTool,
  listPresetsTool,
  getQueueStatusTool,
  generateVariationsTool,
  createHarmonicsTool,
  advancedProcessTool,
  layerSoundsTool
];
