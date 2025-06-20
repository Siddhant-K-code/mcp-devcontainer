# DevContainer MCP Server - Agent Configuration

This file contains important information for AI agents working with this codebase.

## Frequently Used Commands

### Development
- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run in development mode with ts-node
- `npm start` - Run the compiled server
- `npm run cli` - Run the CLI tool directly

### Testing
- `npm test` - Run the full test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Code Quality
- `npm run lint` - Run ESLint
- `npm run format` - Format code (if prettier is added)

### Container Operations
- `npx @devcontainers/cli build --workspace-folder .` - Build DevContainer
- `npx @devcontainers/cli up --workspace-folder .` - Start DevContainer
- `docker-compose up -d` - Start multi-service development environment

## Project Structure

```
devcontainer-mcp-server/
├── src/
│   ├── index.ts               # Main MCP server entry point
│   ├── config-generator.ts    # Natural language processing for configs
│   ├── devcontainer-manager.ts # Container lifecycle management
│   ├── template-manager.ts    # Template storage and selection
│   ├── cli.ts                 # Standalone CLI tool
│   └── __tests__/             # Test suite
├── dist/                      # Compiled JavaScript output
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── jest.config.js             # Testing configuration
└── README.md                  # Comprehensive documentation
```

## Code Conventions

### TypeScript
- Use strict mode with no `any` types
- Prefer interfaces over type aliases for object shapes
- Use proper error handling with try-catch blocks
- Document public methods with JSDoc comments

### Naming Conventions
- Classes: PascalCase (e.g., `ConfigGenerator`)
- Methods: camelCase (e.g., `generateFromPrompt`)
- Constants: UPPER_SNAKE_CASE (e.g., `TEST_WORKSPACE_ROOT`)
- Files: kebab-case (e.g., `config-generator.ts`)

### Error Handling
- Always catch and handle errors gracefully
- Provide meaningful error messages to users
- Use specific error types when possible
- Log errors to stderr, not stdout (for MCP compliance)

### Testing
- Write tests for all public methods
- Use descriptive test names
- Test both success and failure scenarios
- Mock external dependencies (CLI, file system)

## MCP Protocol Compliance

### Tool Schema Requirements
- All tools must have complete input schemas
- Use proper JSON Schema types and descriptions
- Mark required vs optional parameters clearly
- Return content in TextContent format

### Response Format
- Always return `{ content: [{ type: 'text', text: '...' }] }`
- Include clear status indicators (✅, ❌)
- Format code blocks with triple backticks
- Provide actionable next steps

### Error Handling
- Catch all errors and return proper MCP error responses
- Never let exceptions bubble up to the protocol layer
- Provide helpful error messages with suggested solutions

## Development Guidelines

### Adding New Templates
1. Edit `src/template-manager.ts`
2. Add to the templates array with all required properties
3. Test with `config-generator.test.ts`
4. Update README documentation

### Adding Language Support
1. Update patterns in `config-generator.ts`
2. Add appropriate VS Code extensions mapping
3. Test detection with various prompts
4. Consider adding new template if needed

### CLI Tool Changes
1. Update `src/cli.ts` for new commands
2. Ensure consistent help text and options
3. Test standalone functionality
4. Update README CLI section

## Testing Strategy

### Unit Tests
- Test each component in isolation
- Mock external dependencies
- Focus on business logic and edge cases
- Maintain >80% coverage

### Integration Tests
- Test MCP protocol compliance
- Test CLI tool end-to-end
- Test with real DevContainer CLI (in CI)

### Test Organization
- One test file per source file
- Group related tests with describe blocks
- Use beforeEach for test setup
- Clean up resources in afterEach/afterAll

## Deployment Notes

### NPM Package
- Build before publishing: `npm run build`
- Ensure dist/ directory is included
- Test CLI installation: `npm pack && npm install -g ./package.tgz`

### MCP Server
- Server runs on stdio transport
- No network configuration needed
- Logs to stderr, responses to stdout

### Docker Support
- Dockerfile for development environment
- docker-compose.yml for multi-service setup
- Mount workspace for live development

## Common Issues

### DevContainer CLI Not Found
- Install globally: `npm install -g @devcontainers/cli`
- Ensure PATH includes npm global bin
- Check with: `npx @devcontainers/cli --version`

### Build Failures
- Check Docker is running
- Verify network connectivity for image pulls
- Review devcontainer.json syntax

### Test Failures
- Run with verbose output: `npm test -- --verbose`
- Check test workspace cleanup
- Verify mocks are properly reset

## Security Considerations

- Never log or expose secrets
- Validate all user inputs
- Use safe file path operations
- Don't execute arbitrary user commands
- Handle redacted content properly

## Performance Notes

- Template matching is optimized for speed
- Configuration generation is cached per prompt
- Large container builds may take several minutes
- Test timeouts are set appropriately (30s default)

This information helps maintain code quality and consistency across the project.
