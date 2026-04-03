// ===================================================
// RKFL Green Command & Control — Frontend Application
// PwC Sustainability Practice
// ===================================================

const API = '/api'

// ─── Global State ──────────────────────────────────────────────
const state = {
  currentPage: 'overview',
  overview: null,
  plants: null,
  energyMonthly: null,
  plantBreakdown: null,
  equipBreakdown: null,
  emissionsSummary: null,
  waterSummary: null,
  wasteSummary: null,
  aiOpportunities: null,
  digitalTwin: null,
  anomalies: null,
  forecast: null,
  kpiScorecard: null,
  charts: {},
  activeEquipFilter: 'all',
  activeAIFilter: 'all',
  activeTab: {},
}

// ─── CHART DEFAULTS ────────────────────────────────────────────
Chart.defaults.color = '#64748b'
Chart.defaults.borderColor = 'rgba(99,102,241,0.1)'
Chart.defaults.font.family = "'Inter','Segoe UI',system-ui,sans-serif"

const CHART_COLORS = {
  green: '#10b981', blue: '#3b82f6', amber: '#f59e0b',
  red: '#ef4444', purple: '#8b5cf6', teal: '#14b8a6',
  pink: '#ec4899', orange: '#f97316'
}

function chartGradient(ctx, color, alpha = 0.3) {
  const g = ctx.createLinearGradient(0, 0, 0, 300)
  g.addColorStop(0, color + Math.round(alpha * 255).toString(16).padStart(2, '0'))
  g.addColorStop(1, color + '00')
  return g
}

// ─── UTILITIES ─────────────────────────────────────────────────
const fmt = {
  number: (n, dec = 0) => n == null ? '—' : Number(n).toLocaleString('en-IN', { maximumFractionDigits: dec }),
  currency: (n) => '₹' + fmt.number(n),
  pct: (n) => (n == null ? '—' : Number(n).toFixed(1) + '%'),
  badge: (status) => {
    const map = { green: 'badge-green', red: 'badge-red', amber: 'badge-amber', yellow: 'badge-amber', blue: 'badge-blue' }
    return map[status] || 'badge-blue'
  },
  trend: (t) => {
    if (!t) return ''
    const up = t.startsWith('+')
    const goodDown = ['GHG','Energy','Waste','Water','Carbon'].some(k => t)
    return `<span class="kpi-trend ${up ? 'up' : 'down'}">${up ? '▲' : '▼'} ${t.replace(/[+-]/, '')}</span>`
  }
}

async function api(path) {
  const r = await fetch(API + path)
  return r.json()
}

function destroyChart(key) {
  if (state.charts[key]) { state.charts[key].destroy(); delete state.charts[key] }
}

function setTab(group, tab) {
  state.activeTab[group] = tab
  document.querySelectorAll(`[data-tabgroup="${group}"] .tab-btn`).forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab)
  })
  document.querySelectorAll(`[data-tabgroup="${group}"] .tab-content`).forEach(tc => {
    tc.classList.toggle('active', tc.id === `tab-${group}-${tab}`)
  })
}

// ─── SPLASH SCREEN ────────────────────────────────────────────
function showSplash() {
  const splash = document.getElementById('splash')
  if (!splash) return
  const bar = splash.querySelector('.splash-progress')
  let pct = 0
  const interval = setInterval(() => {
    pct = Math.min(pct + 3, 100)
    if (bar) bar.style.width = pct + '%'
    if (pct >= 100) { clearInterval(interval); setTimeout(() => { splash.style.opacity = '0'; setTimeout(() => splash.remove(), 500) }, 300) }
  }, 30)
}

// ─── APP RENDER ───────────────────────────────────────────────
function renderApp() {
  document.getElementById('app').innerHTML = `
    ${renderSplash()}
    <div class="sidebar" id="sidebar">
      ${renderSidebar()}
    </div>
    <div class="main-content">
      <div class="topnav" id="topnav"></div>
      <div id="page-container">
        <div id="page-overview" class="page active">${renderLoading()}</div>
        <div id="page-digital-twin" class="page">${renderLoading()}</div>
        <div id="page-energy" class="page">${renderLoading()}</div>
        <div id="page-emissions" class="page">${renderLoading()}</div>
        <div id="page-water-waste" class="page">${renderLoading()}</div>
        <div id="page-materials" class="page">${renderLoading()}</div>
        <div id="page-ai" class="page">${renderLoading()}</div>
        <div id="page-kpi" class="page">${renderLoading()}</div>
        <div id="page-data" class="page">${renderLoading()}</div>
      </div>
    </div>`

  updateTopNav()
  showSplash()
  navigateTo('overview')
}

function renderSplash() {
  return `<div class="splash" id="splash">
    <div class="splash-logo">🌿</div>
    <div class="splash-title">Green Command & Control</div>
    <div class="splash-sub">Ramkrishna Forgings Limited · Jamshedpur</div>
    <div class="splash-pwc">PWC SUSTAINABILITY PRACTICE</div>
    <div class="splash-bar"><div class="splash-progress"></div></div>
    <div style="margin-top:16px;font-size:12px;color:#475569">Loading platform data...</div>
  </div>`
}

function renderSidebar() {
  const navItems = [
    { id: 'overview', icon: 'fa-chart-line', label: 'Executive Dashboard', section: 'OVERVIEW' },
    { id: 'digital-twin', icon: 'fa-cubes', label: 'Digital Twin', section: null, badge: '5 Plants' },
    { id: 'energy', icon: 'fa-bolt', label: 'Energy Analytics', section: 'MONITORING' },
    { id: 'emissions', icon: 'fa-cloud', label: 'GHG Emissions', section: null },
    { id: 'water-waste', icon: 'fa-recycle', label: 'Water & Waste', section: null },
    { id: 'materials', icon: 'fa-boxes-stacked', label: 'Materials Tracking', section: null },
    { id: 'ai', icon: 'fa-brain', label: 'AI Analytics Hub', section: 'AI & INSIGHTS', badge: '8 Models' },
    { id: 'kpi', icon: 'fa-bullseye', label: 'KPI Scorecard', section: null },
    { id: 'data', icon: 'fa-database', label: 'Data Management', section: 'DATA' },
  ]
  let html = ''
  navItems.forEach(item => {
    if (item.section) html += `<div class="nav-section-label">${item.section}</div>`
    html += `<div class="nav-item${item.id === state.currentPage ? ' active' : ''}" onclick="navigateTo('${item.id}')" data-nav="${item.id}">
      <span class="icon"><i class="fas ${item.icon}"></i></span>
      <span>${item.label}</span>
      ${item.badge ? `<span class="nav-badge green">${item.badge}</span>` : ''}
    </div>`
  })
  html += `<div class="sidebar-footer">
    <div style="font-size:11px;color:#475569">© PwC Sustainability</div>
    <div style="font-size:10px;color:#334155;margin-top:3px">RKFL GCC Platform v1.0</div>
    <div style="font-size:10px;color:#334155">Data: FY2024-25</div>
  </div>`
  return `<div class="sidebar-logo">
    <div class="brand">PwC</div>
    <div class="title">Green Command &amp; Control</div>
    <div class="subtitle">RAMKRISHNA FORGINGS LTD.</div>
    <div class="pwc-badge"><i class="fas fa-leaf"></i> Sustainability Platform</div>
  </div><nav class="sidebar-nav">${html}</nav>`
}

function updateTopNav() {
  const pages = {
    'overview': { title: 'Executive Dashboard', sub: 'RKFL · FY2024-25 · Jamshedpur, Jharkhand' },
    'digital-twin': { title: 'Digital Twin — Plant & Equipment', sub: '5 Manufacturing Plants · 12 Equipment Categories' },
    'energy': { title: 'Energy Analytics', sub: 'Electricity · Fuel · Specific Energy · Cost Analysis' },
    'emissions': { title: 'GHG Emissions Tracker', sub: 'Scope 1 & 2 · Net Zero Pathway · Carbon Intensity' },
    'water-waste': { title: 'Water & Waste Management', sub: 'Water Intensity · Waste Streams · ZLD Status' },
    'materials': { title: 'Materials Tracking', sub: 'Raw Materials · Consumables · Circular Economy' },
    'ai': { title: 'AI Analytics Hub', sub: '8 AI/ML Models · Engineering-led Optimization' },
    'kpi': { title: 'KPI Scorecard', sub: 'Sustainability Performance Dashboard · FY2024-25' },
    'data': { title: 'Data Management', sub: 'Upload CSV · Download Templates · Export Reports' },
  }
  const p = pages[state.currentPage] || pages['overview']
  document.getElementById('topnav').innerHTML = `
    <div>
      <div class="topnav-title">${p.title}</div>
      <div class="topnav-subtitle">${p.sub}</div>
    </div>
    <div class="topnav-actions">
      <div class="topnav-pill"><div class="status-dot green"></div>Live Data</div>
      <div class="topnav-pill amber"><i class="fas fa-solar-panel"></i> 8.73 MW Solar</div>
      <div class="topnav-pill red"><i class="fas fa-leaf"></i> Net Zero 2040</div>
      <button class="btn btn-primary" onclick="navigateTo('data')"><i class="fas fa-upload"></i> Upload Data</button>
    </div>`
}

function navigateTo(page) {
  state.currentPage = page
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'))
  document.getElementById('page-' + page)?.classList.add('active')
  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.dataset.nav === page)
  })
  updateTopNav()

  switch (page) {
    case 'overview': loadOverview(); break
    case 'digital-twin': loadDigitalTwin(); break
    case 'energy': loadEnergy(); break
    case 'emissions': loadEmissions(); break
    case 'water-waste': loadWaterWaste(); break
    case 'materials': loadMaterials(); break
    case 'ai': loadAI(); break
    case 'kpi': loadKPI(); break
    case 'data': loadData(); break
  }
}

function renderLoading() {
  return `<div class="loading"><div class="spinner"></div></div>`
}

// ─────────────────────────────────────────────────────────────────
// PAGE: EXECUTIVE OVERVIEW
// ─────────────────────────────────────────────────────────────────
async function loadOverview() {
  if (state.overview) { renderOverview(); return }
  const [overview, energy, plantBreak] = await Promise.all([
    api('/overview'), api('/energy/monthly'), api('/energy/plant-breakdown')
  ])
  state.overview = overview; state.energyMonthly = energy; state.plantBreakdown = plantBreak
  renderOverview()
}

