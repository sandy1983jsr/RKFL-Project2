// ============================================================
// RKFL GREEN COMMAND & CONTROL — MASTER DATA
// Source: RKFL Annual Report FY2024-25 + BRSR FY2024-25
// Prepared by: PwC Sustainability Practice
// ============================================================

export const COMPANY_INFO = {
  name: "Ramkrishna Forgings Limited",
  shortName: "RKFL",
  location: "Jamshedpur, Jharkhand",
  reportingYear: "FY2024-25",
  totalProduction: 196023, // MT
  revenue: 363429.92, // Lakhs INR
  ebitda: 61085.75, // Lakhs INR
  pat: 40182.01, // Lakhs INR
  netZeroTarget: 2040,
  renewableTargetYear: 2028,
  renewableTargetPct: 50,
  solarInstalledMW: 8.73,
  solarPlannedMW: 8.30,
}

export const ANNUAL_ENERGY_SUMMARY = {
  totalEnergyGJ: 1322953,
  electricityRenewableGJ: 31146,
  electricityNonRenewableGJ: 878391,
  totalElectricityGJ: 909537,
  totalFuelGJ: 413056,
  energyIntensityGJPerMT: 6.75,
  scope1tCO2e: 27350.74,
  scope2tCO2e: 177123.70,
  totalGHGtCO2e: 204474.44,
  emissionIntensity: 1.043, // tCO2e/MT
  waterWithdrawalKL: 345613,
  waterIntensityKLPerMT: 1.76,
  totalWasteMT: 309.099,
  hazardousWasteMT: 266.747,
  recycledWasteMT: 95.007,
  renewablePct: 3.4, // % of total electricity
}

// Plant definitions matching provided equipment data
export const PLANTS = [
  {
    id: "P1",
    name: "Plant 1",
    location: "Adityapur, Jamshedpur",
    type: "Forging & Machining",
    productionMTY: 47352,
    capacityUtilPct: 72,
    areaM2: 18500,
    employees: 420,
    solarMW: 2.1,
    monthlyEnergyBudgetINR: 4200000,
  },
  {
    id: "P3",
    name: "Plant 3",
    location: "Gamharia, Jamshedpur",
    type: "Precision Components",
    productionMTY: 18500,
    capacityUtilPct: 68,
    areaM2: 9200,
    employees: 210,
    solarMW: 0.8,
    monthlyEnergyBudgetINR: 1800000,
  },
  {
    id: "P4",
    name: "Plant 4",
    location: "Saraikela, Jamshedpur",
    type: "Heavy Forgings",
    productionMTY: 28700,
    capacityUtilPct: 65,
    areaM2: 14000,
    employees: 310,
    solarMW: 1.5,
    monthlyEnergyBudgetINR: 3100000,
  },
  {
    id: "P5",
    name: "Plant 5",
    location: "Dugni, Jamshedpur",
    type: "Press & Ring Rolling",
    productionMTY: 116130,
    capacityUtilPct: 58.5,
    areaM2: 42000,
    employees: 780,
    solarMW: 3.2,
    monthlyEnergyBudgetINR: 11200000,
  },
  {
    id: "P679",
    name: "Plants 6, 7 & 9",
    location: "Kandra, Jamshedpur",
    type: "Integrated Forging",
    productionMTY: 32541,
    capacityUtilPct: 61,
    areaM2: 22000,
    employees: 450,
    solarMW: 1.13,
    monthlyEnergyBudgetINR: 6400000,
  },
]

