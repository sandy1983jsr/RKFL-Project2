import { Hono } from 'hono'

export const apiV2Router = new Hono()

// ── REAL-TIME SIMULATION DATA ─────────────────────────────────────
// Returns live-simulated sensor readings that change per call

function rand(min: number, max: number, dec = 1) {
  return parseFloat((min + Math.random() * (max - min)).toFixed(dec))
}
function randInt(min: number, max: number) {
  return Math.floor(min + Math.random() * (max - min))
}
function jitter(base: number, pctRange = 0.03) {
  return parseFloat((base * (1 + (Math.random() - 0.5) * pctRange * 2)).toFixed(2))
}

// Generate time-series array for last N minutes
function timeSeries(n: number, base: number, noise: number, trend = 0) {
  const now = Date.now()
  return Array.from({ length: n }, (_, i) => ({
    t: new Date(now - (n - i) * 60000).toISOString(),
    v: parseFloat((base + trend * i + (Math.random() - 0.5) * noise * 2).toFixed(2))
  }))
}

// FFT helper — generates frequency-domain data from a signal
function generateFFT(signal: number[], samplingHz = 1) {
  // Simplified DFT for display (first 20 harmonics)
  const N = signal.length
  const freqs: { freq: number; amplitude: number; phase: number }[] = []
  for (let k = 1; k <= Math.min(20, N / 2); k++) {
    let re = 0, im = 0
    for (let n = 0; n < N; n++) {
      re += signal[n] * Math.cos(2 * Math.PI * k * n / N)
      im -= signal[n] * Math.sin(2 * Math.PI * k * n / N)
    }
    freqs.push({
      freq: parseFloat((k * samplingHz / N).toFixed(4)),
      amplitude: parseFloat((2 * Math.sqrt(re * re + im * im) / N).toFixed(3)),
      phase: parseFloat((Math.atan2(im, re) * 180 / Math.PI).toFixed(1))
    })
  }
  return freqs.sort((a, b) => b.amplitude - a.amplitude)
}

// ── REAL-TIME SENSOR FEEDS ─────────────────────────────────────────

apiV2Router.get('/realtime/ibh-furnace', (c) => {
  const furnaceId = c.req.query('id') || 'F-P5-01'
  const setpoint = 1180
  const actual = jitter(setpoint, 0.025)
  const gasFlow = jitter(420, 0.04)    // Nm³/hr
  const o2Pct = jitter(2.8, 0.15)      // % excess oxygen
  const co2Pct = jitter(8.4, 0.08)
  const efficiency = parseFloat((100 - (actual - setpoint > 10 ? 8 : 3) - o2Pct * 1.2).toFixed(1))
  const kwhPerTon = jitter(38.4, 0.05)

  // 60-min trend
  const tempTrend = timeSeries(60, setpoint, 18)
  const rawSignal = tempTrend.map(p => p.v)
  const fftData = generateFFT(rawSignal, 1 / 60) // 1 sample/min

  return c.json({
    furnaceId,
    timestamp: new Date().toISOString(),
    status: actual > setpoint + 30 ? 'OVER-TEMP' : actual < setpoint - 40 ? 'UNDER-TEMP' : 'NORMAL',
    temperature: { setpoint, actual, deviation: parseFloat((actual - setpoint).toFixed(1)), unit: '°C' },
    atmosphere: { o2Pct, co2Pct, lambdaExcess: parseFloat((o2Pct / 21 + 1).toFixed(3)) },
    combustion: {
      gasFlowNm3hr: gasFlow,
      efficiency,
      specificEnergykWhPerTon: kwhPerTon,
      heatLossPct: parseFloat((100 - efficiency).toFixed(1))
    },
    trend60min: tempTrend,
    fft: fftData.slice(0, 12),
    alarms: actual > setpoint + 25 ? [{ type: 'HIGH_TEMP', msg: `Temp ${(actual - setpoint).toFixed(0)}°C above setpoint`, severity: 'HIGH' }] : [],
    energySinceShiftStart: randInt(12400, 13800)
  })
})

