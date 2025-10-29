#!/usr/bin/env tsx
/**
 * Test script to verify API client initialization and task listing
 */

import { getAPIClient } from './src/api/client.js';

async function test() {
  try {
    console.log('🔄 Initializing API client...');
    const client = getAPIClient();
    await client.initialize();

    const projectId = client.getProjectId();
    console.log(`✅ Connected to project: ${projectId}`);

    console.log('\n🔄 Fetching tasks...');
    const tasks = await client.listTasks({ limit: 5 });
    console.log(`✅ Found ${tasks.length} tasks`);

    if (tasks.length > 0) {
      console.log('\n📋 Sample tasks:');
      tasks.slice(0, 3).forEach((task, i) => {
        console.log(`  ${i + 1}. [${task.status}] ${task.title}`);
      });
    }

    console.log('\n✅ MCP Server API client is working correctly!');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

test();
