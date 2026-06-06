const net = require('net')
const crypto = require('crypto')

const pageId = process.argv[2]
if (!pageId) {
  console.error('Usage: node cdp_workout_ux_smoke.cjs <page-id>')
  process.exit(1)
}

const socket = net.createConnection(9222, '127.0.0.1')
let nextId = 0
const pending = new Map()
let buffer = Buffer.alloc(0)
let handshaken = false

function encodeFrame(text) {
  const payload = Buffer.from(text)
  const mask = crypto.randomBytes(4)
  const header = []
  header.push(0x81)
  if (payload.length < 126) {
    header.push(0x80 | payload.length)
  } else if (payload.length < 65536) {
    header.push(0x80 | 126, (payload.length >> 8) & 255, payload.length & 255)
  } else {
    throw new Error('Frame too large')
  }
  const masked = Buffer.alloc(payload.length)
  for (let i = 0; i < payload.length; i++) masked[i] = payload[i] ^ mask[i % 4]
  return Buffer.concat([Buffer.from(header), mask, masked])
}

function readFrame() {
  if (buffer.length < 2) return null
  const first = buffer[0]
  const second = buffer[1]
  let offset = 2
  let length = second & 0x7f
  if (length === 126) {
    if (buffer.length < offset + 2) return null
    length = buffer.readUInt16BE(offset)
    offset += 2
  } else if (length === 127) {
    throw new Error('Large CDP frame unsupported')
  }
  const masked = Boolean(second & 0x80)
  let mask
  if (masked) {
    if (buffer.length < offset + 4) return null
    mask = buffer.slice(offset, offset + 4)
    offset += 4
  }
  if (buffer.length < offset + length) return null
  let payload = buffer.slice(offset, offset + length)
  buffer = buffer.slice(offset + length)
  if (masked) {
    payload = Buffer.from(payload.map((byte, index) => byte ^ mask[index % 4]))
  }
  if ((first & 0x0f) === 0x8) process.exit(1)
  return payload.toString('utf8')
}

