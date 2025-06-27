import { z } from 'zod';

// File path validation
export const FilePathSchema = z.string().min(1).refine(
  (path) => {
    const supportedExtensions = ['.mp3', '.wav', '.ogg', '.flac', '.m4a', '.aac'];
    return supportedExtensions.some(ext => path.toLowerCase().endsWith(ext));
  },
  { message: "File must be a supported audio format (.mp3, .wav, .ogg, .flac, .m4a, .aac)" }
);

// Volume operation schema
export const VolumeOperationSchema = z.object({
  adjust: z.number().min(-60).max(20).optional(),
  normalize: z.boolean().default(false).optional(),
  targetLUFS: z.number().default(-23).optional()
});

// Format operation schema
export const FormatOperationSchema = z.object({
  sampleRate: z.union([
    z.literal(8000),
    z.literal(16000),
    z.literal(22050),
    z.literal(44100),
    z.literal(48000),
    z.literal(96000),
    z.literal(192000)
  ]).optional(),
  bitrate: z.number().min(64).max(320).optional(),
  channels: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(6),
    z.literal(8)
  ]).optional(),
  codec: z.enum(['pcm', 'mp3', 'aac', 'vorbis', 'flac']).optional()
});

// Effects operation schema
export const EffectsOperationSchema = z.object({
  fadeIn: z.number().min(0).optional(),
  fadeOut: z.number().min(0).optional(),
  trim: z.object({
    start: z.number().min(0),
    end: z.number().min(0)
  }).optional(),
  loop: z.object({
    enabled: z.boolean(),
    count: z.number().min(1)
  }).optional()
});

// Complete operations schema
export const AudioOperationsSchema = z.object({
  volume: VolumeOperationSchema.optional(),
  format: FormatOperationSchema.optional(),
  effects: EffectsOperationSchema.optional()
});

// Input schema
export const ProcessingInputSchema = z.object({
  file: z.string().optional(),
  directory: z.string().optional(),
  pattern: z.string().optional()
}).refine(
  (data) => data.file || data.directory,
  { message: "Either 'file' or 'directory' must be provided" }
);

// Output schema
export const ProcessingOutputSchema = z.object({
  file: z.string().optional(),
  directory: z.string().optional(),
  suffix: z.string().default('_processed').optional(),
  format: z.enum(['wav', 'mp3', 'ogg', 'flac', 'aac', 'm4a']).optional()
});

// Presets schema
export const ProcessingPresetsSchema = z.object({
  gameAudio: z.enum(['mobile', 'desktop', 'console', 'web']).optional(),
  quality: z.enum(['draft', 'preview', 'production', 'mastered']).optional()
});

// Complete processing parameters schema
export const AudioProcessingParametersSchema = z.object({
  input: ProcessingInputSchema,
  output: ProcessingOutputSchema,
  operations: AudioOperationsSchema.optional(),
  presets: ProcessingPresetsSchema.optional()
});

// Preset name schema
export const PresetNameSchema = z.enum([
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
]);

// Tool input schemas for MCP
export const ProcessAudioFileInputSchema = z.object({
  inputFile: FilePathSchema,
  outputFile: z.string().min(1),
  operations: AudioOperationsSchema
}).transform((data) => {
  // Transform string values to numbers for format operations
  if (data.operations.format) {
    if (data.operations.format.sampleRate && typeof data.operations.format.sampleRate === 'string') {
      data.operations.format.sampleRate = parseInt(data.operations.format.sampleRate) as any;
    }
    if (data.operations.format.channels && typeof data.operations.format.channels === 'string') {
      data.operations.format.channels = parseInt(data.operations.format.channels) as any;
    }
  }
  return data;
});

export const BatchProcessAudioInputSchema = z.object({
  inputDirectory: z.string().min(1),
  outputDirectory: z.string().min(1),
  filePattern: z.string().default('*.{mp3,wav,ogg,flac,m4a,aac}').optional(),
  operations: AudioOperationsSchema
}).transform((data) => {
  // Transform string values to numbers for format operations
  if (data.operations.format) {
    if (data.operations.format.sampleRate && typeof data.operations.format.sampleRate === 'string') {
      data.operations.format.sampleRate = parseInt(data.operations.format.sampleRate) as any;
    }
    if (data.operations.format.channels && typeof data.operations.format.channels === 'string') {
      data.operations.format.channels = parseInt(data.operations.format.channels) as any;
    }
  }
  return data;
});

export const ApplyPresetInputSchema = z.object({
  inputFile: FilePathSchema,
  outputFile: z.string().min(1),
  preset: PresetNameSchema
});

// Validation helper functions
export function validateFilePath(path: string): boolean {
  try {
    FilePathSchema.parse(path);
    return true;
  } catch {
    return false;
  }
}

export function validateAudioOperations(operations: unknown): boolean {
  try {
    AudioOperationsSchema.parse(operations);
    return true;
  } catch {
    return false;
  }
}

export function validateProcessingParameters(params: unknown): boolean {
  try {
    AudioProcessingParametersSchema.parse(params);
    return true;
  } catch {
    return false;
  }
}
