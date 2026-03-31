// ============================================
// TimeForge — API Service Layer (v3.0)
// ============================================
// Bridges frontend ↔ backend. Falls back to localStorage when offline.
// Integrates sync queue for offline resilience.

import { syncQueue } from './sync-queue.js';

// Auto-detect environment: localhost → dev backend, production → Railway
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = isLocalhost
  ? 'http://localhost:8000/api'
  : (window.__TIMEFORGE_API_URL || 'https://time-tracker-ai-shcd.onrender.com/api');
const TOKEN_KEY = 'timeforge_auth_token';
const USER_KEY = 'timeforge_auth_user';

class ApiService {
  constructor() {
    this.token = localStorage.getItem(TOKEN_KEY) || null;
    this.user = null;
    this._online = null;
    try {
      const u = localStorage.getItem(USER_KEY);
      if (u) this.user = JSON.parse(u);
    } catch (e) {}
  }

  // === Connection Status ===

  async checkConnection() {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
      const data = await res.json();
      this._online = true;
      return data;
    } catch {
      this._online = false;
      return null;
    }
  }

  get isOnline() {
    return this._online === true;
  }

  get isAuthenticated() {
    return !!this.token;
  }

  get aiConfigured() {
    return this._healthData?.ai_configured || false;
  }

  // === HTTP Helpers ===

  async _request(path, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token ? { 'Authorization': `Bearer ${this.token}` } : {}),
      ...(options.headers || {}),
    };

    try {
      const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        signal: options.signal || AbortSignal.timeout(10000),
      });

      if (res.status === 401) {
        this.logout();
        throw new Error('Session expired. Please log in again.');
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(err.detail || `HTTP ${res.status}`);
      }

      return await res.json();
    } catch (e) {
      if (e.name === 'AbortError' || e.name === 'TypeError') {
        this._online = false;
        throw new Error('Backend unreachable. Working in offline mode.');
      }
      throw e;
    }
  }

  async _get(path) {
    return this._request(path);
  }

  async _post(path, body) {
    return this._request(path, { method: 'POST', body: JSON.stringify(body) });
  }

  async _put(path, body) {
    return this._request(path, { method: 'PUT', body: JSON.stringify(body) });
  }

  async _delete(path) {
    return this._request(path, { method: 'DELETE' });
  }

  // === Auth ===

  async register(email, password, name, role = 'student') {
    const data = await this._post('/auth/register', { email, password, name, role });
    this._setAuth(data);
    return data;
  }

  async login(email, password) {
    const data = await this._post('/auth/login', { email, password });
    this._setAuth(data);
    return data;
  }

  async getProfile() {
    return this._get('/auth/me');
  }

  async updateProfile(updates) {
    return this._put('/auth/profile', updates);
  }

  _setAuth(data) {
    this.token = data.access_token;
    this.user = data.user;
    localStorage.setItem(TOKEN_KEY, data.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    syncQueue.clear();
  }

  // === Time Logs ===

  async createLog(logData) {
    return this._post('/logs', logData);
  }

  async getLogs(date = null) {
    const query = date ? `?date=${date}` : '';
    return this._get(`/logs${query}`);
  }

  async getLogsRange(start, end) {
    return this._get(`/logs/range?start=${start}&end=${end}`);
  }

  async getDailySummary(date) {
    return this._get(`/logs/summary/${date}`);
  }

  async updateLog(id, updates) {
    return this._put(`/logs/${id}`, updates);
  }

  async deleteLog(id) {
    return this._delete(`/logs/${id}`);
  }

  async syncLogs(logs) {
    return this._post('/logs/sync', { logs });
  }

  // === Goals ===

  async createGoal(goalData) {
    return this._post('/goals', goalData);
  }

  async getGoals() {
    return this._get('/goals');
  }

  async updateGoal(id, updates) {
    return this._put(`/goals/${id}`, updates);
  }

  async deleteGoal(id) {
    return this._delete(`/goals/${id}`);
  }

  // === Plans ===

  async savePlan(date, planJson, generatedBy = 'manual') {
    return this._post('/plans', { date, plan_json: JSON.stringify(planJson), generated_by: generatedBy });
  }

  async getPlan(date) {
    return this._get(`/plans/${date}`);
  }

  async getPlans() {
    return this._get('/plans');
  }

  // === Rewards ===

  async getRewards() {
    return this._get('/rewards');
  }

  async processDay(dayData) {
    return this._post('/rewards/process-day', dayData);
  }

  async syncRewards(rewardsData) {
    return this._post('/rewards/sync', rewardsData);
  }

  // === AI (with caching + safe fallback) ===

  _aiCache = new Map(); // key → { data, timestamp }
  _AI_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

  _getCached(key) {
    const entry = this._aiCache.get(key);
    if (entry && (Date.now() - entry.timestamp) < this._AI_CACHE_TTL) {
      return entry.data;
    }
    this._aiCache.delete(key);
    return null;
  }

  _setCache(key, data) {
    this._aiCache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Safe AI call wrapper — catches all errors, returns { error, message } instead of throwing.
   */
  async safeAICall(fn) {
    try {
      return await fn();
    } catch (e) {
      console.warn('AI call failed:', e.message);
      return { error: true, message: e.message || 'AI unavailable' };
    }
  }

  async getAIAnalysis(days = 7) {
    const cacheKey = `analysis_${days}`;
    const cached = this._getCached(cacheKey);
    if (cached) return { ...cached, source: 'cached' };

    const data = await this._get(`/ai/analysis?days=${days}`);
    this._setCache(cacheKey, data);
    return data;
  }

  async getCoaching() {
    const cacheKey = 'coaching';
    const cached = this._getCached(cacheKey);
    if (cached) return cached;

    const data = await this._get('/ai/coaching');
    this._setCache(cacheKey, data);
    return data;
  }

  async generateAIPlan() {
    return this._post('/ai/generate-plan', {});
  }

  async whatIfAnalysis(scenario) {
    return this._post(`/ai/what-if?scenario=${encodeURIComponent(scenario)}`, {});
  }

  async getAIHistory(limit = 10) {
    return this._get(`/ai/history?limit=${limit}`);
  }

  // === Weekly Reviews ===

  async getCurrentReview() {
    return this._get('/reviews/weekly/current');
  }

  async submitReview(reviewData) {
    return this._post('/reviews/weekly', reviewData);
  }

  async getReviewHistory(limit = 12) {
    return this._get(`/reviews/weekly/history?limit=${limit}`);
  }

  // === Drift Alerts ===

  async getPendingAlerts() {
    return this._get('/alerts/pending');
  }

  async acknowledgeAlert(alertId, action = 'seen') {
    return this._post(`/alerts/${alertId}/acknowledge?action=${action}`, {});
  }

  // === Sync Queue Helpers ===

  /**
   * Fire-and-forget write with queue fallback.
   * Tries to write to backend. On failure, queues for later retry.
   */
  async writeWithFallback(path, method, body, description) {
    if (!this.isAuthenticated || !this.isOnline) {
      syncQueue.enqueue(path, method, body, description);
      return null;
    }
    try {
      return await this._request(path, {
        method,
        body: JSON.stringify(body),
      });
    } catch (e) {
      syncQueue.enqueue(path, method, body, description);
      return null;
    }
  }

  /**
   * Process any pending items in the sync queue.
   */
  async processSyncQueue() {
    if (!this.isAuthenticated || !this.isOnline) return { processed: 0, failed: 0, remaining: 0 };
    const rawFetch = async (path, options) => {
      const headers = {
        ...options.headers,
        'Authorization': `Bearer ${this.token}`,
      };
      return fetch(`${API_BASE}${path}`, { ...options, headers });
    };
    return syncQueue.processQueue(rawFetch);
  }

  /**
   * Start auto-retry for queued items.
   */
  startSyncQueue() {
    if (!this.isAuthenticated) return;
    const rawFetch = async (path, options) => {
      const headers = {
        ...options.headers,
        'Authorization': `Bearer ${this.token}`,
      };
      return fetch(`${API_BASE}${path}`, { ...options, headers });
    };
    syncQueue.startAutoRetry(rawFetch);
  }

  /**
   * Get sync queue status.
   */
  get syncQueuePending() {
    return syncQueue.pendingCount;
  }

  // === Full Sync ===

  async syncAllData(stateData) {
    /**
     * Sync entire localStorage state to backend.
     * Called when user connects to backend for the first time.
     */
    const results = { logs: null, goals: null, rewards: null };

    // Sync logs
    if (stateData.logs && stateData.logs.length > 0) {
      const formattedLogs = stateData.logs.map(l => ({
        activity: l.activity,
        category: l.category,
        start_time: l.startTime,
        end_time: l.endTime,
        duration: l.duration,
        mood: l.mood || 3,
        energy: l.energy || 3,
        notes: l.notes || '',
        friction_reason: l.frictionReason || null,
        friction_text: l.frictionText || null,
        date: l.date,
      }));
      results.logs = await this.syncLogs(formattedLogs);
    }

    // Sync goals
    if (stateData.goals && stateData.goals.length > 0) {
      for (const goal of stateData.goals) {
        try {
          await this.createGoal({
            title: goal.title,
            type: goal.type || 'General',
            deadline: goal.deadline || null,
            daily_effort: goal.dailyEffort || 2.0,
            progress: goal.progress || 0,
            priority: goal.priority || 'medium',
          });
        } catch (e) {
          console.warn('Goal sync skipped:', e.message);
        }
      }
      results.goals = { synced: stateData.goals.length };
    }

    // Sync rewards
    if (stateData.rewards) {
      results.rewards = await this.syncRewards({
        xp: stateData.rewards.xp || 0,
        level: stateData.rewards.level || 1,
        levelName: stateData.rewards.levelName || 'Novice',
        currentStreak: stateData.streaks?.current || 0,
        bestStreak: stateData.streaks?.best || 0,
        achievements: stateData.rewards.achievements || [],
      });
    }

    // Update profile with user data
    if (stateData.user) {
      await this.updateProfile({
        name: stateData.user.name,
        wake_time: stateData.user.wakeTime,
        sleep_time: stateData.user.sleepTime,
        goals_text: JSON.stringify(stateData.user.goals || []),
      });
    }

    return results;
  }
}

export const api = new ApiService();