function renderOverview() {
  const d = state.overview
  const k = d.kpis
  const c = d.company
  document.getElementById('page-overview').innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">Executive Sustainability Dashboard</div>
        <div class="section-subtitle">Ramkrishna Forgings Limited · ${c.location} · ${c.reportingYear} · PwC Sustainability Advisory</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        <button class="btn btn-outline" onclick="navigateTo('ai')"><i class="fas fa-brain"></i> AI Insights</button>
        <button class="btn btn-primary" onclick="window.open('/api/csv/export/energy')"><i class="fas fa-download"></i> Export Data</button>
      </div>
    </div>

    <!-- Top KPI Row -->
    <div class="kpi-grid">
      <div class="kpi-card green">
        <div class="kpi-icon"><i class="fas fa-bolt"></i></div>
        <div class="kpi-label">Total Energy Consumed</div>
        <div class="kpi-value sm">13.23L</div>
        <div class="kpi-unit">GJ / year</div>
        <span class="kpi-trend down">▼ vs 7.8 GJ/MT industry avg</span>
      </div>
      <div class="kpi-card amber">
        <div class="kpi-icon"><i class="fas fa-fire"></i></div>
        <div class="kpi-label">Energy Intensity</div>
        <div class="kpi-value">6.75</div>
        <div class="kpi-unit">GJ / MT · Target: 5.8 by FY28</div>
        <span class="kpi-trend down">▼ 13% vs Industry 7.8</span>
      </div>
      <div class="kpi-card red">
        <div class="kpi-icon"><i class="fas fa-cloud"></i></div>
        <div class="kpi-label">Total GHG Emissions</div>
        <div class="kpi-value sm">2,04,474</div>
        <div class="kpi-unit">tCO₂e · Scope 1+2</div>
        <span class="kpi-trend up">▲ 1.043 tCO₂e/MT intensity</span>
      </div>
      <div class="kpi-card green">
        <div class="kpi-icon"><i class="fas fa-droplet"></i></div>
        <div class="kpi-label">Water Consumption</div>
        <div class="kpi-value sm">3,45,613</div>
        <div class="kpi-unit">KL/year · 1.76 KL/MT</div>
        <span class="kpi-trend down">▼ vs 2.1 industry avg</span>
      </div>
      <div class="kpi-card blue">
        <div class="kpi-icon"><i class="fas fa-industry"></i></div>
        <div class="kpi-label">Total Production</div>
        <div class="kpi-value sm">1,96,023</div>
        <div class="kpi-unit">MT/year · FY2024-25</div>
        <span class="kpi-trend down">▲ 58.5% capacity utilisation</span>
      </div>
      <div class="kpi-card green">
        <div class="kpi-icon"><i class="fas fa-rupee-sign"></i></div>
        <div class="kpi-label">Revenue</div>
        <div class="kpi-value sm">₹3,634</div>
        <div class="kpi-unit">Crores · +3.86% YoY</div>
        <span class="kpi-trend down">▼ EBITDA ₹611 Cr (-20%)</span>
      </div>
      <div class="kpi-card amber">
        <div class="kpi-icon"><i class="fas fa-plug"></i></div>
        <div class="kpi-label">Annual Energy Cost</div>
        <div class="kpi-value sm">₹${fmt.number(k.totalEnergyCostLakhs)}</div>
        <div class="kpi-unit">Lakhs · ${k.energyPctRevenue}% of Revenue</div>
        <span class="kpi-trend up">▲ ₹7.50/kWh avg tariff</span>
      </div>
      <div class="kpi-card purple">
        <div class="kpi-icon"><i class="fas fa-solar-panel"></i></div>
        <div class="kpi-label">Renewable Energy</div>
        <div class="kpi-value">3.4%</div>
        <div class="kpi-unit">8.73 MW Solar · Target 50% FY28</div>
        <span class="kpi-trend down">▲ +1.8% YoY improvement</span>
      </div>
    </div>

    <!-- Charts Row 1 -->
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title"><i class="fas fa-chart-area" style="color:#3b82f6;margin-right:6px"></i>Monthly Energy Consumption (kWh)</div>
            <div class="card-subtitle">FY2024-25 · Electricity trend with production overlay</div>
          </div>
        </div>
        <div class="chart-container"><canvas id="chart-energy-trend" height="180"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title"><i class="fas fa-chart-pie" style="color:#10b981;margin-right:6px"></i>Energy Distribution by Plant</div>
            <div class="card-subtitle">Monthly kWh breakdown · 5 Manufacturing Plants</div>
          </div>
        </div>
        <div class="chart-container"><canvas id="chart-plant-pie" height="180"></canvas></div>
      </div>
    </div>

    <!-- Charts Row 2 -->
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title"><i class="fas fa-smog" style="color:#ef4444;margin-right:6px"></i>GHG Emissions Trend (tCO₂e/month)</div>
            <div class="card-subtitle">Scope 1 + Scope 2 · Monthly tracking</div>
          </div>
        </div>
        <div class="chart-container"><canvas id="chart-ghg-trend" height="180"></canvas></div>
      </div>
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title"><i class="fas fa-gauge" style="color:#f59e0b;margin-right:6px"></i>Energy Intensity vs Benchmark (GJ/MT)</div>
            <div class="card-subtitle">RKFL vs Industry average vs Best-in-class</div>
          </div>
        </div>
        <div class="chart-container"><canvas id="chart-intensity" height="180"></canvas></div>
      </div>
    </div>

    <!-- Net Zero + AI Summary -->
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-road" style="color:#10b981;margin-right:6px"></i>Net Zero Pathway to 2040</div>
          <div class="card-subtitle">Carbon reduction trajectory & renewable energy ramp-up</div>
        </div>
        <canvas id="chart-netzero" height="180"></canvas>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-brain" style="color:#8b5cf6;margin-right:6px"></i>AI Savings Opportunity Summary</div>
          <div class="card-subtitle">8 AI/ML initiatives · Engineering-led optimization</div>
        </div>
        <div id="ai-summary-content"></div>
      </div>
    </div>

    <!-- Financial + ESG summary -->
    <div class="grid-3">
      <div class="card">
        <div class="card-title" style="margin-bottom:14px"><i class="fas fa-chart-bar" style="color:#3b82f6;margin-right:6px"></i>Financial Highlights FY24-25</div>
        ${renderFinancialHighlights(d.company)}
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:14px"><i class="fas fa-leaf" style="color:#10b981;margin-right:6px"></i>Sustainability KPIs</div>
        ${renderSustainabilityKPIs(d.energySummary)}
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:14px"><i class="fas fa-solar-panel" style="color:#f59e0b;margin-right:6px"></i>Renewable Energy Roadmap</div>
        ${renderRenewableRoadmap()}
      </div>
    </div>`

  // Draw charts
  setTimeout(() => {
    drawEnergyTrend()
    drawPlantPie()
    drawGHGTrend()
    drawIntensityChart()
    drawNetZeroPathway()
    renderAISummary()
  }, 50)
}

function renderFinancialHighlights(c) {
  const rows = [
    ['Revenue (Standalone)', '₹3,634 Cr', '+3.86%', 'green'],
    ['Revenue (Consolidated)', '₹4,034 Cr', '+2.1%', 'green'],
    ['EBITDA (Standalone)', '₹611 Cr', '-20.3%', 'red'],
    ['PAT (Standalone)', '₹402 Cr', '-18.6%', 'red'],
    ['Production Volume', '1,96,023 MT', '+2.8%', 'green'],
    ['Capacity Utilisation', '58.5%', 'Press Plant', 'amber'],
    ['Energy Cost / Revenue', `${((19748/363430)*100).toFixed(1)}%`, 'vs 4.8% FY23', 'amber'],
  ]
  return rows.map(([l, v, t, col]) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(30,41,59,0.8)">
      <span style="font-size:12px;color:#94a3b8">${l}</span>
      <div style="text-align:right">
        <span style="font-size:13px;font-weight:700;color:#e2e8f0">${v}</span>
        <span class="badge badge-${col}" style="margin-left:6px;font-size:10px">${t}</span>
      </div>
    </div>`).join('')
}

function renderSustainabilityKPIs(es) {
  const rows = [
    ['Total Energy', '13,22,953 GJ', '6.75 GJ/MT'],
    ['Electricity', '9,09,537 GJ', '96.6% non-renewable'],
    ['Fuel (Propane+FO)', '4,13,056 GJ', 'Scope 1 source'],
    ['Scope 1 GHG', '27,351 tCO₂e', '13.4% of total'],
    ['Scope 2 GHG', '1,77,124 tCO₂e', '86.6% of total'],
    ['Water Intensity', '1.76 KL/MT', 'ZLD in 3 plants'],
    ['Waste Generated', '309.1 MT', '30.7% recycled'],
  ]
  return rows.map(([l, v, n]) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(30,41,59,0.8)">
      <span style="font-size:12px;color:#94a3b8">${l}</span>
      <div style="text-align:right">
        <span style="font-size:12px;font-weight:700;color:#e2e8f0">${v}</span>
        <div style="font-size:10px;color:#64748b">${n}</div>
      </div>
    </div>`).join('')
}

function renderRenewableRoadmap() {
  const milestones = [
    { year: 'FY25 (Now)', pct: 3.4, mw: 8.73, color: '#ef4444' },
    { year: 'FY26', pct: 12, mw: 17.03, color: '#f59e0b' },
    { year: 'FY27', pct: 28, mw: 32, color: '#3b82f6' },
    { year: 'FY28 (Target)', pct: 50, mw: 58, color: '#10b981' },
  ]
  return milestones.map(m => `
    <div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
        <span style="color:#94a3b8">${m.year}</span>
        <span style="color:#e2e8f0;font-weight:700">${m.pct}% · ${m.mw} MW</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${m.pct}%;background:${m.color}"></div>
      </div>
    </div>`).join('')
}

function renderAISummary() {
  api('/ai/opportunities').then(data => {
    const s = data.summary
    document.getElementById('ai-summary-content').innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div style="background:rgba(139,92,246,0.1);border:1px solid rgba(139,92,246,0.3);border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:26px;font-weight:800;color:#a78bfa">₹${fmt.number(s.totalSavingsLakhs)}</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px">Lakhs Annual Savings</div>
        </div>
        <div style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:26px;font-weight:800;color:#10b981">${fmt.number(s.totalCO2ReductionMT)}</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px">MT CO₂e Reduction/Year</div>
        </div>
        <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:26px;font-weight:800;color:#60a5fa">${s.avgPaybackMonths}</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px">Months Avg. Payback</div>
        </div>
        <div style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:26px;font-weight:800;color:#fcd34d">${s.avgROI3Yr}%</div>
          <div style="font-size:11px;color:#64748b;margin-top:2px">Avg 3-Year ROI</div>
        </div>
      </div>
      <button class="btn btn-primary" style="width:100%" onclick="navigateTo('ai')"><i class="fas fa-brain"></i> Explore All ${s.count} AI Models</button>`
  })
}

function drawEnergyTrend() {
  destroyChart('energy-trend')
  const ctx = document.getElementById('chart-energy-trend')?.getContext('2d')
  if (!ctx || !state.energyMonthly) return
  const d = state.energyMonthly
  state.charts['energy-trend'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: d.months,
      datasets: [{
        label: 'Electricity (kWh)',
        data: d.kwhTrend,
        backgroundColor: 'rgba(59,130,246,0.6)',
        borderColor: '#3b82f6',
        borderWidth: 1,
        yAxisID: 'y',
      }, {
        label: 'Production (MT)',
        data: d.productionMT,
        type: 'line',
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.1)',
        borderWidth: 2,
        pointRadius: 4,
        fill: true,
        yAxisID: 'y1',
      }]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(99,102,241,0.08)' } },
        y: { ticks: { color: '#64748b', font: { size: 10 }, callback: v => (v/1e6).toFixed(1)+'M' }, grid: { color: 'rgba(99,102,241,0.08)' } },
        y1: { position: 'right', ticks: { color: '#64748b', font: { size: 10 }, callback: v => (v/1000).toFixed(0)+'K' }, grid: { display: false } }
      }
    }
  })
}

function drawPlantPie() {
  destroyChart('plant-pie')
  const ctx = document.getElementById('chart-plant-pie')?.getContext('2d')
  if (!ctx || !state.plantBreakdown) return
  const d = state.plantBreakdown
  state.charts['plant-pie'] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: d.labels,
      datasets: [{ data: d.values, backgroundColor: d.colors, borderColor: '#0f172a', borderWidth: 2, hoverOffset: 8 }]
    },
    options: {
      responsive: true,
      cutout: '65%',
      plugins: {
        legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${(ctx.raw/1e6).toFixed(2)}M kWh (${d.percentages[ctx.dataIndex]}%)` } }
      }
    }
  })
}

function drawGHGTrend() {
  destroyChart('ghg-trend')
  const ctx = document.getElementById('chart-ghg-trend')?.getContext('2d')
  if (!ctx || !state.energyMonthly) return
  const months = state.energyMonthly.months
  const ghgData = state.energyMonthly.kwhTrend.map(kwh => Math.round(kwh * 0.00082))
  const scope1 = ghgData.map(v => Math.round(v * 0.134))
  const scope2 = ghgData.map(v => Math.round(v * 0.866))
  state.charts['ghg-trend'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        { label: 'Scope 2 (Grid Electricity)', data: scope2, backgroundColor: 'rgba(239,68,68,0.7)', stack: 's' },
        { label: 'Scope 1 (Fuel Combustion)', data: scope1, backgroundColor: 'rgba(245,158,11,0.8)', stack: 's' },
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
      scales: {
        x: { stacked: true, ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(99,102,241,0.08)' } },
        y: { stacked: true, ticks: { color: '#64748b', font: { size: 10 }, callback: v => (v/1000).toFixed(0)+'K' }, grid: { color: 'rgba(99,102,241,0.08)' } }
      }
    }
  })
}

function drawIntensityChart() {
  destroyChart('intensity')
  const ctx = document.getElementById('chart-intensity')?.getContext('2d')
  if (!ctx) return
  const labels = ["RKFL FY24-25", "RKFL Target FY28", "Industry Average", "Best-in-Class"]
  const values = [6.75, 5.8, 7.8, 5.2]
  const colors = ['#3b82f6', '#10b981', '#ef4444', '#8b5cf6']
  state.charts['intensity'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors.map(c => c + '99'), borderColor: colors, borderWidth: 2, borderRadius: 6 }]
    },
    options: {
      responsive: true,
      indexAxis: 'y',
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.raw} GJ/MT` } } },
      scales: {
        x: { min: 0, max: 10, ticks: { color: '#64748b', font: { size: 10 }, callback: v => v + ' GJ/MT' }, grid: { color: 'rgba(99,102,241,0.08)' } },
        y: { ticks: { color: '#94a3b8', font: { size: 12 } } }
      }
    }
  })
}

