/* ======================
   Velocity Landing — App Logic
   ====================== */

// ---- Auth Modal ----
let authMode = 'login'; // 'login' | 'signup'

function openModal(mode) {
    authMode = mode;
    const modal = document.getElementById('auth-modal');
    const title = document.getElementById('modal-title');
    const desc = document.getElementById('modal-desc');
    const nameField = document.getElementById('name-field');
    const submit = document.getElementById('auth-submit');
    const switchText = document.getElementById('modal-switch');
    const trialInfo = document.getElementById('trial-info');
    const pwInput = document.getElementById('auth-password');

    if (mode === 'signup') {
        title.textContent = 'Start Your Free Trial';
        desc.textContent = '3 days free · 3 blueprints · 500 tokens';
        nameField.classList.remove('hidden');
        submit.textContent = 'Create Account';
        switchText.innerHTML = 'Already have an account? <button onclick="toggleAuthMode()" id="switch-mode-btn">Log in</button>';
        trialInfo.classList.remove('hidden');
        pwInput.setAttribute('autocomplete', 'new-password');
    } else {
        title.textContent = 'Welcome Back';
        desc.textContent = 'Log in to access your dashboard';
        nameField.classList.add('hidden');
        submit.textContent = 'Log In';
        switchText.innerHTML = 'Don\'t have an account? <button onclick="toggleAuthMode()" id="switch-mode-btn">Sign up free</button>';
        trialInfo.classList.add('hidden');
        pwInput.setAttribute('autocomplete', 'current-password');
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => document.getElementById('auth-email').focus(), 300);
}

function closeModal(e) {
    if (e && e.target !== e.currentTarget) return;
    const modal = document.getElementById('auth-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function toggleAuthMode() {
    openModal(authMode === 'login' ? 'signup' : 'login');
}

function handleAuth(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const name = document.getElementById('auth-name').value;

    if (authMode === 'signup') {
        // Simulate signup with token allocation
        const account = {
            name, email,
            plan: 'starter',
            tokensRemaining: 500,
            blueprintsAvailable: ['SaaS Landing', 'Portfolio', 'Blog'],
            trialEnds: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            features: {
                swarm: false,
                cicd: false,
                customDomains: false,
                allBlueprints: false
            }
        };
        localStorage.setItem('velocity_user', JSON.stringify(account));
        closeModal();
        showNotification(`Welcome, ${name}! Your 3-day trial is active. You have 500 tokens and 3 blueprints ready.`, 'success');
    } else {
        // Simulate login
        const stored = localStorage.getItem('velocity_user');
        if (stored) {
            const user = JSON.parse(stored);
            closeModal();
            showNotification(`Welcome back, ${user.name}! ${user.tokensRemaining} tokens remaining.`, 'success');
        } else {
            closeModal();
            showNotification('Logged in successfully! Redirecting to dashboard...', 'success');
        }
    }
}

// ---- Chat Widget ----
let chatOpen = false;

function openChat() {
    chatOpen = true;
    document.getElementById('chat-panel').classList.add('active');
    document.getElementById('chat-fab').style.display = 'none';
    setTimeout(() => document.getElementById('chat-input').focus(), 300);
}

function closeChat() {
    chatOpen = false;
    document.getElementById('chat-panel').classList.remove('active');
    document.getElementById('chat-fab').style.display = 'flex';
}

function sendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;
    addMessage(msg, 'user');
    input.value = '';

    // Hide suggestions after first message
    document.getElementById('chat-suggestions').style.display = 'none';

    // Simulate AI response
    setTimeout(() => {
        const response = getAIResponse(msg);
        addMessage(response, 'bot');
    }, 800 + Math.random() * 700);
}

function sendSuggestion(text) {
    addMessage(text, 'user');
    document.getElementById('chat-suggestions').style.display = 'none';
    setTimeout(() => {
        const response = getAIResponse(text);
        addMessage(response, 'bot');
    }, 800 + Math.random() * 700);
}

