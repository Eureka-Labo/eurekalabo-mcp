/**
 * Configuration loader for Eureka Labo MCP Server
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

export interface Config {
  apiUrl: string;
  apiKey: string;
  workspacePath: string;
}

function loadConfig(): Config {
  const apiUrl = process.env.EUREKA_API_URL;
  const apiKey = process.env.EUREKA_API_KEY;

  // Use WORKSPACE_PATH from env if provided, otherwise use current directory
  // Claude Code automatically sets cwd to the project directory
  const workspacePath = process.env.WORKSPACE_PATH || process.cwd();

  if (!apiUrl) {
    throw new Error('EUREKA_API_URL is required in .env file');
  }

  if (!apiKey) {
    throw new Error('EUREKA_API_KEY is required in .env file');
  }

  return {
    apiUrl,
    apiKey,
    workspacePath,
  };
}

export const config = loadConfig();

export function getConfig(): Config {
  return config;
}
