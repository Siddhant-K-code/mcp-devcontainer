#!/usr/bin/env node

/**
 * DevContainer MCP CLI Tool
 * Standalone command-line interface for DevContainer management
 */

import { Command } from 'commander';
import { ConfigGenerator } from './config-generator.js';
import { DevContainerManager } from './devcontainer-manager.js';
import { TemplateManager } from './template-manager.js';

const program = new Command();

// Initialize components
const configGenerator = new ConfigGenerator();
const containerManager = new DevContainerManager();
const templateManager = new TemplateManager();

program
  .name('devcontainer-mcp-cli')
  .description('CLI tool for DevContainer management with natural language support')
  .version('1.0.0');

// Generate command
program
  .command('generate')
  .description('Generate DevContainer configuration from natural language')
  .argument('<prompt>', 'Natural language description of the development environment')
  .option('-w, --workspace <path>', 'Workspace root path', '.')
  .option('-t, --template <name>', 'Base template to use')
  .action(async (prompt: string, options: { workspace: string; template?: string }) => {
    try {
      console.log('🔄 Generating DevContainer configuration...');
      
      const result = await configGenerator.generateFromPrompt(
        prompt,
        options.workspace,
        options.template
      );

      console.log('✅ DevContainer configuration generated successfully!\n');
      console.log(`📁 Configuration saved to: ${result.path}`);
      console.log(`📋 Template used: ${result.template}`);
      console.log(`🔍 Reasoning: ${result.reasoning}\n`);
      
      console.log('📊 Analysis:');
      if (result.analysis.languages.length > 0) {
        console.log(`  Languages: ${result.analysis.languages.join(', ')}`);
      }
      if (result.analysis.frameworks.length > 0) {
        console.log(`  Frameworks: ${result.analysis.frameworks.join(', ')}`);
      }
      if (result.analysis.databases.length > 0) {
        console.log(`  Databases: ${result.analysis.databases.join(', ')}`);
      }
      if (result.analysis.ports.length > 0) {
        console.log(`  Ports: ${result.analysis.ports.join(', ')}`);
      }

      console.log('\n💡 Next steps:');
      console.log('  1. Review the generated configuration');
      console.log('  2. Run "devcontainer-mcp-cli build" to build the container');
      console.log('  3. Run "devcontainer-mcp-cli test" to verify functionality');
    } catch (error) {
      console.error('❌ Error generating configuration:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Build command
program
  .command('build')
  .description('Build DevContainer from configuration')
  .option('-w, --workspace <path>', 'Workspace root path', '.')
  .option('-c, --config <path>', 'Custom configuration file path')
  .option('-r, --rebuild', 'Force rebuild without cache', false)
  .action(async (options: { workspace: string; config?: string; rebuild: boolean }) => {
    try {
      console.log('🔄 Building DevContainer...');
      
      const result = await containerManager.buildContainer(
        options.workspace,
        options.config,
        options.rebuild
      );

      if (result.success) {
        console.log(`✅ DevContainer built successfully in ${Math.round(result.duration / 1000)}s!`);
        
        if (result.output) {
          console.log('\n📋 Build output:');
          console.log(result.output);
        }
        
        console.log('\n💡 Next steps:');
        console.log('  1. Run "devcontainer-mcp-cli test" to verify functionality');
        console.log('  2. Open your project in VS Code with the DevContainer extension');
      } else {
        console.error(`❌ DevContainer build failed after ${Math.round(result.duration / 1000)}s`);
        
        if (result.error) {
          console.error('\n🔍 Error details:');
          console.error(result.error);
        }
        
        if (result.output) {
          console.error('\n📋 Build output:');
          console.error(result.output);
        }
        
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error building container:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Test command
program
  .command('test')
  .description('Test DevContainer functionality')
  .option('-w, --workspace <path>', 'Workspace root path', '.')
  .option('-c, --command <cmd>', 'Custom test command', [])
  .action(async (options: { workspace: string; command: string[] }) => {
    try {
      console.log('🔄 Testing DevContainer...');
      
      const testCommands = Array.isArray(options.command) ? options.command : [options.command].filter(Boolean);
      
      const result = await containerManager.testContainer(
        options.workspace,
        testCommands.length > 0 ? testCommands : undefined
      );

      console.log(`${result.success ? '✅' : '❌'} Test Summary: ${result.summary}\n`);
      
      console.log('📋 Test Results:');
      for (const test of result.tests) {
        const status = test.success ? '✅' : '❌';
        console.log(`  ${status} ${test.name}`);
        
        if (test.output) {
          console.log(`     Output: ${test.output}`);
        }
        
        if (test.error) {
          console.log(`     Error: ${test.error}`);
        }
      }

      if (!result.success) {
        console.log('\n💡 Some tests failed. Please review the errors and fix any issues.');
        process.exit(1);
      } else {
        console.log('\n🎉 All tests passed! Your DevContainer is working correctly.');
      }
    } catch (error) {
      console.error('❌ Error testing container:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Templates command
program
  .command('templates')
  .description('List available DevContainer templates')
  .option('-c, --category <category>', 'Filter by category')
  .action(async (options: { category?: string }) => {
    try {
      const templates = templateManager.getTemplates(
        options.category ? { category: options.category } : undefined
      );
      
      const categories = templateManager.getCategories();
      
      console.log('📋 Available DevContainer Templates\n');
      
      if (options.category) {
        console.log(`🏷️  Category: ${options.category}\n`);
      } else {
        console.log(`🏷️  Categories: ${categories.join(', ')}\n`);
      }
      
      for (const template of templates) {
        const summary = templateManager.getTemplateSummary(template);
        console.log(`🔧 ${summary.name} (${summary.category})`);
        console.log(`   ${summary.description}`);
        console.log(`   Languages: ${(summary.languages as string[]).join(', ')}`);
        console.log(`   Frameworks: ${(summary.frameworks as string[]).join(', ')}`);
        console.log(`   Features: ${(summary.features as string[]).join(', ')}\n`);
      }
      
      console.log('💡 Use any template name with the generate command:');
      console.log('   devcontainer-mcp-cli generate "your prompt" --template <template-name>');
    } catch (error) {
      console.error('❌ Error listing templates:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Check DevContainer status')
  .option('-w, --workspace <path>', 'Workspace root path', '.')
  .action(async (options: { workspace: string }) => {
    try {
      const status = await containerManager.getContainerStatus(options.workspace);
      
      const statusIcon = status.configExists ? (status.isRunning ? '🟢' : '🟡') : '🔴';
      const statusText = status.configExists 
        ? (status.isRunning ? 'Running' : 'Stopped') 
        : 'Not configured';

      console.log(`${statusIcon} DevContainer Status: ${statusText}\n`);
      
      console.log('📁 Configuration:');
      console.log(`   Exists: ${status.configExists ? '✅' : '❌'}`);
      console.log(`   Path: ${status.configPath || 'Not found'}\n`);
      
      console.log('🐳 Container:');
      console.log(`   Running: ${status.isRunning ? '✅' : '❌'}`);
      console.log(`   Name: ${status.containerName || 'Unknown'}`);
      console.log(`   Image: ${status.image || 'Unknown'}`);
      console.log(`   Last Build: ${status.lastBuildTime ? status.lastBuildTime.toLocaleString() : 'Unknown'}\n`);
      
      if (!status.configExists) {
        console.log('💡 Next steps:');
        console.log('   1. Run "devcontainer-mcp-cli generate <description>" to create a configuration');
      } else if (!status.isRunning) {
        console.log('💡 Next steps:');
        console.log('   1. Run "devcontainer-mcp-cli build" to build and start the container');
      } else {
        console.log('🎉 Container is ready for development!');
      }
    } catch (error) {
      console.error('❌ Error checking status:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Modify command
program
  .command('modify')
  .description('Modify existing DevContainer configuration')
  .argument('<modifications>', 'Natural language description of desired changes')
  .option('-w, --workspace <path>', 'Workspace root path', '.')
  .action(async (modifications: string, options: { workspace: string }) => {
    try {
      console.log('🔄 Modifying DevContainer configuration...');
      
      const result = await configGenerator.modifyConfiguration(
        options.workspace,
        modifications
      );

      console.log('✅ DevContainer configuration modified successfully!\n');
      console.log(`📁 Configuration updated: ${result.path}`);
      console.log(`🔍 Changes: ${result.reasoning}\n`);
      
      console.log('📊 Modifications applied:');
      if (result.analysis.languages.length > 0) {
        console.log(`  Languages: ${result.analysis.languages.join(', ')}`);
      }
      if (result.analysis.frameworks.length > 0) {
        console.log(`  Frameworks: ${result.analysis.frameworks.join(', ')}`);
      }
      if (result.analysis.databases.length > 0) {
        console.log(`  Databases: ${result.analysis.databases.join(', ')}`);
      }
      if (result.analysis.ports.length > 0) {
        console.log(`  Ports: ${result.analysis.ports.join(', ')}`);
      }

      console.log('\n💡 Next steps:');
      console.log('  1. Review the updated configuration');
      console.log('  2. Run "devcontainer-mcp-cli build --rebuild" to apply changes');
    } catch (error) {
      console.error('❌ Error modifying configuration:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Error handling
program.configureHelp({
  sortSubcommands: true,
});

program.parse();
