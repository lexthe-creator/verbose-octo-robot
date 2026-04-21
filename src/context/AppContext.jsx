import { createContext, useContext, useReducer, useEffect } from 'react';

/* ─── Initial state ───────────────────────────────────────────────────────── */
const initialState = {
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

    case 'RESET_DAY':
      return {
        ...initialState,
        inboxItems: state.inboxItems, // inbox persists across days
      };

    default:
      return state;
  }
}

/* ─── Persistence helpers ─────────────────────────────────────────────────── */
const STORAGE_KEY = 'aiml_state';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const saved = JSON.parse(raw);

    // If dayLockedAt is from a previous calendar day, reset
    if (saved.dayLockedAt) {
      const lockedDate = new Date(saved.dayLockedAt).toDateString();
      const today      = new Date().toDateString();
      if (lockedDate !== today) return initialState;
    }

    return { ...initialState, ...saved };
  } catch {
    return initialState;
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* quota exceeded — silently skip */ }
}

/* ─── Context ─────────────────────────────────────────────────────────────── */
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => { saveState(state); }, [state]);

  function updateTaskTime(taskId, time) {
    dispatch({ type: 'UPDATE_TASK_TIME', payload: { taskId, time } });
  }

  function updateMealWindow(slot, startTime, endTime) {
    dispatch({ type: 'UPDATE_MEAL_WINDOW', payload: { slot, startTime, endTime } });
  }

  return (
    <AppContext.Provider value={{ state, dispatch, updateTaskTime, updateMealWindow }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