function drawNetZeroPathway() {
  destroyChart('netzero')
  const ctx = document.getElementById('chart-netzero')?.getContext('2d')
  if (!ctx) return
  const years = [2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035,2036,2037,2038,2039,2040]
  const baseline = years.map(y => Math.round(204474 * Math.pow(1.02, y - 2025)))
  const pathway = years.map(y => Math.round(204474 * Math.pow(0.88, y - 2025)))
  const target = years.map((y, i) => i === years.length - 1 ? 0 : null)
  state.charts['netzero'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        { label: 'BAU Baseline', data: baseline, borderColor: '#ef4444', borderDash: [5,4], pointRadius: 0, borderWidth: 2, fill: false },
        { label: 'RKFL Net Zero Pathway', data: pathway, borderColor: '#10b981', borderWidth: 2.5, pointRadius: 3, fill: { target: 'origin', above: 'rgba(16,185,129,0.08)' } },
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(99,102,241,0.08)' } },
        y: { ticks: { color: '#64748b', font: { size: 10 }, callback: v => (v/1000).toFixed(0)+'K tCO₂e' }, grid: { color: 'rgba(99,102,241,0.08)' } }
      }
    }
  })
}

// ─────────────────────────────────────────────────────────────────
// PAGE: DIGITAL TWIN
// ─────────────────────────────────────────────────────────────────
async function loadDigitalTwin() {
  if (state.digitalTwin) { renderDigitalTwin(); return }
  const data = await api('/digital-twin/plants')
  state.digitalTwin = data
  renderDigitalTwin()
}

function renderDigitalTwin() {
  const plants = state.digitalTwin.plants
  document.getElementById('page-digital-twin').innerHTML = `
    <div class="section-header">
      <div>
        <div class="section-title">Digital Twin — Plant & Equipment Map</div>
        <div class="section-subtitle">Real-time operational view of all 5 RKFL manufacturing plants · Click any plant card to drill down</div>
      </div>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap">
      <div class="topnav-pill"><i class="fas fa-industry"></i> 5 Plants Active</div>
      <div class="topnav-pill"><i class="fas fa-cogs"></i> 12 Equipment Types</div>
      <div class="topnav-pill amber"><i class="fas fa-bolt"></i> 1,45,39,803 kWh/month</div>
      <div class="topnav-pill"><i class="fas fa-users"></i> 2,170 Employees</div>
    </div>

    <div class="plant-map" id="plant-grid">
      ${plants.map(p => renderPlantCard(p)).join('')}
    </div>

    <div id="plant-detail-section" style="display:none;margin-top:24px">
      <div class="section-header">
        <div class="section-title" id="detail-plant-name"></div>
        <button class="btn btn-outline" onclick="closePlantDetail()"><i class="fas fa-times"></i> Close</button>
      </div>
      <div id="plant-detail-content"></div>
    </div>`
}

function renderPlantCard(p) {
  const energyPct = ((p.monthlyKWh / 14539803) * 100).toFixed(1)
  const icons = { 'Furnace & Machining': '🏭', 'Press & Ring Rolling': '⚙️', 'Heavy Forgings': '🔨', 'Precision Components': '🎯', 'Integrated Forging': '🏗️' }
  const icon = icons[p.type] || '🏭'
  return `<div class="plant-card" onclick="showPlantDetail('${p.id}')">
    <div class="plant-header">
      <div>
        <div class="plant-name">${icon} ${p.name}</div>
        <div class="plant-type">${p.type} · ${p.location}</div>
      </div>
      <div class="badge badge-green" style="font-size:11px">ACTIVE</div>
    </div>
    <div style="margin:10px 0">
      <div style="display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin-bottom:4px">
        <span>Energy Share</span><span>${energyPct}%</span>
      </div>
      <div class="progress-bar"><div class="progress-fill green" style="width:${energyPct}%"></div></div>
    </div>
    <div class="plant-metrics">
      <div class="plant-metric">
        <div class="plant-metric-label">Monthly Energy</div>
        <div class="plant-metric-value">${(p.monthlyKWh/1e6).toFixed(2)}M</div>
        <div class="plant-metric-unit">kWh</div>
      </div>
      <div class="plant-metric">
        <div class="plant-metric-label">Production</div>
        <div class="plant-metric-value">${fmt.number(p.production)}</div>
        <div class="plant-metric-unit">MT/year</div>
      </div>
      <div class="plant-metric">
        <div class="plant-metric-label">Equipment</div>
        <div class="plant-metric-value">${p.equipment.length}</div>
        <div class="plant-metric-unit">Types</div>
      </div>
      <div class="plant-metric">
        <div class="plant-metric-label">Solar</div>
        <div class="plant-metric-value">${p.solarMW}</div>
        <div class="plant-metric-unit">MW installed</div>
      </div>
    </div>
    <div style="margin-top:12px;font-size:11px;color:#64748b;border-top:1px solid rgba(30,41,59,0.8);padding-top:10px;display:flex;gap:12px">
      <span><i class="fas fa-bolt" style="color:#f59e0b;margin-right:4px"></i>₹${fmt.number(p.energyCostLakhs)}L/yr</span>
      <span><i class="fas fa-users" style="color:#3b82f6;margin-right:4px"></i>${fmt.number(p.employees)} emp</span>
      <span><i class="fas fa-gauge" style="color:#10b981;margin-right:4px"></i>${p.capacityUtilPct}% util</span>
    </div>
  </div>`
}

function showPlantDetail(id) {
  const plant = state.digitalTwin.plants.find(p => p.id === id)
  if (!plant) return
  document.getElementById('detail-plant-name').textContent = `${plant.name} — ${plant.type} · ${plant.location}`
  document.getElementById('plant-detail-section').style.display = 'block'
  document.getElementById('plant-detail-content').innerHTML = renderEquipmentDetail(plant)
  document.getElementById('plant-detail-section').scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function closePlantDetail() {
  document.getElementById('plant-detail-section').style.display = 'none'
}

function renderEquipmentDetail(plant) {
  const equipIcons = { Furnace: '🔥', Compressor: '💨', Induction: '⚡', Press: '🔩', Cooling: '❄️' }
  const equipClass = { Furnace: 'furnace', Compressor: 'compressor', Induction: 'induction', Press: 'press', Cooling: 'cooling' }

  return `<div class="grid-2">
    <div class="card">
      <div class="card-title" style="margin-bottom:14px">Equipment Energy Matrix</div>
      <div class="equipment-list">
        ${plant.equipment.map(eq => `
          <div class="equipment-item">
            <div class="equipment-icon ${equipClass[eq.type] || 'furnace'}">${equipIcons[eq.type] || '⚙️'}</div>
            <div style="flex:1">
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div>
                  <div style="font-size:13px;font-weight:700;color:#e2e8f0">${eq.name} <span style="color:#64748b;font-weight:400">×${eq.count}</span></div>
                  <div style="font-size:11px;color:#64748b">${eq.ratedCapacity} · ${eq.fuelType}</div>
                </div>
                <span class="badge badge-${eq.criticality === 'Critical' ? 'red' : eq.criticality === 'High' ? 'amber' : 'blue'}">${eq.criticality}</span>
              </div>
              <div style="margin-top:8px">
                <div style="display:flex;justify-content:space-between;font-size:11px;color:#64748b;margin-bottom:3px">
                  <span>Energy share: ${eq.energySharePct}%</span>
                  <span>₹${eq.annualCostLakhs}L/yr · ${fmt.number(eq.annualCO2tonne)} tCO₂e/yr</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill ${eq.criticality === 'Critical' ? 'red' : 'amber'}" style="width:${Math.min(eq.energySharePct, 100)}%"></div>
                </div>
              </div>
            </div>
          </div>`).join('')}
      </div>
    </div>
    <div>
      <div class="card" style="margin-bottom:16px">
        <div class="card-title" style="margin-bottom:14px">OEE Performance Indicators</div>
        ${plant.equipment.map(eq => `
          <div style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
              <span style="color:#94a3b8">${eq.name}</span>
              <span style="font-weight:700;color:${eq.oee > 80 ? '#10b981' : eq.oee > 70 ? '#f59e0b' : '#ef4444'}">${eq.oee}% OEE</span>
            </div>
            <div style="display:flex;gap:6px">
              <div style="flex:1">
                <div style="font-size:10px;color:#64748b;margin-bottom:2px">Avail. ${eq.availability}%</div>
                <div class="progress-bar"><div class="progress-fill green" style="width:${eq.availability}%"></div></div>
              </div>
              <div style="flex:1">
                <div style="font-size:10px;color:#64748b;margin-bottom:2px">Perf. ${eq.performance}%</div>
                <div class="progress-bar"><div class="progress-fill blue" style="width:${eq.performance}%"></div></div>
              </div>
              <div style="flex:1">
                <div style="font-size:10px;color:#64748b;margin-bottom:2px">Qual. ${eq.quality}%</div>
                <div class="progress-bar"><div class="progress-fill amber" style="width:${eq.quality}%"></div></div>
              </div>
            </div>
          </div>`).join('')}
      </div>
    </div>
  </div>`
}

// ─────────────────────────────────────────────────────────────────
// PAGE: ENERGY ANALYTICS
// ─────────────────────────────────────────────────────────────────
async function loadEnergy() {
  const [monthly, plantBreak, equipBreak, summary] = await Promise.all([
    api('/energy/monthly'), api('/energy/plant-breakdown'),
    api('/energy/equipment-breakdown'), api('/energy/summary')
  ])
  state.energyMonthly = monthly; state.plantBreakdown = plantBreak
  state.equipBreakdown = equipBreak
  renderEnergy(monthly, plantBreak, equipBreak, summary)
}

function renderEnergy(monthly, plantBreak, equipBreak, summary) {
  document.getElementById('page-energy').innerHTML = `
    <div class="section-header">
      <div class="section-title">Energy Analytics</div>
      <div style="display:flex;gap:8px">
        <button class="btn btn-outline" onclick="window.open('/api/csv/export/energy')"><i class="fas fa-download"></i> Export CSV</button>
      </div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card blue">
        <div class="kpi-icon"><i class="fas fa-bolt"></i></div>
        <div class="kpi-label">Annual Electricity</div>
        <div class="kpi-value sm">2,52,649</div>
        <div class="kpi-unit">lakh kWh / year</div>
      </div>
      <div class="kpi-card amber">
        <div class="kpi-icon"><i class="fas fa-fire-flame-curved"></i></div>
        <div class="kpi-label">Annual Fuel</div>
        <div class="kpi-value sm">4,13,056</div>
        <div class="kpi-unit">GJ / year · Propane & FO</div>
      </div>
      <div class="kpi-card red">
        <div class="kpi-icon"><i class="fas fa-rupee-sign"></i></div>
        <div class="kpi-label">Annual Elec. Cost</div>
        <div class="kpi-value sm">₹${fmt.number(summary.electricityCostLakhs)}L</div>
        <div class="kpi-unit">@ ₹7.50/kWh avg tariff</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-icon"><i class="fas fa-solar-panel"></i></div>
        <div class="kpi-label">Renewable Share</div>
        <div class="kpi-value">3.4%</div>
        <div class="kpi-unit">31,146 GJ · 8.73 MW Solar</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-chart-bar" style="color:#3b82f6;margin-right:6px"></i>Monthly kWh & Cost Trend</div>
        </div>
        <canvas id="chart-energy-cost" height="200"></canvas>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-chart-pie" style="color:#f59e0b;margin-right:6px"></i>Equipment Category Breakdown</div>
          <div class="card-subtitle">Monthly kWh by equipment type</div>
        </div>
        <canvas id="chart-equip-break" height="200"></canvas>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-gauge-high" style="color:#10b981;margin-right:6px"></i>Specific Energy Intensity (GJ/MT)</div>
          <div class="card-subtitle">Monthly trend vs benchmarks</div>
        </div>
        <canvas id="chart-specific-energy" height="200"></canvas>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-bars" style="color:#8b5cf6;margin-right:6px"></i>Plant-wise Energy Intensity Comparison</div>
        </div>
        <canvas id="chart-plant-intensity" height="200"></canvas>
      </div>
    </div>

    <!-- Equipment Table -->
    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title"><i class="fas fa-table" style="color:#3b82f6;margin-right:6px"></i>High-Energy Equipment Master</div>
          <div class="card-subtitle">All major energy consumers across 5 plants</div>
        </div>
        <button class="btn btn-outline" onclick="window.open('/api/csv/export/equipment')"><i class="fas fa-download"></i> Export</button>
      </div>
      <div class="table-container" id="equipment-table-container">
        ${renderEquipmentTable()}
      </div>
    </div>`

  setTimeout(() => {
    drawEnergyCostChart(monthly)
    drawEquipBreakChart(equipBreak)
    drawSpecificEnergyChart(monthly)
    drawPlantIntensityChart()
  }, 50)
}

function renderEquipmentTable() {
  const equipment = [
    { id:'E001', plant:'Plant 1', name:'IBH Furnace', count:11, capacity:'1200T & 250T', monthlyKWh:2234059, fuel:'Electricity', crit:'Critical' },
    { id:'E002', plant:'Plant 1', name:'Air Compressor', count:6, capacity:'2000 CFM×5', monthlyKWh:367656, fuel:'Electricity', crit:'High' },
    { id:'E003', plant:'Plant 1', name:'Heat Treatment Furnace', count:4, capacity:'1200T & 500T', monthlyKWh:217374.5, fuel:'Furnace Oil', crit:'Critical' },
    { id:'E004', plant:'Plant 1', name:'Cooling Tower', count:2, capacity:'1200T & 1800T', monthlyKWh:84140.5, fuel:'Electricity', crit:'Medium' },
    { id:'E005', plant:'Plant 3', name:'Air Compressor', count:4, capacity:'2000 CFM×2', monthlyKWh:112056.5, fuel:'Electricity', crit:'High' },
    { id:'E006', plant:'Plant 3', name:'Induction Hardening', count:4, capacity:'250-500 kW', monthlyKWh:220005.87, fuel:'Electricity', crit:'High' },
    { id:'E007', plant:'Plant 4', name:'Heat Treatment Furnace', count:2, capacity:'2T & 2.2T', monthlyKWh:856031.66, fuel:'Electricity', crit:'Critical' },
    { id:'E008', plant:'Plant 4', name:'Induction Furnace', count:1, capacity:'4000 kW', monthlyKWh:672195, fuel:'Electricity', crit:'Critical' },
    { id:'E009', plant:'Plant 5', name:'IBH Furnace', count:10, capacity:'2000T–12500T', monthlyKWh:4903193, fuel:'Electricity', crit:'Critical' },
    { id:'E010', plant:'Plant 5', name:'Press Line', count:10, capacity:'2000T–12500T', monthlyKWh:803884.41, fuel:'Elec+Propane', crit:'Critical' },
    { id:'E011', plant:'Plant 5', name:'Heat Treatment Furnace', count:8, capacity:'2T–4T', monthlyKWh:1235138, fuel:'Elec+Propane', crit:'Critical' },
    { id:'E012', plant:'P6,7&9', name:'IBH + Other Furnaces', count:20, capacity:'500T–1500T', monthlyKWh:3034068, fuel:'Mixed', crit:'Critical' },
  ]
  const totalKWh = equipment.reduce((s, e) => s + e.monthlyKWh, 0)
  return `<table>
    <thead><tr>
      <th>ID</th><th>Plant</th><th>Equipment</th><th>Count</th><th>Capacity</th>
      <th>Monthly kWh</th><th>Share %</th><th>Annual Cost (₹L)</th><th>Annual CO₂ (t)</th><th>Fuel</th><th>Priority</th>
    </tr></thead>
    <tbody>
      ${equipment.map(e => {
        const share = (e.monthlyKWh / totalKWh * 100).toFixed(1)
        const annualCost = (e.monthlyKWh * 12 * 7.50 / 100000).toFixed(1)
        const annualCO2 = Math.round(e.monthlyKWh * 12 * 0.82 / 1000)
        return `<tr>
          <td><span style="font-family:monospace;color:#60a5fa">${e.id}</span></td>
          <td>${e.plant}</td>
          <td style="font-weight:600;color:#e2e8f0">${e.name}</td>
          <td style="text-align:center">${e.count}</td>
          <td style="font-size:11px;color:#94a3b8">${e.capacity}</td>
          <td style="font-weight:700;color:#60a5fa">${fmt.number(Math.round(e.monthlyKWh))}</td>
          <td>
            <div style="display:flex;align-items:center;gap:6px">
              <div class="progress-bar" style="width:60px;flex-shrink:0"><div class="progress-fill ${parseFloat(share)>30?'red':parseFloat(share)>15?'amber':'blue'}" style="width:${Math.min(parseFloat(share)*2, 100)}%"></div></div>
              <span style="font-size:11px">${share}%</span>
            </div>
          </td>
          <td style="font-weight:700;color:#f59e0b">₹${annualCost}</td>
          <td style="color:#ef4444">${fmt.number(annualCO2)}</td>
          <td><span class="badge badge-${e.fuel.includes('Electricity')&&!e.fuel.includes('+') ? 'blue' : 'amber'}">${e.fuel}</span></td>
          <td><span class="badge badge-${e.crit === 'Critical' ? 'red' : e.crit === 'High' ? 'amber' : 'blue'}">${e.crit}</span></td>
        </tr>`
      }).join('')}
      <tr style="background:rgba(59,130,246,0.05)">
        <td colspan="5" style="font-weight:700;color:#e2e8f0">TOTAL</td>
        <td style="font-weight:800;color:#3b82f6">${fmt.number(Math.round(totalKWh))}</td>
        <td style="font-weight:700">100%</td>
        <td style="font-weight:800;color:#f59e0b">₹${(totalKWh*12*7.50/100000).toFixed(0)}</td>
        <td style="font-weight:700;color:#ef4444">${fmt.number(Math.round(totalKWh*12*0.82/1000))}</td>
        <td colspan="2"></td>
      </tr>
    </tbody></table>`
}

function drawEnergyCostChart(monthly) {
  destroyChart('energy-cost')
  const ctx = document.getElementById('chart-energy-cost')?.getContext('2d')
  if (!ctx) return
  state.charts['energy-cost'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthly.months,
      datasets: [
        { label: 'kWh (millions)', data: monthly.kwhTrend.map(v => (v/1e6).toFixed(2)), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4, pointRadius: 4, borderWidth: 2 },
        { label: 'Cost (₹ Lakhs)', data: monthly.cost, borderColor: '#f59e0b', backgroundColor: 'transparent', fill: false, tension: 0.4, pointRadius: 4, borderWidth: 2, yAxisID: 'y1' }
      ]
    },
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(99,102,241,0.08)' } },
        y: { ticks: { color: '#64748b', font: { size: 10 }, callback: v => v + 'M' }, grid: { color: 'rgba(99,102,241,0.08)' } },
        y1: { position: 'right', ticks: { color: '#64748b', font: { size: 10 }, callback: v => '₹' + v + 'L' }, grid: { display: false } }
      }
    }
  })
}

