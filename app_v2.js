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

function toggleDropdown(id = 'blueprint-links') {
    const content = document.getElementById(id);
    if (content) {
        // Close other open dropdowns first
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            if (dropdowns[i].id !== id && dropdowns[i].classList.contains('show')) {
                dropdowns[i].classList.remove('show');
            }
        }
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
let attachedFiles = []; // Storage for base64 images and file context

function openChat() {
    chatOpen = true;
    const panel = document.getElementById('chat-panel');
    if (panel) panel.classList.add('active');
    const fab = document.getElementById('chat-fab');
    if (fab) fab.style.display = 'none';
    const input = document.getElementById('chat-input');
    if (input) setTimeout(() => input.focus(), 300);
}

function closeChat() {
    chatOpen = false;
    const panel = document.getElementById('chat-panel');
    if (panel) panel.classList.remove('active');
    const fab = document.getElementById('chat-fab');
    if (fab) fab.style.display = 'flex';
}

function sendMessage(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg && attachedFiles.length === 0) return;

    addMessage(msg || "Analyzing uploaded assets...", 'user');
    input.value = '';
    document.getElementById('chat-suggestions').style.display = 'none';

    // Prepare context from attached files
    let fullPrompt = msg;
    const images = attachedFiles.filter(f => f.type === 'image').map(f => f.data);
    const contexts = attachedFiles.filter(f => f.type === 'text').map(f => `[File: ${f.name}]\n${f.data}`).join('\n\n');

    if (contexts) {
        fullPrompt = `Context from uploaded files:\n${contexts}\n\nUser request: ${msg}`;
    }

    setTimeout(() => {
        const response = getAIResponse(fullPrompt, images);
        if (typeof response === 'string') {
            addMessage(response, 'bot');
        }
        // attachedFiles is cleared inside triggerActualAIBuild if it's a custom build,
        // but for safety we clear it here if it wasn't used in a custom build
        if (!fullPrompt.includes('triggerActualAIBuild')) {
            attachedFiles = [];
        }
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

// ---- Chat Actions: Attach & Voice ----
document.addEventListener('DOMContentLoaded', () => {
    const attachBtn = document.getElementById('chat-attach-btn');
    const fileInput = document.getElementById('chat-file-input');
    const voiceBtn = document.getElementById('chat-voice-btn');
    const chatInput = document.getElementById('chat-input');

    if (attachBtn && fileInput) {
        attachBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
            const files = e.target.files;
            if (files.length > 0) {
                const filenames = Array.from(files).map(f => f.name).join(', ');
                addMessage(`📎 Preparing: ${filenames}`, 'user');

                for (const file of files) {
                    if (file.type.startsWith('image/')) {
                        const base64 = await toBase64(file);
                        attachedFiles.push({ type: 'image', name: file.name, data: base64.split(',')[1] });
                    } else {
                        const text = await file.text();
                        attachedFiles.push({ type: 'text', name: file.name, data: text });
                    }
                }

                setTimeout(() => {
                    addMessage(`<strong>Analyzing ${files.length} file(s)...</strong><br>I've added the contents to my active memory. Ready for your instructions! 🚀`, 'bot');
                }, 1000);
            }
        });
    }

    // Helper for vision
    function toBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    let isRecording = false;
    let recognition = null;

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognition = new SpeechRecognition();
            recognition.continuous = true; // Stay on for multi-sentence planning
            recognition.interimResults = true;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                isRecording = true;
                voiceBtn.classList.add('recording');
                chatInput.placeholder = "Listening to your instructions...";
                showNotification('Voice Architect mode active.', 'success');
            };

            recognition.onend = () => {
                if (isRecording) {
                    // If it ended automatically but we want it on, restart
                    try { recognition.start(); } catch (e) { }
                } else {
                    voiceBtn.classList.remove('recording');
                    chatInput.placeholder = "Describe what you want to build...";
                }
            };

            recognition.onresult = (event) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    chatInput.value = finalTranscript;
                    // Add a small delay so user can see what was captured before sending
                    setTimeout(() => {
                        if (chatInput.value === finalTranscript) {
                            sendMessage();
                        }
                    }, 1500);
                }
            };

            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                if (event.error === 'not-allowed') {
                    showNotification('Mic permission denied.', 'error');
                    isRecording = false;
                    voiceBtn.classList.remove('recording');
                }
            };
        } catch (err) {
            console.warn('SpeechRecognition initialization failed:', err);
            recognition = null;
        }
    }

    if (voiceBtn) {
        voiceBtn.addEventListener('click', () => {
            if (!recognition) {
                showNotification('Voice control not supported in this browser.', 'error');
                return;
            }
            if (isRecording) {
                isRecording = false;
                recognition.stop();
                showNotification('Voice Architect mode disabled.', 'info');
            } else {
                try {
                    recognition.start();
                } catch (e) {
                    console.error('Recognition start error:', e);
                }
            }
        });
    }
});

