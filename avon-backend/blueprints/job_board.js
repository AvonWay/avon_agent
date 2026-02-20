module.exports = { logic: {}, ui: `
<div class="blueprint-container min-h-screen bg-white text-gray-900 font-sans">
    <header class="sticky top-0 z-50 bg-white/90 border-gray-100 shadow-sm backdrop-blur-xl border-b px-8 py-5 flex justify-between items-center transition-all">
        <div class="flex items-center gap-10">
            <h2 class="text-2xl font-black italic tracking-tighter uppercase">
                Career <span class="text-blue-600">Stack</span>
            </h2>
            <nav class="hidden md:flex gap-8 text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
                <a href="#home" class="hover:text-blue-600 transition-colors">Home</a>
                <a href="#about" class="hover:text-blue-600 transition-colors">About</a>
                <a href="#pricing" class="hover:text-blue-600 transition-colors">Pricing</a>
            </nav>
        </div>
        <button class="px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white shadow-lg hover:translate-y-[-2px] transition-all">Access System</button>
    </header>

    <section id="home" class="relative py-24 md:py-40 px-8 max-w-7xl mx-auto overflow-hidden">
        <div class="grid lg:grid-cols-2 gap-20 items-center">
            <div class="space-y-8">
                <span class="inline-flex items-center gap-2 px-3 py-1 bg-white border-gray-100 shadow-sm rounded-[24px] border rounded text-[10px] font-bold uppercase tracking-widest text-blue-600">HR Division // 2026</span>
                <h1 class="text-7xl md:text-8xl font-black italic tracking-tighter leading-[0.85] uppercase">Career Stack</h1>
                <p class="text-gray-500 text-lg leading-relaxed max-w-lg">Advanced applicant tracking logic. Engineered for the 2026 industrial era.</p>
                <div class="flex gap-4">
                    <button class="px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest bg-blue-600 text-white shadow-lg hover:translate-y-[-2px] transition-all">Initialize Build</button>
                    <button class="px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest border border-gray-200 hover:bg-white/5 transition-all">System Specs</button>
                </div>
            </div>
            <div class="relative group">
                <img src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1000" class="rounded-[48px] shadow-2xl transition-transform duration-700 group-hover:scale-[1.02]" alt="Career Stack" />
            </div>
        </div>
    </section>

    <section id="about" class="py-32 px-8 border-y border-gray-200 bg-gray-50">
        <div class="max-w-7xl mx-auto"><div class="grid md:grid-cols-3 gap-16">
            <div class="space-y-6">
                <div class="w-12 h-12 bg-white border-gray-100 shadow-sm rounded-[24px] border rounded-xl flex items-center justify-center font-black italic text-xl text-blue-600">01</div>
                <h4 class="text-2xl font-black italic uppercase tracking-tighter">Industrial Peak</h4>
                <p class="text-gray-500 text-sm leading-relaxed">Every node is standardized to Velocity specifications, ensuring sub-10ms response times and predictive state management.</p>
            </div>
            <div class="space-y-6">
                <div class="w-12 h-12 bg-white border-gray-100 shadow-sm rounded-[24px] border rounded-xl flex items-center justify-center font-black italic text-xl text-blue-600">02</div>
                <h4 class="text-2xl font-black italic uppercase tracking-tighter">Logic Injection</h4>
                <p class="text-gray-500 text-sm leading-relaxed">Every node is standardized to Velocity specifications, ensuring sub-10ms response times and predictive state management.</p>
            </div>
            <div class="space-y-6">
                <div class="w-12 h-12 bg-white border-gray-100 shadow-sm rounded-[24px] border rounded-xl flex items-center justify-center font-black italic text-xl text-blue-600">03</div>
                <h4 class="text-2xl font-black italic uppercase tracking-tighter">Autonomous Scale</h4>
                <p class="text-gray-500 text-sm leading-relaxed">Every node is standardized to Velocity specifications, ensuring sub-10ms response times and predictive state management.</p>
            </div></div></div>
    </section>

    <section id="pricing" class="py-32 px-8 max-w-7xl mx-auto">
        <div class="text-center mb-24 space-y-4">
            <h2 class="text-5xl md:text-6xl font-black italic tracking-tighter uppercase">Industrial <span class="text-blue-600">Tiers.</span></h2>
            <p class="text-gray-500 max-w-xl mx-auto">Scale your hr empire through these verified structural tiers.</p>
        </div>
        <div class="grid md:grid-cols-3 gap-10">
            <div class="p-12 bg-white border-gray-100 shadow-sm rounded-[24px] border flex flex-col gap-10 transition-all hover:border-blue-500/20 group ">
                <div class="space-y-2">
                    <p class="text-[11px] font-black uppercase tracking-widest text-gray-500">Core Execution</p>
                    <h3 class="text-3xl font-black italic uppercase">Core Tier</h3>
                </div>
                <div class="flex items-baseline gap-2">
                    <span class="text-7xl font-black italic">$99</span>
                    <span class="text-gray-500 font-bold uppercase text-[10px]">/mo</span>
                </div>
                <ul class="space-y-5 flex-1">
                <li class="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <div class="w-1.5 h-1.5 rounded-full text-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    Standardized Logic
                </li>
                <li class="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <div class="w-1.5 h-1.5 rounded-full text-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    2026 Component Hub
                </li>
                <li class="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <div class="w-1.5 h-1.5 rounded-full text-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    Predictive Recovery
                </li>
                <li class="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <div class="w-1.5 h-1.5 rounded-full text-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    Priority Swarms
                </li></ul>
                <button class="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest border border-gray-200 hover:bg-white/5 transition-all active:scale-95">Select Core</button>
            </div>
            <div class="p-12 bg-white border-gray-100 shadow-sm rounded-[24px] border flex flex-col gap-10 transition-all hover:border-blue-500/20 group scale-105 ring-2 ring-blue-500/20">
                <div class="space-y-2">
                    <p class="text-[11px] font-black uppercase tracking-widest text-gray-500">Industrial Execution</p>
                    <h3 class="text-3xl font-black italic uppercase">Industrial Tier</h3>
                </div>
                <div class="flex items-baseline gap-2">
                    <span class="text-7xl font-black italic">$198</span>
                    <span class="text-gray-500 font-bold uppercase text-[10px]">/mo</span>
                </div>
                <ul class="space-y-5 flex-1">
                <li class="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <div class="w-1.5 h-1.5 rounded-full text-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    Standardized Logic
                </li>
                <li class="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <div class="w-1.5 h-1.5 rounded-full text-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    2026 Component Hub
                </li>
                <li class="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <div class="w-1.5 h-1.5 rounded-full text-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    Predictive Recovery
                </li>
                <li class="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <div class="w-1.5 h-1.5 rounded-full text-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    Priority Swarms
                </li></ul>
                <button class="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest bg-blue-600 text-white shadow-lg hover:translate-y-[-2px] transition-all active:scale-95">Select Industrial</button>
            </div>
            <div class="p-12 bg-white border-gray-100 shadow-sm rounded-[24px] border flex flex-col gap-10 transition-all hover:border-blue-500/20 group ">
                <div class="space-y-2">
                    <p class="text-[11px] font-black uppercase tracking-widest text-gray-500">Enterprise Execution</p>
                    <h3 class="text-3xl font-black italic uppercase">Enterprise Tier</h3>
                </div>
                <div class="flex items-baseline gap-2">
                    <span class="text-7xl font-black italic">$297</span>
                    <span class="text-gray-500 font-bold uppercase text-[10px]">/mo</span>
                </div>
                <ul class="space-y-5 flex-1">
                <li class="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <div class="w-1.5 h-1.5 rounded-full text-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    Standardized Logic
                </li>
                <li class="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <div class="w-1.5 h-1.5 rounded-full text-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    2026 Component Hub
                </li>
                <li class="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <div class="w-1.5 h-1.5 rounded-full text-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    Predictive Recovery
                </li>
                <li class="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                    <div class="w-1.5 h-1.5 rounded-full text-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                    Priority Swarms
                </li></ul>
                <button class="w-full h-16 rounded-2xl font-black text-xs uppercase tracking-widest border border-gray-200 hover:bg-white/5 transition-all active:scale-95">Select Enterprise</button>
            </div></div>
    </section>

    <footer class="py-20 px-8 border-t border-gray-200 text-center space-y-8">
        <h2 class="text-2xl font-black italic tracking-tighter uppercase opacity-30">VELOCITY INDUSTRIAL</h2>
        <div class="flex justify-center gap-10 text-[10px] font-black uppercase tracking-widest text-gray-600">
            <p>© 2026 Operations</p>
            <p>DNA: HR</p>
            <p>Node: JOB-BOARD</p>
        </div>
    </footer>
</div>` };