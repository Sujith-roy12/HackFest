# Monetize360 — ML Dataset, Customer Behavior & Profit Optimization Reference

> **Overview**: This document explains the exact dataset attributes and target label used to train the customer conversion ML model, what the model predicts, what outputs it produces for candidate prices, and how it balances customer purchase probability with business profit protection.

---

## 1. The Dataset Used for Training

The ML model was trained on **95,389 customer quote interaction records** created by joining quotes (`price_history.csv`), outcomes (`transactions.csv`), customer demographics (`customers.csv`), catalog economics (`products.csv`), and market conditions (`context_signals.csv`).

### 1.1 The Target Label ($y$)

| Label Column | Type | Values | Source Table | Business Meaning |
|---|---|---|---|---|
| **`purchased`** | Binary Integer | **`1`** or **`0`** | `transactions.csv` | **1** = Customer accepted the price and completed the purchase.<br>**0** = Customer rejected the price and walked away. |

> [!IMPORTANT]
> **Why Non-Purchases (`0`) Are Essential:**
> Traditional sales datasets only record completed orders. If an ML model only sees completed sales, it has no way of knowing when a price was too expensive. By including every quote attempt where customers said "No", the model learns true **price sensitivity** and **drop-off thresholds**.

---

### 1.2 Training Features Matrix ($X$)

The model transforms raw data into **27 behavioral and economic features**:

#### A. Price & Psychological Anchoring Features (Numeric)
These are **dimensionless relative ratios** that allow the model to understand human price perception across any industry:

| Feature | Type | Derivation / Formula | Psychological Purpose |
|---|---|---|---|
| `price_ratio` | Float | $\frac{\text{quoted\_price}}{\text{base\_price}}$ | **Anchoring Bias**: How high/low the price feels relative to the catalog anchor ($<1.0$ feels like a deal, $>1.0$ feels expensive). |
| `log_price_ratio` | Float | $\ln(\text{price\_ratio})$ | Normalizes price ratio distribution for linear stability. |
| `log_quoted_price` | Float | $\ln(\text{quoted\_price})$ | Log-scale absolute price level. |
| `price_vs_competitor` | Float | $\frac{\text{quoted\_price}}{\text{competitor\_min\_price}}$ | **Reference Dependence**: How competitive the price is versus the cheapest market rival ($>1.05$ triggers customer walk-away). |
| `log_base_price` | Float | $\ln(\text{base\_price})$ | Product reference tier scale. |
| `exploration_flag` | Binary | `0` or `1` | Identifies quotes that received randomized $\pm 10\%$ exploration perturbations to prevent endogeneity confounding. |

#### B. Market Context & Urgency Features (Numeric)
| Feature | Type | Values / Units | Purpose |
|---|---|---|---|
| `demand_index` | Float | `0.5` (low) to `2.0` (surge) | Macro market demand and browsing velocity. |
| `inventory_on_hand`| Integer | Count (e.g. `20` to `200`) | Current warehouse stock remaining. |
| `sell_through` | Float | $0.0$ to $1.0$ | Cumulative fraction of capacity sold so far. |
| `is_weekend` | Binary | `1` (Sat/Sun) or `0` (Weekday) | Weekend browsing vs weekday purchasing mindset. |
| `flash_sale_active`| Binary | `1` (Active) or `0` (Normal) | Urgency signal from promotional events. |
| `is_perishable` | Binary | `1` (Expires) or `0` (Durable) | Whether unsold inventory spoils or loses value over time. |

#### C. Customer Behavioral Persona Features (Categorical - One-Hot Encoded)
| Feature | Categories | Behavioral Definition |
|---|---|---|
| **`segment`** | `budget_conscious` | Highly price-sensitive (elasticity $\beta = 1.6\times$); shops for lowest cost. |
| | `deal_seeking` | Promotion-driven; buys when discounts and perceived deal quality are high. |
| | `business` | Low price sensitivity ($\beta = 0.7\times$); values urgency, speed, and reliability. |
| | `impulsive` | High conversion rate; quick decisions without extensive competitor comparison. |
| | `loyal` | Brand-attached; repeat buyer who values loyalty status and recognition. |
| **`loyalty_tier`** | `bronze`, `silver`, `gold`, `platinum` | Cumulative relationship status with the business. |
| **`season`** | `winter`, `spring`, `summer`, `autumn` | Seasonal retail cycle. |
| **`category`** | `electronics`, `fashion`, `grocery`, `home`, `beauty` | Product department. |

