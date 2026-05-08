// Pure data — no imports, no logic.
// duration is in seconds. main.* entries omit duration — set by the generator.

export const RUN_SEGMENTS = {

  warmup: {
    walk: {
      id: 'warmup_walk',
      name: 'Warm-up Walk',
      duration: 300,
      instruction: 'Easy walk to get your body moving. Relax your shoulders and breathe naturally.',
      effort: 'Very easy — 3/10',
    },
    easy_jog: {
      id: 'warmup_jog',
      name: 'Easy Jog',
      duration: 300,
      instruction: 'Light jog, very relaxed. You should feel completely comfortable and able to hold a full conversation.',
      effort: 'Easy — 4/10',
    },
  },

  cooldown: {
    walk: {
      id: 'cooldown_walk',
      name: 'Cool-down Walk',
      duration: 300,
      instruction: 'Slow your pace gradually. Focus on deep breathing and letting your heart rate come down.',
      effort: 'Very easy — 2/10',
    },
    easy_jog: {
      id: 'cooldown_jog',
      name: 'Easy Jog',
      duration: 300,
      instruction: 'Very light jog to bring your heart rate down slowly. Transition into a walk if needed.',
      effort: 'Easy — 3/10',
    },
  },

  // duration is omitted from main segments — the generator sets it per week
  main: {
    easy: {
      id: 'main_easy',
      name: 'Easy Run',
      instruction: 'Comfortable, conversational pace. You should be able to speak in full sentences without gasping.',
      effort: 'Easy — 5/10',
    },
    tempo: {
      id: 'main_tempo',
      name: 'Tempo Run',
      instruction: 'Comfortably hard. You can speak a few words but not full sentences. Controlled discomfort.',
      effort: 'Hard — 7/10',
    },
    long: {
      id: 'main_long',
      name: 'Long Run',
      instruction: 'Easy effort throughout. Slower than you think you need to go. This builds your aerobic base.',
      effort: 'Easy — 5/10',
    },
    recovery: {
      id: 'main_recovery',
      name: 'Recovery Interval',
      instruction: 'Back off completely. Easy jog or walk to recover fully before the next hard effort.',
      effort: 'Easy — 3/10',
    },
    interval: {
      id: 'main_interval',
      name: 'Speed Interval',
      instruction: 'Hard effort. Push the pace but stay controlled. Not a sprint — sustainable for the full interval.',
      effort: 'Very hard — 8/10',
    },
  },

}
