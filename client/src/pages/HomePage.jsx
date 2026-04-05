import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    Coffee, Monitor, ChefHat, LayoutGrid, ShoppingBag, QrCode,
    BarChart3, Clock, CreditCard, ArrowRight, Menu, X, Users,
    Zap, Shield, Smartphone, CheckCircle2, Star, ChevronRight,
    Utensils, Bell, TrendingUp, Play, ScanLine, Receipt
} from 'lucide-react';

/* ═══════════════════════════════════════════
   Intersection Observer hook for scroll animations
   ═══════════════════════════════════════════ */
function useInView(options = {}) {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setInView(true); },
            { threshold: 0.15, ...options }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);
    return [ref, inView];
}

/* ═══════════════════════════════════════════
   Animated counter for stats
   ═══════════════════════════════════════════ */
function AnimatedCounter({ target, suffix = '', duration = 2000 }) {
    const [count, setCount] = useState(0);
    const [ref, inView] = useInView();
    useEffect(() => {
        if (!inView) return;
        let start = 0;
        const step = Math.ceil(target / (duration / 16));
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(timer); }
            else setCount(start);
        }, 16);
        return () => clearInterval(timer);
    }, [inView, target, duration]);
    return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */
const MODULES = [
    { icon: Monitor, title: 'POS Terminal', desc: 'Multi-terminal order management with real-time session sync.', color: 'from-cafe-500 to-amber-400' },
    { icon: LayoutGrid, title: 'Floor & Table View', desc: 'Interactive floor plans with drag status, live occupancy tracking.', color: 'from-emerald-500 to-teal-400' },
    { icon: QrCode, title: 'QR Table Ordering', desc: 'Scan, browse, order, and pay — all from the customer\'s phone.', color: 'from-violet-500 to-purple-400' },
    { icon: ChefHat, title: 'Kitchen Display', desc: '4-stage pipeline: Confirmed → Preparing → Ready → Served.', color: 'from-orange-500 to-red-400' },
    { icon: Clock, title: 'Real-Time Tracking', desc: 'Live order progress with Socket.IO push notifications.', color: 'from-blue-500 to-cyan-400' },
    { icon: CreditCard, title: 'Payments & Razorpay', desc: 'Cash, card, UPI, and Razorpay integration with auto-reconciliation.', color: 'from-pink-500 to-rose-400' },
];

const STATS = [
    { label: 'Orders Processed', value: 25, suffix: '+' },
    { label: 'Restaurants Active', value: 4, suffix: '+' },
    { label: 'Avg Response Time', value: 1.2, suffix: 's' },
    { label: 'Uptime', value: 99.9, suffix: '%' },
];

const STEPS = [
    { step: '01', icon: ScanLine, title: 'Scan QR Code', desc: 'Customer scans the table QR code with their phone camera.' },
    { step: '02', icon: ShoppingBag, title: 'Browse & Order', desc: 'Full mobile menu with categories, search, variants, and cart.' },
    { step: '03', icon: CreditCard, title: 'Pay Securely', desc: 'Razorpay checkout — card, UPI, or wallet. Instant confirmation.' },
    { step: '04', icon: Bell, title: 'Track & Receive', desc: 'Real-time kitchen tracking until your order lands at your table.' },
];

