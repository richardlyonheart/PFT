import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'workout-tracker-v1'
const GOALS_KEY = 'workout-goals-v1'

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

function getDailyPrescription(plan, baseline, goals) {
  if (plan.day === 0) {
    return [
      'Warm-up: 10-15 min easy row + dynamic mobility',
      'Row: 2,000m all-out test, then record total time and avg split',
      'Push-ups: max strict set with no breaks',
      'Plank: forearm hold to technical failure'
    ]
  }

  if (plan.day === 60) {
    return [
      'Retest protocol: same warm-up and order as Day 0',
      `Row goal: ${formatSeconds(goals.row2kGoalSeconds)} for 2k`,
      `Push-up goal: ${Math.round(goals.pushupGoal)} strict reps in 1 minute`,
      `Plank goal: ${formatSeconds(goals.plankGoalSeconds)} hold`
    ]
  }

  const cycleProgress = clamp(plan.day / 60, 0, 1)
  const current2kCapacity = baseline.row2kSeconds + (goals.row2kGoalSeconds - baseline.row2kSeconds) * cycleProgress
  const currentPushCapacity = baseline.pushupMax + (goals.pushupGoal - baseline.pushupMax) * cycleProgress
  const currentPlankCapacity = baseline.plankMaxSeconds + (goals.plankGoalSeconds - baseline.plankMaxSeconds) * cycleProgress

  if (plan.phase === 'Taper') {
    if (plan.day === 57) {
      return [
        'Row: 20-25 min easy',
        'Primer: 3x1 min moderate / 2 min easy',
        `Push-ups: 3 sets of ${Math.max(5, Math.round(currentPushCapacity * 0.55))}`,
        `Plank: 2 holds of ${Math.max(20, Math.round(currentPlankCapacity * 0.55))}s`
      ]
    }

    if (plan.day === 58) {
      return ['15-20 min easy row or brisk walk', 'Mobility flow 10-15 min', 'No hard efforts']
    }

    return ['Full rest or 10-15 min mobility only', 'Hydrate and sleep for retest readiness']
  }

  const phaseBoost = plan.phase === 'Phase 2' ? 0.05 : 0
  const weekBoost = clamp((plan.week - 1) * 0.05 + phaseBoost, 0, 0.35)
  const baseSplit = current2kCapacity / 4

  if (plan.dayName === 'Monday') {
    const rest = plan.phase === 'Phase 1' ? 120 : Math.max(75, 110 - (plan.week - 5) * 10)
    const splitLow = baseSplit + (plan.phase === 'Phase 1' ? 7 - plan.week : 3)
    const splitHigh = splitLow + 3
    return [
      'Row: 6x3 min work reps',
      `Target split: ${formatSplit(splitLow)} to ${formatSplit(splitHigh)}`,
      `Recovery: ${rest}s easy row between reps`,
      'Cooldown: 5-10 min easy'
    ]
  }

  if (plan.dayName === 'Tuesday') {
    const lowPct = clamp(0.6 + weekBoost, 0.6, 0.78)
    const highPct = clamp(lowPct + 0.08, 0.68, 0.86)
    const pushLow = Math.max(4, Math.round(currentPushCapacity * lowPct))
    const pushHigh = Math.max(pushLow + 1, Math.round(currentPushCapacity * highPct))
    const plankLow = Math.max(20, Math.round(currentPlankCapacity * (0.5 + weekBoost * 0.7)))
    const plankHigh = Math.max(plankLow + 5, Math.round(currentPlankCapacity * (0.65 + weekBoost * 0.6)))
    return [
      `Push-ups: 5 sets of ${pushLow}-${pushHigh} reps`,
      'Rest: 90s between push-up sets',
      `Plank: 4 sets of ${plankLow}-${plankHigh}s`,
      'Rest: 60s between plank sets'
    ]
  }

  if (plan.dayName === 'Wednesday') {
    const duration = Math.min(45, Math.round(30 + (plan.week - 1) * 2))
    const splitLow = baseSplit + 22
    const splitHigh = baseSplit + 30
    return [
      `Row steady: ${duration} min`,
      `Pace guide: ${formatSplit(splitLow)} to ${formatSplit(splitHigh)}`,
      'Keep RPE around 5-6 and maintain conversational breathing'
    ]
  }

  if (plan.dayName === 'Thursday') {
    const center = Math.max(6, Math.round(currentPushCapacity * (0.42 + weekBoost * 0.6)))
    const pyramid = [center - 2, center, center + 2, center, center - 2].map((rep) => Math.max(4, rep))
    const step = clamp(20 + plan.week * 3, 20, 45)
    const rest = Math.max(30, 75 - plan.week * 5)
    return [
      `Push-up pyramid: ${pyramid.join(' / ')} reps`,
      `Rest: ${rest}s between sets`,
      `Plank ladder: ${step}s / ${step * 2}s / ${step * 3}s / ${step * 2}s / ${step}s`
    ]
  }

  if (plan.dayName === 'Friday') {
    const reps = plan.week >= 7 ? 12 : 10
    const splitLow = baseSplit - 2
    const splitHigh = baseSplit + 2
    const hold = Math.max(25, Math.round(currentPlankCapacity * (0.7 + weekBoost * 0.5)))
    return [
      `Row: ${reps}x1 min hard with 1 min easy recovery`,
      `Hard pace target: ${formatSplit(splitLow)} to ${formatSplit(splitHigh)}`,
      `Plank: 3 holds of ${hold}s (stop before form breaks)`
    ]
  }

  if (plan.dayName === 'Saturday') {
    const duration = Math.min(75, Math.round(45 + (plan.week - 1) * 4))
    const splitLow = baseSplit + 24
    const splitHigh = baseSplit + 34
    return [
      `Long easy row: ${duration} min`,
      `Pace guide: ${formatSplit(splitLow)} to ${formatSplit(splitHigh)}`,
      'Focus on clean stroke sequence and smooth breathing'
    ]
  }

  return ['Active recovery: 20-40 min walk, mobility, or easy swim', 'Foam roll and reset for next training block']
}