// Equipment master with monthly kWh from provided data
export const EQUIPMENT_MASTER = [
  // PLANT 1
  { id: "E001", plant: "P1", name: "IBH Furnace", count: 11, type: "Furnace", ratedCapacity: "1200T & 250T", monthlyKWh: 2234059, fuelType: "Electricity", criticality: "Critical", category: "Furnace" },
  { id: "E002", plant: "P1", name: "Air Compressor", count: 6, type: "Compressor", ratedCapacity: "2000 CFM×5, 500 CFM×1", monthlyKWh: 367656, fuelType: "Electricity", criticality: "High", category: "Utility" },
  { id: "E003", plant: "P1", name: "Heat Treatment Furnace", count: 4, type: "Furnace", ratedCapacity: "1200T & 500T", monthlyKWh: 217374.5, fuelType: "Furnace Oil", criticality: "Critical", category: "Furnace" },
  { id: "E004", plant: "P1", name: "Cooling Tower", count: 2, type: "Cooling", ratedCapacity: "1200T & 1800T", monthlyKWh: 84140.5, fuelType: "Electricity", criticality: "Medium", category: "Utility" },
  // PLANT 3
  { id: "E005", plant: "P3", name: "Air Compressor", count: 4, type: "Compressor", ratedCapacity: "2000 CFM×2, 500, 200", monthlyKWh: 112056.5, fuelType: "Electricity", criticality: "High", category: "Utility" },
  { id: "E006", plant: "P3", name: "Induction Hardening Machine", count: 4, type: "Induction", ratedCapacity: "250kW×2, 500kW, 150kW", monthlyKWh: 220005.87, fuelType: "Electricity", criticality: "High", category: "Induction" },
  // PLANT 4
  { id: "E007", plant: "P4", name: "Heat Treatment Furnace", count: 2, type: "Furnace", ratedCapacity: "2T & 2.2T", monthlyKWh: 856031.66, fuelType: "Electricity", criticality: "Critical", category: "Furnace" },
  { id: "E008", plant: "P4", name: "Induction Furnace", count: 1, type: "Induction", ratedCapacity: "4000 kW", monthlyKWh: 672195, fuelType: "Electricity", criticality: "Critical", category: "Induction" },
  // PLANT 5
  { id: "E009", plant: "P5", name: "IBH Furnace", count: 10, type: "Furnace", ratedCapacity: "12500T to 3000T", monthlyKWh: 4903193, fuelType: "Electricity", criticality: "Critical", category: "Furnace" },
  { id: "E010", plant: "P5", name: "Press Line", count: 10, type: "Press", ratedCapacity: "12500T to 2000T + Hollow Spindle", monthlyKWh: 803884.41, fuelType: "Electricity + Propane", criticality: "Critical", category: "Press" },
  { id: "E011", plant: "P5", name: "Heat Treatment Furnace", count: 8, type: "Furnace", ratedCapacity: "4T, 2T×1, 2T×2, 2T×3", monthlyKWh: 1235138, fuelType: "Electricity + Propane", criticality: "Critical", category: "Furnace" },
  // PLANTS 6,7,9
  { id: "E012", plant: "P679", name: "IBH Furnace & Others", count: 20, type: "Furnace", ratedCapacity: "500T–1500T", monthlyKWh: 3034068, fuelType: "Mixed (Elec + Propane)", criticality: "Critical", category: "Furnace" },
]

// Total monthly kWh from equipment master
export const TOTAL_MONTHLY_KWH = EQUIPMENT_MASTER.reduce((s, e) => s + e.monthlyKWh, 0)
// = ~14,539,803 kWh/month

// Monthly trend data (12 months) — generated from annual totals with seasonal variation
export function generateMonthlyTrend(annualTotal: number, seasonality: number[] = []) {
  const base = annualTotal / 12
  const factors = seasonality.length === 12 ? seasonality : [1.08,1.05,1.02,0.98,0.95,0.92,0.94,0.97,1.0,1.03,1.05,1.08]
  const sum = factors.reduce((a, b) => a + b, 0)
  return factors.map(f => Math.round(base * f * 12 / sum))
}

export const MONTHS = ["Apr '24","May '24","Jun '24","Jul '24","Aug '24","Sep '24","Oct '24","Nov '24","Dec '24","Jan '25","Feb '25","Mar '25"]

// Annual electricity = 909537 GJ → kWh = 909537*1000/3.6 = 252,649,167 kWh
export const ANNUAL_KWH = 252649167
export const MONTHLY_KWH_TREND = generateMonthlyTrend(ANNUAL_KWH, [1.08,1.06,1.04,1.01,0.98,0.95,0.93,0.96,0.99,1.02,1.05,1.08])

// Fuel consumption monthly (413056 GJ annually, propane + furnace oil)
export const ANNUAL_FUEL_GJ = 413056
export const MONTHLY_FUEL_GJ_TREND = generateMonthlyTrend(ANNUAL_FUEL_GJ, [1.10,1.07,1.03,1.00,0.96,0.92,0.94,0.97,1.00,1.03,1.06,1.10])

