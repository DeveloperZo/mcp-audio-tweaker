// Jest setup file for mcp-audio-tweaker tests

import { jest } from '@jest/globals';

// Mock FFmpeg for testing
jest.mock('fluent-ffmpeg', () => {
  return jest.fn(() => ({
    audioFilters: jest.fn().mockReturnThis(),
    audioFrequency: jest.fn().mockReturnThis(),
    audioChannels: jest.fn().mockReturnThis(),
    audioCodec: jest.fn().mockReturnThis(),
    audioBitrate: jest.fn().mockReturnThis(),
    seekInput: jest.fn().mockReturnThis(),
    duration: jest.fn().mockReturnThis(),
    output: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    run: jest.fn(),
  }));
});

// Mock which module
jest.mock('which', () => ({
  default: jest.fn().mockResolvedValue('/usr/bin/ffmpeg')
}));

// Mock fs promises
jest.mock('fs', () => ({
  promises: {
    stat: jest.fn(),
    access: jest.fn(),
    mkdir: jest.fn(),
    unlink: jest.fn()
  },
  constants: {
    R_OK: 4,
    W_OK: 2
  }
}));

// Set test environment variables
process.env.AUDIO_TWEAKER_LOG_LEVEL = 'error';
process.env.NODE_ENV = 'test';

// Global test configuration
global.console = {
  ...console,
  // Suppress console output during tests
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};
