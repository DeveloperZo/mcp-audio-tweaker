import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  tools,
  registerTools,
  processAudioFileTool,
  batchProcessAudioTool,
  applyPresetTool,
  listPresetsTool,
  getQueueStatusTool
} from '../../src/tools/index.js';

// Mock dependencies
jest.mock('@modelcontextprotocol/sdk/server/index.js');
jest.mock('../../src/services/audio-processor.js');
jest.mock('../../src/utils/presets.js');
jest.mock('../../src/utils/ffmpeg.js');

const mockServer = {
  setRequestHandler: jest.fn()
} as any;

describe('MCP Tools', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Server as jest.Mock).mockReturnValue(mockServer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Tool Definitions', () => {
    it('should export all expected tools', () => {
      expect(tools).toHaveLength(5);
      expect(tools).toContain(processAudioFileTool);
      expect(tools).toContain(batchProcessAudioTool);
      expect(tools).toContain(applyPresetTool);
      expect(tools).toContain(listPresetsTool);
      expect(tools).toContain(getQueueStatusTool);
    });

    describe('processAudioFileTool', () => {
      it('should have correct structure', () => {
        expect(processAudioFileTool.name).toBe('process_audio_file');
        expect(processAudioFileTool.description).toContain('single file');
        expect(processAudioFileTool.inputSchema.type).toBe('object');
        expect(processAudioFileTool.inputSchema.required).toEqual(['inputFile', 'outputFile', 'operations']);
      });

      it('should have proper volume operation schema', () => {
        const volumeSchema = processAudioFileTool.inputSchema.properties.operations.properties.volume;
        
        expect(volumeSchema.properties.adjust.minimum).toBe(-60);
        expect(volumeSchema.properties.adjust.maximum).toBe(20);
        expect(volumeSchema.properties.normalize.type).toBe('boolean');
        expect(volumeSchema.properties.targetLUFS.type).toBe('number');
      });

      it('should have proper format operation schema', () => {
        const formatSchema = processAudioFileTool.inputSchema.properties.operations.properties.format;
        
        expect(formatSchema.properties.sampleRate.enum).toEqual([8000, 16000, 22050, 44100, 48000, 96000, 192000]);
        expect(formatSchema.properties.bitrate.minimum).toBe(64);
        expect(formatSchema.properties.bitrate.maximum).toBe(320);
        expect(formatSchema.properties.channels.enum).toEqual([1, 2, 6, 8]);
        expect(formatSchema.properties.codec.enum).toEqual(['pcm', 'mp3', 'aac', 'vorbis', 'flac']);
      });

      it('should have proper effects operation schema', () => {
        const effectsSchema = processAudioFileTool.inputSchema.properties.operations.properties.effects;
        
        expect(effectsSchema.properties.fadeIn.minimum).toBe(0);
        expect(effectsSchema.properties.fadeOut.minimum).toBe(0);
        expect(effectsSchema.properties.trim.properties.start.minimum).toBe(0);
        expect(effectsSchema.properties.trim.properties.end.minimum).toBe(0);
        expect(effectsSchema.properties.loop.properties.count.minimum).toBe(1);
      });
    });

    describe('batchProcessAudioTool', () => {
      it('should have correct structure', () => {
        expect(batchProcessAudioTool.name).toBe('batch_process_audio');
        expect(batchProcessAudioTool.description).toContain('multiple files');
        expect(batchProcessAudioTool.inputSchema.required).toEqual(['inputDirectory', 'outputDirectory', 'operations']);
      });

      it('should have default file pattern', () => {
        const filePatternSchema = batchProcessAudioTool.inputSchema.properties.filePattern;
        expect(filePatternSchema.default).toBe('*.{mp3,wav,ogg,flac,m4a,aac}');
      });
    });

    describe('applyPresetTool', () => {
      it('should have correct structure', () => {
        expect(applyPresetTool.name).toBe('apply_preset');
        expect(applyPresetTool.description).toContain('preset');
        expect(applyPresetTool.inputSchema.required).toEqual(['inputFile', 'outputFile', 'preset']);
      });

      it('should have all preset options', () => {
        const presetSchema = applyPresetTool.inputSchema.properties.preset;
        const expectedPresets = [
          'game-audio-mobile',
          'game-audio-desktop',
          'game-audio-console',
          'elevenLabs-optimize',
          'voice-processing',
          'music-mastering',
          'sfx-optimization'
        ];
        
        expect(presetSchema.enum).toEqual(expectedPresets);
      });
    });

    describe('listPresetsTool', () => {
      it('should have correct structure', () => {
        expect(listPresetsTool.name).toBe('list_presets');
        expect(listPresetsTool.description).toContain('List all');
        expect(listPresetsTool.inputSchema.properties.category.enum).toEqual(['game', 'voice', 'music', 'effects']);
      });
    });

    describe('getQueueStatusTool', () => {
      it('should have correct structure', () => {
        expect(getQueueStatusTool.name).toBe('get_queue_status');
        expect(getQueueStatusTool.description).toContain('queue');
        expect(getQueueStatusTool.inputSchema.properties).toEqual({});
      });
    });
  });

  describe('Tool Registration', () => {
    it('should register request handler with server', () => {
      registerTools(mockServer);
      
      expect(mockServer.setRequestHandler).toHaveBeenCalledTimes(1);
      expect(mockServer.setRequestHandler).toHaveBeenCalledWith(
        expect.any(Object), // CallToolRequestSchema
        expect.any(Function)
      );
    });

    it('should handle tool execution registration', () => {
      registerTools(mockServer);
      
      const handlerCall = mockServer.setRequestHandler.mock.calls[0];
      expect(handlerCall).toHaveLength(2);
      expect(typeof handlerCall[1]).toBe('function');
    });
  });

  describe('Tool Execution Handler', () => {
    let toolHandler: Function;
    let mockAudioProcessor: any;
    let mockPresets: any;

    beforeEach(async () => {
      // Setup mocks
      mockAudioProcessor = {
        processAudioFile: jest.fn(),
        batchProcessAudio: jest.fn(),
        getQueueStatus: jest.fn()
      };

      mockPresets = {
        getPreset: jest.fn(),
        listPresets: jest.fn(),
        getPresetsByCategory: jest.fn()
      };

      // Mock the imports
      jest.doMock('../../src/services/audio-processor.js', () => ({
        default: jest.fn(() => mockAudioProcessor)
      }));

      jest.doMock('../../src/utils/presets.js', () => mockPresets);

      registerTools(mockServer);
      toolHandler = mockServer.setRequestHandler.mock.calls[0][1];
    });

    describe('process_audio_file tool execution', () => {
      it('should execute successfully with valid input', async () => {
        const mockResult = {
          success: true,
          inputFile: '/input/test.mp3',
          outputFile: '/output/processed.mp3',
          processingTime: 1500,
          operations: { volume: { adjust: -3 } }
        };

        mockAudioProcessor.processAudioFile.mockResolvedValue(mockResult);

        const request = {
          params: {
            name: 'process_audio_file',
            arguments: {
              inputFile: '/input/test.mp3',
              outputFile: '/output/processed.mp3',
              operations: { volume: { adjust: -3 } },
              overwrite: false
            }
          }
        };

        const response = await toolHandler(request);

        expect(response.content[0].type).toBe('text');
        expect(JSON.parse(response.content[0].text)).toEqual(mockResult);
        expect(mockAudioProcessor.processAudioFile).toHaveBeenCalledWith(
          '/input/test.mp3',
          '/output/processed.mp3',
          { volume: { adjust: -3 } },
          false
        );
      });

      it('should handle processing errors', async () => {
        mockAudioProcessor.processAudioFile.mockRejectedValue(new Error('Processing failed'));

        const request = {
          params: {
            name: 'process_audio_file',
            arguments: {
              inputFile: '/input/test.mp3',
              outputFile: '/output/processed.mp3',
              operations: {}
            }
          }
        };

        const response = await toolHandler(request);

        expect(response.isError).toBe(true);
        expect(response.content[0].type).toBe('text');
        const error = JSON.parse(response.content[0].text);
        expect(error.error.message).toContain('Processing failed');
      });
    });

    describe('batch_process_audio tool execution', () => {
      it('should execute successfully with valid input', async () => {
        const mockResult = {
          totalFiles: 3,
          successfulFiles: 3,
          failedFiles: 0,
          results: [],
          totalProcessingTime: 5000
        };

        mockAudioProcessor.batchProcessAudio.mockResolvedValue(mockResult);

        const request = {
          params: {
            name: 'batch_process_audio',
            arguments: {
              inputDirectory: '/input',
              outputDirectory: '/output',
              operations: { format: { codec: 'mp3' } }
            }
          }
        };

        const response = await toolHandler(request);

        expect(response.content[0].type).toBe('text');
        expect(JSON.parse(response.content[0].text)).toEqual(mockResult);
        expect(mockAudioProcessor.batchProcessAudio).toHaveBeenCalledWith(
          { directory: '/input', pattern: undefined },
          { directory: '/output' },
          { format: { codec: 'mp3' } },
          false
        );
      });

      it('should use custom file pattern', async () => {
        mockAudioProcessor.batchProcessAudio.mockResolvedValue({});

        const request = {
          params: {
            name: 'batch_process_audio',
            arguments: {
              inputDirectory: '/input',
              outputDirectory: '/output',
              filePattern: '*.wav',
              operations: {}
            }
          }
        };

        await toolHandler(request);

        expect(mockAudioProcessor.batchProcessAudio).toHaveBeenCalledWith(
          { directory: '/input', pattern: '*.wav' },
          { directory: '/output' },
          {},
          false
        );
      });
    });

    describe('apply_preset tool execution', () => {
      it('should execute successfully with valid preset', async () => {
        const mockPresetDef = {
          name: 'game-audio-mobile',
          description: 'Mobile game audio preset',
          operations: { format: { codec: 'aac' } },
          outputFormat: 'm4a'
        };

        const mockResult = {
          success: true,
          inputFile: '/input/audio.wav',
          outputFile: '/output/mobile.m4a',
          processingTime: 2000,
          operations: mockPresetDef.operations
        };

        mockPresets.getPreset.mockReturnValue(mockPresetDef);
        mockAudioProcessor.processAudioFile.mockResolvedValue(mockResult);

        const request = {
          params: {
            name: 'apply_preset',
            arguments: {
              inputFile: '/input/audio.wav',
              outputFile: '/output/mobile.m4a',
              preset: 'game-audio-mobile'
            }
          }
        };

        const response = await toolHandler(request);

        expect(response.content[0].type).toBe('text');
        const result = JSON.parse(response.content[0].text);
        expect(result.presetUsed).toBe('game-audio-mobile');
        expect(result.presetDescription).toBe('Mobile game audio preset');
        expect(mockPresets.getPreset).toHaveBeenCalledWith('game-audio-mobile');
      });

      it('should handle invalid preset', async () => {
        mockPresets.getPreset.mockImplementation(() => {
          throw new Error('Preset not found');
        });

        const request = {
          params: {
            name: 'apply_preset',
            arguments: {
              inputFile: '/input/audio.wav',
              outputFile: '/output/processed.wav',
              preset: 'invalid-preset'
            }
          }
        };

        const response = await toolHandler(request);

        expect(response.isError).toBe(true);
        expect(response.content[0].text).toContain('Preset not found');
      });
    });

    describe('list_presets tool execution', () => {
      it('should list all presets when no category specified', async () => {
        const mockPresets = [
          { name: 'preset1', description: 'Test preset 1' },
          { name: 'preset2', description: 'Test preset 2' }
        ];

        mockPresets.listPresets = jest.fn().mockReturnValue(mockPresets);

        const request = {
          params: {
            name: 'list_presets',
            arguments: {}
          }
        };

        const response = await toolHandler(request);

        expect(response.content[0].type).toBe('text');
        expect(JSON.parse(response.content[0].text)).toEqual(mockPresets);
      });

      it('should filter presets by category', async () => {
        const mockGamePresets = [
          { name: 'game-audio-mobile', description: 'Mobile preset' }
        ];

        mockPresets.getPresetsByCategory = jest.fn().mockReturnValue(mockGamePresets);

        const request = {
          params: {
            name: 'list_presets',
            arguments: { category: 'game' }
          }
        };

        const response = await toolHandler(request);

        expect(response.content[0].type).toBe('text');
        expect(JSON.parse(response.content[0].text)).toEqual(mockGamePresets);
        expect(mockPresets.getPresetsByCategory).toHaveBeenCalledWith('game');
      });
    });

    describe('get_queue_status tool execution', () => {
      it('should return queue status', async () => {
        const mockStatus = {
          size: 2,
          pending: 1,
          isPaused: false
        };

        mockAudioProcessor.getQueueStatus.mockReturnValue(mockStatus);

        const request = {
          params: {
            name: 'get_queue_status',
            arguments: {}
          }
        };

        const response = await toolHandler(request);

        expect(response.content[0].type).toBe('text');
        expect(JSON.parse(response.content[0].text)).toEqual(mockStatus);
      });
    });

    describe('Unknown tool handling', () => {
      it('should handle unknown tool names', async () => {
        const request = {
          params: {
            name: 'unknown_tool',
            arguments: {}
          }
        };

        const response = await toolHandler(request);

        expect(response.isError).toBe(true);
        expect(response.content[0].text).toContain('Unknown tool: unknown_tool');
      });
    });

    describe('Input validation', () => {
      it('should handle invalid input schemas', async () => {
        const request = {
          params: {
            name: 'process_audio_file',
            arguments: {
              // Missing required fields
              inputFile: '/input/test.mp3'
              // Missing outputFile and operations
            }
          }
        };

        const response = await toolHandler(request);

        expect(response.isError).toBe(true);
        expect(response.content[0].text).toContain('TOOL_EXECUTION_FAILED');
      });
    });
  });

  describe('Schema Validation Integration', () => {
    it('should properly validate volume operations', () => {
      const volumeSchema = processAudioFileTool.inputSchema.properties.operations.properties.volume;
      
      // Test boundary values
      expect(volumeSchema.properties.adjust.minimum).toBe(-60);
      expect(volumeSchema.properties.adjust.maximum).toBe(20);
      
      // Ensure boolean types
      expect(volumeSchema.properties.normalize.type).toBe('boolean');
    });

    it('should properly validate format operations', () => {
      const formatSchema = processAudioFileTool.inputSchema.properties.operations.properties.format;
      
      // Test sample rate enum
      const validSampleRates = [8000, 16000, 22050, 44100, 48000, 96000, 192000];
      expect(formatSchema.properties.sampleRate.enum).toEqual(validSampleRates);
      
      // Test codec enum
      const validCodecs = ['pcm', 'mp3', 'aac', 'vorbis', 'flac'];
      expect(formatSchema.properties.codec.enum).toEqual(validCodecs);
    });

    it('should properly validate preset names', () => {
      const presetSchema = applyPresetTool.inputSchema.properties.preset;
      
      expect(presetSchema.enum).toContain('game-audio-mobile');
      expect(presetSchema.enum).toContain('elevenLabs-optimize');
      expect(presetSchema.enum).toContain('voice-processing');
    });
  });
});
