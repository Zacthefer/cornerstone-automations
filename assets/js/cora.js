/* ============================================================
   CORA.JS — AI Chat Widget powered by Claude via cornerstone-api
   ============================================================ */

// --- CONFIG ---
const CORA_API = 'https://cornerstone-api.onrender.com/chat';
// Local dev: const CORA_API = 'http://localhost:8000/chat';

const GOOGLE_SHEET_WEBHOOK = 'https://script.google.com/macros/s/AKfycbwQkmx4uiCcHftIJFlP_Bt67Uszxyj5DhLnNOArDoJZmXTlNLJRLzcRi4u4dREcjj2W/exec';

const BOOKING_EMAIL = 'isaacautomationgroup@isaacautomation.com';

const AGENT_OPENERS = {
  'lead-gen':    "I see you're interested in our Lead Generation system — smart move. Tell me about your business and I'll see if it's the right fit.",
  'voice-bot':   "Interested in the Voice Bot? Let me ask you a few things to see if it matches what you need.",
  'back-office': "Back office automation can be a game-changer. Let me learn a bit about your operation first."
};

const GENERIC_GREETING = "Hey! I'm CORA — Cornerstone's intake assistant. I help match businesses with the right automation system. Want to take a quick assessment to see what fits?";

// --- STATE ---
let coraMessages = [];   // {role, content}[]
let coraAgentCtx = null;
let coraOpen = false;
let coraAssessmentDone = false;
let coraCollectedAnswers = {};
let coraRetrying = false;

