// ============================================
// TimeForge — Offline Sync Queue
// Queues failed backend writes and retries when online
// ============================================

const QUEUE_KEY = 'timeforge_sync_queue';
const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5 * 60 * 1000; // 5 minutes

class SyncQueue {
  constructor() {
    this._retryTimer = null;
  }

  getQueue() {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  _saveQueue(queue) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  /**
   * Add a failed write to the retry queue.
   * @param {string} endpoint - API endpoint path (e.g., '/api/logs')
   * @param {string} method - HTTP method ('POST', 'PUT', 'DELETE')
   * @param {object} body - Request body
   * @param {string} description - Human-readable description for debugging
   */
  enqueue(endpoint, method, body, description = '') {
    const queue = this.getQueue();
    queue.push({
      id: Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      endpoint,
      method,
      body,
      description,
      retries: 0,
      created_at: new Date().toISOString(),
    });
    this._saveQueue(queue);
    console.log(`[SyncQueue] Queued: ${method} ${endpoint} — ${description}`);
  }

  /**
   * Get count of pending items.
   */
  get pendingCount() {
    return this.getQueue().length;
  }

  /**
   * Process all queued items. Call this when connectivity is restored.
   * @param {function} fetchFn - The authenticated fetch function from api.js
   * @returns {object} { processed, failed, remaining }
   */
  async processQueue(fetchFn) {
    const queue = this.getQueue();
    if (queue.length === 0) return { processed: 0, failed: 0, remaining: 0 };

    const results = { processed: 0, failed: 0, remaining: 0 };
    const remaining = [];

    for (const item of queue) {
      try {
        const response = await fetchFn(item.endpoint, {
          method: item.method,
          headers: { 'Content-Type': 'application/json' },
          body: item.body ? JSON.stringify(item.body) : undefined,
        });

        if (response.ok) {
          results.processed++;
          console.log(`[SyncQueue] ✅ Synced: ${item.description}`);
        } else if (response.status === 409) {
          // Conflict (duplicate) — discard silently
          results.processed++;
          console.log(`[SyncQueue] ⚠️ Already exists (skipped): ${item.description}`);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (err) {
        item.retries++;
        if (item.retries < MAX_RETRIES) {
          remaining.push(item);
          console.log(`[SyncQueue] ⏳ Retry ${item.retries}/${MAX_RETRIES}: ${item.description}`);
        } else {
          results.failed++;
          console.log(`[SyncQueue] ❌ Giving up after ${MAX_RETRIES} retries: ${item.description}`);
        }
      }
    }

    results.remaining = remaining.length;
    this._saveQueue(remaining);
    return results;
  }

  /**
   * Start automatic retry timer. Processes queue every RETRY_INTERVAL ms.
   * @param {function} fetchFn - The authenticated fetch function
   */
  startAutoRetry(fetchFn) {
    if (this._retryTimer) return;
    this._retryTimer = setInterval(async () => {
      if (this.pendingCount > 0) {
        console.log(`[SyncQueue] Auto-retry: ${this.pendingCount} items pending`);
        await this.processQueue(fetchFn);
      }
    }, RETRY_INTERVAL);
  }

  /**
   * Stop auto-retry timer.
   */
  stopAutoRetry() {
    if (this._retryTimer) {
      clearInterval(this._retryTimer);
      this._retryTimer = null;
    }
  }

  /**
   * Clear all items from queue (e.g., on logout).
   */
  clear() {
    this._saveQueue([]);
  }
}

export const syncQueue = new SyncQueue();