---

### 1.3 Strictly Excluded Fields (Zero Data Leakage)
To prevent the model from "cheating", the following fields from `transactions.csv` are **never** fed into features ($X$):
* `revenue`, `profit`, `cost` *(only exist after a purchase occurs)*.
* `quantity`, `time_to_decide`, `outcome_timestamp` *(occur post-decision)*.
* `purchase_probability` *(oracle simulator value, reserved strictly for offline validation benchmark)*.

---

## 2. What the ML Model Predicts

The ML model (`GradientBoostingClassifier`, 200 trees) solves a **probabilistic binary classification task**:

$$\hat{P}(\text{buy}) = P(\text{purchased} = 1 \mid \mathbf{x}_{\text{price}}, \mathbf{x}_{\text{customer}}, \mathbf{x}_{\text{context}}) \in [0.0, 1.0]$$

* It outputs a **continuous probability score between 0% and 100%**.
* It answers: *"Given this specific customer persona, this competitor environment, and this proposed price, what is the probability that the customer will convert?"*

---

## 3. What Output the System Gives

When given 4 to 5 candidate prices, the system evaluates each candidate and outputs a **Candidate Price Optimization Report**:

```text
================================================================================
MONETIZE360 -- CANDIDATE PRICE OPTIMIZATION REPORT
Product: Sample Item | Base Price: $50.00 | Unit Cost: $35.00
Customer Segment: deal_seeking | Competitor Benchmark: $51.00
================================================================================
Candidate   | Unit Margin   | Margin %   | P(Buy)     | Exp. Profit   | Exp. Revenue   | Verdict                  
------------------------------------------------------------------------------------------------------------------
$40.00      | $+5.00        | 12.5%      | 83.8%      | $4.19         | $33.51         | REJECTED (Lower Profit)  
$50.00      | $+15.00       | 30.0%      | 73.2%      | $10.98        | $36.59         | REJECTED (Lower Profit)  
$60.00      | $+25.00       | 41.7%      | 59.5%      | $14.88        | $35.71         | REJECTED (Lower Profit)  
$70.00      | $+35.00       | 50.0%      | 48.8%      | $17.08        | $34.16         | WINNER (Optimal Trade-off)
$80.00      | $+45.00       | 56.2%      | 40.9%      | $18.41        | $32.73         | DISQUALIFIED (Ceiling Exceeded)
------------------------------------------------------------------------------------------------------------------

RECOMMENDED WINNING PRICE: $70.00
  • Expected Profit  : $17.08 per quote attempt
  • Conversion Rate  : 48.8% chance customer buys
  • Margin per Unit  : $35.00 (50.0%)
  • Loss Prevention  : $35.00 safety buffer above cost
```

### Explaining the Output Columns:
1. **`Candidate`**: The proposed price point being tested.
2. **`Unit Margin`**: Gross profit earned per sale ($\text{Price} - \text{Unit Cost}$).
3. **`Margin %`**: Profit percentage ($\frac{\text{Unit Margin}}{\text{Price}} \times 100$).
4. **`P(Buy)`**: ML-predicted probability that the customer converts at this price.
5. **`Exp. Profit`**: Mathematically expected profit per quote ($\text{Unit Margin} \times P(\text{Buy})$).
6. **`Exp. Revenue`**: Expected gross transaction volume ($\text{Price} \times P(\text{Buy})$).
7. **`Verdict`**: The final business decision for this candidate price:
   * **`WINNER (Optimal Trade-off)`**: The price that yields the highest total expected profit while respecting all business constraints.
   * **`REJECTED (Lower Profit)`**: Fully safe price, but leaves profit on the table.
   * **`DISQUALIFIED (Sells at Loss)`**: Rejected because price is below unit cost.
   * **`DISQUALIFIED (Ceiling Exceeded)`**: Rejected because price exceeds maximum policy markup (+50% ceiling).