// --- WIDGET INJECTION ---
function initCORA() {
  const widget = document.getElementById('cora-widget');
  if (!widget) return;

  widget.innerHTML = `
    <style>
      /* Trigger button */
      #cora-trigger {
        position: fixed;
        bottom: 28px;
        right: 28px;
        z-index: 9999;
        width: 58px;
        height: 58px;
        border-radius: 50%;
        background: linear-gradient(135deg, #f0d080 0%, #c9a84c 40%, #8a6820 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 24px rgba(201,168,76,0.35);
        border: none;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      #cora-trigger:hover {
        transform: scale(1.08);
        box-shadow: 0 6px 32px rgba(201,168,76,0.5);
      }
      #cora-trigger::before {
        content: '';
        position: absolute;
        inset: -6px;
        border-radius: 50%;
        border: 1.5px solid rgba(201,168,76,0.4);
        animation: cora-pulse 2s ease-in-out infinite;
      }
      @keyframes cora-pulse {
        0%, 100% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.15); opacity: 0; }
      }
      #cora-trigger span {
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-size: 24px;
        font-weight: 700;
        color: #0a0a0a;
        line-height: 1;
        pointer-events: none;
      }

      /* Panel */
      #cora-panel {
        position: fixed;
        bottom: 100px;
        right: 28px;
        z-index: 9998;
        width: 380px;
        max-height: 580px;
        background: #111111;
        border: 1px solid rgba(201,168,76,0.25);
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 20px 60px rgba(0,0,0,0.7);
        opacity: 0;
        transform: translateY(16px) scale(0.97);
        pointer-events: none;
        transition: opacity 0.25s ease, transform 0.25s ease;
      }
      #cora-panel.open {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: all;
      }

      /* Mobile: full screen */
      @media (max-width: 640px) {
        #cora-panel {
          bottom: 0;
          right: 0;
          left: 0;
          width: 100%;
          max-height: 100dvh;
          border-radius: 0;
          border-left: none;
          border-right: none;
          border-bottom: none;
        }
        #cora-trigger {
          bottom: 20px;
          right: 20px;
        }
      }

      /* Header */
      #cora-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 20px;
        border-bottom: 1px solid rgba(201,168,76,0.15);
        flex-shrink: 0;
      }
      #cora-avatar {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: linear-gradient(135deg, #f0d080 0%, #8a6820 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-size: 18px;
        font-weight: 700;
        color: #0a0a0a;
        flex-shrink: 0;
      }
      #cora-header-info { flex: 1; }
      #cora-header-name {
        font-family: 'Cormorant Garamond', Georgia, serif;
        font-size: 17px;
        font-weight: 600;
        color: #e8e8e8;
        line-height: 1.2;
      }
      #cora-header-status {
        font-family: 'DM Sans', sans-serif;
        font-size: 11px;
        color: #888888;
        display: flex;
        align-items: center;
        gap: 5px;
      }
      #cora-header-status::before {
        content: '';
        display: inline-block;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #4ade80;
      }
      #cora-close {
        background: none;
        border: none;
        color: #888888;
        cursor: pointer;
        padding: 4px;
        line-height: 1;
        font-size: 20px;
        transition: color 0.15s;
      }
      #cora-close:hover { color: #e8e8e8; }

      /* Messages area */
      #cora-messages {
        flex: 1;
        overflow-y: auto;
        padding: 20px 16px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        scroll-behavior: smooth;
      }
      #cora-messages::-webkit-scrollbar { width: 4px; }
      #cora-messages::-webkit-scrollbar-track { background: transparent; }
      #cora-messages::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.2); border-radius: 2px; }

      /* Message bubbles */
      .cora-msg {
        display: flex;
        gap: 10px;
        align-items: flex-end;
        max-width: 88%;
        animation: cora-fade-in 0.2s ease;
      }
      @keyframes cora-fade-in {
        from { opacity: 0; transform: translateY(6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .cora-msg.bot { align-self: flex-start; }
      .cora-msg.user { align-self: flex-end; flex-direction: row-reverse; }
      .cora-msg-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: linear-gradient(135deg, #f0d080, #8a6820);
        flex-shrink: 0;
        margin-bottom: 4px;
      }
      .cora-msg-bubble {
        font-family: 'DM Sans', sans-serif;
        font-size: 13.5px;
        line-height: 1.55;
        padding: 10px 14px;
        border-radius: 4px;
        color: #e8e8e8;
      }
      .cora-msg.bot .cora-msg-bubble {
        background: #161616;
        border: 1px solid rgba(201,168,76,0.12);
      }
      .cora-msg.user .cora-msg-bubble {
        background: rgba(201,168,76,0.08);
        border: 1px solid rgba(201,168,76,0.25);
        color: #e8e8e8;
      }

      /* Typing indicator */
      #cora-typing {
        display: none;
        align-self: flex-start;
        gap: 10px;
        align-items: flex-end;
      }
      #cora-typing.visible { display: flex; }
      .cora-typing-dots {
        display: flex;
        gap: 4px;
        padding: 12px 16px;
        background: #161616;
        border: 1px solid rgba(201,168,76,0.12);
        border-radius: 4px;
      }
      .cora-typing-dots span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #c9a84c;
        animation: cora-dot 1.2s ease-in-out infinite;
      }
      .cora-typing-dots span:nth-child(2) { animation-delay: 0.2s; }
      .cora-typing-dots span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes cora-dot {
        0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
        40% { transform: scale(1); opacity: 1; }
      }

      /* Input area */
      #cora-input-area {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 14px 16px;
        border-top: 1px solid rgba(201,168,76,0.12);
        flex-shrink: 0;
      }
      #cora-input {
        flex: 1;
        background: #0a0a0a;
        border: 1px solid rgba(201,168,76,0.2);
        color: #e8e8e8;
        font-family: 'DM Sans', sans-serif;
        font-size: 13px;
        padding: 9px 13px;
        border-radius: 4px;
        outline: none;
        transition: border-color 0.2s;
        resize: none;
      }
      #cora-input:focus { border-color: rgba(201,168,76,0.5); }
      #cora-input.shake {
        animation: cora-shake 0.3s ease;
      }
      @keyframes cora-shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-6px); }
        75% { transform: translateX(6px); }
      }
      #cora-send {
        background: linear-gradient(135deg, #c9a84c, #8a6820);
        border: none;
        color: #0a0a0a;
        width: 36px;
        height: 36px;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: opacity 0.2s;
      }
      #cora-send:hover { opacity: 0.85; }

      /* CTA button inside chat */
      .cora-cta-btn {
        display: inline-block;
        font-family: 'DM Sans', sans-serif;
        font-size: 13px;
        color: #0a0a0a;
        background: linear-gradient(135deg, #f0d080, #c9a84c);
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        border: none;
        margin-top: 8px;
        text-decoration: none;
        transition: opacity 0.2s;
      }
      .cora-cta-btn:hover { opacity: 0.85; }

      /* Assessment start button */
      .cora-start-btn {
        display: inline-block;
        font-family: 'DM Sans', sans-serif;
        font-size: 13px;
        color: #c9a84c;
        background: transparent;
        border: 1px solid #c9a84c;
        padding: 9px 18px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 8px;
        transition: background 0.2s, color 0.2s;
      }
      .cora-start-btn:hover { background: #c9a84c; color: #0a0a0a; }
    </style>

    <!-- Trigger Button -->
    <button id="cora-trigger" aria-label="Open CORA chat">
      <span>C</span>
    </button>

    <!-- Chat Panel -->
    <div id="cora-panel" role="dialog" aria-label="CORA chat">

      <!-- Header -->
      <div id="cora-header">
        <div id="cora-avatar">C</div>
        <div id="cora-header-info">
          <div id="cora-header-name">CORA</div>
          <div id="cora-header-status">Online</div>
        </div>
        <button id="cora-close" aria-label="Close chat">&times;</button>
      </div>

      <!-- Messages -->
      <div id="cora-messages">
        <!-- Typing indicator lives here, managed by JS -->
        <div id="cora-typing">
          <div class="cora-msg-dot"></div>
          <div class="cora-typing-dots">
            <span></span><span></span><span></span>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div id="cora-input-area">
        <input
          id="cora-input"
          type="text"
          placeholder="Type a message..."
          autocomplete="off"
          maxlength="500"
        />
        <button id="cora-send" aria-label="Send">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 8l12-6-5 6 5 6-12-6z" fill="#0a0a0a"/>
          </svg>
        </button>
      </div>

    </div>
  `;

  // Attach event listeners
  document.getElementById('cora-trigger').addEventListener('click', () => openCORA(null));
  document.getElementById('cora-close').addEventListener('click', closeCORA);

  const input = document.getElementById('cora-input');
  const sendBtn = document.getElementById('cora-send');

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitUserInput();
    }
  });
  sendBtn.addEventListener('click', submitUserInput);

  // Check URL for ?agent= param
  const urlParams = new URLSearchParams(window.location.search);
  const agentParam = urlParams.get('agent');
  if (agentParam) {
    openCORA(agentParam);
  }

  // Restore session if available
  restoreSession();
}