apiV2Router.get('/realtime/press-line', (c) => {
  const pressId = c.req.query('id') || 'P-P5-12500T'
  const nominalTonnage = 12500
  const actualTonnage = jitter(nominalTonnage * 0.72, 0.06)
  const strokesPerMin = jitter(8.2, 0.08)
  const billetTemp = jitter(1150, 0.02)
  const dieTemp = jitter(280, 0.05)
  const hydraulicPressure = jitter(340, 0.03)  // bar
  const vibration = jitter(4.2, 0.15)          // mm/s RMS
  const currentKW = jitter(2840, 0.04)

  // Forge force vs stroke data (sinusoidal with peak)
  const forceStroke = Array.from({ length: 50 }, (_, i) => {
    const x = i / 49   // normalized stroke 0→1
    const peak = actualTonnage * 1000  // kN
    const force = peak * Math.pow(Math.sin(Math.PI * x), 1.4) * (0.9 + Math.random() * 0.2)
    return { stroke: parseFloat((x * 100).toFixed(1)), force: Math.round(force) }
  })

  // Vibration time series for FFT
  const vibSignal = Array.from({ length: 256 }, (_, i) =>
    vibration * Math.sin(2 * Math.PI * 8 * i / 256) +
    vibration * 0.3 * Math.sin(2 * Math.PI * 24 * i / 256) +
    (Math.random() - 0.5) * 0.8
  )
  const vibFFT = generateFFT(vibSignal, 1000) // 1kHz sampling

  return c.json({
    pressId,
    timestamp: new Date().toISOString(),
    status: vibration > 6 ? 'ALERT' : actualTonnage < nominalTonnage * 0.5 ? 'LOW_LOAD' : 'RUNNING',
    forgeLoad: { nominal: nominalTonnage, actual: Math.round(actualTonnage), utilPct: parseFloat((actualTonnage / nominalTonnage * 100).toFixed(1)), unit: 'T' },
    performance: { strokesPerMin, billetTempC: billetTemp, dieTempC: dieTemp, hydraulicBarPressure: hydraulicPressure },
    power: { currentKW, powerFactor: jitter(0.88, 0.02), kwhPerStroke: parseFloat((currentKW / (strokesPerMin / 60) / 1000).toFixed(3)) },
    vibration: { rmsMMperS: vibration, peakMMperS: parseFloat((vibration * 1.8).toFixed(2)), dominantFreqHz: 8.0, status: vibration > 6 ? 'WARN' : 'OK' },
    forceStrokeCurve: forceStroke,
    vibrationFFT: vibFFT.slice(0, 15),
    cycleCount: randInt(142000, 148000),
    estimatedDieLife: randInt(12800, 14200),
    remainingDieLife: randInt(1200, 2400)
  })
})

apiV2Router.get('/realtime/induction-furnace', (c) => {
  const currentKW = jitter(3640, 0.04)
  const powerFactor = jitter(0.82, 0.04)
  const efficiency = jitter(76, 0.03)
  const billetTemp = jitter(1160, 0.02)
  const coilCurrentA = jitter(4200, 0.03)
  const coilVoltageV = jitter(880, 0.02)
  const frequency = jitter(250, 0.005)

  // Power quality waveform (fundamental + harmonics)
  const waveform = Array.from({ length: 128 }, (_, i) => {
    const t = i / 128
    return parseFloat((
      Math.sin(2 * Math.PI * t) +               // fundamental
      0.12 * Math.sin(6 * Math.PI * t + 0.3) +  // 3rd harmonic
      0.07 * Math.sin(10 * Math.PI * t + 0.1) + // 5th harmonic
      0.04 * Math.sin(14 * Math.PI * t) +        // 7th harmonic
      (Math.random() - 0.5) * 0.05
    ).toFixed(3))
  })

  const harmonicFFT = generateFFT(waveform.map(Number), 50)

  const thd = parseFloat(Math.sqrt(
    (0.12 ** 2 + 0.07 ** 2 + 0.04 ** 2)
  ).toFixed(4)) * 100

  return c.json({
    furnaceId: 'IF-P4-4000kW',
    timestamp: new Date().toISOString(),
    status: powerFactor < 0.78 ? 'LOW_PF' : 'RUNNING',
    electrical: { currentKW, powerFactor, reactivePowerKVAR: parseFloat((currentKW * Math.tan(Math.acos(powerFactor))).toFixed(0)), apparentKVA: parseFloat((currentKW / powerFactor).toFixed(0)), thdPct: parseFloat(thd.toFixed(1)) },
    thermal: { billetTempC: billetTemp, coilTempC: jitter(85, 0.04), coolingWaterFlowLpm: jitter(42, 0.03), heatTransferEffPct: efficiency },
    electromagnetic: { coilCurrentA, coilVoltageV, frequencyHz: frequency, powerDensityKWperKg: parseFloat((currentKW / 4.8).toFixed(1)) },
    waveformSample: waveform.slice(0, 64),
    harmonicSpectrum: harmonicFFT.slice(0, 10),
    trend30min: timeSeries(30, currentKW, 80),
    kwhSinceHeatStart: randInt(280, 340),
    heatsCompleted: randInt(18, 24)
  })
})

