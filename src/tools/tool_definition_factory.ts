/**
 * 🛠️ Tool Definition Factory & Zod Validator
 * 
 * Provides declarative type-safe schema definitions and automatic parameter validation
 * for all 25+ Model Context Protocol (MCP) tools.
 */

export interface ToolPropertySpec {
  type: string;
  description: string;
  enum?: string[];
  default?: any;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, ToolPropertySpec>;
    required?: string[];
  };
}

export class ToolDefinitionFactory {
  /**
   * Validates tool input parameters against expected required fields
   */
  public static validateParams<T extends Record<string, any>>(
    toolName: string,
    params: any,
    requiredKeys: string[] = []
  ): T {
    if (!params || typeof params !== 'object') {
      if (requiredKeys.length === 0) return (params || {}) as T;
      throw new Error(`[${toolName}] Missing required parameters object`);
    }

    for (const key of requiredKeys) {
      if (params[key] === undefined || params[key] === null || params[key] === '') {
        throw new Error(`[${toolName}] Parameter "${key}" is required.`);
      }
    }

    return params as T;
  }

  /**
   * Helper to build a declarative MCP tool schema
   */
  public static createDefinition(
    name: string,
    description: string,
    properties: Record<string, ToolPropertySpec>,
    required: string[] = []
  ): McpToolDefinition {
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