// --- OPEN / CLOSE ---
function openCORA(agentContext) {
  const panel = document.getElementById('cora-panel');
  if (!panel) return;

  coraOpen = true;
  coraAgentCtx = agentContext || coraAgentCtx;
  panel.classList.add('open');

  // If first open with no messages, send opening message
  if (coraMessages.length === 0) {
    if (coraAgentCtx && AGENT_OPENERS[coraAgentCtx]) {
      // Bot speaks first with agent-specific opener
      setTimeout(() => addBotMessage(AGENT_OPENERS[coraAgentCtx]), 300);
      coraMessages.push({ role: 'assistant', content: AGENT_OPENERS[coraAgentCtx] });
    } else {
      // Generic greeting + start assessment button
      setTimeout(() => {
        addBotMessage(GENERIC_GREETING, true);
        coraMessages.push({ role: 'assistant', content: GENERIC_GREETING });
      }, 300);
    }
  }
}

function closeCORA() {
  const panel = document.getElementById('cora-panel');
  if (!panel) return;
  coraOpen = false;
  panel.classList.remove('open');
  saveSession();
}

// --- MESSAGE RENDERING ---
function addBotMessage(text, showStartBtn = false) {
  const messages = document.getElementById('cora-messages');
  const typing = document.getElementById('cora-typing');
  if (!messages) return;

  const wrap = document.createElement('div');
  wrap.className = 'cora-msg bot';
  wrap.innerHTML = `
    <div class="cora-msg-dot"></div>
    <div>
      <div class="cora-msg-bubble">${escapeHtml(text)}</div>
      ${showStartBtn ? '<button class="cora-start-btn" onclick="startAssessment()">Start Assessment &rarr;</button>' : ''}
    </div>
  `;
  messages.insertBefore(wrap, typing);
  scrollToBottom();
}

function addUserMessage(text) {
  const messages = document.getElementById('cora-messages');
  const typing = document.getElementById('cora-typing');
  if (!messages) return;

  const wrap = document.createElement('div');
  wrap.className = 'cora-msg user';
  wrap.innerHTML = `<div class="cora-msg-bubble">${escapeHtml(text)}</div>`;
  messages.insertBefore(wrap, typing);
  scrollToBottom();
}

function showTyping() {
  const t = document.getElementById('cora-typing');
  if (t) t.classList.add('visible');
  scrollToBottom();
}

function hideTyping() {
  const t = document.getElementById('cora-typing');
  if (t) t.classList.remove('visible');
}

