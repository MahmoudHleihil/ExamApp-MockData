import { zodToJsonSchema } from "zod-to-json-schema";

export default class MCPTool {
  constructor({
    name,
    description,
    permissions = [],
    schema,
    openAiSchema,
    execute,
    requiresConfirmation = false,
  }) {
    this.name = name;
    this.description = description;
    this.permissions = permissions;
    this.schema = schema;
    this.openAiSchema = openAiSchema;
    this.execute = execute;
    this.requiresConfirmation = requiresConfirmation;
  }

  validate(args = {}) {
    if (!this.schema) return args;
    return this.schema.parse(args);
  }

  getOpenAITool() {
    return {
      type: "function",
      function: {
        name: this.name,
        description: this.description,
        parameters: this.openAiSchema || {
          type: "object",
          properties: {},
        },
      },
    };
  }
}