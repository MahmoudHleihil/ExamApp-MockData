class MCPRegistry {
  constructor() {
    this.tools = new Map();
  }

  register(tool) {
    if (!tool?.name) {
      throw new Error("Invalid MCP tool: missing name");
    }

    if (this.tools.has(tool.name)) {
      throw new Error(`Duplicate MCP tool: ${tool.name}`);
    }

    this.tools.set(tool.name, tool);
  }

  get(name) {
    return this.tools.get(name);
  }

  getAll() {
    return [...this.tools.values()];
  }
}

export default new MCPRegistry();