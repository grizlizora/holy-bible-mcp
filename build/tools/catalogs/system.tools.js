export const SYSTEM_TOOLS = [
    {
        name: "set_relevance_sensitivity",
        description: "Set pastoral/ethical warmth sensitivity score (0 to 100).",
        annotations: { readOnlyHint: false, idempotentHint: true },
        inputSchema: {
            type: "object",
            properties: {
                score: { type: "number", description: "Sensitivity score (0 to 100)" }
            },
            required: ["score"]
        }
    },
    {
        name: "set_response_mode",
        description: "Set active AI response depth mode.",
        annotations: { readOnlyHint: false, idempotentHint: true },
        inputSchema: {
            type: "object",
            properties: {
                mode: { type: "string", description: "Mode ('auto', 'minimal', 'short', 'medium', 'detailed', 'deep', 'verses_only')" }
            },
            required: ["mode"]
        }
    },
    {
        name: "set_show_metrics",
        description: "Enable or disable end-of-response metrics badge footer ('Complexity', 'Mode', 'Accuracy'). Pass enabled: false or status: 'off' to suppress footer.",
        annotations: { readOnlyHint: false, idempotentHint: true },
        inputSchema: {
            type: "object",
            properties: {
                enabled: { type: "boolean", description: "true to show metrics footer, false to suppress it" },
                status: { type: "string", description: "'on' or 'off'" }
            }
        }
    },
    {
        name: "get_p2p_swarm_status",
        description: "Retrieve real-time P2P WebTorrent Swarm status, active peer seeders, and Magnet URI for decentralized DB sharing.",
        annotations: { readOnlyHint: true, idempotentHint: true },
        inputSchema: {
            type: "object",
            properties: {}
        }
    },
    {
        name: "get_mcp_capabilities",
        description: "Exposes active capabilities, mode profiles, and status of holy-bible-mcp.",
        annotations: { readOnlyHint: true, idempotentHint: true },
        inputSchema: {
            type: "object",
            properties: {
                client_host: { type: "string", description: "Host application name (e.g. 'trea', 'cursor', 'cloud-code')" },
                client_name: { type: "string", description: "Alternative host client identifier" }
            }
        }
    },
    {
        name: "get_model_recommendations",
        description: "Calculates adaptive sampling parameters (min_p, temperature, top_p, num_ctx, repeat_penalty) based on LLM parameter size and query complexity.",
        annotations: { readOnlyHint: true, idempotentHint: true },
        inputSchema: {
            type: "object",
            properties: {
                model_name: { type: "string", description: "Name of the target LLM" },
                parameter_size_b: { type: "number", description: "Parameter count in Billions" },
                user_message: { type: "string", description: "User's prompt message" },
                warmth: { type: "number", description: "Pastoral sensitivity (0 to 100)" }
            },
            required: ["model_name"]
        }
    },
    {
        name: "sanitize_scripture_markdown",
        description: "Normalizes LLM response text, fixing broken bold asterisk syntax ('** 2. **Header' -> '2. **Header**').",
        annotations: { readOnlyHint: true, idempotentHint: true },
        inputSchema: {
            type: "object",
            properties: {
                markdown_text: { type: "string", description: "Raw Markdown text to sanitize" }
            },
            required: ["markdown_text"]
        }
    }
];