// GHG scope 1+2 monthly trend
export const ANNUAL_GHG_TCO2E = 204474.44
export const MONTHLY_GHG_TREND = generateMonthlyTrend(ANNUAL_GHG_TCO2E)

// Production monthly (tonnes)
export const ANNUAL_PROD_MT = 196023
export const MONTHLY_PROD_TREND = generateMonthlyTrend(ANNUAL_PROD_MT, [0.95,1.0,1.02,0.98,1.05,1.08,1.10,1.05,1.0,0.97,0.95,0.92])

// Plant-wise energy share (kWh/month) based on equipment data
export const PLANT_ENERGY_SHARE = {
  P1: 2234059 + 367656 + 217374.5 + 84140.5,  // 2,903,230
  P3: 112056.5 + 220005.87,                      // 332,062
  P4: 856031.66 + 672195,                        // 1,528,227
  P5: 4903193 + 803884.41 + 1235138,             // 6,942,215
  P679: 3034068,                                  // 3,034,068
}

// Water monthly (345,613 KL annual)
export const MONTHLY_WATER_KL = generateMonthlyTrend(345613, [0.92,0.95,1.02,1.08,1.12,1.15,1.10,1.05,1.0,0.97,0.93,0.90])

// Waste monthly (309.099 MT annual)
export const MONTHLY_WASTE_MT = generateMonthlyTrend(309.099).map(v => parseFloat(v.toFixed(2)))

// Production by plant (MT/year)
export const PLANT_PRODUCTION = { P1: 47352, P3: 18500, P4: 28700, P5: 116130, P679: 32541 }

// Energy intensity benchmarks (GJ/MT)
export const BENCHMARKS = {
  industryAvg: 7.8,
  bestInClass: 5.2,
  rkflCurrent: 6.75,
  rkflTarget2028: 5.8,
}

// Carbon intensity benchmarks (tCO2e/MT)
export const CARBON_BENCHMARKS = {
  industryAvg: 1.35,
  bestInClass: 0.85,
  rkflCurrent: 1.043,
  rkflTarget2028: 0.80,
}

// Cost data (INR)
export const ENERGY_COST = {
  electricityPerKWh: 7.50, // INR/kWh (industrial tariff Jharkhand)
  furnaceOilPerLitre: 92,   // INR/litre
  propanePerKg: 85,         // INR/kg
  furnaceOilGJPerLitre: 0.0373, // GJ/litre
  propaneGJPerKg: 0.0463,   // GJ/kg
  annualElecCostLakhs: Math.round(252649167 * 7.50 / 100000) / 100, // ~18948 Lakhs
  annualFuelCostLakhs: 2840, // estimated from fuel mix
}

