import { createContext, useContext, useReducer, useEffect, useMemo } from 'react';

/* ─── She Stitches seed data ──────────────────────────────────────────────── */
const SS_TASKS = [
  // Month 1 — Week 1
  { id: 'ss1',  text: 'Create and name your Etsy shop (She Stitches)',        done: false, listings: 0, week: 1,  month: 1, tag: 'Etsy'      },
  { id: 'ss2',  text: 'Write shop bio, About section, and owner story',       done: false, listings: 0, week: 1,  month: 1, tag: 'Etsy'      },
  { id: 'ss3',  text: 'Design banner and profile photo in Procreate or Canva',done: false, listings: 0, week: 1,  month: 1, tag: 'Design'    },
  { id: 'ss4',  text: 'Set shop policies (downloads, refunds, file types)',   done: false, listings: 0, week: 1,  month: 1, tag: 'Etsy'      },
  { id: 'ss5',  text: 'Research 3–5 competitor shops',                        done: false, listings: 0, week: 1,  month: 1, tag: 'Strategy'  },
  // Month 1 — Week 2
  { id: 'ss6',  text: 'Complete Tampa skyline pattern',                        done: false, listings: 0, week: 2,  month: 1, tag: 'Design'    },
  { id: 'ss7',  text: 'Complete St. Pete skyline pattern',                    done: false, listings: 0, week: 2,  month: 1, tag: 'Design'    },
  { id: 'ss8',  text: 'Export patterns as PDF + PNG in the right file sizes', done: false, listings: 0, week: 2,  month: 1, tag: 'Design'    },
  { id: 'ss9',  text: 'Create 2–3 mockup images per pattern',                 done: false, listings: 0, week: 2,  month: 1, tag: 'Design'    },
  // Month 1 — Week 3
  { id: 'ss10', text: 'Complete Miami + Orlando skyline patterns',             done: false, listings: 0, week: 3,  month: 1, tag: 'Design'    },
  { id: 'ss11', text: 'Publish Tampa listing',                                 done: false, listings: 1, week: 3,  month: 1, tag: 'Etsy'      },
  { id: 'ss12', text: 'Publish St. Pete listing',                             done: false, listings: 1, week: 3,  month: 1, tag: 'Etsy'      },
  { id: 'ss13', text: 'Publish Miami listing',                                 done: false, listings: 1, week: 3,  month: 1, tag: 'Etsy'      },
  { id: 'ss14', text: 'Publish Orlando listing',                               done: false, listings: 1, week: 3,  month: 1, tag: 'Etsy'      },
  // Month 1 — Week 4
  { id: 'ss15', text: 'Complete Jacksonville + Sarasota patterns',             done: false, listings: 0, week: 4,  month: 1, tag: 'Design'    },
  { id: 'ss16', text: 'Publish Jacksonville listing',                          done: false, listings: 1, week: 4,  month: 1, tag: 'Etsy'      },
  { id: 'ss17', text: 'Publish Sarasota listing',                              done: false, listings: 1, week: 4,  month: 1, tag: 'Etsy'      },
  { id: 'ss18', text: 'Review all 6 listings — tweak titles and tags',        done: false, listings: 0, week: 4,  month: 1, tag: 'Strategy'  },
  // Month 2 — Weeks 5–6
  { id: 'ss19', text: 'Design + publish NYC skyline',                          done: false, listings: 1, week: 5,  month: 2, tag: 'Design'    },
  { id: 'ss20', text: 'Design + publish Chicago skyline',                      done: false, listings: 1, week: 5,  month: 2, tag: 'Design'    },
  { id: 'ss21', text: 'Design + publish Nashville skyline',                    done: false, listings: 1, week: 5,  month: 2, tag: 'Design'    },
  { id: 'ss22', text: 'Design + publish Austin skyline',                       done: false, listings: 1, week: 6,  month: 2, tag: 'Design'    },
  { id: 'ss23', text: 'Set up Pinterest Business account',                     done: false, listings: 0, week: 6,  month: 2, tag: 'Marketing' },
  { id: 'ss24', text: 'Create 3 pins per existing listing',                    done: false, listings: 0, week: 6,  month: 2, tag: 'Marketing' },
  // Month 2 — Weeks 7–8
  { id: 'ss25', text: 'Create + publish Florida Cities 4-Pack bundle',         done: false, listings: 1, week: 7,  month: 2, tag: 'Etsy'      },
  { id: 'ss26', text: 'Design + publish Seattle skyline',                      done: false, listings: 1, week: 7,  month: 2, tag: 'Design'    },
  { id: 'ss27', text: 'Design + publish Denver skyline',                       done: false, listings: 1, week: 8,  month: 2, tag: 'Design'    },
  { id: 'ss28', text: 'Pin every new listing',                                  done: false, listings: 0, week: 8,  month: 2, tag: 'Marketing' },
  { id: 'ss29', text: 'Check Etsy stats — note top listings',                  done: false, listings: 0, week: 8,  month: 2, tag: 'Strategy'  },
  // Month 3 — Weeks 9–10
  { id: 'ss30', text: 'Design + publish 2 more city skylines',                 done: false, listings: 1, week: 9,  month: 3, tag: 'Design'    },
  { id: 'ss31', text: 'Create + publish US Cities Bundle',                     done: false, listings: 1, week: 10, month: 3, tag: 'Etsy'      },
  { id: 'ss32', text: 'Refresh top 3 listing photos',                          done: false, listings: 0, week: 10, month: 3, tag: 'Strategy'  },
  { id: 'ss33', text: 'Design a free beginner pattern as lead magnet',         done: false, listings: 0, week: 10, month: 3, tag: 'Marketing' },
  // Month 3 — Weeks 11–12
  { id: 'ss34', text: 'Set up Payhip or Gumroad storefront',                   done: false, listings: 0, week: 11, month: 3, tag: 'Etsy'      },
  { id: 'ss35', text: 'Set up free email list with lead magnet',               done: false, listings: 0, week: 11, month: 3, tag: 'Marketing' },
  { id: 'ss36', text: 'Share freebie on Pinterest',                            done: false, listings: 0, week: 12, month: 3, tag: 'Marketing' },
  { id: 'ss37', text: 'Full 90-day review',                                    done: false, listings: 0, week: 12, month: 3, tag: 'Strategy'  },
]