function addMessage(text, type) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `chat-msg ${type}`;

    if (type === 'bot') {
        div.innerHTML = `<div class="msg-avatar">V</div><div class="msg-bubble">${text}</div>`;
    } else {
        div.innerHTML = `<div class="msg-bubble">${text}</div>`;
    }

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function getAIResponse(msg) {
    const lower = msg.toLowerCase();

    if (lower.includes('saas') || lower.includes('landing')) {
        return '🏗️ Great choice! The <strong>SaaS Landing</strong> blueprint is one of our 3 free starter templates. It includes a hero section, feature grid, pricing table, and CTA — all responsive and ready to customize. Want me to start building it?';
    }
    if (lower.includes('e-commerce') || lower.includes('shop') || lower.includes('store')) {
        return '🛒 For e-commerce, I\'d recommend the <strong>Storefront Pro</strong> blueprint. It has product grids, cart UI, and checkout flow. This one requires the <strong>Pro plan</strong> for full access, but you can preview it now! Want to see a demo?';
    }
    if (lower.includes('free') || lower.includes('blueprint') || lower.includes('trial')) {
        return '🎁 Your free trial includes 3 blueprints:<br><br>• <strong>SaaS Landing</strong> — Modern startup page<br>• <strong>Portfolio</strong> — Creative showcase<br>• <strong>Blog</strong> — Content-focused layout<br><br>Plus 500 tokens — enough for a complete first build! Want to start with one?';
    }
    if (lower.includes('token') || lower.includes('cost') || lower.includes('price')) {
        return '🪙 You start with <strong>500 free tokens</strong> — that\'s enough to generate a complete site. A typical build uses 200-400 tokens depending on complexity. The Pro plan ($29/mo) gives you <strong>unlimited tokens</strong> plus Swarm Intelligence and all 20+ blueprints.';
    }
    if (lower.includes('swarm') || lower.includes('agent')) {
        return '🐝 Swarm Intelligence uses 3 specialized AI agents working together:<br><br>• <strong>Architect</strong> — Plans structure & routing<br>• <strong>Builder</strong> — Generates code & UI<br>• <strong>Guardian</strong> — Validates & tests<br><br>This is a Pro feature. Start your free trial and upgrade when ready!';
    }
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        return 'Hey there! 👋 I\'m your Velocity AI assistant. I can help you pick a blueprint, plan your site, or answer questions about the platform. What are you looking to build?';
    }
    if (lower.includes('portfolio')) {
        return '🎨 The <strong>Portfolio</strong> blueprint is free with your trial! It features a hero with image gallery, project showcase cards, about section, and contact form. Clean, modern, and works beautifully on mobile. Shall I set it up?';
    }

    return `I'd love to help with that! Here's what I can do for you:<br><br>• Generate a complete site from any of our 20+ blueprints<br>• Help you customize layouts, colors, and content<br>• Set up deployment pipelines<br><br>What kind of site are you building? Tell me more about your project and I'll recommend the best approach.`;
}

// ---- Notifications ----
function showNotification(message, type) {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = `notification notification-${type}`;
    div.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" aria-label="Close notification">&times;</button>
  `;

    // Inject styles if not present
    if (!document.getElementById('notif-styles')) {
        const style = document.createElement('style');
        style.id = 'notif-styles';
        style.textContent = `
      .notification {
        position: fixed; top: 80px; left: 50%; transform: translateX(-50%); z-index: 2000;
        display: flex; align-items: center; gap: 12px;
        padding: 14px 20px; border-radius: 12px; max-width: 500px;
        font-size: 14px; font-weight: 500; box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        animation: notifIn 0.4s ease;
      }
      .notification-success { background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; }
      .notification button {
        background: none; border: none; font-size: 18px; cursor: pointer;
        color: inherit; opacity: 0.6; padding: 0 4px;
      }
      .notification button:hover { opacity: 1; }
      @keyframes notifIn { from { transform: translateX(-50%) translateY(-10px); opacity:0; } to { transform: translateX(-50%) translateY(0); opacity:1; } }
    `;
        document.head.appendChild(style);
    }

    document.body.appendChild(div);
    setTimeout(() => div.remove(), 6000);
}

// ---- Scroll Animations ----
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.08 });

document.querySelectorAll('.feature-card, .pricing-card, .arch-card').forEach(el => {
    el.classList.add('fade-in');
    observer.observe(el);
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(a.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
        closeChat();
    }
});