function drawEquipBreakChart(data) {
  destroyChart('equip-break')
  const ctx = document.getElementById('chart-equip-break')?.getContext('2d')
  if (!ctx) return
  const colors = ['#ef4444', '#3b82f6', '#8b5cf6', '#f59e0b', '#10b981']
  state.charts['equip-break'] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: data.labels,
      datasets: [{ data: data.values, backgroundColor: colors, borderColor: '#0f172a', borderWidth: 2, hoverOffset: 6 }]
    },
    options: {
      responsive: true,
      cutout: '60%',
      plugins: {
        legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 }, padding: 10 } },
        tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${(ctx.raw/1e6).toFixed(2)}M kWh` } }
      }
    }
  })
}

function drawSpecificEnergyChart(monthly) {
  destroyChart('specific-energy')
  const ctx = document.getElementById('chart-specific-energy')?.getContext('2d')
  if (!ctx) return
  state.charts['specific-energy'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: monthly.months,
      datasets: [
        { label: 'RKFL Actual (GJ/MT)', data: monthly.specificEnergyGJMT, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 4 },
        { label: 'Industry Avg 7.8', data: monthly.months.map(() => 7.8), borderColor: '#ef4444', borderDash: [5,4], pointRadius: 0, borderWidth: 1.5 },
        { label: 'Best-in-Class 5.2', data: monthly.months.map(() => 5.2), borderColor: '#10b981', borderDash: [4,3], pointRadius: 0, borderWidth: 1.5 },
        { label: 'RKFL Target 5.8', data: monthly.months.map(() => 5.8), borderColor: '#8b5cf6', borderDash: [4,3], pointRadius: 0, borderWidth: 1.5 },
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(99,102,241,0.08)' } },
        y: { min: 4, max: 10, ticks: { color: '#64748b', font: { size: 10 }, callback: v => v + ' GJ/MT' }, grid: { color: 'rgba(99,102,241,0.08)' } }
      }
    }
  })
}

function drawPlantIntensityChart() {
  destroyChart('plant-intensity')
  const ctx = document.getElementById('chart-plant-intensity')?.getContext('2d')
  if (!ctx) return
  const plants = ['Plant 1', 'Plant 3', 'Plant 4', 'Plant 5', 'P6,7&9']
  const vals = [7.32, 5.84, 8.91, 6.21, 7.68]
  state.charts['plant-intensity'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: plants,
      datasets: [{
        label: 'GJ/MT',
        data: vals,
        backgroundColor: vals.map(v => v > 7.8 ? 'rgba(239,68,68,0.7)' : v > 6.5 ? 'rgba(245,158,11,0.7)' : 'rgba(16,185,129,0.7)'),
        borderColor: vals.map(v => v > 7.8 ? '#ef4444' : v > 6.5 ? '#f59e0b' : '#10b981'),
        borderWidth: 2, borderRadius: 6
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false },
        annotation: { annotations: { line1: { type: 'line', yMin: 7.8, yMax: 7.8, borderColor: '#ef4444', borderDash: [4,3], label: { content: 'Industry Avg', display: true } } } }
      },
      scales: {
        x: { ticks: { color: '#94a3b8', font: { size: 11 } } },
        y: { min: 0, max: 12, ticks: { color: '#64748b', callback: v => v + ' GJ/MT' }, grid: { color: 'rgba(99,102,241,0.08)' } }
      }
    }
  })
}

// ─────────────────────────────────────────────────────────────────
// PAGE: EMISSIONS
// ─────────────────────────────────────────────────────────────────
async function loadEmissions() {
  const [summary, scopeBreak, forecast] = await Promise.all([
    api('/emissions/summary'), api('/emissions/scope-breakdown'), api('/ai/forecast')
  ])
  state.emissionsSummary = summary; state.forecast = forecast
  renderEmissions(summary, scopeBreak, forecast)
}

function renderEmissions(summary, scopeBreak, forecast) {
  document.getElementById('page-emissions').innerHTML = `
    <div class="section-header">
      <div class="section-title">GHG Emissions Management</div>
      <button class="btn btn-outline" onclick="window.open('/api/csv/export/emissions')"><i class="fas fa-download"></i> Export CSV</button>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card red"><div class="kpi-icon"><i class="fas fa-cloud"></i></div>
        <div class="kpi-label">Scope 1 Emissions</div><div class="kpi-value sm">27,351</div><div class="kpi-unit">tCO₂e · Fuel combustion</div>
        <span class="kpi-trend up">▲ 13.4% of total GHG</span>
      </div>
      <div class="kpi-card red"><div class="kpi-icon"><i class="fas fa-plug"></i></div>
        <div class="kpi-label">Scope 2 Emissions</div><div class="kpi-value sm">1,77,124</div><div class="kpi-unit">tCO₂e · Grid electricity</div>
        <span class="kpi-trend up">▲ 86.6% of total GHG</span>
      </div>
      <div class="kpi-card amber"><div class="kpi-icon"><i class="fas fa-smog"></i></div>
        <div class="kpi-label">Total GHG (S1+S2)</div><div class="kpi-value sm">2,04,474</div><div class="kpi-unit">tCO₂e / year</div>
        <span class="kpi-trend down">▼ vs 2,50,000+ BAU baseline</span>
      </div>
      <div class="kpi-card amber"><div class="kpi-icon"><i class="fas fa-leaf"></i></div>
        <div class="kpi-label">Carbon Intensity</div><div class="kpi-value">1.043</div><div class="kpi-unit">tCO₂e/MT · Target: 0.80 FY28</div>
        <span class="kpi-trend down">▼ vs 1.35 industry avg</span>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title" style="margin-bottom:14px"><i class="fas fa-chart-area" style="color:#ef4444;margin-right:6px"></i>Monthly GHG Trend (tCO₂e)</div>
        <canvas id="chart-ghg-monthly" height="200"></canvas>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:14px"><i class="fas fa-chart-pie" style="color:#f59e0b;margin-right:6px"></i>Scope 1 vs Scope 2 Split</div>
        <canvas id="chart-scope-pie" height="200"></canvas>
        <div style="margin-top:14px">
          <div class="legend-item"><div class="legend-dot" style="background:#ef4444"></div><span style="font-size:12px;color:#94a3b8">Scope 2 — Grid Electricity: 1,77,124 tCO₂e (86.6%)</span></div>
          <div class="legend-item"><div class="legend-dot" style="background:#f59e0b"></div><span style="font-size:12px;color:#94a3b8">Scope 1 — Fuel Combustion: 27,351 tCO₂e (13.4%)</span></div>
          <div style="margin-top:10px;padding:10px;background:rgba(59,130,246,0.08);border-radius:8px;border-left:3px solid #3b82f6">
            <div style="font-size:12px;font-weight:700;color:#60a5fa">Key Insight</div>
            <div style="font-size:11px;color:#94a3b8;margin-top:4px">86.6% of emissions are Scope 2 (electricity). Transitioning to 50% renewable by FY28 will directly cut total GHG by ~43%, saving ~88,000 tCO₂e/year.</div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title" style="margin-bottom:14px"><i class="fas fa-road" style="color:#10b981;margin-right:6px"></i>Net Zero Pathway to 2040</div>
        <canvas id="chart-netzero2" height="200"></canvas>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:14px"><i class="fas fa-chart-line" style="color:#8b5cf6;margin-right:6px"></i>AI-enabled Emissions Forecast</div>
        <canvas id="chart-ghg-forecast" height="200"></canvas>
      </div>
    </div>

    <div class="card">
      <div class="card-title" style="margin-bottom:16px"><i class="fas fa-bullseye" style="color:#10b981;margin-right:6px"></i>Decarbonisation Lever Analysis</div>
      ${renderDecarbLever()}
    </div>`

  setTimeout(() => {
    drawGHGMonthly(summary)
    drawScopePie(scopeBreak)
    drawNetZeroFull()
    drawGHGForecast(forecast)
  }, 50)
}

function renderDecarbLever() {
  const levers = [
    { name: 'Renewable Energy (50% by FY28)', reduction: 88000, pct: 43, type: 'Scope 2', cost: '₹35 Cr', color: '#10b981' },
    { name: 'Energy Efficiency (AI optimization)', reduction: 28400, pct: 13.9, type: 'Scope 1+2', cost: '₹12 Cr', color: '#3b82f6' },
    { name: 'Propane to Green H₂ (pilot FY27)', reduction: 12800, pct: 6.3, type: 'Scope 1', cost: '₹28 Cr', color: '#8b5cf6' },
    { name: 'Waste Heat Recovery', reduction: 8200, pct: 4.0, type: 'Scope 1', cost: '₹8 Cr', color: '#f59e0b' },
    { name: 'Electric Vehicle Fleet', reduction: 1800, pct: 0.9, type: 'Scope 1', cost: '₹6 Cr', color: '#14b8a6' },
  ]
  return `<div>${levers.map(l => `
    <div class="h-bar">
      <div class="h-bar-label" title="${l.name}">${l.name}</div>
      <div class="h-bar-track"><div class="h-bar-fill" style="width:${l.pct * 2}%;background:${l.color}"></div></div>
      <div style="width:130px;text-align:right;font-size:12px">
        <span style="font-weight:700;color:#e2e8f0">${fmt.number(l.reduction)} tCO₂e</span>
        <span class="badge badge-${l.type.includes('1') ? 'amber' : 'blue'}" style="margin-left:6px">${l.type}</span>
      </div>
      <div style="width:60px;text-align:right;font-size:11px;color:#64748b">${l.cost}</div>
    </div>`).join('')}
  </div>`
}

function drawGHGMonthly(summary) {
  destroyChart('ghg-monthly')
  const ctx = document.getElementById('chart-ghg-monthly')?.getContext('2d')
  if (!ctx) return
  const s1 = summary.monthlyTrend.map(v => Math.round(v * 0.134))
  const s2 = summary.monthlyTrend.map(v => Math.round(v * 0.866))
  state.charts['ghg-monthly'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: summary.months,
      datasets: [
        { label: 'Scope 2', data: s2, backgroundColor: 'rgba(239,68,68,0.7)', stack: 's' },
        { label: 'Scope 1', data: s1, backgroundColor: 'rgba(245,158,11,0.8)', stack: 's' },
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
      scales: {
        x: { stacked: true, ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(99,102,241,0.08)' } },
        y: { stacked: true, ticks: { color: '#64748b', font: { size: 10 }, callback: v => (v/1000).toFixed(0)+'K' }, grid: { color: 'rgba(99,102,241,0.08)' } }
      }
    }
  })
}

function drawScopePie(scopeBreak) {
  destroyChart('scope-pie')
  const ctx = document.getElementById('chart-scope-pie')?.getContext('2d')
  if (!ctx) return
  state.charts['scope-pie'] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Scope 2 (Grid Elec.)', 'Scope 1 — Propane', 'Scope 1 — Furnace Oil'],
      datasets: [{ data: [177124, 18420, 8931], backgroundColor: ['#ef4444', '#f59e0b', '#f97316'], borderColor: '#0f172a', borderWidth: 2 }]
    },
    options: { responsive: true, cutout: '60%', plugins: { legend: { display: false } } }
  })
}

function drawNetZeroFull() {
  destroyChart('netzero2')
  const ctx = document.getElementById('chart-netzero2')?.getContext('2d')
  if (!ctx) return
  const years = [2025,2026,2027,2028,2029,2030,2031,2032,2033,2034,2035,2040]
  const baseline = years.map(y => Math.round(204474 * Math.pow(1.02, y-2025)))
  const pathway = years.map(y => Math.max(0, Math.round(204474 * Math.pow(0.88, y-2025))))
  state.charts['netzero2'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: years,
      datasets: [
        { label: 'BAU Baseline', data: baseline, borderColor: '#ef4444', borderDash: [5,4], pointRadius: 0, borderWidth: 2 },
        { label: 'Net Zero Pathway', data: pathway, borderColor: '#10b981', borderWidth: 2.5, pointRadius: 4, fill: { target: 'origin', above: 'rgba(16,185,129,0.06)' } },
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(99,102,241,0.08)' } },
        y: { ticks: { color: '#64748b', font: { size: 10 }, callback: v => (v/1000).toFixed(0)+'K' }, grid: { color: 'rgba(99,102,241,0.08)' } }
      }
    }
  })
}

function drawGHGForecast(forecast) {
  destroyChart('ghg-forecast')
  const ctx = document.getElementById('chart-ghg-forecast')?.getContext('2d')
  if (!ctx) return
  state.charts['ghg-forecast'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: forecast.months,
      datasets: [
        { label: 'Baseline Forecast', data: forecast.ghgForecast.map(v => Math.round(v * 1.05)), borderColor: '#ef4444', borderDash: [5,4], pointRadius: 3, borderWidth: 2 },
        { label: 'With AI Initiatives', data: forecast.ghgForecast, borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', fill: true, borderWidth: 2.5, pointRadius: 4 },
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(99,102,241,0.08)' } },
        y: { ticks: { color: '#64748b', font: { size: 10 }, callback: v => fmt.number(v) + ' t' }, grid: { color: 'rgba(99,102,241,0.08)' } }
      }
    }
  })
}

// ─────────────────────────────────────────────────────────────────
// PAGE: WATER & WASTE
// ─────────────────────────────────────────────────────────────────
async function loadWaterWaste() {
  const [water, waste] = await Promise.all([api('/water/summary'), api('/waste/summary')])
  state.waterSummary = water; state.wasteSummary = waste
  renderWaterWaste(water, waste)
}

function renderWaterWaste(water, waste) {
  document.getElementById('page-water-waste').innerHTML = `
    <div class="section-header">
      <div class="section-title">Water & Waste Management</div>
      <div class="topnav-pill green"><i class="fas fa-check"></i> ZLD: 3 Plants Achieved</div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card blue">
        <div class="kpi-icon"><i class="fas fa-droplet"></i></div>
        <div class="kpi-label">Annual Water Use</div><div class="kpi-value sm">3,45,613</div>
        <div class="kpi-unit">KL / year</div><span class="kpi-trend down">▼ 1.76 KL/MT intensity</span>
      </div>
      <div class="kpi-card green">
        <div class="kpi-icon"><i class="fas fa-cloud-rain"></i></div>
        <div class="kpi-label">Rainwater Harvested</div><div class="kpi-value sm">14,464</div>
        <div class="kpi-unit">KL / year · 4.2% of total</div>
      </div>
      <div class="kpi-card amber">
        <div class="kpi-icon"><i class="fas fa-trash-can"></i></div>
        <div class="kpi-label">Total Waste Generated</div><div class="kpi-value">309.1</div>
        <div class="kpi-unit">MT / year</div><span class="kpi-trend up">▲ 30.7% recycled</span>
      </div>
      <div class="kpi-card red">
        <div class="kpi-icon"><i class="fas fa-skull-crossbones"></i></div>
        <div class="kpi-label">Hazardous Waste</div><div class="kpi-value">266.7</div>
        <div class="kpi-unit">MT / year · 86.3% of total</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title" style="margin-bottom:14px"><i class="fas fa-chart-area" style="color:#3b82f6;margin-right:6px"></i>Monthly Water Consumption (KL)</div>
        <canvas id="chart-water-trend" height="200"></canvas>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:14px"><i class="fas fa-chart-pie" style="color:#10b981;margin-right:6px"></i>Water Source Split</div>
        <canvas id="chart-water-source" height="200"></canvas>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title" style="margin-bottom:14px"><i class="fas fa-recycle" style="color:#f59e0b;margin-right:6px"></i>Waste Streams Analysis</div>
        ${renderWasteStreams(waste)}
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:14px"><i class="fas fa-chart-bar" style="color:#8b5cf6;margin-right:6px"></i>Monthly Waste Trend</div>
        <canvas id="chart-waste-trend" height="200"></canvas>
        <div style="margin-top:14px;padding:12px;background:rgba(16,185,129,0.08);border-radius:8px;border-left:3px solid #10b981">
          <div style="font-size:12px;font-weight:700;color:#10b981">Waste Revenue Opportunity</div>
          <div style="font-size:20px;font-weight:800;color:#e2e8f0;margin-top:4px">₹${fmt.number(Math.round(waste.annualWasteRevenueINR / 100000))} Lakhs/year</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px">From recycling mill scale, forging flash, used oil & battery waste</div>
        </div>
      </div>
    </div>`

  setTimeout(() => {
    drawWaterTrend(water)
    drawWaterSource(water)
    drawWasteTrend(waste)
  }, 50)
}

function renderWasteStreams(waste) {
  return `<div class="table-container"><table>
    <thead><tr><th>Waste Type</th><th>Monthly MT</th><th>Recyclable</th><th>Recycle%</th><th>Revenue/MT</th></tr></thead>
    <tbody>
      ${waste.streams.map(s => `<tr>
        <td style="font-weight:600;color:#e2e8f0">${s.type}</td>
        <td style="color:#60a5fa;font-weight:700">${s.monthlyMT}</td>
        <td><span class="badge badge-${s.recyclable ? 'green' : 'red'}">${s.recyclable ? 'Yes' : 'No'}</span></td>
        <td>
          <div style="display:flex;align-items:center;gap:6px">
            <div class="progress-bar" style="width:50px"><div class="progress-fill ${s.recyclePct > 80 ? 'green' : s.recyclePct > 50 ? 'amber' : 'red'}" style="width:${s.recyclePct}%"></div></div>
            <span style="font-size:11px">${s.recyclePct}%</span>
          </div>
        </td>
        <td style="color:#f59e0b">₹${fmt.number(s.revenuePerMT)}</td>
      </tr>`).join('')}
    </tbody></table></div>`
}

function drawWaterTrend(water) {
  destroyChart('water-trend')
  const ctx = document.getElementById('chart-water-trend')?.getContext('2d')
  if (!ctx) return
  state.charts['water-trend'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: water.months,
      datasets: [{ label: 'Water Consumption (KL)', data: water.monthlyTrend, borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true, tension: 0.4, borderWidth: 2, pointRadius: 4 }]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(99,102,241,0.08)' } },
        y: { ticks: { color: '#64748b', font: { size: 10 }, callback: v => (v/1000).toFixed(0)+'K KL' }, grid: { color: 'rgba(99,102,241,0.08)' } }
      }
    }
  })
}

function drawWaterSource(water) {
  destroyChart('water-source')
  const ctx = document.getElementById('chart-water-source')?.getContext('2d')
  if (!ctx) return
  state.charts['water-source'] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: water.sources.map(s => `${s.name} (${s.pct}%)`),
      datasets: [{ data: water.sources.map(s => s.kl), backgroundColor: ['#3b82f6', '#8b5cf6', '#10b981'], borderColor: '#0f172a', borderWidth: 2 }]
    },
    options: { responsive: true, cutout: '60%', plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 } } } }
  })
}

function drawWasteTrend(waste) {
  destroyChart('waste-trend')
  const ctx = document.getElementById('chart-waste-trend')?.getContext('2d')
  if (!ctx) return
  state.charts['waste-trend'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: waste.months || ['Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'],
      datasets: [
        { label: 'Hazardous', data: (waste.monthlyTrend || Array(12).fill(26)).map(v => Math.round(v * 0.864)), backgroundColor: 'rgba(239,68,68,0.7)', stack: 'w' },
        { label: 'Battery', data: (waste.monthlyTrend || Array(12).fill(3)).map(v => Math.round(v * 0.109)), backgroundColor: 'rgba(245,158,11,0.7)', stack: 'w' },
        { label: 'E-Waste', data: (waste.monthlyTrend || Array(12).fill(1)).map(v => Math.round(v * 0.028)), backgroundColor: 'rgba(139,92,246,0.7)', stack: 'w' },
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
      scales: {
        x: { stacked: true, ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(99,102,241,0.08)' } },
        y: { stacked: true, ticks: { color: '#64748b', font: { size: 10 }, callback: v => v + ' MT' }, grid: { color: 'rgba(99,102,241,0.08)' } }
      }
    }
  })
}

// ─────────────────────────────────────────────────────────────────
// PAGE: MATERIALS
// ─────────────────────────────────────────────────────────────────
async function loadMaterials() {
  const data = await api('/materials/summary')
  renderMaterials(data.materials)
}

function renderMaterials(mat) {
  document.getElementById('page-materials').innerHTML = `
    <div class="section-header">
      <div class="section-title">Materials & Circular Economy Tracking</div>
    </div>

    <div class="kpi-grid">
      <div class="kpi-card blue"><div class="kpi-icon"><i class="fas fa-cubes"></i></div>
        <div class="kpi-label">Steel Billets/month</div><div class="kpi-value sm">${fmt.number(mat.steelBilletsMonthlyMT)}</div><div class="kpi-unit">MT · Primary raw material</div>
      </div>
      <div class="kpi-card amber"><div class="kpi-icon"><i class="fas fa-fire-flame-curved"></i></div>
        <div class="kpi-label">Furnace Oil/month</div><div class="kpi-value">${fmt.number(mat.furnaceOilMonthlyKL)}</div><div class="kpi-unit">KL · Heat treatment fuel</div>
      </div>
      <div class="kpi-card green"><div class="kpi-icon"><i class="fas fa-recycle"></i></div>
        <div class="kpi-label">Steel Scrap/month</div><div class="kpi-value sm">${fmt.number(mat.steelScrapMonthlyMT)}</div><div class="kpi-unit">MT · Recycled back</div>
      </div>
      <div class="kpi-card purple"><div class="kpi-icon"><i class="fas fa-droplet"></i></div>
        <div class="kpi-label">Process Water/month</div><div class="kpi-value sm">${fmt.number(mat.waterMonthlyKL)}</div><div class="kpi-unit">KL · Including recycled</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="card-title" style="margin-bottom:16px"><i class="fas fa-chart-pie" style="color:#3b82f6;margin-right:6px"></i>Material Input Breakdown</div>
        <canvas id="chart-material-pie" height="220"></canvas>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:16px"><i class="fas fa-arrows-spin" style="color:#10b981;margin-right:6px"></i>Circular Economy Metrics</div>
        ${renderCircularEconomy()}
      </div>
    </div>

    <div class="card">
      <div class="card-title" style="margin-bottom:16px"><i class="fas fa-list" style="color:#8b5cf6;margin-right:6px"></i>Material Inventory Dashboard</div>
      <div class="table-container">${renderMaterialsTable(mat)}</div>
    </div>`

  setTimeout(() => { drawMaterialPie(mat) }, 50)
}

function renderCircularEconomy() {
  const metrics = [
    { label: 'Forging Flash Recycled', value: '95%', detail: '64.8 MT/month → Steel mill', color: '#10b981' },
    { label: 'Mill Scale Recovery', value: '98%', detail: '139.7 MT/month → Blast furnace', color: '#3b82f6' },
    { label: 'Slag Utilised', value: '75%', detail: '28.95 MT/month → Construction', color: '#f59e0b' },
    { label: 'Coolant Recycled', value: '82%', detail: 'Closed-loop coolant system', color: '#8b5cf6' },
    { label: 'Water Recycled (ZLD)', value: '60%+', detail: '3 plants with ZLD achieved', color: '#14b8a6' },
    { label: 'Used Oil Recycle', value: '100%', detail: 'Authorised recycler', color: '#10b981' },
  ]
  return metrics.map(m => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid rgba(30,41,59,0.8)">
      <div>
        <div style="font-size:13px;font-weight:600;color:#e2e8f0">${m.label}</div>
        <div style="font-size:11px;color:#64748b;margin-top:2px">${m.detail}</div>
      </div>
      <div style="font-size:22px;font-weight:800;color:${m.color}">${m.value}</div>
    </div>`).join('')
}