function scrollToBottom() {
  const messages = document.getElementById('cora-messages');
  if (messages) messages.scrollTop = messages.scrollHeight;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

// --- ASSESSMENT START ---
function startAssessment() {
  // Remove start button if present
  document.querySelectorAll('.cora-start-btn').forEach(b => b.remove());
  handleUserInput("Let's do it.");
}

// --- SEND USER MESSAGE ---
function submitUserInput() {
  const input = document.getElementById('cora-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) {
    input.classList.add('shake');
    setTimeout(() => input.classList.remove('shake'), 300);
    return;
  }
  input.value = '';
  handleUserInput(text);
}

// --- MAIN CONVERSATION HANDLER ---
async function handleUserInput(text) {
  if (coraAssessmentDone) return;

  addUserMessage(text);
  coraMessages.push({ role: 'user', content: text });

  showTyping();

  // Disable input while waiting
  const input = document.getElementById('cora-input');
  const sendBtn = document.getElementById('cora-send');
  if (input) input.disabled = true;
  if (sendBtn) sendBtn.disabled = true;

  try {
    const payload = {
      messages: coraMessages.slice(-20),
      agent_context: coraAgentCtx,
      assessment_data: coraCollectedAnswers
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let response;
    try {
      response = await fetch(CORA_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeout);
    } catch (fetchErr) {
      clearTimeout(timeout);
      if (fetchErr.name === 'AbortError' && !coraRetrying) {
        // Timeout — retry once
        coraRetrying = true;
        hideTyping();
        addBotMessage("CORA is warming up — hang tight for a moment.");
        showTyping();
        response = await fetch(CORA_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        coraRetrying = false;
      } else {
        throw fetchErr;
      }
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.detail || `HTTP ${response.status}`);
    }

    const data = await response.json();
    hideTyping();

    const botText = data.response || "I didn't catch that — could you say more?";
    addBotMessage(botText);
    coraMessages.push({ role: 'assistant', content: botText });

    if (data.assessment_complete && !coraAssessmentDone) {
      coraAssessmentDone = true;
      coraCollectedAnswers = data.collected_answers || {};
      setTimeout(() => showCompletionCTA(), 800);
      submitToSheet(coraCollectedAnswers);
    }

    saveSession();

  } catch (err) {
    hideTyping();
    addBotMessage("I'm having a moment. You can also reach us at isaacautomationgroup@isaacautomation.com");
    console.error('CORA fetch error:', err);
  } finally {
    if (input) input.disabled = false;
    if (sendBtn) sendBtn.disabled = false;
    if (input) input.focus();
  }
}

// --- COMPLETION CTA ---
function showCompletionCTA() {
  const messages = document.getElementById('cora-messages');
  const typing = document.getElementById('cora-typing');
  if (!messages) return;

  const wrap = document.createElement('div');
  wrap.className = 'cora-msg bot';

  const bookBtn = `<a href="mailto:${BOOKING_EMAIL}" class="cora-cta-btn">Book a Call with Isaac &rarr;</a>`;

  wrap.innerHTML = `
    <div class="cora-msg-dot"></div>
    <div>
      <div class="cora-msg-bubble">Based on everything you've shared, I think we can build something powerful for your business. Ready to talk to Isaac?</div>
      ${bookBtn}
    </div>
  `;
  messages.insertBefore(wrap, typing);
  scrollToBottom();

  // Disable input after assessment complete
  const input = document.getElementById('cora-input');
  const sendBtn = document.getElementById('cora-send');
  const inputArea = document.getElementById('cora-input-area');
  if (input) input.placeholder = 'Assessment complete — book a call above!';
  if (input) input.disabled = true;
  if (sendBtn) sendBtn.disabled = true;
}

// --- SHEET SUBMISSION ---
async function submitToSheet(answers) {
  if (!GOOGLE_SHEET_WEBHOOK) return;
  try {
    await fetch(GOOGLE_SHEET_WEBHOOK, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        entry_source: 'cornerstone-automations-website',
        agent_context: coraAgentCtx || 'generic',
        ...answers
      })
    });
  } catch (err) {
    console.error('Sheet submission failed:', err);
  }
}

// --- SESSION PERSISTENCE ---
function saveSession() {
  try {
    sessionStorage.setItem('cora_messages', JSON.stringify(coraMessages));
    sessionStorage.setItem('cora_agent', coraAgentCtx || '');
    sessionStorage.setItem('cora_done', coraAssessmentDone ? '1' : '0');
    sessionStorage.setItem('cora_answers', JSON.stringify(coraCollectedAnswers));
  } catch (e) { /* storage unavailable */ }
}

function restoreSession() {
  try {
    const saved = sessionStorage.getItem('cora_messages');
    if (!saved) return;
    const msgs = JSON.parse(saved);
    if (!msgs || msgs.length === 0) return;

    coraMessages = msgs;
    coraAgentCtx = sessionStorage.getItem('cora_agent') || null;
    coraAssessmentDone = sessionStorage.getItem('cora_done') === '1';
    coraCollectedAnswers = JSON.parse(sessionStorage.getItem('cora_answers') || '{}');

    // Replay messages into DOM
    msgs.forEach(m => {
      if (m.role === 'user') addUserMessage(m.content);
      else addBotMessage(m.content);
    });

    if (coraAssessmentDone) {
      showCompletionCTA();
    }
  } catch (e) { /* corrupt storage — start fresh */ }
}

// --- INIT ---
document.addEventListener('DOMContentLoaded', () => {
  initCORA();
});
