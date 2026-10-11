import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, Layers, Package, FlaskConical, History, BarChart3, Calculator } from 'lucide-react';
import { api } from './api';
import UserPricingApp from './UserPricingApp';
import AdminStudio from './AdminStudio';

export default function App() {
    // Detect current port: Port 5173 = User UI, Any other port (5174, 5175, etc.) = Admin UI
    const currentPort = window.location.port || '5173';
    const isAdmin = currentPort !== '5173' || window.location.search.includes('mode=admin');

    const [adminTab, setAdminTab] = useState('builder'); // 'builder' | 'products' | 'simulation' | 'audit' | 'analytics'
    const [strategies, setStrategies] = useState([]);
    const [products, setProducts] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [health, setHealth] = useState(null);
    const [token, setToken] = useState('');
    const [role, setRole] = useState('');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    const run = async (fn) => {
        setBusy(true);
        setError('');
        try {
            return await fn();
        } catch (e) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    };

    async function refresh() {
        const [s, p, a, h] = await Promise.all([
            api('/strategies'),
            api('/products'),
            api('/analytics'),
            api('/health')
        ]);
        setStrategies(s);
        setProducts(p);
        setAnalytics(a);
        setHealth(h);
    }

    useEffect(() => {
        run(refresh);
    }, []);

    // ------------------------------------------------------------------
    // 1. INDEPENDENT USER PORTAL (PORT 5173)
    // ------------------------------------------------------------------
    if (!isAdmin) {
        return (
            <div className="simple-shell">
                <aside className="simple-side">
                    <div className="simple-logo">
                        <span>m</span> monetize<span className="light">360</span>
                    </div>
                    <p className="simple-tag">Dynamic Pricing Application</p>

                    <div className="simple-nav">
                        <button className="selected">
                            <Calculator size={18} />
                            <span>Calculate Price</span>
                        </button>
                    </div>

                    <div className="sidebar-info-card">
                        <small>USER PORTAL</small>
                        <b>Dynamic Pricing</b>
                        <p>Calculate prices & view real-time explanations for customer situations.</p>
                    </div>

                    <div className="simple-side-bottom">
                        <CheckCircle2 size={16} /> Engine {health ? 'online' : 'connecting'}
                        <small>Deterministic Version {health?.engine_version || '2.0.0'}</small>
                    </div>
                </aside>

                <main className="simple-main">
                    <header className="simple-header">
                        <div>
                            <small>MONETIZE360 PRICING ENGINE</small>
                            <h1>Dynamic Pricing Application</h1>
                        </div>
                    </header>

                    {error && <div className="simple-error">{error}</div>}

                    <UserPricingApp
                        products={products}
                        busy={busy}
                        run={run}
                        setGlobalError={setError}
                    />

                    <footer>
                        <ShieldCheck size={15} /> Bounded User Portal · Typed inputs · Versioned strategies · Explainable prices
                    </footer>
                </main>
            </div>
        );
    }

    // ------------------------------------------------------------------
    // 2. INDEPENDENT ADMIN PORTAL (PORT 5174 / 5175)
    // ------------------------------------------------------------------
    return (
        <div className="simple-shell">
            <aside className="simple-side">
                <div className="simple-logo">
                    <span>m</span> monetize<span className="light">360</span>
                </div>
                <p className="simple-tag">Strategy Management Studio</p>

                {/* Left Sidebar Navigation for Admin */}
                <div className="simple-nav">
                    <button
                        className={adminTab === 'builder' ? 'selected' : ''}
                        onClick={() => setAdminTab('builder')}
                    >
                        <Layers size={18} />
                        <span>Domain & Strategy Builder</span>
                    </button>

                    <button
                        className={adminTab === 'products' ? 'selected' : ''}
                        onClick={() => setAdminTab('products')}
                    >
                        <Package size={18} />
                        <span>Product Catalog</span>
                    </button>

                    <button
                        className={adminTab === 'simulation' ? 'selected' : ''}
                        onClick={() => setAdminTab('simulation')}
                    >
                        <FlaskConical size={18} />
                        <span>What-If Simulations</span>
                    </button>

                    <button
                        className={adminTab === 'audit' ? 'selected' : ''}
                        onClick={() => setAdminTab('audit')}
                    >
                        <History size={18} />
                        <span>Audit & Decision History</span>
                    </button>

                    <button
                        className={adminTab === 'analytics' ? 'selected' : ''}
                        onClick={() => setAdminTab('analytics')}
                    >
                        <BarChart3 size={18} />
                        <span>Governance Analytics</span>
                    </button>
                </div>

                <div className="sidebar-info-card">
                    <small>ADMIN PORTAL</small>
                    <b>Strategy Studio</b>
                    <p>Impose rules, manage domains, products, what-if scenarios & audit logs.</p>
                </div>

                <div className="simple-side-bottom">
                    <CheckCircle2 size={16} /> Engine {health ? 'online' : 'connecting'}
                    <small>Deterministic Version {health?.engine_version || '2.0.0'}</small>
                </div>
            </aside>

            <main className="simple-main">
                {error && <div className="simple-error">{error}</div>}

                <AdminStudio
                    adminTab={adminTab}
                    setAdminTab={setAdminTab}
                    strategies={strategies}
                    products={products}
                    analytics={analytics}
                    health={health}
                    token={token}
                    setToken={setToken}
                    role={role}
                    setRole={setRole}
                    run={run}
                    refresh={refresh}
                    busy={busy}
                    setMessage={(msg) => console.log(msg)}
                    setGlobalError={setError}
                />

                <footer>
                    <ShieldCheck size={15} /> Bounded Admin Portal · Multi-Domain Governance · Version Control · Audit Logs
                </footer>
            </main>
        </div>
    );
}