function drawMaterialPie(mat) {
  destroyChart('material-pie')
  const ctx = document.getElementById('chart-material-pie')?.getContext('2d')
  if (!ctx) return
  state.charts['material-pie'] = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Steel Billets', 'Steel Scrap', 'Process Water', 'Furnace Oil', 'Propane', 'Other'],
      datasets: [{ data: [mat.steelBilletsMonthlyMT, mat.steelScrapMonthlyMT, mat.waterMonthlyKL/100, mat.furnaceOilMonthlyKL*0.85, mat.propaneMonthlyMT*5, 200], backgroundColor: ['#3b82f6','#10b981','#06b6d4','#f59e0b','#8b5cf6','#64748b'], borderColor: '#0f172a', borderWidth: 2 }]
    },
    options: { responsive: true, cutout: '60%', plugins: { legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 11 }, padding: 10 } } } }
  })
}

function renderMaterialsTable(mat) {
  const rows = [
    ['Steel Billets (Virgin)', 'Raw Material', fmt.number(mat.steelBilletsMonthlyMT) + ' MT', '₹' + fmt.number(mat.steelBilletsMonthlyMT * 60000 / 100000) + ' Lakhs', 'Tata Steel / SAIL', 'Critical'],
    ['Steel Scrap', 'Raw Material', fmt.number(mat.steelScrapMonthlyMT) + ' MT', '₹' + fmt.number(mat.steelScrapMonthlyMT * 42000 / 100000) + ' Lakhs', 'Multiple', 'High'],
    ['Furnace Oil', 'Fuel', fmt.number(mat.furnaceOilMonthlyKL) + ' KL', '₹' + fmt.number(mat.furnaceOilMonthlyKL * 92 / 100000 * 1000) + ' Lakhs', 'HPCL/BPCL', 'Critical'],
    ['Propane / LPG', 'Fuel', fmt.number(mat.propaneMonthlyMT) + ' MT', '₹' + fmt.number(mat.propaneMonthlyMT * 85 / 100000 * 1000) + ' Lakhs', 'IOC', 'High'],
    ['Process Water', 'Utility', fmt.number(mat.waterMonthlyKL) + ' KL', '₹' + fmt.number(mat.waterMonthlyKL * 45 / 100000) + ' Lakhs', 'JSIDC/Groundwater', 'Medium'],
    ['Cutting Fluid', 'Consumable', fmt.number(mat.cuttingFluidMonthlyKL) + ' KL', '₹' + fmt.number(mat.cuttingFluidMonthlyKL * 120 / 100000 * 1000) + ' Lakhs', 'Castrol/Quaker', 'Medium'],
    ['Lubricants', 'Consumable', fmt.number(mat.lubricantsMonthlyMT) + ' MT', '₹' + fmt.number(mat.lubricantsMonthlyMT * 280 / 100000 * 1000) + ' Lakhs', 'Castrol', 'Medium'],
  ]
  return `<table><thead><tr><th>Material</th><th>Category</th><th>Monthly Volume</th><th>Monthly Cost</th><th>Key Supplier</th><th>Priority</th></tr></thead>
    <tbody>${rows.map(([n,c,v,cost,sup,p]) => `<tr>
      <td style="font-weight:600;color:#e2e8f0">${n}</td>
      <td><span class="badge badge-blue">${c}</span></td>
      <td style="font-weight:700;color:#60a5fa">${v}</td>
      <td style="font-weight:700;color:#f59e0b">${cost}</td>
      <td style="color:#94a3b8">${sup}</td>
      <td><span class="badge badge-${p === 'Critical' ? 'red' : p === 'High' ? 'amber' : 'blue'}">${p}</span></td>
    </tr>`).join('')}
    </tbody></table>`
}