apiV2Router.get('/realtime/compressor-bank', (c) => {
  const plant = c.req.query('plant') || 'P1'
  const compressors = plant === 'P1' ? 6 : 4
  const systemPressureBar = jitter(8.2, 0.02)
  const requiredPressureBar = 7.2
  const totalFlowCFM = jitter(9800, 0.03)
  const leakageFlowCFM = jitter(380, 0.1)
  const leakagePct = parseFloat((leakageFlowCFM / totalFlowCFM * 100).toFixed(1))
  const specificPower = jitter(0.22, 0.04) // kW/CFM

  // Pressure trend with leak events
  const pressureTrend = timeSeries(120, systemPressureBar, 0.3)
  // Inject a simulated leak event at ~t=80
  if (pressureTrend[80]) pressureTrend[80].v = parseFloat((systemPressureBar - 0.6).toFixed(2))
  if (pressureTrend[81]) pressureTrend[81].v = parseFloat((systemPressureBar - 0.4).toFixed(2))

  const units = Array.from({ length: compressors }, (_, i) => ({
    id: `C-${plant}-0${i + 1}`,
    running: i < Math.ceil(compressors * 0.7),
    loadPct: rand(55, 95),
    currentKW: rand(80, 380, 0),
    dischargeTempC: rand(68, 78, 1),
    vibrationMMperS: rand(1.8, 4.2, 2),
    hoursRun: randInt(4200, 8800),
    nextServiceHrs: randInt(200, 1200)
  }))

  const pressureFFT = generateFFT(pressureTrend.map(p => p.v), 1 / 60)

  return c.json({
    plant,
    timestamp: new Date().toISOString(),
    system: { pressureBar: systemPressureBar, requiredBar: requiredPressureBar, excessBar: parseFloat((systemPressureBar - requiredPressureBar).toFixed(2)), flowCFM: totalFlowCFM, specificPowerKWperCFM: specificPower },
    leakage: { estimatedCFM: leakageFlowCFM, pct: leakagePct, annualCostINR: Math.round(leakageFlowCFM * 0.22 * 8760 * 7.5), severity: leakagePct > 5 ? 'HIGH' : leakagePct > 3 ? 'MEDIUM' : 'OK' },
    units,
    pressureTrend120min: pressureTrend,
    pressureFFT: pressureFFT.slice(0, 10),
    totalKW: units.filter(u => u.running).reduce((s, u) => s + u.currentKW, 0),
    savingPotentialKWh: Math.round((systemPressureBar - requiredPressureBar) * 6 * totalFlowCFM * 0.22 * 720)
  })
})

