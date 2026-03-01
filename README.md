# Inkdex

Inkdex is a MCP server that makes your markdown docs searchable for AI. Point it at your docs directory, get hybrid search (text + vector) powered by local AI embeddings.

## Tools

| Tool | Description |
|------|-------------|
| `search_docs` | Search indexed documentation. Returns matching chunks ranked by relevance. |

## Usage

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "inkdex": {
      "command": "npx",
      "args": [
        "-y",
        "inkdex"
      ],
      "env": {
        "DOCS_PATH": "/path/to/your/docs"
      }
    }
  }
}
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DOCS_PATH` | Yes | Path to the directory containing markdown files to index |

To expose docs remotely, use a MCP gateway like [MCPBox](https://github.com/kandobyte/mcpbox).

## How it works

Documents are split along heading boundaries with overlap to preserve context. Chunks are embedded locally and stored in SQLite for hybrid retrieval. Indexing runs on startup and is incremental — only changed files are re-processed.