const SS_INITIAL = {
  startDate: '2025-04-01',
  tasks: SS_TASKS,
}

/* ─── Initial state ───────────────────────────────────────────────────────── */
const initialState = {
  // Profile
  profile: {
    name: 'Lex',                 // used in morning greeting
  },

  // App settings (user preferences + connection stubs)
  settings: {
    gymAccess:          'bodyweight',  // 'bodyweight' | 'dumbbells' | 'gym'
    plaidConnected:     false,
    calendarConnected:  false,
  },

  // Fitness training block
  fitness: {
    phase:         'base',       // 'base' | 'hyrox' | 'race' — see utils/fitness.js
    weekNumber:    1,            // increments each Monday
    workoutLog:    [],           // { date, type, duration, feel, notes, exercises[] }
    todayComplete: false,        // resets on new calendar day
  },

  // Morning ignition
  energyLevel:       null,      // 1–4 (😴 😐 🙂 ⚡)
  confirmedTasks:    [],         // array of task ids confirmed in Brief
  confirmedMeals:    [],         // ['breakfast','lunch','snack','dinner']
  workoutConfirmed:  false,
  dayLockedAt:       null,       // ISO timestamp

  // Tasks (3 things)
  tasks: [
    { id: 't1', text: 'Review project proposal', done: false, dueTime: '10:00', scheduledTime: null },
    { id: 't2', text: 'Reply to team messages',  done: false, dueTime: '12:00', scheduledTime: null },
    { id: 't3', text: 'Evening walk 30 min',      done: false, dueTime: '18:30', scheduledTime: null },
  ],

  // Meals — startTime/endTime in 'HH:MM' 24h format; lateAfter mirrors endTime
  meals: {
    breakfast: { label: 'Breakfast', startTime: '07:00', endTime: '09:00', lateAfter: '09:00', eaten: false },
    lunch:     { label: 'Lunch',     startTime: '12:00', endTime: '14:00', lateAfter: '14:00', eaten: false },
    snack:     { label: 'Snack',     startTime: '15:00', endTime: '17:00', lateAfter: '17:00', eaten: false },
    dinner:    { label: 'Dinner',    startTime: '19:00', endTime: '21:00', lateAfter: '21:00', eaten: false },
  },

  // Workout (Runna card)
  workout: {
    type:     'Tempo Run',
    duration: '45 min',
    pace:     '5:20 / km',
    time:     '18:30',
    confirmed: false,
  },

  // Inbox
  inboxItems: [],

  // Focus timer
  focusSessions: 0,
};

