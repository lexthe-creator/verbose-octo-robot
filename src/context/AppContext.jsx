import { createContext, useContext, useReducer, useEffect, useMemo } from 'react';

/* ─── She Stitches seed tasks ─────────────────────────────────────────────── */
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

/* ─── Initial projects array ──────────────────────────────────────────────── */
const INITIAL_PROJECTS = [
  {
    id:               'she-stitches',
    name:             'She Stitches',
    emoji:            '🪡',
    startDate:        '2025-04-01',
    endDate:          '2025-06-29',  // day 90 of 90
    bufferDays:       7,
    weeklyGoal:       null,
    tasks:            SS_TASKS,
    lastActivityDate: null,
    status:           'focus',
  },
]

/* ─── Initial state ───────────────────────────────────────────────────────── */
// Day plan state (tasks, meals, workout, etc.) now lives in DayContext.
const initialState = {
  fitness: {
    weekNumber:       1,
    programStartDate: null,
    programEndDate:   null,
    workoutLog:       [],
    todayComplete:    false,
  },

  inboxItems:       [],
  transactions:     [],
  focusSessions:    0,
  projects:         INITIAL_PROJECTS,
  reflectionLog:    [],
  weeklyPriorities: [],
  groceryList:      [],
};

/* ─── Reducer ─────────────────────────────────────────────────────────────── */
function reducer(state, action) {
  switch (action.type) {

    case 'ADD_INBOX_ITEM': {
      const item = { id: `i${Date.now()}`, text: action.payload, createdAt: new Date().toISOString() };
      return { ...state, inboxItems: [item, ...state.inboxItems] };
    }

    case 'REMOVE_INBOX_ITEM':
      return { ...state, inboxItems: state.inboxItems.filter(i => i.id !== action.payload) };

    case 'INCREMENT_FOCUS_SESSIONS':
      return { ...state, focusSessions: state.focusSessions + 1 };

    case 'LOG_WORKOUT':
      return {
        ...state,
        fitness: {
          ...state.fitness,
          workoutLog:    [...state.fitness.workoutLog, action.payload],
          todayComplete: true,
        },
      };

    case 'ADD_TRANSACTION': {
      const tx = { id: `tx${Date.now()}`, ...action.payload };
      return { ...state, transactions: [tx, ...state.transactions] };
    }

    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };

    case 'UPDATE_FITNESS': {
      const { key, value } = action.payload;
      return { ...state, fitness: { ...state.fitness, [key]: value } };
    }

    // ── Projects ────────────────────────────────────────────────────────────

    case 'TOGGLE_PROJECT_TASK': {
      const { projectId, taskId } = action.payload;
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id !== projectId ? p : {
            ...p,
            lastActivityDate: new Date().toISOString().slice(0, 10),
            tasks: p.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t),
          }
        ),
      };
    }

    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload.project] };

    case 'UPDATE_PROJECT': {
      const { projectId, key, value } = action.payload;
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id !== projectId ? p : { ...p, [key]: value }
        ),
      };
    }

    // ── EOD Reflection ──────────────────────────────────────────────────────

    case 'ADD_REFLECTION':
      return {
        ...state,
        reflectionLog: [...state.reflectionLog, action.payload],
      };

    // ── Weekly Planning ─────────────────────────────────────────────────────

    case 'SET_WEEKLY_PRIORITIES':
      return { ...state, weeklyPriorities: action.payload.priorities };

    case 'ADD_GROCERY_ITEM': {
      const item = { id: `g${Date.now()}`, text: action.payload.text, done: false };
      return { ...state, groceryList: [...state.groceryList, item] };
    }

    case 'TOGGLE_GROCERY_ITEM':
      return {
        ...state,
        groceryList: state.groceryList.map(g =>
          g.id === action.payload.id ? { ...g, done: !g.done } : g
        ),
      };

    case 'DELETE_GROCERY_ITEM':
      return { ...state, groceryList: state.groceryList.filter(g => g.id !== action.payload.id) };

    default:
      return state;
  }
}

