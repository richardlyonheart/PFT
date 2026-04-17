import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'workout-tracker-v1'
const GOALS_KEY = 'workout-goals-v1'
const CONFIG_KEY = 'workout-config-v1'
const ACTIVE_PROFILE_KEY = 'workout-active-profile-v1'
const MIN_PROGRAM_DAYS = 30
const MAX_PROGRAM_DAYS = 360
const DEFAULT_PROGRAM_DAYS = 60
const DEFAULT_PROFILE = 'default'
const NSW_PROFILE = 'nsw26'
const TRX_PROFILE = 'trx'

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

const workoutGoalInputs = {
  row2k: { field: 'row2kGoal', label: 'Row 2k goal time', placeholder: 'e.g. 7:00' },
  pushups: { field: 'pushupGoal', label: 'Push-up goal (in 1 minute)', placeholder: 'e.g. 60' },
  plank: { field: 'plankGoal', label: 'Plank goal time', placeholder: 'e.g. 3:20' },
  run15: { field: 'run15Goal', label: '1.5 mile run goal time', placeholder: 'e.g. 11:20' },
  swim450m: { field: 'swim450mGoal', label: '450m swim goal time', placeholder: 'e.g. 8:45' },
  swim500y: { field: 'swim500yGoal', label: '500 yard swim goal time', placeholder: 'e.g. 9:25' }
}

const nswGoalInputs = [
  { field: 'run15Goal', label: '1.5 mile run goal time', placeholder: 'e.g. 9:45' },
  { field: 'swim500yGoal', label: '500 yard swim goal time', placeholder: 'e.g. 8:50' },
  { field: 'pushupGoal', label: 'Push-up goal (max strict reps)', placeholder: 'e.g. 85' },
  { field: 'situpGoal', label: 'Sit-up goal (max reps)', placeholder: 'e.g. 90' },
  { field: 'pullupGoal', label: 'Pull-up goal (max strict reps)', placeholder: 'e.g. 18' }
]

const defaultWorkoutSelection = {
  row2k: true,
  pushups: true,
  plank: true,
  run15: false,
  swim450m: false,
  swim500y: false
}

const weekDayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const NSW_TOTAL_WEEKS = 26
const NSW_INTERVAL_CHART = [
  { min: 480, max: 510, runRepeat: '1:16-1:21', runRecovery: '2:32-3:23', swimRepeat: '1:34-1:40', swimRecovery: '3:08-4:10' },
  { min: 510, max: 540, runRepeat: '1:21-1:26', runRecovery: '2:42-3:35', swimRepeat: '1:40-1:46', swimRecovery: '3:20-4:25' },
  { min: 540, max: 570, runRepeat: '1:26-1:31', runRecovery: '2:52-3:48', swimRepeat: '1:46-1:52', swimRecovery: '3:32-4:40' },
  { min: 570, max: 600, runRepeat: '1:31-1:36', runRecovery: '3:02-4:00', swimRepeat: '1:52-1:58', swimRecovery: '3:44-4:55' },
  { min: 600, max: 630, runRepeat: '1:36-1:41', runRecovery: '3:12-4:13', swimRepeat: '1:58-2:04', swimRecovery: '3:56-5:10' },
  { min: 630, max: 660, runRepeat: '1:41-1:46', runRecovery: '3:22-4:25', swimRepeat: '2:04-2:10', swimRecovery: '4:08-5:25' },
  { min: 660, max: 690, runRepeat: '1:46-1:51', runRecovery: '3:32-4:38', swimRepeat: '2:10-2:16', swimRecovery: '4:20-5:40' },
  { min: 690, max: 720, runRepeat: '1:51-1:56', runRecovery: '3:42-4:50', swimRepeat: '2:16-2:22', swimRecovery: '4:32-5:55' },
  { min: 720, max: 750, runRepeat: '1:56-2:01', runRecovery: '3:52-5:03', swimRepeat: '2:22-2:28', swimRecovery: '4:44-6:10' },
  { min: 750, max: 780, runRepeat: '2:01-2:06', runRecovery: '4:02-5:15', swimRepeat: '2:28-2:34', swimRecovery: '4:56-6:25' },
  { min: 780, max: 810, runRepeat: '2:06-2:11', runRecovery: '4:12-5:28', swimRepeat: '2:34-2:40', swimRecovery: '5:08-6:40' },
  { min: 810, max: 840, runRepeat: '2:11-2:16', runRecovery: '4:22-5:40', swimRepeat: '2:40-2:46', swimRecovery: '5:20-6:55' },
  { min: 840, max: 870, runRepeat: '2:16-2:21', runRecovery: '4:32-5:53', swimRepeat: '2:46-2:52', swimRecovery: '5:32-7:10' },
  { min: 870, max: 900, runRepeat: '2:21-2:26', runRecovery: '4:42-6:05', swimRepeat: '2:52-2:58', swimRecovery: '5:44-7:25' },
  { min: 900, max: 930, runRepeat: '2:26-2:31', runRecovery: '4:52-6:18', swimRepeat: '2:58-3:04', swimRecovery: '5:56-7:40' },
  { min: 930, max: 960, runRepeat: '2:31-2:36', runRecovery: '5:02-6:30', swimRepeat: '3:04-3:10', swimRecovery: '6:08-7:55' }
]

function getNswChiPrescription(week) {
  if (week <= 2) return '15 min continuous at 90-95% effort'
  if (week <= 4) return '16 min continuous at 90-95% effort'
  if (week <= 6) return '17 min continuous at 90-95% effort'
  if (week <= 8) return '18 min continuous at 90-95% effort'
  if (week <= 10) return '19 min continuous at 90-95% effort'
  if (week <= 12) return '20 min continuous at 90-95% effort'
  if (week <= 15) return '2 x 12 min at 90-95% effort (6 min easy between)'
  if (week <= 18) return '2 x 14 min at 90-95% effort (7 min easy between)'
  if (week <= 21) return '2 x 16 min at 90-95% effort (8 min easy between)'
  if (week <= 24) return '2 x 18 min at 90-95% effort (9 min easy between)'
  return '2 x 20 min at 90-95% effort (10 min easy between)'
}

function getNswIntervalReps(week) {
  if (week <= 2) return 4
  if (week <= 4) return 5
  if (week <= 6) return 6
  if (week <= 8) return 7
  if (week <= 10) return 8
  if (week <= 12) return 9
  return 10
}

function getNswStrengthPrescription(week) {
  if (week <= 12) return 'Strength split + core; calisthenics from Table 2 progression (single-set strength focus)'
  if (week <= 15) return 'Strength split + core; push/sit/pull at 2 x 12 work sets'
  if (week <= 18) return 'Strength split + core; push/sit/pull at 2 x 14 work sets'
  if (week <= 21) return 'Strength split + core; push/sit/pull at 2 x 16 work sets'
  if (week <= 24) return 'Strength split + core; push/sit/pull at 2 x 18 work sets'
  return 'Strength split + core; push/sit/pull at 2 x 20 work sets'
}

function getNswWeekPlan(weekInput) {
  const week = clamp(Number(weekInput) || 1, 1, NSW_TOTAL_WEEKS)
  const runLsdMiles = Number((3 + (week - 1) * 0.25).toFixed(2))
  const swimLsdYards = 1000 + (week - 1) * 100
  const intervalReps = getNswIntervalReps(week)
  const chiPrescription = getNswChiPrescription(week)
  const strengthPrescription = getNswStrengthPrescription(week)

  return {
    week,
    runLsdMiles,
    swimLsdYards,
    runIntReps: intervalReps,
    swimIntReps: intervalReps,
    runChi: chiPrescription,
    swimChi: chiPrescription,
    strength: strengthPrescription
  }
}

function getNswCoreProgression(weekInput) {
  const week = clamp(Number(weekInput) || 1, 1, NSW_TOTAL_WEEKS)
  if (week <= 6) {
    return [
      'Bridge: 2 x 20 alternating reps',
      'Plank: 2 x 30s',
      'Side plank: 2 x 30s each side',
      'Bird dog: 2 x 20 alternating reps',
      'Superman: 2 x 10 reps',
      'Wipers: 2 x 20 reps'
    ]
  }
  if (week <= 11) {
    return [
      'Bridge: 2 x 25 alternating reps',
      'Plank: 2 x 45s',
      'Side plank: 2 x 40s each side',
      'Bird dog: 2 x 25 alternating reps',
      'Superman: 3 x 8 reps',
      'Wipers: 2 x 25 reps'
    ]
  }
  if (week <= 16) {
    return [
      'Bridge: 3 x 20 alternating reps',
      'Plank: 3 x 40s',
      'Side plank: 2 x 45s each side',
      'Bird dog: 3 x 20 alternating reps',
      'Superman: 2 x 12 reps',
      'Wipers: 3 x 20 reps'
    ]
  }
  if (week <= 21) {
    return [
      'Bridge: 3 x 25 alternating reps',
      'Plank: 3 x 50s',
      'Side plank: 2 x 50s each side',
      'Bird dog: 3 x 25 alternating reps',
      'Superman: 3 x 10 reps',
      'Wipers: 3 x 25 reps'
    ]
  }
  return [
    'Bridge: 3 x 30 alternating reps',
    'Plank: 3 x 60s',
    'Side plank: 2 x 60s each side',
    'Bird dog: 3 x 30 alternating reps',
    'Superman: 3 x 12 reps',
    'Wipers: 3 x 30 reps'
  ]
}

function getNswCalisthenicsExamples() {
  return [
    'Push-up/sit-up example (if max <40): 5-6 sets of 10-15 reps',
    'Push-up/sit-up example (if max 60-80): 4-5 sets of 20-25 reps',
    'Pull-up example (if max 6-9): 4-5 sets of 4-5 reps',
    'Pull-up example (if max >15): 3-4 sets of 10-12 reps',
    'Use strict PST technique and include one max set weekly'
  ]
}

function getNswPhaseName(week) {
  if (week <= 6) return 'NSW Foundation'
  if (week <= 12) return 'NSW Build'
  if (week <= 18) return 'NSW Intensification'
  if (week <= 24) return 'NSW Peak'
  return 'NSW Sharpen'
}

function isNswCalisthenicsDay(dayName) {
  return ['Tuesday', 'Thursday', 'Friday', 'Saturday'].includes(dayName)
}

function isNswCoreDay(dayName) {
  return ['Tuesday', 'Thursday', 'Friday', 'Saturday'].includes(dayName)
}

function getNswSupportRoutineFocus(week, dayName) {
  if (!['Tuesday', 'Thursday'].includes(dayName)) {
    return 'both'
  }

  // Alternate support focus on lift+swim days to avoid excessive overlap.
  return week % 2 === 0 ? 'calisthenics' : 'core'
}

function getNswPushSitChart(maxInput) {
  const max = Number(maxInput) || 0
  if (max < 40) return { sets: '5-6', reps: '10-15', total: '50-90' }
  if (max <= 60) return { sets: '4-5', reps: '15-20', total: '60-100' }
  if (max <= 80) return { sets: '4-5', reps: '20-25', total: '80-125' }
  if (max <= 100) return { sets: '3-4', reps: '30-40', total: '90-160' }
  return { sets: '3-4', reps: '40-50', total: '120-200' }
}

function getNswPullChart(maxInput) {
  const max = Number(maxInput) || 0
  if (max < 6) return { sets: '5-6', reps: '2-3', total: '10-18' }
  if (max <= 9) return { sets: '4-5', reps: '4-5', total: '16-25' }
  if (max <= 12) return { sets: '4-5', reps: '5-6', total: '20-30' }
  if (max <= 15) return { sets: '3-4', reps: '8-10', total: '24-40' }
  return { sets: '3-4', reps: '10-12', total: '30-48' }
}

function getNswIntervalChartRecommendation(runInput, swimInput) {
  const runSeconds = parseTimeToSeconds(runInput)
  const swimSeconds = parseTimeToSeconds(swimInput)
  const runRow = runSeconds ? NSW_INTERVAL_CHART.find((row) => runSeconds >= row.min && runSeconds <= row.max) : null
  const swimRow = swimSeconds ? NSW_INTERVAL_CHART.find((row) => swimSeconds >= row.min && swimSeconds <= row.max) : null

  return {
    runRow,
    swimRow,
    runSupportedRange: '8:00-16:00',
    swimSupportedRange: '8:00-16:00'
  }
}

