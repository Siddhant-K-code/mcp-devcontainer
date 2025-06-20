#!/usr/bin/env node

/**
 * DevContainer MCP Server
 * A comprehensive Model Context Protocol server for AI-powered DevContainer management
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { ConfigGenerator } from './config-generator.js';
import { DevContainerManager } from './devcontainer-manager.js';
import { TemplateManager } from './template-manager.js';

class DevContainerMCPServer {
  private server: Server;
  private configGenerator: ConfigGenerator;
  private containerManager: DevContainerManager;
  private templateManager: TemplateManager;

  constructor() {
    this.server = new Server(
      {
        name: 'devcontainer-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.configGenerator = new ConfigGenerator();
    this.containerManager = new DevContainerManager();
    this.templateManager = new TemplateManager();

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'generate_devcontainer',
            description: 'Generate devcontainer.json from natural language description',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'Natural language description of the development environment'
                },
                workspaceRoot: {
                  type: 'string',
                  description: 'Workspace root path',
                  default: '.'
                },
                baseTemplate: {
                  type: 'string',
                  description: 'Optional template to start from'
                }
              },
              required: ['prompt']
            }
          },
          {
            name: 'build_devcontainer',
            description: 'Build DevContainer from configuration',
            inputSchema: {
              type: 'object',
              properties: {
                workspaceRoot: {
                  type: 'string',
                  description: 'Workspace root path',
                  default: '.'
                },
                configPath: {
                  type: 'string',
                  description: 'Custom configuration file path'
                },
                rebuild: {
                  type: 'boolean',
                  description: 'Force rebuild without cache',
                  default: false
                }
              }
            }
          },
          {
            name: 'test_devcontainer',
            description: 'Test DevContainer functionality',
            inputSchema: {
              type: 'object',
              properties: {
                workspaceRoot: {
                  type: 'string',
                  description: 'Workspace root path',
                  default: '.'
                },
                testCommands: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: 'Custom test commands to run'
                }
              }
            }
          },
          {
            name: 'list_templates',
            description: 'List available DevContainer templates',
            inputSchema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  description: 'Filter templates by category'
                }
              }
            }
          },
          {
            name: 'modify_devcontainer',
            description: 'Modify existing DevContainer configuration',
            inputSchema: {
              type: 'object',
              properties: {
                workspaceRoot: {
                  type: 'string',
                  description: 'Workspace root path',
                  default: '.'
                },
                modifications: {
                  type: 'string',
                  description: 'Natural language description of desired changes'
                }
              },
              required: ['modifications']
            }
          },
          {
            name: 'get_devcontainer_status',
            description: 'Get DevContainer status and information',
            inputSchema: {
              type: 'object',
              properties: {
                workspaceRoot: {
                  type: 'string',
                  description: 'Workspace root path',
                  default: '.'
                }
              }
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'generate_devcontainer':
            return await this.handleGenerateDevContainer(args || {});
          
          case 'build_devcontainer':
            return await this.handleBuildDevContainer(args || {});
          
          case 'test_devcontainer':
            return await this.handleTestDevContainer(args || {});
          
          case 'list_templates':
            return await this.handleListTemplates(args || {});
          
          case 'modify_devcontainer':
            return await this.handleModifyDevContainer(args || {});
          
          case 'get_devcontainer_status':
            return await this.handleGetDevContainerStatus(args || {});
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${errorMessage}`
            }
          ]
        };
      }
    });
  }

  private async handleGenerateDevContainer(args: Record<string, unknown>) {
    const prompt = args.prompt as string;
    const workspaceRoot = (args.workspaceRoot as string) || '.';
    const baseTemplate = args.baseTemplate as string | undefined;

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const result = await this.configGenerator.generateFromPrompt(prompt, workspaceRoot, baseTemplate);

    return {
      content: [
        {
          type: 'text',
          text: `✅ DevContainer configuration generated successfully!

**Template Used:** ${result.template}
**Configuration Path:** ${result.path}

**Analysis:**
- Languages: ${result.analysis.languages.join(', ') || 'None detected'}
- Frameworks: ${result.analysis.frameworks.join(', ') || 'None detected'}
- Databases: ${result.analysis.databases.join(', ') || 'None detected'}
- Ports: ${result.analysis.ports.join(', ') || 'None detected'}

**Reasoning:** ${result.reasoning}

**Generated Configuration:**
\`\`\`json
${JSON.stringify(result.content, null, 2)}
\`\`\`

You can now build the container using the \`build_devcontainer\` tool.`
        }
      ]
    };
  }

  private async handleBuildDevContainer(args: Record<string, unknown>) {
    const workspaceRoot = (args.workspaceRoot as string) || '.';
    const configPath = args.configPath as string | undefined;
    const rebuild = (args.rebuild as boolean) || false;

    const result = await this.containerManager.buildContainer(workspaceRoot, configPath, rebuild);

    if (result.success) {
      return {
        content: [
          {
            type: 'text',
            text: `✅ DevContainer built successfully in ${Math.round(result.duration / 1000)}s!

**Build Output:**
\`\`\`
${result.output}
\`\`\`

The container is ready for development. You can test it using the \`test_devcontainer\` tool.`
          }
        ]
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `❌ DevContainer build failed after ${Math.round(result.duration / 1000)}s

**Error:**
\`\`\`
${result.error}
\`\`\`

**Build Output:**
\`\`\`
${result.output}
\`\`\`

Please check the configuration and try again.`
          }
        ]
      };
    }
  }

  private async handleTestDevContainer(args: Record<string, unknown>) {
    const workspaceRoot = (args.workspaceRoot as string) || '.';
    const testCommands = args.testCommands as string[] | undefined;

    const result = await this.containerManager.testContainer(workspaceRoot, testCommands);

    const testDetails = result.tests.map(test => {
      const status = test.success ? '✅' : '❌';
      const output = test.output ? `\n   Output: ${test.output}` : '';
      const error = test.error ? `\n   Error: ${test.error}` : '';
      return `${status} ${test.name}${output}${error}`;
    }).join('\n');

    return {
      content: [
        {
          type: 'text',
          text: `${result.success ? '✅' : '❌'} DevContainer Tests Complete

**Summary:** ${result.summary}

**Test Results:**
${testDetails}

${result.success 
  ? 'All tests passed! Your DevContainer is working correctly.' 
  : 'Some tests failed. Please review the errors and fix any issues.'}`
        }
      ]
    };
  }

  private async handleListTemplates(args: Record<string, unknown>) {
    const category = args.category as string | undefined;
    
    const templates = this.templateManager.getTemplates(category ? { category } : undefined);
    
    const templateList = templates.map(template => {
      const summary = this.templateManager.getTemplateSummary(template);
      return `**${summary.name}** (${summary.category})
  ${summary.description}
  Languages: ${(summary.languages as string[]).join(', ')}
  Frameworks: ${(summary.frameworks as string[]).join(', ')}
  Features: ${(summary.features as string[]).join(', ')}`;
    }).join('\n\n');

    const categories = this.templateManager.getCategories();

    return {
      content: [
        {
          type: 'text',
          text: `📋 Available DevContainer Templates ${category ? `(${category})` : ''}

**Available Categories:** ${categories.join(', ')}

${templateList}

Use any template name with the \`generate_devcontainer\` tool by setting the \`baseTemplate\` parameter.`
        }
      ]
    };
  }

  private async handleModifyDevContainer(args: Record<string, unknown>) {
    const workspaceRoot = (args.workspaceRoot as string) || '.';
    const modifications = args.modifications as string;

    if (!modifications) {
      throw new Error('Modifications description is required');
    }

    const result = await this.configGenerator.modifyConfiguration(workspaceRoot, modifications);

    return {
      content: [
        {
          type: 'text',
          text: `✅ DevContainer configuration modified successfully!

**Configuration Path:** ${result.path}

**Changes Made:**
- Languages: ${result.analysis.languages.join(', ') || 'None detected'}
- Frameworks: ${result.analysis.frameworks.join(', ') || 'None detected'}
- Databases: ${result.analysis.databases.join(', ') || 'None detected'}
- Ports: ${result.analysis.ports.join(', ') || 'None detected'}

**Reasoning:** ${result.reasoning}

**Updated Configuration:**
\`\`\`json
${JSON.stringify(result.content, null, 2)}
\`\`\`

You may need to rebuild the container for changes to take effect.`
        }
      ]
    };
  }

  private async handleGetDevContainerStatus(args: Record<string, unknown>) {
    const workspaceRoot = (args.workspaceRoot as string) || '.';

    const status = await this.containerManager.getContainerStatus(workspaceRoot);

    const statusIcon = status.configExists ? (status.isRunning ? '🟢' : '🟡') : '🔴';
    const statusText = status.configExists 
      ? (status.isRunning ? 'Running' : 'Stopped') 
      : 'Not configured';

    return {
      content: [
        {
          type: 'text',
          text: `${statusIcon} DevContainer Status: ${statusText}

**Configuration:**
- Exists: ${status.configExists ? '✅' : '❌'}
- Path: ${status.configPath || 'Not found'}

**Container:**
- Running: ${status.isRunning ? '✅' : '❌'}
- Name: ${status.containerName || 'Unknown'}
- Image: ${status.image || 'Unknown'}
- Last Build: ${status.lastBuildTime ? status.lastBuildTime.toLocaleString() : 'Unknown'}

${!status.configExists 
  ? 'Use the `generate_devcontainer` tool to create a configuration.' 
  : !status.isRunning 
    ? 'Use the `build_devcontainer` tool to build and start the container.'
    : 'Container is ready for development!'}`
        }
      ]
    };
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('DevContainer MCP Server running on stdio');
  }
}

// Start the server
if (require.main === module) {
  const server = new DevContainerMCPServer();
  server.run().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { DevContainerMCPServer };