apiV2Router.get('/realtime/heat-treatment', (c) => {
  const furnaceId = c.req.query('id') || 'HT-P4-01'
  const setTempC = 860    // °C quench & temper
  const actualTempC = jitter(setTempC, 0.015)
  const atmosphereN2 = jitter(72, 0.02)  // %
  const atmosphereCO = jitter(0.8, 0.08) // %
  const carbon_potential = jitter(0.82, 0.03)
  const cycleTimeMins = jitter(185, 0.04)
  const loadWeightKg = jitter(1840, 0.02)

  // Multi-zone temperature profile
  const zones = [
    { zone: 'Preheat', setC: 450, actualC: jitter(448, 0.02) },
    { zone: 'Austenitize', setC: setTempC, actualC: actualTempC },
    { zone: 'Soak', setC: setTempC - 10, actualC: jitter(setTempC - 12, 0.02) },
    { zone: 'Quench', setC: 60, actualC: jitter(62, 0.05) },
    { zone: 'Temper', setC: 200, actualC: jitter(198, 0.02) },
  ]

  // CCT curve approximation (Continuous Cooling Transformation)
  const cctCurve = Array.from({ length: 30 }, (_, i) => {
    const time = Math.pow(10, i * 3 / 29)  // log scale 1→1000s
    const tempDrop = setTempC * Math.pow(time / 1000, 0.4)
    return { timeSec: parseFloat(time.toFixed(1)), tempC: parseFloat((setTempC - tempDrop).toFixed(0)) }
  })

  // Hardness prediction model output
  const predictedHardnessHRC = parseFloat((58 + (carbon_potential - 0.8) * 12 - Math.abs(actualTempC - setTempC) * 0.08).toFixed(1))

  const tempTrend = timeSeries(90, actualTempC, 12)
  const tempFFT = generateFFT(tempTrend.map(p => p.v), 1 / 60)

  return c.json({
    furnaceId,
    timestamp: new Date().toISOString(),
    status: Math.abs(actualTempC - setTempC) > 20 ? 'DEVIATION' : 'NORMAL',
    thermal: { setTempC, actualTempC, deviationC: parseFloat((actualTempC - setTempC).toFixed(1)), zones },
    atmosphere: { n2Pct: atmosphereN2, coPct: atmosphereCO, carbonPotential: carbon_potential, dewPointC: jitter(-12, 0.05) },
    metallurgy: { predictedHardnessHRC, expectedMicrostructure: 'Tempered Martensite', caseDepthMm: parseFloat((0.9 + carbon_potential * 0.4).toFixed(2)) },
    process: { cycleTimeMins, loadWeightKg, specificEnergyKWhKg: parseFloat((actualTempC * 0.00042 + 0.18).toFixed(3)), rejectRiskPct: parseFloat((Math.abs(actualTempC - setTempC) / setTempC * 100).toFixed(1)) },
    cctCurve,
    tempTrend90min: tempTrend,
    tempFFT: tempFFT.slice(0, 10),
    cyclesThisShift: randInt(3, 6)
  })
})

// ── EQUIPMENT DEEP-DIVE ANALYTICS ─────────────────────────────────

apiV2Router.get('/analytics/ibh-furnace-correlation', (c) => {
  // Generate 200-point scatter: gas flow vs efficiency
  const scatter = Array.from({ length: 200 }, () => {
    const gasFlow = rand(280, 520)
    const o2 = rand(1.0, 6.0)
    const efficiency = 94 - (o2 - 2) * 1.8 - Math.abs(gasFlow - 400) * 0.02 + (Math.random() - 0.5) * 3
    return { gasFlow: parseFloat(gasFlow.toFixed(1)), o2: parseFloat(o2.toFixed(2)), efficiency: parseFloat(efficiency.toFixed(1)) }
  })

  // kWh/ton vs temperature setpoint adherence
  const energyCorr = Array.from({ length: 200 }, () => {
    const deviation = rand(-50, 50)
    const kwhPerTon = 38 + Math.abs(deviation) * 0.06 + (Math.random() - 0.5) * 2
    return { tempDeviationC: parseFloat(deviation.toFixed(1)), kwhPerTon: parseFloat(kwhPerTon.toFixed(2)) }
  })

  // Rolling 30-day efficiency trend
  const effTrend = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    efficiency: parseFloat((88 - Math.sin(i * 0.4) * 3 + (Math.random() - 0.5) * 2).toFixed(1)),
    kwhPerTon: parseFloat((38.2 + Math.cos(i * 0.3) * 1.5 + (Math.random() - 0.5) * 1).toFixed(2)),
    avgBilletTemp: parseFloat((1178 + Math.sin(i * 0.25) * 8 + (Math.random() - 0.5) * 4).toFixed(0))
  }))

  // Fourier analysis of 30-day kWh/ton signal
  const signal = effTrend.map(d => d.kwhPerTon)
  const fft = generateFFT(signal, 1) // 1 sample/day

  return c.json({
    title: 'IBH Furnace — Combustion Efficiency & Energy Correlation Analytics',
    gasO2EfficiencyScatter: scatter,
    energyTempCorrelation: energyCorr,
    rolling30DayTrend: effTrend,
    fourierAnalysis: {
      signal: 'kWh/ton (30-day)',
      components: fft.slice(0, 8),
      dominantPeriodDays: parseFloat((1 / fft[0]?.freq || 7).toFixed(1)),
      interpretation: 'Dominant 7-day periodicity matches weekly production schedule variation'
    },
    regressionModel: {
      equation: 'kWh/ton = 38.0 + 0.062 × |ΔT| + 1.8 × (O₂% - 2.0)',
      r2: 0.87,
      rmse: 1.24,
      variables: ['Temperature deviation from setpoint (°C)', 'Excess oxygen (%)', 'Gas flow rate (Nm³/hr)']
    },
    optimizationTarget: { currentAvg: 38.4, optimalTarget: 35.8, savingKwhPerTon: 2.6, annualSavingKWh: 2600 * 116130 / 1000 }
  })
})

