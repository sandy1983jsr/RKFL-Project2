import { Hono } from 'hono'
import {
  COMPANY_INFO, ANNUAL_ENERGY_SUMMARY, PLANTS, EQUIPMENT_MASTER,
  MONTHS, MONTHLY_KWH_TREND, MONTHLY_FUEL_GJ_TREND, MONTHLY_GHG_TREND,
  MONTHLY_PROD_TREND, PLANT_ENERGY_SHARE, MONTHLY_WATER_KL,
  MONTHLY_WASTE_MT, AI_OPPORTUNITIES, WASTE_STREAMS, MATERIALS_DATA,
  CSV_TEMPLATES, computeKPIs, BENCHMARKS, CARBON_BENCHMARKS,
  ENERGY_COST, ANNUAL_KWH, ANNUAL_GHG_TCO2E, ANNUAL_PROD_MT,
  PLANT_PRODUCTION, ANNUAL_FUEL_GJ
} from '../data/rkfl-data'

export const apiRouter = new Hono()

// ── COMPANY OVERVIEW ────────────────────────────────────────────
apiRouter.get('/overview', (c) => {
  const kpis = computeKPIs()
  return c.json({
    company: COMPANY_INFO,
    kpis,
    energySummary: ANNUAL_ENERGY_SUMMARY,
    benchmarks: { energy: BENCHMARKS, carbon: CARBON_BENCHMARKS },
  })
})

// ── PLANTS ──────────────────────────────────────────────────────
apiRouter.get('/plants', (c) => {
  const plantEnergy = PLANT_ENERGY_SHARE
  const plants = PLANTS.map(p => ({
    ...p,
    monthlyKWh: Math.round((plantEnergy as any)[p.id] || 0),
    annualKWh: Math.round(((plantEnergy as any)[p.id] || 0) * 12),
    energyCostLakhs: Math.round(((plantEnergy as any)[p.id] || 0) * 12 * 7.50 / 100000),
    specificEnergyGJMT: parseFloat(((((plantEnergy as any)[p.id] || 0) * 12 * 3.6 / 1000000) / (p.productionMTY || 1)).toFixed(2)),
  }))
  return c.json({ plants })
})

apiRouter.get('/plants/:id', (c) => {
  const id = c.req.param('id')
  const plant = PLANTS.find(p => p.id === id)
  if (!plant) return c.json({ error: 'Plant not found' }, 404)
  const equipment = EQUIPMENT_MASTER.filter(e => e.plant === id)
  const monthlyKWh = (PLANT_ENERGY_SHARE as any)[id] || 0
  return c.json({
    plant,
    equipment,
    monthlyKWh,
    annualKWh: monthlyKWh * 12,
    energyCostLakhs: Math.round(monthlyKWh * 12 * 7.50 / 100000),
    production: (PLANT_PRODUCTION as any)[id] || 0,
  })
})

// ── EQUIPMENT ───────────────────────────────────────────────────
apiRouter.get('/equipment', (c) => {
  const plant = c.req.query('plant')
  const equipment = plant ? EQUIPMENT_MASTER.filter(e => e.plant === plant) : EQUIPMENT_MASTER
  return c.json({ equipment, total: equipment.length })
})

// ── ENERGY DASHBOARD ────────────────────────────────────────────
apiRouter.get('/energy/summary', (c) => {
  return c.json({
    annualKWh: ANNUAL_KWH,
    annualGJ: ANNUAL_ENERGY_SUMMARY.totalElectricityGJ,
    annualFuelGJ: ANNUAL_FUEL_GJ,
    renewableKWh: Math.round(ANNUAL_ENERGY_SUMMARY.electricityRenewableGJ * 1000000 / 3600),
    renewablePct: ANNUAL_ENERGY_SUMMARY.renewablePct,
    totalEnergyCostLakhs: computeKPIs().totalEnergyCostLakhs,
    electricityCostLakhs: computeKPIs().annualElecCostLakhs,
    fuelCostLakhs: ENERGY_COST.annualFuelCostLakhs,
    energyIntensityGJMT: ANNUAL_ENERGY_SUMMARY.energyIntensityGJPerMT,
    benchmarkIndustry: BENCHMARKS.industryAvg,
    benchmarkBIC: BENCHMARKS.bestInClass,
    benchmarkTarget: BENCHMARKS.rkflTarget2028,
  })
})

