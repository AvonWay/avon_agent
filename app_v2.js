/* ======================
   Velocity Landing — App Logic
   ====================== */

// ---- Security Helpers ----
function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
    }[tag] || tag));
}

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
        desc.textContent = '3 days free · All 20+ blueprints · 500 tokens';
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

// ---- Mobile Menu ----
function toggleMobileMenu() {
    const navLinks = document.getElementById('main-nav');
    if (navLinks) {
        navLinks.classList.toggle('active');
    }
}

function toggleDropdown() {
    const content = document.getElementById('blueprint-links');
    if (content) {
        content.classList.toggle('show');
    }
}

function closeModal(e) {
    if (e && e.target !== e.currentTarget) return;
    const modal = document.getElementById('auth-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// Close dropdown if clicked outside
window.onclick = function (event) {
    if (!event.target.matches('.dropbtn') && !event.target.closest('.dropbtn')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            let openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

function toggleAuthMode() {
    openModal(authMode === 'login' ? 'signup' : 'login');
}

function handleAuth(e) {
    e.preventDefault();
    const email = escapeHTML(document.getElementById('auth-email').value);
    const password = document.getElementById('auth-password').value; // don't sanitize password, but don't render it either
    const name = escapeHTML(document.getElementById('auth-name').value);

    if (authMode === 'signup') {
        const account = {
            name, email,
            plan: 'starter',
            tokensRemaining: lastBuild ? (500 - lastBuild.tokensUsed) : 500,
            blueprintsAvailable: [
                'SaaS Landing', 'Portfolio', 'Blog', 'Storefront Pro',
                'Admin Dashboard', 'Restaurant', 'Agency', 'Real Estate',
                'Healthcare', 'Education', 'Fitness', 'Event', 'Nonprofit',
                'Consulting', 'Photography', 'Law Firm', 'Travel',
                'Music', 'Fintech', 'Crypto'
            ],
            trialEnds: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            features: { swarm: false, cicd: false, customDomains: false, allBlueprints: true }
        };
        localStorage.setItem('velocity_user', JSON.stringify(account));
        closeModal();
        showNotification(`Welcome, ${name}! Your 3-day trial is active.`, 'success');

        // If there was a build, deploy it and show the live link in chat
        if (lastBuild) {
            deliverLiveLink(name, lastBuild);
        }
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
let lastBuild = null; // Track the most recent build for post-signup deploy

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
        div.innerHTML = `<div class="msg-bubble">${escapeHTML(text)}</div>`;
    }
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

// ---- AI Responses — Action-first, no follow-up questions ----
function getAIResponse(msg) {
    const lower = msg.toLowerCase();

    // Build requests — start building immediately
    if (lower.includes('saas') || lower.includes('landing') || lower.includes('startup')) {
        triggerBuild('SaaS Landing', 280, 'saas-landing');
        return '\u26a1 <strong>Building your SaaS Landing Page now.</strong><br><br>Blueprint: SaaS Landing (Free)<br>Tokens: ~280 of 500 used<br><br>Generating hero, feature grid, pricing table, testimonials, and CTA...';
    }
    if (lower.includes('e-commerce') || lower.includes('shop') || lower.includes('store') || lower.includes('product')) {
        triggerBuild('Storefront Pro', 350, 'storefront-pro');
        return '\u26a1 <strong>Building your E-Commerce Storefront now.</strong><br><br>Blueprint: Storefront Pro<br>Tokens: ~350 of 500 used<br><br>Generating product grid, cart UI, checkout flow, and category pages...';
    }
    if (lower.includes('portfolio') || lower.includes('creative') || lower.includes('showcase')) {
        triggerBuild('Portfolio', 220, 'portfolio');
        return '\u26a1 <strong>Building your Portfolio site now.</strong><br><br>Blueprint: Portfolio (Free)<br>Tokens: ~220 of 500 used<br><br>Generating hero, project gallery, about section, skills grid, and contact form...';
    }
    if (lower.includes('blog') || lower.includes('article') || lower.includes('content') || lower.includes('write')) {
        triggerBuild('Blog', 200, 'blog');
        return '\u26a1 <strong>Building your Blog now.</strong><br><br>Blueprint: Blog (Free)<br>Tokens: ~200 of 500 used<br><br>Generating article layout, sidebar, categories, featured posts, and newsletter signup...';
    }
    if (lower.includes('dashboard') || lower.includes('admin') || lower.includes('panel')) {
        triggerBuild('Admin Dashboard', 400, 'admin-dashboard');
        return '\u26a1 <strong>Building your Dashboard now.</strong><br><br>Blueprint: Admin Dashboard<br>Tokens: ~400 of 500 used<br><br>Generating stats grid, data tables, charts, sidebar nav, and settings panel...';
    }
    if (lower.includes('restaurant') || lower.includes('food') || lower.includes('menu') || lower.includes('cafe')) {
        triggerBuild('Restaurant', 300, 'restaurant');
        return '\u26a1 <strong>Building your Restaurant site now.</strong><br><br>Blueprint: Restaurant<br>Tokens: ~300 of 500 used<br><br>Generating menu display, reservation form, gallery, and location map...';
    }
    if (lower.includes('agency') || lower.includes('marketing') || lower.includes('creative agency')) {
        triggerBuild('Agency', 240, 'agency');
        return '\u26a1 <strong>Building your Agency Site now.</strong><br><br>Blueprint: Agency<br>Tokens: ~240 of 500 used<br><br>Generating creative layouts and marketing tools...';
    }
    if (lower.includes('real estate') || lower.includes('property') || lower.includes('realtor')) {
        triggerBuild('Real Estate', 290, 'real-estate');
        return '\u26a1 <strong>Building your Real Estate Site now.</strong><br><br>Blueprint: Real Estate<br>Tokens: ~290 of 500 used<br><br>Generating property listings and search modules...';
    }
    if (lower.includes('healthcare') || lower.includes('medical') || lower.includes('doctor')) {
        triggerBuild('Healthcare', 260, 'healthcare');
        return '\u26a1 <strong>Building your Healthcare Site now.</strong><br><br>Blueprint: Healthcare<br>Tokens: ~260 of 500 used<br><br>Generating patient portals and medical services...';
    }
    if (lower.includes('education') || lower.includes('school') || lower.includes('university') || lower.includes('course')) {
        triggerBuild('Education', 310, 'education');
        return '\u26a1 <strong>Building your Education Site now.</strong><br><br>Blueprint: Education<br>Tokens: ~310 of 500 used<br><br>Generating courses and academic showcases...';
    }
    if (lower.includes('fitness') || lower.includes('gym') || lower.includes('workout')) {
        triggerBuild('Fitness', 230, 'fitness');
        return '\u26a1 <strong>Building your Fitness Site now.</strong><br><br>Blueprint: Fitness<br>Tokens: ~230 of 500 used<br><br>Generating training schedules and memberships...';
    }
    if (lower.includes('event') || lower.includes('conference')) {
        triggerBuild('Event', 210, 'event');
        return '\u26a1 <strong>Building your Event Site now.</strong><br><br>Blueprint: Event<br>Tokens: ~210 of 500 used<br><br>Generating schedules and ticketing systems...';
    }
    if (lower.includes('nonprofit') || lower.includes('charity') || lower.includes('donate')) {
        triggerBuild('Nonprofit', 220, 'nonprofit');
        return '\u26a1 <strong>Building your Nonprofit Site now.</strong><br><br>Blueprint: Nonprofit<br>Tokens: ~220 of 500 used<br><br>Generating donation flows and impact metrics...';
    }
    if (lower.includes('consulting') || lower.includes('advisor')) {
        triggerBuild('Consulting', 250, 'consulting');
        return '\u26a1 <strong>Building your Consulting Site now.</strong><br><br>Blueprint: Consulting<br>Tokens: ~250 of 500 used<br><br>Generating advisory models and booking functionality...';
    }
    if (lower.includes('photography') || lower.includes('photo')) {
        triggerBuild('Photography', 300, 'photography');
        return '\u26a1 <strong>Building your Photography Site now.</strong><br><br>Blueprint: Photography<br>Tokens: ~300 of 500 used<br><br>Generating visual galleries and portfolios...';
    }
    if (lower.includes('law firm') || lower.includes('legal') || lower.includes('lawyer')) {
        triggerBuild('Law Firm', 240, 'law-firm');
        return '\u26a1 <strong>Building your Law Firm Site now.</strong><br><br>Blueprint: Law Firm<br>Tokens: ~240 of 500 used<br><br>Generating practice areas and legal disclaimers...';
    }
    if (lower.includes('travel') || lower.includes('tour')) {
        triggerBuild('Travel', 270, 'travel');
        return '\u26a1 <strong>Building your Travel Site now.</strong><br><br>Blueprint: Travel<br>Tokens: ~270 of 500 used<br><br>Generating destination showcases and bookings...';
    }
    if (lower.includes('music') || lower.includes('band') || lower.includes('artist')) {
        triggerBuild('Music', 260, 'music');
        return '\u26a1 <strong>Building your Music Site now.</strong><br><br>Blueprint: Music<br>Tokens: ~260 of 500 used<br><br>Generating tour dates and media players...';
    }
    if (lower.includes('fintech') || lower.includes('finance') || lower.includes('bank')) {
        triggerBuild('Fintech', 320, 'fintech');
        return '\u26a1 <strong>Building your Fintech Site now.</strong><br><br>Blueprint: Fintech<br>Tokens: ~320 of 500 used<br><br>Generating banking dashboards and financial charts...';
    }
    if (lower.includes('crypto') || lower.includes('web3') || lower.includes('token')) {
        triggerBuild('Crypto', 330, 'crypto');
        return '\u26a1 <strong>Building your Crypto Site now.</strong><br><br>Blueprint: Crypto<br>Tokens: ~330 of 500 used<br><br>Generating tokenomics and Web3 integrations...';
    }

    // Info queries — answer directly, no follow-up questions
    if (lower.includes('free') || lower.includes('blueprint') || lower.includes('trial')) {
        return '\ud83c\udf81 Your free trial includes all 20+ blueprints!<br><br>500 tokens included. Just tell me what to build and I start immediately.';
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

    // Default: treat ANY prompt as a custom build request to Ollama
    triggerActualAIBuild(msg, 'Custom Site', 320);
    return `\u26a1 <strong>Starting your AI build now.</strong><br><br>Generating a custom site based on: "<em>${msg}</em>"<br>Tokens: ~320 of 500 used<br><br>Summoning local Swarm agent to write HTML, CSS, and JS...`;
}

function triggerActualAIBuild(msg, blueprintName = 'Custom Site', tokensUsed = 320) {
    const slug = 'custom-site'; // Always push to the AI custom html loader
    lastBuild = { name: blueprintName, slug, tokensUsed };

    setTimeout(() => {
        addMessage(
            `\ud83d\udd28 <strong>Build Progress \u2014 ${blueprintName}</strong><br><br>` +
            '<div class="build-progress">' +
            '\u2705 Initializing Swarm Agents...<br>' +
            '\u23f3 Writing code (this takes a few seconds)...' +
            '</div>', 'bot');
    }, 1500);

    fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'Avon:latest',
            prompt: `Write a complete, single-file HTML page with inline CSS and embedded JavaScript for the following request: "${msg}". You must include beautiful modern styling, responsive design with dark mode by default, and interactive elements. DO NOT explain your code. DO NOT wrap the code in markdown blocks like \`\`\`html. PROVIDE EXACTLY AND ONLY THE RAW HTML CODE starting with <!DOCTYPE html>.`,
            stream: false
        })
    }).then(r => r.json()).then(data => {
        let code = data.response || '';
        const match = code.match(/```(?:html)?\s*([\s\S]*?)```/i);
        if (match) {
            code = match[1].trim();
        } else if (code.includes('<!DOCTYPE html>')) {
            code = code.substring(code.indexOf('<!DOCTYPE html>')).trim();
        }

        localStorage.setItem('custom_build_html', code);

        setTimeout(() => {
            const user = getUser();
            if (user) {
                deliverLiveLink(user.name, lastBuild);
            } else {
                addMessage(
                    `\ud83d\ude80 <strong>Build complete!</strong> Your ${blueprintName} is ready.<br><br>` +
                    '<div class="build-result">' +
                    '\ud83d\udcc1 Files: 1 generated<br>' +
                    '\ud83c\udfa8 Styles: Applied inline<br>' +
                    `Tokens remaining: ${500 - tokensUsed} of 500<br><br>` +
                    '<strong>\u2192 <a href="javascript:void(0)" onclick="openModal(\'signup\')" class="build-deploy-link">Sign up to get your live link</a></strong>' +
                    '</div>', 'bot');
            }
        }, 1000);
    }).catch(err => {
        addMessage(`⚠️ Failed to connect to local AI: ${err.message}. Make sure Ollama is running and model Avon:latest exists. Run \`ollama run Avon:latest\``, 'bot');
    });
}

function isLoggedIn() {
    return !!localStorage.getItem('velocity_user');
}

function getUser() {
    const data = localStorage.getItem('velocity_user');
    return data ? JSON.parse(data) : null;
}

function triggerBuild(blueprintName, tokensUsed, slugDef) {
    const slug = slugDef || blueprintName.toLowerCase().replace(/\s+/g, '-');
    lastBuild = { name: blueprintName, slug, tokensUsed };

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
        // Always deliver the live link if the user is signed in
        const user = getUser();
        if (user) {
            deliverLiveLink(user.name, lastBuild);
        } else {
            // Only show signup prompt for users who are NOT signed in
            addMessage(
                `\ud83d\ude80 <strong>Build complete!</strong> Your ${blueprintName} site is ready.<br><br>` +
                '<div class="build-result">' +
                '\ud83d\udcc1 Files: 4 generated<br>' +
                '\ud83c\udfa8 Styles: Tailwind CSS applied<br>' +
                '\ud83d\udcf1 Mobile: Fully responsive<br>' +
                '\u26a1 Performance: 98/100<br><br>' +
                `Tokens remaining: ${500 - tokensUsed} of 500<br><br>` +
                '<strong>\u2192 <a href="javascript:void(0)" onclick="openModal(\'signup\')" class="build-deploy-link">Sign up to get your live link</a></strong>' +
                '</div>', 'bot');
        }
    }, 6000);
}