apiV2Router.get('/analytics/press-die-life', (c) => {
  // Die wear progression vs tonnage
  const dieWear = Array.from({ length: 50 }, (_, i) => {
    const strikes = i * 300
    const wear = 0.002 * strikes + 0.000001 * strikes * strikes + (Math.random() - 0.5) * 0.15
    const forceVariation = 1 + wear * 0.008 + (Math.random() - 0.5) * 0.04
    return { strikes, wearMM: parseFloat(wear.toFixed(3)), forceMultiplier: parseFloat(forceVariation.toFixed(3)), rejectRisk: parseFloat(Math.min(wear * 12, 100).toFixed(1)) }
  })

  // Forging force frequency spectrum (machine health)
  const forceSignal = Array.from({ length: 256 }, (_, i) => {
    const fundamental = Math.sin(2 * Math.PI * 8 * i / 256) * 8200
    const bearing = Math.sin(2 * Math.PI * 23.4 * i / 256) * 180 // bearing defect freq
    const mesh = Math.sin(2 * Math.PI * 47 * i / 256) * 120
    const noise = (Math.random() - 0.5) * 200
    return fundamental + bearing + mesh + noise
  })
  const forceFFT = generateFFT(forceSignal, 100)

  // Energy vs part weight regression
  const energyWeight = Array.from({ length: 180 }, () => {
    const weight = rand(2, 45)
    const energy = 0.42 * weight + 0.02 * weight * weight + rand(-0.8, 0.8)
    return { weightKg: parseFloat(weight.toFixed(1)), energyKwh: parseFloat(energy.toFixed(2)) }
  })

  return c.json({
    title: 'Press Line — Die Life Prediction, Force Analysis & Energy Regression',
    dieWearProgression: dieWear,
    forceFrequencySpectrum: {
      data: forceFFT.slice(0, 15),
      bearingDefectFreqHz: 23.4,
      gearMeshFreqHz: 47.0,
      fundamentalHz: 8.0,
      healthScore: 82,
      anomalyFlag: forceFFT.find(f => Math.abs(f.freq - 23.4 / 100) < 0.002)?.amplitude || 0 > 200 ? 'BEARING_DEFECT' : 'OK'
    },
    energyWeightRegression: {
      scatter: energyWeight,
      equation: 'E(kWh) = 0.42W + 0.02W² (quadratic fit)',
      r2: 0.94,
      rmse: 0.62
    },
    dieLifePrediction: {
      currentStrikes: 13640,
      predictedLifeRemaining: 1560,
      wearRateMmPerKStrike: 0.021,
      maintenanceWindowDays: 18,
      confidencePct: 87
    }
  })
})

