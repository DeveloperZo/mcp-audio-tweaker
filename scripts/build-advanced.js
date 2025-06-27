#!/usr/bin/env node

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

try {
  process.chdir(projectRoot);
  console.log('Building mcp-audio-tweaker with advanced features...');
  
  const result = execSync('npx tsc', { 
    encoding: 'utf8',
    stdio: 'inherit'
  });
  
  console.log('✅ Build completed successfully!');
  console.log('🎯 New advanced audio processing features are now available:');
  console.log('   - generate_variations: Create sound families from one input');
  console.log('   - create_harmonics: Add musical intervals and octaves');
  console.log('   - advanced_process: Pitch shifting, spectral EQ, dynamics');
  console.log('   - layer_sounds: Blend multiple sounds with timing control');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