// AI Opportunities database
export const AI_OPPORTUNITIES = [
  {
    id: "AI001",
    title: "IBH Furnace Temperature Optimization",
    plant: "P1 & P5",
    equipment: "IBH Furnace",
    category: "Energy Optimization",
    technique: "Model Predictive Control (MPC) + LSTM Neural Network",
    currentKPI: "Avg. billet temp variance: ±28°C",
    targetKPI: "±8°C",
    annualSavingLakhs: 420,
    co2ReductionMT: 1850,
    implementationCostLakhs: 185,
    paybackMonths: 5.3,
    roi3YrPct: 580,
    status: "Recommended",
    complexity: "Medium",
    description: "Deploy MPC with real-time feedback from thermocouples. LSTM predicts optimal heating curves based on billet grade/size. Reduces idle heat loss by 18–22%, lowers specific energy by 0.4 GJ/MT on furnaces.",
    kpis: ["Specific energy GJ/MT", "Billet rejection rate %", "Furnace availability %"],
    dataNeeded: ["Thermocouple readings (1-min interval)", "Production schedule", "Billet grade & weight", "Fuel flow rate"],
  },
  {
    id: "AI002",
    title: "Press Line Load Prediction & Scheduling",
    plant: "P5",
    equipment: "Press Line",
    category: "Demand Management",
    technique: "Gradient Boosting + Genetic Algorithm Scheduler",
    currentKPI: "Peak demand charge: ~₹3.2Cr/yr",
    targetKPI: "₹1.8Cr/yr",
    annualSavingLakhs: 140,
    co2ReductionMT: 420,
    implementationCostLakhs: 65,
    paybackMonths: 5.6,
    roi3YrPct: 446,
    status: "Recommended",
    complexity: "Low",
    description: "Predict hourly electricity demand using production schedule + historical demand patterns. Genetic algorithm re-sequences press operations to shave peak demand by 30–40%. Eliminates peak demand penalty charges.",
    kpis: ["Peak demand kVA", "Load factor %", "Demand charge INR/month"],
    dataNeeded: ["Hourly meter data", "Production schedule", "Equipment start/stop logs"],
  },
  {
    id: "AI003",
    title: "Compressor Network Pressure Optimization",
    plant: "P1 & P3",
    equipment: "Air Compressor",
    category: "Utility Optimization",
    technique: "Reinforcement Learning (RL) Pressure Controller",
    currentKPI: "System pressure: 8.5 bar",
    targetKPI: "7.2 bar min required",
    annualSavingLakhs: 95,
    co2ReductionMT: 315,
    implementationCostLakhs: 28,
    paybackMonths: 3.5,
    roi3YrPct: 918,
    status: "Quick Win",
    complexity: "Low",
    description: "RL agent learns optimal compressor staging to maintain minimum required pressure. Leak detection via acoustic IoT sensors. Every 1 bar pressure reduction saves ~6–7% energy. Network of 10 compressors.",
    kpis: ["System pressure bar", "Leakage rate L/min", "Specific power kW/CFM"],
    dataNeeded: ["Pressure sensors (5-min interval)", "Flow meters", "Compressor kWh meters", "Leak survey data"],
  },
  {
    id: "AI004",
    title: "Heat Treatment Furnace Atmosphere Control",
    plant: "P1 & P4",
    equipment: "Heat Treatment Furnace",
    category: "Quality + Energy",
    technique: "Physics-informed Neural Network (PINN) + PID Control",
    currentKPI: "Re-heat rate: 4.2%, Specific energy: 0.72 GJ/MT",
    targetKPI: "Re-heat rate: <1.5%, Specific energy: 0.55 GJ/MT",
    annualSavingLakhs: 280,
    co2ReductionMT: 720,
    implementationCostLakhs: 120,
    paybackMonths: 5.1,
    roi3YrPct: 600,
    status: "Recommended",
    complexity: "High",
    description: "PINN embeds metallurgical equations (Avrami, JMA model) to predict microstructure evolution in real-time. Adaptive atmosphere control (CO2, N2, endothermic gas) reduces cycle time by 15% and rejects by 65%.",
    kpis: ["Reheat rate %", "Hardness Cpk", "Specific energy GJ/MT", "Case depth μm"],
    dataNeeded: ["Atmosphere gas analyzers", "Part geometry & grade", "Hardness test logs", "Thermocouple profiles"],
  },
  {
    id: "AI005",
    title: "Induction Furnace Power Factor & Coil Efficiency",
    plant: "P4",
    equipment: "Induction Furnace",
    category: "Energy Optimization",
    technique: "Electromagnetic FEA Simulation + Bayesian Optimization",
    currentKPI: "Power factor: 0.82, Efficiency: 76%",
    targetKPI: "Power factor: 0.95, Efficiency: 88%",
    annualSavingLakhs: 195,
    co2ReductionMT: 540,
    implementationCostLakhs: 90,
    paybackMonths: 5.5,
    roi3YrPct: 567,
    status: "Recommended",
    complexity: "Medium",
    description: "Bayesian optimization of induction coil geometry and frequency using FEA simulation as surrogate model. Auto-capacitor bank switching for PF correction. Modifying coil water cooling channels to improve thermal efficiency.",
    kpis: ["Power factor", "Coil efficiency %", "kWh/MT billet heated", "Reactive power kVAR"],
    dataNeeded: ["Power analyzer data", "Coil current/voltage", "Billet weight & grade", "Temperature profile"],
  },
  {
    id: "AI006",
    title: "Predictive Maintenance — Critical Furnaces",
    plant: "All Plants",
    equipment: "IBH & HT Furnaces",
    category: "Maintenance Optimization",
    technique: "Vibration + Thermal Anomaly Detection (Isolation Forest + CNN)",
    currentKPI: "Unplanned downtime: 8.2%",
    targetKPI: "Unplanned downtime: <2.5%",
    annualSavingLakhs: 520,
    co2ReductionMT: 380,
    implementationCostLakhs: 210,
    paybackMonths: 4.8,
    roi3YrPct: 643,
    status: "High Priority",
    complexity: "Medium",
    description: "IoT-based vibration, current signature, and IR thermal imaging anomaly detection across 49 furnace units. CNN classifies fault type. Isolation Forest detects novel anomalies. Integrates with SAP PM for auto work-order generation.",
    kpis: ["Unplanned downtime %", "MTBF hours", "Maintenance cost INR/MT", "OEE %"],
    dataNeeded: ["Vibration sensors (100Hz)", "Current transformers", "IR thermal camera", "Historical maintenance logs"],
  },
  {
    id: "AI007",
    title: "Digital Twin Energy & CO₂ Optimizer",
    plant: "All Plants",
    equipment: "Full Plant",
    category: "Digital Twin",
    technique: "High-fidelity Process Simulation + Multi-objective Optimization",
    currentKPI: "Energy intensity: 6.75 GJ/MT",
    targetKPI: "5.8 GJ/MT by FY28",
    annualSavingLakhs: 890,
    co2ReductionMT: 2840,
    implementationCostLakhs: 450,
    paybackMonths: 6.1,
    roi3YrPct: 493,
    status: "Strategic",
    complexity: "High",
    description: "Full plant digital twin with mass-energy balance simulation. Aspen Plus-like thermodynamic models for each furnace type. Multi-objective optimizer (NSGA-II) balances energy, throughput, and quality simultaneously.",
    kpis: ["Energy intensity GJ/MT", "Carbon intensity tCO2e/MT", "OEE %", "Cost/tonne INR"],
    dataNeeded: ["All plant sensor feeds", "ERP production data", "Quality lab data", "Utility meters"],
  },
  {
    id: "AI008",
    title: "Solar + Grid Load Balancing AI",
    plant: "All Plants",
    equipment: "Solar + Grid Connection",
    category: "Renewable Integration",
    technique: "LSTM + Rule-based Energy Management System (EMS)",
    currentKPI: "Solar utilization: 68%, Grid import: 96.6%",
    targetKPI: "Solar utilization: 92%, Grid import: 53% by FY28",
    annualSavingLakhs: 340,
    co2ReductionMT: 1620,
    implementationCostLakhs: 95,
    paybackMonths: 3.4,
    roi3YrPct: 1074,
    status: "Quick Win",
    complexity: "Low",
    description: "LSTM forecasts solar generation 24 hours ahead. EMS dynamically shifts shiftable loads (heat treatment, compressors) to coincide with solar generation peaks. Battery storage feasibility assessment included.",
    kpis: ["Solar self-consumption %", "Grid import kWh/month", "Renewable energy % total", "Curtailment rate %"],
    dataNeeded: ["Solar inverter data (15-min)", "Plant-wise substation meters", "Weather data (irradiance, temp)", "Production schedule"],
  },
]

