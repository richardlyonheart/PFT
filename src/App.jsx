import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'workout-tracker-v1'
const GOALS_KEY = 'workout-goals-v1'
const CONFIG_KEY = 'workout-config-v1'
const MIN_PROGRAM_DAYS = 30
const MAX_PROGRAM_DAYS = 360
const DEFAULT_PROGRAM_DAYS = 60

const workoutCatalog = [
  { id: 'row2k', label: 'Row 2,000m', logField: 'row' },
  { id: 'pushups', label: 'Push-ups', logField: 'pushups' },
  { id: 'plank', label: 'Plank', logField: 'plank' },
  { id: 'run15', label: '1.5 mile run', logField: 'run15' },
  { id: 'swim450m', label: '450m swim', logField: 'swim450m' },
  { id: 'swim500y', label: '500 yard swim', logField: 'swim500y' }
]

const workoutLogInputs = {
  row2k: { label: 'Row time / distance', placeholder: 'e.g. 2k in 08:14' },
  pushups: { label: 'Push-up result', placeholder: 'e.g. 5x22' },
  plank: { label: 'Plank result', placeholder: 'e.g. 3x75s' },
  run15: { label: '1.5 mile run result', placeholder: 'e.g. 11:42' },
  swim450m: { label: '450m swim result', placeholder: 'e.g. 09:18' },
  swim500y: { label: '500 yard swim result', placeholder: 'e.g. 10:05' }
}

const defaultWorkoutSelection = {
  row2k: true,
  pushups: true,
  plank: true,
  run15: false,
  swim450m: false,
  swim500y: false
}

const weekDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const dayTemplates = {
  Monday: {
    title: 'Interval Day',
    workouts: [
      'Row: 6x3 min at 90-95% race pace',
      'Recover: 2 min easy row between reps',
      'Cooldown: 5-10 min easy row'
    ]
  },
  Tuesday: {
    title: 'Strength Day',
    workouts: [
      'Push-ups: 5 sets at 60-70% max, 90s rest',
      'Plank: 4 sets at 50-70% max hold, 60s rest',
      'Accessory core: dead bug, side plank, bird dog (optional)'
    ]
  },
  Wednesday: {
    title: 'Tempo Endurance',
    workouts: ['Row steady 30-45 min at conversational effort (RPE 5-6)']
  },
  Thursday: {
    title: 'Push Density Day',
    workouts: [
      'Push-up pyramid: 8, 10, 12, 10, 8',
      'Reduce rest each week by 10-15s',
      'Plank ladder: 20s, 40s, 60s, 40s, 20s'
    ]
  },
  Friday: {
    title: 'Speed + Core Day',
    workouts: [
      'Row: 10x1 min hard with 1 min rest',
      'Plank: 3 hard holds, stop before failure'
    ]
  },
  Saturday: {
    title: 'Long Easy Day',
    workouts: [
      'Row 45-75 min easy',
      'Focus on breathing rhythm, sequencing, and stroke efficiency'
    ]
  },
  Sunday: {
    title: 'Recovery Day',
    workouts: ['Active recovery: mobility, walking, easy swim, and foam rolling']
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function getSelectedWorkoutIds(selection) {
  const safeSelection = { ...defaultWorkoutSelection, ...(selection || {}) }
  const selected = workoutCatalog.filter((item) => safeSelection[item.id]).map((item) => item.id)
  return selected.length > 0 ? selected : ['row2k']
}

function workoutEnabled(selection, workoutId) {
  return getSelectedWorkoutIds(selection).includes(workoutId)
}

function normalizeProgramConfig(rawConfig) {
  const safeDays = clamp(Number(rawConfig?.programDays) || DEFAULT_PROGRAM_DAYS, MIN_PROGRAM_DAYS, MAX_PROGRAM_DAYS)
  const safeSelection = { ...defaultWorkoutSelection, ...(rawConfig?.selectedWorkouts || {}) }
  const hasAtLeastOne = Object.values(safeSelection).some(Boolean)

  return {
    programDays: safeDays,
    selectedWorkouts: hasAtLeastOne ? safeSelection : { ...safeSelection, row2k: true }
  }
}

function getTemplateWorkouts(dayName, selectedWorkoutIds) {
  const has = (id) => selectedWorkoutIds.includes(id)
  const lines = []

  if (dayName === 'Monday') {
    if (has('row2k')) lines.push('Row: 6x3 min at 90-95% race pace')
    if (has('run15')) lines.push('Run: 6x2 min hard with 2 min easy jog')
    if (has('swim450m') || has('swim500y')) lines.push('Swim: 8x50 moderate-hard with form focus')
    lines.push('Cooldown: 5-10 min easy')
    return lines
  }

  if (dayName === 'Tuesday') {
    if (has('pushups')) lines.push('Push-ups: 5 sets at 60-70% max, 90s rest')
    if (has('plank')) lines.push('Plank: 4 sets at 50-70% max hold, 60s rest')
    if (has('run15') || has('swim450m') || has('swim500y')) lines.push('Optional easy cardio flush: 15-20 min')
    return lines
  }

  if (dayName === 'Wednesday') {
    if (has('row2k')) lines.push('Row steady 30-45 min at conversational effort (RPE 5-6)')
    if (has('run15')) lines.push('Steady run 20-35 min at conversational effort')
    if (has('swim450m') || has('swim500y')) lines.push('Steady swim 20-30 min easy-moderate')
    return lines
  }

  if (dayName === 'Thursday') {
    if (has('pushups')) lines.push('Push-up pyramid progression with reduced weekly rest')
    if (has('plank')) lines.push('Plank ladder progression with strict form')
    if (has('row2k') || has('run15') || has('swim450m') || has('swim500y')) lines.push('Finish with 10-15 min easy cardio')
    return lines
  }

  if (dayName === 'Friday') {
    if (has('row2k')) lines.push('Row: 10-12x1 min hard with 1 min rest')
    if (has('run15')) lines.push('Run: 10x1 min fast with 1 min easy jog')
    if (has('swim450m') || has('swim500y')) lines.push('Swim: 10x50 hard with short rest')
    if (has('plank')) lines.push('Plank: 3 hard holds, stop before failure')
    return lines
  }

  if (dayName === 'Saturday') {
    if (has('row2k')) lines.push('Long easy row 45-75 min')
    if (has('run15')) lines.push('Long easy run 25-60 min')
    if (has('swim450m') || has('swim500y')) lines.push('Long easy swim 20-45 min')
    return lines
  }

  lines.push('Active recovery: mobility, walking, easy swim, and foam rolling')
  return lines
}

function parseTimeToSeconds(value) {
  if (!value) {
    return null
  }

  const text = String(value).trim()
  const hms = text.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/)

  if (hms) {
    if (hms[3] !== undefined) {
      return Number(hms[1]) * 3600 + Number(hms[2]) * 60 + Number(hms[3])
    }
    return Number(hms[1]) * 60 + Number(hms[2])
  }

  const numberMatch = text.match(/\d+(\.\d+)?/)
  if (!numberMatch) {
    return null
  }

  return Math.round(Number(numberMatch[0]))
}

function parseFirstNumber(value) {
  if (!value) {
    return null
  }

  const match = String(value).match(/\d+(\.\d+)?/)
  return match ? Number(match[0]) : null
}

function formatSeconds(totalSeconds) {
  const seconds = Math.max(0, Math.round(totalSeconds))
  const mins = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${mins}:${String(remainder).padStart(2, '0')}`
}

function formatSplit(totalSeconds) {
  return `${formatSeconds(totalSeconds)}/500m`
}

function getCardioBaselineSeconds(logs, field, fallbackSeconds) {
  const baseline = logs[0] || {}
  const parsed = parseTimeToSeconds(baseline[field])
  return parsed || fallbackSeconds
}

function getBaseline(logs) {
  const baseline = logs[0] || {}
  const row2kSeconds = parseTimeToSeconds(baseline.row)
  const pushupMax = parseFirstNumber(baseline.pushups)
  const plankMaxSeconds = parseTimeToSeconds(baseline.plank) ?? parseFirstNumber(baseline.plank)

  const fallback = {
    row2kSeconds: 540,
    pushupMax: 20,
    plankMaxSeconds: 60
  }

  return {
    row2kSeconds: row2kSeconds || fallback.row2kSeconds,
    pushupMax: pushupMax || fallback.pushupMax,
    plankMaxSeconds: plankMaxSeconds || fallback.plankMaxSeconds,
    hasCompleteBaseline: Boolean(row2kSeconds && pushupMax && plankMaxSeconds)
  }
}

function getGoals(goalInputs, baseline) {
  const row2kGoalSeconds = parseTimeToSeconds(goalInputs.row2kGoal)
  const pushupGoal = parseFirstNumber(goalInputs.pushupGoal)
  const plankGoalSeconds = parseTimeToSeconds(goalInputs.plankGoal)

  return {
    row2kGoalSeconds: row2kGoalSeconds || Math.round(baseline.row2kSeconds * 0.93),
    pushupGoal: pushupGoal || Math.round(baseline.pushupMax + 20),
    plankGoalSeconds: plankGoalSeconds || Math.round(baseline.plankMaxSeconds + 45)
  }
}

function getDailyPrescription(plan, baseline, goals, logs, config) {
  const totalDays = clamp(config?.programDays || DEFAULT_PROGRAM_DAYS, MIN_PROGRAM_DAYS, MAX_PROGRAM_DAYS)
  const selectedWorkouts = getSelectedWorkoutIds(config?.selectedWorkouts)
  const has = (id) => selectedWorkouts.includes(id)
  const cycleProgress = clamp(plan.day / totalDays, 0, 1)
  const current2kCapacity = baseline.row2kSeconds + (goals.row2kGoalSeconds - baseline.row2kSeconds) * cycleProgress
  const currentPushCapacity = baseline.pushupMax + (goals.pushupGoal - baseline.pushupMax) * cycleProgress
  const currentPlankCapacity = baseline.plankMaxSeconds + (goals.plankGoalSeconds - baseline.plankMaxSeconds) * cycleProgress
  const runBase = getCardioBaselineSeconds(logs, 'run15', 13 * 60)
  const swim450Base = getCardioBaselineSeconds(logs, 'swim450m', 10 * 60)
  const swim500yBase = getCardioBaselineSeconds(logs, 'swim500y', 10 * 60)

  if (plan.day === 0) {
    const intro = ['Warm-up: 10-15 min cardio + dynamic mobility']
    if (has('row2k')) intro.push('Row: 2,000m all-out test, then record total time and avg split')
    if (has('run15')) intro.push('Run: 1.5 mile time trial, record total time and pacing')
    if (has('swim450m')) intro.push('Swim: 450m time trial, record total time and splits')
    if (has('swim500y')) intro.push('Swim: 500 yard time trial, record total time and splits')
    if (has('pushups')) intro.push('Push-ups: max strict set with no breaks')
    if (has('plank')) intro.push('Plank: forearm hold to technical failure')
    intro.push('Set targets for retest day based on your baseline results')
    return intro
  }

  if (plan.day === totalDays) {
    const retest = ['Retest protocol: same warm-up and order as Day 0']
    if (has('row2k')) retest.push(`Row goal: ${formatSeconds(goals.row2kGoalSeconds)} for 2k`)
    if (has('run15')) retest.push(`1.5 mile run goal: ${formatSeconds(runBase * 0.94)} or faster`)
    if (has('swim450m')) retest.push(`450m swim goal: ${formatSeconds(swim450Base * 0.94)} or faster`)
    if (has('swim500y')) retest.push(`500 yard swim goal: ${formatSeconds(swim500yBase * 0.94)} or faster`)
    if (has('pushups')) retest.push(`Push-up goal: ${Math.round(goals.pushupGoal)} strict reps in 1 minute`)
    if (has('plank')) retest.push(`Plank goal: ${formatSeconds(goals.plankGoalSeconds)} hold`)
    return retest
  }

  if (plan.phase === 'Taper') {
    const taper = []
    if (has('row2k') || has('run15') || has('swim450m') || has('swim500y')) {
      taper.push('Cardio: 15-25 min easy, keep effort light and smooth')
      taper.push('Optional primer: 3x1 min moderate with 2 min easy recovery')
    }
    if (has('pushups')) {
      taper.push(`Push-ups: 2-3 light sets of ${Math.max(5, Math.round(currentPushCapacity * 0.5))}`)
    }
    if (has('plank')) {
      taper.push(`Plank: 2 quality holds of ${Math.max(20, Math.round(currentPlankCapacity * 0.5))}s`)
    }
    taper.push('Hydrate, sleep well, and avoid hard efforts')
    return taper
  }

  const phaseBoost = plan.phase === 'Phase 2' ? 0.05 : 0
  const weekBoost = clamp((plan.week - 1) * 0.05 + phaseBoost, 0, 0.35)
  const baseSplit = current2kCapacity / 4
  const lines = []

  if (plan.dayName === 'Monday') {
    if (has('row2k')) {
      const rest = plan.phase === 'Phase 1' ? 120 : Math.max(75, 110 - (plan.week - 5) * 10)
      const splitLow = baseSplit + (plan.phase === 'Phase 1' ? 7 - plan.week : 3)
      const splitHigh = splitLow + 3
      lines.push('Row: 6x3 min work reps')
      lines.push(`Target split: ${formatSplit(splitLow)} to ${formatSplit(splitHigh)}`)
      lines.push(`Recovery: ${rest}s easy row between reps`)
    }
    if (has('run15')) lines.push('Run: 6x2 min hard with 2 min easy jog')
    if (has('swim450m') || has('swim500y')) lines.push('Swim: 8x50 at moderate-hard effort with technical focus')
  } else if (plan.dayName === 'Tuesday') {
    if (has('pushups')) {
      const lowPct = clamp(0.6 + weekBoost, 0.6, 0.78)
      const highPct = clamp(lowPct + 0.08, 0.68, 0.86)
      const pushLow = Math.max(4, Math.round(currentPushCapacity * lowPct))
      const pushHigh = Math.max(pushLow + 1, Math.round(currentPushCapacity * highPct))
      lines.push(`Push-ups: 5 sets of ${pushLow}-${pushHigh} reps`)
    }
    if (has('plank')) {
      const plankLow = Math.max(20, Math.round(currentPlankCapacity * (0.5 + weekBoost * 0.7)))
      const plankHigh = Math.max(plankLow + 5, Math.round(currentPlankCapacity * (0.65 + weekBoost * 0.6)))
      lines.push(`Plank: 4 sets of ${plankLow}-${plankHigh}s`)
    }
    if (has('run15') || has('swim450m') || has('swim500y')) lines.push('Optional easy cardio flush: 15-20 min')
  } else if (plan.dayName === 'Wednesday') {
    const duration = Math.min(45, Math.round(30 + (plan.week - 1) * 2))
    if (has('row2k')) {
      lines.push(`Row steady: ${duration} min`)
      lines.push(`Pace guide: ${formatSplit(baseSplit + 22)} to ${formatSplit(baseSplit + 30)}`)
    }
    if (has('run15')) lines.push(`Run steady: ${Math.max(20, duration - 5)} min at conversational effort`)
    if (has('swim450m') || has('swim500y')) lines.push(`Swim steady: ${Math.max(20, duration - 10)} min easy-moderate`)
  } else if (plan.dayName === 'Thursday') {
    if (has('pushups')) {
      const center = Math.max(6, Math.round(currentPushCapacity * (0.42 + weekBoost * 0.6)))
      const pyramid = [center - 2, center, center + 2, center, center - 2].map((rep) => Math.max(4, rep))
      lines.push(`Push-up pyramid: ${pyramid.join(' / ')} reps`)
    }
    if (has('plank')) {
      const step = clamp(20 + plan.week * 3, 20, 45)
      lines.push(`Plank ladder: ${step}s / ${step * 2}s / ${step * 3}s / ${step * 2}s / ${step}s`)
    }
    if (has('row2k') || has('run15') || has('swim450m') || has('swim500y')) lines.push('Finish with 10-15 min easy cardio')
  } else if (plan.dayName === 'Friday') {
    if (has('row2k')) {
      const reps = plan.week >= 7 ? 12 : 10
      lines.push(`Row: ${reps}x1 min hard with 1 min easy recovery`)
      lines.push(`Hard pace target: ${formatSplit(baseSplit - 2)} to ${formatSplit(baseSplit + 2)}`)
    }
    if (has('run15')) lines.push('Run speed: 10x1 min fast with 1 min easy')
    if (has('swim450m') || has('swim500y')) lines.push('Swim speed: 10x50 hard with 30-45s rest')
    if (has('plank')) {
      const hold = Math.max(25, Math.round(currentPlankCapacity * (0.7 + weekBoost * 0.5)))
      lines.push(`Plank: 3 holds of ${hold}s (stop before form breaks)`)
    }
  } else if (plan.dayName === 'Saturday') {
    const duration = Math.min(75, Math.round(45 + (plan.week - 1) * 4))
    if (has('row2k')) {
      lines.push(`Long easy row: ${duration} min`)
      lines.push(`Pace guide: ${formatSplit(baseSplit + 24)} to ${formatSplit(baseSplit + 34)}`)
    }
    if (has('run15')) lines.push(`Long easy run: ${Math.max(25, duration - 15)} min`)
    if (has('swim450m') || has('swim500y')) lines.push(`Long easy swim: ${Math.max(20, duration - 25)} min`)
  } else {
    lines.push('Active recovery: 20-40 min walk, mobility, or easy swim')
  }

  if (lines.length === 0) {
    return ['Mobility day: 20-30 min movement quality and recovery work']
  }

  return lines
}

function getSessionSteps(plan, baseline, goals, logs, config) {
  const steps = []
  const addStep = (label, seconds, type = 'work', options = {}) => {
    const safeSeconds = Math.max(1, Math.round(Number(seconds) || 1))
    const fallbackIntensity =
      type === 'rest' ? 'recovery' :
        type === 'warmup' || type === 'cooldown' ? 'easy' :
          type === 'test' ? 'hard' :
            'moderate'

    steps.push({
      label,
      seconds: safeSeconds,
      type,
      pace: options.pace || '',
      intensity: options.intensity || fallbackIntensity
    })
  }

  const totalDays = clamp(config?.programDays || DEFAULT_PROGRAM_DAYS, MIN_PROGRAM_DAYS, MAX_PROGRAM_DAYS)
  const selectedWorkouts = getSelectedWorkoutIds(config?.selectedWorkouts)
  const has = (id) => selectedWorkouts.includes(id)

  const cycleProgress = clamp(plan.day / totalDays, 0, 1)
  const current2kCapacity = baseline.row2kSeconds + (goals.row2kGoalSeconds - baseline.row2kSeconds) * cycleProgress
  const currentPushCapacity = baseline.pushupMax + (goals.pushupGoal - baseline.pushupMax) * cycleProgress
  const currentPlankCapacity = baseline.plankMaxSeconds + (goals.plankGoalSeconds - baseline.plankMaxSeconds) * cycleProgress
  const runBase = getCardioBaselineSeconds(logs, 'run15', 13 * 60)
  const swim450Base = getCardioBaselineSeconds(logs, 'swim450m', 10 * 60)
  const swim500yBase = getCardioBaselineSeconds(logs, 'swim500y', 10 * 60)
  const baseSplit = current2kCapacity / 4
  const easySplit = `${formatSplit(baseSplit + 24)} to ${formatSplit(baseSplit + 34)}`
  const moderateSplit = `${formatSplit(baseSplit + 14)} to ${formatSplit(baseSplit + 20)}`

  if (plan.day === 0) {
    addStep('Warm-up + dynamic mobility', 12 * 60, 'warmup', { intensity: 'easy' })
    if (has('row2k')) {
      addStep('Row test: 2,000m all-out', Math.round(baseline.row2kSeconds), 'test', {
        pace: `${formatSplit((baseline.row2kSeconds / 4) - 2)} to ${formatSplit((baseline.row2kSeconds / 4) + 2)}`,
        intensity: 'hard'
      })
      addStep('Recovery walk and breathing reset', 3 * 60, 'rest')
    }
    if (has('run15')) {
      addStep('1.5 mile run time trial', Math.round(runBase), 'test', { intensity: 'hard' })
      addStep('Recovery walk', 3 * 60, 'rest')
    }
    if (has('swim450m')) {
      addStep('450m swim time trial', Math.round(swim450Base), 'test', { intensity: 'hard' })
      addStep('Pool deck recovery', 2 * 60, 'rest')
    }
    if (has('swim500y')) {
      addStep('500 yard swim time trial', Math.round(swim500yBase), 'test', { intensity: 'hard' })
      addStep('Pool deck recovery', 2 * 60, 'rest')
    }
    if (has('pushups')) {
      addStep('Push-up max test (strict)', 90, 'test')
      addStep('Recovery', 2 * 60, 'rest')
    }
    if (has('plank')) addStep('Plank max test', 180, 'test')
    return steps
  }

  if (plan.day === totalDays) {
    addStep('Warm-up + dynamic mobility', 12 * 60, 'warmup', { intensity: 'easy' })
    if (has('row2k')) {
      addStep(`Row retest: 2,000m at ${formatSeconds(goals.row2kGoalSeconds)} goal`, Math.round(goals.row2kGoalSeconds), 'test', {
        pace: `${formatSplit((goals.row2kGoalSeconds / 4) - 2)} to ${formatSplit((goals.row2kGoalSeconds / 4) + 1)}`,
        intensity: 'hard'
      })
      addStep('Recovery walk and breathing reset', 3 * 60, 'rest')
    }
    if (has('run15')) {
      addStep(`1.5 mile run retest (goal ${formatSeconds(runBase * 0.94)})`, Math.round(runBase * 0.94), 'test', { intensity: 'hard' })
      addStep('Recovery walk', 3 * 60, 'rest')
    }
    if (has('swim450m')) {
      addStep(`450m swim retest (goal ${formatSeconds(swim450Base * 0.94)})`, Math.round(swim450Base * 0.94), 'test', { intensity: 'hard' })
      addStep('Pool deck recovery', 2 * 60, 'rest')
    }
    if (has('swim500y')) {
      addStep(`500 yard swim retest (goal ${formatSeconds(swim500yBase * 0.94)})`, Math.round(swim500yBase * 0.94), 'test', { intensity: 'hard' })
      addStep('Pool deck recovery', 2 * 60, 'rest')
    }
    if (has('pushups')) {
      addStep(`Push-up retest: chase ${Math.round(goals.pushupGoal)} reps in 1 min`, 60, 'test')
      addStep('Recovery', 2 * 60, 'rest')
    }
    if (has('plank')) addStep(`Plank retest: chase ${formatSeconds(goals.plankGoalSeconds)}`, Math.round(goals.plankGoalSeconds), 'test')
    return steps
  }

  if (plan.phase === 'Taper') {
    if (has('row2k') || has('run15') || has('swim450m') || has('swim500y')) {
      addStep('Easy cardio', 20 * 60, 'work', { pace: easySplit, intensity: 'easy' })
      for (let i = 1; i <= 3; i += 1) {
        addStep(`Primer ${i}/3 moderate effort`, 60, 'work', { pace: moderateSplit, intensity: 'moderate' })
        addStep('Easy recovery', 2 * 60, 'rest')
      }
    }
    if (has('pushups')) {
      const pushTarget = Math.max(5, Math.round(currentPushCapacity * 0.55))
      addStep(`Push-up set 1/2 target ${pushTarget} reps`, 60, 'work')
      addStep('Push-up rest', 90, 'rest')
      addStep(`Push-up set 2/2 target ${pushTarget} reps`, 60, 'work')
    }
    if (has('plank')) {
      const plankHold = Math.max(20, Math.round(currentPlankCapacity * 0.55))
      addStep(`Plank hold 1/2 for ${plankHold}s`, plankHold, 'work')
      addStep('Plank rest', 60, 'rest')
      addStep(`Plank hold 2/2 for ${plankHold}s`, plankHold, 'work')
    }
    if (steps.length === 0) addStep('Mobility and breathing only', 15 * 60, 'work')
    return steps
  }

  const phaseBoost = plan.phase === 'Phase 2' ? 0.05 : 0
  const weekBoost = clamp((plan.week - 1) * 0.05 + phaseBoost, 0, 0.35)

  if (plan.dayName === 'Monday') {
    addStep('Warm-up mobility', 8 * 60, 'warmup')
    if (has('row2k')) {
      const rest = plan.phase === 'Phase 1' ? 120 : Math.max(75, 110 - (plan.week - 5) * 10)
      const splitLow = baseSplit + (plan.phase === 'Phase 1' ? 7 - plan.week : 3)
      const splitHigh = splitLow + 3
      for (let i = 1; i <= 6; i += 1) {
        addStep(`Interval ${i}/6 hard row`, 180, 'work', {
          pace: `${formatSplit(splitLow)} to ${formatSplit(splitHigh)}`,
          intensity: 'hard'
        })
        if (i < 6) addStep('Easy row recovery', rest, 'rest')
      }
    }
    if (has('run15')) {
      for (let i = 1; i <= 6; i += 1) {
        addStep(`Run interval ${i}/6 hard`, 120, 'work', { intensity: 'hard' })
        if (i < 6) addStep('Easy jog recovery', 120, 'rest')
      }
    }
    if (has('swim450m') || has('swim500y')) {
      for (let i = 1; i <= 8; i += 1) {
        addStep(`Swim rep ${i}/8 moderate-hard`, 50, 'work', { intensity: 'hard' })
        if (i < 8) addStep('Swim rest', 40, 'rest')
      }
    }
    addStep('Cooldown easy cardio', 6 * 60, 'cooldown')
    return steps
  }

  if (plan.dayName === 'Tuesday') {
    const lowPct = clamp(0.6 + weekBoost, 0.6, 0.78)
    const highPct = clamp(lowPct + 0.08, 0.68, 0.86)
    const pushLow = Math.max(4, Math.round(currentPushCapacity * lowPct))
    const pushHigh = Math.max(pushLow + 1, Math.round(currentPushCapacity * highPct))
    const plankLow = Math.max(20, Math.round(currentPlankCapacity * (0.5 + weekBoost * 0.7)))
    const plankHigh = Math.max(plankLow + 5, Math.round(currentPlankCapacity * (0.65 + weekBoost * 0.6)))

    addStep('Warm-up shoulder + core prep', 8 * 60, 'warmup')
    for (let i = 1; i <= 5; i += 1) {
      addStep(`Push-up set ${i}/5 target ${pushLow}-${pushHigh} reps`, 60, 'work')
      if (i < 5) addStep('Push-up rest', 90, 'rest')
    }
    for (let i = 1; i <= 4; i += 1) {
      const hold = i % 2 === 0 ? plankHigh : plankLow
      addStep(`Plank hold ${i}/4 for ${hold}s`, hold, 'work')
      if (i < 4) addStep('Plank rest', 60, 'rest')
    }
    return steps
  }

  if (plan.dayName === 'Wednesday') {
    const duration = Math.min(45, Math.round(30 + (plan.week - 1) * 2))
    if (has('row2k')) {
      addStep('Steady tempo row', duration * 60, 'work', {
        pace: `${formatSplit(baseSplit + 22)} to ${formatSplit(baseSplit + 30)}`,
        intensity: 'moderate'
      })
    }
    if (has('run15')) addStep('Steady run', Math.max(20, duration - 5) * 60, 'work', { intensity: 'moderate' })
    if (has('swim450m') || has('swim500y')) addStep('Steady swim', Math.max(20, duration - 10) * 60, 'work', { intensity: 'moderate' })
    addStep('Cooldown easy cardio', 6 * 60, 'cooldown', { pace: easySplit, intensity: 'easy' })
    return steps
  }

  if (plan.dayName === 'Thursday') {
    const center = Math.max(6, Math.round(currentPushCapacity * (0.42 + weekBoost * 0.6)))
    const pyramid = [center - 2, center, center + 2, center, center - 2].map((rep) => Math.max(4, rep))
    const rest = Math.max(30, 75 - plan.week * 5)
    const step = clamp(20 + plan.week * 3, 20, 45)
    const ladder = [step, step * 2, step * 3, step * 2, step]

    addStep('Warm-up mobility', 8 * 60, 'warmup')
    pyramid.forEach((reps, index) => {
      addStep(`Push-up pyramid set ${index + 1}/5 target ${reps} reps`, 60, 'work')
      if (index < pyramid.length - 1) addStep('Push-up rest', rest, 'rest')
    })
    ladder.forEach((hold, index) => {
      addStep(`Plank ladder hold ${index + 1}/5 for ${hold}s`, hold, 'work')
      if (index < ladder.length - 1) addStep('Plank rest', 45, 'rest')
    })
    return steps
  }

  if (plan.dayName === 'Friday') {
    const reps = plan.week >= 7 ? 12 : 10
    addStep('Warm-up cardio + trunk prep', 8 * 60, 'warmup', { pace: easySplit, intensity: 'easy' })
    if (has('row2k')) {
      for (let i = 1; i <= reps; i += 1) {
        addStep(`Speed rep ${i}/${reps} hard row`, 60, 'work', {
          pace: `${formatSplit(baseSplit - 2)} to ${formatSplit(baseSplit + 2)}`,
          intensity: 'hard'
        })
        if (i < reps) addStep('Easy row rest', 60, 'rest')
      }
    }
    if (has('run15')) {
      for (let i = 1; i <= 10; i += 1) {
        addStep(`Run speed rep ${i}/10`, 60, 'work', { intensity: 'hard' })
        if (i < 10) addStep('Easy jog rest', 60, 'rest')
      }
    }
    if (has('swim450m') || has('swim500y')) {
      for (let i = 1; i <= 10; i += 1) {
        addStep(`Swim speed rep ${i}/10`, 50, 'work', { intensity: 'hard' })
        if (i < 10) addStep('Swim rest', 40, 'rest')
      }
    }
    if (has('plank')) {
      const hold = Math.max(25, Math.round(currentPlankCapacity * (0.7 + weekBoost * 0.5)))
      for (let i = 1; i <= 3; i += 1) {
        addStep(`Plank quality hold ${i}/3 for ${hold}s`, hold, 'work')
        if (i < 3) addStep('Plank rest', 60, 'rest')
      }
    }
    return steps
  }

  if (plan.dayName === 'Saturday') {
    const duration = Math.min(75, Math.round(45 + (plan.week - 1) * 4))
    if (has('row2k')) {
      addStep('Long easy row', duration * 60, 'work', {
        pace: `${formatSplit(baseSplit + 24)} to ${formatSplit(baseSplit + 34)}`,
        intensity: 'easy'
      })
    }
    if (has('run15')) addStep('Long easy run', Math.max(25, duration - 15) * 60, 'work', { intensity: 'easy' })
    if (has('swim450m') || has('swim500y')) addStep('Long easy swim', Math.max(20, duration - 25) * 60, 'work', { intensity: 'easy' })
    addStep('Cooldown breathing and mobility', 8 * 60, 'cooldown', { pace: easySplit, intensity: 'easy' })
    return steps
  }

  addStep('Active recovery (walk, swim, mobility)', 30 * 60, 'work')
  return steps
}

function buildProgram(config) {
  const totalDays = clamp(config?.programDays || DEFAULT_PROGRAM_DAYS, MIN_PROGRAM_DAYS, MAX_PROGRAM_DAYS)
  const selectedWorkouts = getSelectedWorkoutIds(config?.selectedWorkouts)

  const baselineWorkouts = ['Warm up 10-15 min with easy cardio + dynamic mobility']
  if (selectedWorkouts.includes('row2k')) baselineWorkouts.push('Row: 2,000m all-out (record time + avg split)')
  if (selectedWorkouts.includes('run15')) baselineWorkouts.push('Run: 1.5 mile all-out (record total time)')
  if (selectedWorkouts.includes('swim450m')) baselineWorkouts.push('Swim: 450m all-out (record total time)')
  if (selectedWorkouts.includes('swim500y')) baselineWorkouts.push('Swim: 500 yard all-out (record total time)')
  if (selectedWorkouts.includes('pushups')) baselineWorkouts.push('Push-ups: max continuous strict reps')
  if (selectedWorkouts.includes('plank')) baselineWorkouts.push('Plank: forearm hold to technical failure')
  baselineWorkouts.push('Set SMART targets for retest day')

  const plan = [
    {
      day: 0,
      phase: 'Baseline',
      week: 0,
      dayName: 'Test Day',
      title: 'Baseline Test Day',
      workouts: baselineWorkouts
    }
  ]

  const taperStart = totalDays - 3

  for (let day = 1; day < taperStart; day += 1) {
    const week = Math.ceil(day / 7)
    const dayName = weekDayNames[(day - 1) % 7]
    const template = dayTemplates[dayName]
    const templateWorkouts = getTemplateWorkouts(dayName, selectedWorkouts)
    const phase = day <= Math.floor((totalDays - 3) * 0.55) ? 'Phase 1' : 'Phase 2'
    const notes = []

    if (phase === 'Phase 1') {
      notes.push('Priority: technique, consistency, and submax volume')
      notes.push('Increase load by 5-10% only if recovery is good')
    } else {
      notes.push('Priority: intensity and density progression')
      notes.push('Reduce rests and sharpen race-pace execution')
      if (day % 14 === 0) {
        notes.push('2k simulation today at 90-95% effort if recovered')
      }
    }

    if (week === 4 && dayName === 'Sunday') {
      notes.push('Use a deload week if fatigue has accumulated')
    }

    plan.push({
      day,
      phase,
      week,
      dayName,
      title: template.title,
      workouts: templateWorkouts,
      notes
    })
  }

  plan.push(
    {
      day: taperStart,
      phase: 'Taper',
      week: Math.ceil(taperStart / 7),
      dayName: 'Taper',
      title: 'Taper Day 1',
      workouts: [
        'Cardio: 20-25 min easy',
        'Primer: 3x1 min moderate with full easy recovery',
        'Strength/core: 2-3 light submax sets'
      ]
    },
    {
      day: taperStart + 1,
      phase: 'Taper',
      week: Math.ceil((taperStart + 1) / 7),
      dayName: 'Taper',
      title: 'Taper Day 2',
      workouts: ['15-20 min very easy row or walk', 'Mobility only, no intensity']
    },
    {
      day: taperStart + 2,
      phase: 'Taper',
      week: Math.ceil((taperStart + 2) / 7),
      dayName: 'Taper',
      title: 'Taper Day 3',
      workouts: ['Full rest or short mobility', 'Hydrate, sleep, and review race pacing plan']
    },
    {
      day: totalDays,
      phase: 'Retest',
      week: Math.ceil(totalDays / 7),
      dayName: 'Final Test',
      title: 'Final Retest Day',
      workouts: [
        'Repeat baseline protocol exactly',
        'Row: 2,000m all-out (compare time and split)',
        'Push-ups: max strict reps',
        'Plank: forearm hold to technical failure'
      ]
    }
  )

  return plan
}

function App() {
  const [programConfig, setProgramConfig] = useState(() => {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) {
      return normalizeProgramConfig({
        programDays: DEFAULT_PROGRAM_DAYS,
        selectedWorkouts: defaultWorkoutSelection
      })
    }

    try {
      return normalizeProgramConfig(JSON.parse(raw))
    } catch {
      return normalizeProgramConfig({
        programDays: DEFAULT_PROGRAM_DAYS,
        selectedWorkouts: defaultWorkoutSelection
      })
    }
  })
  const program = useMemo(() => buildProgram(programConfig), [programConfig])
  const [selectedDay, setSelectedDay] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    const savedLogs = raw ? JSON.parse(raw) : {}
    for (let i = 0; i <= MAX_PROGRAM_DAYS; i += 1) {
      if (!savedLogs[i]?.complete) return i
    }
    return DEFAULT_PROGRAM_DAYS
  })
  const [activeTab, setActiveTab] = useState('day')
  const [logs, setLogs] = useState(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  })
  const [goals, setGoals] = useState(() => {
    const raw = localStorage.getItem(GOALS_KEY)
    if (raw) {
      return JSON.parse(raw)
    }

    return {
      row2kGoal: '7:00',
      pushupGoal: '60',
      plankGoal: '3:20'
    }
  })
  const [firebaseApi, setFirebaseApi] = useState(null)
  const [cloudStatus, setCloudStatus] = useState('Checking cloud config...')
  const [cloudUid, setCloudUid] = useState('')
  const [cloudUserLabel, setCloudUserLabel] = useState('')
  const [guestMode, setGuestMode] = useState(false)
  const [authError, setAuthError] = useState('')
  const applyingRemoteRef = useRef(false)
  const lastCloudPayloadRef = useRef('')

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
  }, [logs])

  useEffect(() => {
    localStorage.setItem(GOALS_KEY, JSON.stringify(goals))
  }, [goals])

  useEffect(() => {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(programConfig))
  }, [programConfig])

  useEffect(() => {
    setSelectedDay((current) => clamp(current, 0, programConfig.programDays))
  }, [programConfig.programDays])

  useEffect(() => {
    let cancelled = false

    import('./firebase')
      .then((module) => {
        if (cancelled) {
          return
        }

        if (!module.firebaseConfigured) {
          setCloudStatus('Local storage mode')
          return
        }

        setFirebaseApi(module)
        setCloudStatus('Connecting to Firebase...')
      })
      .catch(() => {
        if (!cancelled) {
          setCloudStatus('Firebase load failed, using local mode')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!firebaseApi?.auth) {
      return undefined
    }

    let cancelled = false

    firebaseApi
      .setPersistence(firebaseApi.auth, firebaseApi.browserLocalPersistence)
      .catch(() => firebaseApi.setPersistence(firebaseApi.auth, firebaseApi.browserSessionPersistence))
      .catch(() => {
        if (!cancelled) {
          const message = 'Browser blocked sign-in persistence; disable private mode for saved login'
          setAuthError(message)
          setCloudStatus(message)
        }
      })

    const unsubscribe = firebaseApi.onAuthStateChanged(firebaseApi.auth, (user) => {
      if (user) {
        setGuestMode(false)
        setAuthError('')
        setCloudUid(user.uid)
        const label = user.displayName || user.email || user.uid.slice(0, 8)
        setCloudUserLabel(label)
        setCloudStatus('Cloud sync active')
        return
      }

      setCloudUid('')
      setCloudUserLabel('')
      setCloudStatus(guestMode ? 'Guest mode (local only)' : 'Sign in with Google for cloud sync')
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [firebaseApi, guestMode])

  useEffect(() => {
    if (!firebaseApi?.auth) {
      return
    }

    firebaseApi.getRedirectResult(firebaseApi.auth).then(() => {
      // redirect result consumed, auth state listener will handle user
    }).catch((error) => {
      if (error?.code === 'auth/unauthorized-domain') {
        const message = 'Google sign-in blocked: add this domain in Firebase authorized domains'
        setAuthError(message)
        setCloudStatus(message)
        return
      }

      const message = `Google sign-in failed (${error?.code || 'unknown error'})`
      setAuthError(message)
      setCloudStatus(message)
    })
  }, [firebaseApi])

  const signInWithGoogle = async () => {
    if (!firebaseApi?.auth) {
      return
    }

    setGuestMode(false)
    setAuthError('')
    setCloudStatus('Signing in with Google...')

    try {
      // Ensure persistence is set first
      await firebaseApi.setPersistence(firebaseApi.auth, firebaseApi.browserLocalPersistence)
        .catch(() => firebaseApi.setPersistence(firebaseApi.auth, firebaseApi.browserSessionPersistence))
      
      // Try popup first (works on modern mobile and desktop)
      try {
        await firebaseApi.signInWithPopup(firebaseApi.auth, firebaseApi.googleProvider)
        return
      } catch (popupError) {
        // Popup failed; try redirect for some browsers
        if (
          popupError?.code === 'auth/popup-blocked' ||
          popupError?.code === 'auth/cancelled-popup-request' ||
          popupError?.code === 'auth/operation-not-supported-in-this-environment'
        ) {
          await firebaseApi.signInWithRedirect(firebaseApi.auth, firebaseApi.googleProvider)
          return
        }
        // If it's not popup-specific, re-throw
        throw popupError
      }
    } catch (error) {
      if (error?.code === 'auth/unauthorized-domain') {
        const message = 'Google sign-in blocked: add this domain in Firebase authorized domains'
        setAuthError(message)
        setCloudStatus(message)
        return
      }

      const message = `Google sign-in failed (${error?.code || 'unknown error'})`
      setAuthError(message)
      setCloudStatus(message)
      console.error('Sign-in error:', error)
    }
  }

  const signOutFromCloud = async () => {
    if (!firebaseApi?.auth) {
      return
    }

    try {
      await firebaseApi.signOut(firebaseApi.auth)
      setCloudStatus('Signed out, local mode only')
    } catch {
      setCloudStatus('Sign out failed')
    }
  }

  const continueAsGuest = () => {
    setGuestMode(true)
      setAuthError('')
    setCloudUid('')
    setCloudUserLabel('')
    setCloudStatus('Guest mode (local only)')
  }

  useEffect(() => {
    if (!firebaseApi?.db || !cloudUid) {
      return undefined
    }

    const documentRef = firebaseApi.doc(firebaseApi.db, 'users', cloudUid, 'appData', 'workoutTracker')
    const unsubscribe = firebaseApi.onSnapshot(
      documentRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          return
        }

        const data = snapshot.data()
        const remotePayload = JSON.stringify({
          logs: data.logs || {},
          goals: data.goals || {},
          config: normalizeProgramConfig(data.config || {})
        })

        if (remotePayload === lastCloudPayloadRef.current) {
          return
        }

        applyingRemoteRef.current = true
        if (data.logs) {
          setLogs(data.logs)
        }
        if (data.goals) {
          setGoals(data.goals)
        }
        if (data.config) {
          setProgramConfig(normalizeProgramConfig(data.config))
        }
        lastCloudPayloadRef.current = remotePayload
        setCloudStatus('Cloud sync active')
        setTimeout(() => {
          applyingRemoteRef.current = false
        }, 0)
      },
      () => {
        setCloudStatus('Cloud read failed, using local mode')
      }
    )

    return unsubscribe
  }, [cloudUid, firebaseApi])

  useEffect(() => {
    if (!firebaseApi?.db || !cloudUid || applyingRemoteRef.current) {
      return
    }

    const payload = JSON.stringify({ logs, goals, config: programConfig })
    if (payload === lastCloudPayloadRef.current) {
      return
    }

    lastCloudPayloadRef.current = payload
    const documentRef = firebaseApi.doc(firebaseApi.db, 'users', cloudUid, 'appData', 'workoutTracker')
    firebaseApi.setDoc(
      documentRef,
      {
        logs,
        goals,
        config: programConfig,
        updatedAt: firebaseApi.serverTimestamp()
      },
      { merge: true }
    ).catch(() => {
      setCloudStatus('Cloud write failed, using local mode')
    })
  }, [logs, goals, programConfig, cloudUid, firebaseApi])

  const completeCount = Object.values(logs).filter((log) => log.complete).length
  const selectedPlan = program.find((item) => item.day === selectedDay) || program[program.length - 1]
  const selectedLog = logs[selectedDay] || {}
  const baseline = useMemo(() => getBaseline(logs), [logs])
  const goalMetrics = useMemo(() => getGoals(goals, baseline), [goals, baseline])
  const sessionSteps = useMemo(
    () => getSessionSteps(selectedPlan, baseline, goalMetrics, logs, programConfig),
    [selectedPlan, baseline, goalMetrics, logs, programConfig]
  )
  const [sessionState, setSessionState] = useState({
    status: 'idle',
    stepIndex: 0,
    remaining: 0
  })
  const dayTargets = useMemo(
    () => getDailyPrescription(selectedPlan, baseline, goalMetrics, logs, programConfig),
    [selectedPlan, baseline, goalMetrics, logs, programConfig]
  )
  const currentStep = sessionSteps[sessionState.stepIndex]
  const activeWorkoutItems = workoutCatalog.filter((item) => workoutEnabled(programConfig.selectedWorkouts, item.id))
  const activeWorkoutLabels = activeWorkoutItems.map((item) => item.label)

  const updateLog = (field, value) => {
    setLogs((current) => ({
      ...current,
      [selectedDay]: {
        ...current[selectedDay],
        [field]: value
      }
    }))
  }

  const updateGoal = (field, value) => {
    setGoals((current) => ({
      ...current,
      [field]: value
    }))
  }

  const updateProgramDays = (value) => {
    setProgramConfig((current) => normalizeProgramConfig({
      ...current,
      programDays: clamp(Number(value) || DEFAULT_PROGRAM_DAYS, MIN_PROGRAM_DAYS, MAX_PROGRAM_DAYS)
    }))
  }

  const toggleWorkoutSelection = (workoutId, enabled) => {
    setProgramConfig((current) => normalizeProgramConfig({
      ...current,
      selectedWorkouts: {
        ...current.selectedWorkouts,
        [workoutId]: enabled
      }
    }))
  }

  const handleSelectDay = (day) => {
    setSelectedDay(day)
    setActiveTab('day')
  }

  const startOrPauseWorkout = () => {
    setSessionState((current) => {
      if (current.status === 'running') {
        return { ...current, status: 'paused' }
      }

      if (current.status === 'paused') {
        return { ...current, status: 'running' }
      }

      return {
        status: 'running',
        stepIndex: 0,
        remaining: Math.max(1, sessionSteps[0]?.seconds || 1)
      }
    })
  }

  const resetWorkout = () => {
    setSessionState({ status: 'idle', stepIndex: 0, remaining: 0 })
  }

  const skipStep = () => {
    setSessionState((current) => {
      const nextStep = current.stepIndex + 1
      if (nextStep >= sessionSteps.length) {
        return { ...current, status: 'complete', remaining: 0 }
      }

      return {
        status: current.status,
        stepIndex: nextStep,
        remaining: sessionSteps[nextStep].seconds
      }
    })
  }

  useEffect(() => {
    setSessionState({ status: 'idle', stepIndex: 0, remaining: 0 })
  }, [selectedDay])

  useEffect(() => {
    if (sessionState.status !== 'running') {
      return undefined
    }

    const timer = setInterval(() => {
      setSessionState((current) => {
        if (current.status !== 'running') {
          return current
        }

        if (current.remaining <= 1) {
          const nextStep = current.stepIndex + 1
          if (nextStep >= sessionSteps.length) {
            return {
              ...current,
              status: 'complete',
              remaining: 0
            }
          }

          return {
            status: 'running',
            stepIndex: nextStep,
            remaining: Math.max(1, sessionSteps[nextStep].seconds)
          }
        }

        return { ...current, remaining: current.remaining - 1 }
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [sessionState.status, sessionSteps])

  useEffect(() => {
    if (sessionState.status !== 'complete') {
      return
    }

    setLogs((current) => ({
      ...current,
      [selectedDay]: {
        ...current[selectedDay],
        complete: true
      }
    }))
  }, [sessionState.status, selectedDay])

  return (
    <div className="app-shell">
      <header className="hero-panel">
        <p className="eyebrow">{programConfig.programDays}-Day Performance Builder</p>
        <h1>{activeWorkoutLabels.join(' + ')}</h1>
        <p className="cloud-status">{cloudStatus}</p>
        {authError && <p className="auth-error">{authError}</p>}
        {firebaseApi?.firebaseConfigured && (
          <div className="auth-actions">
            {cloudUid ? (
              <>
                <span className="signed-in-as">Signed in as {cloudUserLabel}</span>
                <button type="button" className="hero-button" onClick={signOutFromCloud}>Sign out</button>
              </>
            ) : (
              <>
                <button type="button" className="hero-button" onClick={signInWithGoogle}>
                  Sign in with Google
                </button>
                <button type="button" className="hero-button hero-button-alt" onClick={continueAsGuest}>
                  Continue as guest
                </button>
              </>
            )}
          </div>
        )}
        <div className="hero-metrics">
          <div>
            <strong>{completeCount}</strong>
            <span>days done</span>
          </div>
          <div>
            <strong>Day {selectedDay}</strong>
            <span>{selectedPlan.title}</span>
          </div>
          <div>
            <strong>{programConfig.programDays}</strong>
            <span>total days</span>
          </div>
        </div>
      </header>

      <main className="tab-content">
        {activeTab === 'calendar' && (
          <div className="day-list-page">
            <h2>Program Calendar</h2>
            {program.map((item) => (
              <button
                key={item.day}
                type="button"
                className={`day-chip ${item.day === selectedDay ? 'active' : ''} ${logs[item.day]?.complete ? 'done' : ''}`}
                onClick={() => handleSelectDay(item.day)}
              >
                <span>Day {item.day}{logs[item.day]?.complete ? ' ✓' : ''}</span>
                <small>{item.title}</small>
              </button>
            ))}
          </div>
        )}

        {activeTab === 'day' && (
          <div className="day-details">
            <div className="card">
              <p className="phase-tag">{selectedPlan.phase}</p>
              <h2>
                Day {selectedPlan.day}: {selectedPlan.title}
              </h2>
              <p className="subline">
                {selectedPlan.week > 0 ? `Week ${selectedPlan.week}` : 'Preparation'} | {selectedPlan.dayName}
              </p>

              <div className="target-box">
                <h3>Today's Targets</h3>
                {!baseline.hasCompleteBaseline && selectedPlan.day > 0 && (
                  <p className="baseline-note">
                    Add Day 0 baseline values to personalize targets. Showing starter defaults until then.
                  </p>
                )}
                <ul>
                  {dayTargets.map((target, index) => (
                    <li key={index}>{target}</li>
                  ))}
                </ul>
              </div>

              <ul>
                {selectedPlan.workouts.map((work, index) => (
                  <li key={index}>{work}</li>
                ))}
              </ul>

              {selectedPlan.notes?.length > 0 && (
                <div className="notes">
                  <h3>Progression Notes</h3>
                  <ul>
                    {selectedPlan.notes.map((note, index) => (
                      <li key={index}>{note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="card tracker">
              <h3>Daily Log</h3>
              <div className="field-grid">
                {activeWorkoutItems.map((item) => (
                  <label key={item.id}>
                    {workoutLogInputs[item.id].label}
                    <input
                      value={selectedLog[item.logField] || ''}
                      onChange={(event) => updateLog(item.logField, event.target.value)}
                      placeholder={workoutLogInputs[item.id].placeholder}
                    />
                  </label>
                ))}
                <label>
                  RPE (1-10)
                  <input
                    value={selectedLog.rpe || ''}
                    onChange={(event) => updateLog('rpe', event.target.value)}
                    placeholder="e.g. 7"
                  />
                </label>
              </div>

              <label className="notes-input">
                Notes
                <textarea
                  value={selectedLog.notes || ''}
                  onChange={(event) => updateLog('notes', event.target.value)}
                  placeholder="Sleep, soreness, pacing notes, and adjustments"
                />
              </label>

              <label className="check-row">
                <input
                  type="checkbox"
                  checked={Boolean(selectedLog.complete)}
                  onChange={(event) => updateLog('complete', event.target.checked)}
                />
                Mark day complete
              </label>
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="day-details">
            <div className="card tracker">
              <h3>Program Setup</h3>
              <div className="field-grid">
                <label>
                  Program length (days)
                  <input
                    type="number"
                    min={MIN_PROGRAM_DAYS}
                    max={MAX_PROGRAM_DAYS}
                    step="1"
                    value={programConfig.programDays}
                    onChange={(event) => updateProgramDays(event.target.value)}
                    placeholder="e.g. 60"
                  />
                </label>
              </div>
              <p className="subline">Choose from {MIN_PROGRAM_DAYS} to {MAX_PROGRAM_DAYS} days.</p>

              <h3>Workout Selection</h3>
              <div className="toggle-grid">
                {workoutCatalog.map((item) => (
                  <label key={item.id} className="check-row workout-toggle">
                    <input
                      type="checkbox"
                      checked={workoutEnabled(programConfig.selectedWorkouts, item.id)}
                      onChange={(event) => toggleWorkoutSelection(item.id, event.target.checked)}
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="card tracker">
              <h3>Target Goals (Day {programConfig.programDays})</h3>
              <div className="field-grid">
                {workoutEnabled(programConfig.selectedWorkouts, 'row2k') && (
                  <label>
                    Row 2k goal time
                    <input
                      value={goals.row2kGoal}
                      onChange={(event) => updateGoal('row2kGoal', event.target.value)}
                      placeholder="e.g. 7:00"
                    />
                  </label>
                )}
                {workoutEnabled(programConfig.selectedWorkouts, 'pushups') && (
                  <label>
                    Push-up goal (in 1 minute)
                    <input
                      value={goals.pushupGoal}
                      onChange={(event) => updateGoal('pushupGoal', event.target.value)}
                      placeholder="e.g. 60"
                    />
                  </label>
                )}
                {workoutEnabled(programConfig.selectedWorkouts, 'plank') && (
                  <label>
                    Plank goal time
                    <input
                      value={goals.plankGoal}
                      onChange={(event) => updateGoal('plankGoal', event.target.value)}
                      placeholder="e.g. 3:20"
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="card safety">
              <h3>Warm-up, Recovery, and Scaling</h3>
              <ul>
                <li>Warm up 10-15 min and cool down 5-10 min every session.</li>
                <li>Deload for a week if fatigue persists or performance drops.</li>
                <li>Push-up scaling: incline to knee to full strict reps.</li>
                <li>Plank scaling: shorter sets or knee plank while maintaining position quality.</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'timer' && (
          <div className="day-details">
            <div className="card">
              <p className="phase-tag">{selectedPlan.phase}</p>
              <h2>
                Day {selectedPlan.day}: {selectedPlan.title}
              </h2>
              <p className="subline">
                {selectedPlan.week > 0 ? `Week ${selectedPlan.week}` : 'Preparation'} | {selectedPlan.dayName}
              </p>
            </div>

            <div className="card timer-card">
              <h3>Workout Timer</h3>
              <p className="timer-status">Status: {sessionState.status}</p>
              {sessionState.status === 'complete' && (
                <p className="timer-complete">Workout complete. Day marked as complete.</p>
              )}
              <div className={`timer-panel ${currentStep ? `intensity-${currentStep.intensity}` : ''}`}>
                <p className="timer-step">{currentStep ? currentStep.label : 'No session steps for today'}</p>
                {currentStep?.intensity && (
                  <p className={`timer-intensity intensity-pill intensity-${currentStep.intensity}`}>
                    Intensity: {currentStep.intensity}
                  </p>
                )}
                {currentStep?.pace && <p className="timer-pace">Row pace target: {currentStep.pace}</p>}
                <p className="timer-countdown">{formatSeconds(sessionState.remaining)}</p>
                <p className="timer-progress">
                  Step {Math.min(sessionState.stepIndex + 1, sessionSteps.length)} of {sessionSteps.length}
                </p>
              </div>
              <div className="timer-actions">
                <button type="button" onClick={startOrPauseWorkout} className="action-button">
                  {sessionState.status === 'running'
                    ? 'Pause Workout'
                    : sessionState.status === 'paused'
                      ? 'Resume Workout'
                      : 'Start Workout'}
                </button>
                <button type="button" onClick={skipStep} className="ghost-button" disabled={sessionState.status === 'idle'}>
                  Skip Step
                </button>
                <button type="button" onClick={resetWorkout} className="ghost-button">
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        <button
          type="button"
          className={`nav-tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <span className="nav-icon">📅</span>
          <span>Calendar</span>
        </button>
        <button
          type="button"
          className={`nav-tab ${activeTab === 'day' ? 'active' : ''}`}
          onClick={() => setActiveTab('day')}
        >
          <span className="nav-icon">📋</span>
          <span>Day {selectedDay}</span>
        </button>
        <button
          type="button"
          className={`nav-tab ${activeTab === 'goals' ? 'active' : ''}`}
          onClick={() => setActiveTab('goals')}
        >
          <span className="nav-icon">🎯</span>
          <span>Goals</span>
        </button>
        <button
          type="button"
          className={`nav-tab ${activeTab === 'timer' ? 'active' : ''}`}
          onClick={() => setActiveTab('timer')}
        >
          <span className="nav-icon">⏱</span>
          <span>Timer</span>
        </button>
      </nav>
    </div>
  )
}

export default App