/* ─── Reducer ─────────────────────────────────────────────────────────────── */
function reducer(state, action) {
  switch (action.type) {

    case 'SET_ENERGY':
      return { ...state, energyLevel: action.payload };

    case 'CONFIRM_TASK': {
      const id = action.payload;
      if (state.confirmedTasks.includes(id)) return state;
      return { ...state, confirmedTasks: [...state.confirmedTasks, id] };
    }

    // payload: { slot, startTime, endTime } — sets default windows on confirmation
    case 'CONFIRM_MEAL': {
      const { slot, startTime, endTime } = action.payload;
      if (state.confirmedMeals.includes(slot)) return state;
      return {
        ...state,
        confirmedMeals: [...state.confirmedMeals, slot],
        meals: {
          ...state.meals,
          [slot]: { ...state.meals[slot], startTime, endTime, lateAfter: endTime },
        },
      };
    }

    case 'CONFIRM_WORKOUT':
      return {
        ...state,
        workoutConfirmed: true,
        workout: { ...state.workout, confirmed: true },
      };

    case 'LOCK_DAY':
      return { ...state, dayLockedAt: new Date().toISOString() };

    case 'TOGGLE_TASK': {
      const tasks = state.tasks.map(t =>
        t.id === action.payload ? { ...t, done: !t.done } : t
      );
      return { ...state, tasks };
    }

    // payload: { text } — appends new task from inbox triage
    case 'ADD_TASK': {
      const { text } = action.payload;
      const newTask = {
        id:            Date.now(),
        text,
        done:          false,
        scheduledTime: null,
      };
      return { ...state, tasks: [...state.tasks, newTask] };
    }

    // payload: { taskId, time: 'HH:MM' }
    case 'UPDATE_TASK_TIME': {
      const { taskId, time } = action.payload;
      const tasks = state.tasks.map(t =>
        t.id === taskId ? { ...t, scheduledTime: time } : t
      );
      return { ...state, tasks };
    }

    case 'MARK_MEAL_EATEN': {
      const slot = action.payload;
      return {
        ...state,
        meals: {
          ...state.meals,
          [slot]: { ...state.meals[slot], eaten: true },
        },
      };
    }

    // payload: { slot, startTime: 'HH:MM', endTime: 'HH:MM' }
    case 'UPDATE_MEAL_WINDOW': {
      const { slot, startTime, endTime } = action.payload;
      return {
        ...state,
        meals: {
          ...state.meals,
          [slot]: { ...state.meals[slot], startTime, endTime, lateAfter: endTime },
        },
      };
    }

    case 'ADD_INBOX_ITEM': {
      const item = {
        id:        `i${Date.now()}`,
        text:      action.payload,
        createdAt: new Date().toISOString(),
      };
      return { ...state, inboxItems: [item, ...state.inboxItems] };
    }

    case 'REMOVE_INBOX_ITEM':
      return {
        ...state,
        inboxItems: state.inboxItems.filter(i => i.id !== action.payload),
      };

    case 'INCREMENT_FOCUS_SESSIONS':
      return { ...state, focusSessions: state.focusSessions + 1 };

    // payload: { name }
    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };

    // payload: { key, value }
    case 'UPDATE_SETTINGS': {
      const { key, value } = action.payload;
      return { ...state, settings: { ...state.settings, [key]: value } };
    }

    // payload: { date, type, duration, feel, notes, exercises }
    case 'LOG_WORKOUT':
      return {
        ...state,
        fitness: {
          ...state.fitness,
          workoutLog:    [...state.fitness.workoutLog, action.payload],
          todayComplete: true,
        },
      };

    case 'INCREMENT_WEEK':
      return {
        ...state,
        fitness: { ...state.fitness, weekNumber: state.fitness.weekNumber + 1 },
      };

    case 'RESET_DAY':
      return {
        ...initialState,
        // Preserve cross-day state
        profile:    state.profile,
        settings:   state.settings,
        fitness:    { ...state.fitness, todayComplete: false },
        inboxItems: state.inboxItems,
      };

    default:
      return state;
  }
}

