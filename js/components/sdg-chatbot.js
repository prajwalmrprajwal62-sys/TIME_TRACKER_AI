// ============================================
// TimeForge — SDG 8 Productivity Advisor Chatbot
// ============================================
// Interactive AI chatbot that uses real user data
// to answer SDG-related productivity questions.

import { state } from '../core/state.js';
import { api } from '../core/api.js';
import { events, EVENTS } from '../core/events.js';
import { collector } from '../agents/collector.js';
import { analyzer } from '../agents/analyzer.js';
import { enforcer } from '../agents/enforcer.js';
import { today, formatDuration, daysAgo } from '../core/utils.js';
import {
  SDG_BENCHMARKS,
  calculateSDGScore,
  calculatePercentile,
  getSDGLevel,
  calculateWorkLifeBalance,
} from '../data/sdg-benchmarks.js';

class SDGChatbot {
  constructor() {
    this.isOpen = false;
    this.isLoading = false;
    this.messages = [];
    this.containerEl = null;
    this.messagesEl = null;
    this.inputEl = null;
    this._mounted = false;
  }

  // === Build Context from Live Data ===

  buildContext() {
    const todayDate = today();
    const summary = collector.getDailySummary(todayDate);
    const compliance = enforcer.calculateCompliance(todayDate);
    const streak = state.get('streaks.current') || 0;
    const weekAnalysis = analyzer.analyzeWeek();
    const userType = analyzer.classifyUserType();
    const user = state.get('user');
    const level = state.get('rewards.level') || 1;
    const levelName = state.get('rewards.levelName') || 'Novice';

    const deepWorkHours = (summary.categories['Deep Work']?.minutes || 0) / 60;
    const wastedHours = summary.wastedMinutes / 60;
    const productiveHours = summary.productiveMinutes / 60;
    const totalHours = summary.totalMinutes / 60;

    const sdgScore = calculateSDGScore({
      deepWorkHours,
      compliancePercent: compliance.score,
      streakDays: streak,
      wastedHours,
    });
    const sdgLevel = getSDGLevel(sdgScore);
    const percentile = calculatePercentile(deepWorkHours, 'deepWork');
    const balanceScore = calculateWorkLifeBalance(
      summary.productiveMinutes,
      summary.wastedMinutes,
      summary.totalMinutes
    );

    return {
      userName: user?.name || 'Student',
      deepWorkHours: deepWorkHours.toFixed(1),
      productiveHours: productiveHours.toFixed(1),
      wastedHours: wastedHours.toFixed(1),
      totalHours: totalHours.toFixed(1),
      complianceScore: compliance.score,
      streak,
      userType: userType || 'Not classified yet',
      level,
      levelName,
      sdgScore,
      sdgLevel: sdgLevel.label,
      percentile,
      balanceScore,
      weekAvgProductive: weekAnalysis.avgProductive,
      weekAvgWasted: weekAnalysis.avgWasted,
      weekTrend: weekAnalysis.productivityTrend,
      logCount: summary.logCount,
      topCategory: this._getTopCategory(summary),
      globalAvgDeepWork: SDG_BENCHMARKS.students.deepWorkHoursDaily,
      globalAvgCompliance: SDG_BENCHMARKS.students.compliancePercent,
    };
  }

  _getTopCategory(summary) {
    let max = 0, top = 'None';
    for (const [cat, data] of Object.entries(summary.categories)) {
      if (data.minutes > max) { max = data.minutes; top = cat; }
    }
    return top;
  }

  // === Suggested Questions ===

  getSuggestedQuestions() {
    const ctx = this.buildContext();
    return [
      `Am I on track for sustainable productivity?`,
      `How does my ${ctx.deepWorkHours}h deep work compare to SDG targets?`,
      `What's my biggest time waste this week?`,
      `How can I improve my work-life balance?`,
      `Give me a personalized plan for tomorrow`,
      `What's my burnout risk level?`,
    ];
  }

  // === Local Fallback Responses ===