apiRouter.get('/energy/monthly', (c) => {
  return c.json({
    months: MONTHS,
    kwhTrend: MONTHLY_KWH_TREND,
    fuelGJTrend: MONTHLY_FUEL_GJ_TREND,
    productionMT: MONTHLY_PROD_TREND,
    specificEnergyGJMT: MONTHLY_KWH_TREND.map((kwh, i) => {
      const prod = MONTHLY_PROD_TREND[i]
      return parseFloat(((kwh * 3.6 / 1000000) / (prod || 1)).toFixed(3))
    }),
    cost: MONTHLY_KWH_TREND.map(kwh => Math.round(kwh * 7.50 / 100000)),
  })
})

apiRouter.get('/energy/plant-breakdown', (c) => {
  const share = PLANT_ENERGY_SHARE
  const labels = ['Plant 1', 'Plant 3', 'Plant 4', 'Plant 5', 'Plants 6,7&9']
  const values = [share.P1, share.P3, share.P4, share.P5, share.P679]
  const colors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6']
  const totalMonthly = values.reduce((a, b) => a + b, 0)
  return c.json({
    labels,
    values: values.map(v => Math.round(v)),
    percentages: values.map(v => parseFloat((v / totalMonthly * 100).toFixed(1))),
    colors,
    totalMonthlyKWh: Math.round(totalMonthly),
  })
})

apiRouter.get('/energy/equipment-breakdown', (c) => {
  const byCategory = EQUIPMENT_MASTER.reduce((acc: any, eq) => {
    const cat = eq.category
    if (!acc[cat]) acc[cat] = 0
    acc[cat] += eq.monthlyKWh
    return acc
  }, {})
  return c.json({
    labels: Object.keys(byCategory),
    values: Object.values(byCategory).map((v: any) => Math.round(v)),
    total: Math.round(Object.values(byCategory).reduce((a: any, b: any) => a + b, 0)),
  })
})

// ── EMISSIONS ───────────────────────────────────────────────────
apiRouter.get('/emissions/summary', (c) => {
  return c.json({
    scope1: ANNUAL_ENERGY_SUMMARY.scope1tCO2e,
    scope2: ANNUAL_ENERGY_SUMMARY.scope2tCO2e,
    total: ANNUAL_GHG_TCO2E,
    intensity: ANNUAL_ENERGY_SUMMARY.emissionIntensity,
    benchmarkIndustry: CARBON_BENCHMARKS.industryAvg,
    benchmarkBIC: CARBON_BENCHMARKS.bestInClass,
    benchmarkTarget: CARBON_BENCHMARKS.rkflTarget2028,
    netZeroYear: COMPANY_INFO.netZeroTarget,
    months: MONTHS,
    monthlyTrend: MONTHLY_GHG_TREND,
  })
})

apiRouter.get('/emissions/scope-breakdown', (c) => {
  // Scope 1: Propane + Furnace Oil combustion
  // Scope 2: Grid electricity
  return c.json({
    scope1: {
      total: ANNUAL_ENERGY_SUMMARY.scope1tCO2e,
      pct: parseFloat((ANNUAL_ENERGY_SUMMARY.scope1tCO2e / ANNUAL_GHG_TCO2E * 100).toFixed(1)),
      sources: [
        { name: "Propane Combustion", tCO2e: 18420, pct: 67.4 },
        { name: "Furnace Oil Combustion", tCO2e: 8930, pct: 32.6 },
      ]
    },
    scope2: {
      total: ANNUAL_ENERGY_SUMMARY.scope2tCO2e,
      pct: parseFloat((ANNUAL_ENERGY_SUMMARY.scope2tCO2e / ANNUAL_GHG_TCO2E * 100).toFixed(1)),
      sources: [
        { name: "Grid Electricity", tCO2e: 177123.70, pct: 100 }
      ]
    },
  })
})

// ── WATER & WASTE ────────────────────────────────────────────────
apiRouter.get('/water/summary', (c) => {
  return c.json({
    annualKL: ANNUAL_ENERGY_SUMMARY.waterWithdrawalKL,
    intensityKLMT: ANNUAL_ENERGY_SUMMARY.waterIntensityKLPerMT,
    months: MONTHS,
    monthlyTrend: MONTHLY_WATER_KL,
    sources: [
      { name: "Groundwater", kl: 171846, pct: 49.7 },
      { name: "Third-party / Municipal", kl: 159304, pct: 46.1 },
      { name: "Rainwater Harvesting", kl: 14464, pct: 4.2 },
    ],
    zldPlants: 3,
  })
})

