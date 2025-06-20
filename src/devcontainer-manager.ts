/**
 * DevContainer Manager
 * Handles container lifecycle operations using DevContainer CLI
 */

import { spawn, exec } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BuildResult {
  success: boolean;
  output: string;
  error?: string;
  duration: number;
}

export interface TestResult {
  success: boolean;
  tests: TestCase[];
  summary: string;
}

export interface TestCase {
  name: string;
  success: boolean;
  output: string;
  error?: string;
}

export interface ContainerStatus {
  configExists: boolean;
  configPath?: string;
  isRunning: boolean;
  containerName?: string;
  lastBuildTime?: Date;
  image?: string;
}

export class DevContainerManager {
  private timeout = 5 * 60 * 1000; // 5 minutes

  /**
   * Build DevContainer from configuration
   */
  async buildContainer(
    workspaceRoot: string,
    configPath?: string,
    rebuild: boolean = false
  ): Promise<BuildResult> {
    const startTime = Date.now();
    
    try {
      // Validate configuration exists
      const resolvedConfigPath = configPath || path.join(workspaceRoot, '.devcontainer', 'devcontainer.json');
      
      if (!await fs.pathExists(resolvedConfigPath)) {
        throw new Error(`DevContainer configuration not found at ${resolvedConfigPath}`);
      }

      // Validate DevContainer CLI is available
      await this.validateCLI();

      // Build command
      const args = ['@devcontainers/cli', 'build'];
      args.push('--workspace-folder', workspaceRoot);
      
      if (configPath) {
        args.push('--config', configPath);
      }
      
      if (rebuild) {
        args.push('--no-cache');
      }

      // Execute build
      const result = await this.executeCommand('npx', args, this.timeout);
      
      const duration = Date.now() - startTime;
      
      return {
        success: result.exitCode === 0,
        output: result.stdout,
        error: result.exitCode !== 0 ? result.stderr : undefined,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        duration
      };
    }
  }