  generateLocalResponse(question, ctx) {
    const q = question.toLowerCase();

    if (q.includes('track') || q.includes('sustainable') || q.includes('sdg')) {
      const above = parseFloat(ctx.deepWorkHours) >= ctx.globalAvgDeepWork;
      return `**SDG 8 Productivity Assessment**\n\n` +
        `Your current SDG contribution score is **${ctx.sdgScore}/100** (${ctx.sdgLevel}).\n\n` +
        `📊 Key Metrics:\n` +
        `• Deep work: **${ctx.deepWorkHours}h/day** (global avg: ${ctx.globalAvgDeepWork}h)\n` +
        `• Compliance: **${ctx.complianceScore}%** (global avg: ${ctx.globalAvgCompliance}%)\n` +
        `• Streak: **${ctx.streak} days**\n` +
        `• Work-life balance: **${ctx.balanceScore}%**\n\n` +
        `${above
          ? `✅ You're in the **top ${100 - ctx.percentile}%** of students. You're contributing positively to SDG 8.5 targets for productive employment.`
          : `⚠️ You're at the **${ctx.percentile}th percentile**. To meet SDG 8.5 sustainable productivity targets, aim for at least ${ctx.globalAvgDeepWork}h of deep work daily.`
        }`;
    }

    if (q.includes('deep work') || q.includes('compare') || q.includes('how do')) {
      const diff = (parseFloat(ctx.deepWorkHours) - ctx.globalAvgDeepWork).toFixed(1);
      const above = diff > 0;
      return `**Deep Work Comparison — SDG 8.5 Analysis**\n\n` +
        `Your deep work today: **${ctx.deepWorkHours}h**\n` +
        `Global student average: **${ctx.globalAvgDeepWork}h**\n` +
        `SDG sustainable target: **${SDG_BENCHMARKS.sustainableTargets.minDeepWorkHours}h**\n\n` +
        `${above
          ? `📈 You're **${diff}h above** the global average! You're in the top **${100 - ctx.percentile}%** of students.`
          : `📉 You're **${Math.abs(diff)}h below** the average. Each extra hour of deep work multiplies your SDG contribution.`
        }\n\n` +
        `💡 *SDG 8 defines productive employment as sustainable, high-quality work. It's not about grinding 12 hours — it's about maximizing focused output.*`;
    }

    if (q.includes('waste') || q.includes('biggest') || q.includes('problem')) {
      return `**Your Biggest Time Drains — SDG Impact Analysis**\n\n` +
        `⏳ Wasted time today: **${ctx.wastedHours}h** (${ctx.totalHours > 0 ? Math.round((parseFloat(ctx.wastedHours) / parseFloat(ctx.totalHours)) * 100) : 0}% of tracked time)\n` +
        `📊 Weekly avg wasted: **${formatDuration(ctx.weekAvgWasted)}/day**\n` +
        `🏷️ Most active category: **${ctx.topCategory}**\n\n` +
        `**SDG 8 Impact:** Every hour of wasted time directly reduces your contribution to productive employment targets.\n\n` +
        `If you reduce waste by just 30 min/day:\n` +
        `• Weekly: **3.5 extra productive hours**\n` +
        `• Monthly: **15 extra hours** — that's almost 2 full work days\n` +
        `• Yearly: **182 hours** — enough to learn a new skill\n\n` +
        `🎯 *Start small: Block your top distraction app for 1 hour during your weakest time slot.*`;
    }