function getNswDayCalculatedTargets(plan, chartTargets) {
  if (!plan?.week || plan.week < 1) {
    return []
  }

  const lines = []
  const addLine = (text, source = '') => {
    lines.push({ text, source })
  }
  const coreLines = getNswCoreProgression(plan.week)
  const pushChart = chartTargets?.pushChart
  const sitChart = chartTargets?.sitChart
  const pullChart = chartTargets?.pullChart
  const runRow = chartTargets?.intervalChart?.runRow
  const swimRow = chartTargets?.intervalChart?.swimRow
  const calDay = isNswCalisthenicsDay(plan.dayName)
  const coreDay = isNswCoreDay(plan.dayName)
  const supportFocus = getNswSupportRoutineFocus(plan.week, plan.dayName)

  if (plan.dayName === 'Monday') {
    addLine('Run LSD uses talk-test effort: conversational pace for prescribed distance', 'LSD')
    addLine('Lift block: upper-body strength split (single-set 8-12 reps)', 'Table 5')
    return lines
  }

  if (plan.dayName === 'Tuesday') {
    addLine('Swim CHI target: 90-95% sustained effort, use active recovery if split sets are used', 'CHI')
    addLine('Lift block: lower-body strength split (single-set 8-12 reps)', 'Table 5')
    addLine(`Support routine focus: ${supportFocus === 'calisthenics' ? 'Calisthenics (Table 2)' : 'Core (Table 3)'} on this lift day`, 'Table 5')
    if (supportFocus === 'calisthenics') {
      if (pushChart) addLine(`Push-ups: ${pushChart.sets} sets x ${pushChart.reps} reps (total ${pushChart.total})`, 'Table 2')
      if (sitChart) addLine(`Sit-ups: ${sitChart.sets} sets x ${sitChart.reps} reps (total ${sitChart.total})`, 'Table 2')
      if (pullChart) addLine(`Pull-ups: ${pullChart.sets} sets x ${pullChart.reps} reps (total ${pullChart.total})`, 'Table 2')
    }
    if (supportFocus === 'core' && coreDay) coreLines.forEach((line) => addLine(`Core block: ${line}`, 'Table 3'))
    return lines
  }

  if (plan.dayName === 'Wednesday') {
    if (runRow) {
      addLine(`Run INT pace: 400m repeats at ${runRow.runRepeat}`, 'Table 1')
      addLine(`Run INT recovery: ${runRow.runRecovery} active recovery`, 'Table 1')
    } else {
      addLine('Run INT chart requires 1.5-mile baseline between 8:00 and 16:00', 'Table 1')
    }
    addLine('Lift block: upper-body strength split (single-set 8-12 reps)', 'Table 5')
    return lines
  }

  if (plan.dayName === 'Thursday') {
    addLine('Swim LSD target: steady conversational effort for prescribed yards', 'LSD')
    addLine('Lift block: lower-body strength split (single-set 8-12 reps)', 'Table 5')
    addLine(`Support routine focus: ${supportFocus === 'calisthenics' ? 'Calisthenics (Table 2)' : 'Core (Table 3)'} on this lift day`, 'Table 5')
    if (supportFocus === 'calisthenics') {
      if (calDay && pushChart) addLine(`Push-ups: ${pushChart.sets} x ${pushChart.reps}`, 'Table 2')
      if (calDay && sitChart) addLine(`Sit-ups: ${sitChart.sets} x ${sitChart.reps}`, 'Table 2')
      if (calDay && pullChart) addLine(`Pull-ups: ${pullChart.sets} x ${pullChart.reps}`, 'Table 2')
    }
    if (supportFocus === 'core' && coreDay) coreLines.forEach((line) => addLine(`Core block: ${line}`, 'Table 3'))
    return lines
  }

  if (plan.dayName === 'Friday') {
    addLine('Run CHI target: sustained 90-95% effort with controlled form', 'CHI')
    if (calDay && pushChart) addLine(`Push-ups: ${pushChart.sets} x ${pushChart.reps}`, 'Table 2')
    if (calDay && sitChart) addLine(`Sit-ups: ${sitChart.sets} x ${sitChart.reps}`, 'Table 2')
    if (calDay && pullChart) addLine(`Pull-ups: ${pullChart.sets} x ${pullChart.reps}`, 'Table 2')
    if (coreDay) coreLines.forEach((line) => addLine(`Core block: ${line}`, 'Table 3'))
    return lines
  }

  if (plan.dayName === 'Saturday') {
    if (swimRow) {
      addLine(`Swim INT pace: 100y repeats at ${swimRow.swimRepeat}`, 'Table 1')
      addLine(`Swim INT recovery: ${swimRow.swimRecovery} active recovery`, 'Table 1')
    } else {
      addLine('Swim INT chart requires 500y baseline between 8:00 and 16:00', 'Table 1')
    }
    if (calDay && pushChart) addLine(`Push-ups: ${pushChart.sets} x ${pushChart.reps}`, 'Table 2')
    if (calDay && sitChart) addLine(`Sit-ups: ${sitChart.sets} x ${sitChart.reps}`, 'Table 2')
    if (calDay && pullChart) addLine(`Pull-ups: ${pullChart.sets} x ${pullChart.reps}`, 'Table 2')
    if (coreDay) coreLines.forEach((line) => addLine(`Core block: ${line}`, 'Table 3'))
    return lines
  }

  addLine('Recovery day: mobility and flexibility only', 'Recovery')
  return lines
}

const exerciseDescriptions = {
  'Run LSD': 'Long Slow Distance run at low to moderate effort using the talk test. You should be able to speak in short phrases while moving continuously.',
  'Swim LSD': 'Long Slow Distance swim at low to moderate effort. Focus on smooth rhythm and continuous movement while maintaining form.',
  'Run CHI': 'Continuous High Intensity run for 15-20 minutes (or split repeats later) at about 90-95% of maximal sustainable pace.',
  'Swim CHI': 'Continuous High Intensity swim for 15-20 minutes (or split repeats later) at about 90-95% of maximal sustainable pace.',
  'Run Intervals': 'Perform 400m repeats with active recovery at 2x-2.5x work time. Pace should be slightly faster than base pace from 1.5-mile time.',
  'Swim Intervals': 'Perform 100y repeats with active recovery at 2x-2.5x work time. Pace should be slightly faster than base pace from 500y time.',
  'Push-up': 'Start in front-leaning rest with feet together and body straight from head to heels. Lower as one unit until elbows are at right angle, then press up as one unit.',
  'Sit-up': 'Lie with knees bent and heels near glutes, arms across chest. Curl up until elbows touch thighs below knees, then lower until shoulder blades touch floor.',
  'Pull-up': 'Begin in dead hang with overhand grip. Pull until chin reaches bar height, then lower under control to full arm extension without kipping.',
  'Bridge': 'From supine bent-knee position, raise hips to straight line from knees to shoulders. Alternate single-leg support while keeping pelvis level.',
  'Plank': 'Support body on forearms and toes with straight line from heels to shoulders. Hold by bracing core without letting hips sag or pike.',
  'Side Plank': 'Support body on one forearm with straight spine and stacked hips. Keep hips from dropping and hold each side for prescribed time.',
  'Bird Dog': 'From hands-and-knees, extend opposite arm and leg to horizontal while keeping torso stable and hips level; alternate sides.',
  'Superman': 'Lying prone, lift both arms and feet slightly off floor while keeping limbs straight, hold briefly, then relax and repeat.',
  'Wipers': 'Lying on back with legs raised to 90 degrees, rotate legs side-to-side in a windshield-wiper arc while keeping shoulders on floor.',
  'Lat Pull-Down': 'Upper-body pulling movement used in strength sessions to build lats and pull-up support strength.',
  'Shoulder Press': 'Overhead pressing movement used for upper-body strength and shoulder stability.',
  'Biceps Curl': 'Elbow flexion strength movement used to support pulling endurance.',
  'Bench Press': 'Horizontal pressing movement used to build chest, shoulder, and triceps strength.',
  'Incline Press': 'Inclined pressing variation emphasizing upper chest and shoulder pressing strength.',
  'Seated Row': 'Horizontal pull movement targeting upper back and posture muscles.',
  'Deltoid Lateral Raise': 'Raise arms laterally to shoulder height to develop deltoid strength and shoulder control.',
  'Upright Row': 'Vertical pulling movement for shoulder girdle and upper-back strength.',
  'Triceps Extension': 'Elbow extension movement for triceps strength used in pressing endurance.',
  'Dips': 'Bodyweight pressing movement emphasizing triceps, chest, and shoulder stability.',
  'Lunges': 'Single-leg lower-body strength movement improving leg drive and stability.',
  'Leg Curl': 'Hamstring-focused movement for posterior-chain support and knee balance.',
  'Back Hyperextension': 'Posterior-chain and spinal-extensor strengthening movement used in lower-body routines.',
  'Deadlift': 'Hip-hinge strength movement for glutes, hamstrings, and back integrity.',
  'Leg Press': 'Lower-body strength movement for quads and glutes with controlled loading.',
  'Squat': 'Foundational lower-body strength movement for hips, quads, and trunk control.',
  'Heel Raise': 'Calf-strength movement supporting running and swimming propulsion mechanics.',
  'Flexibility': 'Daily post-cardio stretching while tissues are warm to maintain mobility and reduce injury risk.',
  'Warm-up': 'Gradual 5-15 minute prep increasing heart rate and breathing, including short bursts before high-intensity sessions.',
  'Cool-down': 'Easy movement after training until breathing and heart rate return closer to resting levels.'
}

const exerciseKeywordMap = [
  { key: 'Run LSD', patterns: ['run lsd', 'long slow distance run'] },
  { key: 'Swim LSD', patterns: ['swim lsd', 'long slow distance swim'] },
  { key: 'Run CHI', patterns: ['run chi'] },
  { key: 'Swim CHI', patterns: ['swim chi'] },
  { key: 'Run Intervals', patterns: ['run interval', '400m'] },
  { key: 'Swim Intervals', patterns: ['swim interval', '100y'] },
  { key: 'Push-up', patterns: ['push-up', 'pushups', 'push ups'] },
  { key: 'Sit-up', patterns: ['sit-up', 'situps', 'sit ups'] },
  { key: 'Pull-up', patterns: ['pull-up', 'pullups', 'pull ups'] },
  { key: 'Bridge', patterns: ['bridge'] },
  { key: 'Plank', patterns: ['plank'] },
  { key: 'Side Plank', patterns: ['side plank'] },
  { key: 'Bird Dog', patterns: ['bird dog'] },
  { key: 'Superman', patterns: ['superman'] },
  { key: 'Wipers', patterns: ['wipers', 'windshield'] },
  { key: 'Lat Pull-Down', patterns: ['lat pull-down', 'lat pull down'] },
  { key: 'Shoulder Press', patterns: ['shoulder press', 'military press'] },
  { key: 'Biceps Curl', patterns: ['biceps curl'] },
  { key: 'Bench Press', patterns: ['bench press'] },
  { key: 'Incline Press', patterns: ['incline press'] },
  { key: 'Seated Row', patterns: ['seated row'] },
  { key: 'Deltoid Lateral Raise', patterns: ['lateral raise', 'deltoid lateral raise'] },
  { key: 'Upright Row', patterns: ['upright row'] },
  { key: 'Triceps Extension', patterns: ['triceps extension'] },
  { key: 'Dips', patterns: ['dips'] },
  { key: 'Lunges', patterns: ['lunges'] },
  { key: 'Leg Curl', patterns: ['leg curl'] },
  { key: 'Back Hyperextension', patterns: ['back hyperextension'] },
  { key: 'Deadlift', patterns: ['deadlift'] },
  { key: 'Leg Press', patterns: ['leg press'] },
  { key: 'Squat', patterns: ['squat'] },
  { key: 'Heel Raise', patterns: ['heel raise'] },
  { key: 'Warm-up', patterns: ['warm-up', 'warm up'] },
  { key: 'Cool-down', patterns: ['cool-down', 'cool down'] },
  { key: 'Flexibility', patterns: ['flexibility', 'stretching'] }
]

function getExercisesForPlan(plan) {
  if (!plan) {
    return []
  }

  const textPool = [plan.title, ...(plan.workouts || []), ...(plan.notes || [])]
    .join(' ')
    .toLowerCase()

  const found = exerciseKeywordMap
    .filter((entry) => entry.patterns.some((pattern) => textPool.includes(pattern)))
    .map((entry) => entry.key)

  return Array.from(new Set(found))
}

function parseDurationFromText(text, fallbackSeconds = 90) {
  const value = String(text || '').toLowerCase()
  const minMatch = value.match(/(\d+)\s*min/)
  if (minMatch) {
    return Math.max(30, Number(minMatch[1]) * 60)
  }

  const secMatch = value.match(/(\d+)\s*s(?![a-z])/)
  if (secMatch) {
    return Math.max(20, Number(secMatch[1]))
  }

  const repMatch = value.match(/(\d+)\s*x\s*(\d+)/)
  if (repMatch) {
    return Math.max(45, Number(repMatch[1]) * 75)
  }

  return fallbackSeconds
}

function getNswSessionSteps(plan) {
  if (!plan) {
    return []
  }

  const labels = [
    ...(plan.amSession || []),
    ...(plan.pmSession || []),
    ...(plan.workouts || [])
  ]

  const uniqueLabels = Array.from(new Set(labels))
  return uniqueLabels.map((label) => {
    const lower = String(label).toLowerCase()
    return {
      label,
      seconds: parseDurationFromText(label, lower.includes('flexibility') ? 8 * 60 : 90),
      type: lower.includes('recovery') ? 'rest' : lower.includes('warm-up') ? 'warmup' : lower.includes('cool-down') ? 'cooldown' : 'work',
      pace: '',
      intensity: lower.includes('chi') || lower.includes('interval') ? 'hard' : lower.includes('lsd') ? 'easy' : 'moderate',
      isSwim: lower.includes('swim')
    }
  })
}

