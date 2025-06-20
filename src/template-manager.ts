/**
 * DevContainer Template Manager
 * Manages pre-built DevContainer templates for various development stacks
 */

export interface DevContainerTemplate {
  name: string;
  description: string;
  languages: string[];
  frameworks: string[];
  features: string[];
  category: string;
  config: Record<string, unknown>;
}

export interface TemplateFilter {
  category?: string;
  language?: string;
  framework?: string;
}

export class TemplateManager {
  private templates: DevContainerTemplate[] = [
    {
      name: 'nodejs-typescript',
      description: 'Node.js development with TypeScript support',
      languages: ['javascript', 'typescript'],
      frameworks: ['node', 'express'],
      features: ['Node.js', 'TypeScript', 'ESLint', 'Prettier'],
      category: 'backend',
      config: {
        name: 'Node.js & TypeScript Development',
        image: 'mcr.microsoft.com/devcontainers/typescript-node:18',
        features: {
          'ghcr.io/devcontainers/features/node:1': {
            version: '18'
          }
        },
        customizations: {
          vscode: {
            extensions: [
              'ms-vscode.vscode-typescript-next',
              'ms-vscode.vscode-eslint',
              'esbenp.prettier-vscode',
              'ms-vscode.vscode-json'
            ]
          }
        },
        forwardPorts: [3000],
        postCreateCommand: 'npm install',
        remoteUser: 'node'
      }
    },
    {
      name: 'python',
      description: 'Python development with common packages and debugging',
      languages: ['python'],
      frameworks: ['django', 'flask', 'fastapi'],
      features: ['Python', 'pip', 'pytest', 'Black'],
      category: 'backend',
      config: {
        name: 'Python Development',
        image: 'mcr.microsoft.com/devcontainers/python:3.11',
        features: {
          'ghcr.io/devcontainers/features/python:1': {
            version: '3.11'
          }
        },
        customizations: {
          vscode: {
            extensions: [
              'ms-python.python',
              'ms-python.pylint',
              'ms-python.black-formatter',
              'ms-python.isort'
            ]
          }
        },
        forwardPorts: [8000],
        postCreateCommand: 'pip install -r requirements.txt',
        remoteUser: 'vscode'
      }
    },
    {
      name: 'go',
      description: 'Go development with standard tooling',
      languages: ['go'],
      frameworks: ['gin', 'fiber', 'echo'],
      features: ['Go', 'go mod', 'gofmt', 'gopls'],
      category: 'backend',
      config: {
        name: 'Go Development',
        image: 'mcr.microsoft.com/devcontainers/go:1.21',
        features: {
          'ghcr.io/devcontainers/features/go:1': {
            version: '1.21'
          }
        },
        customizations: {
          vscode: {
            extensions: [
              'golang.go',
              'ms-vscode.vscode-json'
            ]
          }
        },
        forwardPorts: [8080],
        postCreateCommand: 'go mod download',
        remoteUser: 'vscode'
      }
    },
    {
      name: 'rust',
      description: 'Rust environment with Cargo and debugging',
      languages: ['rust'],
      frameworks: ['actix', 'rocket', 'warp'],
      features: ['Rust', 'Cargo', 'rustfmt', 'clippy'],
      category: 'backend',
      config: {
        name: 'Rust Development',
        image: 'mcr.microsoft.com/devcontainers/rust:1',
        features: {
          'ghcr.io/devcontainers/features/rust:1': {
            version: 'latest'
          }
        },
        customizations: {
          vscode: {
            extensions: [
              'rust-lang.rust-analyzer',
              'vadimcn.vscode-lldb'
            ]
          }
        },
        forwardPorts: [8000],
        postCreateCommand: 'cargo build',
        remoteUser: 'vscode'
      }
    },
    {
      name: 'java',
      description: 'Java with Maven/Gradle support',
      languages: ['java'],
      frameworks: ['spring', 'springboot', 'maven', 'gradle'],
      features: ['Java', 'Maven', 'Gradle', 'JUnit'],
      category: 'backend',
      config: {
        name: 'Java Development',
        image: 'mcr.microsoft.com/devcontainers/java:17',
        features: {
          'ghcr.io/devcontainers/features/java:1': {
            version: '17',
            installMaven: true,
            installGradle: true
          }
        },
        customizations: {
          vscode: {
            extensions: [
              'vscjava.vscode-java-pack',
              'vmware.vscode-spring-boot'
            ]
          }
        },
        forwardPorts: [8080],
        postCreateCommand: 'mvn dependency:resolve',
        remoteUser: 'vscode'
      }
    },
    {
      name: 'php',
      description: 'PHP with Composer and debugging',
      languages: ['php'],
      frameworks: ['laravel', 'symfony', 'codeigniter'],
      features: ['PHP', 'Composer', 'Xdebug'],
      category: 'backend',
      config: {
        name: 'PHP Development',
        image: 'mcr.microsoft.com/devcontainers/php:8.2',
        features: {
          'ghcr.io/devcontainers/features/php:1': {
            version: '8.2'
          }
        },
        customizations: {
          vscode: {
            extensions: [
              'bmewburn.vscode-intelephense-client',
              'xdebug.php-debug'
            ]
          }
        },
        forwardPorts: [8000],
        postCreateCommand: 'composer install',
        remoteUser: 'vscode'
      }
    },
    {
      name: 'ruby',
      description: 'Ruby with Rails support',
      languages: ['ruby'],
      frameworks: ['rails', 'sinatra'],
      features: ['Ruby', 'Rails', 'Bundler', 'RSpec'],
      category: 'backend',
      config: {
        name: 'Ruby Development',
        image: 'mcr.microsoft.com/devcontainers/ruby:3.2',
        features: {
          'ghcr.io/devcontainers/features/ruby:1': {
            version: '3.2'
          }
        },
        customizations: {
          vscode: {
            extensions: [
              'rebornix.ruby',
              'wingrunr21.vscode-ruby'
            ]
          }
        },
        forwardPorts: [3000],
        postCreateCommand: 'bundle install',
        remoteUser: 'vscode'
      }
    },
    {
      name: 'react',
      description: 'Modern React development stack',
      languages: ['javascript', 'typescript'],
      frameworks: ['react', 'next', 'vite'],
      features: ['React', 'TypeScript', 'Vite', 'ESLint'],
      category: 'frontend',
      config: {
        name: 'React Development',
        image: 'mcr.microsoft.com/devcontainers/typescript-node:18',
        features: {
          'ghcr.io/devcontainers/features/node:1': {
            version: '18'
          }
        },
        customizations: {
          vscode: {
            extensions: [
              'ms-vscode.vscode-typescript-next',
              'bradlc.vscode-tailwindcss',
              'esbenp.prettier-vscode',
              'ms-vscode.vscode-eslint',
              'ms-vscode.vscode-json'
            ]
          }
        },
        forwardPorts: [3000, 5173],
        postCreateCommand: 'npm install',
        remoteUser: 'node'
      }
    },
    {
      name: 'mean-stack',
      description: 'MongoDB, Express, Angular, Node.js stack',
      languages: ['javascript', 'typescript'],
      frameworks: ['angular', 'express', 'mongodb'],
      features: ['Node.js', 'Angular', 'MongoDB', 'Express'],
      category: 'fullstack',
      config: {
        name: 'MEAN Stack Development',
        dockerComposeFile: 'docker-compose.yml',
        service: 'app',
        workspaceFolder: '/workspace',
        features: {
          'ghcr.io/devcontainers/features/node:1': {
            version: '18'
          }
        },
        customizations: {
          vscode: {
            extensions: [
              'ms-vscode.vscode-typescript-next',
              'angular.ng-template',
              'mongodb.mongodb-vscode'
            ]
          }
        },
        forwardPorts: [4200, 3000, 27017],
        postCreateCommand: 'npm install'
      }
    },
    {
      name: 'docker-compose',
      description: 'Multi-service development with Docker Compose',
      languages: ['javascript', 'python', 'go'],
      frameworks: ['microservices', 'docker'],
      features: ['Docker', 'Docker Compose', 'Multi-service'],
      category: 'fullstack',
      config: {
        name: 'Docker Compose Development',
        dockerComposeFile: 'docker-compose.yml',
        service: 'app',
        workspaceFolder: '/workspace',
        shutdownAction: 'stopCompose',
        customizations: {
          vscode: {
            extensions: [
              'ms-azuretools.vscode-docker',
              'ms-vscode-remote.remote-containers'
            ]
          }
        },
        forwardPorts: [3000, 8000, 5432],
        postCreateCommand: 'echo "Multi-service environment ready"'
      }
    },
    {
      name: 'universal',
      description: 'Multi-language development environment',
      languages: ['javascript', 'python', 'go', 'rust', 'java'],
      frameworks: ['universal'],
      features: ['Multiple Languages', 'Git', 'Docker', 'SSH'],
      category: 'universal',
      config: {
        name: 'Universal Development Environment',
        image: 'mcr.microsoft.com/devcontainers/universal:2',
        features: {
          'ghcr.io/devcontainers/features/docker-in-docker:2': {},
          'ghcr.io/devcontainers/features/git:1': {},
          'ghcr.io/devcontainers/features/github-cli:1': {}
        },
        customizations: {
          vscode: {
            extensions: [
              'ms-vscode.vscode-json',
              'ms-azuretools.vscode-docker',
              'github.vscode-pull-request-github'
            ]
          }
        },
        forwardPorts: [3000, 8000, 8080],
        postCreateCommand: 'echo "Universal environment ready"',
        remoteUser: 'codespace'
      }
    }
  ];

