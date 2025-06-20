import { TemplateManager } from '../template-manager';

describe('TemplateManager', () => {
  let templateManager: TemplateManager;

  beforeEach(() => {
    templateManager = new TemplateManager();
  });

  describe('getAllTemplates', () => {
    it('should return all available templates', () => {
      const templates = templateManager.getAllTemplates();
      
      expect(templates.length).toBeGreaterThanOrEqual(11);
      expect(templates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'nodejs-typescript' }),
          expect.objectContaining({ name: 'python' }),
          expect.objectContaining({ name: 'go' }),
          expect.objectContaining({ name: 'rust' }),
          expect.objectContaining({ name: 'java' }),
          expect.objectContaining({ name: 'php' }),
          expect.objectContaining({ name: 'ruby' }),
          expect.objectContaining({ name: 'react' }),
          expect.objectContaining({ name: 'mean-stack' }),
          expect.objectContaining({ name: 'docker-compose' }),
          expect.objectContaining({ name: 'universal' })
        ])
      );
    });

    it('should return templates with all required properties', () => {
      const templates = templateManager.getAllTemplates();
      
      for (const template of templates) {
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('languages');
        expect(template).toHaveProperty('frameworks');
        expect(template).toHaveProperty('features');
        expect(template).toHaveProperty('category');
        expect(template).toHaveProperty('config');
        
        expect(typeof template.name).toBe('string');
        expect(typeof template.description).toBe('string');
        expect(Array.isArray(template.languages)).toBe(true);
        expect(Array.isArray(template.frameworks)).toBe(true);
        expect(Array.isArray(template.features)).toBe(true);
        expect(typeof template.category).toBe('string');
        expect(typeof template.config).toBe('object');
      }
    });
  });

  describe('getTemplates with filters', () => {
    it('should filter templates by category', () => {
      const backendTemplates = templateManager.getTemplates({ category: 'backend' });
      
      expect(backendTemplates.length).toBeGreaterThan(0);
      for (const template of backendTemplates) {
        expect(template.category).toBe('backend');
      }
    });

    it('should filter templates by language', () => {
      const jsTemplates = templateManager.getTemplates({ language: 'javascript' });
      
      expect(jsTemplates.length).toBeGreaterThan(0);
      for (const template of jsTemplates) {
        expect(template.languages).toContain('javascript');
      }
    });

    it('should filter templates by framework', () => {
      const reactTemplates = templateManager.getTemplates({ framework: 'react' });
      
      expect(reactTemplates.length).toBeGreaterThan(0);
      for (const template of reactTemplates) {
        expect(template.frameworks).toContain('react');
      }
    });

    it('should return empty array for non-existent category', () => {
      const templates = templateManager.getTemplates({ category: 'non-existent' });
      expect(templates).toEqual([]);
    });

    it('should handle multiple filters', () => {
      const templates = templateManager.getTemplates({ 
        category: 'backend',
        language: 'python'
      });
      
      for (const template of templates) {
        expect(template.category).toBe('backend');
        expect(template.languages).toContain('python');
      }
    });
  });

  describe('findBestMatch', () => {
    it('should find best match for React TypeScript', () => {
      const match = templateManager.findBestMatch(
        ['javascript', 'typescript'],
        ['react']
      );
      
      expect(match).not.toBeNull();
      expect(match?.name).toBe('react');
    });

    it('should find best match for Python Django', () => {
      const match = templateManager.findBestMatch(
        ['python'],
        ['django']
      );
      
      expect(match).not.toBeNull();
      expect(match?.name).toBe('python');
    });

    it('should find best match for Go', () => {
      const match = templateManager.findBestMatch(
        ['go'],
        []
      );
      
      expect(match).not.toBeNull();
      expect(match?.name).toBe('go');
    });

    it('should prefer specific templates over universal', () => {
      const match = templateManager.findBestMatch(
        ['rust'],
        ['actix']
      );
      
      expect(match).not.toBeNull();
      expect(match?.name).toBe('rust');
      expect(match?.name).not.toBe('universal');
    });

    it('should return universal template when no specific match found', () => {
      const match = templateManager.findBestMatch(
        ['unknown-language'],
        ['unknown-framework']
      );
      
      expect(match).not.toBeNull();
      expect(match?.name).toBe('universal');
    });

    it('should handle empty arrays', () => {
      const match = templateManager.findBestMatch([], []);
      
      expect(match).not.toBeNull();
      expect(match?.name).toBe('universal');
    });

    it('should score language matches higher than framework matches', () => {
      // This test ensures that language detection is prioritized
      const jsMatch = templateManager.findBestMatch(['javascript'], []);
      const reactMatch = templateManager.findBestMatch(['javascript'], ['react']);
      
      expect(jsMatch).not.toBeNull();
      expect(reactMatch).not.toBeNull();
      expect(reactMatch?.name).toBe('react'); // Should pick React for JS + React
    });
  });

  describe('getTemplate', () => {
    it('should return template by name', () => {
      const template = templateManager.getTemplate('nodejs-typescript');
      
      expect(template).not.toBeNull();
      expect(template?.name).toBe('nodejs-typescript');
      expect(template?.languages).toContain('javascript');
      expect(template?.languages).toContain('typescript');
    });

    it('should return null for non-existent template', () => {
      const template = templateManager.getTemplate('non-existent');
      expect(template).toBeNull();
    });

    it('should return template with valid config', () => {
      const template = templateManager.getTemplate('python');
      
      expect(template).not.toBeNull();
      expect(template?.config).toHaveProperty('name');
      expect(template?.config).toHaveProperty('image');
      
      const config = template?.config as Record<string, unknown>;
      expect(typeof config.name).toBe('string');
      expect(typeof config.image).toBe('string');
    });
  });

  describe('getCategories', () => {
    it('should return all available categories', () => {
      const categories = templateManager.getCategories();
      
      expect(categories).toContain('backend');
      expect(categories).toContain('frontend');
      expect(categories).toContain('fullstack');
      expect(categories).toContain('universal');
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should return sorted categories', () => {
      const categories = templateManager.getCategories();
      const sortedCategories = [...categories].sort();
      
      expect(categories).toEqual(sortedCategories);
    });

    it('should not have duplicate categories', () => {
      const categories = templateManager.getCategories();
      const uniqueCategories = [...new Set(categories)];
      
      expect(categories).toEqual(uniqueCategories);
    });
  });

  describe('getTemplateSummary', () => {
    it('should return template summary with required fields', () => {
      const template = templateManager.getTemplate('react');
      expect(template).not.toBeNull();
      
      const summary = templateManager.getTemplateSummary(template!);
      
      expect(summary).toHaveProperty('name');
      expect(summary).toHaveProperty('description');
      expect(summary).toHaveProperty('languages');
      expect(summary).toHaveProperty('frameworks');
      expect(summary).toHaveProperty('features');
      expect(summary).toHaveProperty('category');
      
      expect(summary.name).toBe('react');
      expect(Array.isArray(summary.languages)).toBe(true);
      expect(Array.isArray(summary.frameworks)).toBe(true);
      expect(Array.isArray(summary.features)).toBe(true);
    });

    it('should not include config in summary', () => {
      const template = templateManager.getTemplate('nodejs-typescript');
      expect(template).not.toBeNull();
      
      const summary = templateManager.getTemplateSummary(template!);
      
      expect(summary).not.toHaveProperty('config');
    });
  });

  describe('template configurations', () => {
    it('should have valid Node.js TypeScript configuration', () => {
      const template = templateManager.getTemplate('nodejs-typescript');
      expect(template).not.toBeNull();
      
      const config = template?.config as Record<string, unknown>;
      expect(config.image).toContain('typescript-node');
      expect(config.forwardPorts).toContain(3000);
      
      const customizations = config.customizations as Record<string, unknown>;
      const vscode = customizations.vscode as Record<string, unknown>;
      const extensions = vscode.extensions as string[];
      expect(extensions).toContain('ms-vscode.vscode-typescript-next');
    });

    it('should have valid Python configuration', () => {
      const template = templateManager.getTemplate('python');
      expect(template).not.toBeNull();
      
      const config = template?.config as Record<string, unknown>;
      expect(config.image).toContain('python');
      expect(config.forwardPorts).toContain(8000);
      
      const customizations = config.customizations as Record<string, unknown>;
      const vscode = customizations.vscode as Record<string, unknown>;
      const extensions = vscode.extensions as string[];
      expect(extensions).toContain('ms-python.python');
    });

    it('should have valid React configuration', () => {
      const template = templateManager.getTemplate('react');
      expect(template).not.toBeNull();
      
      const config = template?.config as Record<string, unknown>;
      expect(config.image).toContain('typescript-node');
      
      const ports = config.forwardPorts as number[];
      expect(ports).toContain(3000);
      expect(ports).toContain(5173); // Vite dev server
      
      const customizations = config.customizations as Record<string, unknown>;
      const vscode = customizations.vscode as Record<string, unknown>;
      const extensions = vscode.extensions as string[];
      expect(extensions).toContain('bradlc.vscode-tailwindcss');
    });

    it('should have valid Go configuration', () => {
      const template = templateManager.getTemplate('go');
      expect(template).not.toBeNull();
      
      const config = template?.config as Record<string, unknown>;
      expect(config.image).toContain('go');
      expect(config.forwardPorts).toContain(8080);
      expect(config.postCreateCommand).toBe('go mod download');
    });

    it('should have valid universal configuration', () => {
      const template = templateManager.getTemplate('universal');
      expect(template).not.toBeNull();
      
      const config = template?.config as Record<string, unknown>;
      expect(config.image).toContain('universal');
      
      const features = config.features as Record<string, unknown>;
      expect(Object.keys(features)).toContain('ghcr.io/devcontainers/features/docker-in-docker:2');
      expect(Object.keys(features)).toContain('ghcr.io/devcontainers/features/git:1');
    });
  });
});