function getSessionSteps(plan, baseline, goals) {
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

  const cycleProgress = clamp(plan.day / 60, 0, 1)
  const current2kCapacity = baseline.row2kSeconds + (goals.row2kGoalSeconds - baseline.row2kSeconds) * cycleProgress
  const currentPushCapacity = baseline.pushupMax + (goals.pushupGoal - baseline.pushupMax) * cycleProgress
  const currentPlankCapacity = baseline.plankMaxSeconds + (goals.plankGoalSeconds - baseline.plankMaxSeconds) * cycleProgress
  const baseSplit = current2kCapacity / 4
  const easySplit = `${formatSplit(baseSplit + 24)} to ${formatSplit(baseSplit + 34)}`
  const moderateSplit = `${formatSplit(baseSplit + 14)} to ${formatSplit(baseSplit + 20)}`

  if (plan.day === 0) {
    addStep('Warm-up row + dynamic mobility', 12 * 60, 'warmup', { pace: easySplit, intensity: 'easy' })
    addStep('Row test: 2,000m all-out', Math.round(baseline.row2kSeconds), 'test', {
      pace: `${formatSplit((baseline.row2kSeconds / 4) - 2)} to ${formatSplit((baseline.row2kSeconds / 4) + 2)}`,
      intensity: 'hard'
    })
    addStep('Recovery walk and breathing reset', 4 * 60, 'rest')
    addStep('Push-up max test (strict)', 90, 'test')
    addStep('Recovery', 3 * 60, 'rest')
    addStep('Plank max test', 180, 'test')
    return steps
  }

  if (plan.day === 60) {
    addStep('Warm-up row + dynamic mobility', 12 * 60, 'warmup', { pace: easySplit, intensity: 'easy' })
    addStep(`Row retest: 2,000m at ${formatSeconds(goals.row2kGoalSeconds)} goal`, Math.round(goals.row2kGoalSeconds), 'test', {
      pace: `${formatSplit((goals.row2kGoalSeconds / 4) - 2)} to ${formatSplit((goals.row2kGoalSeconds / 4) + 1)}`,
      intensity: 'hard'
    })
    addStep('Recovery walk and breathing reset', 4 * 60, 'rest')
    addStep(`Push-up retest: chase ${Math.round(goals.pushupGoal)} reps in 1 min`, 60, 'test')
    addStep('Recovery', 3 * 60, 'rest')
    addStep(`Plank retest: chase ${formatSeconds(goals.plankGoalSeconds)}`, Math.round(goals.plankGoalSeconds), 'test')
    return steps
  }

  if (plan.phase === 'Taper') {
    if (plan.day === 57) {
      addStep('Easy row', 22 * 60, 'work', { pace: easySplit, intensity: 'easy' })
      for (let i = 1; i <= 3; i += 1) {
        addStep(`Primer ${i}/3 moderate row`, 60, 'work', { pace: moderateSplit, intensity: 'moderate' })
        addStep('Easy row recovery', 2 * 60, 'rest')
      }
      const pushTarget = Math.max(5, Math.round(currentPushCapacity * 0.55))
      for (let i = 1; i <= 3; i += 1) {
        addStep(`Push-up set ${i}/3 target ${pushTarget} reps`, 60, 'work')
        if (i < 3) addStep('Push-up rest', 90, 'rest')
      }
      const plankHold = Math.max(20, Math.round(currentPlankCapacity * 0.55))
      addStep(`Plank hold 1/2 for ${plankHold}s`, plankHold, 'work')
      addStep('Plank rest', 60, 'rest')
      addStep(`Plank hold 2/2 for ${plankHold}s`, plankHold, 'work')
      return steps
    }

    if (plan.day === 58) {
      addStep('Very easy row or walk', 18 * 60, 'work', { pace: easySplit, intensity: 'easy' })
      addStep('Mobility flow', 12 * 60, 'work')
      return steps
    }

    addStep('Mobility and breathing only', 15 * 60, 'work')
    return steps
  }

  const phaseBoost = plan.phase === 'Phase 2' ? 0.05 : 0
  const weekBoost = clamp((plan.week - 1) * 0.05 + phaseBoost, 0, 0.35)

  if (plan.dayName === 'Monday') {
    const rest = plan.phase === 'Phase 1' ? 120 : Math.max(75, 110 - (plan.week - 5) * 10)
    const splitLow = baseSplit + (plan.phase === 'Phase 1' ? 7 - plan.week : 3)
    const splitHigh = splitLow + 3
    addStep('Warm-up row + mobility', 10 * 60, 'warmup', { pace: easySplit, intensity: 'easy' })
    for (let i = 1; i <= 6; i += 1) {
      addStep(`Interval ${i}/6 hard row`, 180, 'work', {
        pace: `${formatSplit(splitLow)} to ${formatSplit(splitHigh)}`,
        intensity: 'hard'
      })
      if (i < 6) addStep('Easy row recovery', rest, 'rest')
    }
    addStep('Cooldown easy row', 8 * 60, 'cooldown', { pace: easySplit, intensity: 'easy' })
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
    const splitLow = baseSplit + 22
    const splitHigh = baseSplit + 30
    addStep('Steady tempo row', duration * 60, 'work', {
      pace: `${formatSplit(splitLow)} to ${formatSplit(splitHigh)}`,
      intensity: 'moderate'
    })
    addStep('Cooldown easy row', 6 * 60, 'cooldown', { pace: easySplit, intensity: 'easy' })
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
    const hold = Math.max(25, Math.round(currentPlankCapacity * (0.7 + weekBoost * 0.5)))
    const splitLow = baseSplit - 2
    const splitHigh = baseSplit + 2

    addStep('Warm-up row + trunk prep', 8 * 60, 'warmup', { pace: easySplit, intensity: 'easy' })
    for (let i = 1; i <= reps; i += 1) {
      addStep(`Speed rep ${i}/${reps} hard row`, 60, 'work', {
        pace: `${formatSplit(splitLow)} to ${formatSplit(splitHigh)}`,
        intensity: 'hard'
      })
      if (i < reps) addStep('Easy row rest', 60, 'rest')
    }
    for (let i = 1; i <= 3; i += 1) {
      addStep(`Plank quality hold ${i}/3 for ${hold}s`, hold, 'work')
      if (i < 3) addStep('Plank rest', 60, 'rest')
    }
    return steps
  }

  if (plan.dayName === 'Saturday') {
    const duration = Math.min(75, Math.round(45 + (plan.week - 1) * 4))
    const splitLow = baseSplit + 24
    const splitHigh = baseSplit + 34
    addStep('Long easy row', duration * 60, 'work', {
      pace: `${formatSplit(splitLow)} to ${formatSplit(splitHigh)}`,
      intensity: 'easy'
    })
    addStep('Cooldown breathing and mobility', 8 * 60, 'cooldown', { pace: easySplit, intensity: 'easy' })
    return steps
  }

  addStep('Active recovery (walk, swim, mobility)', 30 * 60, 'work')
  return steps
}