  /**
   * Test DevContainer functionality
   */
  async testContainer(
    workspaceRoot: string,
    customTestCommands?: string[]
  ): Promise<TestResult> {
    const tests: TestCase[] = [];
    
    try {
      // Default test cases
      const defaultTests = [
        {
          name: 'Configuration exists',
          command: null,
          test: async () => {
            const configPath = path.join(workspaceRoot, '.devcontainer', 'devcontainer.json');
            const exists = await fs.pathExists(configPath);
            if (!exists) {
              throw new Error('DevContainer configuration file not found');
            }
            
            // Validate JSON syntax
            try {
              await fs.readJson(configPath);
              return 'Configuration file is valid JSON';
            } catch (error) {
              throw new Error(`Invalid JSON in configuration: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        },
        {
          name: 'Container builds successfully',
          command: null,
          test: async () => {
            const buildResult = await this.buildContainer(workspaceRoot);
            if (!buildResult.success) {
              throw new Error(`Build failed: ${buildResult.error}`);
            }
            return `Build completed in ${Math.round(buildResult.duration / 1000)}s`;
          }
        },
        {
          name: 'Container can start',
          command: null,
          test: async () => {
            // Try to start container and run a basic command
            const result = await this.executeDevContainerCommand(
              workspaceRoot,
              ['echo', 'Container started successfully']
            );
            
            if (result.exitCode !== 0) {
              throw new Error(`Container failed to start: ${result.stderr}`);
            }
            
            return 'Container started and executed command successfully';
          }
        }
      ];

      // Run default tests
      for (const test of defaultTests) {
        try {
          const output = await test.test();
          tests.push({
            name: test.name,
            success: true,
            output
          });
        } catch (error) {
          tests.push({
            name: test.name,
            success: false,
            output: '',
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      // Run custom test commands if provided
      if (customTestCommands) {
        for (const [index, command] of customTestCommands.entries()) {
          try {
            const result = await this.executeDevContainerCommand(
              workspaceRoot,
              command.split(' ')
            );
            
            tests.push({
              name: `Custom test ${index + 1}: ${command}`,
              success: result.exitCode === 0,
              output: result.stdout,
              error: result.exitCode !== 0 ? result.stderr : undefined
            });
          } catch (error) {
            tests.push({
              name: `Custom test ${index + 1}: ${command}`,
              success: false,
              output: '',
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }
      }

      // Generate summary
      const passed = tests.filter(t => t.success).length;
      const total = tests.length;
      const summary = `${passed}/${total} tests passed`;

      return {
        success: passed === total,
        tests,
        summary
      };
    } catch (error) {
      return {
        success: false,
        tests,
        summary: `Test execution failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Get DevContainer status
   */
  async getContainerStatus(workspaceRoot: string): Promise<ContainerStatus> {
    const configPath = path.join(workspaceRoot, '.devcontainer', 'devcontainer.json');
    const configExists = await fs.pathExists(configPath);

    const status: ContainerStatus = {
      configExists,
      isRunning: false
    };

    if (configExists) {
      status.configPath = configPath;
      
      try {
        // Read configuration to get container name/image
        const config = await fs.readJson(configPath);
        status.image = config.image || 'Unknown';
        
        // Try to determine if container is running
        const containerInfo = await this.getContainerInfo(workspaceRoot);
        status.isRunning = containerInfo.isRunning;
        status.containerName = containerInfo.name;
        status.lastBuildTime = containerInfo.lastBuildTime;
      } catch (error) {
        // Configuration exists but might be invalid
        console.error('Error reading DevContainer configuration:', error);
      }
    }

    return status;
  }

  /**
   * Execute DevContainer CLI command
   */
  private async executeDevContainerCommand(
    workspaceRoot: string,
    command: string[]
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    const args = [
      '@devcontainers/cli',
      'exec',
      '--workspace-folder', workspaceRoot,
      '--'
    ];
    args.push(...command);

    return this.executeCommand('npx', args, 30000); // 30 second timeout for individual commands
  }

  /**
   * Get container information
   */
  private async getContainerInfo(workspaceRoot: string): Promise<{
    isRunning: boolean;
    name?: string;
    lastBuildTime?: Date;
  }> {
    try {
      // Try to list DevContainer
      const result = await this.executeCommand('npx', [
        '@devcontainers/cli',
        'read-configuration',
        '--workspace-folder', workspaceRoot
      ], 10000);

      if (result.exitCode === 0) {
        // Container configuration is readable, try to check if it's running
        try {
          const execResult = await this.executeCommand('npx', [
            '@devcontainers/cli',
            'exec',
            '--workspace-folder', workspaceRoot,
            '--',
            'echo', 'test'
          ], 5000);

          return {
            isRunning: execResult.exitCode === 0,
            name: `devcontainer-${path.basename(workspaceRoot)}`
          };
        } catch {
          return {
            isRunning: false,
            name: `devcontainer-${path.basename(workspaceRoot)}`
          };
        }
      }

      return {
        isRunning: false
      };
    } catch {
      return {
        isRunning: false
      };
    }
  }

  /**
   * Execute command with timeout
   */
  private executeCommand(
    command: string,
    args: string[],
    timeout: number
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      
      const child = spawn(command, args, {
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: process.platform === 'win32'
      });

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          exitCode: code || 0,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to execute ${command}: ${error.message}`));
      });

      // Set timeout
      const timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error(`Command timed out after ${timeout}ms`));
      }, timeout);

      child.on('close', () => {
        clearTimeout(timeoutId);
      });
    });
  }

  /**
   * Validate DevContainer CLI is available
   */
  private async validateCLI(): Promise<void> {
    try {
      await execAsync('npx @devcontainers/cli --version');
    } catch (error) {
      throw new Error(
        'DevContainer CLI not found. Please install it with: npm install -g @devcontainers/cli'
      );
    }
  }

  /**
   * Start DevContainer (if not already running)
   */
  async startContainer(workspaceRoot: string): Promise<BuildResult> {
    const startTime = Date.now();
    
    try {
      await this.validateCLI();
      
      const result = await this.executeCommand('npx', [
        '@devcontainers/cli',
        'up',
        '--workspace-folder', workspaceRoot
      ], this.timeout);
      
      const duration = Date.now() - startTime;
      
      return {
        success: result.exitCode === 0,
        output: result.stdout,
        error: result.exitCode !== 0 ? result.stderr : undefined,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        duration
      };
    }
  }

  /**
   * Stop DevContainer
   */
  async stopContainer(workspaceRoot: string): Promise<BuildResult> {
    const startTime = Date.now();
    
    try {
      await this.validateCLI();
      
      // DevContainer CLI doesn't have a direct stop command, 
      // but we can try to stop via docker if we can identify the container
      const status = await this.getContainerStatus(workspaceRoot);
      
      if (!status.isRunning) {
        return {
          success: true,
          output: 'Container is not running',
          duration: Date.now() - startTime
        };
      }

      // Try to stop using docker command if container name is known
      if (status.containerName) {
        try {
          const result = await execAsync(`docker stop ${status.containerName}`);
          return {
            success: true,
            output: result.stdout,
            duration: Date.now() - startTime
          };
        } catch (error) {
          return {
            success: false,
            output: '',
            error: error instanceof Error ? error.message : String(error),
            duration: Date.now() - startTime
          };
        }
      }

      return {
        success: false,
        output: '',
        error: 'Unable to identify container to stop',
        duration: Date.now() - startTime
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : String(error),
        duration
      };
    }
  }
}