apiRouter.get('/waste/summary', (c) => {
  return c.json({
    annualMT: ANNUAL_ENERGY_SUMMARY.totalWasteMT,
    hazardousMT: ANNUAL_ENERGY_SUMMARY.hazardousWasteMT,
    recycledMT: ANNUAL_ENERGY_SUMMARY.recycledWasteMT,
    recyclePct: parseFloat((ANNUAL_ENERGY_SUMMARY.recycledWasteMT / ANNUAL_ENERGY_SUMMARY.totalWasteMT * 100).toFixed(1)),
    months: MONTHS,
    monthlyTrend: MONTHLY_WASTE_MT,
    streams: WASTE_STREAMS,
    categories: [
      { name: "Hazardous", mt: 266.747, color: "#ef4444" },
      { name: "Battery Waste", mt: 33.712, color: "#f59e0b" },
      { name: "E-Waste", mt: 8.622, color: "#8b5cf6" },
      { name: "Bio-medical", mt: 0.018, color: "#ec4899" },
    ],
    annualWasteRevenueINR: WASTE_STREAMS.reduce((s, w) => s + w.monthlyMT * w.recyclePct / 100 * w.revenuePerMT * 12, 0),
  })
})

// ── MATERIALS ────────────────────────────────────────────────────
apiRouter.get('/materials/summary', (c) => {
  return c.json({ materials: MATERIALS_DATA })
})

// ── AI ANALYTICS ─────────────────────────────────────────────────
apiRouter.get('/ai/opportunities', (c) => {
  const category = c.req.query('category')
  const status = c.req.query('status')
  let opps = [...AI_OPPORTUNITIES]
  if (category) opps = opps.filter(o => o.category === category)
  if (status) opps = opps.filter(o => o.status === status)
  const totalSavings = opps.reduce((s, o) => s + o.annualSavingLakhs, 0)
  const totalCO2 = opps.reduce((s, o) => s + o.co2ReductionMT, 0)
  const totalInvestment = opps.reduce((s, o) => s + o.implementationCostLakhs, 0)
  return c.json({
    opportunities: opps,
    summary: {
      count: opps.length,
      totalSavingsLakhs: totalSavings,
      totalCO2ReductionMT: totalCO2,
      totalInvestmentLakhs: totalInvestment,
      avgPaybackMonths: parseFloat((opps.reduce((s, o) => s + o.paybackMonths, 0) / opps.length).toFixed(1)),
      avgROI3Yr: Math.round(opps.reduce((s, o) => s + o.roi3YrPct, 0) / opps.length),
    }
  })
})

apiRouter.get('/ai/opportunities/:id', (c) => {
  const id = c.req.param('id')
  const opp = AI_OPPORTUNITIES.find(o => o.id === id)
  if (!opp) return c.json({ error: 'Not found' }, 404)
  return c.json(opp)
})

// AI Anomaly Detection endpoint (simulated)
apiRouter.get('/ai/anomaly-detection', (c) => {
  const anomalies = [
    { id: "ANO001", plant: "P5", equipment: "IBH Furnace #3", detectedAt: "2025-03-28 14:32", type: "Temperature Deviation", severity: "High", value: "Temp spike +45°C above setpoint", action: "Reduce gas flow, check thermocouple", status: "Open", potentialSavingKWh: 8400 },
    { id: "ANO002", plant: "P1", equipment: "Compressor #2", detectedAt: "2025-03-29 09:15", type: "Pressure Drop Anomaly", severity: "Medium", value: "Delivery pressure -1.8 bar from setpoint", action: "Check for leaks, inspect valves", status: "Open", potentialSavingKWh: 2100 },
    { id: "ANO003", plant: "P4", equipment: "Induction Furnace", detectedAt: "2025-03-30 11:45", type: "Power Factor Degradation", severity: "Medium", value: "PF dropped to 0.74 (target 0.92)", action: "Inspect capacitor bank, check coil", status: "In Progress", potentialSavingKWh: 5600 },
    { id: "ANO004", plant: "P679", equipment: "Furnace Line A", detectedAt: "2025-03-30 16:22", type: "Idle Energy Loss", severity: "Low", value: "Furnace idle >90 min at full temp", action: "Implement auto setback on idle", status: "Resolved", potentialSavingKWh: 3200 },
    { id: "ANO005", plant: "P5", equipment: "Heat Treatment #2", detectedAt: "2025-03-31 08:05", type: "Excess Atmosphere Gas", severity: "High", value: "Excess atmosphere flow +38%", action: "Recalibrate atmosphere controller", status: "Open", potentialSavingKWh: 7200 },
  ]
  return c.json({ anomalies, totalOpen: anomalies.filter(a => a.status === 'Open').length })
})

