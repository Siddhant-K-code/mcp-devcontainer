/**
 * DevContainer Configuration Generator
 * Converts natural language prompts into valid devcontainer.json configurations
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { TemplateManager, DevContainerTemplate } from './template-manager';

export interface PromptAnalysis {
  languages: string[];
  frameworks: string[];
  tools: string[];
  databases: string[];
  os: string;
  ports: number[];
  extensions: string[];
  originalPrompt: string;
}

export interface GenerationResult {
  content: Record<string, unknown>;
  path: string;
  reasoning: string;
  template: string;
  analysis: PromptAnalysis;
}

export class ConfigGenerator {
  private templateManager: TemplateManager;

  constructor() {
    this.templateManager = new TemplateManager();
  }

  /**
   * Generate DevContainer configuration from natural language prompt
   */
  async generateFromPrompt(
    prompt: string,
    workspaceRoot: string = '.',
    baseTemplate?: string
  ): Promise<GenerationResult> {
    // Analyze the prompt
    const analysis = this.analyzePrompt(prompt);
    
    // Find the best template
    let template: DevContainerTemplate | null = null;
    
    if (baseTemplate) {
      template = this.templateManager.getTemplate(baseTemplate);
      if (!template) {
        throw new Error(`Template '${baseTemplate}' not found`);
      }
    } else {
      template = this.templateManager.findBestMatch(analysis.languages, analysis.frameworks);
    }

    if (!template) {
      throw new Error('No suitable template found');
    }

    // Generate configuration based on template and analysis
    const config = this.generateConfig(template, analysis);
    
    // Save configuration
    const configDir = path.join(workspaceRoot, '.devcontainer');
    const configPath = path.join(configDir, 'devcontainer.json');
    
    await fs.ensureDir(configDir);
    await fs.writeJson(configPath, config, { spaces: 2 });

    // Generate reasoning
    const reasoning = this.generateReasoning(analysis, template);

    return {
      content: config,
      path: configPath,
      reasoning,
      template: template.name,
      analysis
    };
  }

  /**
   * Analyze natural language prompt to extract development requirements
   */
  private analyzePrompt(prompt: string): PromptAnalysis {
    const lowerPrompt = prompt.toLowerCase();
    
    // Language detection patterns
    const languagePatterns: Record<string, RegExp[]> = {
      javascript: [/\b(javascript|js|node\.?js|npm|yarn)\b/],
      typescript: [/\b(typescript|ts)\b/],
      python: [/\b(python|py|django|flask|fastapi|pip)\b/],
      go: [/\b(go|golang)\b/],
      rust: [/\b(rust|cargo)\b/],
      java: [/\b(java|maven|gradle|spring)\b/],
      php: [/\b(php|composer|laravel|symfony)\b/],
      ruby: [/\b(ruby|rails|gem|bundler)\b/],
      csharp: [/\b(c#|csharp|\.net|dotnet)\b/],
      cpp: [/\b(c\+\+|cpp|cmake)\b/]
    };

    // Framework detection patterns
    const frameworkPatterns: Record<string, RegExp[]> = {
      react: [/\b(react|jsx|next\.?js)\b/],
      angular: [/\b(angular|ng)\b/],
      vue: [/\b(vue|vuejs)\b/],
      express: [/\b(express|expressjs)\b/],
      django: [/\b(django)\b/],
      flask: [/\b(flask)\b/],
      fastapi: [/\b(fastapi|fast api)\b/],
      rails: [/\b(rails|ruby on rails)\b/],
      spring: [/\b(spring|springboot|spring boot)\b/],
      gin: [/\b(gin)\b/],
      fiber: [/\b(fiber)\b/],
      actix: [/\b(actix)\b/],
      rocket: [/\b(rocket)\b/]
    };

    // Database detection patterns
    const databasePatterns: Record<string, RegExp[]> = {
      postgresql: [/\b(postgres|postgresql|psql)\b/],
      mysql: [/\b(mysql)\b/],
      mongodb: [/\b(mongo|mongodb)\b/],
      redis: [/\b(redis)\b/],
      sqlite: [/\b(sqlite)\b/],
      elasticsearch: [/\b(elasticsearch|elastic)\b/]
    };

    // Tool detection patterns
    const toolPatterns: Record<string, RegExp[]> = {
      docker: [/\b(docker|container)\b/],
      git: [/\b(git|github|gitlab)\b/],
      vim: [/\b(vim|neovim|nvim)\b/],
      zsh: [/\b(zsh|oh-my-zsh)\b/],
      curl: [/\b(curl)\b/],
      wget: [/\b(wget)\b/],
      jq: [/\b(jq)\b/]
    };

    // Detect languages
    const languages: string[] = [];
    for (const [lang, patterns] of Object.entries(languagePatterns)) {
      if (patterns.some(pattern => pattern.test(lowerPrompt))) {
        languages.push(lang);
      }
    }

    // Detect frameworks
    const frameworks: string[] = [];
    for (const [framework, patterns] of Object.entries(frameworkPatterns)) {
      if (patterns.some(pattern => pattern.test(lowerPrompt))) {
        frameworks.push(framework);
      }
    }

    // Detect databases
    const databases: string[] = [];
    for (const [db, patterns] of Object.entries(databasePatterns)) {
      if (patterns.some(pattern => pattern.test(lowerPrompt))) {
        databases.push(db);
      }
    }

    // Detect tools
    const tools: string[] = [];
    for (const [tool, patterns] of Object.entries(toolPatterns)) {
      if (patterns.some(pattern => pattern.test(lowerPrompt))) {
        tools.push(tool);
      }
    }

    // Extract port numbers
    const portMatches = prompt.match(/\bport\s+(\d+)\b/gi) || [];
    const ports: number[] = portMatches
      .map(match => parseInt(match.replace(/\D/g, ''), 10))
      .filter(port => port > 0 && port <= 65535);

    // Also check for standalone port numbers
    const standalonePortMatches = prompt.match(/\b(\d{4,5})\b/g) || [];
    const standalonePorts = standalonePortMatches
      .map(match => parseInt(match, 10))
      .filter(port => port >= 3000 && port <= 9999); // Common dev ports

    const allPorts = [...new Set([...ports, ...standalonePorts])];

    // Detect OS preference
    let os = 'ubuntu';
    if (/\b(alpine|alpine linux)\b/i.test(prompt)) {
      os = 'alpine';
    } else if (/\b(debian)\b/i.test(prompt)) {
      os = 'debian';
    }

    // Generate recommended extensions based on detected languages
    const extensions: string[] = [];
    if (languages.includes('typescript') || languages.includes('javascript')) {
      extensions.push('ms-vscode.vscode-typescript-next', 'ms-vscode.vscode-eslint');
    }
    if (languages.includes('python')) {
      extensions.push('ms-python.python', 'ms-python.pylint');
    }
    if (languages.includes('go')) {
      extensions.push('golang.go');
    }
    if (languages.includes('rust')) {
      extensions.push('rust-lang.rust-analyzer');
    }
    if (frameworks.includes('react')) {
      extensions.push('bradlc.vscode-tailwindcss', 'esbenp.prettier-vscode');
    }

    return {
      languages,
      frameworks,
      tools,
      databases,
      os,
      ports: allPorts,
      extensions: [...new Set(extensions)],
      originalPrompt: prompt
    };
  }

  /**
   * Generate DevContainer configuration based on template and analysis
   */
  private generateConfig(template: DevContainerTemplate, analysis: PromptAnalysis): Record<string, unknown> {
    // Start with template configuration
    const config = JSON.parse(JSON.stringify(template.config));

    // Merge detected ports with template ports
    if (analysis.ports.length > 0) {
      const existingPorts = config.forwardPorts || [];
      config.forwardPorts = [...new Set([...existingPorts, ...analysis.ports])];
    }

    // Add detected extensions
    if (analysis.extensions.length > 0) {
      if (!config.customizations) {
        config.customizations = {};
      }
      if (!config.customizations.vscode) {
        config.customizations.vscode = {};
      }
      if (!config.customizations.vscode.extensions) {
        config.customizations.vscode.extensions = [];
      }
      
      const existingExtensions = config.customizations.vscode.extensions || [];
      config.customizations.vscode.extensions = [
        ...new Set([...existingExtensions, ...analysis.extensions])
      ];
    }

    // Add database features if detected
    if (analysis.databases.length > 0) {
      if (!config.features) {
        config.features = {};
      }

      for (const db of analysis.databases) {
        switch (db) {
          case 'postgresql':
            config.features['ghcr.io/devcontainers/features/postgres:1'] = {};
            break;
          case 'mongodb':
            config.features['ghcr.io/devcontainers/features/mongo:1'] = {};
            break;
          case 'redis':
            config.features['ghcr.io/devcontainers/features/redis:1'] = {};
            break;
        }
      }
    }

    // Add development tools if detected
    if (analysis.tools.includes('docker')) {
      if (!config.features) {
        config.features = {};
      }
      config.features['ghcr.io/devcontainers/features/docker-in-docker:2'] = {};
    }

    if (analysis.tools.includes('git')) {
      if (!config.features) {
        config.features = {};
      }
      config.features['ghcr.io/devcontainers/features/git:1'] = {};
    }

    // Update name to reflect the specific requirements
    if (analysis.languages.length > 0 || analysis.frameworks.length > 0) {
      const techStack = [...analysis.languages, ...analysis.frameworks].slice(0, 3);
      config.name = `${techStack.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' & ')} Development`;
    }

    return config;
  }

  /**
   * Generate reasoning explanation for the configuration choices
   */
  private generateReasoning(analysis: PromptAnalysis, template: DevContainerTemplate): string {
    const reasons: string[] = [];
    
    reasons.push(`Selected '${template.name}' template based on detected technologies.`);
    
    if (analysis.languages.length > 0) {
      reasons.push(`Detected languages: ${analysis.languages.join(', ')}`);
    }
    
    if (analysis.frameworks.length > 0) {
      reasons.push(`Detected frameworks: ${analysis.frameworks.join(', ')}`);
    }
    
    if (analysis.databases.length > 0) {
      reasons.push(`Added database support for: ${analysis.databases.join(', ')}`);
    }
    
    if (analysis.ports.length > 0) {
      reasons.push(`Configured port forwarding for: ${analysis.ports.join(', ')}`);
    }
    
    if (analysis.extensions.length > 0) {
      reasons.push(`Added VS Code extensions for detected technologies`);
    }

    if (analysis.tools.length > 0) {
      reasons.push(`Added development tools: ${analysis.tools.join(', ')}`);
    }
    
    return reasons.join('. ') + '.';
  }

  /**
   * Modify existing DevContainer configuration
   */
  async modifyConfiguration(
    workspaceRoot: string,
    modifications: string
  ): Promise<GenerationResult> {
    const configPath = path.join(workspaceRoot, '.devcontainer', 'devcontainer.json');
    
    if (!await fs.pathExists(configPath)) {
      throw new Error('No existing devcontainer.json found');
    }

    // Read existing configuration
    const existingConfig = await fs.readJson(configPath);
    
    // Analyze modification request
    const analysis = this.analyzePrompt(modifications);
    
    // Apply modifications
    const modifiedConfig = this.applyModifications(existingConfig, analysis);
    
    // Save modified configuration
    await fs.writeJson(configPath, modifiedConfig, { spaces: 2 });
    
    // Generate reasoning for modifications
    const reasoning = this.generateModificationReasoning(analysis);

    return {
      content: modifiedConfig,
      path: configPath,
      reasoning,
      template: 'modified',
      analysis
    };
  }

  /**
   * Apply modifications to existing configuration
   */
  private applyModifications(config: Record<string, unknown>, analysis: PromptAnalysis): Record<string, unknown> {
    const modified = JSON.parse(JSON.stringify(config));

    // Add new ports
    if (analysis.ports.length > 0) {
      const existingPorts = (modified.forwardPorts as number[]) || [];
      modified.forwardPorts = [...new Set([...existingPorts, ...analysis.ports])];
    }

    // Add new extensions
    if (analysis.extensions.length > 0) {
      if (!modified.customizations) {
        modified.customizations = {};
      }
      if (!modified.customizations.vscode) {
        modified.customizations.vscode = {};
      }
      if (!modified.customizations.vscode.extensions) {
        modified.customizations.vscode.extensions = [];
      }
      
      const existingExtensions = modified.customizations.vscode.extensions as string[] || [];
      modified.customizations.vscode.extensions = [
        ...new Set([...existingExtensions, ...analysis.extensions])
      ];
    }

    // Add new features for databases and tools
    if (analysis.databases.length > 0 || analysis.tools.length > 0) {
      if (!modified.features) {
        modified.features = {};
      }

      for (const db of analysis.databases) {
        switch (db) {
          case 'postgresql':
            modified.features['ghcr.io/devcontainers/features/postgres:1'] = {};
            break;
          case 'mongodb':
            modified.features['ghcr.io/devcontainers/features/mongo:1'] = {};
            break;
          case 'redis':
            modified.features['ghcr.io/devcontainers/features/redis:1'] = {};
            break;
        }
      }

      if (analysis.tools.includes('docker')) {
        modified.features['ghcr.io/devcontainers/features/docker-in-docker:2'] = {};
      }
      if (analysis.tools.includes('git')) {
        modified.features['ghcr.io/devcontainers/features/git:1'] = {};
      }
    }

    return modified;
  }

  /**
   * Generate reasoning for modifications
   */
  private generateModificationReasoning(analysis: PromptAnalysis): string {
    const changes: string[] = [];
    
    if (analysis.languages.length > 0) {
      changes.push(`Added support for: ${analysis.languages.join(', ')}`);
    }
    
    if (analysis.databases.length > 0) {
      changes.push(`Added database features: ${analysis.databases.join(', ')}`);
    }
    
    if (analysis.ports.length > 0) {
      changes.push(`Added port forwarding: ${analysis.ports.join(', ')}`);
    }
    
    if (analysis.extensions.length > 0) {
      changes.push(`Added VS Code extensions for detected technologies`);
    }

    if (analysis.tools.length > 0) {
      changes.push(`Added development tools: ${analysis.tools.join(', ')}`);
    }
    
    return changes.length > 0 
      ? `Modified configuration: ${changes.join('; ')}.`
      : 'No applicable modifications found in the request.';
  }
}
