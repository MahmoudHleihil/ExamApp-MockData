import registry from "../mcp/registry.js";

export function getOpenAIToolsForUser(user) {

    return registry
        .getAll()
        .filter(tool =>
            tool.permissions.includes(user.role)
        )
        .map(tool => tool.getOpenAITool());

}