/* ─── Persistence helpers ─────────────────────────────────────────────────── */
const STORAGE_KEY = 'aiml_state';
const SS_KEY      = 'sheStitches';  // legacy key — migrated on first load

function loadLegacyProjects() {
  try {
    const raw = localStorage.getItem(SS_KEY);
    if (!raw) return INITIAL_PROJECTS;
    const ssData = JSON.parse(raw);
    const doneMap = {};
    ssData.tasks?.forEach(t => { doneMap[t.id] = t.done; });
    const migrated = [{
      ...INITIAL_PROJECTS[0],
      startDate: ssData.startDate || INITIAL_PROJECTS[0].startDate,
      tasks: SS_TASKS.map(t => ({ ...t, done: doneMap[t.id] ?? false })),
    }];
    if (migrated.length > 0 && migrated[0].tasks?.length > 0) {
      localStorage.removeItem(SS_KEY);
    } else {
      console.warn('[AppContext] Legacy migration verification failed — sheStitches key preserved');
    }
    return migrated;
  } catch {
    return INITIAL_PROJECTS;
  }
}

// Determines whether fitness.todayComplete should be true on load.
// Reads aiml_day for dayLockedAt (one-way init read — no React dependency).
// Falls back to legacy aiml_state.dayLockedAt during the migration window.
function resolveTodayComplete(saved) {
  const stored = saved.fitness?.todayComplete ?? false;
  try {
    const dayRaw = localStorage.getItem('aiml_day');
    if (dayRaw) {
      const dayStored = JSON.parse(dayRaw);
      const dayLockedAt = dayStored.version === 1 ? dayStored.data?.dayLockedAt : null;
      if (dayLockedAt && new Date(dayLockedAt).toDateString() !== new Date().toDateString()) {
        return false;
      }
      return stored;
    }
    // Legacy fallback: dayLockedAt still present in old aiml_state
    if (saved.dayLockedAt && new Date(saved.dayLockedAt).toDateString() !== new Date().toDateString()) {
      return false;
    }
    return stored;
  } catch {
    return stored;
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...initialState, projects: loadLegacyProjects() };

    const saved = JSON.parse(raw);
    const projects = saved.projects ?? loadLegacyProjects();
    const todayComplete = resolveTodayComplete(saved);

    // Strip legacy and day-plan fields so they don't re-enter aiml_state
    const {
      profile: _p, settings: _s,
      dayLockedAt: _dl, energyLevel: _el, workoutConfirmed: _wc,
      confirmedTasks: _ct, confirmedMeals: _cm,
      tasks: _tasks, meals: _meals, workout: _wo,
      ...restSaved
    } = saved;

    return {
      ...initialState,
      ...restSaved,
      fitness:          { ...initialState.fitness, ...(saved.fitness || {}), todayComplete },
      transactions:     saved.transactions      || [],
      projects,
      reflectionLog:    saved.reflectionLog    || [],
      weeklyPriorities: saved.weeklyPriorities || [],
      groceryList:      saved.groceryList      || [],
    };
  } catch {
    return initialState;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded */ }
}

/* ─── Context ─────────────────────────────────────────────────────────────── */
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => { saveState(state); }, [state]);

  // Computed helpers for She Stitches (projects[0])
  const ssProject       = useMemo(() => state.projects?.[0] ?? null, [state.projects]);
  const ssDoneCount     = useMemo(() => ssProject?.tasks.filter(t => t.done).length ?? 0, [ssProject]);
  const ssTotalCount    = ssProject?.tasks.length ?? 0;
  const ssListingsCount = useMemo(() => ssProject?.tasks.filter(t => t.done).reduce((n, t) => n + (t.listings || 0), 0) ?? 0, [ssProject]);
  const ssNextTask      = useMemo(() => ssProject?.tasks.find(t => !t.done)?.text ?? null, [ssProject]);
  const ssDayOf90       = ssProject
    ? Math.min(Math.max(1, Math.floor((Date.now() - new Date(ssProject.startDate).getTime()) / 86_400_000) + 1), 90)
    : 1;

  return (
    <AppContext.Provider value={{
      state, dispatch,
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