/* ─── She Stitches reducer ────────────────────────────────────────────────── */
function ssReducer(state, action) {
  if (action.type === 'TOGGLE_SS_TASK') {
    const tasks = state.tasks.map(t =>
      t.id === action.payload ? { ...t, done: !t.done } : t
    )
    return { ...state, tasks }
  }
  return state
}

/* ─── Persistence helpers ─────────────────────────────────────────────────── */
const STORAGE_KEY = 'aiml_state';
const SS_KEY      = 'sheStitches';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const saved = JSON.parse(raw);

    // If dayLockedAt is from a previous calendar day, reset — but preserve
    // cross-day state: profile, settings, fitness (minus todayComplete), inbox.
    if (saved.dayLockedAt) {
      const lockedDate = new Date(saved.dayLockedAt).toDateString();
      const today      = new Date().toDateString();
      if (lockedDate !== today) {
        return {
          ...initialState,
          profile:    { ...initialState.profile,  ...(saved.profile  || {}) },
          settings:   { ...initialState.settings, ...(saved.settings || {}) },
          fitness:    { ...initialState.fitness,  ...(saved.fitness  || {}), todayComplete: false },
          inboxItems: saved.inboxItems || [],
        };
      }
    }

    return {
      ...initialState,
      ...saved,
      // Deep-merge nested slices so new fields added post-release don't crash
      profile:  { ...initialState.profile,  ...(saved.profile  || {}) },
      settings: { ...initialState.settings, ...(saved.settings || {}) },
      fitness:  { ...initialState.fitness,  ...(saved.fitness  || {}) },
    };
  } catch {
    return initialState;
  }
}

function loadSsState() {
  try {
    const raw = localStorage.getItem(SS_KEY);
    if (!raw) return SS_INITIAL;
    const saved = JSON.parse(raw);
    // Merge saved done states onto fresh seed data (preserves task list updates)
    const doneMap = {}
    saved.tasks?.forEach(t => { doneMap[t.id] = t.done })
    return {
      ...SS_INITIAL,
      startDate: saved.startDate || SS_INITIAL.startDate,
      tasks: SS_INITIAL.tasks.map(t => ({ ...t, done: doneMap[t.id] ?? false })),
    }
  } catch {
    return SS_INITIAL;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded — silently skip */ }
}

function saveSsState(ssState) {
  try {
    localStorage.setItem(SS_KEY, JSON.stringify(ssState));
  } catch {}
}

/* ─── Context ─────────────────────────────────────────────────────────────── */
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state,   dispatch]   = useReducer(reducer,   undefined, loadState);
  const [ssState, ssDispatch] = useReducer(ssReducer, undefined, loadSsState);

  useEffect(() => { saveState(state);   }, [state]);
  useEffect(() => { saveSsState(ssState); }, [ssState]);

  function updateTaskTime(taskId, time) {
    dispatch({ type: 'UPDATE_TASK_TIME', payload: { taskId, time } });
  }

  function updateMealWindow(slot, startTime, endTime) {
    dispatch({ type: 'UPDATE_MEAL_WINDOW', payload: { slot, startTime, endTime } });
  }

  const ssDoneCount     = useMemo(() => ssState.tasks.filter(t => t.done).length, [ssState.tasks])
  const ssTotalCount    = ssState.tasks.length
  const ssListingsCount = useMemo(() => ssState.tasks.filter(t => t.done).reduce((n, t) => n + (t.listings || 0), 0), [ssState.tasks])
  const ssNextTask      = useMemo(() => ssState.tasks.find(t => !t.done)?.text ?? null, [ssState.tasks])
  const ssDayOf90       = Math.min(
    Math.max(1, Math.floor((Date.now() - new Date(ssState.startDate).getTime()) / 86_400_000) + 1),
    90
  )

  return (
    <AppContext.Provider value={{
      state, dispatch, updateTaskTime, updateMealWindow,
      ssState, ssDispatch,
      ssDoneCount, ssTotalCount, ssListingsCount, ssNextTask, ssDayOf90,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