function buildProgram() {
  const plan = [
    {
      day: 0,
      phase: 'Baseline',
      week: 0,
      dayName: 'Test Day',
      title: 'Baseline Test Day',
      workouts: [
        'Warm up 10-15 min with easy row + dynamic mobility',
        'Row: 2,000m all-out (record time + avg split)',
        'Push-ups: max continuous strict reps',
        'Plank: forearm hold to technical failure',
        'Set SMART targets: 2k -6% to -8%, +20 push-ups, +45s plank'
      ]
    }
  ]

  for (let day = 1; day <= 56; day += 1) {
    const week = Math.ceil(day / 7)
    const dayName = weekDayNames[(day - 1) % 7]
    const template = dayTemplates[dayName]
    const phase = week <= 4 ? 'Phase 1' : 'Phase 2'
    const notes = []

    if (phase === 'Phase 1') {
      notes.push('Priority: technique, consistency, and submax volume')
      notes.push('Increase load by 5-10% only if recovery is good')
    } else {
      notes.push('Priority: intensity and density progression')
      notes.push('Reduce rests and sharpen race-pace execution')
      if (day === 35 || day === 49) {
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
      workouts: template.workouts,
      notes
    })
  }

  plan.push(
    {
      day: 57,
      phase: 'Taper',
      week: 9,
      dayName: 'Taper',
      title: 'Taper Day 1',
      workouts: [
        'Row: 20-25 min easy',
        'Primer: 3x1 min moderate with full easy recovery',
        'Push-ups: 3 light sets at 50-60% max',
        'Plank: 2 submax holds'
      ]
    },
    {
      day: 58,
      phase: 'Taper',
      week: 9,
      dayName: 'Taper',
      title: 'Taper Day 2',
      workouts: ['15-20 min very easy row or walk', 'Mobility only, no intensity']
    },
    {
      day: 59,
      phase: 'Taper',
      week: 9,
      dayName: 'Taper',
      title: 'Taper Day 3',
      workouts: ['Full rest or short mobility', 'Hydrate, sleep, and review race pacing plan']
    },
    {
      day: 60,
      phase: 'Retest',
      week: 9,
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
  const program = useMemo(() => buildProgram(), [])
  const [selectedDay, setSelectedDay] = useState(0)
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

    firebaseApi.getRedirectResult(firebaseApi.auth).catch((error) => {
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
      await firebaseApi.signInWithRedirect(firebaseApi.auth, firebaseApi.googleProvider)
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
        const remotePayload = JSON.stringify({ logs: data.logs || {}, goals: data.goals || {} })

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

    const payload = JSON.stringify({ logs, goals })
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
        updatedAt: firebaseApi.serverTimestamp()
      },
      { merge: true }
    ).catch(() => {
      setCloudStatus('Cloud write failed, using local mode')
    })
  }, [logs, goals, cloudUid, firebaseApi])

  const completeCount = Object.values(logs).filter((log) => log.complete).length
  const selectedPlan = program.find((item) => item.day === selectedDay)
  const selectedLog = logs[selectedDay] || {}
  const baseline = useMemo(() => getBaseline(logs), [logs])
  const goalMetrics = useMemo(() => getGoals(goals, baseline), [goals, baseline])
  const sessionSteps = useMemo(
    () => getSessionSteps(selectedPlan, baseline, goalMetrics),
    [selectedPlan, baseline, goalMetrics]
  )
  const [sessionState, setSessionState] = useState({
    status: 'idle',
    stepIndex: 0,
    remaining: 0
  })
  const dayTargets = useMemo(
    () => getDailyPrescription(selectedPlan, baseline, goalMetrics),
    [selectedPlan, baseline, goalMetrics]
  )
  const currentStep = sessionSteps[sessionState.stepIndex]

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
        <p className="eyebrow">60-Day Performance Builder</p>
        <h1>Row + Push-ups + Plank</h1>
        <p>
          Baseline to retest, phase-based overload, taper, and daily tracking in one place.
        </p>
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
            <span>days completed</span>
          </div>
          <div>
            <strong>5/2</strong>
            <span>train/recovery rhythm</span>
          </div>
          <div>
            <strong>60</strong>
            <span>total days</span>
          </div>
        </div>
        <div className="goal-inline">
          <span>Goal 2k: {formatSeconds(goalMetrics.row2kGoalSeconds)}</span>
          <span>Goal Push-ups: {Math.round(goalMetrics.pushupGoal)} in 1 min</span>
          <span>Goal Plank: {formatSeconds(goalMetrics.plankGoalSeconds)}</span>
        </div>
      </header>

      <main className="layout">
        <aside className="day-list">
          <h2>Program Calendar</h2>
          {program.map((item) => (
            <button
              key={item.day}
              type="button"
              className={`day-chip ${item.day === selectedDay ? 'active' : ''}`}
              onClick={() => setSelectedDay(item.day)}
            >
              <span>Day {item.day}</span>
              <small>{item.title}</small>
            </button>
          ))}
        </aside>

        <section className="day-details">
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
            <h3>Target Goals (Day 60)</h3>
            <div className="field-grid">
              <label>
                Row 2k goal time
                <input
                  value={goals.row2kGoal}
                  onChange={(event) => updateGoal('row2kGoal', event.target.value)}
                  placeholder="e.g. 7:00"
                />
              </label>
              <label>
                Push-up goal (in 1 minute)
                <input
                  value={goals.pushupGoal}
                  onChange={(event) => updateGoal('pushupGoal', event.target.value)}
                  placeholder="e.g. 60"
                />
              </label>
              <label>
                Plank goal time
                <input
                  value={goals.plankGoal}
                  onChange={(event) => updateGoal('plankGoal', event.target.value)}
                  placeholder="e.g. 3:20"
                />
              </label>
            </div>

            <h3>Daily Log</h3>
            <div className="field-grid">
              <label>
                Row time / distance
                <input
                  value={selectedLog.row || ''}
                  onChange={(event) => updateLog('row', event.target.value)}
                  placeholder="e.g. 2k in 08:14"
                />
              </label>
              <label>
                Push-up result
                <input
                  value={selectedLog.pushups || ''}
                  onChange={(event) => updateLog('pushups', event.target.value)}
                  placeholder="e.g. 5x22"
                />
              </label>
              <label>
                Plank result
                <input
                  value={selectedLog.plank || ''}
                  onChange={(event) => updateLog('plank', event.target.value)}
                  placeholder="e.g. 3x75s"
                />
              </label>
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

          <div className="card safety">
            <h3>Warm-up, Recovery, and Scaling</h3>
            <ul>
              <li>Warm up 10-15 min and cool down 5-10 min every session.</li>
              <li>Deload for a week if fatigue persists or performance drops.</li>
              <li>Push-up scaling: incline to knee to full strict reps.</li>
              <li>Plank scaling: shorter sets or knee plank while maintaining position quality.</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