// AI Forecasting endpoint (simulated)
apiRouter.get('/ai/forecast', (c) => {
  const futureMonths = ["Apr '25","May '25","Jun '25","Jul '25","Aug '25","Sep '25"]
  const baseKWh = MONTHLY_KWH_TREND[11]
  const trend = -0.008 // -0.8% monthly improvement from AI initiatives
  return c.json({
    months: futureMonths,
    baselineForecast: futureMonths.map((_, i) => Math.round(baseKWh * (1 + i * 0.005))),
    withAIForecast: futureMonths.map((_, i) => Math.round(baseKWh * Math.pow(1 + trend, i + 1))),
    ghgForecast: futureMonths.map((_, i) => Math.round(MONTHLY_GHG_TREND[11] * Math.pow(1 + trend * 1.1, i + 1))),
    savingsLakhsForecast: futureMonths.map((_, i) => Math.round(180 + i * 35)),
  })
})

// ── DIGITAL TWIN ─────────────────────────────────────────────────
apiRouter.get('/digital-twin/plants', (c) => {
  const twinData = PLANTS.map(plant => {
    const equipment = EQUIPMENT_MASTER.filter(e => e.plant === plant.id)
    const monthlyKWh = (PLANT_ENERGY_SHARE as any)[plant.id] || 0
    const production = (PLANT_PRODUCTION as any)[plant.id] || 0
    const ghgShare = ANNUAL_GHG_TCO2E * (monthlyKWh / Object.values(PLANT_ENERGY_SHARE).reduce((a, b) => a + b, 0)) / 12

    return {
      ...plant,
      equipment: equipment.map(eq => ({
        ...eq,
        energySharePct: parseFloat((eq.monthlyKWh / monthlyKWh * 100).toFixed(1)),
        annualCostLakhs: parseFloat((eq.monthlyKWh * 12 * 7.50 / 100000).toFixed(1)),
        annualCO2tonne: parseFloat((eq.monthlyKWh * 12 * 0.82 / 1000).toFixed(0)),
        oee: Math.round(72 + Math.random() * 15),
        availability: parseFloat((88 + Math.random() * 8).toFixed(1)),
        performance: parseFloat((82 + Math.random() * 10).toFixed(1)),
        quality: parseFloat((94 + Math.random() * 4).toFixed(1)),
      })),
      monthlyKWh: Math.round(monthlyKWh),
      monthlyGHGtCO2e: parseFloat(ghgShare.toFixed(1)),
      specificEnergyGJMT: parseFloat(((monthlyKWh * 12 * 3.6 / 1e6) / production).toFixed(2)),
      production,
    }
  })
  return c.json({ plants: twinData })
})

// ── KPI SCORECARD ─────────────────────────────────────────────────
apiRouter.get('/kpi/scorecard', (c) => {
  const kpis = computeKPIs()
  const scorecard = [
    { category: "Energy", kpi: "Total Energy Consumption", value: "13,22,953 GJ", unit: "GJ", trend: "-1.2%", status: "green", benchmark: "Industry Avg: 15.8 lakh GJ" },
    { category: "Energy", kpi: "Energy Intensity", value: "6.75", unit: "GJ/MT", trend: "-3.1%", status: "yellow", benchmark: "Target: 5.8 GJ/MT by FY28" },
    { category: "Energy", kpi: "Renewable Energy Share", value: "3.4%", unit: "%", trend: "+1.8%", status: "red", benchmark: "Target: 50% by FY28" },
    { category: "Climate", kpi: "Total GHG Emissions", value: "2,04,474", unit: "tCO₂e", trend: "-0.8%", status: "yellow", benchmark: "Target: Net Zero by 2040" },
    { category: "Climate", kpi: "Carbon Intensity", value: "1.043", unit: "tCO₂e/MT", trend: "-2.1%", status: "yellow", benchmark: "Best-in-class: 0.85" },
    { category: "Water", kpi: "Water Consumption", value: "3,45,613", unit: "KL", trend: "-0.5%", status: "green", benchmark: "ZLD achieved in 3 plants" },
    { category: "Water", kpi: "Water Intensity", value: "1.76", unit: "KL/MT", trend: "-1.1%", status: "green", benchmark: "Industry Avg: 2.1 KL/MT" },
    { category: "Waste", kpi: "Total Waste Generated", value: "309.1", unit: "MT", trend: "+2.3%", status: "yellow", benchmark: "Target: Zero-to-landfill" },
    { category: "Waste", kpi: "Waste Recycled", value: "30.7%", unit: "%", trend: "+4.2%", status: "yellow", benchmark: "Target: 80% by FY28" },
    { category: "Financial", kpi: "Energy Cost", value: kpis.totalEnergyCostLakhs.toLocaleString(), unit: "₹ Lakhs", trend: "+1.9%", status: "red", benchmark: `${kpis.energyPctRevenue}% of revenue` },
    { category: "Financial", kpi: "Revenue", value: "3,63,430", unit: "₹ Lakhs", trend: "+3.86%", status: "green", benchmark: "FY24: ₹3,49,933 Lakhs" },
    { category: "Financial", kpi: "EBITDA", value: "61,086", unit: "₹ Lakhs", trend: "-20.3%", status: "red", benchmark: "FY24: ₹76,632 Lakhs" },
  ]
  return c.json({ scorecard })
})

