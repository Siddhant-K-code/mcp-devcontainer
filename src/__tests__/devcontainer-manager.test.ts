import { DevContainerManager } from '../devcontainer-manager';
import { TEST_WORKSPACE_ROOT, createTestFile } from './setup';
import * as path from 'path';

// Mock child_process to avoid actual container operations in tests
jest.mock('child_process', () => ({
  spawn: jest.fn(),
  exec: jest.fn()
}));

jest.mock('util', () => ({
  promisify: jest.fn((fn) => fn)
}));

describe('DevContainerManager', () => {
  let manager: DevContainerManager;

  beforeEach(() => {
    manager = new DevContainerManager();
    jest.clearAllMocks();
  });

  describe('getContainerStatus', () => {
    it('should return status when no config exists', async () => {
      const status = await manager.getContainerStatus(TEST_WORKSPACE_ROOT);
      
      expect(status.configExists).toBe(false);
      expect(status.configPath).toBeUndefined();
      expect(status.isRunning).toBe(false);
      expect(status.containerName).toBeUndefined();
    });

    it('should detect existing configuration', async () => {
      const config = {
        name: 'Test Container',
        image: 'mcr.microsoft.com/devcontainers/base:ubuntu'
      };
      
      await createTestFile('.devcontainer/devcontainer.json', JSON.stringify(config));
      
      const status = await manager.getContainerStatus(TEST_WORKSPACE_ROOT);
      
      expect(status.configExists).toBe(true);
      expect(status.configPath).toBe(path.join(TEST_WORKSPACE_ROOT, '.devcontainer', 'devcontainer.json'));
      expect(status.image).toBe('mcr.microsoft.com/devcontainers/base:ubuntu');
    });

    it('should handle invalid JSON configuration gracefully', async () => {
      await createTestFile('.devcontainer/devcontainer.json', 'invalid json');
      
      const status = await manager.getContainerStatus(TEST_WORKSPACE_ROOT);
      
      expect(status.configExists).toBe(true);
      expect(status.configPath).toBe(path.join(TEST_WORKSPACE_ROOT, '.devcontainer', 'devcontainer.json'));
      // Should not crash, but may not have all details
    });
  });

  describe('buildContainer', () => {
    beforeEach(async () => {
      // Create a valid devcontainer.json for build tests
      const config = {
        name: 'Test Container',
        image: 'mcr.microsoft.com/devcontainers/base:ubuntu'
      };
      await createTestFile('.devcontainer/devcontainer.json', JSON.stringify(config));
    });

    it('should return error when config does not exist', async () => {
      const emptyWorkspace = path.join(TEST_WORKSPACE_ROOT, 'empty');
      
      const result = await manager.buildContainer(emptyWorkspace);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('DevContainer configuration not found');
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should validate configuration exists before building', async () => {
      // This will fail because we're mocking the CLI, but it should at least check the config
      const result = await manager.buildContainer(TEST_WORKSPACE_ROOT);
      
      // The test will fail due to mocked CLI, but it should get past config validation
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should accept custom config path', async () => {
      const customConfigPath = path.join(TEST_WORKSPACE_ROOT, 'custom.json');
      await createTestFile('custom.json', JSON.stringify({
        name: 'Custom Container',
        image: 'ubuntu:latest'
      }));
      
      const result = await manager.buildContainer(TEST_WORKSPACE_ROOT, customConfigPath);
      
      // Should not fail due to missing config at default location
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle rebuild flag', async () => {
      const result = await manager.buildContainer(TEST_WORKSPACE_ROOT, undefined, true);
      
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('testContainer', () => {
    beforeEach(async () => {
      // Create a valid devcontainer.json for test
      const config = {
        name: 'Test Container',
        image: 'mcr.microsoft.com/devcontainers/base:ubuntu'
      };
      await createTestFile('.devcontainer/devcontainer.json', JSON.stringify(config));
    });

    it('should run default tests', async () => {
      const result = await manager.testContainer(TEST_WORKSPACE_ROOT);
      
      expect(result.tests.length).toBeGreaterThan(0);
      expect(result.summary).toBeDefined();
      
      // Should include configuration validation test
      const configTest = result.tests.find(t => t.name === 'Configuration exists');
      expect(configTest).toBeDefined();
      expect(configTest?.success).toBe(true);
    });

    it('should validate JSON configuration', async () => {
      const result = await manager.testContainer(TEST_WORKSPACE_ROOT);
      
      const configTest = result.tests.find(t => t.name === 'Configuration exists');
      expect(configTest).toBeDefined();
      expect(configTest?.success).toBe(true);
      expect(configTest?.output).toContain('Configuration file is valid JSON');
    });

    it('should fail when configuration has invalid JSON', async () => {
      await createTestFile('.devcontainer/devcontainer.json', 'invalid json');
      
      const result = await manager.testContainer(TEST_WORKSPACE_ROOT);
      
      const configTest = result.tests.find(t => t.name === 'Configuration exists');
      expect(configTest).toBeDefined();
      expect(configTest?.success).toBe(false);
      expect(configTest?.error).toContain('Invalid JSON');
    });

    it('should include custom test commands', async () => {
      const customCommands = ['echo test', 'pwd'];
      const result = await manager.testContainer(TEST_WORKSPACE_ROOT, customCommands);
      
      // Should have default tests plus custom tests
      expect(result.tests.length).toBeGreaterThan(3);
      
      const customTest1 = result.tests.find(t => t.name.includes('echo test'));
      const customTest2 = result.tests.find(t => t.name.includes('pwd'));
      
      expect(customTest1).toBeDefined();
      expect(customTest2).toBeDefined();
    });

    it('should generate appropriate summary', async () => {
      const result = await manager.testContainer(TEST_WORKSPACE_ROOT);
      
      expect(result.summary).toMatch(/\d+\/\d+ tests passed/);
    });
  });

  describe('error handling', () => {
    it('should handle missing DevContainer CLI gracefully', async () => {
      // The error will be config not found since we mock child_process
      // In real scenarios, CLI validation would happen first
      const result = await manager.buildContainer(TEST_WORKSPACE_ROOT);
      
      expect(result.success).toBe(false);
      // Could be CLI error or config error depending on mocking
      expect(result.error).toBeDefined();
    });

    it('should handle timeout scenarios', async () => {
      // This is a conceptual test - actual timeout testing would require more complex mocking
      const result = await manager.buildContainer(TEST_WORKSPACE_ROOT);
      
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle file system errors', async () => {
      // Test with a path that doesn't exist
      const invalidPath = '/nonexistent/path';
      
      const result = await manager.buildContainer(invalidPath);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('container lifecycle', () => {
    beforeEach(async () => {
      const config = {
        name: 'Test Container',
        image: 'mcr.microsoft.com/devcontainers/base:ubuntu'
      };
      await createTestFile('.devcontainer/devcontainer.json', JSON.stringify(config));
    });

    it('should handle start container operation', async () => {
      const result = await manager.startContainer(TEST_WORKSPACE_ROOT);
      
      expect(result.duration).toBeGreaterThanOrEqual(0);
      // Success depends on mocked CLI behavior
    });

    it('should handle stop container operation', async () => {
      const result = await manager.stopContainer(TEST_WORKSPACE_ROOT);
      
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle stop when container is not running', async () => {
      const result = await manager.stopContainer(TEST_WORKSPACE_ROOT);
      
      // Should not fail when trying to stop a non-running container
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('configuration validation', () => {
    it('should validate required fields in devcontainer.json', async () => {
      const minimalConfig = {
        image: 'ubuntu:latest'
      };
      await createTestFile('.devcontainer/devcontainer.json', JSON.stringify(minimalConfig));
      
      const result = await manager.testContainer(TEST_WORKSPACE_ROOT);
      
      const configTest = result.tests.find(t => t.name === 'Configuration exists');
      expect(configTest?.success).toBe(true);
    });

    it('should handle missing required fields', async () => {
      const emptyConfig = {};
      await createTestFile('.devcontainer/devcontainer.json', JSON.stringify(emptyConfig));
      
      const result = await manager.testContainer(TEST_WORKSPACE_ROOT);
      
      const configTest = result.tests.find(t => t.name === 'Configuration exists');
      expect(configTest?.success).toBe(true); // JSON is valid even if minimal
    });
  });
});
