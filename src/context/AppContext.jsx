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
    { id: 't1', text: 'Review project proposal', done: false, dueTime: '10:00' },
    { id: 't2', text: 'Reply to team messages',  done: false, dueTime: '12:00' },
    { id: 't3', text: 'Evening walk 30 min',      done: false, dueTime: '18:30' },
  ],

  // Meals
  meals: {
    breakfast: { label: 'Breakfast', window: '7:00 – 9:00 AM',  eaten: false },
    lunch:     { label: 'Lunch',     window: '12:00 – 1:30 PM', eaten: false },
    snack:     { label: 'Snack',     window: '3:00 – 4:00 PM',  eaten: false },
    dinner:    { label: 'Dinner',    window: '6:30 – 8:00 PM',  eaten: false },
  },

  // Workout (Runna card)
  workout: {
    type:     'Tempo Run',
    duration: '45 min',
    pace:     '5:20 / km',
    time:     '6:30 PM',
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

    case 'CONFIRM_MEAL': {
      const slot = action.payload;
      if (state.confirmedMeals.includes(slot)) return state;
      return { ...state, confirmedMeals: [...state.confirmedMeals, slot] };
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

  // Persist every state change
  useEffect(() => { saveState(state); }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
