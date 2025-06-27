import { BaseAudioProcessor } from './base-audio-processor.js';
import { AudioOperations } from '../types/index.js';

export class AudioProcessor extends BaseAudioProcessor {
  constructor(concurrency: number = 2) {
    super(concurrency);
  }

  /**
   * Apply audio operations to FFmpeg command
   * This implementation handles standard operations only
   */
  protected applyOperationsToCommand(command: any, operations: AudioOperations): void {
    // Call parent implementation for base operations
    super.applyOperationsToCommand(command, operations);
    
    // Warn about advanced operations if present
    if (operations.advanced) {
      console.warn('Advanced audio operations detected but not supported in standard AudioProcessor. Use AdvancedAudioProcessor for advanced features.');
    }
  }
}

export default AudioProcessor;