apiV2Router.get('/analytics/energy-demand-forecast', (c) => {
  // Hourly demand profile (24h)
  const hourlyDemand = Array.from({ length: 24 }, (_, h) => {
    const base = 8500   // kW
    const morning = h >= 6 && h <= 8 ? 3200 : 0
    const production = h >= 7 && h <= 19 ? 4800 : 1200
    const shift = h >= 14 && h <= 15 ? 1800 : 0  // shift overlap spike
    const noise = (Math.random() - 0.5) * 400
    return {
      hour: h,
      actualKW: Math.round(base + morning + production + shift + noise),
      forecastKW: Math.round(base + morning + production + shift),
      solarKW: h >= 6 && h <= 18 ? Math.round(8730 * Math.max(0, Math.sin(Math.PI * (h - 6) / 12)) * 0.85) : 0
    }
  })

  // Weekly load factor heatmap (7 days × 24 hours)
  const loadHeatmap = Array.from({ length: 7 }, (_, day) =>
    Array.from({ length: 24 }, (_, hour) => {
      const isWeekend = day >= 5
      const base = isWeekend ? 0.35 : 0.72
      const shift = hour >= 6 && hour <= 22 ? 0.18 : -0.15
      return parseFloat((base + shift + (Math.random() - 0.5) * 0.12).toFixed(2))
    })
  )

  // Demand peak shaving opportunities
  const peakEvents = hourlyDemand.filter(h => h.actualKW > 13000).map(h => ({
    hour: h.hour,
    peakKW: h.actualKW,
    shiftableLoad: ['Heat Treatment Cycle', 'Compressor bank staging', 'Cooling tower fans'],
    potentialReductionKW: randInt(800, 1400)
  }))

  return c.json({
    title: 'Electricity Demand Forecasting & Peak Shaving Analytics',
    hourlyDemandProfile: hourlyDemand,
    weeklyLoadHeatmap: { data: loadHeatmap, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], hours: Array.from({ length: 24 }, (_, i) => `${i}:00`) },
    peakShavingOpportunities: peakEvents,
    demandChargeAnalysis: {
      currentPeakKW: Math.max(...hourlyDemand.map(h => h.actualKW)),
      targetPeakKW: 13200,
      currentMonthlyChargeLakhs: 26.8,
      targetMonthlyChargeLakhs: 18.2,
      savingLakhsPerMonth: 8.6
    },
    solarCurtailmentPct: parseFloat((hourlyDemand.reduce((s, h) => s + Math.max(0, h.solarKW - 800), 0) / hourlyDemand.reduce((s, h) => s + h.solarKW, 0) * 100).toFixed(1))
  })
})

apiV2Router.get('/analytics/water-balance', (c) => {
  // Sankey-style water balance
  const waterInputKLday = 1140
  const waterRecycledKLday = Math.round(waterInputKLday * 0.58)
  const evaporationKLday = Math.round(waterInputKLday * 0.18)
  const productKLday = Math.round(waterInputKLday * 0.02)
  const effluent = waterInputKLday - waterRecycledKLday - evaporationKLday - productKLday

  // Water quality trend
  const waterQuality = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    tds: rand(450, 820),         // mg/L TDS
    ph: rand(6.8, 7.6),
    turbidityNTU: rand(2, 12),
    conductivity: rand(650, 1100) // μS/cm
  }))

  // Specific water consumption vs production
  const waterProdCorr = Array.from({ length: 120 }, () => {
    const prod = rand(500, 650) // MT/day
    const water = prod * 1.76 + rand(-20, 20)
    return { prodMT: parseFloat(prod.toFixed(0)), waterKL: parseFloat(water.toFixed(1)) }
  })

  return c.json({
    title: 'Water Balance & Quality Analytics',
    waterBalance: {
      input: waterInputKLday,
      recycled: waterRecycledKLday,
      evaporation: evaporationKLday,
      product: productKLday,
      effluent,
      recyclePct: parseFloat((waterRecycledKLday / waterInputKLday * 100).toFixed(1))
    },
    qualityTrend: waterQuality,
    specificConsumptionCorrelation: {
      scatter: waterProdCorr,
      regression: 'Water(KL/day) = 1.76 × Production(MT/day) + 4.2',
      r2: 0.89,
      benchmark: { industry: 2.1, rkfl: 1.76, bestInClass: 1.35 }
    },
    zldStatus: { plantsAchieved: 3, totalPlants: 5, effluentReusePct: 58 }
  })
})

