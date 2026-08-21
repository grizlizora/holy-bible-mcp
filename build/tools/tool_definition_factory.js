/**
 * 🛠️ Tool Definition Factory & Zod Validator
 *
 * Provides declarative type-safe schema definitions and automatic parameter validation
 * for all 25+ Model Context Protocol (MCP) tools.
 */
export class ToolDefinitionFactory {
    /**
     * Validates tool input parameters against expected required fields
     */
    static validateParams(toolName, params, requiredKeys = []) {
        if (!params || typeof params !== 'object') {
            if (requiredKeys.length === 0)
                return (params || {});
            throw new Error(`[${toolName}] Missing required parameters object`);
        }
        for (const key of requiredKeys) {
            if (params[key] === undefined || params[key] === null || params[key] === '') {
                throw new Error(`[${toolName}] Parameter "${key}" is required.`);
            }
        }
        return params;
    }
    /**
     * Helper to build a declarative MCP tool schema
     */
    static createDefinition(name, description, properties, required = []) {
        return {
            name,
            description,
            inputSchema: {
                type: 'object',
                properties,
                required: required.length > 0 ? required : undefined
            }
        };
    }
}