  /**
   * Get all available templates
   */
  getAllTemplates(): DevContainerTemplate[] {
    return [...this.templates];
  }

  /**
   * Get templates filtered by criteria
   */
  getTemplates(filter?: TemplateFilter): DevContainerTemplate[] {
    if (!filter) {
      return this.getAllTemplates();
    }

    return this.templates.filter(template => {
      if (filter.category && template.category !== filter.category) {
        return false;
      }
      if (filter.language && !template.languages.includes(filter.language)) {
        return false;
      }
      if (filter.framework && !template.frameworks.includes(filter.framework)) {
        return false;
      }
      return true;
    });
  }

  /**
   * Find best matching template based on detected languages and frameworks
   */
  findBestMatch(languages: string[], frameworks: string[]): DevContainerTemplate | null {
    let bestMatch: DevContainerTemplate | null = null;
    let bestScore = 0;

    for (const template of this.templates) {
      let score = 0;

      // Score based on language matches
      for (const lang of languages) {
        if (template.languages.includes(lang.toLowerCase())) {
          score += 10;
        }
      }

      // Score based on framework matches
      for (const framework of frameworks) {
        if (template.frameworks.includes(framework.toLowerCase())) {
          score += 5;
        }
      }

      // Prefer specific templates over universal
      if (template.name === 'universal') {
        score -= 1;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = template;
      }
    }

    // If no good match found, return universal template
    if (bestScore === 0) {
      return this.templates.find(t => t.name === 'universal') || null;
    }

    return bestMatch;
  }

  /**
   * Get template by name
   */
  getTemplate(name: string): DevContainerTemplate | null {
    return this.templates.find(t => t.name === name) || null;
  }

  /**
   * Get all available categories
   */
  getCategories(): string[] {
    const categories = new Set(this.templates.map(t => t.category));
    return Array.from(categories).sort();
  }

  /**
   * Get template summary for listing
   */
  getTemplateSummary(template: DevContainerTemplate): Record<string, unknown> {
    return {
      name: template.name,
      description: template.description,
      languages: template.languages,
      frameworks: template.frameworks,
      features: template.features,
      category: template.category
    };
  }
}