apiV2Router.get('/analytics/waste-pareto', (c) => {
  // Waste Pareto by cost of disposal + revenue opportunity
  const wasteTypes = [
    { type: 'Mill Scale', massKgDay: 4750, revenueINRKg: 4.5, disposalCostINRKg: 0 },
    { type: 'Forging Flash', massKgDay: 2273, revenueINRKg: 42, disposalCostINRKg: 0 },
    { type: 'Used Oil', massKgDay: 270, revenueINRKg: 18, disposalCostINRKg: 0 },
    { type: 'Coolant Sludge', massKgDay: 413, revenueINRKg: 0, disposalCostINRKg: 12 },
    { type: 'Paint Sludge', massKgDay: 60, revenueINRKg: 0, disposalCostINRKg: 28 },
    { type: 'Battery Waste', massKgDay: 93, revenueINRKg: 8, disposalCostINRKg: 0 },
    { type: 'E-Waste', massKgDay: 24, revenueINRKg: 12, disposalCostINRKg: 0 },
    { type: 'Slag', massKgDay: 1287, revenueINRKg: 1.2, disposalCostINRKg: 0 },
  ].map(w => ({
    ...w,
    dailyRevenueINR: Math.round(w.massKgDay * w.revenueINRKg),
    dailyCostINR: Math.round(w.massKgDay * w.disposalCostINRKg),
    annualNetINR: Math.round((w.massKgDay * w.revenueINRKg - w.massKgDay * w.disposalCostINRKg) * 330),
  })).sort((a, b) => Math.abs(b.annualNetINR) - Math.abs(a.annualNetINR))

  // Mill scale generation vs production correlation
  const millScaleCorr = Array.from({ length: 150 }, () => {
    const temp = rand(1100, 1240)
    const time = rand(45, 90)
    const scale = 0.018 * temp * 0.001 + 0.002 * time + rand(-0.002, 0.002)
    return { billetTempC: parseFloat(temp.toFixed(0)), heatingTimeMins: parseFloat(time.toFixed(1)), scaleYieldPct: parseFloat((scale * 100).toFixed(2)) }
  })

  return c.json({
    title: 'Waste Pareto & Circular Economy Analytics',
    wastePareto: wasteTypes,
    millScaleGeneration: {
      scatter: millScaleCorr,
      regression: 'Scale% = 0.018×Temp + 0.002×Time − 19.8',
      r2: 0.78,
      insight: 'Every 10°C reduction in billet soaking temperature reduces mill scale by ~0.18%'
    },
    circularEconomyValue: {
      totalAnnualRevenueINR: wasteTypes.reduce((s, w) => s + (w.annualNetINR > 0 ? w.annualNetINR : 0), 0),
      totalAnnualCostINR: wasteTypes.reduce((s, w) => s + (w.annualNetINR < 0 ? Math.abs(w.annualNetINR) : 0), 0),
    }
  })
})

apiV2Router.get('/analytics/process-capability', (c) => {
  // SPC data for a forging dimension
  const specTarget = 125.0  // mm
  const specUSL = 125.5
  const specLSL = 124.5
  const measurements = Array.from({ length: 200 }, () => {
    const val = specTarget + (Math.random() - 0.5) * 0.6 + Math.sin(Math.random() * 6.28) * 0.08
    return parseFloat(val.toFixed(3))
  })

  const mean = measurements.reduce((s, v) => s + v, 0) / measurements.length
  const std = Math.sqrt(measurements.reduce((s, v) => s + (v - mean) ** 2, 0) / (measurements.length - 1))
  const cp = (specUSL - specLSL) / (6 * std)
  const cpu = (specUSL - mean) / (3 * std)
  const cpl = (mean - specLSL) / (3 * std)
  const cpk = Math.min(cpu, cpl)

  // X-bar R chart data (25 subgroups of 5)
  const xbarData = Array.from({ length: 25 }, (_, i) => {
    const subgroup = measurements.slice(i * 5, (i + 1) * 5)
    const xbar = subgroup.reduce((s, v) => s + v, 0) / subgroup.length
    const range = Math.max(...subgroup) - Math.min(...subgroup)
    return { subgroup: i + 1, xbar: parseFloat(xbar.toFixed(3)), range: parseFloat(range.toFixed(3)) }
  })

  // Pareto of defects
  const defects = [
    { type: 'Flash excess', count: 48, pct: 32 },
    { type: 'Under-fill', count: 36, pct: 24 },
    { type: 'Die mismatch', count: 27, pct: 18 },
    { type: 'Surface crack', count: 21, pct: 14 },
    { type: 'Dimension OOT', count: 12, pct: 8 },
    { type: 'Others', count: 6, pct: 4 },
  ]

  return c.json({
    title: 'Process Capability & SPC Analytics — Forging Dimension Control',
    spc: {
      specTarget, specUSL, specLSL,
      measurements,
      statistics: { mean: parseFloat(mean.toFixed(4)), std: parseFloat(std.toFixed(4)), cp: parseFloat(cp.toFixed(3)), cpk: parseFloat(cpk.toFixed(3)), ppm: Math.round(Math.max(0, (1 - 0.9987) * 2 * 1000000 * Math.exp(-cpk * 3))) }
    },
    xbarRChart: xbarData,
    controlLimits: {
      xbar: { ucl: parseFloat((mean + 3 * std / Math.sqrt(5)).toFixed(3)), lcl: parseFloat((mean - 3 * std / Math.sqrt(5)).toFixed(3)), cl: parseFloat(mean.toFixed(3)) },
      range: { ucl: parseFloat((std * 5.48).toFixed(3)), lcl: 0, cl: parseFloat((std * 2.33).toFixed(3)) }
    },
    defectPareto: defects,
    processCapabilityAssessment: cpk > 1.33 ? 'CAPABLE' : cpk > 1.0 ? 'MARGINALLY_CAPABLE' : 'NOT_CAPABLE'
  })
})