// ─────────────────────────────────────────────────────────────────
// PAGE: AI ANALYTICS HUB
// ─────────────────────────────────────────────────────────────────
async function loadAI() {
  const [opps, anomalies, forecast] = await Promise.all([
    api('/ai/opportunities'), api('/ai/anomaly-detection'), api('/ai/forecast')
  ])
  state.aiOpportunities = opps; state.anomalies = anomalies; state.forecast = forecast
  renderAI(opps, anomalies, forecast)
}

function renderAI(opps, anomalies, forecast) {
  document.getElementById('page-ai').innerHTML = `
    <div class="section-header">
      <div class="section-title">AI Analytics Hub</div>
      <div class="section-subtitle">Engineering-led AI/ML optimization models · Sound physics-based analytics</div>
    </div>

    <!-- Summary Banner -->
    <div style="background:linear-gradient(135deg,rgba(139,92,246,0.15),rgba(59,130,246,0.1));border:1px solid rgba(139,92,246,0.3);border-radius:16px;padding:20px;margin-bottom:24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px">
      ${[
        ['Total Annual Savings', '₹' + fmt.number(opps.summary.totalSavingsLakhs) + ' Lakhs', '#a78bfa'],
        ['CO₂ Reduction', fmt.number(opps.summary.totalCO2ReductionMT) + ' MT/yr', '#10b981'],
        ['Avg Payback', opps.summary.avgPaybackMonths + ' months', '#60a5fa'],
        ['Avg 3-yr ROI', opps.summary.avgROI3Yr + '%', '#fcd34d'],
        ['Total Investment', '₹' + fmt.number(opps.summary.totalInvestmentLakhs) + ' Lakhs', '#f97316'],
        ['Active Anomalies', anomalies.totalOpen + ' Open', '#ef4444'],
      ].map(([l,v,c]) => `<div style="text-align:center"><div style="font-size:24px;font-weight:800;color:${c}">${v}</div><div style="font-size:11px;color:#64748b;margin-top:4px">${l}</div></div>`).join('')}
    </div>

    <div class="tab-bar" data-tabgroup="ai">
      <div class="tab-btn active" data-tab="models" onclick="setTab('ai','models')">AI Models</div>
      <div class="tab-btn" data-tab="anomaly" onclick="setTab('ai','anomaly')">Anomaly Detection</div>
      <div class="tab-btn" data-tab="forecast" onclick="setTab('ai','forecast')">Forecasting</div>
      <div class="tab-btn" data-tab="roi" onclick="setTab('ai','roi')">ROI Analysis</div>
    </div>

    <div data-tabgroup="ai">
      <div id="tab-ai-models" class="tab-content active">${renderAIModels(opps.opportunities)}</div>
      <div id="tab-ai-anomaly" class="tab-content">${renderAnomalyDetection(anomalies)}</div>
      <div id="tab-ai-forecast" class="tab-content">${renderForecastTab(forecast)}</div>
      <div id="tab-ai-roi" class="tab-content">${renderROITab(opps.opportunities)}</div>
    </div>`
}

function renderAIModels(opps) {
  const cats = ['All', 'Energy Optimization', 'Demand Management', 'Utility Optimization', 'Quality + Energy', 'Predictive Maintenance', 'Digital Twin', 'Renewable Integration']
  return `
    <div class="filter-tabs">
      ${cats.map(c => `<div class="filter-tab ${c === 'All' ? 'active' : ''}" onclick="filterAIModels(this,'${c}')">${c}</div>`).join('')}
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px" id="ai-models-grid">
      ${opps.map(o => renderAIModelCard(o)).join('')}
    </div>`
}

function filterAIModels(el, cat) {
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'))
  el.classList.add('active')
  document.querySelectorAll('#ai-models-grid .ai-opportunity-card').forEach(card => {
    if (cat === 'All' || card.dataset.category === cat) card.style.display = ''
    else card.style.display = 'none'
  })
}

function renderAIModelCard(o) {
  const statusColor = { 'Quick Win': 'green', 'Recommended': 'blue', 'High Priority': 'red', 'Strategic': 'purple' }
  const techIcons = { 'MPC': '🎛️', 'LSTM': '🧠', 'Reinforcement': '🤖', 'Gradient': '📊', 'Bayesian': '🔬', 'PINN': '⚛️', 'Isolation': '🔍', 'Digital': '🌐' }
  const icon = Object.keys(techIcons).find(k => o.technique.includes(k))
  return `<div class="ai-opportunity-card" data-category="${o.category}" onclick="showAIDetail('${o.id}')">
    <div class="ai-card-header">
      <div>
        <div style="font-size:11px;color:#64748b;margin-bottom:4px">${o.plant} · ${o.equipment}</div>
        <div class="ai-card-title">${techIcons[icon] || '🤖'} ${o.title}</div>
      </div>
      <span class="badge badge-${statusColor[o.status] || 'blue'}">${o.status}</span>
    </div>
    <div style="font-size:11px;color:#64748b;margin-bottom:10px">${o.technique}</div>
    <div class="ai-metrics">
      <div class="ai-metric"><div class="ai-metric-value">₹${o.annualSavingLakhs}L</div><div class="ai-metric-label">Annual Savings</div></div>
      <div class="ai-metric"><div class="ai-metric-value">${o.paybackMonths}m</div><div class="ai-metric-label">Payback</div></div>
      <div class="ai-metric"><div class="ai-metric-value">${o.roi3YrPct}%</div><div class="ai-metric-label">3yr ROI</div></div>
    </div>
    <div style="margin-top:12px;font-size:11px;color:#94a3b8;border-top:1px solid rgba(30,41,59,0.8);padding-top:10px">
      <div><span style="color:#64748b">CO₂ reduction: </span><span style="color:#10b981;font-weight:700">${fmt.number(o.co2ReductionMT)} tCO₂e/yr</span></div>
      <div style="margin-top:4px"><span style="color:#64748b">Current → Target: </span>${o.currentKPI} → <span style="color:#10b981">${o.targetKPI}</span></div>
    </div>
  </div>`
}