// Waste streams data
export const WASTE_STREAMS = [
  { type: "Mill Scale", monthlyMT: 142.5, recyclable: true, recyclePct: 98, revenuePerMT: 4500 },
  { type: "Forging Flash / Scrap", monthlyMT: 68.2, recyclable: true, recyclePct: 95, revenuePerMT: 42000 },
  { type: "Used Oil", monthlyMT: 8.1, recyclable: true, recyclePct: 100, revenuePerMT: 18000 },
  { type: "Coolant Sludge (ETP)", monthlyMT: 12.4, recyclable: false, recyclePct: 0, revenuePerMT: 0 },
  { type: "Paint Sludge", monthlyMT: 1.8, recyclable: false, recyclePct: 0, revenuePerMT: 0 },
  { type: "Battery Waste", monthlyMT: 2.8, recyclable: true, recyclePct: 100, revenuePerMT: 8000 },
  { type: "E-Waste", monthlyMT: 0.72, recyclable: true, recyclePct: 100, revenuePerMT: 12000 },
  { type: "Slag", monthlyMT: 38.6, recyclable: true, recyclePct: 75, revenuePerMT: 1200 },
]

// Materials data (key raw materials)
export const MATERIALS_DATA = {
  steelBilletsMonthlyMT: 16920,
  steelScrapMonthlyMT: 3840,
  furnaceOilMonthlyKL: 480,
  propaneMonthlyMT: 124,
  waterMonthlyKL: 28801,
  cuttingFluidMonthlyKL: 18.4,
  lubricantsMonthlyMT: 12.6,
  packagingMonthlyMT: 42.0,
}

