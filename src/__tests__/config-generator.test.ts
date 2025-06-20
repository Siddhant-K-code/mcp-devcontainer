import { ConfigGenerator } from '../config-generator';
import { TEST_WORKSPACE_ROOT, createTestFile, readTestFile, testFileExists } from './setup';
import * as path from 'path';

describe('ConfigGenerator', () => {
  let generator: ConfigGenerator;

  beforeEach(() => {
    generator = new ConfigGenerator();
  });

  describe('generateFromPrompt', () => {
    it('should detect React and TypeScript from prompt', async () => {
      const prompt = 'React TypeScript development environment with port 3000';
      const result = await generator.generateFromPrompt(prompt, TEST_WORKSPACE_ROOT);

      expect(result.analysis.languages).toContain('typescript');
      // JavaScript might not be detected explicitly when only TypeScript is mentioned
      expect(result.analysis.frameworks).toContain('react');
      expect(result.analysis.ports).toContain(3000);
      expect(result.template).toBe('react');
    });

    it('should detect Python and Django from prompt', async () => {
      const prompt = 'Python Django web application with PostgreSQL database';
      const result = await generator.generateFromPrompt(prompt, TEST_WORKSPACE_ROOT);

      expect(result.analysis.languages).toContain('python');
      expect(result.analysis.frameworks).toContain('django');
      expect(result.analysis.databases).toContain('postgresql');
      expect(result.template).toBe('python');
    });

    it('should detect Go development environment', async () => {
      const prompt = 'Go API server with Gin framework on port 8080';
      const result = await generator.generateFromPrompt(prompt, TEST_WORKSPACE_ROOT);

      expect(result.analysis.languages).toContain('go');
      expect(result.analysis.frameworks).toContain('gin');
      expect(result.analysis.ports).toContain(8080);
      expect(result.template).toBe('go');
    });

    it('should detect multiple ports from natural language', async () => {
      const prompt = 'Node.js app on port 3000 with API on port 8080 and database on port 5432';
      const result = await generator.generateFromPrompt(prompt, TEST_WORKSPACE_ROOT);

      expect(result.analysis.ports).toContain(3000);
      expect(result.analysis.ports).toContain(8080);
      expect(result.analysis.ports).toContain(5432);
    });

    it('should create devcontainer.json file', async () => {
      const prompt = 'Simple Node.js development environment';
      const result = await generator.generateFromPrompt(prompt, TEST_WORKSPACE_ROOT);

      const configExists = await testFileExists('.devcontainer/devcontainer.json');
      expect(configExists).toBe(true);

      const configContent = await readTestFile('.devcontainer/devcontainer.json');
      const config = JSON.parse(configContent);
      expect(config.name).toBeDefined();
      expect(config.image).toBeDefined();
    });

    it('should use specified base template', async () => {
      const prompt = 'Development environment';
      const result = await generator.generateFromPrompt(prompt, TEST_WORKSPACE_ROOT, 'rust');

      expect(result.template).toBe('rust');
    });

    it('should throw error for non-existent template', async () => {
      const prompt = 'Development environment';
      
      await expect(
        generator.generateFromPrompt(prompt, TEST_WORKSPACE_ROOT, 'non-existent')
      ).rejects.toThrow("Template 'non-existent' not found");
    });

    it('should detect database requirements and add features', async () => {
      const prompt = 'Python app with PostgreSQL and Redis';
      const result = await generator.generateFromPrompt(prompt, TEST_WORKSPACE_ROOT);

      expect(result.analysis.databases).toContain('postgresql');
      expect(result.analysis.databases).toContain('redis');
      
      const config = result.content as Record<string, unknown>;
      const features = config.features as Record<string, unknown>;
      expect(features).toHaveProperty('ghcr.io/devcontainers/features/postgres:1');
      expect(features).toHaveProperty('ghcr.io/devcontainers/features/redis:1');
    });

    it('should detect Docker requirement and add Docker-in-Docker', async () => {
      const prompt = 'Node.js development with Docker support';
      const result = await generator.generateFromPrompt(prompt, TEST_WORKSPACE_ROOT);

      expect(result.analysis.tools).toContain('docker');
      
      const config = result.content as Record<string, unknown>;
      const features = config.features as Record<string, unknown>;
      expect(features).toHaveProperty('ghcr.io/devcontainers/features/docker-in-docker:2');
    });
  });

  describe('modifyConfiguration', () => {
    beforeEach(async () => {
      // Create a basic devcontainer.json for modification tests
      const basicConfig = {
        name: 'Test Development',
        image: 'mcr.microsoft.com/devcontainers/base:ubuntu',
        features: {},
        customizations: {
          vscode: {
            extensions: []
          }
        },
        forwardPorts: []
      };

      await createTestFile('.devcontainer/devcontainer.json', JSON.stringify(basicConfig, null, 2));
    });

    it('should add new ports to existing configuration', async () => {
      const modifications = 'Add port 3000 and 8080 for web servers';
      const result = await generator.modifyConfiguration(TEST_WORKSPACE_ROOT, modifications);

      expect(result.analysis.ports).toContain(3000);
      expect(result.analysis.ports).toContain(8080);
      
      const config = result.content as Record<string, unknown>;
      const ports = config.forwardPorts as number[];
      expect(ports).toContain(3000);
      expect(ports).toContain(8080);
    });

    it('should add database features to existing configuration', async () => {
      const modifications = 'Add PostgreSQL and MongoDB support';
      const result = await generator.modifyConfiguration(TEST_WORKSPACE_ROOT, modifications);

      expect(result.analysis.databases).toContain('postgresql');
      expect(result.analysis.databases).toContain('mongodb');
      
      const config = result.content as Record<string, unknown>;
      const features = config.features as Record<string, unknown>;
      expect(features).toHaveProperty('ghcr.io/devcontainers/features/postgres:1');
      expect(features).toHaveProperty('ghcr.io/devcontainers/features/mongo:1');
    });

    it('should throw error when no devcontainer.json exists', async () => {
      const emptyWorkspace = path.join(TEST_WORKSPACE_ROOT, 'empty');
      const modifications = 'Add some features';

      await expect(
        generator.modifyConfiguration(emptyWorkspace, modifications)
      ).rejects.toThrow('No existing devcontainer.json found');
    });

    it('should preserve existing configuration while adding new features', async () => {
      const modifications = 'Add Python support';
      const result = await generator.modifyConfiguration(TEST_WORKSPACE_ROOT, modifications);

      const config = result.content as Record<string, unknown>;
      expect(config.name).toBe('Test Development');
      expect(config.image).toBe('mcr.microsoft.com/devcontainers/base:ubuntu');
      
      // Should have added Python extensions
      const customizations = config.customizations as Record<string, unknown>;
      const vscode = customizations.vscode as Record<string, unknown>;
      const extensions = vscode.extensions as string[];
      expect(extensions).toContain('ms-python.python');
    });
  });

  describe('prompt analysis', () => {
    it('should detect various language patterns', async () => {
      const testCases = [
        { prompt: 'JavaScript project with npm', expectedLanguages: ['javascript'] },
        { prompt: 'TypeScript React app', expectedLanguages: ['typescript'] },
        { prompt: 'Python Django application', expectedLanguages: ['python'] },
        { prompt: 'Go microservice', expectedLanguages: ['go'] },
        { prompt: 'Rust CLI tool with cargo', expectedLanguages: ['rust'] },
        { prompt: 'Java Spring Boot application', expectedLanguages: ['java'] },
        { prompt: 'PHP Laravel project', expectedLanguages: ['php'] },
        { prompt: 'Ruby on Rails app', expectedLanguages: ['ruby'] }
      ];

      for (const testCase of testCases) {
        const result = await generator.generateFromPrompt(testCase.prompt, TEST_WORKSPACE_ROOT);
        
        for (const expectedLang of testCase.expectedLanguages) {
          expect(result.analysis.languages).toContain(expectedLang);
        }
      }
    });

    it('should detect framework patterns', async () => {
      const testCases = [
        { prompt: 'React frontend application', expectedFrameworks: ['react'] },
        { prompt: 'Angular web app', expectedFrameworks: ['angular'] },
        { prompt: 'Vue.js project', expectedFrameworks: ['vue'] },
        { prompt: 'Express.js API server', expectedFrameworks: ['express'] },
        { prompt: 'Django web framework', expectedFrameworks: ['django'] },
        { prompt: 'Flask microframework', expectedFrameworks: ['flask'] },
        { prompt: 'FastAPI backend', expectedFrameworks: ['fastapi'] },
        { prompt: 'Spring Boot application', expectedFrameworks: ['spring'] }
      ];

      for (const testCase of testCases) {
        const result = await generator.generateFromPrompt(testCase.prompt, TEST_WORKSPACE_ROOT);
        
        for (const expectedFramework of testCase.expectedFrameworks) {
          expect(result.analysis.frameworks).toContain(expectedFramework);
        }
      }
    });

    it('should detect database patterns', async () => {
      const testCases = [
        { prompt: 'App with PostgreSQL database', expectedDatabases: ['postgresql'] },
        { prompt: 'MySQL backend storage', expectedDatabases: ['mysql'] },
        { prompt: 'MongoDB document store', expectedDatabases: ['mongodb'] },
        { prompt: 'Redis cache layer', expectedDatabases: ['redis'] },
        { prompt: 'SQLite embedded database', expectedDatabases: ['sqlite'] },
        { prompt: 'Elasticsearch search engine', expectedDatabases: ['elasticsearch'] }
      ];

      for (const testCase of testCases) {
        const result = await generator.generateFromPrompt(testCase.prompt, TEST_WORKSPACE_ROOT);
        
        for (const expectedDb of testCase.expectedDatabases) {
          expect(result.analysis.databases).toContain(expectedDb);
        }
      }
    });

    it('should generate appropriate VS Code extensions based on detected technologies', async () => {
      const prompt = 'TypeScript React app with Python backend';
      const result = await generator.generateFromPrompt(prompt, TEST_WORKSPACE_ROOT);

      expect(result.analysis.extensions).toContain('ms-vscode.vscode-typescript-next');
      expect(result.analysis.extensions).toContain('ms-python.python');
      expect(result.analysis.extensions).toContain('bradlc.vscode-tailwindcss');
    });
  });
});
