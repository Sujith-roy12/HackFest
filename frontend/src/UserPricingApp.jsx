import React, { useState, useEffect } from 'react';
import { Calculator, ArrowRight, CheckCircle2, ShieldCheck, Sparkles, HelpCircle, RefreshCw, Zap, TrendingDown, TrendingUp, Info } from 'lucide-react';
import { api, post, amount, defaultContext } from './api';
import { ContextForm } from './Editors';

export default function UserPricingApp({ products, busy, run, setGlobalError }) {
    const [productId, setProductId] = useState('');
    const [context, setContext] = useState({});
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showTechnical, setShowTechnical] = useState(false);

    // Initialize product selection when products arrive
    useEffect(() => {
        if (!productId && products.length > 0) {
            setProductId(products[0].id);
        }
    }, [products]);

    const product = products.find(p => p.id === productId);
    const config = product?.config;

    // Reset context when product changes
    useEffect(() => {
        if (product && config) {
            setContext({
                ...product.defaults,
                ...defaultContext(config)
            });
            setResult(null);
        }
    }, [productId]);

    async function handleCalculate() {
        if (!productId || !config) return;
        setLoading(true);
        try {
            const res = await post('/pricing/calculate', {
                product_id: productId,
                context
            });
            setResult(res);
        } catch (err) {
            if (setGlobalError) setGlobalError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function handleReset() {
        if (config && product) {
            setContext({
                ...product.defaults,
                ...defaultContext(config)
            });
            setResult(null);
        }
    }

    return (
        <div className="user-pricing-app">
            {/* Header Banner */}
            <div className="user-hero">
                <div>
                    <span className="simple-kicker">DYNAMIC PRICING ENGINE</span>
                    <h2>Instant, Transparent Pricing</h2>
                    <p>Select a product or service, enter transaction details, and compute exact pricing with real-time explainability.</p>
                </div>
                <div className="user-hero-badge">
                    <Zap size={24} className="text-lime" />
                    <div>
                        <b>Deterministic Engine</b>
                        <small>Sub-millisecond evaluation</small>
                    </div>
                </div>
            </div>

            <div className="user-grid">
                {/* Left Column: Product Selection & Situation Input */}
                <div className="user-card main-input-card">
                    <div className="card-header-styled">
                        <div className="step-num">1</div>
                        <div>
                            <h3>Select Product or Service</h3>
                            <p>Choose the product to price</p>
                        </div>
                    </div>

                    <div className="product-selector-box">
                        <label className="field-label">Product / Service</label>
                        <select
                            className="big-select product-select"
                            value={productId}
                            onChange={e => setProductId(e.target.value)}
                        >
                            {products.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.name} ({p.id}) — Strategy: {p.strategy_id}
                                </option>
                            ))}
                        </select>

                        {product && (
                            <div className="product-meta-pill">
                                <div>
                                    <span>Base Rate:</span> <strong>{amount(product.base_rate, config)}</strong>
                                </div>
                                <div>
                                    <span>Priced Unit:</span> <strong>per {config?.unit || 'unit'}</strong>
                                </div>
                                <div>
                                    <span>Version:</span> <strong className="version-pill">v{product.active_version}</strong>
                                </div>
                            </div>
                        )}
                    </div>

                    {config ? (
                        <div className="context-section">
                            <div className="card-header-styled mt-6">
                                <div className="step-num">2</div>
                                <div>
                                    <h3>Enter Current Situation & Context</h3>
                                    <p>Fill in parameters to evaluate dynamic pricing rules</p>
                                </div>
                            </div>

                            <div className="form-container">
                                <ContextForm config={config} context={context} onChange={setContext} />
                            </div>

                            <div className="action-buttons-row">
                                <button
                                    disabled={loading || !productId}
                                    className="simple-primary full calculate-btn"
                                    onClick={handleCalculate}
                                >
                                    {loading ? (
                                        <>Calculating price...</>
                                    ) : (
                                        <>
                                            Calculate Price <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>

                                <button
                                    className="simple-secondary reset-btn"
                                    onClick={handleReset}
                                    title="Reset input parameters to defaults"
                                >
                                    <RefreshCw size={16} /> Reset
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="no-config-alert">
                            <Info size={20} />
                            <span>This product has no active published pricing strategy.</span>
                        </div>
                    )}
                </div>

                {/* Right Column: Price Result & Simple Explanation */}
                <div className="user-card result-container-card">
                    {result ? (
                        <div className="result-display">
                            {/* Big Price Showcase */}
                            <div className="simple-result price-showcase">
                                <span className="result-tag">FINAL CALCULATED {config?.output_type === 'rate' ? 'RATE' : 'PRICE'}</span>
                                <strong className="main-price-val">
                                    {amount(result.final_price, config)}
                                </strong>
                                <p className="unit-label">per {config?.unit || 'unit'}</p>

                                <div className="price-sub-metrics">
                                    <div className="sub-metric">
                                        <span>Base List Amount</span>
                                        <b>{amount(result.base_amount, config)}</b>
                                    </div>
                                    <div className="sub-metric">
                                        <span>Calculation Speed</span>
                                        <b>{result.engine_latency_ms} ms</b>
                                    </div>
                                    <div className="sub-metric">
                                        <span>Decision ID</span>
                                        <b>#{result.decision_id}</b>
                                    </div>
                                </div>
                            </div>

                            {/* Simple Plain-English Explanation */}
                            <div className="simple-explanation-box">
                                <div className="explanation-title">
                                    <Sparkles size={18} className="text-lime" />
                                    <h4>Pricing Explanation & Breakdown</h4>
                                </div>

                                <div className="explanation-steps">
                                    {/* Step 1: Base */}
                                    <div className="explanation-step">
                                        <div className="step-badge">1</div>
                                        <div className="step-content">
                                            <b>Starting Base Amount: {amount(result.base_amount, config)}</b>
                                            <p>Computed from base rate ({amount(product.base_rate, config)}) and base strategy formula.</p>
                                        </div>
                                    </div>

                                    {/* Step 2: Applied Rules */}
                                    <div className="explanation-step">
                                        <div className="step-badge">2</div>
                                        <div className="step-content">
                                            <b>Pricing Adjustments ({result.trace.filter(t => t.status === 'applied').length} applied)</b>

                                            {result.trace.filter(t => t.status === 'applied').length === 0 ? (
                                                <p className="no-adjustments">No pricing rules matched. Base price remains unchanged.</p>
                                            ) : (
                                                <div className="applied-rules-list">
                                                    {result.trace.filter(t => t.status === 'applied').map((t, idx) => {
                                                        const isDiscount = Number(t.delta) < 0;
                                                        return (
                                                            <div key={idx} className={`rule-applied-card ${isDiscount ? 'discount' : 'markup'}`}>
                                                                <div className="rule-applied-icon">
                                                                    {isDiscount ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                                                                </div>
                                                                <div className="rule-applied-text">
                                                                    <b>{t.name}</b>
                                                                    <small>{isDiscount ? 'Discount applied' : 'Markup adjustment'}</small>
                                                                </div>
                                                                <div className="rule-applied-amount">
                                                                    <span className="delta-val">
                                                                        {Number(t.delta) > 0 ? '+' : ''}{amount(t.delta, config)}
                                                                    </span>
                                                                    <span className="running-subtotal">
                                                                        → {amount(t.after, config)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Step 3: Final Bounds & Rounding */}
                                    <div className="explanation-step">
                                        <div className="step-badge">3</div>
                                        <div className="step-content">
                                            <b>Min/Max Bounds & Rounding</b>
                                            <p>Final result checked against policy boundaries and rounded to standard increments.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Toggle for Technical Engine Trace */}
                                <div className="technical-toggle-area">
                                    <button
                                        className="text-button technical-btn"
                                        onClick={() => setShowTechnical(!showTechnical)}
                                    >
                                        <HelpCircle size={15} />
                                        {showTechnical ? 'Hide Technical Engine Details' : 'View Technical Engine Trace'}
                                    </button>
                                </div>

                                {showTechnical && (
                                    <div className="technical-trace-drawer">
                                        <h5>Complete Rule Evaluation Log</h5>
                                        {result.trace.map((t, idx) => (
                                            <div key={idx} className={`tech-trace-item ${t.status}`}>
                                                <div className="tech-trace-header">
                                                    <b>{t.name}</b>
                                                    <span className={`status-pill ${t.status}`}>{t.status}</span>
                                                </div>
                                                {t.reason && <small>{t.reason}</small>}
                                                {t.delta !== undefined && (
                                                    <div className="tech-trace-math">
                                                        <span>Adjustment: {t.delta}</span>
                                                        <span>Subtotal: {t.after}</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="empty-result-state">
                            <Calculator size={48} className="text-muted" />
                            <h3>Ready to Calculate Price</h3>
                            <p>Select your product parameters on the left and click <strong>Calculate Price</strong> to see the exact price breakdown and explanation.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
