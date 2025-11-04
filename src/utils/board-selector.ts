/**
 * Smart board selection based on git repository
 */

import { getAPIClient } from '../api/client.js';
import { getGitRemoteUrl, normalizeGitUrl } from './git.js';
import type { Board, Repository } from '../api/client.js';

/**
 * Intelligently select a board based on current working directory's git repository
 *
 * Logic:
 * 1. Get current git repository URL
 * 2. Find repository in project that matches URL
 * 3. Find board connected to that repository
 * 4. If no match, get a board that's not assigned to any repository
 * 5. If still no board, return null (task will be created without board assignment)
 *
 * @param cwd Working directory (optional, defaults to process.cwd())
 * @returns boardId to assign, or null if no suitable board found
 */
export async function selectBoardForTask(cwd?: string): Promise<string | null> {
  try {
    const apiClient = getAPIClient();
    await apiClient.initialize();

    // Step 1: Get current git repository URL
    const gitUrl = getGitRemoteUrl(cwd);

    if (gitUrl) {
      // Step 2: Find repository in project that matches URL
      const repository = await apiClient.getRepositoryByUrl(gitUrl);

      if (repository) {
        // Step 3: Find boards connected to this repository
        const boards = await apiClient.listBoards(repository.id);

        if (boards.length > 0) {
          // Return the first board (or default board if available)
          const defaultBoard = boards.find(b => b.isDefault);
          return defaultBoard ? defaultBoard.id : boards[0].id;
        }
      }
    }

    // Step 4: No matching repository, get boards without repository assignment
    const allBoards = await apiClient.listBoards();
    const unassignedBoards = allBoards.filter(b => !b.repositoryId);

    if (unassignedBoards.length > 0) {
      // Prefer default board if available
      const defaultBoard = unassignedBoards.find(b => b.isDefault);
      return defaultBoard ? defaultBoard.id : unassignedBoards[0].id;
    }

    // Step 5: No suitable board found, return null
    return null;
  } catch (error) {
    // Don't fail task creation if board selection fails
    console.error('Board selection failed:', error);
    return null;
  }
}

/**
 * Get board assignment info for logging/debugging
 */
export async function getBoardAssignmentInfo(cwd?: string): Promise<{
  gitUrl: string | null;
  repository: Repository | null;
  selectedBoard: Board | null;
  reason: string;
}> {
  const apiClient = getAPIClient();
  await apiClient.initialize();

  const gitUrl = getGitRemoteUrl(cwd);

  if (!gitUrl) {
    const allBoards = await apiClient.listBoards();
    const unassignedBoards = allBoards.filter(b => !b.repositoryId);

    return {
      gitUrl: null,
      repository: null,
      selectedBoard: unassignedBoards[0] || null,
      reason: 'No git repository - using unassigned board',
    };
  }

  const repository = await apiClient.getRepositoryByUrl(gitUrl);

  if (!repository) {
    const allBoards = await apiClient.listBoards();
    const unassignedBoards = allBoards.filter(b => !b.repositoryId);

    return {
      gitUrl,
      repository: null,
      selectedBoard: unassignedBoards[0] || null,
      reason: 'Repository not registered in project - using unassigned board',
    };
  }

  const boards = await apiClient.listBoards(repository.id);
  const selectedBoard = boards.find(b => b.isDefault) || boards[0] || null;

  return {
    gitUrl,
    repository,
    selectedBoard,
    reason: selectedBoard
      ? `Matched repository "${repository.name}" -> board "${selectedBoard.name}"`
      : `Repository "${repository.name}" has no boards`,
  };
}
