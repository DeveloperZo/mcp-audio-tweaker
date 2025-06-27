import { describe, it, expect } from '@jest/globals';
import {
  PRESETS,
  getPreset,
  listPresets,
  getPresetNames,
  presetExists,
  getPresetsByCategory
} from '../../src/utils/presets.js';
import { PresetName } from '../../src/types/index.js';

describe('Presets Utility', () => {
  describe('PRESETS constant', () => {
    it('should contain all expected presets', () => {
      const expectedPresets: PresetName[] = [
        'game-audio-mobile',
        'game-audio-desktop', 
        'game-audio-console',
        'elevenLabs-optimize',
        'voice-processing',
        'music-mastering',
        'sfx-optimization'
      ];

      expectedPresets.forEach(preset => {
        expect(PRESETS).toHaveProperty(preset);
      });

      expect(Object.keys(PRESETS)).toHaveLength(7);
    });

    it('should have valid preset structures', () => {
      Object.values(PRESETS).forEach(preset => {
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('description');
        expect(preset).toHaveProperty('operations');
        expect(preset).toHaveProperty('outputFormat');
        
        expect(typeof preset.name).toBe('string');
        expect(typeof preset.description).toBe('string');
        expect(typeof preset.operations).toBe('object');
        expect(typeof preset.outputFormat).toBe('string');
      });
    });
  });

  describe('getPreset', () => {
    it('should return valid preset for game-audio-mobile', () => {
      const preset = getPreset('game-audio-mobile');
      
      expect(preset.name).toBe('game-audio-mobile');
      expect(preset.description).toContain('mobile');
      expect(preset.outputFormat).toBe('m4a');
      expect(preset.operations.format?.sampleRate).toBe(22050);
      expect(preset.operations.format?.codec).toBe('aac');
      expect(preset.operations.volume?.normalize).toBe(true);
    });

    it('should return valid preset for game-audio-desktop', () => {
      const preset = getPreset('game-audio-desktop');
      
      expect(preset.name).toBe('game-audio-desktop');
      expect(preset.description).toContain('desktop');
      expect(preset.outputFormat).toBe('ogg');
      expect(preset.operations.format?.sampleRate).toBe(44100);
      expect(preset.operations.format?.codec).toBe('vorbis');
    });

    it('should return valid preset for game-audio-console', () => {
      const preset = getPreset('game-audio-console');
      
      expect(preset.name).toBe('game-audio-console');
      expect(preset.description).toContain('console');
      expect(preset.outputFormat).toBe('wav');
      expect(preset.operations.format?.sampleRate).toBe(48000);
      expect(preset.operations.format?.codec).toBe('pcm');
    });

    it('should return valid preset for elevenLabs-optimize', () => {
      const preset = getPreset('elevenLabs-optimize');
      
      expect(preset.name).toBe('elevenLabs-optimize');
      expect(preset.description).toContain('ElevenLabs');
      expect(preset.outputFormat).toBe('mp3');
      expect(preset.operations.format?.channels).toBe(1);
      expect(preset.operations.effects?.fadeIn).toBe(0.05);
      expect(preset.operations.effects?.fadeOut).toBe(0.1);
    });

    it('should return valid preset for voice-processing', () => {
      const preset = getPreset('voice-processing');
      
      expect(preset.name).toBe('voice-processing');
      expect(preset.description).toContain('voice');
      expect(preset.outputFormat).toBe('mp3');
      expect(preset.operations.format?.channels).toBe(1);
      expect(preset.operations.volume?.targetLUFS).toBe(-23);
    });

    it('should return valid preset for music-mastering', () => {
      const preset = getPreset('music-mastering');
      
      expect(preset.name).toBe('music-mastering');
      expect(preset.description).toContain('music');
      expect(preset.outputFormat).toBe('flac');
      expect(preset.operations.format?.codec).toBe('flac');
      expect(preset.operations.volume?.targetLUFS).toBe(-14);
    });

    it('should return valid preset for sfx-optimization', () => {
      const preset = getPreset('sfx-optimization');
      
      expect(preset.name).toBe('sfx-optimization');
      expect(preset.description).toContain('effects');
      expect(preset.outputFormat).toBe('ogg');
      expect(preset.operations.format?.channels).toBe(1);
    });

    it('should throw error for invalid preset name', () => {
      expect(() => getPreset('invalid-preset' as PresetName)).toThrow('Preset \'invalid-preset\' not found');
      expect(() => getPreset('custom-preset' as PresetName)).toThrow();
      expect(() => getPreset('' as PresetName)).toThrow();
    });
  });

  describe('listPresets', () => {
    it('should return all presets', () => {
      const presets = listPresets();
      
      expect(presets).toHaveLength(7);
      expect(presets.every(p => typeof p === 'object')).toBe(true);
      expect(presets.every(p => p.name && p.description && p.operations && p.outputFormat)).toBe(true);
    });

    it('should return presets with unique names', () => {
      const presets = listPresets();
      const names = presets.map(p => p.name);
      const uniqueNames = new Set(names);
      
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should include specific expected presets', () => {
      const presets = listPresets();
      const names = presets.map(p => p.name);
      
      expect(names).toContain('game-audio-mobile');
      expect(names).toContain('elevenLabs-optimize');
      expect(names).toContain('voice-processing');
      expect(names).toContain('music-mastering');
    });
  });

  describe('getPresetNames', () => {
    it('should return all preset names', () => {
      const names = getPresetNames();
      
      expect(names).toHaveLength(7);
      expect(names).toContain('game-audio-mobile');
      expect(names).toContain('game-audio-desktop');
      expect(names).toContain('game-audio-console');
      expect(names).toContain('elevenLabs-optimize');
      expect(names).toContain('voice-processing');
      expect(names).toContain('music-mastering');
      expect(names).toContain('sfx-optimization');
    });

    it('should return only strings', () => {
      const names = getPresetNames();
      
      expect(names.every(name => typeof name === 'string')).toBe(true);
    });

    it('should match keys in PRESETS', () => {
      const names = getPresetNames();
      const presetKeys = Object.keys(PRESETS);
      
      expect(names.sort()).toEqual(presetKeys.sort());
    });
  });

  describe('presetExists', () => {
    it('should return true for valid preset names', () => {
      expect(presetExists('game-audio-mobile')).toBe(true);
      expect(presetExists('elevenLabs-optimize')).toBe(true);
      expect(presetExists('voice-processing')).toBe(true);
      expect(presetExists('music-mastering')).toBe(true);
      expect(presetExists('sfx-optimization')).toBe(true);
    });

    it('should return false for invalid preset names', () => {
      expect(presetExists('invalid-preset')).toBe(false);
      expect(presetExists('custom-preset')).toBe(false);
      expect(presetExists('')).toBe(false);
      expect(presetExists('game-audio')).toBe(false);
      expect(presetExists('elevenLabs')).toBe(false);
    });

    it('should handle case sensitivity', () => {
      expect(presetExists('Game-Audio-Mobile')).toBe(false);
      expect(presetExists('ELEVENLABS-OPTIMIZE')).toBe(false);
      expect(presetExists('voice_processing')).toBe(false);
    });

    it('should work as type guard', () => {
      const testName: string = 'game-audio-mobile';
      
      if (presetExists(testName)) {
        // TypeScript should now know testName is PresetName
        const preset = getPreset(testName);
        expect(preset.name).toBe('game-audio-mobile');
      }
    });
  });

  describe('getPresetsByCategory', () => {
    it('should return game presets', () => {
      const gamePresets = getPresetsByCategory('game');
      
      expect(gamePresets).toHaveLength(3);
      
      const gameNames = gamePresets.map(p => p.name);
      expect(gameNames).toContain('game-audio-mobile');
      expect(gameNames).toContain('game-audio-desktop');
      expect(gameNames).toContain('game-audio-console');
    });

    it('should return voice presets', () => {
      const voicePresets = getPresetsByCategory('voice');
      
      expect(voicePresets).toHaveLength(2);
      
      const voiceNames = voicePresets.map(p => p.name);
      expect(voiceNames).toContain('elevenLabs-optimize');
      expect(voiceNames).toContain('voice-processing');
    });

    it('should return music presets', () => {
      const musicPresets = getPresetsByCategory('music');
      
      expect(musicPresets).toHaveLength(1);
      expect(musicPresets[0].name).toBe('music-mastering');
    });

    it('should return effects presets', () => {
      const effectsPresets = getPresetsByCategory('effects');
      
      expect(effectsPresets).toHaveLength(1);
      expect(effectsPresets[0].name).toBe('sfx-optimization');
    });

    it('should return empty array for invalid category', () => {
      // @ts-expect-error Testing invalid category
      const invalidPresets = getPresetsByCategory('invalid');
      
      expect(invalidPresets).toEqual([]);
    });
  });

  describe('Preset Quality and Structure Validation', () => {
    it('should have reasonable audio quality settings', () => {
      const mobilePreset = getPreset('game-audio-mobile');
      const desktopPreset = getPreset('game-audio-desktop');
      const consolePreset = getPreset('game-audio-console');
      
      // Mobile should be most compressed
      expect(mobilePreset.operations.format?.sampleRate).toBeLessThanOrEqual(22050);
      expect(mobilePreset.operations.format?.bitrate).toBeLessThanOrEqual(128);
      
      // Desktop should be higher quality than mobile
      expect(desktopPreset.operations.format?.sampleRate! >= mobilePreset.operations.format?.sampleRate!).toBe(true);
      
      // Console should be highest quality
      expect(consolePreset.operations.format?.sampleRate).toBeGreaterThanOrEqual(44100);
    });

    it('should have appropriate LUFS targets', () => {
      Object.values(PRESETS).forEach(preset => {
        const targetLUFS = preset.operations.volume?.targetLUFS;
        if (targetLUFS !== undefined) {
          expect(targetLUFS).toBeGreaterThanOrEqual(-30);
          expect(targetLUFS).toBeLessThanOrEqual(0);
        }
      });
    });

    it('should have valid output formats', () => {
      const validFormats = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];
      
      Object.values(PRESETS).forEach(preset => {
        expect(validFormats).toContain(preset.outputFormat);
      });
    });

    it('should have fade effects only for voice presets', () => {
      const elevenLabsPreset = getPreset('elevenLabs-optimize');
      const voicePreset = getPreset('voice-processing');
      
      expect(elevenLabsPreset.operations.effects?.fadeIn).toBeGreaterThan(0);
      expect(elevenLabsPreset.operations.effects?.fadeOut).toBeGreaterThan(0);
      expect(voicePreset.operations.effects?.fadeIn).toBeGreaterThan(0);
      expect(voicePreset.operations.effects?.fadeOut).toBeGreaterThan(0);
      
      // Non-voice presets should not have fade effects or have minimal ones
      const gamePreset = getPreset('game-audio-mobile');
      expect(gamePreset.operations.effects?.fadeIn).toBeUndefined();
    });

    it('should have mono channel only for voice presets', () => {
      const voicePresets = ['elevenLabs-optimize', 'voice-processing', 'sfx-optimization'];
      
      voicePresets.forEach(presetName => {
        const preset = getPreset(presetName as PresetName);
        expect(preset.operations.format?.channels).toBe(1);
      });
      
      // Game audio should be stereo
      const gamePresets = ['game-audio-mobile', 'game-audio-desktop', 'game-audio-console'];
      gamePresets.forEach(presetName => {
        const preset = getPreset(presetName as PresetName);
        expect(preset.operations.format?.channels).toBe(2);
      });
    });

    it('should have descriptive names and descriptions', () => {
      Object.values(PRESETS).forEach(preset => {
        expect(preset.name).toMatch(/^[a-z0-9-]+$/);
        expect(preset.description.length).toBeGreaterThan(10);
        expect(preset.description).toContain(preset.name.split('-')[0]);
      });
    });
  });

  describe('Preset Integration and Usage', () => {
    it('should provide presets suitable for different platforms', () => {
      const mobilePreset = getPreset('game-audio-mobile');
      const desktopPreset = getPreset('game-audio-desktop');
      const consolePreset = getPreset('game-audio-console');
      
      // Mobile: compressed for bandwidth and storage
      expect(mobilePreset.operations.format?.codec).toBe('aac');
      expect(mobilePreset.outputFormat).toBe('m4a');
      
      // Desktop: good balance of quality and size
      expect(desktopPreset.operations.format?.codec).toBe('vorbis');
      expect(desktopPreset.outputFormat).toBe('ogg');
      
      // Console: highest quality
      expect(consolePreset.operations.format?.codec).toBe('pcm');
      expect(consolePreset.outputFormat).toBe('wav');
    });

    it('should provide ElevenLabs specific optimization', () => {
      const elevenLabsPreset = getPreset('elevenLabs-optimize');
      
      // Should be optimized for AI voice
      expect(elevenLabsPreset.operations.format?.channels).toBe(1);
      expect(elevenLabsPreset.operations.format?.sampleRate).toBe(22050);
      expect(elevenLabsPreset.operations.effects?.fadeIn).toBeDefined();
      expect(elevenLabsPreset.operations.effects?.fadeOut).toBeDefined();
      expect(elevenLabsPreset.operations.volume?.normalize).toBe(true);
    });

    it('should support different use cases with appropriate quality', () => {
      const musicPreset = getPreset('music-mastering');
      const sfxPreset = getPreset('sfx-optimization');
      
      // Music should be lossless high quality
      expect(musicPreset.operations.format?.codec).toBe('flac');
      expect(musicPreset.outputFormat).toBe('flac');
      expect(musicPreset.operations.volume?.targetLUFS).toBe(-14); // Louder for music
      
      // SFX should be compressed but clear
      expect(sfxPreset.operations.format?.channels).toBe(1);
      expect(sfxPreset.operations.format?.codec).toBe('vorbis');
    });
  });
});
