import * as fs from 'fs-extra';
import * as path from 'path';

// Test setup configuration
const testWorkspaceRoot = path.join(__dirname, '../../test-workspace');

beforeAll(async () => {
  // Create test workspace directory
  await fs.ensureDir(testWorkspaceRoot);
});

afterAll(async () => {
  // Cleanup test workspace
  await fs.remove(testWorkspaceRoot);
});

beforeEach(async () => {
  // Clean up test workspace before each test
  await fs.emptyDir(testWorkspaceRoot);
});

// Export test utilities
export const TEST_WORKSPACE_ROOT = testWorkspaceRoot;

export function createTestFile(relativePath: string, content: string): Promise<void> {
  const fullPath = path.join(testWorkspaceRoot, relativePath);
  return fs.outputFile(fullPath, content);
}

export function readTestFile(relativePath: string): Promise<string> {
  const fullPath = path.join(testWorkspaceRoot, relativePath);
  return fs.readFile(fullPath, 'utf-8');
}

export function testFileExists(relativePath: string): Promise<boolean> {
  const fullPath = path.join(testWorkspaceRoot, relativePath);
  return fs.pathExists(fullPath);
}