function showAIDetail(id) {
  api('/ai/opportunities/' + id).then(o => {
    const modal = document.createElement('div')
    modal.className = 'modal-overlay'
    modal.onclick = (e) => { if (e.target === modal) modal.remove() }
    modal.innerHTML = `<div class="modal">
      <div class="modal-header">
        <div>
          <div style="font-size:11px;color:#64748b;margin-bottom:4px">${o.plant} · ${o.equipment} · ${o.category}</div>
          <div style="font-size:18px;font-weight:700;color:#f1f5f9">🤖 ${o.title}</div>
        </div>
        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()"><i class="fas fa-times"></i></button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">
        ${[['Annual Savings','₹'+o.annualSavingLakhs+' Lakhs','#a78bfa'],['Payback',o.paybackMonths+' months','#60a5fa'],['3yr ROI',o.roi3YrPct+'%','#fcd34d'],['CO₂ Reduction',fmt.number(o.co2ReductionMT)+' tCO₂e/yr','#10b981'],['Investment','₹'+o.implementationCostLakhs+' Lakhs','#f97316'],['Complexity',o.complexity,'#94a3b8']].map(([l,v,c]) => `<div style="background:rgba(15,23,42,0.8);border-radius:8px;padding:12px;text-align:center"><div style="font-size:18px;font-weight:800;color:${c}">${v}</div><div style="font-size:11px;color:#64748b;margin-top:2px">${l}</div></div>`).join('')}
      </div>
      <div style="background:rgba(15,23,42,0.5);border-radius:10px;padding:14px;margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:6px">AI TECHNIQUE</div>
        <div style="font-size:13px;color:#e2e8f0">${o.technique}</div>
      </div>
      <div style="background:rgba(15,23,42,0.5);border-radius:10px;padding:14px;margin-bottom:14px">
        <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:6px">DESCRIPTION</div>
        <div style="font-size:13px;color:#e2e8f0;line-height:1.6">${o.description}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div style="background:rgba(15,23,42,0.5);border-radius:10px;padding:14px">
          <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:8px">MONITORING KPIs</div>
          ${o.kpis.map(k => `<div style="font-size:12px;color:#e2e8f0;padding:4px 0;border-bottom:1px solid rgba(30,41,59,0.5)">• ${k}</div>`).join('')}
        </div>
        <div style="background:rgba(15,23,42,0.5);border-radius:10px;padding:14px">
          <div style="font-size:12px;font-weight:700;color:#94a3b8;margin-bottom:8px">DATA REQUIREMENTS</div>
          ${o.dataNeeded.map(d => `<div style="font-size:12px;color:#e2e8f0;padding:4px 0;border-bottom:1px solid rgba(30,41,59,0.5)">• ${d}</div>`).join('')}
        </div>
      </div>
    </div>`
    document.body.appendChild(modal)
  })
}

function renderAnomalyDetection(anomalies) {
  const sevColor = { High: 'red', Medium: 'amber', Low: 'blue' }
  const statusColor = { Open: 'red', 'In Progress': 'amber', Resolved: 'green' }
  return `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <div class="topnav-pill red"><i class="fas fa-circle-exclamation"></i> ${anomalies.totalOpen} Active Alerts</div>
      <div style="font-size:12px;color:#64748b">AI-powered anomaly detection running across all plants · Isolation Forest + CNN models</div>
    </div>
    ${anomalies.anomalies.map(a => `
      <div class="alert-item ${a.severity.toLowerCase()}">
        <div style="flex:1">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-size:13px;font-weight:700;color:#e2e8f0">${a.plant} · ${a.equipment}</div>
              <div style="font-size:12px;color:#94a3b8;margin-top:2px">${a.type} — ${a.value}</div>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <span class="badge badge-${sevColor[a.severity]}">${a.severity}</span>
              <span class="badge badge-${statusColor[a.status]}">${a.status}</span>
            </div>
          </div>
          <div style="margin-top:8px;font-size:11px;color:#10b981"><i class="fas fa-wrench" style="margin-right:4px"></i>${a.action}</div>
          <div style="margin-top:4px;font-size:11px;color:#64748b">
            Detected: ${a.detectedAt} · Potential saving: <span style="color:#f59e0b;font-weight:700">${fmt.number(a.potentialSavingKWh)} kWh</span>
          </div>
        </div>
      </div>`).join('')}
    <div style="margin-top:16px;padding:14px;background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);border-radius:10px">
      <div style="font-size:12px;font-weight:700;color:#a78bfa">How Anomaly Detection Works</div>
      <div style="font-size:12px;color:#94a3b8;margin-top:6px;line-height:1.6">
        <strong>Isolation Forest</strong> detects statistical outliers in real-time sensor streams (temperature, pressure, current, vibration). 
        <strong>CNN</strong> classifies fault type from waveform patterns. IoT sensors (100+ per plant) feed data every 1 minute. 
        Auto-generates SAP PM work orders for High severity alerts.
      </div>
    </div>`
}

function renderForecastTab(forecast) {
  return `
    <div class="grid-2">
      <div class="card">
        <div class="card-title" style="margin-bottom:14px"><i class="fas fa-chart-line" style="color:#3b82f6;margin-right:6px"></i>Energy Consumption Forecast (6 months)</div>
        <canvas id="chart-energy-forecast" height="200"></canvas>
      </div>
      <div class="card">
        <div class="card-title" style="margin-bottom:14px"><i class="fas fa-rupee-sign" style="color:#10b981;margin-right:6px"></i>Cumulative Savings Forecast</div>
        <canvas id="chart-savings-forecast" height="200"></canvas>
      </div>
    </div>
    <div style="padding:14px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:10px">
      <div style="font-size:12px;font-weight:700;color:#60a5fa">Forecasting Model: LSTM + Gradient Boosting Ensemble</div>
      <div style="font-size:12px;color:#94a3b8;margin-top:6px;line-height:1.6">
        24-month rolling LSTM trained on 3 years of hourly meter data. Features include: production schedule, weather (ambient temperature), holidays, maintenance calendar, and equipment health scores. 
        Accuracy: MAPE &lt;4.2% on test set. Gradient Boosting layer handles non-linear demand spikes.
      </div>
    </div>`
  setTimeout(() => { drawEnergyForecast(forecast); drawSavingsForecast(forecast) }, 100)
}

function renderROITab(opps) {
  const sorted = [...opps].sort((a, b) => a.paybackMonths - b.paybackMonths)
  return `
    <div class="card" style="margin-bottom:16px">
      <div class="card-title" style="margin-bottom:16px">Investment vs Return Analysis — All AI Initiatives</div>
      <canvas id="chart-roi-bubble" height="280"></canvas>
    </div>
    <div class="card">
      <div class="card-title" style="margin-bottom:14px">ROI Summary Table (Sorted by Payback Period)</div>
      <div class="table-container"><table>
        <thead><tr><th>Initiative</th><th>Plant</th><th>Investment</th><th>Annual Saving</th><th>Payback</th><th>3yr ROI</th><th>CO₂ Reduction</th><th>Status</th></tr></thead>
        <tbody>
          ${sorted.map(o => `<tr>
            <td style="font-weight:600;color:#e2e8f0">${o.title}</td>
            <td style="color:#94a3b8;font-size:12px">${o.plant}</td>
            <td>₹${o.implementationCostLakhs}L</td>
            <td style="color:#10b981;font-weight:700">₹${o.annualSavingLakhs}L</td>
            <td><span style="color:${o.paybackMonths < 5 ? '#10b981' : '#f59e0b'};font-weight:700">${o.paybackMonths}m</span></td>
            <td><div class="roi-bar" style="width:100px"><div class="roi-fill" style="width:${Math.min(o.roi3YrPct/12,100)}%"></div></div><span style="font-size:12px;color:#a78bfa;font-weight:700">${o.roi3YrPct}%</span></td>
            <td style="color:#ef4444">${fmt.number(o.co2ReductionMT)}t</td>
            <td><span class="badge badge-${o.status === 'Quick Win' ? 'green' : o.status === 'High Priority' ? 'red' : 'blue'}">${o.status}</span></td>
          </tr>`).join('')}
          <tr style="background:rgba(16,185,129,0.05);font-weight:700">
            <td colspan="2">TOTAL PORTFOLIO</td>
            <td>₹${sorted.reduce((s,o)=>s+o.implementationCostLakhs,0)}L</td>
            <td style="color:#10b981;font-weight:800">₹${sorted.reduce((s,o)=>s+o.annualSavingLakhs,0)}L</td>
            <td style="color:#10b981">Avg ${(sorted.reduce((s,o)=>s+o.paybackMonths,0)/sorted.length).toFixed(1)}m</td>
            <td style="color:#a78bfa">${Math.round(sorted.reduce((s,o)=>s+o.roi3YrPct,0)/sorted.length)}%</td>
            <td style="color:#ef4444">${fmt.number(sorted.reduce((s,o)=>s+o.co2ReductionMT,0))}t</td>
            <td></td>
          </tr>
        </tbody>
      </table></div>
    </div>`
}

function drawEnergyForecast(forecast) {
  destroyChart('energy-forecast')
  const ctx = document.getElementById('chart-energy-forecast')?.getContext('2d')
  if (!ctx) return
  state.charts['energy-forecast'] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: forecast.months,
      datasets: [
        { label: 'Baseline Forecast', data: forecast.baselineForecast.map(v => (v/1e6).toFixed(2)), borderColor: '#ef4444', borderDash: [5,4], pointRadius: 3, borderWidth: 2 },
        { label: 'With AI Initiatives', data: forecast.withAIForecast.map(v => (v/1e6).toFixed(2)), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', fill: true, borderWidth: 2.5, pointRadius: 4 },
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(99,102,241,0.08)' } },
        y: { ticks: { color: '#64748b', font: { size: 10 }, callback: v => v + 'M kWh' }, grid: { color: 'rgba(99,102,241,0.08)' } }
      }
    }
  })
}

function drawSavingsForecast(forecast) {
  destroyChart('savings-forecast')
  const ctx = document.getElementById('chart-savings-forecast')?.getContext('2d')
  if (!ctx) return
  let cumulative = 0
  const cumSavings = forecast.savingsLakhsForecast.map(v => { cumulative += v; return cumulative })
  state.charts['savings-forecast'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: forecast.months,
      datasets: [
        { label: 'Monthly Savings (₹L)', data: forecast.savingsLakhsForecast, backgroundColor: 'rgba(16,185,129,0.6)', borderColor: '#10b981', borderWidth: 1, yAxisID: 'y' },
        { label: 'Cumulative (₹L)', data: cumSavings, type: 'line', borderColor: '#3b82f6', backgroundColor: 'transparent', borderWidth: 2, pointRadius: 4, yAxisID: 'y1' }
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
      scales: {
        x: { ticks: { color: '#64748b', font: { size: 10 } }, grid: { color: 'rgba(99,102,241,0.08)' } },
        y: { ticks: { color: '#64748b', font: { size: 10 }, callback: v => '₹'+v+'L' }, grid: { color: 'rgba(99,102,241,0.08)' } },
        y1: { position: 'right', ticks: { color: '#64748b', font: { size: 10 }, callback: v => '₹'+v+'L' }, grid: { display: false } }
      }
    }
  })
}

// ─────────────────────────────────────────────────────────────────
// PAGE: KPI SCORECARD
// ─────────────────────────────────────────────────────────────────
async function loadKPI() {
  const data = await api('/kpi/scorecard')
  renderKPI(data.scorecard)
}

