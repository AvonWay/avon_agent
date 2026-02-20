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
        const account = {
            name, email,
            plan: 'starter',
            tokensRemaining: 500,
            blueprintsAvailable: ['SaaS Landing', 'Portfolio', 'Blog'],
            trialEnds: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            features: { swarm: false, cicd: false, customDomains: false, allBlueprints: false }
        };
        localStorage.setItem('velocity_user', JSON.stringify(account));
        closeModal();
        showNotification(`Welcome, ${name}! Your 3-day trial is active. You have 500 tokens and 3 blueprints ready.`, 'success');
    } else {
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
    document.getElementById('chat-suggestions').style.display = 'none';
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

// ---- AI Responses — Action-first, no follow-up questions ----
function getAIResponse(msg) {
    const lower = msg.toLowerCase();

    // Build requests — start building immediately
    if (lower.includes('saas') || lower.includes('landing') || lower.includes('startup')) {
        triggerBuild('SaaS Landing', 280);
        return '\u26a1 <strong>Building your SaaS Landing Page now.</strong><br><br>Blueprint: SaaS Landing (Free)<br>Tokens: ~280 of 500 used<br><br>Generating hero, feature grid, pricing table, testimonials, and CTA...';
    }
    if (lower.includes('e-commerce') || lower.includes('shop') || lower.includes('store') || lower.includes('product')) {
        triggerBuild('Storefront Pro', 350);
        return '\u26a1 <strong>Building your E-Commerce Storefront now.</strong><br><br>Blueprint: Storefront Pro<br>Tokens: ~350 of 500 used<br><br>Generating product grid, cart UI, checkout flow, and category pages...';
    }
    if (lower.includes('portfolio') || lower.includes('creative') || lower.includes('showcase')) {
        triggerBuild('Portfolio', 220);
        return '\u26a1 <strong>Building your Portfolio site now.</strong><br><br>Blueprint: Portfolio (Free)<br>Tokens: ~220 of 500 used<br><br>Generating hero, project gallery, about section, skills grid, and contact form...';
    }
    if (lower.includes('blog') || lower.includes('article') || lower.includes('content') || lower.includes('write')) {
        triggerBuild('Blog', 200);
        return '\u26a1 <strong>Building your Blog now.</strong><br><br>Blueprint: Blog (Free)<br>Tokens: ~200 of 500 used<br><br>Generating article layout, sidebar, categories, featured posts, and newsletter signup...';
    }
    if (lower.includes('dashboard') || lower.includes('admin') || lower.includes('panel')) {
        triggerBuild('Admin Dashboard', 400);
        return '\u26a1 <strong>Building your Dashboard now.</strong><br><br>Blueprint: Admin Dashboard<br>Tokens: ~400 of 500 used<br><br>Generating stats grid, data tables, charts, sidebar nav, and settings panel...';
    }
    if (lower.includes('restaurant') || lower.includes('food') || lower.includes('menu') || lower.includes('cafe')) {
        triggerBuild('Restaurant', 300);
        return '\u26a1 <strong>Building your Restaurant site now.</strong><br><br>Blueprint: Restaurant<br>Tokens: ~300 of 500 used<br><br>Generating menu display, reservation form, gallery, and location map...';
    }

    // Info queries — answer directly, no follow-up questions
    if (lower.includes('free') || lower.includes('blueprint') || lower.includes('trial')) {
        return '\ud83c\udf81 Your free trial includes 3 blueprints:<br><br>\u2022 <strong>SaaS Landing</strong><br>\u2022 <strong>Portfolio</strong><br>\u2022 <strong>Blog</strong><br><br>500 tokens included. Just tell me what to build and I start immediately.';
    }
    if (lower.includes('token') || lower.includes('cost') || lower.includes('price')) {
        return '\ud83e\ude99 You get <strong>500 free tokens</strong>. A build uses 200\u2013400 tokens. Pro ($29/mo) = unlimited tokens + Swarm + all 20+ blueprints.';
    }
    if (lower.includes('swarm') || lower.includes('agent')) {
        return '\ud83d\udc1d Swarm Intelligence runs 3 agents in parallel:<br><br>\u2022 <strong>Architect</strong> \u2014 Plans structure<br>\u2022 <strong>Builder</strong> \u2014 Generates code<br>\u2022 <strong>Guardian</strong> \u2014 Validates output<br><br>Available on Pro plan. Builds run 3x faster.';
    }
    if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
        return 'Hey! \ud83d\udc4b Tell me what to build and I\'ll start generating it right now. Example: "Build me a SaaS landing page"';
    }

    // Default: treat ANY prompt as a build request
    triggerBuild('Custom Site', 320);
    return `\u26a1 <strong>Starting your build now.</strong><br><br>Generating a custom site based on: "<em>${msg}</em>"<br>Tokens: ~320 of 500 used<br><br>Scaffolding layout, creating components, applying styles...`;
}

function triggerBuild(blueprintName, tokensUsed) {
    setTimeout(() => {
        addMessage(
            `\ud83d\udd28 <strong>Build Progress \u2014 ${blueprintName}</strong><br><br>` +
            '<div class="build-progress">' +
            '\u2705 Layout scaffolded<br>' +
            '\u2705 Components generated<br>' +
            '\u2705 Styles applied<br>' +
            '\u2705 Responsive breakpoints set<br>' +
            '\u2705 SEO meta tags added<br>' +
            '\u23f3 Final optimization...' +
            '</div>', 'bot');
    }, 3000);

    setTimeout(() => {
        addMessage(
            `\ud83d\ude80 <strong>Build complete!</strong> Your ${blueprintName} site is ready.<br><br>` +
            '<div class="build-result">' +
            '\ud83d\udcc1 Files: 4 generated<br>' +
            '\ud83c\udfa8 Styles: Tailwind CSS applied<br>' +
            '\ud83d\udcf1 Mobile: Fully responsive<br>' +
            '\u26a1 Performance: 98/100<br><br>' +
            `Tokens remaining: ${500 - tokensUsed} of 500<br><br>` +
            '<strong>\u2192 <a href="#" onclick="openModal(\'signup\')" class="build-deploy-link">Sign up to deploy live</a></strong>' +
            '</div>', 'bot');
    }, 6000);
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
      .build-progress {
        background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;
        padding: 12px; font-size: 12px; margin-top: 4px; line-height: 1.8;
      }
      .build-result {
        background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px;
        padding: 12px; font-size: 12px; margin-top: 4px; line-height: 1.8;
      }
      .build-deploy-link { color: #6366f1; text-decoration: none; }
      .build-deploy-link:hover { text-decoration: underline; }
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