    if (q.includes('balance') || q.includes('work-life') || q.includes('burnout')) {
      const risk = ctx.balanceScore < 40 ? 'HIGH' : ctx.balanceScore < 60 ? 'MODERATE' : 'LOW';
      return `**Work-Life Balance — SDG 8.8 Assessment**\n\n` +
        `Your balance score: **${ctx.balanceScore}/100**\n` +
        `Burnout risk: **${risk}**\n\n` +
        `SDG Target 8.8 promotes safe and healthy working environments. This includes mental health and sustainable work patterns.\n\n` +
        `${risk === 'HIGH'
          ? `🔴 Your balance is unsustainable. You're either overworking or over-resting with no productive output. Consider:\n• Setting firm stop times for work\n• Adding 30 min of exercise/meditation\n• Reducing screen time before bed`
          : risk === 'MODERATE'
          ? `🟡 You're managing but could improve. Try:\n• Scheduling intentional breaks (not phone scrolling)\n• Keeping productive sessions under 90 min\n• Adding a "wind-down" routine`
          : `🟢 Your balance is healthy! You're modeling sustainable productivity. Keep maintaining boundaries between work and rest.`
        }\n\n` +
        `*Behavioral type: ${ctx.userType}*`;
    }

    if (q.includes('plan') || q.includes('tomorrow') || q.includes('schedule')) {
      return `**Personalized SDG-Aligned Plan**\n\n` +
        `Based on your profile (${ctx.userType}, Level ${ctx.level} ${ctx.levelName}):\n\n` +
        `🌅 **Morning Block** (Peak Energy)\n` +
        `• 2h Deep Work — your most important task\n` +
        `• 30 min break + movement\n\n` +
        `☀️ **Midday Block**\n` +
        `• 1.5h College/Learning\n` +
        `• Lunch + 15 min controlled social media\n\n` +
        `🌆 **Afternoon Block**\n` +
        `• 1.5h Deep Work — second session\n` +
        `• 30 min review + planning\n\n` +
        `🌙 **Evening**\n` +
        `• Exercise/Social time\n` +
        `• Light reading or skill building\n` +
        `• No screens 30 min before bed\n\n` +
        `📊 **SDG Target:** ${SDG_BENCHMARKS.sustainableTargets.minDeepWorkHours}h deep work, <${SDG_BENCHMARKS.sustainableTargets.maxWastedHours}h waste\n` +
        `🔥 *Following this plan puts you in the top 25% of students.*`;
    }

    // Default response
    return `**SDG 8 Productivity Snapshot**\n\n` +
      `Here's your current position relative to SDG 8 targets:\n\n` +
      `| Metric | You | Global Avg | SDG Target |\n` +
      `|--------|-----|------------|------------|\n` +
      `| Deep Work | ${ctx.deepWorkHours}h | ${ctx.globalAvgDeepWork}h | ${SDG_BENCHMARKS.sustainableTargets.minDeepWorkHours}h |\n` +
      `| Compliance | ${ctx.complianceScore}% | ${ctx.globalAvgCompliance}% | ${SDG_BENCHMARKS.sustainableTargets.minCompliancePercent}% |\n` +
      `| Streak | ${ctx.streak}d | ${SDG_BENCHMARKS.students.avgStreakDays}d | ${SDG_BENCHMARKS.sustainableTargets.minStreakDays}d |\n\n` +
      `**SDG Score: ${ctx.sdgScore}/100 (${ctx.sdgLevel})**\n\n` +
      `Try asking me:\n` +
      `• "Am I on track for sustainable productivity?"\n` +
      `• "What's my burnout risk level?"\n` +
      `• "Give me a plan for tomorrow"`;
  }

  // === Send Message ===

  async sendMessage(text) {
    if (!text.trim() || this.isLoading) return;

    // Add user message
    this.messages.push({ role: 'user', content: text });
    this._renderMessages();
    this._scrollToBottom();

    // Clear input
    if (this.inputEl) this.inputEl.value = '';

    // Show loading
    this.isLoading = true;
    this._renderTypingIndicator(true);

    try {
      const ctx = this.buildContext();
      let response;

      // Try backend first
      if (window.__timeforge_backend && api.isAuthenticated) {
        try {
          const result = await api.chatWithAdvisor(text, ctx);
          response = result.response || result.message || this.generateLocalResponse(text, ctx);
        } catch {
          // Fallback to local
          response = this.generateLocalResponse(text, ctx);
        }
      } else {
        response = this.generateLocalResponse(text, ctx);
      }

      this.messages.push({ role: 'assistant', content: response });
    } catch (e) {
      this.messages.push({
        role: 'assistant',
        content: `I'm having trouble processing that right now. Here's what I know:\n\nYour SDG 8 score is **${this.buildContext().sdgScore}/100**. Try asking a specific question about your productivity data.`,
      });
    } finally {
      this.isLoading = false;
      this._renderTypingIndicator(false);
      this._renderMessages();
      this._scrollToBottom();
    }
  }

  // === Render ===

  render() {
    const suggestions = this.getSuggestedQuestions();

    return `
      <div class="chatbot-container ${this.isOpen ? 'open' : ''}" id="sdg-chatbot">
        <!-- Toggle Button -->
        <button class="chatbot-toggle" id="chatbot-toggle" aria-label="Open SDG Advisor">
          <span class="chatbot-toggle-icon">💬</span>
          <span class="chatbot-toggle-label">SDG Advisor</span>
          <span class="chatbot-toggle-pulse"></span>
        </button>

        <!-- Chat Window -->
        <div class="chatbot-window" id="chatbot-window">
          <!-- Header -->
          <div class="chatbot-header">
            <div class="chatbot-header-left">
              <div class="chatbot-avatar">
                <img src="assets/sdg8-logo.png" alt="SDG 8" onerror="this.style.display='none'; this.parentNode.innerHTML='🏢';" />
              </div>
              <div class="chatbot-header-info">
                <span class="chatbot-header-title">SDG 8 Advisor</span>
                <span class="chatbot-header-subtitle">Productivity Intelligence</span>
              </div>
            </div>
            <button class="chatbot-close" id="chatbot-close" aria-label="Close chat">✕</button>
          </div>

          <!-- Messages Area -->
          <div class="chatbot-messages" id="chatbot-messages">
            <!-- Welcome Message -->
            <div class="chat-message assistant">
              <div class="chat-bubble">
                <strong>Welcome to the SDG 8 Productivity Advisor</strong> 🏢
                <br><br>
                I analyze your time data against <strong>UN SDG Goal 8</strong> — Decent Work & Economic Growth targets.
                <br><br>
                Ask me anything about your productivity, work-life balance, or how you compare to global standards.
              </div>
            </div>
          </div>

          <!-- Suggested Questions -->
          <div class="chatbot-suggestions" id="chatbot-suggestions">
            ${suggestions.slice(0, 3).map(q => `
              <button class="chatbot-suggestion-chip" data-question="${q.replace(/"/g, '&quot;')}">${q}</button>
            `).join('')}
          </div>

          <!-- Input Area -->
          <div class="chatbot-input-area">
            <input type="text"
                   class="chatbot-input"
                   id="chatbot-input"
                   placeholder="Ask about your SDG 8 contribution..."
                   autocomplete="off" />
            <button class="chatbot-send" id="chatbot-send" aria-label="Send message">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  mount() {
    if (this._mounted) return;
    this._mounted = true;

    // Cache DOM refs
    this.containerEl = document.getElementById('sdg-chatbot');
    this.messagesEl = document.getElementById('chatbot-messages');
    this.inputEl = document.getElementById('chatbot-input');

    if (!this.containerEl) return;

    // Toggle button
    const toggleBtn = document.getElementById('chatbot-toggle');
    toggleBtn?.addEventListener('click', () => this.toggle());

    // Close button
    const closeBtn = document.getElementById('chatbot-close');
    closeBtn?.addEventListener('click', () => this.close());

    // Send button
    const sendBtn = document.getElementById('chatbot-send');
    sendBtn?.addEventListener('click', () => {
      if (this.inputEl) this.sendMessage(this.inputEl.value);
    });

    // Enter key
    this.inputEl?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage(this.inputEl.value);
      }
    });

    // Suggestion chips
    document.querySelectorAll('.chatbot-suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const q = chip.getAttribute('data-question');
        if (q) this.sendMessage(q);
      });
    });

    // Listen for data changes to update suggestions
    events.on(EVENTS.LOG_CREATED, () => this._updateSuggestions());
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.containerEl?.classList.toggle('open', this.isOpen);
    if (this.isOpen) {
      setTimeout(() => this.inputEl?.focus(), 300);
    }
  }

  open() {
    this.isOpen = true;
    this.containerEl?.classList.add('open');
    setTimeout(() => this.inputEl?.focus(), 300);
  }

  close() {
    this.isOpen = false;
    this.containerEl?.classList.remove('open');
  }

  destroy() {
    this._mounted = false;
    this.messages = [];
  }

  // === Private Rendering ===

  _renderMessages() {
    if (!this.messagesEl) return;

    // Keep the welcome message, replace everything after
    const welcome = this.messagesEl.querySelector('.chat-message.assistant');
    this.messagesEl.innerHTML = '';
    if (welcome) this.messagesEl.appendChild(welcome);

    this.messages.forEach(msg => {
      const div = document.createElement('div');
      div.className = `chat-message ${msg.role}`;
      div.innerHTML = `<div class="chat-bubble">${this._formatMarkdown(msg.content)}</div>`;
      this.messagesEl.appendChild(div);
    });
  }

  _renderTypingIndicator(show) {
    const existing = this.messagesEl?.querySelector('.chat-typing');
    if (existing) existing.remove();

    if (show && this.messagesEl) {
      const div = document.createElement('div');
      div.className = 'chat-message assistant chat-typing';
      div.innerHTML = `
        <div class="chat-bubble typing-bubble">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      `;
      this.messagesEl.appendChild(div);
      this._scrollToBottom();
    }
  }

  _scrollToBottom() {
    if (this.messagesEl) {
      requestAnimationFrame(() => {
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
      });
    }
  }

  _updateSuggestions() {
    const container = document.getElementById('chatbot-suggestions');
    if (!container) return;
    const questions = this.getSuggestedQuestions();
    container.innerHTML = questions.slice(0, 3).map(q => `
      <button class="chatbot-suggestion-chip" data-question="${q.replace(/"/g, '&quot;')}">${q}</button>
    `).join('');

    container.querySelectorAll('.chatbot-suggestion-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const q = chip.getAttribute('data-question');
        if (q) this.sendMessage(q);
      });
    });
  }

  _formatMarkdown(text) {
    // Simple markdown to HTML conversion
    return text
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Tables (simple)
      .replace(/\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)+)/g, (match, header, rows) => {
        const headerCells = header.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
        const bodyRows = rows.trim().split('\n').map(row => {
          const cells = row.split('|').filter(c => c.trim()).map(c => `<td>${c.trim()}</td>`).join('');
          return `<tr>${cells}</tr>`;
        }).join('');
        return `<table class="chat-table"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
      })
      // Headers
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      // Line breaks for bullet lists
      .replace(/^[•\-] (.+)$/gm, '<div class="chat-list-item">• $1</div>')
      // Regular newlines
      .replace(/\n/g, '<br>');
  }
}

// Singleton
export const sdgChatbot = new SDGChatbot();
