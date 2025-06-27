import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { promises as fs } from 'fs';
import {
  AudioOperations,
  ProcessingResult,
  AdvancedEffectsOperation,
  PitchOperation,
  TempoOperation,
  HarmonicsOperation,
  SpectralOperation,
  DynamicsOperation,
  SpatialOperation,
  ModulationOperation,
  VariationOperation,
  LayeringOperation,
  FFmpegError
} from '../types/index.js';
import {
  createFFmpegCommand,
  executeFFmpegCommand,
  validateInputFile,
  ensureOutputDirectory,
  handleExistingOutput,
  logger
} from '../utils/ffmpeg.js';
import { BaseAudioProcessor } from './base-audio-processor.js';

export class AdvancedAudioProcessor extends BaseAudioProcessor {
  
  constructor(concurrency: number = 2) {
    super(concurrency);
  }
  
  /**
   * Generate multiple variations of a sound from a single input
   */
  async generateVariations(
    inputFile: string,
    outputDirectory: string,
    variations: VariationOperation,
    baseOperations?: AudioOperations,
    overwrite: boolean = false
  ): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    
    try {
      await validateInputFile(inputFile);
      await ensureOutputDirectory(outputDirectory);
      
      const seed = variations.seed || Math.floor(Math.random() * 1000000);
      const rng = this.createSeededRandom(seed);
      
      for (let i = 0; i < variations.count; i++) {
        const variationOps: AudioOperations = {
          ...baseOperations,
          advanced: {
            ...baseOperations?.advanced,
            ...this.generateRandomVariation(variations, rng)
          }
        };
        
        const outputFile = path.join(outputDirectory, 
          `${path.parse(inputFile).name}_var${i + 1}${path.extname(inputFile)}`
        );
        
        const result = await this.processAudioFile(
          inputFile,
          outputFile,
          variationOps,
          overwrite
        );
        
        results.push(result);
      }
      
      return results;
      
    } catch (error) {
      throw new FFmpegError(`Variation generation failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Layer multiple sounds together with advanced blending
   */
  async layerSounds(
    inputFiles: string[],
    outputFile: string,
    layering: LayeringOperation,
    overwrite: boolean = false
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      if (inputFiles.length === 0) {
        throw new FFmpegError('No input files provided for layering');
      }
      
      // Validate all input files
      for (const file of inputFiles) {
        await validateInputFile(file);
      }
      
      await ensureOutputDirectory(outputFile);
      await handleExistingOutput(outputFile, overwrite);
      
      const command = ffmpeg();
      
      // Add all input files
      inputFiles.forEach(file => command.input(file));
      
      // Build complex filter for layering
      const filterGraph = this.buildLayeringFilter(inputFiles, layering);
      command.complexFilter(filterGraph);
      
      // Execute command
      await executeFFmpegCommand(command, outputFile);
      
      return {
        success: true,
        inputFile: inputFiles.join(', '),
        outputFile,
        processingTime: Date.now() - startTime,
        operations: { advanced: { layering } }
      };
      
    } catch (error) {
      return {
        success: false,
        inputFile: inputFiles.join(', '),
        outputFile,
        processingTime: Date.now() - startTime,
        operations: { advanced: { layering } },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Create harmonic variations by adding octaves and intervals
   */
  async createHarmonicVariations(
    inputFile: string,
    outputDirectory: string,
    harmonics: HarmonicsOperation,
    overwrite: boolean = false
  ): Promise<ProcessingResult[]> {
    const results: ProcessingResult[] = [];
    const baseName = path.parse(inputFile).name;
    
    const harmonicIntervals = [
      { name: 'octave_up', semitones: 12, mix: harmonics.octaveUp },
      { name: 'octave_down', semitones: -12, mix: harmonics.octaveDown },
      { name: 'fifth_up', semitones: 7, mix: harmonics.fifthUp },
      { name: 'third_up', semitones: 4, mix: harmonics.thirdUp }
    ];
    
    for (const interval of harmonicIntervals) {
      if (interval.mix && interval.mix > 0) {
        const outputFile = path.join(outputDirectory, 
          `${baseName}_${interval.name}${path.extname(inputFile)}`
        );
        
        const operations: AudioOperations = {
          advanced: {
            pitch: { semitones: interval.semitones },
            layering: {
              layers: [
                { blend: 'mix', volume: 1 - interval.mix },
                { blend: 'add', volume: interval.mix, pitch: interval.semitones }
              ]
            }
          }
        };
        
        const result = await this.processAudioFile(
          inputFile,
          outputFile,
          operations,
          overwrite
        );
        
        results.push(result);
      }
    }
    
    return results;
  }
  
  /**
   * Override the base applyOperationsToCommand to include advanced effects
   */
  protected applyOperationsToCommand(command: any, operations: AudioOperations): void {
    // Apply base operations first (volume, format, basic effects)
    super.applyOperationsToCommand(command, operations);
    
    // Apply advanced operations
    if (operations.advanced) {
      this.applyAdvancedOperations(command, operations.advanced);
    }
  }
  
  /**
   * Apply advanced operations to FFmpeg command
   */
  protected applyAdvancedOperations(command: any, advanced: AdvancedEffectsOperation): void {
    const filters: string[] = [];
    
    // Pitch shifting
    if (advanced.pitch) {
      filters.push(this.buildPitchFilter(advanced.pitch));
    }
    
    // Tempo adjustment
    if (advanced.tempo) {
      filters.push(this.buildTempoFilter(advanced.tempo));
    }
    
    // Spectral processing
    if (advanced.spectral) {
      const spectralFilter = this.buildSpectralFilter(advanced.spectral);
      if (spectralFilter) {
        filters.push(spectralFilter);
      }
    }
    
    // Dynamics processing
    if (advanced.dynamics) {
      filters.push(...this.buildDynamicsFilters(advanced.dynamics));
    }
    
    // Spatial processing
    if (advanced.spatial) {
      filters.push(...this.buildSpatialFilters(advanced.spatial));
    }
    
    // Modulation effects
    if (advanced.modulation) {
      filters.push(...this.buildModulationFilters(advanced.modulation));
    }
    
    // Apply all filters
    if (filters.length > 0) {
      command.audioFilters(filters);
    }
  }
  
  /**
   * Build pitch shifting filter
   */
  private buildPitchFilter(pitch: PitchOperation): string {
    const totalCents = (pitch.semitones * 100) + (pitch.cents || 0);
    const ratio = Math.pow(2, totalCents / 1200);
    
    if (pitch.preserveFormants) {
      return `asetrate=44100*${ratio},aresample=44100,atempo=${1/ratio}`;
    } else {
      return `asetrate=44100*${ratio},aresample=44100`;
    }
  }
  
  /**
   * Build tempo adjustment filter
   */
  private buildTempoFilter(tempo: TempoOperation): string {
    if (tempo.preservePitch) {
      return `atempo=${tempo.factor}`;
    } else {
      return `asetrate=44100*${tempo.factor},aresample=44100`;
    }
  }
  
  /**
   * Build spectral processing filter
   */
  private buildSpectralFilter(spectral: SpectralOperation): string {
    const eqBands: string[] = [];
    
    if (spectral.bassBoost !== undefined) {
      eqBands.push(`bass=g=${spectral.bassBoost}`);
    }
    
    if (spectral.trebleBoost !== undefined) {
      eqBands.push(`treble=g=${spectral.trebleBoost}`);
    }
    
    if (spectral.midCut !== undefined) {
      eqBands.push(`equalizer=f=1000:width=500:g=${-Math.abs(spectral.midCut)}`);
    }
    
    if (spectral.warmth !== undefined) {
      // Add subtle low-mid boost for warmth
      const warmthGain = spectral.warmth * 3;
      eqBands.push(`equalizer=f=200:width=100:g=${warmthGain}`);
    }
    
    if (spectral.brightness !== undefined) {
      // Add high frequency presence
      const brightnessGain = spectral.brightness * 4;
      eqBands.push(`equalizer=f=8000:width=2000:g=${brightnessGain}`);
    }
    
    return eqBands.join(',');
  }
  
  /**
   * Build dynamics processing filters
   */
  private buildDynamicsFilters(dynamics: DynamicsOperation): string[] {
    const filters: string[] = [];
    
    if (dynamics.compressor) {
      const comp = dynamics.compressor;
      filters.push(
        `acompressor=threshold=${comp.threshold}dB:ratio=${comp.ratio}:attack=${comp.attack}:release=${comp.release}${comp.knee ? `:knee=${comp.knee}` : ''}`
      );
    }
    
    if (dynamics.gate) {
      const gate = dynamics.gate;
      filters.push(
        `agate=threshold=${gate.threshold}dB:ratio=${gate.ratio}${gate.attack ? `:attack=${gate.attack}` : ''}${gate.release ? `:release=${gate.release}` : ''}`
      );
    }
    
    if (dynamics.limiter) {
      const limiter = dynamics.limiter;
      filters.push(
        `alimiter=limit=${limiter.threshold}dB${limiter.release ? `:release=${limiter.release}` : ''}`
      );
    }
    
    return filters;
  }
  
  /**
   * Build spatial processing filters
   */
  private buildSpatialFilters(spatial: SpatialOperation): string[] {
    const filters: string[] = [];
    
    if (spatial.stereoWidth !== undefined) {
      filters.push(`extrastereo=m=${spatial.stereoWidth}`);
    }
    
    if (spatial.panPosition !== undefined) {
      filters.push(`pan=stereo|c0=${1 - Math.abs(Math.min(0, spatial.panPosition))}*c0+${Math.max(0, -spatial.panPosition)}*c1|c1=${1 - Math.abs(Math.max(0, spatial.panPosition))}*c1+${Math.max(0, spatial.panPosition)}*c0`);
    }
    
    if (spatial.delayTime !== undefined) {
      const delaySeconds = spatial.delayTime / 1000;
      const feedback = spatial.delayFeedback || 0.3;
      filters.push(`adelay=${spatial.delayTime}|${spatial.delayTime}`);
      if (feedback > 0) {
        filters.push(`afeedback=feedback=${feedback}`);
      }
    }
    
    if (spatial.reverbSend !== undefined) {
      // Simple reverb using allpass filters
      filters.push(`aecho=0.8:0.9:${Math.floor(spatial.reverbSend * 1000)}:${spatial.reverbSend}`);
    }
    
    return filters;
  }
  
  /**
   * Build modulation effect filters
   */
  private buildModulationFilters(modulation: ModulationOperation): string[] {
    const filters: string[] = [];
    
    if (modulation.tremolo) {
      const trem = modulation.tremolo;
      filters.push(`tremolo=f=${trem.rate}:d=${trem.depth}`);
    }
    
    if (modulation.vibrato) {
      const vib = modulation.vibrato;
      filters.push(`vibrato=f=${vib.rate}:d=${vib.depth}`);
    }
    
    if (modulation.chorus) {
      const chorus = modulation.chorus;
      const delayMs = chorus.delay;
      filters.push(`chorus=0.7:0.9:${delayMs}:0.25:${chorus.rate}:${chorus.depth}:t`);
    }
    
    return filters;
  }
  
  /**
   * Build layering filter for complex mixing
   */
  private buildLayeringFilter(inputFiles: string[], layering: LayeringOperation): string {
    const layers = layering.layers;
    
    let filterGraph = '';
    
    // Apply individual layer processing
    layers.forEach((layer, i) => {
      if (i < inputFiles.length) {
        let layerFilter = `[${i}:a]`;
        
        // Apply layer-specific effects
        if (layer.delay) {
          layerFilter += `adelay=${layer.delay}[delayed${i}];[delayed${i}]`;
        }
        
        if (layer.pitch) {
          const ratio = Math.pow(2, layer.pitch / 12);
          layerFilter += `asetrate=44100*${ratio},aresample=44100[pitched${i}];[pitched${i}]`;
        }
        
        if (layer.volume !== undefined) {
          layerFilter += `volume=${layer.volume}[vol${i}];[vol${i}]`;
        }
        
        if (layer.pan !== undefined) {
          layerFilter += `pan=stereo|c0=${1 - Math.abs(Math.min(0, layer.pan))}*c0+${Math.max(0, -layer.pan)}*c1|c1=${1 - Math.abs(Math.max(0, layer.pan))}*c1+${Math.max(0, layer.pan)}*c0[pan${i}];[pan${i}]`;
        }
        
        filterGraph += layerFilter + `[processed${i}];`;
      }
    });
    
    // Mix all layers together
    const mixInputs = layers.map((_, i) => `[processed${i}]`).join('');
    filterGraph += `${mixInputs}amix=inputs=${layers.length}:duration=longest:dropout_transition=2[final]`;
    
    return filterGraph;
  }
  
  /**
   * Generate random variation parameters
   */
  private generateRandomVariation(variations: VariationOperation, rng: () => number): AdvancedEffectsOperation {
    const variation: AdvancedEffectsOperation = {};
    
    if (variations.pitchRange) {
      const pitchShift = (rng() - 0.5) * 2 * variations.pitchRange;
      variation.pitch = { semitones: pitchShift };
    }
    
    if (variations.spectralRange) {
      const bassShift = (rng() - 0.5) * 2 * variations.spectralRange;
      const trebleShift = (rng() - 0.5) * 2 * variations.spectralRange;
      variation.spectral = {
        bassBoost: bassShift,
        trebleBoost: trebleShift
      };
    }
    
    if (variations.timingRange) {
      const tempoShift = 1 + ((rng() - 0.5) * 0.2); // ±10% tempo variation
      variation.tempo = { factor: tempoShift, preservePitch: true };
    }
    
    return variation;
  }
  
  /**
   * Create seeded random number generator
   */
  private createSeededRandom(seed: number): () => number {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 0x100000000;
      return state / 0x100000000;
    };
  }
}

export default AdvancedAudioProcessor;