function getNswDaySession(weekInput, dayName) {
  const week = clamp(Number(weekInput) || 1, 1, NSW_TOTAL_WEEKS)
  const weekPlan = getNswWeekPlan(week)
  const coreProgression = getNswCoreProgression(week)
  const calExamples = getNswCalisthenicsExamples()
  const supportFocus = getNswSupportRoutineFocus(week, dayName)
  const coreBlock = [
    `Bridge: ${coreProgression[0].split(': ')[1]}`,
    `Plank: ${coreProgression[1].split(': ')[1]}`,
    `Side plank: ${coreProgression[2].split(': ')[1]}`,
    `Bird dog: ${coreProgression[3].split(': ')[1]}`,
    `Superman: ${coreProgression[4].split(': ')[1]}`,
    `Wipers: ${coreProgression[5].split(': ')[1]}`
  ]

  if (dayName === 'Monday') {
    return {
      title: 'Run LSD + Upper Lift',
      amSession: [
        'Upper-body lift split (single-set 8-12 reps per movement)'
      ],
      pmSession: [
        `Run LSD: ${weekPlan.runLsdMiles} miles at easy-moderate talk-test pace`,
        'Flexibility: post-run stretching routine'
      ],
      workouts: [
        `Run LSD: ${weekPlan.runLsdMiles} miles at easy-moderate talk-test pace`,
        'Warm-up: 5-10 min easy jog, gradually build',
        'Cool-down: easy jog/walk until breathing normalizes',
        'Lift (upper): single sets of 8-12 reps per movement, move station-to-station briskly',
        'Upper lift menu: lat pull-down, shoulder press, biceps curl, bench/incline press, seated row, lateral raise, upright row, triceps extension or dips',
        'Flexibility: post-cardio stretching routine'
      ],
      notes: [
        'Table 5 pattern: Monday run LSD with upper-body lift',
        'PDF guideline: build toward comfortably running 5-6 miles without stopping'
      ]
    }
  }

  if (dayName === 'Tuesday') {
    const supportBlock = supportFocus === 'calisthenics'
      ? [
        'Calisthenics block (focus day): push-ups, sit-ups, pull-ups with strict PST form',
        ...calExamples.slice(0, 3)
      ]
      : [
        'Core block (focus day): complete full Table 3 progression set',
        ...coreBlock
      ]

    return {
      title: 'Swim CHI + Lower Lift + Cal/Core',
      amSession: [
        'Lower-body lift split (single-set 8-12 reps)',
        `Support routine (choose one): ${supportFocus === 'calisthenics' ? 'Calisthenics' : 'Core'}`
      ],
      pmSession: [
        `Swim CHI: ${weekPlan.swimChi}`,
        'Flexibility: post-swim stretching routine'
      ],
      workouts: [
        `Swim CHI: ${weekPlan.swimChi}`,
        'Intensity should feel 8-9 out of 10, demanding but controlled',
        'Lift (lower): lunges, leg curl, back hyperextension, deadlift, leg press or squat, heel raise',
        ...supportBlock,
        'Flexibility: post-swim stretching routine'
      ],
      notes: [
        'Table 5 pattern: Tuesday swim CHI with lower-body lift and support work',
        'Avoid over-exercising: on lift days, keep support work to one routine focus',
        'Example swim CHI: 2 x 12 min hard with 6 min easy stroke recovery (mid/late cycle)',
        ...calExamples.slice(0, 3)
      ]
    }
  }

  if (dayName === 'Wednesday') {
    return {
      title: 'Run Intervals + Upper Lift',
      amSession: [
        'Upper-body lift split (single-set 8-12 reps per movement)'
      ],
      pmSession: [
        `Run intervals: ${weekPlan.runIntReps} x 400m`,
        'Flexibility: post-run stretching routine'
      ],
      workouts: [
        `Run intervals: ${weekPlan.runIntReps} x 400m`,
        'Work pace: about 4s faster than your current 400m base pace from 1.5-mile time',
        'Recovery between intervals: 2x to 2.5x work interval time, active recovery only',
        'Warm-up 10-15 min including 4-5 short high-intensity bursts',
        'Lift (upper): single sets of 8-12 reps per movement with push/pull balance',
        'Upper lift menu: lat pull-down, shoulder press, biceps curl, bench/incline press, seated row, lateral raise, upright row, triceps extension or dips',
        'Cool-down and flexibility: continue until heart rate and breathing are near baseline'
      ],
      notes: [
        'Table 5 pattern: Wednesday run INT with upper-body lift',
        'Example interval progression: begin at 4 reps and build toward 10 reps',
        'Advanced variation every 4th/5th week: 16-20 x 220y repeats'
      ]
    }
  }

  if (dayName === 'Thursday') {
    const supportBlock = supportFocus === 'calisthenics'
      ? [
        'Calisthenics block (focus day): push-ups, sit-ups, pull-ups with strict PST form',
        ...calExamples.slice(3)
      ]
      : [
        'Core block (focus day): complete full Table 3 progression set',
        ...coreBlock
      ]

    return {
      title: 'Swim LSD + Lower Lift + Cal/Core',
      amSession: [
        'Lower-body lift split (single-set 8-12 reps)',
        `Support routine (choose one): ${supportFocus === 'calisthenics' ? 'Calisthenics' : 'Core'}`
      ],
      pmSession: [
        `Swim LSD: ${weekPlan.swimLsdYards} yards continuous`,
        'Flexibility: post-swim stretching routine'
      ],
      workouts: [
        `Swim LSD: ${weekPlan.swimLsdYards} yards continuous`,
        'Easy-moderate pace using talk-test equivalent effort and smooth breathing rhythm',
        'Lift (lower): lunges, leg curl, back hyperextension, deadlift, leg press or squat, heel raise',
        ...supportBlock,
        'Flexibility: post-swim stretching routine'
      ],
      notes: [
        'Table 5 pattern: Thursday swim LSD with lower-body lift and support work',
        'Avoid over-exercising: on lift days, keep support work to one routine focus',
        'PDF guideline: build toward comfortably swimming 1-1.25 miles without stopping',
        ...calExamples.slice(3)
      ]
    }
  }

  if (dayName === 'Friday') {
    return {
      title: 'Run CHI + Cal/Core',
      amSession: [
        'Calisthenics block: push-ups, sit-ups, pull-ups',
        'Core block: full Table 3 progression set'
      ],
      pmSession: [
        `Run CHI: ${weekPlan.runChi}`,
        'Flexibility: post-run stretching routine'
      ],
      workouts: [
        `Run CHI: ${weekPlan.runChi}`,
        'Intensity should feel 8-9 out of 10 with controlled form',
        'If split into repeats, use active recovery at about half work duration',
        'Calisthenics block: push-ups, sit-ups, pull-ups with strict PST form',
        ...coreBlock,
        'Flexibility: post-run stretching routine'
      ],
      notes: [
        'Table 5 pattern: Friday run CHI with calisthenics/core support',
        'Example run CHI: 15-20 min continuous hard effort early cycle'
      ]
    }
  }

  if (dayName === 'Saturday') {
    return {
      title: 'Swim Intervals + Cal/Core',
      amSession: [
        'Calisthenics block: push-ups, sit-ups, pull-ups',
        'Core block: full Table 3 progression set'
      ],
      pmSession: [
        `Swim intervals: ${weekPlan.swimIntReps} x 100y`,
        'Flexibility: post-swim stretching routine'
      ],
      workouts: [
        `Swim intervals: ${weekPlan.swimIntReps} x 100y`,
        'Work pace: about 2s faster than your current 100y base pace from 500y time',
        'Recovery between reps: 2x to 2.5x work interval time, keep moving easy',
        'Calisthenics block: push-ups, sit-ups, pull-ups with strict PST form',
        ...coreBlock,
        'Flexibility: post-swim stretching routine'
      ],
      notes: [
        'Table 5 pattern: Saturday swim INT with calisthenics/core support',
        'Example advanced variation: 16-20 x 50y intervals every 4th/5th week',
        'Track fastest and slowest interval and minimize pacing drift'
      ]
    }
  }

  return {
    title: 'Recovery + Flexibility',
    amSession: [
      'Optional mobility circuit and recovery breathing'
    ],
    pmSession: [
      'Flexibility and easy recovery movement only'
    ],
    workouts: [
      'Active recovery only: easy walk, mobility, and tissue care',
      'Daily flexibility emphasis and movement quality work',
      'No high-intensity training'
    ],
    notes: [
      'Recovery quality drives adaptation for next week',
      'Hydration, sleep, and nutrition check-in'
    ]
  }
}

function buildNswProgram() {
  const plan = [
    {
      day: 0,
      phase: 'NSW Prep',
      week: 0,
      dayName: 'Prep Day',
      title: 'NSW Program Setup + PST Baseline',
      workouts: [
        'Run baseline: 1.5-mile time trial to set interval pace references',
        'Swim baseline: 500-yard time trial to set interval pace references',
        'Baseline calisthenics: strict max push-ups, sit-ups, and pull-ups',
        'Review weekly structure: Mon run LSD, Tue swim CHI, Wed run INT, Thu swim LSD, Fri run CHI, Sat swim INT, Sun recovery'
      ],
      notes: [
        'Use this baseline to personalize interval pace targets in the NSW tab calculator',
        'Consult a physician before beginning strenuous training if needed'
      ]
    }
  ]

  for (let day = 1; day <= 182; day += 1) {
    const week = Math.ceil(day / 7)
    const dayName = weekDayNames[(day - 1) % 7]
    const session = getNswDaySession(week, dayName)

    plan.push({
      day,
      phase: getNswPhaseName(week),
      week,
      dayName,
      title: session.title,
      workouts: session.workouts,
      notes: session.notes
    })
  }

  return plan
}

function buildTrxProgram() {
  const plan = [
    {
      day: 0,
      phase: 'TRX Prep',
      week: 0,
      dayName: 'Prep Day',
      title: 'TRX Program Setup + Baseline',
      workouts: [
        'TRX setup: Ensure straps are properly anchored and adjusted',
        'Bodyweight assessment: Test basic movements without TRX',
        'Mobility check: Assess shoulder and core mobility',
        'Review program structure and safety guidelines'
      ],
      notes: [
        'Start with shorter strap lengths for beginners',
        'Focus on proper form over weight/resistance',
        'Consult a physician before beginning if you have shoulder issues'
      ]
    }
  ]

  // Use the TRX program generator with default settings (core focus, 28 days)
  const trxDays = getTrxProgramDays('core', 28)
  
  trxDays.forEach(dayData => {
    plan.push({
      day: dayData.day,
      phase: dayData.phase,
      week: dayData.week,
      dayName: dayData.dayName,
      title: dayData.title,
      workouts: dayData.workouts,
      exercises: dayData.exercises,
      notes: []
    })
  })

  return plan
}

// TRX Exercise Catalog
const trxExercises = {
  core: [
    { id: 'trx-plank', name: 'TRX Plank', difficulty: 'intermediate', duration: '30-60 sec', rest: '60 sec' },
    { id: 'trx-pike', name: 'TRX Pike', difficulty: 'advanced', duration: '8-15 reps', rest: '60 sec' },
    { id: 'trx-crunch', name: 'TRX Crunch', difficulty: 'intermediate', duration: '10-20 reps', rest: '45 sec' },
    { id: 'trx-side-plank', name: 'TRX Side Plank', difficulty: 'intermediate', duration: '20-40 sec', rest: '45 sec' },
    { id: 'trx-fallout', name: 'TRX Fallout', difficulty: 'advanced', duration: '8-12 reps', rest: '60 sec' },
    { id: 'trx-body-saw', name: 'TRX Body Saw', difficulty: 'advanced', duration: '10-20 reps', rest: '60 sec' }
  ],
  chest: [
    { id: 'trx-push-up', name: 'TRX Push-up', difficulty: 'beginner', duration: '8-15 reps', rest: '60 sec' },
    { id: 'trx-chest-press', name: 'TRX Chest Press', difficulty: 'beginner', duration: '10-15 reps', rest: '60 sec' },
    { id: 'trx-atomic-push-up', name: 'TRX Atomic Push-up', difficulty: 'advanced', duration: '5-10 reps', rest: '90 sec' },
    { id: 'trx-wide-chest-press', name: 'TRX Wide Chest Press', difficulty: 'intermediate', duration: '8-12 reps', rest: '60 sec' }
  ],
  back: [
    { id: 'trx-row', name: 'TRX Row', difficulty: 'beginner', duration: '8-15 reps', rest: '60 sec' },
    { id: 'trx-face-pull', name: 'TRX Face Pull', difficulty: 'beginner', duration: '12-18 reps', rest: '45 sec' },
    { id: 'trx-low-row', name: 'TRX Low Row', difficulty: 'intermediate', duration: '10-15 reps', rest: '60 sec' },
    { id: 'trx-high-row', name: 'TRX High Row', difficulty: 'beginner', duration: '10-15 reps', rest: '60 sec' },
    { id: 'trx-suspension-pull', name: 'TRX Suspension Pull', difficulty: 'advanced', duration: '5-12 reps', rest: '90 sec' }
  ],
  legs: [
    { id: 'trx-squat', name: 'TRX Assisted Squat', difficulty: 'beginner', duration: '12-18 reps', rest: '60 sec' },
    { id: 'trx-lunge', name: 'TRX Lunge', difficulty: 'intermediate', duration: '10-12 reps', rest: '60 sec' },
    { id: 'trx-single-leg-squat', name: 'TRX Single Leg Squat', difficulty: 'advanced', duration: '6-10 reps', rest: '90 sec' },
    { id: 'trx-hamstring-curl', name: 'TRX Hamstring Curl', difficulty: 'intermediate', duration: '10-15 reps', rest: '60 sec' },
    { id: 'trx-bridge', name: 'TRX Bridge', difficulty: 'beginner', duration: '10-15 reps', rest: '45 sec' },
    { id: 'trx-lateral-lunge', name: 'TRX Lateral Lunge', difficulty: 'intermediate', duration: '8-12 reps', rest: '60 sec' }
  ],
  arms: [
    { id: 'trx-bicep-curl', name: 'TRX Bicep Curl', difficulty: 'intermediate', duration: '10-15 reps', rest: '60 sec' },
    { id: 'trx-tricep-extension', name: 'TRX Tricep Extension', difficulty: 'intermediate', duration: '8-12 reps', rest: '60 sec' },
    { id: 'trx-overhead-extension', name: 'TRX Overhead Extension', difficulty: 'intermediate', duration: '10-15 reps', rest: '60 sec' },
    { id: 'trx-atomic-bicep', name: 'TRX Atomic Bicep', difficulty: 'advanced', duration: '6-10 reps', rest: '90 sec' }
  ],
  shoulders: [
    { id: 'trx-y-fly', name: 'TRX Y-Fly', difficulty: 'beginner', duration: '12-18 reps', rest: '45 sec' },
    { id: 'trx-w-raise', name: 'TRX W-Raise', difficulty: 'intermediate', duration: '10-15 reps', rest: '60 sec' },
    { id: 'trx-lateral-raise', name: 'TRX Lateral Raise', difficulty: 'intermediate', duration: '10-15 reps', rest: '60 sec' },
    { id: 'trx-reverse-fly', name: 'TRX Reverse Fly', difficulty: 'beginner', duration: '12-18 reps', rest: '45 sec' }
  ]
}

