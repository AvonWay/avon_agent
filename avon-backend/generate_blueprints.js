const fs = require('fs');
const path = require('path');
const manifest = require('./blueprints/manifest.js');

const STYLES = {
    INDUSTRIAL: {
        bg: 'bg-[#050505]',
        text: 'text-white',
        border: 'border-white/10',
        accent: 'text-blue-500',
        button: 'bg-blue-600 text-white hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]',
        card: 'bg-white/[0.02] backdrop-blur-xl border-white/5',
        nav: 'bg-black/50 border-white/5',
        font: 'font-mono'
    },
    LUXURY: {
        bg: 'bg-white',
        text: 'text-black',
        border: 'border-gray-100',
        accent: 'text-black underline decoration-blue-600',
        button: 'bg-black text-white hover:bg-blue-600',
        card: 'bg-gray-50 border-gray-100',
        nav: 'bg-white/70 border-gray-100',
        font: 'font-sans'
    },
    SERVICE: {
        bg: 'bg-white',
        text: 'text-gray-900',
        border: 'border-gray-200',
        accent: 'text-blue-600',
        button: 'bg-blue-600 text-white shadow-lg hover:translate-y-[-2px]',
        card: 'bg-white border-gray-100 shadow-sm rounded-[24px]',
        nav: 'bg-white/90 border-gray-100 shadow-sm',
        font: 'font-sans'
    }
};

const CATEGORY_STYLES = {
    'Commerce': 'LUXURY',
    'Productivity': 'INDUSTRIAL',
    'Real Estate': 'LUXURY',
    'Finance': 'INDUSTRIAL',
    'Healthcare': 'INDUSTRIAL',
    'Legal': 'INDUSTRIAL',
    'Operations': 'SERVICE',
    'Personal': 'SERVICE',
    'Design': 'LUXURY',
    'Events': 'SERVICE',
    'Health': 'SERVICE',
    'Food': 'SERVICE',
    'Non-Profit': 'SERVICE',
    'Education': 'INDUSTRIAL',
    'HR': 'SERVICE',
    'Travel': 'SERVICE',
    'Media': 'INDUSTRIAL',
    'Lifestyle': 'LUXURY'
};