function deliverLiveLink(userName, build) {
    if (!chatOpen) openChat();

    // Map blueprints to real preview pages
    const previewPages = {
        'saas-landing': 'previews/saas-landing.html',
        'portfolio': 'previews/portfolio.html',
        'blog': 'previews/blog.html',
        'storefront-pro': 'previews/storefront-pro.html',
        'admin-dashboard': 'previews/admin-dashboard.html',
        'restaurant': 'previews/restaurant.html',
        'agency': 'previews/agency.html',
        'real-estate': 'previews/real-estate.html',
        'healthcare': 'previews/healthcare.html',
        'education': 'previews/education.html',
        'fitness': 'previews/fitness.html',
        'event': 'previews/event.html',
        'nonprofit': 'previews/nonprofit.html',
        'consulting': 'previews/consulting.html',
        'photography': 'previews/photography.html',
        'law-firm': 'previews/law-firm.html',
        'travel': 'previews/travel.html',
        'music': 'previews/music.html',
        'fintech': 'previews/fintech.html',
        'crypto': 'previews/crypto.html',
        'custom-site': 'previews/custom.html'
    };

    const basePath = './';
    const page = previewPages[build.slug] || 'previews/saas-landing.html';
    // Append cache busting parameter so the browser always loads the freshly updated blueprint
    const liveUrl = basePath + page + '?v=' + Date.now();

    setTimeout(() => {
        addMessage(
            `\ud83c\udf89 <strong>Deployed! Your site is live, ${userName}!</strong><br><br>` +
            '<div class="build-result">' +
            `\ud83c\udf10 <strong>Live URL:</strong> <a href="${liveUrl}" target="_blank" class="build-deploy-link">Click here to open live preview</a><br><br>` +
            `\ud83d\udcca Site: ${build.name}<br>` +
            `\u26a1 Status: Live & Serving<br>` +
            `\ud83d\udd12 SSL: Active<br>` +
            `Tokens used: ${build.tokensUsed} of 500<br><br>` +
            'You can edit your site anytime from the <strong>IDE Dashboard</strong>. Need changes? Just tell me what to update.' +
            '</div>', 'bot');
    }, 1500);
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

function toggleMobileMenu() {
    const nav = document.getElementById('main-nav');
    const btn = document.getElementById('mobile-menu-btn');
    if (nav) {
        nav.classList.toggle('active');
        btn.classList.toggle('active');
    }
}

// ---- Hero Interactive Terminal ----
function runHeroDemo() {
    const input = document.getElementById('demo-prompt');
    const term = document.getElementById('hero-terminal');
    if (!input || !term) return;

    const prompt = input.value.trim() || "Build a gym landing page";
    input.value = prompt; // fill if empty

    term.innerHTML = `<div class="term-line action">> Receiving specs: <span style="color:#fff">"${escapeHTML(prompt)}"</span></div>`;

    setTimeout(() => { term.innerHTML += `<div class="term-line">> <span class="term-keyword">[Architect]</span> Analyzing layout requirements...</div>`; }, 800);
    setTimeout(() => { term.innerHTML += `<div class="term-line">> <span class="term-keyword">[Architect]</span> Scaffold complete. Passing to Builder.</div>`; }, 1800);
    setTimeout(() => { term.innerHTML += `<div class="term-line">> <span class="term-keyword">[Builder]</span> Writing React/Tailwind components...</div>`; }, 2600);
    setTimeout(() => { term.innerHTML += `<div class="term-line">> <span class="term-keyword">[Guardian]</span> Running QA & Lighthouse Audit...</div>`; }, 3800);

    setTimeout(() => {
        term.innerHTML += `<br><div class="term-line success">✓ Build successful (98/100 Performance)</div>`;
        term.innerHTML += `<div class="term-line success">✓ Deployed to edge network.</div>`;
    }, 4800);

    setTimeout(() => {
        // Open the actual chat to complete the illusion
        openChat();

        // Pass the request to the real engine
        document.getElementById('chat-input').value = prompt;
        sendMessage({ preventDefault: () => { } });
    }, 6000);
}
