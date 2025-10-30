/**
 * Utilities for managing Claude Code configuration
 */

import { existsSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { getClaudeConfigDir } from './platform.js';

export interface McpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

/**
 * Ensure Claude config directory exists
 */
export async function ensureClaudeConfigDir(): Promise<void> {
  const claudeDir = getClaudeConfigDir();

  if (!existsSync(claudeDir)) {
    await mkdir(claudeDir, { recursive: true });
  }
}

/**
 * Check if MCP server is configured
 */
export async function isMcpServerConfigured(serverName: string): Promise<boolean> {
  try {
    const mcpConfigPath = join(getClaudeConfigDir(), 'mcp.json');

    if (!existsSync(mcpConfigPath)) {
      return false;
    }

    const content = await readFile(mcpConfigPath, 'utf-8');
    const config = JSON.parse(content);

    return !!(config.mcpServers && config.mcpServers[serverName]);
  } catch (error) {
    return false;
  }
}

/**
 * Add MCP server to Claude configuration
 */
export async function addMcpServer(
  serverName: string,
  serverConfig: McpServerConfig
): Promise<void> {
  await ensureClaudeConfigDir();

  const mcpConfigPath = join(getClaudeConfigDir(), 'mcp.json');

  let config: any = {
    mcpServers: {},
  };

  // Read existing config
  if (existsSync(mcpConfigPath)) {
    const content = await readFile(mcpConfigPath, 'utf-8');
    config = JSON.parse(content);

    if (!config.mcpServers) {
      config.mcpServers = {};
    }
  }

  // Add or update server
  config.mcpServers[serverName] = serverConfig;

  // Write back
  await writeFile(mcpConfigPath, JSON.stringify(config, null, 2), 'utf-8');
}

/**
 * Remove MCP server from Claude configuration
 */
export async function removeMcpServer(serverName: string): Promise<void> {
  const mcpConfigPath = join(getClaudeConfigDir(), 'mcp.json');

  if (!existsSync(mcpConfigPath)) {
    return;
  }

  const content = await readFile(mcpConfigPath, 'utf-8');
  const config = JSON.parse(content);

  if (config.mcpServers && config.mcpServers[serverName]) {
    delete config.mcpServers[serverName];

    await writeFile(mcpConfigPath, JSON.stringify(config, null, 2), 'utf-8');
  }
}