apiV2Router.get('/analytics/logistics-energy', (c) => {
  // Fleet energy & logistics analytics
  const vehicles = [
    { id: 'FLT-01', type: 'Diesel Forklift', fuelLday: 12.4, costDay: 1140, co2KgDay: 32.8, utilizationPct: 68 },
    { id: 'FLT-02', type: 'Diesel Forklift', fuelLday: 11.8, costDay: 1085, co2KgDay: 31.2, utilizationPct: 72 },
    { id: 'FLT-03', type: 'Battery Forklift', fuelLday: 0, costDay: 180, co2KgDay: 3.8, utilizationPct: 82 },
    { id: 'FLT-04', type: 'Diesel Crane', fuelLday: 28.6, costDay: 2630, co2KgDay: 75.6, utilizationPct: 45 },
    { id: 'TRK-01', type: 'Inbound Truck', fuelLday: 42.0, costDay: 3864, co2KgDay: 111.0, utilizationPct: 60 },
    { id: 'TRK-02', type: 'Outbound Truck', fuelLday: 38.5, costDay: 3542, co2KgDay: 101.8, utilizationPct: 65 },
  ]

  // Route efficiency vs distance correlation
  const routeCorr = Array.from({ length: 80 }, () => {
    const dist = rand(40, 280)
    const efficiency = 85 - dist * 0.08 + rand(-6, 6)
    return { distanceKm: parseFloat(dist.toFixed(0)), fuelEffL100km: parseFloat((18 + dist * 0.015 + (Math.random() - 0.5) * 2).toFixed(1)), loadFactor: parseFloat((efficiency / 100).toFixed(2)) }
  })

  // Material handling inside plant (internal logistics)
  const internalFlow = [
    { from: 'Raw Material Store', to: 'IBH Furnace', movementsDay: 48, avgDistM: 120, fuelKgDay: 2.8 },
    { from: 'IBH Furnace', to: 'Press Line', movementsDay: 42, avgDistM: 85, fuelKgDay: 2.1 },
    { from: 'Press Line', to: 'HT Furnace', movementsDay: 38, avgDistM: 95, fuelKgDay: 2.4 },
    { from: 'HT Furnace', to: 'Inspection', movementsDay: 36, avgDistM: 60, fuelKgDay: 1.4 },
    { from: 'Inspection', to: 'Finished Goods', movementsDay: 34, avgDistM: 110, fuelKgDay: 1.8 },
  ]

  return c.json({
    title: 'Logistics & Material Handling Energy Analytics',
    fleetEnergy: vehicles,
    routeEfficiencyCorrelation: { scatter: routeCorr, regression: 'Fuel(L/100km) = 18 + 0.015×Distance', r2: 0.71 },
    internalMaterialFlow: internalFlow,
    evConversionOpportunity: {
      dieselFleetCostLakhsYear: parseFloat((vehicles.filter(v => v.type.includes('Diesel')).reduce((s, v) => s + v.costDay, 0) * 330 / 100000).toFixed(1)),
      evOperatingCostLakhsYear: parseFloat((vehicles.filter(v => v.type.includes('Diesel')).reduce((s, v) => s + v.costDay * 0.14, 0) * 330 / 100000).toFixed(1)),
      co2SavingKgYear: Math.round(vehicles.filter(v => v.type.includes('Diesel')).reduce((s, v) => s + v.co2KgDay, 0) * 330),
      paybackYears: 3.4
    }
  })
})