---

## 4. How It Balances Customer Conversion AND Business Profit

A common mistake in pricing algorithms is focusing on only one side of the transaction:
* **Focusing only on the customer**: The algorithm slashes prices to \$10. Everyone buys ($P(\text{buy}) = 99\%$), but the business goes bankrupt.
* **Focusing only on margin**: The algorithm sets prices to \$500. Margin is huge (\$465), but zero customers buy ($P(\text{buy}) = 0\%$), earning \$0.

Monetize360 harmonizes both sides through **Expected Profit Optimization with Hard Guardrails**:

```
     CUSTOMER SIDE (Demand Economics)                 BUSINESS SIDE (Unit Economics)
┌────────────────────────────────────────┐       ┌──────────────────────────────────────┐
│  • Price Elasticity (Down-sloping)     │       │  • Unit Cost Floor ($35.00)          │
│  • Competitor Reference Point          │   X   │  • Margin per Item (Price - Cost)    │
│  • Customer Persona Sensitivity        │       │  • Maximum Markup Ceiling (+50%)     │
└───────────────────┬────────────────────┘       └──────────────────┬───────────────────┘
                    │                                               │
                    └───────────────────────┬───────────────────────┘
                                            │
                                            ▼
                         EXPECTED BUSINESS PROFIT CURVE
                   E[Profit] = P(buy | price) x (price - cost)
                                            │
                                            ▼
                         Select Price that Maximizes E[Profit]
                         Subject to: Price >= Unit Cost * 1.05
```

### The Math of the Sweet Spot:
Take a product with **Unit Cost = \$35.00**:

| Tested Price | Customer $P(\text{Buy})$ | Unit Margin | Expected Profit Calculation | Result |
|---|---|---|---|---|
| **\$30.00** | $92\%$ (Loves the price) | **$-\$5.00$ (Loss)** | $0.92 \times (-\$5.00) = \mathbf{-\$4.60}$ | ❌ **Disqualified**: Loss-making |
| **\$40.00** | $84\%$ (High conversion) | $+\$5.00$ (Thin margin)| $0.84 \times (+\$5.00) = \mathbf{+\$4.20}$ | ⚠️ Suboptimal: Too cheap |
| **\$50.00** | $73\%$ (Good conversion) | $+\$15.00$ | $0.73 \times (+\$15.00) = \mathbf{+\$10.95}$ | ⚠️ Good, but can improve |
| **\$70.00** | **$49\%$ (Moderate)** | **$+\$35.00$ (Healthy)**| $0.49 \times (+\$35.00) = \mathbf{+\$17.15}$ | 🏆 **WINNER: Maximum Profit!** |
| **\$95.00** | $15\%$ (Too expensive) | $+\$60.00$ (High margin)| $0.15 \times (+\$60.00) = \mathbf{+\$9.00}$ | 📉 Drops: Customers walk away |

### The 3 Built-in Protections:
1. **Never Sell at a Loss**: If a candidate price is lower than unit cost, it is flagged `DISQUALIFIED (Sells at Loss)` and eliminated before ranking.
2. **Never Price Gouge**: If a price exceeds the policy ceiling (e.g., $+50\%$ above catalog base price), it is flagged `DISQUALIFIED (Ceiling Exceeded)`.
3. **Global Profit Maximization**: Among all safe candidate prices, the system automatically selects the price where **Volume $\times$ Margin** hits its absolute mathematical peak.

---

## 5. Quick CLI Usage

To evaluate any 4 to 5 prices on demand:

```powershell
python crm/predict_best_price.py --prices 40.0 50.0 60.0 70.0 80.0 --unit-cost 35.0 --base-price 50.0 --segment deal_seeking
```