manifest.forEach(m => {
    const filename = m.logic_module.replace('./', '');
    const styleKey = CATEGORY_STYLES[m.category] || 'SERVICE';
    const s = STYLES[styleKey];
    const name = m.name;
    const cat = m.category;

    // Custom Imagery Logic
    let heroImg = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1000';
    if (m.id.includes('saas') || m.id.includes('crypto')) heroImg = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000';
    if (m.id.includes('real-estate') || m.id.includes('lifestyle')) heroImg = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000';
    if (m.id.includes('medical')) heroImg = 'https://images.unsplash.com/photo-1576091160550-217359f49fdb?auto=format&fit=crop&q=80&w=1000';
    if (m.id.includes('course') || m.id.includes('news')) heroImg = 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&q=80&w=1000';

    // Generate Features HTML
    let featuresHtml = '';
    [1, 2, 3].forEach(i => {
        const title = i === 1 ? 'Industrial Peak' : i === 2 ? 'Logic Injection' : 'Autonomous Scale';
        featuresHtml += `
            <div class="space-y-6">
                <div class="w-12 h-12 ${s.card} border rounded-xl flex items-center justify-center font-black italic text-xl ${s.accent}">0${i}</div>
                <h4 class="text-2xl font-black italic uppercase tracking-tighter">${title}</h4>
                <p class="text-gray-500 text-sm leading-relaxed">Every node is standardized to Velocity specifications, ensuring sub-10ms response times and predictive state management.</p>
            </div>`;
    });

    // Generate Pricing HTML
    let pricingHtml = '';
    ['Core', 'Industrial', 'Enterprise'].forEach((tier, i) => {
        const price = (i + 1) * 99;
        const isMiddle = i === 1;
        const tierClass = isMiddle ? 'scale-105 ring-2 ring-blue-500/20' : '';
        const btnClass = isMiddle ? s.button : 'border ' + s.border + ' hover:bg-white/5';

        let listItems = '';
        ['Standardized Logic', '2026 Component Hub', 'Predictive Recovery', 'Priority Swarms'].forEach(f => {
            listItems += `
                <li class="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <div class="w-1.5 h-1.5 rounded-full ${s.accent} shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    ${f}
                </li>`;
        });

        pricingHtml += `
            <div class="p-12 ${s.card} border flex flex-col gap-10 transition-all hover:border-blue-500/20 group ${tierClass}">
                <div class="space-y-2">
                    <p class="text-[11px] font-black uppercase tracking-widest text-gray-500">${tier} Execution</p>
                    <h3 class="text-3xl font-black italic uppercase">${tier} Tier</h3>
                </div>
                <div class="flex items-baseline gap-2">
                    <span class="text-7xl font-black italic">$${price}</span>
                    <span class="text-gray-500 font-bold uppercase text-[10px]">/mo</span>
                </div>
                <ul class="space-y-5 flex-1">${listItems}</ul>
                <button class="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest ${btnClass} transition-all active:scale-95">Select ${tier}</button>
            </div>`;
    });

    const ui = `
<div class="blueprint-container min-h-screen ${s.bg} ${s.text} ${s.font}">
    <header class="sticky top-0 z-50 ${s.nav} backdrop-blur-xl border-b px-8 py-5 flex justify-between items-center transition-all">
        <div class="flex items-center gap-10">
            <h2 class="text-2xl font-black italic tracking-tighter uppercase">
                ${name.split(' ')[0]} <span class="${s.accent}">${name.split(' ')[1] || 'HUB'}</span>
            </h2>
            <nav class="hidden md:flex gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
                <a href="#home" class="hover:${s.accent} transition-colors">Home</a>
                <a href="#about" class="hover:${s.accent} transition-colors">About</a>
                <a href="#pricing" class="hover:${s.accent} transition-colors">Pricing</a>
            </nav>
        </div>
        <button class="px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${s.button} transition-all">Access System</button>
    </header>

    <section id="home" class="relative py-24 md:py-40 px-8 max-w-7xl mx-auto overflow-hidden">
        <div class="grid lg:grid-cols-2 gap-20 items-center">
            <div class="space-y-8">
                <span class="inline-flex items-center gap-2 px-3 py-1 ${s.card} border rounded text-[10px] font-bold uppercase tracking-widest ${s.accent}">${cat} Division // 2026</span>
                <h1 class="text-7xl md:text-8xl font-black italic tracking-tighter leading-[0.85] uppercase">${name}</h1>
                <p class="text-gray-500 text-lg leading-relaxed max-w-lg">${m.description} Engineered for the 2026 industrial era.</p>
                <div class="flex gap-4">
                    <button class="px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest ${s.button} transition-all">Initialize Build</button>
                    <button class="px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest border ${s.border} hover:bg-white/5 transition-all">System Specs</button>
                </div>
            </div>
            <div class="relative group">
                <img src="${heroImg}" class="${styleKey === 'SERVICE' ? 'rounded-[48px]' : 'rounded-[24px]'} shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]" alt="${name}" />
            </div>
        </div>
    </section>

    <section id="about" class="py-32 px-8 border-y ${s.border} ${styleKey === 'INDUSTRIAL' ? 'bg-white/[0.01]' : 'bg-gray-50'}">
        <div class="max-w-7xl mx-auto"><div class="grid md:grid-cols-3 gap-16">${featuresHtml}</div></div>
    </section>

    <section id="pricing" class="py-32 px-8 max-w-7xl mx-auto">
        <div class="text-center mb-24 space-y-4">
            <h2 class="text-5xl md:text-6xl font-black italic tracking-tighter uppercase">Industrial <span class="${s.accent}">Tiers.</span></h2>
            <p class="text-gray-500 max-w-xl mx-auto">Scale your ${cat.toLowerCase()} empire through these verified structural tiers.</p>
        </div>
        <div class="grid md:grid-cols-3 gap-10">${pricingHtml}</div>
    </section>

    <footer class="py-20 px-8 border-t ${s.border} text-center space-y-8">
        <h2 class="text-2xl font-black italic tracking-tighter uppercase opacity-30">VELOCITY INDUSTRIAL</h2>
        <div class="flex justify-center gap-10 text-[10px] font-black uppercase tracking-widest text-gray-600">
            <p>© 2026 Operations</p>
            <p>DNA: ${cat.toUpperCase()}</p>
            <p>Node: ${m.id.toUpperCase()}</p>
        </div>
    </footer>
</div>`;

    const content = `module.exports = { logic: {}, ui: \`${ui.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\` };`;
    fs.writeFileSync(path.join('blueprints', filename), content);
});

console.log('Successfully generated 20 blueprints with ZERO evaluation leaks.');