// ── CSV DOWNLOAD ──────────────────────────────────────────────────
apiRouter.get('/csv/template/:type', (c) => {
  const type = c.req.param('type') as keyof typeof CSV_TEMPLATES
  const template = CSV_TEMPLATES[type]
  if (!template) return c.json({ error: 'Template not found' }, 404)

  let csv = template.headers.join(',') + '\n'
  template.sampleRows.forEach(row => {
    csv += row.map((v: string) => `"${v}"`).join(',') + '\n'
  })

  c.header('Content-Type', 'text/csv')
  c.header('Content-Disposition', `attachment; filename="${template.name}.csv"`)
  return c.body(csv)
})

// Export actual data as CSV
apiRouter.get('/csv/export/energy', (c) => {
  let csv = 'Month,Total_kWh,Fuel_GJ,Production_MT,Specific_Energy_GJ_per_MT,Energy_Cost_Lakhs\n'
  MONTHS.forEach((m, i) => {
    const kwh = MONTHLY_KWH_TREND[i]
    const fuelGJ = MONTHLY_FUEL_GJ_TREND[i]
    const prod = MONTHLY_PROD_TREND[i]
    const se = ((kwh * 3.6 / 1e6) / prod).toFixed(3)
    const cost = (kwh * 7.50 / 100000).toFixed(2)
    csv += `"${m}",${kwh},${fuelGJ},${prod},${se},${cost}\n`
  })
  c.header('Content-Type', 'text/csv')
  c.header('Content-Disposition', 'attachment; filename="RKFL_Energy_FY2024-25.csv"')
  return c.body(csv)
})

apiRouter.get('/csv/export/emissions', (c) => {
  let csv = 'Month,Scope1_tCO2e,Scope2_tCO2e,Total_tCO2e,Production_MT,Carbon_Intensity_tCO2e_per_MT\n'
  MONTHS.forEach((m, i) => {
    const total = MONTHLY_GHG_TREND[i]
    const scope1 = Math.round(total * 0.1338)
    const scope2 = Math.round(total * 0.8662)
    const prod = MONTHLY_PROD_TREND[i]
    const ci = (total / prod).toFixed(4)
    csv += `"${m}",${scope1},${scope2},${total},${prod},${ci}\n`
  })
  c.header('Content-Type', 'text/csv')
  c.header('Content-Disposition', 'attachment; filename="RKFL_Emissions_FY2024-25.csv"')
  return c.body(csv)
})

apiRouter.get('/csv/export/equipment', (c) => {
  let csv = 'Equipment_ID,Plant,Equipment_Name,Count,Type,Rated_Capacity,Monthly_kWh,Fuel_Type,Annual_kWh,Annual_Cost_Lakhs,Annual_CO2_tonne\n'
  EQUIPMENT_MASTER.forEach(eq => {
    const annual = eq.monthlyKWh * 12
    const cost = (annual * 7.50 / 100000).toFixed(1)
    const co2 = (annual * 0.82 / 1000).toFixed(0)
    csv += `"${eq.id}","${eq.plant}","${eq.name}",${eq.count},"${eq.type}","${eq.ratedCapacity}",${eq.monthlyKWh},"${eq.fuelType}",${annual},${cost},${co2}\n`
  })
  c.header('Content-Type', 'text/csv')
  c.header('Content-Disposition', 'attachment; filename="RKFL_Equipment_Master.csv"')
  return c.body(csv)
})

// ── HEALTH CHECK ──────────────────────────────────────────────────
apiRouter.get('/health', (c) => c.json({ status: 'ok', platform: 'RKFL Green Command & Control', version: '1.0.0', timestamp: new Date().toISOString() }))