// TRX Program Templates
function getTrxProgramDays(programType, duration) {
  const days = []
  const durationWeeks = Math.floor(duration / 7)
  
  for (let day = 1; day <= duration; day++) {
    const week = Math.ceil(day / 7)
    const dayOfWeek = (day - 1) % 7
    const dayName = weekDayNames[dayOfWeek]
    
    let focus = ''
    let exercises = []
    let workouts = []
    
    // Generate weekly split based on program type
    switch(programType) {
      case 'full-body':
        focus = 'Full Body'
        exercises = [
          ...trxExercises.core.slice(0, 1),
          ...trxExercises.chest.slice(0, 1),
          ...trxExercises.back.slice(0, 1),
          ...trxExercises.legs.slice(0, 1)
        ]
        workouts = [
          `Warm-up: 5-10 min light cardio + mobility`,
          `${exercises[0].name}: ${exercises[0].duration}`,
          `${exercises[1].name}: ${exercises[1].duration}`,
          `${exercises[2].name}: ${exercises[2].duration}`,
          `${exercises[3].name}: ${exercises[3].duration}`,
          `Active recovery: walking or easy stretching`
        ]
        break
        
      case 'upper':
        if (dayOfWeek === 0 || dayOfWeek === 3) { // Monday/Thursday - Chest/Back
          focus = 'Upper Body Power'
          exercises = [
            ...trxExercises.core.slice(0, 1),
            ...trxExercises.chest.slice(0, 2)
          ]
        } else if (dayOfWeek === 2 || dayOfWeek === 5) { // Wednesday/Saturday - Back/Arms
          focus = 'Upper Body Strength'
          exercises = [
            ...trxExercises.back.slice(1, 3),
            ...trxExercises.arms.slice(0, 2)
          ]
        } else {
          focus = 'Active Recovery'
          exercises = []
        }
        workouts = exercises.length > 0 
          ? [
              `Warm-up: 5-10 min preparation`,
              ...exercises.slice(0, 3).map(ex => `${ex.name}: ${ex.duration}`),
              `Cool-down: stretching and recovery`
            ]
          : [`Light mobility work and stretching - active recovery day`]
        break
        
      case 'core':
        if (dayOfWeek === 0 || dayOfWeek === 2 || dayOfWeek === 4) { // Mon/Wed/Fri
          focus = 'Core Focus'
          exercises = [
            ...trxExercises.core.slice(0, 3)
          ]
          workouts = [
            `Warm-up: dynamic mobility`,
            ...exercises.map(ex => `${ex.name}: ${exercises.difficulty === 'advanced' ? 3 : 3} sets of ${ex.duration}`),
            `Cool-down: static stretching`
          ]
        } else {
          focus = 'Upper Body Focus'
          exercises = [
            ...trxExercises.chest.slice(0, 1),
            ...trxExercises.back.slice(0, 1),
            ...trxExercises.shoulders.slice(0, 1)
          ]
          workouts = [
            `Warm-up preparation`,
            ...exercises.map(ex => `${ex.name}: ${ex.duration}`),
            `Mobility cool-down`
          ]
        }
        break
        
      case 'leg':
        if (dayOfWeek === 1 || dayOfWeek === 4) { // Tues/Friday
          focus = 'Leg Focus'
          exercises = [
            ...trxExercises.core.slice(0, 1),
            ...trxExercises.legs.slice(0, 3)
          ]
          workouts = [
            `Warm-up: 10 min dynamic prep`,
            ...exercises.map(ex => `${ex.name}: ${ex.duration}`),
            `Finisher: 5 min easy row or walk`,
            `Cool-down stretch`
          ]
        } else if (dayOfWeek === 3) {
          focus = 'Upper Body Support'
          exercises = [...trxExercises.back.slice(0, 2), ...trxExercises.arms.slice(0, 2)]
          workouts = [
            `Warm-up mobility`,
            ...exercises.map(ex => `${ex.name}: ${ex.duration}`),
            `Cool-down`
          ]
        } else {
          focus = 'Active Recovery'
          exercises = []
          workouts = [`Light walking, stretching, or foam rolling`]
        }
        break
        
      case 'arm':
        if (dayOfWeek === 0 || dayOfWeek === 3) { // Mon/Thurs
          focus = 'Arm Focus'
          exercises = [
            ...trxExercises.arms.slice(0, 4)
          ]
          workouts = [
            `Warm-up: shoulder mobility`,
            ...exercises.slice(0, 3).map(ex => `${ex.name}: ${ex.difficulty === 'advanced' ? 3 : 3} sets of ${ex.duration}`),
            `Finisher: light stretching`
          ]
        } else if (dayOfWeek === 2 || dayOfWeek === 5) {
          focus = 'Push/Pull Balance'
          exercises = [
            ...trxExercises.chest.slice(0, 1),
            ...trxExercises.back.slice(0, 1),
            ...trxExercises.core.slice(0, 1)
          ]
          workouts = [
            `Warm-up`,
            ...exercises.map(ex => `${ex.name}: ${ex.duration}`),
            `Cool-down`
          ]
        } else {
          focus = 'Active Recovery'
          exercises = []
          workouts = [`Mobility and stretching`]
        }
        break
        
      case 'back':
        if (dayOfWeek === 1 || dayOfWeek === 4) { // Tues/Friday
          focus = 'Back Focus'
          exercises = [
            ...trxExercises.back.slice(0, 4)
          ]
          workouts = [
            `Warm-up`,
            ...exercises.slice(0, 3).map(ex => `${ex.name}: ${ex.difficulty === 'advanced' ? 3 : 3} sets of ${ex.duration}`),
            `Cool-down stretch`
          ]
        } else if (dayOfWeek === 0 || dayOfWeek === 3) {
          focus = 'Chest & Shoulders'
          exercises = [
            ...trxExercises.chest.slice(0, 2),
            ...trxExercises.shoulders.slice(0, 2)
          ]
          workouts = [
            `Preparation`,
            ...exercises.slice(0, 3).map(ex => `${ex.name}: ${ex.duration}`),
            `Recovery`
          ]
        } else {
          focus = 'Active Recovery'
          exercises = []
          workouts = [`Easy movement and stretching`]
        }
        break
        
      default:
        focus = 'Rest Day'
        workouts = [`Active recovery: light movement and flexibility work`]
    }
    
    const phase = week <= durationWeeks * 0.25 ? 'Foundation' 
                : week <= durationWeeks * 0.5 ? 'Build'
                : week <= durationWeeks * 0.75 ? 'Strength'
                : 'Peak'
    
    days.push({
      day,
      week,
      dayName,
      title: focus,
      phase,
      workouts,
      exercises: exercises.slice(0, 3) // Keep top 3 for display
    })
  }
  
  return days
}

function getProfileStorageKey(baseKey, profileId) {
  return profileId === DEFAULT_PROFILE ? baseKey : `${baseKey}-${profileId}`
}

function getStoredJsonValue(key, fallbackValue) {
  const raw = localStorage.getItem(key)
  if (!raw) {
    return fallbackValue
  }

  try {
    return JSON.parse(raw)
  } catch {
    return fallbackValue
  }
}

function getDefaultGoalsState() {
  return {
    row2kGoal: '7:00',
    pushupGoal: '60',
    situpGoal: '75',
    pullupGoal: '15',
    plankGoal: '3:20',
    run15Goal: '11:20',
    swim450mGoal: '8:45',
    swim500yGoal: '9:25'
  }
}

function getProfileSnapshot(profileId) {
  const profileStorageKey = getProfileStorageKey(STORAGE_KEY, profileId)
  const profileGoalsKey = getProfileStorageKey(GOALS_KEY, profileId)
  const profileConfigKey = getProfileStorageKey(CONFIG_KEY, profileId)

  const logs = getStoredJsonValue(profileStorageKey, {})
  const goals = getStoredJsonValue(profileGoalsKey, getDefaultGoalsState())
  const config = normalizeProgramConfig(getStoredJsonValue(profileConfigKey, {
    programDays: profileId === NSW_PROFILE ? 182 : profileId === TRX_PROFILE ? 28 : DEFAULT_PROGRAM_DAYS,
    selectedWorkouts: defaultWorkoutSelection
  }))

  let selectedDay = config.programDays
  for (let i = 0; i <= MAX_PROGRAM_DAYS; i += 1) {
    if (!logs[i]?.complete) {
      selectedDay = i
      break
    }
  }

  return {
    logs,
    goals,
    config,
    selectedDay: clamp(selectedDay, 0, config.programDays)
  }
}

function getPstIntervalTargets(runInput, swimInput) {
  const runSeconds = parseTimeToSeconds(runInput)
  const swimSeconds = parseTimeToSeconds(swimInput)

  const runQuarterBase = runSeconds ? runSeconds / 6 : null
  const runQuarterTarget = runQuarterBase ? Math.max(30, runQuarterBase - 4) : null
  const runRecoveryLow = runQuarterTarget ? runQuarterTarget * 2 : null
  const runRecoveryHigh = runQuarterTarget ? runQuarterTarget * 2.5 : null

  const swim100Base = swimSeconds ? swimSeconds / 5 : null
  const swim100Target = swim100Base ? Math.max(35, swim100Base - 2) : null
  const swimRecoveryLow = swim100Target ? swim100Target * 2 : null
  const swimRecoveryHigh = swim100Target ? swim100Target * 2.5 : null

  return {
    runQuarterBase,
    runQuarterTarget,
    runRecoveryLow,
    runRecoveryHigh,
    swim100Base,
    swim100Target,
    swimRecoveryLow,
    swimRecoveryHigh
  }
}

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
    lines.push('Cooldown: 5-10 min easy')
    return lines
  }

  if (dayName === 'Tuesday') {
    if (has('pushups')) lines.push('Push-ups: 5 sets at 60-70% max, 90s rest')
    if (has('plank')) lines.push('Plank: 4 sets at 50-70% max hold, 60s rest')
    if (has('run15')) lines.push('Optional easy cardio flush: 15-20 min')
    return lines
  }

  if (dayName === 'Wednesday') {
    if (has('swim450m') || has('swim500y')) {
      lines.push('Swim warm-up: 5 min easy')
      lines.push('Technique drills: 4x50 form focus')
      lines.push('Sustained swim: 20-35 min moderate pace')
      lines.push('Cool-down: 5 min easy swim')
      return lines
    }
    if (has('row2k')) lines.push('Row steady 30-45 min at conversational effort (RPE 5-6)')
    if (has('run15')) lines.push('Steady run 20-35 min at conversational effort')
    return lines
  }

  if (dayName === 'Thursday') {
    if (has('pushups')) lines.push('Push-up pyramid progression with reduced weekly rest')
    if (has('plank')) lines.push('Plank ladder progression with strict form')
    if (has('row2k') || has('run15')) lines.push('Finish with 10-15 min easy cardio')
    return lines
  }

  if (dayName === 'Friday') {
    if (has('row2k')) lines.push('Row: 10-12x1 min hard with 1 min rest')
    if (has('run15')) lines.push('Run: 10x1 min fast with 1 min easy jog')
    if (has('plank')) lines.push('Plank: 3 hard holds, stop before failure')
    return lines
  }

  if (dayName === 'Saturday') {
    if (has('swim450m') || has('swim500y')) {
      lines.push('Swim warm-up: 5 min easy')
      lines.push('Long endurance swim: 25-45 min easy, focus on breathing rhythm')
      lines.push('Cool-down: 5 min easy swim')
      return lines
    }
    if (has('row2k')) lines.push('Long easy row 45-75 min')
    if (has('run15')) lines.push('Long easy run 25-60 min')
    return lines
  }

  lines.push('Active recovery: mobility, walking, and foam rolling')
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

