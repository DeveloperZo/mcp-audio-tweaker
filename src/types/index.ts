export interface AudioFile {
  path: string;
  name: string;
  size: number;
  modified?: Date;
}

export interface AudioFormat {
  container: string;
  codec: string;
  lossless?: boolean;
  duration?: number;
  bitrate?: number;
  sampleRate?: number;
  channels?: number;
  bitsPerSample?: number;
}

export interface VolumeOperation {
  adjust?: number; // dB adjustment (-60 to +20)
  normalize?: boolean;
  targetLUFS?: number; // default -23
}

export interface FormatOperation {
  sampleRate?: 8000 | 16000 | 22050 | 44100 | 48000 | 96000 | 192000;
  bitrate?: number; // 64-320 kbps
  channels?: 1 | 2 | 6 | 8;
  codec?: 'pcm' | 'mp3' | 'aac' | 'vorbis' | 'flac';
}

export interface EffectsOperation {
  fadeIn?: number; // seconds
  fadeOut?: number; // seconds
  trim?: {
    start: number;
    end: number;
  };
  loop?: {
    enabled: boolean;
    count: number;
  };
}

// Advanced audio manipulation interfaces
export interface PitchOperation {
  semitones: number; // -12 to +12 (octave down to octave up)
  cents?: number; // Fine-tuning (-100 to +100)
  preserveFormants?: boolean; // Keep vocal character
}

export interface TempoOperation {
  factor: number; // 0.5 to 2.0 (half to double speed)
  preservePitch?: boolean; // Keep original pitch
}

export interface HarmonicsOperation {
  octaveUp?: number; // Add higher octave (0-1 mix)
  octaveDown?: number; // Add lower octave (0-1 mix)
  fifthUp?: number; // Add perfect fifth (0-1 mix)
  thirdUp?: number; // Add major third (0-1 mix)
}

export interface SpectralOperation {
  bassBoost?: number; // Enhance low frequencies (dB)
  trebleBoost?: number; // Enhance high frequencies (dB)
  midCut?: number; // Reduce mid frequencies (dB)
  warmth?: number; // Add analog-style warmth (0-1)
  brightness?: number; // Add sparkle/presence (0-1)
}

export interface DynamicsOperation {
  compressor?: {
    threshold: number; // -dB level to start compression
    ratio: number; // Compression ratio (2, 4, 8, etc.)
    attack: number; // Attack time in ms
    release: number; // Release time in ms
    knee?: number; // Soft knee (0-40)
  };
  gate?: {
    threshold: number; // Noise gate threshold in dB
    ratio: number; // Gate ratio
    attack?: number; // Gate attack time in ms
    release?: number; // Gate release time in ms
  };
  limiter?: {
    threshold: number; // Limiting threshold in dB
    release?: number; // Release time in ms
  };
}

export interface SpatialOperation {
  stereoWidth?: number; // 0-2 (mono to super-wide)
  panPosition?: number; // -1 to 1 (left to right)
  reverbSend?: number; // 0-1 reverb amount
  delayTime?: number; // Delay time in ms
  delayFeedback?: number; // Delay feedback (0-0.95)
}

export interface EnvelopeOperation {
  attack: number; // Attack curve (0-1000ms)
  decay: number; // Decay time (0-1000ms)
  sustain: number; // Sustain level (0-1)
  release: number; // Release time (0-5000ms)
}

export interface ModulationOperation {
  tremolo?: {
    rate: number; // Hz (0.1-20)
    depth: number; // 0-1
    waveform?: 'sine' | 'triangle' | 'square';
  };
  vibrato?: {
    rate: number; // Hz (0.1-20)
    depth: number; // 0-1
    waveform?: 'sine' | 'triangle';
  };
  chorus?: {
    rate: number; // Hz (0.1-5)
    depth: number; // 0-1
    delay: number; // ms (5-40)
  };
}

export interface VariationOperation {
  count: number; // How many variants to create (1-20)
  pitchRange?: number; // ±semitones for random pitch variation
  volumeRange?: number; // ±dB for random volume variation
  timingRange?: number; // ±ms for random timing variation
  spectralRange?: number; // ±dB for random spectral variation
  seed?: number; // Random seed for reproducible variations
}

export interface LayeringOperation {
  layers: Array<{
    blend: 'mix' | 'multiply' | 'add' | 'subtract';
    delay?: number; // Offset in milliseconds
    pitch?: number; // Pitch offset in semitones
    volume?: number; // Layer volume (0-1)
    pan?: number; // Pan position (-1 to 1)
  }>;
}

export interface AdvancedEffectsOperation {
  pitch?: PitchOperation;
  tempo?: TempoOperation;
  harmonics?: HarmonicsOperation;
  spectral?: SpectralOperation;
  dynamics?: DynamicsOperation;
  spatial?: SpatialOperation;
  envelope?: EnvelopeOperation;
  modulation?: ModulationOperation;
  variations?: VariationOperation;
  layering?: LayeringOperation;
}

export interface AudioOperations {
  volume?: VolumeOperation;
  format?: FormatOperation;
  effects?: EffectsOperation;
  advanced?: AdvancedEffectsOperation;
}

export interface ProcessingInput {
  file?: string;
  directory?: string;
  pattern?: string;
}

export interface ProcessingOutput {
  file?: string;
  directory?: string;
  suffix?: string;
  format?: 'wav' | 'mp3' | 'ogg' | 'flac' | 'aac' | 'm4a';
}

export interface ProcessingPresets {
  gameAudio?: 'mobile' | 'desktop' | 'console' | 'web';
  quality?: 'draft' | 'preview' | 'production' | 'mastered';
}

export interface AudioProcessingParameters {
  input: ProcessingInput;
  output: ProcessingOutput;
  operations?: AudioOperations;
  presets?: ProcessingPresets;
}

export interface ProcessingResult {
  success: boolean;
  inputFile: string;
  outputFile: string;
  processingTime: number;
  operations: AudioOperations;
  error?: string;
}

export interface BatchProcessingResult {
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  results: ProcessingResult[];
  totalProcessingTime: number;
}

export class FFmpegError extends Error {
  code?: string;
  details?: string;
  command?: string;

  constructor(message: string, options?: { cause?: Error }) {
    super(message);
    this.name = 'FFmpegError';
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export type PresetName = 
  | 'game-audio-mobile'
  | 'game-audio-desktop' 
  | 'game-audio-console'
  | 'elevenLabs-optimize'
  | 'voice-processing'
  | 'music-mastering'
  | 'sfx-optimization'
  | 'deep-mechanical'
  | 'bright-crystalline'
  | 'variation-pack'
  | 'layered-impact'
  | 'space-ambient'
  | 'punchy-game-sfx';

export interface PresetDefinition {
  name: PresetName;
  description: string;
  operations: AudioOperations;
  outputFormat: ProcessingOutput['format'];
}