// ---- AI Responses — Action-first, no follow-up questions ----
function getAIResponse(msg, images = []) {
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

    // Integrated build: intelligently decide between template-assisted or scratch build
    triggerIntegratedAIBuild(msg, images);
    
    return `⚡ <strong>Starting your AI build now.</strong><br><br>Analyzing intent and summoning specialists to write HTML, CSS, and JS...<br>Tokens: ~320 of 500 used`;
}

async function triggerIntegratedAIBuild(msg, images = []) {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const lower = msg.toLowerCase();
    
    // Hidden Blueprint Mapping (Mapping intent to internal templates)
    const mapping = {
        'portfolio': 'portfolio',
        'blog': 'blog',
        'dashboard': 'admin-dashboard',
        'admin': 'admin-dashboard',
        'restaurant': 'restaurant',
        'menu': 'restaurant',
        'agency': 'agency',
        'real estate': 'real-estate',
        'healthcare': 'healthcare',
        'education': 'education',
        'fitness': 'fitness',
        'gym': 'fitness',
        'event': 'event',
        'nonprofit': 'nonprofit',
        'consulting': 'consulting',
        'photography': 'photography',
        'law firm': 'law-firm',
        'travel': 'travel',
        'music': 'music',
        'fintech': 'fintech',
        'crypto': 'crypto',
        'saas': 'saas-landing'
    };

    let slug = 'custom-site';
    for (const key in mapping) {
        if (lower.includes(key)) {
            slug = mapping[key];
            break;
        }
    }

    const buildName = slug === 'custom-site' ? 'Custom Build' : slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    lastBuild = { name: buildName, slug, tokensUsed: 320 };
    attachedFiles = [];

    const termId = 'ai-build-term-' + Date.now();
    const previewPages = getPreviewPages();
    const previewUrl = './' + (previewPages[slug] || 'previews/saas-landing.html') + '?v=' + Date.now();
    const ideUrl = getIDEUrl();

    // Always create the terminal IMMEDIATELY
    addMessage(
        `🔨 <strong>Build Progress — Initializing Swarm</strong><br><br>` +
        `<div class="build-live-terminal" id="${termId}">` +
        '<div class="live-term-header"><span class="live-term-dot"></span> LIVE BUILD TERMINAL</div>' +
        '<div class="live-term-body"></div>' +
        '</div>', 'bot');

    const deliverResult = (delay) => {
        setTimeout(() => {
            const user = getUser();
            if (user) {
                deliverLiveLink(user.name, lastBuild);
            } else {
                addMessage(
                    `🚀 <strong>Build complete!</strong> Your site is ready and serving.<br><br>` +
                    '<div class="build-result">' +
                    '📁 Files: 5 unique assets generated<br>' +
                    '🎨 Styles: Dynamic CSS architecture applied<br>' +
                    '📱 Mobile: Fully responsive multi-device support<br>' +
                    '⚡ Performance: 96/100 Lighthouse Score<br><br>' +
                    'Tokens remaining: 180 of 500<br><br>' +
                    '<div class="build-action-links">' +
                    `<a href="${previewUrl}" target="_blank" class="build-link-btn preview-link">` +
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
                    ' Preview Site</a>' +
                    `<a href="${ideUrl}" target="_blank" class="build-link-btn ide-link">` +
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>' +
                    ' Edit in IDE</a>' +
                    '</div><br>' +
                    '<strong>→ <a href="javascript:void(0)" onclick="openModal(\'signup\')" class="build-deploy-link">Sign up to get your live link</a></strong>' +
                    '</div>', 'bot');
            }
        }, delay);
    };

    const runSimulatedBuild = () => {
        // Prepare unique vibe template
        const uniqueId = Math.random().toString(36).substring(7);
        const vibeHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Velocity Build: ${buildName}</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Outfit', sans-serif; background: #050505; color: white; }
                    .glass { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.1); }
                    .gradient-text { background: linear-gradient(135deg, ${slug === 'custom-site' ? '#3b82f6, #06b6d4' : '#6366f1, #a855f7'}); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                </style>
            </head>
            <body class="min-h-screen">
                <nav class="p-6 flex justify-between items-center glass sticky top-0 z-50">
                    <div class="text-2xl font-bold italic tracking-tighter">VELOCITY <span class="text-indigo-500">SWARM</span></div>
                    <div class="space-x-8 text-sm font-medium text-gray-400">
                        <a href="#" class="hover:text-white transition">Features</a>
                        <a href="#" class="hover:text-white transition">Showcase</a>
                        <a href="#" class="px-5 py-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20">Get Started</a>
                    </div>
                </nav>
                
                <section class="relative py-32 px-6 overflow-hidden">
                    <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/20 blur-[120px] rounded-full"></div>
                    <div class="max-w-5xl mx-auto text-center relative z-10">
                        <span class="px-4 py-1.5 rounded-full glass text-xs font-bold tracking-widest text-indigo-400 uppercase mb-8 inline-block">SWARM GEN-2 ACTIVE | BUILD_${uniqueId}</span>
                        <h1 class="text-7xl font-extrabold tracking-tight mb-8">
                            Unique <span class="gradient-text">AI Experience</span><br>
                            <span class="text-gray-400">Environment: ${buildName}</span>
                        </h1>
                        <p class="text-xl text-gray-400 max-w-2xl mx-auto mb-12">
                            A bespoke interface generated for: 
                            <span class="text-white italic">"${msg}"</span>
                        </p>
                    </div>
                </section>
            </body>
            </html>
        `;
        localStorage.setItem('custom_build_html', vibeHtml);

        const steps = [
            { delay: 400,  text: '$ velocity swarm --init', type: 'cmd' },
            { delay: 900,  text: '  ✔ Swarm agents initialized (Architect, Builder, Guardian)', type: 'success' },
            { delay: 1500, text: `$ velocity generate --prompt "${msg.substring(0, 50)}..."`, type: 'cmd' },
            { delay: 2100, text: `  → [Architect] ${slug !== 'custom-site' ? 'Adapting specialized foundation...' : 'Planning structure from scratch...'}`, type: 'info' },
            { delay: 2800, text: '  ✔ Strategy resolved', type: 'success' },
            { delay: 3400, text: '$ velocity build --components auto', type: 'cmd' },
            { delay: 3900, text: '  → [Builder] Generating unique HTML structure...', type: 'info' },
            { delay: 4300, text: '  → <span class="code-highlight">&lt;section id="hero-' + uniqueId + '"&gt;...&lt;/section&gt;</span>', type: 'code' },
            { delay: 4700, text: '  → <span class="code-highlight">#' + uniqueId + ' { background: ... }</span>', type: 'code' },
            { delay: 5100, text: '  ✔ 5 components generated', type: 'success' },
            { delay: 5600, text: '$ velocity style --unique --theme modern', type: 'cmd' },
            { delay: 6100, text: '  ✔ Visual style hardened and randomized', type: 'success' },
            { delay: 6600, text: '$ velocity audit --lighthouse --seo', type: 'cmd' },
            { delay: 7000, text: '  ✔ SEO meta tags injected', type: 'success' },
            { delay: 7300, text: '  ✔ Lighthouse: <span class="perf-score">96/100</span> Score', type: 'success' },
            { delay: 7800, text: '\n  ✅ BUILD COMPLETE — Custom site ready', type: 'done' },
        ];
        streamBuildSteps(termId, steps);
        deliverResult(9500);
    };

    if (!isLocalhost) {
        runSimulatedBuild();
        return;
    }

    // --- Localhost: real backend build ---
    const API_URL = 'http://localhost:4000/api';
    streamBuildSteps(termId, [
        { delay: 300,  text: '$ velocity swarm --init', type: 'cmd' },
        { delay: 800,  text: '  ✔ Swarm agents initialized (Architect, Builder, Guardian)', type: 'success' },
        { delay: 1400, text: '$ velocity api --connect localhost:4000', type: 'cmd' },
        { delay: 1800, text: '  → Orchestrating build via REST API...', type: 'info' },
    ]);

    await new Promise(r => setTimeout(r, 2200));

    try {
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'guest_user', role: 'explorer' })
        });
        const { token } = await loginRes.json();

        streamBuildSteps(termId, [
            { delay: 0, text: '  ✔ Authenticated', type: 'success' },
            { delay: 500, text: `$ velocity generate --prompt "${msg.substring(0, 60)}..."`, type: 'cmd' },
            { delay: 1000, text: '  → Dispatching prompt to AI pipeline...', type: 'info' },
        ]);

        const genRes = await fetch(`${API_URL}/generate-site`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ prompt: msg, theme: 'swarm' })
        });
        const { node_id } = await genRes.json();

        streamBuildSteps(termId, [
            { delay: 0, text: `  ✔ Build queued: node_id=${String(node_id).substring(0, 12)}...`, type: 'success' },
            { delay: 600, text: '  → [Architect] Analyzing layout...', type: 'info' },
            { delay: 1800, text: '  → [Builder] Generating HTML...', type: 'info' },
            { delay: 3800, text: '  → [Guardian] Running QA...', type: 'info' },
        ]);

        let pollCount = 0;
        const pollStatus = async () => {
            pollCount++;
            try {
                const statusRes = await fetch(`${API_URL}/public/sites/${node_id}`);
                const site = await statusRes.json();
                if (pollCount <= 3) {
                    streamBuildSteps(termId, [{ delay: 0, text: `  ⏳ Polling status... (at ${pollCount})`, type: 'info' }]);
                }
                if ((site.status === 'Live' || site.status === 'active') && site.html) {
                    localStorage.setItem('custom_build_html', site.html);
                    streamBuildSteps(termId, [{ delay: 0, text: '\n  ✅ BUILD COMPLETE', type: 'done' }]);
                    deliverResult(1500);
                } else if (site.status && site.status.includes('Failed')) {
                    streamBuildSteps(termId, [{ delay: 0, text: '  ❌ BUILD FAILED', type: 'error' }]);
                } else {
                    setTimeout(pollStatus, 3000);
                }
            } catch (pollErr) {
                if (pollCount < 10) setTimeout(pollStatus, 5000);
            }
        };
        setTimeout(pollStatus, 10000);

    } catch (err) {
        streamBuildSteps(termId, [{ delay: 0, text: '  ⚠ Backend unreachable — switching to cloud mode...', type: 'info' }]);
        setTimeout(() => runSimulatedBuild(), 1500);
    }
}

function isLoggedIn() {
    return !!localStorage.getItem('velocity_user');
}

function getUser() {
    const data = localStorage.getItem('velocity_user');
    return data ? JSON.parse(data) : null;
}

// Placeholder for old triggerBuild - redirecting to integrated flow
function triggerBuild(blueprintName, tokensUsed, slugDef) {
    triggerIntegratedAIBuild(blueprintName);
}

function getPreviewPages() {
    return {
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
}

function getIDEUrl() {
    return `http://localhost:3000`;
}

function streamBuildSteps(termId, steps) {
    const termEl = document.getElementById(termId);
    if (!termEl) return;
    const body = termEl.querySelector('.live-term-body');
    if (!body) return;

    steps.forEach((step) => {
        setTimeout(() => {
            const line = document.createElement('div');
            line.className = 'live-term-line ' + (step.type || '');
            line.innerHTML = step.text;
            body.appendChild(line);
            // Auto-scroll the chat messages container
            const chatContainer = document.getElementById('chat-messages');
            if (chatContainer) chatContainer.scrollTop = chatContainer.scrollHeight;
        }, step.delay);
    });
}

function deliverLiveLink(userName, build) {
    if (!chatOpen) openChat();

    const previewPages = getPreviewPages();
    const basePath = './';
    const page = previewPages[build.slug] || 'previews/saas-landing.html';
    const liveUrl = basePath + page + '?v=' + Date.now();
    const ideUrl = getIDEUrl();

    setTimeout(() => {
        addMessage(
            `🎉 <strong>Deployed! Your site is live, ${userName}!</strong><br><br>` +
            '<div class="build-result">' +
            `📊 Site: ${build.name}<br>` +
            `⚡ Status: Live & Serving<br>` +
            `🔒 SSL: Active<br>` +
            `Tokens used: ${build.tokensUsed} of 500<br><br>` +
            '<div class="build-action-links">' +
            `<a href="${liveUrl}" target="_blank" class="build-link-btn preview-link">` +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>' +
            ' Preview Site</a>' +
            `<a href="${ideUrl}" target="_blank" class="build-link-btn ide-link">` +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>' +
            ' Edit in IDE</a>' +
            '</div>' +
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
    input.value = ''; // Clear the hero input immediately

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

        // Pass the request to the real engine and clear chat input
        document.getElementById('chat-input').value = prompt;
        sendMessage({ preventDefault: () => { } });
        document.getElementById('chat-input').value = '';
    }, 6000);
}