function formatStopwatch(elapsedMs) {
  const safeMs = Math.max(0, Number(elapsedMs) || 0)
  const totalSeconds = Math.floor(safeMs / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const centiseconds = Math.floor((safeMs % 1000) / 10)

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`
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
  const run15Seconds = parseTimeToSeconds(baseline.run15)
  const swim450mSeconds = parseTimeToSeconds(baseline.swim450m)
  const swim500ySeconds = parseTimeToSeconds(baseline.swim500y)

  const fallback = {
    row2kSeconds: 540,
    pushupMax: 20,
    plankMaxSeconds: 60,
    run15Seconds: 13 * 60,
    swim450mSeconds: 10 * 60,
    swim500ySeconds: 10 * 60
  }

  return {
    row2kSeconds: row2kSeconds || fallback.row2kSeconds,
    pushupMax: pushupMax || fallback.pushupMax,
    plankMaxSeconds: plankMaxSeconds || fallback.plankMaxSeconds,
    run15Seconds: run15Seconds || fallback.run15Seconds,
    swim450mSeconds: swim450mSeconds || fallback.swim450mSeconds,
    swim500ySeconds: swim500ySeconds || fallback.swim500ySeconds,
    hasRow2kBaseline: Boolean(row2kSeconds),
    hasPushupBaseline: Boolean(pushupMax),
    hasPlankBaseline: Boolean(plankMaxSeconds),
    hasRun15Baseline: Boolean(run15Seconds),
    hasSwim450mBaseline: Boolean(swim450mSeconds),
    hasSwim500yBaseline: Boolean(swim500ySeconds)
  }
}

function getGoals(goalInputs, baseline) {
  const row2kGoalSeconds = parseTimeToSeconds(goalInputs.row2kGoal)
  const pushupGoal = parseFirstNumber(goalInputs.pushupGoal)
  const plankGoalSeconds = parseTimeToSeconds(goalInputs.plankGoal)
  const run15GoalSeconds = parseTimeToSeconds(goalInputs.run15Goal)
  const swim450mGoalSeconds = parseTimeToSeconds(goalInputs.swim450mGoal)
  const swim500yGoalSeconds = parseTimeToSeconds(goalInputs.swim500yGoal)

  return {
    row2kGoalSeconds: row2kGoalSeconds || Math.round(baseline.row2kSeconds * 0.93),
    pushupGoal: pushupGoal || Math.round(baseline.pushupMax + 20),
    plankGoalSeconds: plankGoalSeconds || Math.round(baseline.plankMaxSeconds + 45),
    run15GoalSeconds: run15GoalSeconds || Math.round(baseline.run15Seconds * 0.94),
    swim450mGoalSeconds: swim450mGoalSeconds || Math.round(baseline.swim450mSeconds * 0.94),
    swim500yGoalSeconds: swim500yGoalSeconds || Math.round(baseline.swim500ySeconds * 0.94)
  }
}

function getDailyPrescription(plan, baseline, goals, config) {
  const totalDays = clamp(config?.programDays || DEFAULT_PROGRAM_DAYS, MIN_PROGRAM_DAYS, MAX_PROGRAM_DAYS)
  const selectedWorkouts = getSelectedWorkoutIds(config?.selectedWorkouts)
  const has = (id) => selectedWorkouts.includes(id)
  const hasSwim = has('swim450m') || has('swim500y')
  const cycleProgress = clamp(plan.day / totalDays, 0, 1)
  const current2kCapacity = baseline.row2kSeconds + (goals.row2kGoalSeconds - baseline.row2kSeconds) * cycleProgress
  const currentPushCapacity = baseline.pushupMax + (goals.pushupGoal - baseline.pushupMax) * cycleProgress
  const currentPlankCapacity = baseline.plankMaxSeconds + (goals.plankGoalSeconds - baseline.plankMaxSeconds) * cycleProgress

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
    if (has('run15')) retest.push(`1.5 mile run goal: ${formatSeconds(goals.run15GoalSeconds)} or faster`)
    if (has('swim450m')) retest.push(`450m swim goal: ${formatSeconds(goals.swim450mGoalSeconds)} or faster`)
    if (has('swim500y')) retest.push(`500 yard swim goal: ${formatSeconds(goals.swim500yGoalSeconds)} or faster`)
    if (has('pushups')) retest.push(`Push-up goal: ${Math.round(goals.pushupGoal)} strict reps in 1 minute`)
    if (has('plank')) retest.push(`Plank goal: ${formatSeconds(goals.plankGoalSeconds)} hold`)
    return retest
  }

  if (plan.phase === 'Taper') {
    if (hasSwim) {
      return [
        'Swim-only taper: 10-15 min easy swim with smooth strokes',
        'Optional: 2x50 relaxed technical pickups',
        'Hydrate, sleep well, and avoid hard efforts'
      ]
    }
    const taper = []
    if (has('row2k') || has('run15')) {
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
    if (has('run15')) lines.push('Optional easy cardio flush: 15-20 min')
  } else if (plan.dayName === 'Wednesday') {
    if (has('swim450m') || has('swim500y')) {
      const mainDuration = Math.min(35, Math.round(20 + (plan.week - 1) * 2))
      lines.push('Swim: 5 min easy warm-up, then technique drills (4x50)')
      lines.push(`Sustained swim: ${mainDuration} min at moderate effort`)
      lines.push('Cool-down: 5 min easy swim')
    } else {
      const duration = Math.min(45, Math.round(30 + (plan.week - 1) * 2))
      if (has('row2k')) {
        lines.push(`Row steady: ${duration} min`)
        lines.push(`Pace guide: ${formatSplit(baseSplit + 22)} to ${formatSplit(baseSplit + 30)}`)
      }
      if (has('run15')) lines.push(`Run steady: ${Math.max(20, duration - 5)} min at conversational effort`)
    }
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
    if (has('row2k') || has('run15')) lines.push('Finish with 10-15 min easy cardio')
  } else if (plan.dayName === 'Friday') {
    if (has('row2k')) {
      const reps = plan.week >= 7 ? 12 : 10
      lines.push(`Row: ${reps}x1 min hard with 1 min easy recovery`)
      lines.push(`Hard pace target: ${formatSplit(baseSplit - 2)} to ${formatSplit(baseSplit + 2)}`)
    }
    if (has('run15')) lines.push('Run speed: 10x1 min fast with 1 min easy')
    if (has('plank')) {
      const hold = Math.max(25, Math.round(currentPlankCapacity * (0.7 + weekBoost * 0.5)))
      lines.push(`Plank: 3 holds of ${hold}s (stop before form breaks)`)
    }
  } else if (plan.dayName === 'Saturday') {
    if (has('swim450m') || has('swim500y')) {
      const duration = Math.min(45, Math.round(25 + (plan.week - 1) * 3))
      lines.push(`Long easy swim: ${duration} min`)
      lines.push('Cool-down: 5 min easy swim, focus on breathing and stroke efficiency')
    } else {
      const duration = Math.min(75, Math.round(45 + (plan.week - 1) * 4))
      if (has('row2k')) {
        lines.push(`Long easy row: ${duration} min`)
        lines.push(`Pace guide: ${formatSplit(baseSplit + 24)} to ${formatSplit(baseSplit + 34)}`)
      }
      if (has('run15')) lines.push(`Long easy run: ${Math.max(25, duration - 15)} min`)
    }
  } else {
    lines.push('Active recovery: 20-40 min walk and mobility work')
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
      intensity: options.intensity || fallbackIntensity,
      isSwim: Boolean(options.isSwim)
    })
  }

  const totalDays = clamp(config?.programDays || DEFAULT_PROGRAM_DAYS, MIN_PROGRAM_DAYS, MAX_PROGRAM_DAYS)
  const selectedWorkouts = getSelectedWorkoutIds(config?.selectedWorkouts)
  const has = (id) => selectedWorkouts.includes(id)
  const hasSwim = has('swim450m') || has('swim500y')

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
      addStep('450m swim time trial', Math.round(swim450Base), 'test', { intensity: 'hard', isSwim: true })
      addStep('Pool deck recovery', 2 * 60, 'rest')
    }
    if (has('swim500y')) {
      addStep('500 yard swim time trial', Math.round(swim500yBase), 'test', { intensity: 'hard', isSwim: true })
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
      addStep(`1.5 mile run retest (goal ${formatSeconds(goals.run15GoalSeconds)})`, Math.round(goals.run15GoalSeconds), 'test', { intensity: 'hard' })
      addStep('Recovery walk', 3 * 60, 'rest')
    }
    if (has('swim450m')) {
      addStep(`450m swim retest (goal ${formatSeconds(goals.swim450mGoalSeconds)})`, Math.round(goals.swim450mGoalSeconds), 'test', { intensity: 'hard', isSwim: true })
      addStep('Pool deck recovery', 2 * 60, 'rest')
    }
    if (has('swim500y')) {
      addStep(`500 yard swim retest (goal ${formatSeconds(goals.swim500yGoalSeconds)})`, Math.round(goals.swim500yGoalSeconds), 'test', { intensity: 'hard', isSwim: true })
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
    if (hasSwim) {
      addStep('Swim-only taper session', 15 * 60, 'work', { isSwim: true, intensity: 'easy' })
      addStep('Optional relaxed pickups (2x50)', 2 * 60, 'work', { isSwim: true, intensity: 'moderate' })
      return steps
    }
    if (has('row2k') || has('run15')) {
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
    if (has('swim450m') || has('swim500y')) {
      const swimId = has('swim450m') ? 'swim450m' : 'swim500y'
      const swimBase = swimId === 'swim450m' ? swim450Base : swim500yBase
      const perLength = Math.max(40, Math.round(swimBase / (swimId === 'swim450m' ? 9 : 10)))
      const mainDuration = Math.min(35, Math.round(20 + (plan.week - 1) * 2))
      addStep('Warm-up easy swim', 5 * 60, 'warmup', { isSwim: true, intensity: 'easy' })
      addStep('Technique drills (4x50 form focus)', 4 * perLength, 'work', { isSwim: true, intensity: 'moderate' })
      addStep(`Sustained swim set (${mainDuration} min)`, mainDuration * 60, 'work', { isSwim: true, intensity: 'moderate' })
      addStep('Cool-down easy swim', 5 * 60, 'cooldown', { isSwim: true, intensity: 'easy' })
      return steps
    }
    const duration = Math.min(45, Math.round(30 + (plan.week - 1) * 2))
    if (has('row2k')) {
      addStep('Steady tempo row', duration * 60, 'work', {
        pace: `${formatSplit(baseSplit + 22)} to ${formatSplit(baseSplit + 30)}`,
        intensity: 'moderate'
      })
    }
    if (has('run15')) addStep('Steady run', Math.max(20, duration - 5) * 60, 'work', { intensity: 'moderate' })
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
    if (has('swim450m') || has('swim500y')) {
      const duration = Math.min(45, Math.round(25 + (plan.week - 1) * 3))
      addStep('Warm-up easy swim', 5 * 60, 'warmup', { isSwim: true, intensity: 'easy' })
      addStep(`Long endurance swim (${duration} min)`, duration * 60, 'work', { isSwim: true, intensity: 'easy' })
      addStep('Cool-down and breathing work', 5 * 60, 'cooldown', { isSwim: true, intensity: 'easy' })
      return steps
    }
    const duration = Math.min(75, Math.round(45 + (plan.week - 1) * 4))
    if (has('row2k')) {
      addStep('Long easy row', duration * 60, 'work', {
        pace: `${formatSplit(baseSplit + 24)} to ${formatSplit(baseSplit + 34)}`,
        intensity: 'easy'
      })
    }
    if (has('run15')) addStep('Long easy run', Math.max(25, duration - 15) * 60, 'work', { intensity: 'easy' })
    addStep('Cooldown breathing and mobility', 8 * 60, 'cooldown', { pace: easySplit, intensity: 'easy' })
    return steps
  }

  addStep('Active recovery (walk, mobility)', 30 * 60, 'work')
  return steps
}

function buildProgram(config) {
  const totalDays = clamp(config?.programDays || DEFAULT_PROGRAM_DAYS, MIN_PROGRAM_DAYS, MAX_PROGRAM_DAYS)
  const selectedWorkouts = getSelectedWorkoutIds(config?.selectedWorkouts)
  const hasSwim = selectedWorkouts.includes('swim450m') || selectedWorkouts.includes('swim500y')

  const baselineWorkouts = ['Warm up 10-15 min with easy cardio + dynamic mobility']
  if (selectedWorkouts.includes('row2k')) baselineWorkouts.push('Row: 2,000m all-out (record time + avg split)')
  if (selectedWorkouts.includes('run15')) baselineWorkouts.push('Run: 1.5 mile all-out (record total time)')
  if (selectedWorkouts.includes('swim450m')) baselineWorkouts.push('Swim: 450m all-out (record total time)')
  if (selectedWorkouts.includes('swim500y')) baselineWorkouts.push('Swim: 500 yard all-out (record total time)')
  if (selectedWorkouts.includes('pushups')) baselineWorkouts.push('Push-ups: max continuous strict reps')
  if (selectedWorkouts.includes('plank')) baselineWorkouts.push('Plank: forearm hold to technical failure')
  baselineWorkouts.push('Set SMART targets for retest day')

  const taperDayOneWorkouts = hasSwim
    ? ['Swim-only taper: 10-15 min easy swim', 'Optional: 2x50 relaxed technical pickups']
    : [
      'Cardio: 20-25 min easy',
      'Primer: 3x1 min moderate with full easy recovery',
      'Strength/core: 2-3 light submax sets'
    ]

  const finalRetestWorkouts = [
    'Repeat baseline protocol exactly',
    ...(selectedWorkouts.includes('row2k') ? ['Row: 2,000m all-out (compare time and split)'] : []),
    ...(selectedWorkouts.includes('run15') ? ['Run: 1.5 mile all-out (compare total time)'] : []),
    ...(selectedWorkouts.includes('swim450m') ? ['Swim: 450m all-out (compare time and splits)'] : []),
    ...(selectedWorkouts.includes('swim500y') ? ['Swim: 500 yard all-out (compare time and splits)'] : []),
    ...(selectedWorkouts.includes('pushups') ? ['Push-ups: max strict reps'] : []),
    ...(selectedWorkouts.includes('plank') ? ['Plank: forearm hold to technical failure'] : [])
  ]

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
      title: hasSwim && dayName === 'Wednesday' ? 'Swim: Technique Day'
        : hasSwim && dayName === 'Saturday' ? 'Swim: Endurance Day'
        : template.title,
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
      workouts: taperDayOneWorkouts
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
      workouts: finalRetestWorkouts
    }
  )

  return plan
}

function App() {
  const [activeProfile, setActiveProfile] = useState(() => localStorage.getItem(ACTIVE_PROFILE_KEY) || DEFAULT_PROFILE)
  const [programConfig, setProgramConfig] = useState(() => getProfileSnapshot(localStorage.getItem(ACTIVE_PROFILE_KEY) || DEFAULT_PROFILE).config)
  const nswProgramActive = activeProfile === NSW_PROFILE
  const trxProgramActive = activeProfile === TRX_PROFILE
  const program = useMemo(
    () => (nswProgramActive ? buildNswProgram() : trxProgramActive ? buildTrxProgram() : buildProgram(programConfig)),
    [nswProgramActive, trxProgramActive, programConfig]
  )
  const [selectedDay, setSelectedDay] = useState(() => getProfileSnapshot(localStorage.getItem(ACTIVE_PROFILE_KEY) || DEFAULT_PROFILE).selectedDay)
  const [activeTab, setActiveTab] = useState('day')
  const [nswWeek, setNswWeek] = useState(1)
  const [nswCalendarWeek, setNswCalendarWeek] = useState(1)
  const [nswOption, setNswOption] = useState('preview')
  const [trxProgramType, setTrxProgramType] = useState('core')
  const [trxDuration, setTrxDuration] = useState(28)
  const [selectedTrxDay, setSelectedTrxDay] = useState(1)
  const [logs, setLogs] = useState(() => getProfileSnapshot(localStorage.getItem(ACTIVE_PROFILE_KEY) || DEFAULT_PROFILE).logs)
  const [goals, setGoals] = useState(() => getProfileSnapshot(localStorage.getItem(ACTIVE_PROFILE_KEY) || DEFAULT_PROFILE).goals)
  const [pstInputs, setPstInputs] = useState({ run15: '', swim500y: '', pushups: '', situps: '', pullups: '' })
  const [selectedExercise, setSelectedExercise] = useState('')
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)
  const [firebaseApi, setFirebaseApi] = useState(null)
  const [cloudStatus, setCloudStatus] = useState('Checking cloud config...')
  const [cloudUid, setCloudUid] = useState('')
  const [cloudUserLabel, setCloudUserLabel] = useState('')
  const [guestMode, setGuestMode] = useState(false)
  const [authError, setAuthError] = useState('')
  const applyingRemoteRef = useRef(false)
  const lastCloudPayloadRef = useRef('')
  const wakeLockRef = useRef(null)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    localStorage.setItem(getProfileStorageKey(STORAGE_KEY, activeProfile), JSON.stringify(logs))
  }, [logs, activeProfile])

  useEffect(() => {
    localStorage.setItem(getProfileStorageKey(GOALS_KEY, activeProfile), JSON.stringify(goals))
  }, [goals, activeProfile])

  useEffect(() => {
    localStorage.setItem(getProfileStorageKey(CONFIG_KEY, activeProfile), JSON.stringify(programConfig))
  }, [programConfig, activeProfile])

  useEffect(() => {
    localStorage.setItem(ACTIVE_PROFILE_KEY, activeProfile)
    const snapshot = getProfileSnapshot(activeProfile)
    setLogs(snapshot.logs)
    setGoals(snapshot.goals)
    setProgramConfig(snapshot.config)
    setSelectedDay(snapshot.selectedDay)
  }, [activeProfile])

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

    const documentRef = firebaseApi.doc(firebaseApi.db, 'users', cloudUid, 'appData', `workoutTracker-${activeProfile}`)
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
  }, [cloudUid, firebaseApi, activeProfile])

  useEffect(() => {
    if (!firebaseApi?.db || !cloudUid || applyingRemoteRef.current) {
      return
    }

    const payload = JSON.stringify({ logs, goals, config: programConfig })
    if (payload === lastCloudPayloadRef.current) {
      return
    }

    lastCloudPayloadRef.current = payload
    const documentRef = firebaseApi.doc(firebaseApi.db, 'users', cloudUid, 'appData', `workoutTracker-${activeProfile}`)
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
  }, [logs, goals, programConfig, cloudUid, firebaseApi, activeProfile])

  const completeCount = Object.values(logs).filter((log) => log.complete).length
  const selectedPlan = program.find((item) => item.day === selectedDay) || program[program.length - 1]
  const selectedLog = logs[selectedDay] || {}
  const baseline = useMemo(() => getBaseline(logs), [logs])
  const goalMetrics = useMemo(() => getGoals(goals, baseline), [goals, baseline])
  const [sessionState, setSessionState] = useState({
    status: 'idle',
    stepIndex: 0,
    remaining: 0
  })
  const [stopwatchState, setStopwatchState] = useState({
    status: 'idle',
    elapsedMs: 0,
    startedAt: 0,
    laps: []
  })
  const [swimChecks, setSwimChecks] = useState([])
  const [programDaysInput, setProgramDaysInput] = useState(() => String(programConfig.programDays))
  const pstBaselinePushups = parseFirstNumber(pstInputs.pushups || logs[0]?.pushups || '')
  const pstBaselineSitups = parseFirstNumber(pstInputs.situps || logs[0]?.situps || '')
  const pstBaselinePullups = parseFirstNumber(pstInputs.pullups || logs[0]?.pullups || '')
  const nswWeekPlan = useMemo(() => getNswWeekPlan(nswWeek), [nswWeek])
  const nswCalendarPlan = useMemo(
    () => Array.from({ length: NSW_TOTAL_WEEKS }, (_, index) => getNswWeekPlan(index + 1)),
    []
  )
  const selectedNswCalendarWeek = nswCalendarPlan[nswCalendarWeek - 1] || nswCalendarPlan[0]
  const pstBaselineRun = pstInputs.run15 || logs[0]?.run15 || ''
  const pstBaselineSwim = pstInputs.swim500y || logs[0]?.swim500y || ''
  const pstTargets = useMemo(
    () => getPstIntervalTargets(pstBaselineRun, pstBaselineSwim),
    [pstBaselineRun, pstBaselineSwim]
  )
  const nswChartTargets = useMemo(
    () => ({
      intervalChart: getNswIntervalChartRecommendation(pstBaselineRun, pstBaselineSwim),
      pushChart: pstBaselinePushups ? getNswPushSitChart(pstBaselinePushups) : null,
      sitChart: pstBaselineSitups ? getNswPushSitChart(pstBaselineSitups) : null,
      pullChart: pstBaselinePullups ? getNswPullChart(pstBaselinePullups) : null
    }),
    [pstBaselineRun, pstBaselineSwim, pstBaselinePushups, pstBaselineSitups, pstBaselinePullups]
  )
  const sessionSteps = useMemo(
    () => (nswProgramActive
      ? getNswSessionSteps(selectedPlan)
      : getSessionSteps(selectedPlan, baseline, goalMetrics, logs, programConfig)),
    [nswProgramActive, selectedPlan, baseline, goalMetrics, logs, programConfig]
  )
  const dayTargets = useMemo(
    () => (nswProgramActive
      ? getNswDayCalculatedTargets(selectedPlan, nswChartTargets)
      : getDailyPrescription(selectedPlan, baseline, goalMetrics, programConfig)),
    [selectedPlan, nswChartTargets, baseline, goalMetrics, programConfig, nswProgramActive]
  )
  const trxProgram = useMemo(
    () => getTrxProgramDays(trxProgramType, trxDuration),
    [trxProgramType, trxDuration]
  )
  const selectedTrxPlan = trxProgram.find((item) => item.day === selectedTrxDay) || trxProgram[0] || {}
  const nswPlanApplied =
    activeProfile === NSW_PROFILE &&
    workoutEnabled(programConfig.selectedWorkouts, 'run15') &&
    workoutEnabled(programConfig.selectedWorkouts, 'swim500y')
  const currentStep = sessionSteps[sessionState.stepIndex]
  const workOrTestSteps = sessionSteps.filter((s) => s.type === 'work' || s.type === 'test')
  const isSwimDay = workOrTestSteps.length > 0 && workOrTestSteps.every((s) => s.isSwim)
  const isTestDay = selectedPlan.day === 0 || selectedPlan.day === programConfig.programDays
  const isChecklistDay = nswProgramActive || trxProgramActive || isSwimDay || isTestDay
  const activeWorkoutItems = workoutCatalog.filter((item) => workoutEnabled(programConfig.selectedWorkouts, item.id))
  const heroProgramTitle = activeProfile === NSW_PROFILE ? 'NSW Training Program' : activeProfile === TRX_PROFILE ? 'TRX Training Program' : 'PFT Training Program'
  const allPdfExercises = useMemo(() => Object.keys(exerciseDescriptions), [])
  const todaysExercises = useMemo(() => getExercisesForPlan(selectedPlan), [selectedPlan])
  const selectedExerciseDescription = selectedExercise ? exerciseDescriptions[selectedExercise] : ''
  const timerExercises = useMemo(() => {
    const fromPlan = getExercisesForPlan(selectedPlan)
    const fromSteps = sessionSteps
      .flatMap((step) => {
        const text = String(step.label || '').toLowerCase()
        return exerciseKeywordMap
          .filter((entry) => entry.patterns.some((pattern) => text.includes(pattern)))
          .map((entry) => entry.key)
      })

    // Add TRX exercises when TRX tab is active or TRX profile is active
    const trxExercises = (activeTab === 'trx' || trxProgramActive) ? 
      Object.values(trxExercises).flat().map(ex => ex.name) : []

    return Array.from(new Set([...fromPlan, ...fromSteps, ...trxExercises]))
  }, [selectedPlan, sessionSteps])
  const baselineCoverageByWorkout = {
    row2k: baseline.hasRow2kBaseline,
    pushups: baseline.hasPushupBaseline,
    plank: baseline.hasPlankBaseline,
    run15: baseline.hasRun15Baseline,
    swim450m: baseline.hasSwim450mBaseline,
    swim500y: baseline.hasSwim500yBaseline
  }
  const hasCompleteSelectedBaseline = activeWorkoutItems.every((item) => baselineCoverageByWorkout[item.id])

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

  const updateProgramDays = (rawValue) => {
    const parsed = Number.parseInt(String(rawValue), 10)

    if (Number.isNaN(parsed)) {
      setProgramDaysInput(String(programConfig.programDays))
      return
    }

    const normalizedDays = clamp(parsed, MIN_PROGRAM_DAYS, MAX_PROGRAM_DAYS)
    setProgramConfig((current) => normalizeProgramConfig({
      ...current,
      programDays: normalizedDays
    }))
    setProgramDaysInput(String(normalizedDays))
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

  const applyNsw26WeekProgram = () => {
    setActiveProfile(NSW_PROFILE)
    setProgramConfig(() => normalizeProgramConfig({
      programDays: 182,
      selectedWorkouts: {
        row2k: false,
        pushups: true,
        plank: true,
        run15: true,
        swim450m: false,
        swim500y: true
      }
    }))
    setSelectedDay(1)
    setActiveTab('calendar')
  }

  const switchProfile = (profileId) => {
    setActiveProfile(profileId)
  }

  const openExerciseGuideFor = (exerciseName) => {
    if (!exerciseName) {
      return
    }

    setSelectedExercise(exerciseName)
    setShowExerciseModal(true)
  }

  const toggleStopwatch = () => {
    setStopwatchState((current) => {
      if (current.status === 'running') {
        return {
          ...current,
          status: 'paused',
          elapsedMs: current.elapsedMs + (Date.now() - current.startedAt),
          startedAt: 0
        }
      }

      return {
        ...current,
        status: 'running',
        startedAt: Date.now()
      }
    })
  }

  const resetStopwatch = () => {
    setStopwatchState((current) => ({
      ...current,
      status: 'idle',
      elapsedMs: 0,
      startedAt: 0,
      laps: []
    }))
  }

  const captureStopwatchLap = () => {
    setStopwatchState((current) => {
      const liveElapsed = current.status === 'running'
        ? current.elapsedMs + (Date.now() - current.startedAt)
        : current.elapsedMs

      if (liveElapsed <= 0) {
        return current
      }

      return {
        ...current,
        laps: [...current.laps, liveElapsed]
      }
    })
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

  const toggleSwimCheck = (index) => {
    setSwimChecks((current) => {
      const updated = Array.from({ length: sessionSteps.length }, (_, i) => Boolean(current[i]))
      updated[index] = !updated[index]
      return updated
    })
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
    setSwimChecks([])
    setStopwatchState((current) => ({
      ...current,
      status: 'idle',
      elapsedMs: 0,
      startedAt: 0,
      laps: []
    }))
  }, [selectedDay])

  useEffect(() => {
    if (stopwatchState.status !== 'running') {
      return undefined
    }

    const stopwatchTick = setInterval(() => {
      setStopwatchState((current) => {
        if (current.status !== 'running') {
          return current
        }

        return {
          ...current,
          elapsedMs: current.elapsedMs,
          startedAt: current.startedAt
        }
      })
    }, 100)

    return () => clearInterval(stopwatchTick)
  }, [stopwatchState.status])

  useEffect(() => {
    let cancelled = false

    const releaseWakeLock = async () => {
      if (!wakeLockRef.current) {
        return
      }

      try {
        await wakeLockRef.current.release()
      } catch {
        // Ignore release errors from unsupported/expired locks.
      } finally {
        wakeLockRef.current = null
      }
    }

    const acquireWakeLock = async () => {
      if (
        cancelled ||
        typeof navigator === 'undefined' ||
        !('wakeLock' in navigator) ||
        stopwatchState.status !== 'running' ||
        document.visibilityState !== 'visible'
      ) {
        return
      }

      try {
        const lock = await navigator.wakeLock.request('screen')
        if (cancelled) {
          await lock.release()
          return
        }

        wakeLockRef.current = lock
        lock.addEventListener('release', () => {
          if (wakeLockRef.current === lock) {
            wakeLockRef.current = null
          }
        })
      } catch {
        // Some browsers/devices block wake lock; stopwatch still works without it.
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && stopwatchState.status === 'running') {
        acquireWakeLock()
      } else {
        releaseWakeLock()
      }
    }

    if (stopwatchState.status === 'running') {
      acquireWakeLock()
    } else {
      releaseWakeLock()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      releaseWakeLock()
    }
  }, [stopwatchState.status])

  useEffect(() => {
    const nextSelection = todaysExercises[0] || allPdfExercises[0] || ''
    setSelectedExercise((current) => {
      if (current && (todaysExercises.includes(current) || allPdfExercises.includes(current))) {
        return current
      }
      return nextSelection
    })
    setShowExerciseModal(false)
  }, [selectedDay, activeProfile, todaysExercises, allPdfExercises])

  useEffect(() => {
    setProgramDaysInput(String(programConfig.programDays))
  }, [programConfig.programDays])

  useEffect(() => {
    setPstInputs({
      run15: logs[0]?.run15 || '',
      swim500y: logs[0]?.swim500y || '',
      pushups: logs[0]?.pushups || '',
      situps: logs[0]?.situps || '',
      pullups: logs[0]?.pullups || ''
    })
  }, [activeProfile])

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

  useEffect(() => {
    if (sessionSteps.length === 0 || !isChecklistDay) {
      return
    }

    if (swimChecks.length > 0 && sessionSteps.every((_, i) => Boolean(swimChecks[i]))) {
      setLogs((current) => ({
        ...current,
        [selectedDay]: { ...current[selectedDay], complete: true }
      }))
    }
  }, [swimChecks, sessionSteps, selectedDay, isChecklistDay])

  const shouldHideHeroOnMobile = ['timer', 'nsw', 'nswCalendar', 'trx'].includes(activeTab) && isMobile

  return (
    <div className="app-shell">
      {!shouldHideHeroOnMobile && (
        <header className="hero-panel">
          <p className="eyebrow">{programConfig.programDays}-Day Performance Builder</p>
          <h1>{heroProgramTitle}</h1>
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
          <div className="goal-inline">
            <span>Profile: {activeProfile === NSW_PROFILE ? 'NSW 26-week slot' : activeProfile === TRX_PROFILE ? 'TRX Program slot' : 'Standard slot'}</span>
            <button type="button" className="hero-button" onClick={() => switchProfile(DEFAULT_PROFILE)}>
              Standard Profile
            </button>
            <button type="button" className="hero-button hero-button-alt" onClick={() => switchProfile(NSW_PROFILE)}>
              NSW Profile
            </button>
            <button type="button" className="hero-button hero-button-alt" onClick={() => switchProfile(TRX_PROFILE)}>
              TRX Profile
            </button>
          </div>
        </header>
      )}

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
                {!hasCompleteSelectedBaseline && selectedPlan.day > 0 && (
                  <p className="baseline-note">
                    Add Day 0 baseline values to personalize targets. Showing starter defaults until then.
                  </p>
                )}
                <ul>
                  {dayTargets.map((target, index) => (
                    <li key={index} className="target-item">
                      <span>{typeof target === 'string' ? target : target.text}</span>
                      {typeof target !== 'string' && target.source && (
                        <span className="target-source">{target.source}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              <ul>
                {selectedPlan.workouts.map((work, index) => (
                  <li key={index}>{work}</li>
                ))}
              </ul>

              {nswProgramActive && (selectedPlan.amSession?.length > 0 || selectedPlan.pmSession?.length > 0) && (
                <div className="am-pm-grid">
                  <div className="am-pm-card">
                    <h3>AM Session</h3>
                    <ul>
                      {(selectedPlan.amSession || []).map((item, index) => (
                        <li key={`am-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="am-pm-card">
                    <h3>PM Session</h3>
                    <ul>
                      {(selectedPlan.pmSession || []).map((item, index) => (
                        <li key={`pm-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              <div className="exercise-guide-row">
                <label className="exercise-select-label">
                  Exercise Guide
                  <select
                    value={selectedExercise}
                    onChange={(event) => setSelectedExercise(event.target.value)}
                  >
                    {todaysExercises.length > 0 && (
                      <optgroup label="Appears In This Day">
                        {todaysExercises.map((name) => (
                          <option key={`today-${name}`} value={name}>{name}</option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="All PDF Exercises">
                      {allPdfExercises.map((name) => (
                        <option key={`all-${name}`} value={name}>{name}</option>
                      ))}
                    </optgroup>
                  </select>
                </label>
                <button type="button" className="ghost-button" onClick={() => setShowExerciseModal(true)}>
                  Show Description
                </button>
              </div>

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
                {nswProgramActive && (
                  <>
                    <label>
                      Sit-up result
                      <input
                        value={selectedLog.situps || ''}
                        onChange={(event) => updateLog('situps', event.target.value)}
                        placeholder="e.g. 72"
                      />
                    </label>
                    <label>
                      Pull-up result
                      <input
                        value={selectedLog.pullups || ''}
                        onChange={(event) => updateLog('pullups', event.target.value)}
                        placeholder="e.g. 13"
                      />
                    </label>
                  </>
                )}
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
            {nswProgramActive ? (
              <>
                <div className="card tracker">
                  <h3>NSW Program Setup</h3>
                  <p className="subline">Profile-linked: NSW 26-week plan with 182 days and Table 5 scheduling.</p>
                  <ul>
                    <li>Primary cardio: Run LSD/CHI/INT and Swim LSD/CHI/INT</li>
                    <li>Strength split: Upper (Mon/Wed), Lower (Tue/Thu)</li>
                    <li>Support work: Calisthenics and core progression by day pattern</li>
                    <li>Flexibility: daily post-cardio routine</li>
                  </ul>
                </div>

                <div className="card tracker">
                  <h3>NSW Target Goals (Week 26)</h3>
                  <div className="field-grid">
                    {nswGoalInputs.map((goalInput) => (
                      <label key={goalInput.field}>
                        {goalInput.label}
                        <input
                          value={goals[goalInput.field] || ''}
                          onChange={(event) => updateGoal(goalInput.field, event.target.value)}
                          placeholder={goalInput.placeholder}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
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
                        value={programDaysInput}
                        onChange={(event) => setProgramDaysInput(event.target.value)}
                        onBlur={(event) => updateProgramDays(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter') {
                            updateProgramDays(event.currentTarget.value)
                            event.currentTarget.blur()
                          }
                        }}
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
                    {activeWorkoutItems.map((item) => {
                      const goalInput = workoutGoalInputs[item.id]
                      return (
                        <label key={item.id}>
                          {goalInput.label}
                          <input
                            value={goals[goalInput.field] || ''}
                            onChange={(event) => updateGoal(goalInput.field, event.target.value)}
                            placeholder={goalInput.placeholder}
                          />
                        </label>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

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
              <h3>Exercise Guide (Timer)</h3>
              <p className="subline">Select an exercise to open its PDF description.</p>
              <div className="exercise-guide-row">
                <label className="exercise-select-label">
                  Select exercise
                  <select
                    value={selectedExercise}
                    onChange={(event) => openExerciseGuideFor(event.target.value)}
                  >
                    {timerExercises.length > 0 && (
                      <optgroup label="Appears In This Timer Session">
                        {timerExercises.map((name) => (
                          <option key={`timer-${name}`} value={name}>{name}</option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="All PDF Exercises">
                      {allPdfExercises.map((name) => (
                        <option key={`timer-all-${name}`} value={name}>{name}</option>
                      ))}
                    </optgroup>
                  </select>
                </label>
                <button type="button" className="ghost-button" onClick={() => openExerciseGuideFor(selectedExercise)}>
                  Open Guide
                </button>
              </div>
            </div>

            <div className="card stopwatch-card">
              <h3>Stopwatch</h3>
              <p className="stopwatch-display">{formatStopwatch(stopwatchState.status === 'running' ? stopwatchState.elapsedMs + (Date.now() - stopwatchState.startedAt) : stopwatchState.elapsedMs)}</p>
              <div className="timer-actions">
                <button type="button" className="action-button" onClick={toggleStopwatch}>
                  {stopwatchState.status === 'running' ? 'Pause Stopwatch' : 'Start Stopwatch'}
                </button>
                <button type="button" className="ghost-button" onClick={captureStopwatchLap} disabled={stopwatchState.elapsedMs === 0 && stopwatchState.status !== 'running'}>
                  Lap
                </button>
                <button type="button" className="ghost-button" onClick={resetStopwatch}>
                  Reset
                </button>
              </div>
              {stopwatchState.laps.length > 0 && (
                <ul className="stopwatch-laps">
                  {stopwatchState.laps.map((lap, index) => (
                    <li key={`lap-${index}`}>
                      <span>Lap {index + 1}</span>
                      <strong>{formatStopwatch(lap)}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {isChecklistDay ? (
              <div className="card checklist-card">
                <h3>{nswProgramActive ? 'NSW Session Checklist' : trxProgramActive ? 'TRX Session Checklist' : isSwimDay ? 'Swim Session Checklist' : 'Test Day Checklist'}</h3>
                {sessionSteps.length > 0 && sessionSteps.every((_, i) => Boolean(swimChecks[i])) && (
                  <p className="timer-complete">Session complete. Day marked as done.</p>
                )}
                <ul className="swim-checklist">
                  {sessionSteps.map((step, index) => (
                    <li key={index} className={`checklist-item${swimChecks[index] ? ' checked' : ''} type-${step.type}${step.isSwim ? ' is-swim' : ''}`}>
                      <label>
                        <input
                          type="checkbox"
                          checked={Boolean(swimChecks[index])}
                          onChange={() => toggleSwimCheck(index)}
                        />
                        <span className="checklist-label">{step.label}</span>
                        <span className="checklist-time">
                          {step.isSwim ? `Target: ${formatSeconds(step.seconds)}` : formatSeconds(step.seconds)}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
                <p className="timer-progress">
                  {swimChecks.filter(Boolean).length} of {sessionSteps.length} steps done
                </p>
              </div>
            ) : (
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
            )}

          </div>
        )}

        {activeTab === 'nsw' && (
          <div className="day-details">
            <div className="card nsw-card">
              <h3>26-Week Plan Option</h3>
              <div className="nsw-option-row">
                <button
                  type="button"
                  className={`ghost-button ${nswOption === 'preview' ? 'active-pill' : ''}`}
                  onClick={() => setNswOption('preview')}
                >
                  Preview Only
                </button>
                <button
                  type="button"
                  className={`ghost-button ${nswOption === 'take26' ? 'active-pill' : ''}`}
                  onClick={() => setNswOption('take26')}
                >
                  Take 26-Week Program
                </button>
              </div>
              {nswOption === 'take26' && (
                <>
                  <p className="subline">
                    Applies a 182-day plan with run + swim + push-ups + plank selected.
                  </p>
                  <button type="button" className="action-button" onClick={applyNsw26WeekProgram}>
                    Apply NSW 26-Week Program
                  </button>
                  {nswPlanApplied && <p className="timer-complete">NSW 26-week config is active.</p>}
                </>
              )}
            </div>

            <div className="card nsw-card">
              <h3>PDF Chart Calculators (Table 1 + Table 2)</h3>
              <p className="subline">Enter baselines to compute chart-based training targets used in the NSW daily schedule.</p>
              <div className="field-grid">
                <label>
                  1.5 mile baseline
                  <input
                    value={pstInputs.run15}
                    onChange={(event) => setPstInputs((current) => ({ ...current, run15: event.target.value }))}
                    placeholder="e.g. 10:30"
                  />
                </label>
                <label>
                  500y swim baseline
                  <input
                    value={pstInputs.swim500y}
                    onChange={(event) => setPstInputs((current) => ({ ...current, swim500y: event.target.value }))}
                    placeholder="e.g. 10:30"
                  />
                </label>
                <label>
                  Push-up max baseline
                  <input
                    value={pstInputs.pushups}
                    onChange={(event) => setPstInputs((current) => ({ ...current, pushups: event.target.value }))}
                    placeholder="e.g. 62"
                  />
                </label>
                <label>
                  Sit-up max baseline
                  <input
                    value={pstInputs.situps}
                    onChange={(event) => setPstInputs((current) => ({ ...current, situps: event.target.value }))}
                    placeholder="e.g. 70"
                  />
                </label>
                <label>
                  Pull-up max baseline
                  <input
                    value={pstInputs.pullups}
                    onChange={(event) => setPstInputs((current) => ({ ...current, pullups: event.target.value }))}
                    placeholder="e.g. 12"
                  />
                </label>
              </div>
              <ul>
                <li>
                  Run 400m base pace: {pstTargets.runQuarterBase ? formatSeconds(pstTargets.runQuarterBase) : 'enter 1.5 mile time'}
                </li>
                <li>
                  Run Table 1 repeat pace: {nswChartTargets.intervalChart.runRow ? nswChartTargets.intervalChart.runRow.runRepeat : `enter 1.5 mile time (${nswChartTargets.intervalChart.runSupportedRange})`}
                </li>
                <li>
                  Run Table 1 recovery: {nswChartTargets.intervalChart.runRow ? nswChartTargets.intervalChart.runRow.runRecovery : `enter 1.5 mile time (${nswChartTargets.intervalChart.runSupportedRange})`}
                </li>
                <li>
                  Swim 100y base pace: {pstTargets.swim100Base ? formatSeconds(pstTargets.swim100Base) : 'enter 500y swim time'}
                </li>
                <li>
                  Swim Table 1 repeat pace: {nswChartTargets.intervalChart.swimRow ? nswChartTargets.intervalChart.swimRow.swimRepeat : `enter 500y swim time (${nswChartTargets.intervalChart.swimSupportedRange})`}
                </li>
                <li>
                  Swim Table 1 recovery: {nswChartTargets.intervalChart.swimRow ? nswChartTargets.intervalChart.swimRow.swimRecovery : `enter 500y swim time (${nswChartTargets.intervalChart.swimSupportedRange})`}
                </li>
                <li>
                  Push-ups Table 2: {nswChartTargets.pushChart ? `${nswChartTargets.pushChart.sets} sets x ${nswChartTargets.pushChart.reps} reps (total ${nswChartTargets.pushChart.total})` : 'enter push-up max'}
                </li>
                <li>
                  Sit-ups Table 2: {nswChartTargets.sitChart ? `${nswChartTargets.sitChart.sets} sets x ${nswChartTargets.sitChart.reps} reps (total ${nswChartTargets.sitChart.total})` : 'enter sit-up max'}
                </li>
                <li>
                  Pull-ups Table 2: {nswChartTargets.pullChart ? `${nswChartTargets.pullChart.sets} sets x ${nswChartTargets.pullChart.reps} reps (total ${nswChartTargets.pullChart.total})` : 'enter pull-up max'}
                </li>
              </ul>
            </div>

            <div className="card nsw-card">
              <h3>Weekly Breakdown (Week {nswWeekPlan.week})</h3>
              <label className="nsw-week-label">
                Select week (1-26)
                <input
                  type="range"
                  min="1"
                  max={String(NSW_TOTAL_WEEKS)}
                  value={nswWeekPlan.week}
                  onChange={(event) => setNswWeek(Number(event.target.value))}
                />
              </label>
              <ul>
                <li>Monday: Run LSD {nswWeekPlan.runLsdMiles} miles + upper body/core</li>
                <li>Tuesday: Swim CHI {nswWeekPlan.swimChi} + lower body + push/sit/pull</li>
                <li>Wednesday: Run intervals {nswWeekPlan.runIntReps} x 400m + core + push/sit/pull</li>
                <li>Thursday: Swim LSD {nswWeekPlan.swimLsdYards} yards + core + push/sit/pull</li>
                <li>Friday: Run CHI {nswWeekPlan.runChi} + upper body/core</li>
                <li>Saturday: Swim intervals {nswWeekPlan.swimIntReps} x 100y + lower body + push/sit/pull</li>
                <li>Sunday: Mobility, flexibility, and recovery only</li>
              </ul>
              <p className="subline">Strength/calisthenics focus this block: {nswWeekPlan.strength}</p>
            </div>
          </div>
        )}

        {activeTab === 'nswCalendar' && (
          <div className="day-details">
            <div className="card nsw-card">
              <h3>NSW 26-Week Calendar Mode</h3>
              <p className="subline">Dedicated week-based view for the full NSW schedule.</p>
              <div className="nsw-calendar-grid">
                {nswCalendarPlan.map((item) => (
                  <button
                    key={item.week}
                    type="button"
                    className={`day-chip ${item.week === selectedNswCalendarWeek.week ? 'active' : ''}`}
                    onClick={() => setNswCalendarWeek(item.week)}
                  >
                    <span>Week {item.week}</span>
                    <small>Run LSD {item.runLsdMiles} mi · Swim LSD {item.swimLsdYards} yd</small>
                  </button>
                ))}
              </div>
            </div>
            <div className="card nsw-card">
              <p className="phase-tag">Week {selectedNswCalendarWeek.week}</p>
              <h3>Weekly Session Plan</h3>
              <ul>
                <li>Monday: Run LSD {selectedNswCalendarWeek.runLsdMiles} miles + upper/core</li>
                <li>Tuesday: Swim CHI {selectedNswCalendarWeek.swimChi} + lower + push/sit/pull</li>
                <li>Wednesday: Run intervals {selectedNswCalendarWeek.runIntReps} x 400m + core + push/sit/pull</li>
                <li>Thursday: Swim LSD {selectedNswCalendarWeek.swimLsdYards} yards + core + push/sit/pull</li>
                <li>Friday: Run CHI {selectedNswCalendarWeek.runChi} + upper/core</li>
                <li>Saturday: Swim intervals {selectedNswCalendarWeek.swimIntReps} x 100y + lower + push/sit/pull</li>
                <li>Sunday: Recovery + flexibility only</li>
              </ul>
              <p className="subline">Calisthenics/strength progression: {selectedNswCalendarWeek.strength}</p>
            </div>
          </div>
        )}

        {activeTab === 'trx' && (
          <div className="day-details">
            <div className="card">
              <h3>Select Program Type</h3>
              <div className="field-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
                <label>
                  <input
                    type="radio"
                    name="trxType"
                    value="full-body"
                    checked={trxProgramType === 'full-body'}
                    onChange={(e) => setTrxProgramType(e.target.value)}
                  />
                  Full Body
                </label>
                <label>
                  <input
                    type="radio"
                    name="trxType"
                    value="upper"
                    checked={trxProgramType === 'upper'}
                    onChange={(e) => setTrxProgramType(e.target.value)}
                  />
                  Upper Body
                </label>
                <label>
                  <input
                    type="radio"
                    name="trxType"
                    value="core"
                    checked={trxProgramType === 'core'}
                    onChange={(e) => setTrxProgramType(e.target.value)}
                  />
                  Core Focus
                </label>
                <label>
                  <input
                    type="radio"
                    name="trxType"
                    value="leg"
                    checked={trxProgramType === 'leg'}
                    onChange={(e) => setTrxProgramType(e.target.value)}
                  />
                  Leg Focus
                </label>
                <label>
                  <input
                    type="radio"
                    name="trxType"
                    value="arm"
                    checked={trxProgramType === 'arm'}
                    onChange={(e) => setTrxProgramType(e.target.value)}
                  />
                  Arm Focus
                </label>
                <label>
                  <input
                    type="radio"
                    name="trxType"
                    value="back"
                    checked={trxProgramType === 'back'}
                    onChange={(e) => setTrxProgramType(e.target.value)}
                  />
                  Back Focus
                </label>
              </div>
            </div>

            <div className="card">
              <h3>Program Duration</h3>
              <label className="nsw-week-label">
                Duration: {trxDuration} days
                <input
                  type="range"
                  min="14"
                  max="84"
                  step="1"
                  value={trxDuration}
                  onChange={(e) => {
                    const newDuration = Number(e.target.value)
                    setTrxDuration(newDuration)
                    setSelectedTrxDay(Math.min(selectedTrxDay, newDuration))
                  }}
                />
              </label>
              <p className="subline">({Math.ceil(trxDuration / 7)} weeks)</p>
            </div>

            <div className="card">
              <h3>Program Calendar</h3>
              <div className="day-list-page" style={{ maxHeight: '400px', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '8px' }}>
                {trxProgram.map((item) => (
                  <button
                    key={item.day}
                    type="button"
                    className={`day-chip ${item.day === selectedTrxDay ? 'active' : ''}`}
                    onClick={() => setSelectedTrxDay(item.day)}
                  >
                    <span>Day {item.day}</span>
                    <small>{item.title}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="card">
              <p className="phase-tag">{selectedTrxPlan.phase || 'Training'}</p>
              <h2>
                Day {selectedTrxPlan.day}: {selectedTrxPlan.title}
              </h2>
              <p className="subline">
                Week {selectedTrxPlan.week || 1} | {selectedTrxPlan.dayName}
              </p>

              <div className="target-box">
                <h3>Today's Workout</h3>
                <ul>
                  {selectedTrxPlan.workouts && selectedTrxPlan.workouts.map((workout, index) => (
                    <li key={index} className="target-item">
                      {workout}
                    </li>
                  ))}
                </ul>
              </div>

              {selectedTrxPlan.exercises && selectedTrxPlan.exercises.length > 0 && (
                <div className="target-box">
                  <h3>Recommended Exercises</h3>
                  <ul>
                    {selectedTrxPlan.exercises.map((exercise, index) => (
                      <li key={index} className="target-item">
                        <strong>{exercise.name}</strong>
                        <span className="target-source">{exercise.difficulty} · {exercise.duration}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="card">
              <h3>Program Overview</h3>
              <ul>
                <li><strong>Type:</strong> {trxProgramType.replace('-', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</li>
                <li><strong>Duration:</strong> {trxDuration} days ({Math.ceil(trxDuration / 7)} weeks)</li>
                <li><strong>Protocol:</strong> Progressive resistance training using TRX suspension straps</li>
                <li><strong>Progression:</strong> Foundation → Build → Strength → Peak phases</li>
                <li><strong>Rest:</strong> Built-in recovery days and active recovery sessions</li>
              </ul>
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
        <button
          type="button"
          className={`nav-tab ${activeTab === 'nsw' ? 'active' : ''}`}
          onClick={() => setActiveTab('nsw')}
        >
          <span className="nav-icon">N</span>
          <span>NSW</span>
        </button>
        <button
          type="button"
          className={`nav-tab ${activeTab === 'nswCalendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('nswCalendar')}
        >
          <span className="nav-icon">W</span>
          <span>Week Cal</span>
        </button>
        <button
          type="button"
          className={`nav-tab ${activeTab === 'trx' ? 'active' : ''}`}
          onClick={() => setActiveTab('trx')}
        >
          <span className="nav-icon">💪</span>
          <span>TRX</span>
        </button>
      </nav>

      {showExerciseModal && (
        <div className="exercise-modal-backdrop" role="presentation">
          <div className="exercise-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="exercise-modal-close"
              aria-label="Close exercise description"
              onClick={() => setShowExerciseModal(false)}
            >
              X
            </button>
            <h3>{selectedExercise || 'Exercise Details'}</h3>
            <p>{selectedExerciseDescription || 'Select an exercise to view the PDF description.'}</p>
            <p className="subline">Source: NSW Physical Training Guide</p>
            <button type="button" className="action-button" onClick={() => setShowExerciseModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