function send(method, params = {}) {
  const id = ++nextId
  const message = JSON.stringify({ id, method, params })
  socket.write(encodeFrame(message))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  if (result.exceptionDetails) {
    throw new Error(JSON.stringify(result.exceptionDetails))
  }
  return result.result?.value
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function clickText(text) {
  return evaluate(`
    (() => {
      const button = Array.from(document.querySelectorAll('button'))
        .find(item => item.innerText.trim() === ${JSON.stringify(text)});
      if (!button) return false;
      button.click();
      return true;
    })()
  `)
}

async function clickIncludes(text) {
  return evaluate(`
    (() => {
      const button = Array.from(document.querySelectorAll('button'))
        .find(item => item.innerText.includes(${JSON.stringify(text)}));
      if (!button) return false;
      button.click();
      return true;
    })()
  `)
}

async function snapshot(label) {
  const text = await evaluate('document.body.innerText')
  return { label, text }
}

async function runFlow() {
  await send('Runtime.enable')
  await send('Page.enable')
  await evaluate(`
    (() => {
      const dayKeys = ['mon','tue','wed','thu','fri','sat','sun'];
      const todayKey = dayKeys[(new Date().getDay() + 6) % 7];
      localStorage.clear();
      localStorage.setItem('aiml_settings', JSON.stringify({
        version: 1,
        data: {
          theme: 'light',
          gymAccess: 'home_gym',
          plaidConnected: false,
          calendarConnected: false,
          modules: { fitness: true, nutrition: false, goals: false, reflection: false, finance: true, focus: true, habits: false, sleep: false }
        }
      }));
      localStorage.setItem('aiml_fitness', JSON.stringify({
        version: 2,
        data: {
          programStartDate: new Date().toISOString().slice(0, 10),
          programEndDate: null,
          workoutLog: [],
          todayComplete: false,
          focusSessions: 0,
          program: { type: 'strength', configured: true },
          programConfig: {
            trainingDays: [todayKey],
            dayTypes: { [todayKey]: 'lower' },
            goal: 'strength',
            audioEnabled: false,
            weeklyDays: 1
          }
        }
      }));
      return todayKey;
    })()
  `)
  await send('Page.reload')
  await wait(700)
  await clickText('Health')
  await wait(300)
  await clickText('Training')
  await wait(300)
  let started = await clickText('Start Workout')
  if (!started) started = await clickText('Start')
  await wait(400)

  const checks = []
  checks.push(await snapshot('initial timed'))
  await clickText('Pause')
  await wait(250)
  checks.push(await snapshot('paused timed'))
  await clickText('Resume Workout')
  await wait(250)
  checks.push(await snapshot('resumed timed'))
  await clickText('Next')
  await wait(250)
  checks.push(await snapshot('next timed'))
  await clickText('Previous')
  await wait(250)
  checks.push(await snapshot('previous timed'))

  for (let i = 0; i < 5; i++) {
    const body = await evaluate('document.body.innerText')
    if (body.includes('coach cues') && body.includes('equipment-ready swaps')) break
    await clickText('Next')
    await wait(180)
  }
  checks.push(await snapshot('set exercise'))
  await clickText('Next')
  await wait(250)
  checks.push(await snapshot('rest step'))
  await clickText('Pause')
  await wait(200)
  checks.push(await snapshot('paused rest'))
  await clickText('Resume Workout')
  await wait(200)
  await clickText('Next')
  await wait(250)
  checks.push(await snapshot('after rest'))
  await clickText('Previous')
  await wait(250)
  checks.push(await snapshot('previous to rest'))

  for (let i = 0; i < 10; i++) {
    const body = await evaluate('document.body.innerText')
    if (body.includes('Cool Down')) break
    await clickText('Next')
    await wait(120)
  }
  checks.push(await snapshot('phase boundary cooldown'))
  await clickText('Exit')
  await wait(300)
  checks.push(await snapshot('after exit'))
  started = await clickText('Start Workout')
  if (!started) started = await clickText('Start')
  await wait(400)
  checks.push(await snapshot('resume return'))

  const summary = {
    initialTimed: checks[0].text.includes('Warm-Up') && checks[0].text.includes('video / gif placeholder'),
    pauseResumeTimed: checks[1].text.includes('Resume Workout') && checks[2].text.includes('Pause'),
    previousNextTimed: checks[3].text.includes('Warm-Up') && checks[4].text.includes('Warm-Up'),
    setExercise: checks[5].text.includes('Main') && checks[5].text.includes('coach cues') && checks[5].text.includes('equipment-ready swaps'),
    rest: checks[6].text.includes('Rest') && checks[6].text.includes('Next:'),
    pauseResumeRest: checks[7].text.includes('Resume Workout'),
    afterRestAndPrevious: checks[8].text.includes('Main') && checks[9].text.includes('Rest'),
    phaseBoundary: checks[10].text.includes('Cool Down'),
    exitAndResume: !checks[11].text.includes('Exit') && checks[12].text.includes('Cool Down'),
    labels: checks.map(item => ({ label: item.label, firstLines: item.text.split('\\n').slice(0, 12) })),
  }
  console.log(JSON.stringify(summary, null, 2))
}

socket.on('connect', () => {
  const key = crypto.randomBytes(16).toString('base64')
  socket.write([
    `GET /devtools/page/${pageId} HTTP/1.1`,
    'Host: 127.0.0.1:9222',
    'Upgrade: websocket',
    'Connection: Upgrade',
    'Sec-WebSocket-Version: 13',
    `Sec-WebSocket-Key: ${key}`,
    'Origin: http://127.0.0.1',
    '',
    '',
  ].join('\r\n'))
})

socket.on('data', chunk => {
  buffer = Buffer.concat([buffer, chunk])
  if (!handshaken) {
    const marker = buffer.indexOf('\r\n\r\n')
    if (marker === -1) return
    const header = buffer.slice(0, marker).toString('utf8')
    if (!header.includes('101')) {
      console.error(header)
      process.exit(1)
    }
    buffer = buffer.slice(marker + 4)
    handshaken = true
    runFlow().catch(error => {
      console.error(error)
      process.exit(1)
    })
  }

  let frame
  while ((frame = readFrame())) {
    const message = JSON.parse(frame)
    if (message.id && pending.has(message.id)) {
      const waiter = pending.get(message.id)
      pending.delete(message.id)
      if (message.error) waiter.reject(new Error(JSON.stringify(message.error)))
      else waiter.resolve(message.result)
    }
  }
})

socket.on('error', error => {
  console.error(error)
  process.exit(1)
})