const ROLES = [
    { role: 'Manager', icon: BarChart3, path: '/dashboard', desc: 'Full control — analytics, settings, staff, and multi-terminal oversight.', color: 'bg-violet-50 text-violet-600 border-violet-200' },
    { role: 'Cashier', icon: Monitor, path: '/pos/config', desc: 'Take orders, manage sessions, process payments, and handle floor ops.', color: 'bg-cafe-50 text-cafe-600 border-cafe-200' },
    { role: 'Kitchen Staff', icon: ChefHat, path: '/kitchen', desc: '4-stage kitchen display — prep, cook, plate, and serve in real time.', color: 'bg-orange-50 text-orange-600 border-orange-200' },
    { role: 'Customer', icon: Smartphone, path: '/login', desc: 'Scan QR, browse menu, order directly, track your meal live.', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
];

const FEATURES_GRID = [
    { icon: Zap, title: 'Lightning Fast', desc: 'Vite-powered SPA with optimistic UI and < 200ms interactions.' },
    { icon: Shield, title: 'Secure by Design', desc: 'JWT auth, role-based access, rate limiting, and encrypted payments.' },
    { icon: Users, title: 'Multi-Role System', desc: 'Manager, Cashier, Kitchen, and Customer — each with tailored UX.' },
    { icon: Smartphone, title: 'Mobile-First', desc: 'Every screen designed for touch-first, then scaled to desktop.' },
    { icon: TrendingUp, title: 'Real-Time Sync', desc: 'Socket.IO events keep kitchen, POS, and customers always in sync.' },
    { icon: Receipt, title: 'Smart Billing', desc: 'Auto tax calculation, variant pricing, and multi-method payments.' },
];

/* ═══════════════════════════════════════════
   HOMEPAGE COMPONENT
   ═══════════════════════════════════════════ */
export default function HomePage() {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const [mobileNav, setMobileNav] = useState(false);

    // ── Sticky Navbar ──────────────────────
    const NAV_LINKS = [
        { label: 'Features', href: '#features' },
        { label: 'Modules', href: '#modules' },
        { label: 'How It Works', href: '#how-it-works' },
        { label: 'Roles', href: '#roles' },
    ];

    const scrollTo = (href) => {
        setMobileNav(false);
        const el = document.querySelector(href);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
    };

    /* ═══════════════════════════════════════
       RENDER
       ═══════════════════════════════════════ */
    return (
        <div className="min-h-screen bg-cream-50 overflow-x-hidden">

            {/* ─── NAVBAR ─────────────────────── */}
            <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                                <Coffee className="w-5 h-5 text-white" />
                            </div>
                            <div className="hidden sm:block">
                                <span className="text-base font-display font-bold text-stone-900">Odoo POS Cafe</span>
                                <p className="text-[10px] text-stone-400 font-medium tracking-wide -mt-0.5">Smart Restaurant Platform</p>
                            </div>
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-1">
                            {NAV_LINKS.map(l => (
                                <button key={l.href} onClick={() => scrollTo(l.href)}
                                    className="px-4 py-2 rounded-xl text-sm font-semibold text-stone-500 hover:text-cafe-600 hover:bg-cafe-50 transition-all">
                                    {l.label}
                                </button>
                            ))}
                        </nav>

                        {/* CTA */}
                        <div className="flex items-center gap-3">
                            {isAuthenticated ? (
                                <button onClick={() => navigate('/dashboard')}
                                    className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cafe-500 to-cafe-600 text-white text-sm font-display font-semibold rounded-xl shadow-btn hover:shadow-btn-hover hover:-translate-y-0.5 transition-all">
                                    Dashboard <ArrowRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => navigate('/login')}
                                        className="hidden sm:inline-flex px-5 py-2.5 text-sm font-display font-semibold text-stone-600 hover:text-cafe-600 transition-colors">
                                        Sign In
                                    </button>
                                    <button onClick={() => navigate('/signup')}
                                        className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cafe-500 to-cafe-600 text-white text-sm font-display font-semibold rounded-xl shadow-btn hover:shadow-btn-hover hover:-translate-y-0.5 transition-all">
                                        Get Started <ArrowRight className="w-4 h-4" />
                                    </button>
                                </>
                            )}

                            {/* Mobile hamburger */}
                            <button onClick={() => setMobileNav(!mobileNav)}
                                className="md:hidden w-10 h-10 rounded-xl border border-stone-200 flex items-center justify-center text-stone-600 hover:bg-stone-50 transition-colors">
                                {mobileNav ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Nav Drawer */}
                {mobileNav && (
                    <div className="md:hidden bg-white border-t border-stone-100 animate-slide-down">
                        <div className="px-4 py-3 space-y-1">
                            {NAV_LINKS.map(l => (
                                <button key={l.href} onClick={() => scrollTo(l.href)}
                                    className="block w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-stone-600 hover:bg-cafe-50 hover:text-cafe-600 transition-all">
                                    {l.label}
                                </button>
                            ))}
                            <div className="pt-2 border-t border-stone-100 mt-2">
                                {isAuthenticated ? (
                                    <button onClick={() => { setMobileNav(false); navigate('/dashboard'); }}
                                        className="w-full py-3 bg-gradient-to-r from-cafe-500 to-cafe-600 text-white text-sm font-display font-semibold rounded-xl shadow-btn">
                                        Go to Dashboard
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button onClick={() => { setMobileNav(false); navigate('/login'); }}
                                            className="flex-1 py-3 border border-stone-200 text-stone-600 text-sm font-display font-semibold rounded-xl hover:bg-stone-50">
                                            Sign In
                                        </button>
                                        <button onClick={() => { setMobileNav(false); navigate('/signup'); }}
                                            className="flex-1 py-3 bg-gradient-to-r from-cafe-500 to-cafe-600 text-white text-sm font-display font-semibold rounded-xl shadow-btn">
                                            Sign Up
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* ─── HERO ───────────────────────── */}
            <HeroSection navigate={navigate} isAuthenticated={isAuthenticated} />

            {/* ─── TRUSTED STATS ───────────────── */}
            <StatsBar />

            {/* ─── FEATURES GRID ──────────────── */}
            <FeaturesSection />

            {/* ─── MODULES ────────────────────── */}
            <ModulesSection />

            {/* ─── HOW IT WORKS ───────────────── */}
            <HowItWorksSection />

            {/* ─── ROLE ENTRY POINTS ──────────── */}
            <RolesSection navigate={navigate} />

            {/* ─── FINAL CTA ──────────────────── */}
            <CTASection navigate={navigate} isAuthenticated={isAuthenticated} />

            {/* ─── FOOTER ─────────────────────── */}
            <Footer />
        </div>
    );
}


/* ═══════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════ */
function HeroSection({ navigate, isAuthenticated }) {
    const [ref, inView] = useInView();

    return (
        <section ref={ref} className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-cafe-100/40 to-amber-100/30 rounded-full blur-3xl animate-float-slow" />
                <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-gradient-to-tr from-violet-100/20 to-cafe-100/20 rounded-full blur-3xl animate-drift" />
                <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-cafe-300/40 rounded-full animate-float-fast" />
                <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-amber-300/40 rounded-full animate-float-medium" />
            </div>

            <div className={`max-w-7xl mx-auto relative transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="text-center max-w-4xl mx-auto">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cafe-50 border border-cafe-200 rounded-full mb-6 sm:mb-8">
                        <div className="w-2 h-2 rounded-full bg-cafe-500 animate-pulse-soft" />
                        <span className="text-xs font-display font-semibold text-cafe-700 tracking-wide">Innovation Night 2026 — Live Demo Ready</span>
                    </div>

                    {/* Heading */}
                    <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-extrabold text-stone-900 leading-[1.08] tracking-tight">
                        Smart Restaurant
                        <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-cafe-500 via-amber-500 to-cafe-600 bg-clip-text text-transparent">
                            POS Platform
                        </span>
                    </h1>

                    {/* Sub */}
                    <p className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-stone-500 font-body max-w-2xl mx-auto leading-relaxed">
                        From QR table ordering to kitchen displays, real-time tracking to Razorpay payments —
                        a complete full-stack hospitality solution built with MERN and designed for stage.
                    </p>

                    {/* CTAs */}
                    <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                        <button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-r from-cafe-500 to-cafe-600 text-white font-display font-semibold text-sm sm:text-base rounded-2xl shadow-btn hover:shadow-btn-hover hover:-translate-y-0.5 active:translate-y-0 transition-all">
                            {isAuthenticated ? 'Open Dashboard' : 'Get Started Free'}
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <button onClick={() => document.querySelector('#modules')?.scrollIntoView({ behavior: 'smooth' })}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white border border-stone-200 text-stone-700 font-display font-semibold text-sm sm:text-base rounded-2xl shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all">
                            <Play className="w-4 h-4 text-cafe-500" />
                            Explore Modules
                        </button>
                    </div>

                    {/* Tech stack pills */}
                    <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-2">
                        {['React', 'Node.js', 'MongoDB', 'Socket.IO', 'Razorpay', 'Tailwind CSS'].map(t => (
                            <span key={t} className="px-3 py-1 bg-white border border-stone-150 rounded-lg text-[11px] font-semibold text-stone-400 tracking-wide">
                                {t}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Hero Visual — Floating module cards */}
                <div className="mt-12 sm:mt-16 relative max-w-5xl mx-auto">
                    <div className="bg-white rounded-3xl shadow-glass border border-stone-100/80 p-4 sm:p-6 lg:p-8">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                            {MODULES.map((m, i) => (
                                <div key={m.title}
                                    className="group p-3 sm:p-4 rounded-2xl border border-stone-100 bg-cream-50/50 hover:bg-white hover:shadow-card hover:border-stone-200 transition-all duration-300 hover:-translate-y-1"
                                    style={{ animationDelay: `${i * 100}ms` }}>
                                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center mb-2 sm:mb-3 shadow-sm group-hover:scale-110 transition-transform`}>
                                        <m.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                    </div>
                                    <h3 className="text-xs sm:text-sm font-display font-bold text-stone-800">{m.title}</h3>
                                    <p className="text-[10px] sm:text-xs text-stone-400 mt-0.5 sm:mt-1 leading-relaxed hidden sm:block">{m.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Glow effect */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-cafe-200/20 via-amber-200/10 to-violet-200/20 rounded-[2rem] blur-2xl -z-10" />
                </div>
            </div>
        </section>
    );
}


/* ═══════════════════════════════════════════
   STATS BAR
   ═══════════════════════════════════════════ */
function StatsBar() {
    const [ref, inView] = useInView();
    return (
        <section ref={ref} className="relative py-10 sm:py-14 border-y border-stone-100 bg-white/60">
            <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
                    {STATS.map(s => (
                        <div key={s.label} className="text-center">
                            <p className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-stone-900">
                                <AnimatedCounter target={s.value} suffix={s.suffix} />
                            </p>
                            <p className="text-xs sm:text-sm text-stone-400 font-medium mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}


/* ═══════════════════════════════════════════
   FEATURES SECTION
   ═══════════════════════════════════════════ */
function FeaturesSection() {
    const [ref, inView] = useInView();
    return (
        <section id="features" ref={ref} className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className={`max-w-7xl mx-auto transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="text-center mb-10 sm:mb-14">
                    <span className="inline-block px-3 py-1 bg-cafe-50 border border-cafe-200 rounded-full text-xs font-display font-semibold text-cafe-600 tracking-wide mb-4">
                        Platform Highlights
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-stone-900">
                        Built for Speed, Security & Scale
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-stone-400 max-w-xl mx-auto">
                        Every layer — from database to pixel — is engineered for real-world restaurant operations.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {FEATURES_GRID.map((f, i) => (
                        <div key={f.title}
                            className="group p-5 sm:p-6 bg-white rounded-2xl border border-stone-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300"
                            style={{ transitionDelay: `${i * 60}ms` }}>
                            <div className="w-11 h-11 rounded-xl bg-cafe-50 border border-cafe-100 flex items-center justify-center mb-4 group-hover:bg-cafe-100 transition-colors">
                                <f.icon className="w-5 h-5 text-cafe-600" />
                            </div>
                            <h3 className="text-sm sm:text-base font-display font-bold text-stone-800">{f.title}</h3>
                            <p className="text-xs sm:text-sm text-stone-400 mt-1.5 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}


/* ═══════════════════════════════════════════
   MODULES SECTION
   ═══════════════════════════════════════════ */
function ModulesSection() {
    const [active, setActive] = useState(0);
    const [ref, inView] = useInView();

    return (
        <section id="modules" ref={ref} className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white/60 border-y border-stone-100">
            <div className={`max-w-7xl mx-auto transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="text-center mb-10 sm:mb-14">
                    <span className="inline-block px-3 py-1 bg-cafe-50 border border-cafe-200 rounded-full text-xs font-display font-semibold text-cafe-600 tracking-wide mb-4">
                        Core Modules
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-stone-900">
                        Six Modules. One Seamless Platform.
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-stone-400 max-w-xl mx-auto">
                        Each module is a standalone powerhouse — together, they redefine restaurant tech.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
                    {/* Module selector - left */}
                    <div className="lg:col-span-2 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 snap-x lg:snap-none">
                        {MODULES.map((m, i) => (
                            <button key={m.title} onClick={() => setActive(i)}
                                className={`flex-shrink-0 lg:flex-shrink flex items-center gap-3 px-4 py-3 sm:py-3.5 rounded-xl text-left transition-all duration-300 snap-start ${active === i
                                        ? 'bg-white shadow-card border border-stone-200'
                                        : 'bg-transparent border border-transparent hover:bg-white/60 hover:border-stone-100'
                                    }`}>
                                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${m.color} flex items-center justify-center flex-shrink-0 ${active === i ? 'scale-110' : ''} transition-transform`}>
                                    <m.icon className="w-4 h-4 text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className={`text-sm font-display font-bold truncate ${active === i ? 'text-stone-900' : 'text-stone-500'}`}>{m.title}</p>
                                    <p className="text-[10px] text-stone-400 truncate hidden lg:block">{m.desc.slice(0, 50)}...</p>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Module detail - right */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-2xl border border-stone-100 shadow-card p-6 sm:p-8 min-h-[280px] transition-all duration-300">
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${MODULES[active].color} flex items-center justify-center shadow-lg mb-5`}>
                                {(() => { const Icon = MODULES[active].icon; return <Icon className="w-7 h-7 text-white" />; })()}
                            </div>
                            <h3 className="text-xl sm:text-2xl font-display font-bold text-stone-900 mb-3">{MODULES[active].title}</h3>
                            <p className="text-sm sm:text-base text-stone-500 leading-relaxed mb-5">{MODULES[active].desc}</p>

                            {/* Module-specific feature bullets */}
                            <div className="space-y-2.5">
                                {getModuleFeatures(active).map((feat, i) => (
                                    <div key={i} className="flex items-start gap-2.5">
                                        <CheckCircle2 className="w-4 h-4 text-cafe-500 mt-0.5 flex-shrink-0" />
                                        <span className="text-sm text-stone-600">{feat}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

function getModuleFeatures(idx) {
    const data = [
        ['Multi-terminal concurrent sessions', 'Auto order numbering (ORD-XXXX)', 'Real-time session sync across devices', 'Role-based terminal access control'],
        ['Interactive drag-and-drop floor plans', 'Live table status: Available, Occupied, Reserved', 'Table QR code generation per seat', 'Multi-floor support with easy switching'],
        ['Customer scans → browses → orders → pays on phone', 'No app install required — fully web-based', 'Cart persisted via localStorage per table', 'Server-side price validation for security'],
        ['4-stage pipeline: Confirmed → Preparing → Ready → Served', 'Socket.IO real-time push to kitchen screens', 'Order age tracking and priority indicators', 'One-tap status transitions for staff'],
        ['Live order progress stepper for customers', 'Socket.IO room-based event streaming', 'Push notification toasts on status change', 'Elapsed time counter per order stage'],
        ['Razorpay gateway with signature verification', 'Cash, card, UPI, and wallet support', 'Server-side amount validation (not frontend)', 'Auto order confirmation on payment success'],
    ];
    return data[idx] || data[0];
}


/* ═══════════════════════════════════════════
   HOW IT WORKS
   ═══════════════════════════════════════════ */
function HowItWorksSection() {
    const [ref, inView] = useInView();
    return (
        <section id="how-it-works" ref={ref} className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className={`max-w-7xl mx-auto transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="text-center mb-10 sm:mb-14">
                    <span className="inline-block px-3 py-1 bg-cafe-50 border border-cafe-200 rounded-full text-xs font-display font-semibold text-cafe-600 tracking-wide mb-4">
                        QR Ordering Flow
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-stone-900">
                        Table to Plate in 4 Steps
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-stone-400 max-w-xl mx-auto">
                        No app downloads. No waiter wait. Just scan and dine.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {STEPS.map((s, i) => (
                        <div key={s.step} className="relative group">
                            {/* Connector line */}
                            {i < STEPS.length - 1 && (
                                <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-gradient-to-r from-stone-200 to-transparent z-0 -translate-x-4" />
                            )}
                            <div className="relative bg-white rounded-2xl border border-stone-100 shadow-card p-5 sm:p-6 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cafe-500 to-cafe-600 flex items-center justify-center shadow-sm">
                                        <s.icon className="w-5 h-5 text-white" />
                                    </div>
                                    <span className="text-2xl font-display font-extrabold text-stone-200">{s.step}</span>
                                </div>
                                <h3 className="text-sm sm:text-base font-display font-bold text-stone-800 mb-1.5">{s.title}</h3>
                                <p className="text-xs sm:text-sm text-stone-400 leading-relaxed">{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}


/* ═══════════════════════════════════════════
   ROLES SECTION
   ═══════════════════════════════════════════ */
function RolesSection({ navigate }) {
    const [ref, inView] = useInView();
    return (
        <section id="roles" ref={ref} className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-white/60 border-y border-stone-100">
            <div className={`max-w-7xl mx-auto transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="text-center mb-10 sm:mb-14">
                    <span className="inline-block px-3 py-1 bg-cafe-50 border border-cafe-200 rounded-full text-xs font-display font-semibold text-cafe-600 tracking-wide mb-4">
                        Role-Based Access
                    </span>
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-stone-900">
                        One Platform. Four Perspectives.
                    </h2>
                    <p className="mt-3 text-sm sm:text-base text-stone-400 max-w-xl mx-auto">
                        Every role gets a tailored workspace designed for their specific workflow.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                    {ROLES.map(r => (
                        <button key={r.role} onClick={() => navigate(r.path)}
                            className="group text-left p-5 sm:p-6 bg-white rounded-2xl border border-stone-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300">
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl border ${r.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                                    <r.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm sm:text-base font-display font-bold text-stone-800">{r.role}</h3>
                                        <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-cafe-500 group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                    <p className="text-xs sm:text-sm text-stone-400 mt-1 leading-relaxed">{r.desc}</p>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}


/* ═══════════════════════════════════════════
   CTA SECTION
   ═══════════════════════════════════════════ */
function CTASection({ navigate, isAuthenticated }) {
    const [ref, inView] = useInView();
    return (
        <section ref={ref} className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
            <div className={`max-w-4xl mx-auto text-center transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div className="relative bg-gradient-to-br from-stone-900 via-espresso-900 to-stone-900 rounded-3xl p-8 sm:p-12 lg:p-16 overflow-hidden">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-cafe-500/15 to-transparent rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-full blur-3xl" />

                    <div className="relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <Coffee className="w-7 h-7 text-white" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-white mb-4">
                            Ready to Transform Your Restaurant?
                        </h2>
                        <p className="text-sm sm:text-base text-stone-400 max-w-lg mx-auto mb-8 leading-relaxed">
                            Experience the full power of Odoo POS Cafe — from QR ordering to kitchen display,
                            all live, all real-time.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                            <button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/signup')}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-cafe-500 to-cafe-600 text-white font-display font-semibold rounded-2xl shadow-btn hover:shadow-btn-hover hover:-translate-y-0.5 transition-all">
                                {isAuthenticated ? 'Go to Dashboard' : 'Start Now — It\'s Free'}
                                <ArrowRight className="w-5 h-5" />
                            </button>
                            <button onClick={() => document.querySelector('#modules')?.scrollIntoView({ behavior: 'smooth' })}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-stone-700 text-stone-300 font-display font-semibold rounded-2xl hover:bg-stone-800 hover:border-stone-600 transition-all">
                                Explore Modules
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}


/* ═══════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════ */
function Footer() {
    return (
        <footer className="border-t border-stone-100 bg-white/60 py-10 sm:py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="sm:col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cafe-500 to-amber-400 flex items-center justify-center shadow-sm">
                                <Coffee className="w-4 h-4 text-white" />
                            </div>
                            <span className="font-display font-bold text-stone-900">Odoo POS Cafe</span>
                        </div>
                        <p className="text-xs text-stone-400 leading-relaxed max-w-xs">
                            A full-stack MERN restaurant management platform built for Innovation Night 2026.
                        </p>
                    </div>

                    {/* Platform */}
                    <div>
                        <h4 className="text-xs font-display font-bold text-stone-600 uppercase tracking-wider mb-3">Platform</h4>
                        <ul className="space-y-2">
                            {['POS Terminal', 'Floor Management', 'Kitchen Display', 'QR Ordering'].map(l => (
                                <li key={l}><span className="text-sm text-stone-400 hover:text-cafe-600 cursor-default transition-colors">{l}</span></li>
                            ))}
                        </ul>
                    </div>

                    {/* Tech Stack */}
                    <div>
                        <h4 className="text-xs font-display font-bold text-stone-600 uppercase tracking-wider mb-3">Tech Stack</h4>
                        <ul className="space-y-2">
                            {['React + Vite', 'Node.js + Express', 'MongoDB Atlas', 'Socket.IO + Razorpay'].map(l => (
                                <li key={l}><span className="text-sm text-stone-400 hover:text-cafe-600 cursor-default transition-colors">{l}</span></li>
                            ))}
                        </ul>
                    </div>

                    {/* Roles */}
                    <div>
                        <h4 className="text-xs font-display font-bold text-stone-600 uppercase tracking-wider mb-3">Roles</h4>
                        <ul className="space-y-2">
                            {['Manager', 'Cashier', 'Kitchen Staff', 'Customer'].map(l => (
                                <li key={l}><span className="text-sm text-stone-400 hover:text-cafe-600 cursor-default transition-colors">{l}</span></li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-stone-400">
                        © 2026 Odoo POS Cafe • Innovation Night — Hackathon Final Round
                    </p>
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-stone-400">Made with</span>
                        <span className="text-cafe-500 text-sm">♥</span>
                        <span className="text-xs text-stone-400">and</span>
                        <Coffee className="w-3.5 h-3.5 text-cafe-500" />
                    </div>
                </div>
            </div>
        </footer>
    );
}
