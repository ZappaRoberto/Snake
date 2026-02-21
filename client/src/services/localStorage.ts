/**
 * Storage key prefix for best scores.
 */
const BEST_SCORE_KEY_PREFIX = 'snake_best_'

/**
 * Get storage key for a game's best score.
 */
function getBestScoreKey(gameId: string): string {
  return `${BEST_SCORE_KEY_PREFIX}${gameId}`
}

/**
 * Save the best score for a given game ID.
 *
 * @param gameId - Unique identifier for the game session
 * @param score - Score to save if it's higher than current best
 */
export function saveBestScore(gameId: string, score: number): void {
  const key = getBestScoreKey(gameId)
  const currentBest = localStorage.getItem(key)

  if (!currentBest || score > parseInt(currentBest, 10)) {
    localStorage.setItem(key, score.toString())
  }
}

/**
 * Get the best score for a given game ID.
 *
 * @param gameId - Unique identifier for the game session
 * @returns Best score, or 0 if no score exists yet
 */
export function getBestScore(gameId: string): number {
  const key = getBestScoreKey(gameId)
  const stored = localStorage.getItem(key)

  return stored ? parseInt(stored, 10) : 0
}

/**
 * Remove the best score for a given game ID.
 *
 * @param gameId - Unique identifier for the game session
 */
export function clearBestScore(gameId: string): void {
  localStorage.removeItem(getBestScoreKey(gameId))
}
