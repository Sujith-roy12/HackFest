import React, { useState, useEffect } from 'react';
import { Layers, Package, FlaskConical, History, Shield, Play, Plus, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, RotateCcw, FileText, BarChart3, Sparkles, Download, Trash2 } from 'lucide-react';
import { api, post, amount } from './api';
import Builder from './Builder';
import Products from './Products';
import Simulation from './Simulation';

export default function AdminStudio({
    adminTab,
    setAdminTab,
    strategies,
    products,
    analytics,
    health,
    token,
    role,
    run,
    refresh,
    busy,
    setMessage,
    setGlobalError
}) {
    const [history, setHistory] = useState({ items: [], total: 0 });
    const [audits, setAudits] = useState([]);
    const [replayResult, setReplayResult] = useState(null);
    const [simTarget, setSimTarget] = useState(null);

    // Fetch history and audit logs when opening history tab
    useEffect(() => {
        if (adminTab === 'audit') {
            run(async () => {
                const [h, a] = await Promise.all([
                    api('/pricing/history?limit=30'),
                    api('/audit').catch(() => [])
                ]);
                setHistory(h);
                setAudits(a);
            });
        }
    }, [adminTab]);

    async function handleReplay(id) {
        run(async () => {
            const x = await post(`/pricing/history/${id}/replay`, {});
            setReplayResult({ id, ...x });
        });
    }

    const titles = {
        builder: 'Domain & Strategy Builder',
        products: 'Product Catalog',
        simulation: 'What-If Simulations',
        audit: 'Audit & Decision History',
        analytics: 'Governance Analytics'
    };

    return (
        <div className="admin-studio">
            {/* Header Title (Clean, without connect button) */}
            <header className="simple-header">
                <div>
                    <small>MONETIZE360 · STRATEGY GOVERNANCE</small>
                    <h1>{titles[adminTab] || 'Strategy Management Studio'}</h1>
                </div>
            </header>

            {/* Admin Tab Content */}
            <div className="admin-content-area mt-4">
                {/* TAB 1: Domain & Strategy Builder */}
                {adminTab === 'builder' && (
                    <div className="tab-pane">
                        <Builder
                            strategies={strategies}
                            token={token}
                            refresh={refresh}
                            execute={run}
                            busy={busy}
                            setMessage={setMessage}
                            onSimulate={(id, version) => {
                                setSimTarget({ id, version });
                                setAdminTab('simulation');
                            }}
                        />
                    </div>
                )}

                {/* TAB 2: Product Catalog */}
                {adminTab === 'products' && (
                    <div className="tab-pane">
                        <Products
                            products={products}
                            strategies={strategies}
                            token={token}
                            execute={run}
                            refresh={refresh}
                            busy={busy}
                            setMessage={setMessage}
                        />
                    </div>
                )}

                {/* TAB 3: What-If Simulations */}
                {adminTab === 'simulation' && (
                    <div className="tab-pane">
                        <Simulation
                            strategies={strategies}
                            initial={simTarget}
                            execute={run}
                            busy={busy}
                        />
                    </div>
                )}

                {/* TAB 4: Audit & Decision History */}
                {adminTab === 'audit' && (
                    <div className="tab-pane audit-pane">
                        <div className="two-col">
                            {/* Decision History */}
                            <section className="simple-card">
                                <div className="simple-card-title">
                                    <div>
                                        <h3>Pricing Decision History</h3>
                                        <p>Audit every transaction decision, stored input context, and evaluated engine version.</p>
                                    </div>
                                    <span className="count-pill">{history.total} decisions</span>
                                </div>

                                {replayResult && (
                                    <div className={`simple-success ${replayResult.matches ? '' : 'simple-error'}`}>
                                        <b>Decision #{replayResult.id} Replay Result:</b>{' '}
                                        {replayResult.matches ? (
                                            <>Exact match! Replayed output matches original decision.</>
                                        ) : (
                                            <>Replay mismatch detected! Config or parameters changed.</>
                                        )}
                                    </div>
                                )}

                                {history.items.length ? (
                                    history.items.map(r => (
                                        <div className="history-row" key={r.id}>
                                            <div>
                                                <b>#{r.id} · {r.result?.product_name || 'Product'}</b>
                                                <small>
                                                    {new Date(r.result?.evaluated_at).toLocaleString()} · Strategy: {r.product_snapshot?.strategy_id} (v{r.result?.version})
                                                </small>
                                            </div>
                                            <strong>{amount(r.result?.final_price, r.result)}</strong>
                                            <button className="link-button" onClick={() => handleReplay(r.id)}>
                                                <RotateCcw size={14} /> Replay
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-simple">
                                        <History size={36} />
                                        <p>No pricing decisions recorded yet.</p>
                                    </div>
                                )}
                            </section>

                            {/* Governance Audit Log */}
                            <section className="simple-card">
                                <div className="simple-card-title">
                                    <div>
                                        <h3>Governance Audit Trail</h3>
                                        <p>Immutable record of strategy creates, approvals, publications, and rollbacks.</p>
                                    </div>
                                    <span className="count-pill">{audits.length} events</span>
                                </div>

                                <div className="audit-log-list">
                                    {audits.length ? (
                                        audits.map(a => (
                                            <div key={a.id} className="audit-item">
                                                <div className="audit-item-top">
                                                    <span className="audit-action">{a.action}</span>
                                                    <span className="audit-actor">{a.actor}</span>
                                                </div>
                                                <div className="audit-item-details">
                                                    <b>Entity: {a.entity}</b>
                                                    <small>{new Date(a.at).toLocaleString()}</small>
                                                </div>
                                                <pre className="audit-json">{JSON.stringify(a.detail, null, 2)}</pre>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="empty-simple">
                                            <Shield size={36} />
                                            <p>No audit events recorded yet.</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {/* TAB 5: Governance Analytics */}
                {adminTab === 'analytics' && (
                    <div className="tab-pane analytics-pane">
                        <div className="simple-metrics">
                            <div className="simple-metric">
                                <span>Domains / Strategies</span>
                                <b>{analytics?.strategies ?? '—'}</b>
                                <small>Configured pricing policies</small>
                            </div>

                            <div className="simple-metric">
                                <span>Products</span>
                                <b>{analytics?.products ?? '—'}</b>
                                <small>Active pricing products</small>
                            </div>

                            <div className="simple-metric">
                                <span>Total Decisions</span>
                                <b>{analytics?.decisions ?? '—'}</b>
                                <small>Evaluations recorded</small>
                            </div>

                            <div className="simple-metric">
                                <span>Engine P95 Latency</span>
                                <b>{analytics?.p95_engine_ms != null ? `${analytics.p95_engine_ms} ms` : '—'}</b>
                                <small>Sub-millisecond speed</small>
                            </div>
                        </div>

                        <div className="two-col">
                            <section className="simple-card">
                                <h3>Engine Status & Health</h3>
                                <div className="health-details">
                                    <div className="health-row">
                                        <span>Engine Version:</span>
                                        <b>{health?.engine_version || '2.0.0'}</b>
                                    </div>
                                    <div className="health-row">
                                        <span>Database Engine:</span>
                                        <b>{health?.database || 'sqlite'}</b>
                                    </div>
                                    <div className="health-row">
                                        <span>AI Copilot Status:</span>
                                        <b>{health?.ai_configured ? 'Active (Gemini Configured)' : 'Missing GEMINI_API_KEY'}</b>
                                    </div>
                                </div>
                            </section>

                            <section className="simple-card">
                                <h3>Strategy Usage Summary</h3>
                                {analytics?.by_strategy?.length ? (
                                    <div className="strategy-analytics-list">
                                        {analytics.by_strategy.map(item => (
                                            <div key={item.strategy} className="strategy-stat-row">
                                                <span>{item.strategy}</span>
                                                <b>{item.decisions} decisions</b>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="muted text-sm">No transaction decisions observed yet.</p>
                                )}
                            </section>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
