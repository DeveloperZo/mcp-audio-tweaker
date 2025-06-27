# Contributing Guide

Welcome to the MCP Audio Packages project! We appreciate your interest in contributing to these tools that enhance audio workflows for game development and content creation.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Code Standards](#code-standards)
- [Testing Requirements](#testing-requirements)
- [Contribution Workflow](#contribution-workflow)
- [Documentation Guidelines](#documentation-guidelines)
- [Issue Management](#issue-management)
- [Community Guidelines](#community-guidelines)

---

## Getting Started

### Ways to Contribute

- **Bug Reports**: Help us identify and fix issues
- **Feature Requests**: Suggest new functionality or improvements
- **Code Contributions**: Submit bug fixes, new features, or optimizations
- **Documentation**: Improve guides, tutorials, and API documentation
- **Testing**: Help test new features and report compatibility issues
- **Community Support**: Help other users in discussions and issues

### Before You Start

1. **Read the Documentation**: Familiarize yourself with the project through the [README](../README.md) and [API Reference](docs/api-reference.md)
2. **Check Existing Issues**: Look through [open issues](https://github.com/your-org/mcp-audio-packages/issues) to avoid duplicates
3. **Understand the Architecture**: Review the [package specifications](package-specs.md) and design principles
4. **Join Discussions**: Participate in [GitHub Discussions](https://github.com/your-org/mcp-audio-packages/discussions) to understand ongoing conversations

---

## Development Setup

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **FFmpeg**: Latest stable version
- **Git**: For version control
- **Code Editor**: VS Code recommended with TypeScript support

### Clone and Setup

```bash
# Clone the repository
git clone https://github.com/your-org/mcp-audio-packages.git
cd mcp-audio-packages

# Install dependencies for both packages
cd mcp-audio-inspector
npm install
npm run build

cd ../mcp-audio-tweaker
npm install
npm run build

# Link packages for local development
cd ../mcp-audio-inspector
npm link

cd ../mcp-audio-tweaker
npm link

# Verify setup
cd ..
npx mcp-audio-inspector --version
npx mcp-audio-tweaker --version
```

### Development Environment

**Recommended VS Code Extensions:**
- TypeScript and JavaScript Language Features
- ESLint
- Prettier - Code formatter
- Jest (for testing)
- GitLens (for Git integration)

**VS Code Settings (.vscode/settings.json):**
```json
{
  "typescript.preferences.quoteStyle": "single",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.json": "jsonc"
  }
}
```

### Environment Configuration

**Development Environment Variables:**
```bash
# .env.development
NODE_ENV=development
AUDIO_INSPECTOR_LOG_LEVEL=debug
AUDIO_TWEAKER_LOG_LEVEL=debug
ENABLE_DETAILED_LOGGING=true
```

---

## Code Standards

### TypeScript Guidelines

**Strict Configuration:**
```typescript
// tsconfig.json requirements
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

**Type Definitions:**
```typescript
// Always provide explicit type definitions
interface AudioMetadata {
  duration: number;
  sampleRate: number;
  channels: number;
  bitrate?: number;
}

// Use enums for constants
enum AudioFormat {
  MP3 = 'mp3',
  WAV = 'wav',
  OGG = 'ogg',
  FLAC = 'flac'
}

// Avoid 'any' type - use unknown or proper types
function processAudio(file: AudioFile): Promise<ProcessingResult> {
  // Implementation
}
```

### Code Style

**ESLint Configuration (.eslintrc.js):**
```javascript
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    'prettier'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    'prefer-const': 'error',
    'no-var': 'error'
  }
};
```

**Prettier Configuration (.prettierrc):**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### Naming Conventions

**Files and Directories:**
- Use kebab-case for file names: `audio-processor.ts`
- Use camelCase for directory names: `audioTools/`
- Test files: `audio-processor.test.ts`

**Code Naming:**
```typescript
// Classes: PascalCase
class AudioProcessor {
  // Methods: camelCase
  public processAudio(): void {}
  
  // Private methods: camelCase with underscore prefix
  private _validateInput(): boolean {}
}

// Interfaces: PascalCase with 'I' prefix (optional)
interface IAudioMetadata {
  // Properties: camelCase
  sampleRate: number;
  channelCount: number;
}

// Constants: SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 500 * 1024 * 1024;

// Enums: PascalCase
enum ProcessingState {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed'
}
```

### Error Handling

**Consistent Error Types:**
```typescript
// Define standard error codes
export enum ErrorCode {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  INVALID_FORMAT = 'INVALID_FORMAT',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  FFMPEG_ERROR = 'FFMPEG_ERROR'
}

// Standard error interface
export interface AudioError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// Error creation utility
export function createError(
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>
): AudioError {
  return {
    code,
    message,
    details,
    timestamp: new Date().toISOString()
  };
}

// Usage in functions
async function processAudioFile(path: string): Promise<AudioResult> {
  try {
    // Processing logic
    return result;
  } catch (error) {
    throw createError(
      ErrorCode.PROCESSING_FAILED,
      'Failed to process audio file',
      { path, originalError: error.message }
    );
  }
}
```

---

## Testing Requirements

### Test Coverage Goals

- **Minimum Coverage**: 80% overall
- **Critical Components**: 95% coverage
- **Integration Tests**: All MCP tools and CLI commands
- **Cross-Platform Tests**: Windows, macOS, Linux

### Testing Structure

```
tests/
├── unit/                 # Unit tests
│   ├── audio-inspector/
│   ├── audio-tweaker/
│   └── shared/
├── integration/          # Integration tests
│   ├── mcp-protocol/
│   ├── ffmpeg-integration/
│   └── file-processing/
├── e2e/                  # End-to-end tests
│   ├── claude-desktop/
│   └── standalone-cli/
├── fixtures/             # Test audio files
│   ├── sample-audio/
│   └── test-data/
└── utils/                # Test utilities
```

### Test Writing Guidelines

**Unit Test Example:**
```typescript
// audio-processor.test.ts
import { AudioProcessor } from '../src/audio-processor';
import { AudioFormat } from '../src/types';

describe('AudioProcessor', () => {
  let processor: AudioProcessor;

  beforeEach(() => {
    processor = new AudioProcessor();
  });

  describe('processFile', () => {
    it('should process valid WAV file successfully', async () => {
      // Arrange
      const inputPath = 'fixtures/test-audio/sample.wav';
      const expectedFormat = AudioFormat.WAV;

      // Act
      const result = await processor.processFile(inputPath);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.format.container).toBe(expectedFormat);
      expect(result.data.format.duration).toBeGreaterThan(0);
    });

    it('should throw error for non-existent file', async () => {
      // Arrange
      const inputPath = 'non-existent-file.wav';

      // Act & Assert
      await expect(processor.processFile(inputPath)).rejects.toThrow(
        'FILE_NOT_FOUND'
      );
    });
  });
});
```

**Integration Test Example:**
```typescript
// mcp-integration.test.ts
import { MCPServer } from '../src/mcp-server';
import { createTestClient } from './utils/test-client';

describe('MCP Integration', () => {
  let server: MCPServer;
  let client: TestClient;

  beforeAll(async () => {
    server = new MCPServer();
    await server.start();
    client = createTestClient(server.port);
  });

  afterAll(async () => {
    await server.stop();
  });

  it('should handle analyze_audio_file tool correctly', async () => {
    // Test MCP protocol compliance
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'analyze_audio_file',
        arguments: {
          filePath: 'fixtures/test-audio/sample.wav'
        }
      }
    };

    const response = await client.send(request);

    expect(response.jsonrpc).toBe('2.0');
    expect(response.id).toBe(1);
    expect(response.result.success).toBe(true);
    expect(response.result.data.file.path).toBeDefined();
  });
});
```

### Test Data Management

**Fixture Files:**
- Keep test audio files small (< 1MB each)
- Include various formats: WAV, MP3, OGG, FLAC
- Include edge cases: corrupted files, unusual sample rates
- Store in Git LFS for large binary files

**Test Audio Generation:**
```typescript
// test-utils/audio-generator.ts
export function generateTestAudio(options: {
  duration: number;
  sampleRate: number;
  channels: number;
  format: AudioFormat;
}): Buffer {
  // Generate procedural test audio
  // Useful for testing without large fixture files
}
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- audio-processor.test.ts

# Run integration tests only
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Run cross-platform tests
npm run test:cross-platform
```

---

## Contribution Workflow

### Branch Strategy

We use Git Flow with the following branch types:

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: New features or enhancements
- **bugfix/**: Bug fixes
- **hotfix/**: Critical fixes for production
- **release/**: Release preparation

### Feature Development Workflow

1. **Create Feature Branch:**
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/audio-format-support
   ```

2. **Development:**
   - Write code following style guidelines
   - Add comprehensive tests
   - Update documentation as needed
   - Commit regularly with clear messages

3. **Commit Message Format:**
   ```
   type(scope): short description

   Longer description if needed

   Fixes #123
   ```

   **Types:** feat, fix, docs, style, refactor, test, chore
   **Scopes:** inspector, tweaker, core, docs, test

   **Examples:**
   ```
   feat(inspector): add support for AIFF format
   fix(tweaker): resolve FFmpeg timeout issue
   docs(api): update parameter descriptions
   ```

4. **Pre-submission Checklist:**
   - [ ] All tests pass
   - [ ] Code coverage meets requirements
   - [ ] Documentation updated
   - [ ] No ESLint errors
   - [ ] Changelog updated (for significant changes)

5. **Create Pull Request:**
   - Use descriptive title and detailed description
   - Reference related issues
   - Include testing notes
   - Add screenshots for UI changes

### Pull Request Template

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that causes existing functionality to change)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Cross-platform testing (if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or properly documented)

## Related Issues
Fixes #(issue number)
```

---

## Documentation Guidelines

### Documentation Types

**API Documentation:**
- Use TSDoc comments for all public APIs
- Include parameter descriptions and examples
- Document error conditions and return types

**User Guides:**
- Write for different skill levels
- Include practical examples
- Test all code examples

**Tutorials:**
- Step-by-step instructions
- Include expected outputs
- Cover common use cases

### Documentation Standards

**TSDoc Example:**
```typescript
/**
 * Analyzes an audio file and extracts comprehensive metadata.
 * 
 * @param filePath - Absolute path to the audio file
 * @param options - Analysis options
 * @returns Promise resolving to analysis results
 * 
 * @throws {AudioError} When file is not found or invalid format
 * 
 * @example
 * ```typescript
 * const result = await analyzer.analyzeFile('/path/to/audio.wav', {
 *   includeGameAnalysis: true
 * });
 * console.log(result.data.format.duration);
 * ```
 */
public async analyzeFile(
  filePath: string, 
  options: AnalysisOptions = {}
): Promise<AnalysisResult> {
  // Implementation
}
```

**Markdown Guidelines:**
- Use clear headings and structure
- Include code examples with syntax highlighting
- Use tables for structured data
- Add links to related documentation

---

## Issue Management

### Bug Reports

**Bug Report Template:**
```markdown
## Bug Description
Clear description of the issue.

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Environment
- OS: [Windows 10/macOS 12/Ubuntu 20.04]
- Node.js: [version]
- Package Version: [version]
- FFmpeg Version: [version]

## Additional Context
Screenshots, logs, or other relevant information.
```

### Feature Requests

**Feature Request Template:**
```markdown
## Feature Description
Clear description of the proposed feature.

## Use Case
Why this feature would be valuable.

## Proposed Solution
How you envision this working.

## Alternatives Considered
Other approaches you've considered.

## Additional Context
Any other relevant information.
```

### Issue Labels

- **Type**: bug, enhancement, documentation, question
- **Priority**: critical, high, medium, low
- **Component**: inspector, tweaker, core, docs
- **Status**: needs-triage, in-progress, blocked, ready-for-review

---

## Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please review our [Code of Conduct](CODE_OF_CONDUCT.md).

### Communication

- **Be respectful** in all interactions
- **Stay on topic** in discussions
- **Provide context** when asking questions
- **Help others** when you can
- **Be patient** with responses

### Getting Help

1. **Check Documentation**: Look through existing guides and API reference
2. **Search Issues**: Someone may have already asked your question
3. **GitHub Discussions**: For open-ended questions and community help
4. **Create Issue**: For specific bugs or feature requests

### Recognition

Contributors are recognized through:
- **Contributors List**: All contributors listed in README
- **Release Notes**: Significant contributions highlighted
- **Community Highlights**: Outstanding contributions featured

---

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

1. **Update Version Numbers**
2. **Update Changelog**
3. **Run Full Test Suite**
4. **Update Documentation**
5. **Create Release Branch**
6. **Generate Release Notes**
7. **Tag Release**
8. **Publish to npm**
9. **Update GitHub Release**

---

## Questions?

If you have questions about contributing that aren't covered here:

- **GitHub Discussions**: [Project Discussions](https://github.com/your-org/mcp-audio-packages/discussions)
- **Issues**: [Open an Issue](https://github.com/your-org/mcp-audio-packages/issues/new)
- **Email**: contact@infinitycube.dev

Thank you for contributing to MCP Audio Packages! Your efforts help make audio processing more accessible and efficient for developers worldwide.