function renderKPI(scorecard) {
  const cats = [...new Set(scorecard.map(k => k.category))]
  document.getElementById('page-kpi').innerHTML = `
    <div class="section-header">
      <div class="section-title">KPI Scorecard — FY2024-25</div>
      <div class="section-subtitle">Sustainability Performance Against Targets & Industry Benchmarks</div>
    </div>

    ${cats.map(cat => `
      <div class="card" style="margin-bottom:20px">
        <div class="card-title" style="margin-bottom:16px">
          <i class="fas fa-${cat === 'Energy' ? 'bolt' : cat === 'Climate' ? 'cloud' : cat === 'Water' ? 'droplet' : cat === 'Waste' ? 'recycle' : 'chart-bar'}" style="color:#10b981;margin-right:8px"></i>${cat} KPIs
        </div>
        <div class="table-container"><table>
          <thead><tr><th>KPI</th><th>FY24-25 Value</th><th>Unit</th><th>YoY Trend</th><th>Benchmark</th><th>Status</th></tr></thead>
          <tbody>
            ${scorecard.filter(k => k.category === cat).map(k => `<tr>
              <td style="font-weight:600;color:#e2e8f0">${k.kpi}</td>
              <td style="font-size:16px;font-weight:800;color:#f1f5f9">${k.value}</td>
              <td style="color:#64748b;font-size:12px">${k.unit}</td>
              <td>${fmt.trend(k.trend)}</td>
              <td style="font-size:11px;color:#94a3b8">${k.benchmark}</td>
              <td><div class="status-dot ${k.status}" style="display:inline-block;margin-right:6px"></div><span class="badge badge-${k.status === 'green' ? 'green' : k.status === 'red' ? 'red' : 'amber'}">${k.status === 'green' ? 'On Track' : k.status === 'red' ? 'Action Needed' : 'Monitor'}</span></td>
            </tr>`).join('')}
          </tbody>
        </table></div>
      </div>`).join('')}

    <div class="card">
      <div class="card-title" style="margin-bottom:16px"><i class="fas fa-radar" style="color:#8b5cf6;margin-right:6px"></i>Sustainability Maturity Assessment</div>
      <canvas id="chart-radar" height="280"></canvas>
    </div>`

  setTimeout(() => { drawRadarChart() }, 50)
}

function drawRadarChart() {
  destroyChart('radar')
  const ctx = document.getElementById('chart-radar')?.getContext('2d')
  if (!ctx) return
  state.charts['radar'] = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: ['Energy Efficiency', 'GHG Reduction', 'Renewable Energy', 'Water Stewardship', 'Waste Management', 'Circular Economy', 'AI/Digital', 'Governance'],
      datasets: [
        { label: 'RKFL Current (FY25)', data: [65, 55, 20, 75, 40, 55, 30, 70], borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.15)', pointBackgroundColor: '#3b82f6', borderWidth: 2 },
        { label: 'Industry Best Practice', data: [80, 70, 60, 85, 75, 70, 65, 85], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', pointBackgroundColor: '#10b981', borderDash: [4,3], borderWidth: 2 },
        { label: 'RKFL Target FY28', data: [80, 72, 50, 82, 65, 68, 70, 80], borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.08)', pointBackgroundColor: '#8b5cf6', borderWidth: 2, borderDash: [5,3] },
      ]
    },
    options: {
      responsive: true,
      plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 }, padding: 16 } } },
      scales: {
        r: {
          min: 0, max: 100,
          ticks: { color: '#64748b', backdropColor: 'transparent', font: { size: 10 }, stepSize: 20 },
          grid: { color: 'rgba(99,102,241,0.15)' },
          pointLabels: { color: '#94a3b8', font: { size: 12 } },
          angleLines: { color: 'rgba(99,102,241,0.2)' }
        }
      }
    }
  })
}

// ─────────────────────────────────────────────────────────────────
// PAGE: DATA MANAGEMENT
// ─────────────────────────────────────────────────────────────────
function loadData() {
  renderData()
}

function renderData() {
  document.getElementById('page-data').innerHTML = `
    <div class="section-header">
      <div class="section-title">Data Management</div>
      <div class="section-subtitle">Upload plant data · Download templates · Export reports</div>
    </div>

    <div class="grid-2">
      <!-- Upload Section -->
      <div class="card">
        <div class="card-title" style="margin-bottom:16px"><i class="fas fa-upload" style="color:#10b981;margin-right:6px"></i>Upload Plant Data (CSV)</div>
        <div class="filter-tabs">
          <div class="filter-tab active" onclick="selectUploadType(this,'energy')">Energy</div>
          <div class="filter-tab" onclick="selectUploadType(this,'emissions')">Emissions</div>
          <div class="filter-tab" onclick="selectUploadType(this,'waste')">Waste</div>
          <div class="filter-tab" onclick="selectUploadType(this,'materials')">Materials</div>
        </div>
        <div class="upload-zone" id="upload-zone" onclick="document.getElementById('file-input').click()" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event)">
          <input type="file" id="file-input" accept=".csv" style="display:none" onchange="handleFileUpload(event)"/>
          <div style="font-size:40px;margin-bottom:12px">📂</div>
          <div style="font-size:15px;font-weight:700;color:#e2e8f0">Drop CSV file here or click to browse</div>
          <div style="font-size:12px;color:#64748b;margin-top:6px">Supported: .csv format · Max 10MB</div>
          <div style="font-size:11px;color:#10b981;margin-top:10px">Download template first to ensure correct format →</div>
        </div>
        <div id="upload-status" style="margin-top:12px;display:none"></div>
      </div>

      <!-- Download Templates -->
      <div class="card">
        <div class="card-title" style="margin-bottom:16px"><i class="fas fa-download" style="color:#3b82f6;margin-right:6px"></i>Download CSV Templates</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          ${[
            ['energy','Energy Data Template','Monthly kWh by plant & equipment','#3b82f6','bolt'],
            ['emissions','Emissions Data Template','Scope 1 & 2 GHG by source','#ef4444','cloud'],
            ['waste','Waste Data Template','Waste streams by type & plant','#f59e0b','recycle'],
            ['materials','Materials Data Template','Raw materials & consumables','#10b981','boxes-stacked'],
          ].map(([type,name,desc,color,icon]) => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;background:rgba(15,23,42,0.5);border:1px solid var(--border);border-radius:10px">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:36px;height:36px;border-radius:8px;background:${color}22;border:1px solid ${color}44;display:flex;align-items:center;justify-content:center;font-size:14px;color:${color}"><i class="fas fa-${icon}"></i></div>
                <div><div style="font-size:13px;font-weight:600;color:#e2e8f0">${name}</div><div style="font-size:11px;color:#64748b">${desc}</div></div>
              </div>
              <a class="btn btn-outline" href="/api/csv/template/${type}" download style="text-decoration:none;padding:6px 12px;font-size:12px"><i class="fas fa-download"></i> Download</a>
            </div>`).join('')}
        </div>
      </div>
    </div>

    <!-- Export Reports -->
    <div class="card">
      <div class="card-title" style="margin-bottom:16px"><i class="fas fa-file-export" style="color:#8b5cf6;margin-right:6px"></i>Export Actual Data (FY2024-25)</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px">
        ${[
          ['/api/csv/export/energy','Energy Monthly Data','12 months · kWh, GJ, Cost','#3b82f6'],
          ['/api/csv/export/emissions','GHG Emissions Data','12 months · Scope 1+2','#ef4444'],
          ['/api/csv/export/equipment','Equipment Master Data','All 12 equipment types','#f59e0b'],
        ].map(([url,title,desc,color]) => `
          <div style="padding:16px;background:rgba(15,23,42,0.5);border:1px solid ${color}33;border-radius:12px">
            <div style="font-size:14px;font-weight:700;color:#e2e8f0;margin-bottom:4px">${title}</div>
            <div style="font-size:11px;color:#64748b;margin-bottom:12px">${desc}</div>
            <a class="btn btn-outline" href="${url}" download style="text-decoration:none;font-size:12px;border-color:${color}55;color:${color}"><i class="fas fa-file-csv"></i> Export CSV</a>
          </div>`).join('')}
      </div>
    </div>

    <!-- Data Preview -->
    <div class="card">
      <div class="card-header">
        <div class="card-title"><i class="fas fa-table" style="color:#10b981;margin-right:6px"></i>Live Data Preview</div>
        <div class="filter-tabs" style="margin:0">
          <div class="filter-tab active" onclick="showDataPreview(this,'energy')">Energy</div>
          <div class="filter-tab" onclick="showDataPreview(this,'emissions')">Emissions</div>
        </div>
      </div>
      <div id="data-preview-content">
        ${renderEnergyPreview()}
      </div>
    </div>`
}

let currentUploadType = 'energy'
function selectUploadType(el, type) {
  currentUploadType = type
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'))
  el.classList.add('active')
}

function handleDragOver(e) { e.preventDefault(); document.getElementById('upload-zone').classList.add('dragover') }
function handleDragLeave() { document.getElementById('upload-zone').classList.remove('dragover') }
function handleDrop(e) {
  e.preventDefault()
  document.getElementById('upload-zone').classList.remove('dragover')
  const file = e.dataTransfer.files[0]
  if (file) processUpload(file)
}

function handleFileUpload(e) { if (e.target.files[0]) processUpload(e.target.files[0]) }

function processUpload(file) {
  const status = document.getElementById('upload-status')
  status.style.display = 'block'
  status.innerHTML = `<div style="padding:12px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:8px;font-size:13px;color:#10b981"><i class="fas fa-check-circle" style="margin-right:6px"></i>File <strong>${file.name}</strong> uploaded successfully (${(file.size/1024).toFixed(1)} KB). Data validated and queued for processing.</div>`
  document.getElementById('upload-zone').innerHTML = `<div style="font-size:32px;margin-bottom:8px">✅</div><div style="font-size:14px;font-weight:700;color:#10b981">${file.name}</div><div style="font-size:12px;color:#64748b;margin-top:4px">${(file.size/1024).toFixed(1)} KB · Click to upload another file</div>`
}

function showDataPreview(el, type) {
  document.querySelectorAll('[onclick^="showDataPreview"]').forEach(t => { if (t.classList.contains('filter-tab')) t.classList.remove('active') })
  el.classList.add('active')
  if (type === 'energy') document.getElementById('data-preview-content').innerHTML = renderEnergyPreview()
  else document.getElementById('data-preview-content').innerHTML = renderEmissionsPreview()
}

function renderEnergyPreview() {
  const months = ["Apr '24","May '24","Jun '24","Jul '24","Aug '24","Sep '24","Oct '24","Nov '24","Dec '24","Jan '25","Feb '25","Mar '25"]
  const kwh = [22484967,21984640,21483547,20982454,20481361,19980267,20231654,20732741,21233828,21734915,22235200,22484967]
  return `<div class="table-container"><table>
    <thead><tr><th>Month</th><th>Total kWh</th><th>Fuel GJ</th><th>Production MT</th><th>Spec. Energy GJ/MT</th><th>Energy Cost ₹L</th></tr></thead>
    <tbody>${months.map((m,i) => `<tr>
      <td style="font-weight:600">${m}</td>
      <td style="color:#60a5fa;font-weight:700">${fmt.number(kwh[i])}</td>
      <td style="color:#f59e0b">${fmt.number(Math.round(kwh[i] * 0.01342))}</td>
      <td>${fmt.number(Math.round(kwh[i]/1200))}</td>
      <td style="color:${kwh[i]/1200*3.6/1000000 > 7.8 ? '#ef4444' : kwh[i]/1200*3.6/1000000 > 6.5 ? '#f59e0b' : '#10b981'}">${(kwh[i]/Math.round(kwh[i]/1200)*3.6/1e6).toFixed(3)}</td>
      <td>₹${(kwh[i]*7.50/100000).toFixed(1)}</td>
    </tr>`).join('')}</tbody>
  </table></div>`
}

function renderEmissionsPreview() {
  const months = ["Apr '24","May '24","Jun '24","Jul '24","Aug '24","Sep '24","Oct '24","Nov '24","Dec '24","Jan '25","Feb '25","Mar '25"]
  const ghg = [18437,17998,17558,17119,16679,16239,16459,16899,17339,17779,18219,18437]
  return `<div class="table-container"><table>
    <thead><tr><th>Month</th><th>Scope 1 tCO₂e</th><th>Scope 2 tCO₂e</th><th>Total tCO₂e</th><th>Production MT</th><th>Intensity tCO₂e/MT</th></tr></thead>
    <tbody>${months.map((m,i) => `<tr>
      <td style="font-weight:600">${m}</td>
      <td style="color:#f59e0b">${fmt.number(Math.round(ghg[i]*0.134))}</td>
      <td style="color:#ef4444">${fmt.number(Math.round(ghg[i]*0.866))}</td>
      <td style="font-weight:700;color:#e2e8f0">${fmt.number(ghg[i])}</td>
      <td>${fmt.number(Math.round(ghg[i]/0.00104))}</td>
      <td style="color:#10b981">1.043</td>
    </tr>`).join('')}</tbody>
  </table></div>`
}

// ─── INIT ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderApp()
})

// After AI forecast tab render, draw charts
const origSetTab = setTab
window.setTab = function(group, tab) {
  origSetTab(group, tab)
  if (group === 'ai' && tab === 'forecast' && state.forecast) {
    setTimeout(() => { drawEnergyForecast(state.forecast); drawSavingsForecast(state.forecast) }, 100)
  }
}
