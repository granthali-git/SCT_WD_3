const LEADERBOARD_KEY = 'quiz_leaderboard';

/**
 * Retrieves up to top 10 leaderboard entries sorted by percentage descending.
 * @returns {Array<{name: string, topic: string, score: number, total: number, percentage: number, date: string}>}
 */
export function getLeaderboard() {
  try {
    const data = localStorage.getItem(LEADERBOARD_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .sort((a, b) => {
        if (b.percentage !== a.percentage) {
          return b.percentage - a.percentage;
        }
        return new Date(b.date || 0) - new Date(a.date || 0);
      })
      .slice(0, 10);
  } catch (err) {
    console.error('Failed to read leaderboard from localStorage:', err);
    return [];
  }
}

/**
 * Saves a new score entry to localStorage and returns the updated top 10 entries.
 * @param {{name: string, topic: string, score: number, total: number, percentage: number, date?: string}} entry
 * @returns {Array} Updated top 10 leaderboard entries
 */
export function saveScore(entry) {
  try {
    const current = getLeaderboard();
    const newEntry = {
      name: (entry.name || 'Anonymous').slice(0, 20),
      topic: entry.topic || 'General',
      score: entry.score || 0,
      total: entry.total || 0,
      percentage: typeof entry.percentage === 'number' ? entry.percentage : 0,
      date: entry.date || new Date().toLocaleDateString()
    };

    const updated = [...current, newEntry]
      .sort((a, b) => {
        if (b.percentage !== a.percentage) {
          return b.percentage - a.percentage;
        }
        return new Date(b.date || 0) - new Date(a.date || 0);
      })
      .slice(0, 10);

    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to save score to localStorage:', err);
    return getLeaderboard();
  }
}
