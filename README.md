# DevContainer MCP Server

A comprehensive Model Context Protocol (MCP) server that enables AI-powered DevContainer management. This server allows developers to create, configure, build, test, and modify DevContainer environments using natural language prompts through VS Code, Cursor, or any MCP-compatible editor.

## 🌟 Features

- **Natural Language Processing**: Convert plain English descriptions into valid `devcontainer.json` configurations
- **Template System**: 11+ pre-built templates for popular development stacks (Node.js, Python, Go, Rust, Java, etc.)
- **Container Management**: Build, test, start, stop, and monitor DevContainers using DevContainer CLI
- **Live Modification**: Update existing configurations based on natural language requests
- **Status Monitoring**: Real-time container health and configuration status
- **Multi-Editor Support**: Compatible with VS Code, Cursor, Claude Desktop, and other MCP clients
- **CLI Tool**: Standalone command-line interface for direct usage

## 📋 Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Examples](#usage-examples)
- [Available Tools](#available-tools)
- [Templates](#templates)
- [CLI Tool](#cli-tool)
- [Troubleshooting](#troubleshooting)
- [API Reference](#api-reference)
- [Contributing](#contributing)

## 🚀 Installation

### Prerequisites

- Node.js 18+
- Docker or Podman
- DevContainer CLI: `npm install -g @devcontainers/cli`

### Install Package

```bash
npm install -g devcontainer-mcp-server
```

### Development Installation

```bash
git clone https://github.com/Siddhant-K-code/mcp-devcontainer.git
cd mcp-devcontainer
npm install
npm run build
```

## ⚙️ Configuration

### VS Code Setup

Add to your VS Code `settings.json`:

```json
{
  "mcp.servers": {
    "devcontainer": {
      "command": "devcontainer-mcp-server",
      "args": [],
      "env": {}
    }
  }
}
```

### Cursor Setup

Add to your Cursor configuration:

```json
{
  "mcp": {
    "servers": {
      "devcontainer": {
        "command": "devcontainer-mcp-server"
      }
    }
  }
}
```

### Claude Desktop Setup

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or equivalent:

```json
{
  "mcpServers": {
    "devcontainer": {
      "command": "devcontainer-mcp-server",
      "args": []
    }
  }
}
```

## 📚 Usage Examples

### Natural Language Prompts

**Generate a React TypeScript project:**
```
"Create a React TypeScript project with Tailwind CSS on port 3000"
```

**Python Django with PostgreSQL:**
```
"Python Django web application with PostgreSQL database and Redis cache"
```

**Go microservice:**
```
"Go API server with Gin framework, PostgreSQL database, and Docker support on port 8080"
```

**Full-stack MEAN application:**
```
"MEAN stack development environment with MongoDB, Express, Angular, and Node.js"
```

### Expected Outputs

The system automatically detects technologies and generates appropriate configurations:

- **Languages**: JavaScript, TypeScript, Python, Go, Rust, Java, PHP, Ruby
- **Frameworks**: React, Angular, Vue, Express, Django, Flask, Spring, Rails
- **Databases**: PostgreSQL, MySQL, MongoDB, Redis, SQLite, Elasticsearch
- **Tools**: Docker, Git, development tools, VS Code extensions
- **Ports**: Automatic port detection and forwarding

## 🛠️ Available Tools

### 1. `generate_devcontainer`
Generate DevContainer configuration from natural language.

**Parameters:**
- `prompt` (required): Natural language description
- `workspaceRoot` (optional): Workspace path (default: ".")
- `baseTemplate` (optional): Template to start from

### 2. `build_devcontainer`
Build container from configuration.

**Parameters:**
- `workspaceRoot` (optional): Workspace path (default: ".")
- `configPath` (optional): Custom config path
- `rebuild` (optional): Force rebuild (default: false)

### 3. `test_devcontainer`
Test container functionality.

**Parameters:**
- `workspaceRoot` (optional): Workspace path (default: ".")
- `testCommands` (optional): Custom test commands array

### 4. `list_templates`
Show available templates.

**Parameters:**
- `category` (optional): Filter by category

### 5. `modify_devcontainer`
Modify existing configuration.

**Parameters:**
- `workspaceRoot` (optional): Workspace path (default: ".")
- `modifications` (required): Desired changes description

### 6. `get_devcontainer_status`
Check container status.

**Parameters:**
- `workspaceRoot` (optional): Workspace path (default: ".")

## 📦 Templates

### Backend Templates
- **nodejs-typescript**: Node.js with TypeScript support
- **python**: Python with common packages and debugging
- **go**: Go development with standard tooling
- **rust**: Rust environment with Cargo and debugging
- **java**: Java with Maven/Gradle support
- **php**: PHP with Composer and debugging
- **ruby**: Ruby with Rails support

### Frontend Templates
- **react**: Modern React development stack with TypeScript and Vite

### Full-Stack Templates
- **mean-stack**: MongoDB, Express, Angular, Node.js
- **docker-compose**: Multi-service development

### Universal Templates
- **universal**: Multi-language development environment

### Template Features

Each template includes:
- Appropriate base image and runtime
- Language-specific tools and debuggers
- Recommended VS Code extensions
- Common port forwarding
- Package manager setup commands

## 🖥️ CLI Tool

The package includes a standalone CLI tool for direct usage:

### Generate Configuration
```bash
devcontainer-mcp-cli generate "React TypeScript app with Tailwind CSS"
```

### Build Container
```bash
devcontainer-mcp-cli build --workspace . --rebuild
```

### Test Container
```bash
devcontainer-mcp-cli test --command "npm test" --command "npm run lint"
```

### List Templates
```bash
devcontainer-mcp-cli templates --category backend
```

### Check Status
```bash
devcontainer-mcp-cli status --workspace .
```

### Modify Configuration
```bash
devcontainer-mcp-cli modify "add Redis support and port 6379"
```

## 🐛 Troubleshooting

### Common Issues

**DevContainer CLI not found:**
```bash
npm install -g @devcontainers/cli
```

**Docker not running:**
- Ensure Docker Desktop is running
- Check Docker daemon status: `docker info`

**Build failures:**
- Check devcontainer.json syntax
- Verify base image availability
- Review build logs for specific errors

**Permission issues:**
- Ensure Docker has proper permissions
- Check file system permissions for workspace

### Error Messages

**"No suitable template found":**
- Try with a more specific prompt
- Use `list_templates` to see available options
- Specify a base template explicitly

**"DevContainer configuration not found":**
- Generate configuration first with `generate_devcontainer`
- Check `.devcontainer/devcontainer.json` exists

**"Build timeout":**
- Check internet connection for image downloads
- Consider using lighter base images
- Increase timeout if needed for large images

## 📖 API Reference

### MCP Protocol Compliance

The server implements the Model Context Protocol specification:
- Tool registration with complete schemas
- Proper request/response handling
- Error responses in MCP format
- Text content responses

### Response Format

All tools return structured responses with:
- Success/failure status
- Detailed output and error messages
- Reasoning for configuration choices
- Generated configurations in JSON format

### Error Handling

Comprehensive error handling for:
- Invalid configurations
- Build failures
- CLI availability issues
- File system errors
- Network timeouts

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run with coverage:

```bash
npm run test:coverage
```

Test specific components:

```bash
npm test -- config-generator.test.ts
npm test -- template-manager.test.ts
npm test -- devcontainer-manager.test.ts
```

## 🏗️ Development

### Project Structure

```
src/
├── index.ts              # Main MCP server
├── config-generator.ts   # Natural language processing
├── devcontainer-manager.ts # Container operations
├── template-manager.ts   # Template management
├── cli.ts               # CLI tool
└── __tests__/           # Test suite
```

### Build and Run

```bash
npm run build      # Compile TypeScript
npm run dev        # Development mode
npm run start      # Production mode
npm run lint       # Code linting
```

### Adding New Templates

1. Edit `src/template-manager.ts`
2. Add template configuration to the templates array
3. Include appropriate metadata (languages, frameworks, category)
4. Add tests for the new template
5. Update documentation

### Adding Language Support

1. Update language patterns in `config-generator.ts`
2. Add framework detection patterns
3. Map to appropriate VS Code extensions
4. Create or update templates as needed
5. Add test cases

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Ensure all tests pass
5. Submit a pull request

### Development Workflow

1. Install dependencies: `npm install`
2. Run tests: `npm test`
3. Build project: `npm run build`
4. Test CLI: `npm run cli -- --help`

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [DevContainer CLI](https://github.com/devcontainers/cli) for container management
- [Model Context Protocol](https://github.com/modelcontextprotocol) for the protocol specification
- [VS Code DevContainers](https://code.visualstudio.com/docs/devcontainers/containers) for the container standards