// CSV Template definitions
export const CSV_TEMPLATES = {
  energy: {
    name: "Energy_Data_Template",
    headers: ["Date", "Plant_ID", "Equipment_ID", "Equipment_Name", "kWh_Consumed", "Running_Hours", "Production_MT", "Specific_Energy_kWh_per_MT", "Notes"],
    sampleRows: [
      ["2024-04-01", "P5", "E009", "IBH Furnace", "4903193", "720", "9120", "537.6", "Regular production"],
      ["2024-04-01", "P1", "E001", "IBH Furnace", "2234059", "720", "3940", "567.2", ""],
    ]
  },
  emissions: {
    name: "Emissions_Data_Template",
    headers: ["Date", "Plant_ID", "Scope", "Source", "Activity_Data", "Unit", "Emission_Factor", "tCO2e", "Notes"],
    sampleRows: [
      ["2024-04-01", "All", "Scope2", "Grid Electricity", "21054166", "kWh", "0.82", "17264", "CEA grid factor"],
      ["2024-04-01", "P1", "Scope1", "Furnace Oil", "480", "KL", "2.76", "1324.8", ""],
    ]
  },
  waste: {
    name: "Waste_Data_Template",
    headers: ["Date", "Plant_ID", "Waste_Type", "Category", "Quantity_MT", "Disposal_Method", "Revenue_INR", "Notes"],
    sampleRows: [
      ["2024-04-01", "P5", "Mill Scale", "Non-Hazardous", "142.5", "Recycled to Steel Plant", "641250", ""],
      ["2024-04-01", "All", "Used Oil", "Hazardous", "8.1", "Authorized Recycler", "145800", ""],
    ]
  },
  materials: {
    name: "Materials_Data_Template",
    headers: ["Date", "Plant_ID", "Material_Name", "Category", "Quantity", "Unit", "Supplier", "Cost_INR", "Notes"],
    sampleRows: [
      ["2024-04-01", "P5", "Steel Billets", "Raw Material", "9420", "MT", "Tata Steel", "565200000", ""],
      ["2024-04-01", "P1", "Furnace Oil", "Fuel", "480", "KL", "HPCL", "44160000", ""],
    ]
  },
}

// KPIs derived from data
export function computeKPIs() {
  const annualElecKWh = ANNUAL_KWH
  const annualElecCostLakhs = (annualElecKWh * 7.50) / 100000
  const annualFuelCostLakhs = 2840
  const totalEnergyCostLakhs = annualElecCostLakhs + annualFuelCostLakhs
  const energyPctRevenue = (totalEnergyCostLakhs / COMPANY_INFO.revenue) * 100

  return {
    annualElecKWh,
    annualElecCostLakhs: Math.round(annualElecCostLakhs),
    annualFuelCostLakhs,
    totalEnergyCostLakhs: Math.round(totalEnergyCostLakhs),
    energyPctRevenue: energyPctRevenue.toFixed(1),
    specificEnergyGJMT: ANNUAL_ENERGY_SUMMARY.energyIntensityGJPerMT,
    carbonIntensity: ANNUAL_ENERGY_SUMMARY.emissionIntensity,
    waterIntensity: ANNUAL_ENERGY_SUMMARY.waterIntensityKLPerMT,
    renewablePct: ANNUAL_ENERGY_SUMMARY.renewablePct,
    totalSavingsOpportunityLakhs: AI_OPPORTUNITIES.reduce((s, o) => s + o.annualSavingLakhs, 0),
    totalCO2OpportunityMT: AI_OPPORTUNITIES.reduce((s, o) => s + o.co2ReductionMT, 0),
  }
}
