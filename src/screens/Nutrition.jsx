import { useState } from 'react'
import {
  MEAL_SLOTS,
  getMealSlotEntries,
  getNutritionEntriesForDate,
  getNutritionTotals,
  useNutrition,
} from '../context/index.js'
import { getTodayISO } from '../utils/time.js'

const EMPTY_FORM = {
  name:     '',
  mealSlot: 'breakfast',
  calories: '',
  protein:  '',
  carbs:    '',
  fat:      '',
}

const FIELD_LABELS = {
  calories: 'cal',
  protein:  'p',
  carbs:    'c',
  fat:      'f',
}

function toInputValue(value) {
  return value === 0 ? '' : String(value)
}

function toNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

function formToEntry(form) {
  return {
    name:     form.name.trim(),
    mealSlot: form.mealSlot,
    calories: toNumber(form.calories),
    protein:  toNumber(form.protein),
    carbs:    toNumber(form.carbs),
    fat:      toNumber(form.fat),
  }
}

function entryToForm(entry) {
  return {
    name:     entry.name,
    mealSlot: entry.mealSlot,
    calories: toInputValue(entry.calories),
    protein:  toInputValue(entry.protein),
    carbs:    toInputValue(entry.carbs),
    fat:      toInputValue(entry.fat),
  }
}

function macroLine(totals) {
  return `${Math.round(totals.calories)} cal · ${Math.round(totals.protein)}p · ${Math.round(totals.carbs)}c · ${Math.round(totals.fat)}f`
}

function TotalRow({ label, value, target, unit = '' }) {
  return (
    <div style={styles.totalRow}>
      <span style={styles.totalLabel}>{label}</span>
      <span style={styles.totalValue}>{Math.round(value)}{unit} / {Math.round(target)}{unit}</span>
    </div>
  )
}

function MealPicker({ value, onChange }) {
  return (
    <div style={styles.mealPicker} aria-label="meal slot">
      {MEAL_SLOTS.map(slot => (
        <button
          key={slot}
          style={{
            ...styles.mealChip,
            ...(value === slot ? styles.mealChipActive : {}),
          }}
          onClick={() => onChange(slot)}
          type="button"
        >
          {slot}
        </button>
      ))}
    </div>
  )
}

function FoodFields({ form, onChange, includeMeal = true }) {
  return (
    <div style={styles.form}>
      {includeMeal && <MealPicker value={form.mealSlot} onChange={mealSlot => onChange({ ...form, mealSlot })} />}
      <label style={styles.nameField}>
        <span style={styles.fieldLabel}>food</span>
        <input
          style={styles.lineInput}
          value={form.name}
          onChange={event => onChange({ ...form, name: event.target.value })}
          placeholder="eggs and toast"
        />
      </label>
      <div style={styles.numberGrid}>
        {Object.entries(FIELD_LABELS).map(([key, label]) => (
          <label key={key} style={styles.numberField}>
            <span style={styles.fieldLabel}>{label}</span>
            <input
              style={styles.numberInput}
              type="number"
              inputMode="decimal"
              min="0"
              value={form[key]}
              onChange={event => onChange({ ...form, [key]: event.target.value })}
            />
          </label>
        ))}
      </div>
    </div>
  )
}

function MealSection({
  slot,
  entries,
  totals,
  onAdd,
  onEdit,
  onDelete,
  onSaveFood,
  onSaveMeal,
}) {
  return (
    <section style={styles.mealSection}>
      <div style={styles.mealTop}>
        <div>
          <h2 style={styles.mealTitle}>{slot}</h2>
          <p style={styles.mealMeta}>{macroLine(totals)}</p>
        </div>
        <div style={styles.mealActions}>
          {entries.length > 0 && (
            <button style={styles.softAction} onClick={() => onSaveMeal(slot)} type="button">save meal</button>
          )}
          <button style={styles.textAction} onClick={() => onAdd(slot)} type="button">add</button>
        </div>
      </div>

      {entries.length === 0 ? (
        <p style={styles.emptyLine}>nothing logged</p>
      ) : (
        <div style={styles.entryList}>
          {entries.map(entry => (
            <div key={entry.id} style={styles.entryRow}>
              <div style={styles.entryMain}>
                <span style={styles.entryName}>{entry.name}</span>
                <span style={styles.entryMeta}>{macroLine(entry)}</span>
              </div>
              <div style={styles.entryActions}>
                <button style={styles.smallAction} onClick={() => onSaveFood(entry)} type="button">save</button>
                <button style={styles.smallAction} onClick={() => onEdit(entry)} type="button">edit</button>
                <button style={styles.deleteAction} onClick={() => onDelete(entry.id)} type="button">delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function BottomSheet({ title, children, onClose }) {
  return (
    <div style={styles.sheetBackdrop}>
      <div style={styles.sheet}>
        <div style={styles.sheetHeader}>
          <h2 style={styles.sheetTitle}>{title}</h2>
          <button style={styles.closeAction} onClick={onClose} type="button">close</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Nutrition() {
  const { nutritionState, nutritionDispatch } = useNutrition()
  const today = getTodayISO()
  const entries = getNutritionEntriesForDate(nutritionState, today)
  const totals = getNutritionTotals(entries)

  const [form, setForm] = useState(EMPTY_FORM)
  const [targetDraft, setTargetDraft] = useState(() => ({
    calories: String(nutritionState.targets.calories),
    protein:  String(nutritionState.targets.protein),
    carbs:    String(nutritionState.targets.carbs),
    fat:      String(nutritionState.targets.fat),
  }))
  const [sheet, setSheet] = useState(null)

  const mealSummaries = Object.fromEntries(
    MEAL_SLOTS.map(slot => {
      const slotEntries = getMealSlotEntries(entries, slot)
      return [slot, { entries: slotEntries, totals: getNutritionTotals(slotEntries) }]
    })
  )

  function openAddSheet(slot) {
    setForm({ ...EMPTY_FORM, mealSlot: slot })
    setSheet({ type: 'add' })
  }

  function openEditSheet(entry) {
    setForm(entryToForm(entry))
    setSheet({ type: 'edit', entryId: entry.id })
  }

  function closeSheet() {
    setSheet(null)
    setForm(EMPTY_FORM)
  }

  function addFood() {
    const entry = formToEntry(form)
    if (!entry.name) return
    nutritionDispatch({ type: 'ADD_FOOD_ENTRY', payload: { date: today, entry } })
    closeSheet()
  }

  function updateFood() {
    const entry = formToEntry(form)
    if (!entry.name || !sheet?.entryId) return
    nutritionDispatch({ type: 'UPDATE_FOOD_ENTRY', payload: { date: today, id: sheet.entryId, entry } })
    closeSheet()
  }

  function saveFood(entry) {
    nutritionDispatch({
      type: 'SAVE_FOOD',
      payload: {
        food: {
          name:            entry.name,
          calories:        entry.calories,
          protein:         entry.protein,
          carbs:           entry.carbs,
          fat:             entry.fat,
          defaultMealSlot: entry.mealSlot,
        },
      },
    })
  }

  function openSaveMealSheet(slot) {
    setSheet({ type: 'saveMeal', slot, name: '' })
  }

  function saveMeal() {
    const slotEntries = mealSummaries[sheet.slot].entries
    const name = sheet.name.trim()
    if (!name || slotEntries.length === 0) return
    nutritionDispatch({
      type: 'SAVE_MEAL',
      payload: {
        meal: {
          name,
          defaultMealSlot: sheet.slot,
          entries: slotEntries.map(entry => ({
            name:     entry.name,
            calories: entry.calories,
            protein:  entry.protein,
            carbs:    entry.carbs,
            fat:      entry.fat,
          })),
        },
      },
    })
    closeSheet()
  }

  function saveTargets() {
    nutritionDispatch({
      type: 'UPDATE_TARGETS',
      payload: {
        targets: {
          calories: toNumber(targetDraft.calories),
          protein:  toNumber(targetDraft.protein),
          carbs:    toNumber(targetDraft.carbs),
          fat:      toNumber(targetDraft.fat),
        },
      },
    })
  }

  return (
    <main style={styles.screen}>
      <header style={styles.header}>
        <p style={styles.eyebrow}>nutrition</p>
        <h1 style={styles.title}>today</h1>
      </header>

      <section style={styles.totals}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>daily totals</h2>
          <button style={styles.softAction} onClick={() => setSheet({ type: 'targets' })} type="button">targets</button>
        </div>
        <TotalRow label="calories" value={totals.calories} target={nutritionState.targets.calories} />
        <TotalRow label="protein" value={totals.protein} target={nutritionState.targets.protein} unit="g" />
        <TotalRow label="carbs" value={totals.carbs} target={nutritionState.targets.carbs} unit="g" />
        <TotalRow label="fat" value={totals.fat} target={nutritionState.targets.fat} unit="g" />
      </section>

      <section style={styles.mealList}>
        {MEAL_SLOTS.map(slot => (
          <MealSection
            key={slot}
            slot={slot}
            entries={mealSummaries[slot].entries}
            totals={mealSummaries[slot].totals}
            onAdd={openAddSheet}
            onEdit={openEditSheet}
            onDelete={id => nutritionDispatch({ type: 'DELETE_FOOD_ENTRY', payload: { date: today, id } })}
            onSaveFood={saveFood}
            onSaveMeal={openSaveMealSheet}
          />
        ))}
      </section>

      <details style={styles.savedSection}>
        <summary style={styles.savedSummary}>saved / recent</summary>

        <div style={styles.savedBlock}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>saved foods</h2>
          </div>
          {nutritionState.savedFoods.length === 0 ? (
            <p style={styles.emptyLine}>no saved foods</p>
          ) : (
            <div style={styles.savedList}>
              {nutritionState.savedFoods.map(food => (
                <div key={food.id} style={styles.savedRow}>
                  <div style={styles.entryMain}>
                    <span style={styles.entryName}>{food.name}</span>
                    <span style={styles.entryMeta}>{macroLine(food)}</span>
                  </div>
                  <div style={styles.entryActions}>
                    <button
                      style={styles.smallAction}
                      onClick={() => setSheet({ type: 'addSavedFood', food, mealSlot: food.defaultMealSlot ?? 'breakfast' })}
                      type="button"
                    >
                      add again
                    </button>
                    <button
                      style={styles.deleteAction}
                      onClick={() => nutritionDispatch({ type: 'DELETE_SAVED_FOOD', payload: { id: food.id } })}
                      type="button"
                    >
                      delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={styles.savedBlock}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>saved meals</h2>
          </div>
          {nutritionState.savedMeals.length === 0 ? (
            <p style={styles.emptyLine}>no saved meals</p>
          ) : (
            <div style={styles.savedList}>
              {nutritionState.savedMeals.map(meal => {
                const mealTotals = getNutritionTotals(meal.entries)
                return (
                  <div key={meal.id} style={styles.savedRow}>
                    <div style={styles.entryMain}>
                      <span style={styles.entryName}>{meal.name}</span>
                      <span style={styles.entryMeta}>{meal.entries.length} foods · {macroLine(mealTotals)}</span>
                    </div>
                    <div style={styles.entryActions}>
                      <button
                        style={styles.smallAction}
                        onClick={() => setSheet({ type: 'addSavedMeal', meal, mealSlot: meal.defaultMealSlot ?? 'breakfast' })}
                        type="button"
                      >
                        add again
                      </button>
                      <button
                        style={styles.deleteAction}
                        onClick={() => nutritionDispatch({ type: 'DELETE_SAVED_MEAL', payload: { id: meal.id } })}
                        type="button"
                      >
                        delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </details>

      {sheet?.type === 'add' && (
        <BottomSheet title={`add to ${form.mealSlot}`} onClose={closeSheet}>
          <FoodFields form={form} onChange={setForm} />
          <button style={styles.sheetPrimary} onClick={addFood} type="button">add food</button>
        </BottomSheet>
      )}

      {sheet?.type === 'edit' && (
        <BottomSheet title="edit food" onClose={closeSheet}>
          <FoodFields form={form} onChange={setForm} />
          <button style={styles.sheetPrimary} onClick={updateFood} type="button">save food</button>
        </BottomSheet>
      )}

      {sheet?.type === 'saveMeal' && (
        <BottomSheet title={`save ${sheet.slot}`} onClose={closeSheet}>
          <label style={styles.nameField}>
            <span style={styles.fieldLabel}>meal name</span>
            <input
              style={styles.lineInput}
              value={sheet.name}
              onChange={event => setSheet({ ...sheet, name: event.target.value })}
              placeholder={`${sheet.slot} regular`}
            />
          </label>
          <button style={styles.sheetPrimary} onClick={saveMeal} type="button">save meal</button>
        </BottomSheet>
      )}

      {sheet?.type === 'addSavedFood' && (
        <BottomSheet title={sheet.food.name} onClose={closeSheet}>
          <MealPicker value={sheet.mealSlot} onChange={mealSlot => setSheet({ ...sheet, mealSlot })} />
          <p style={styles.sheetMeta}>{macroLine(sheet.food)}</p>
          <button
            style={styles.sheetPrimary}
            onClick={() => {
              nutritionDispatch({
                type: 'ADD_SAVED_FOOD_TO_LOG',
                payload: { date: today, foodId: sheet.food.id, mealSlot: sheet.mealSlot },
              })
              closeSheet()
            }}
            type="button"
          >
            add again
          </button>
        </BottomSheet>
      )}

      {sheet?.type === 'addSavedMeal' && (
        <BottomSheet title={sheet.meal.name} onClose={closeSheet}>
          <MealPicker value={sheet.mealSlot} onChange={mealSlot => setSheet({ ...sheet, mealSlot })} />
          <p style={styles.sheetMeta}>{sheet.meal.entries.length} foods · {macroLine(getNutritionTotals(sheet.meal.entries))}</p>
          <button
            style={styles.sheetPrimary}
            onClick={() => {
              nutritionDispatch({
                type: 'ADD_SAVED_MEAL_TO_LOG',
                payload: { date: today, mealId: sheet.meal.id, mealSlot: sheet.mealSlot },
              })
              closeSheet()
            }}
            type="button"
          >
            add again
          </button>
        </BottomSheet>
      )}

      {sheet?.type === 'targets' && (
        <BottomSheet title="targets" onClose={closeSheet}>
          <div style={styles.numberGrid}>
            {['calories', 'protein', 'carbs', 'fat'].map(key => (
              <label key={key} style={styles.numberField}>
                <span style={styles.fieldLabel}>{key}</span>
                <input
                  style={styles.numberInput}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={targetDraft[key]}
                  onChange={event => setTargetDraft({ ...targetDraft, [key]: event.target.value })}
                />
              </label>
            ))}
          </div>
          <button
            style={styles.sheetPrimary}
            onClick={() => {
              saveTargets()
              closeSheet()
            }}
            type="button"
          >
            update targets
          </button>
        </BottomSheet>
      )}
    </main>
  )
}

const styles = {
  screen: {
    minHeight:     '100dvh',
    padding:       'max(env(safe-area-inset-top), 20px) 20px calc(var(--safe-bottom) + var(--nav-height) + 24px)',
    background:    'var(--color-bg)',
    color:         'var(--color-text)',
  },
  header: {
    marginBottom: '14px',
  },
  eyebrow: {
    margin:        0,
    color:         'var(--color-muted)',
    fontSize:      '10px',
    fontWeight:    700,
    letterSpacing: '0.1em',
    textTransform: 'lowercase',
  },
  title: {
    margin:      '4px 0 0',
    fontFamily: 'var(--font-body)',
    fontSize:   '17px',
    fontWeight: 600,
    lineHeight: 1.1,
  },
  totals: {
    padding:      '0 0 12px',
    borderBottom: 'var(--border)',
  },
  sectionHeader: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            '12px',
    marginBottom:   '8px',
  },
  sectionTitle: {
    margin:        0,
    color:         'var(--color-muted)',
    fontSize:      '10px',
    fontWeight:    700,
    letterSpacing: '0.1em',
    textTransform: 'lowercase',
  },
  totalRow: {
    display:        'grid',
    gridTemplateColumns: '88px minmax(0, 1fr)',
    alignItems:     'baseline',
    gap:            '14px',
    minHeight:      '25px',
  },
  totalLabel: {
    color:      'var(--color-muted)',
    fontSize:   '12px',
    fontWeight: 600,
  },
  totalValue: {
    color:      'var(--color-text)',
    fontSize:   '13px',
    fontWeight: 600,
  },
  mealList: {
    display:       'flex',
    flexDirection: 'column',
  },
  mealSection: {
    padding:      '14px 0 13px',
    borderBottom: 'var(--border)',
  },
  mealTop: {
    display:        'flex',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    gap:            '12px',
  },
  mealTitle: {
    margin:      0,
    fontFamily: 'var(--font-display)',
    fontSize:   '18px',
    fontWeight: 500,
    lineHeight: 1.1,
    textTransform: 'lowercase',
  },
  mealMeta: {
    margin:    '5px 0 0',
    color:     'var(--color-muted)',
    fontSize:  '11px',
    lineHeight: 1.35,
  },
  mealActions: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'flex-end',
    gap:            '10px',
    flexWrap:       'wrap',
    paddingTop:     '1px',
  },
  textAction: {
    border:     'none',
    background: 'transparent',
    color:      'var(--color-accent)',
    fontSize:   '12px',
    fontWeight: 700,
    padding:    0,
  },
  softAction: {
    border:     'none',
    background: 'transparent',
    color:      'var(--color-muted)',
    fontSize:   '11px',
    fontWeight: 600,
    padding:    0,
  },
  emptyLine: {
    margin:    '9px 0 0',
    color:     'var(--color-muted)',
    fontSize:  '12px',
    lineHeight: 1.35,
  },
  entryList: {
    marginTop:     '10px',
    display:       'flex',
    flexDirection: 'column',
    gap:           '8px',
  },
  entryRow: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    gap:            '12px',
    padding:        '8px 0',
    borderTop:      '0.5px solid color-mix(in srgb, var(--color-border) 50%, transparent)',
  },
  entryMain: {
    minWidth: 0,
  },
  entryName: {
    display:    'block',
    color:      'var(--color-text)',
    fontSize:   '13px',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  entryMeta: {
    display:   'block',
    margin:    '3px 0 0',
    color:     'var(--color-muted)',
    fontSize:  '11px',
    lineHeight: 1.35,
  },
  entryActions: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'flex-end',
    gap:            '8px',
    flexWrap:       'wrap',
    flexShrink:     0,
  },
  smallAction: {
    border:     'none',
    background: 'transparent',
    color:      'var(--color-accent)',
    fontSize:   '11px',
    fontWeight: 700,
    padding:    0,
  },
  deleteAction: {
    border:     'none',
    background: 'transparent',
    color:      'var(--color-muted)',
    fontSize:   '11px',
    fontWeight: 600,
    padding:    0,
  },
  savedSection: {
    padding:      '15px 0 0',
    borderBottom: 'var(--border)',
  },
  savedSummary: {
    cursor:        'pointer',
    color:         'var(--color-text)',
    fontSize:      '12px',
    fontWeight:    700,
    letterSpacing: '0.04em',
    paddingBottom: '13px',
  },
  savedBlock: {
    padding:      '12px 0 4px',
    borderTop:    '0.5px solid color-mix(in srgb, var(--color-border) 58%, transparent)',
  },
  savedList: {
    display:       'flex',
    flexDirection: 'column',
  },
  savedRow: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'flex-start',
    gap:            '12px',
    padding:        '9px 0',
    borderTop:      '0.5px solid color-mix(in srgb, var(--color-border) 44%, transparent)',
  },
  sheetBackdrop: {
    position:        'fixed',
    inset:           0,
    zIndex:          180,
    background:      'rgba(26, 26, 20, 0.24)',
    display:         'flex',
    alignItems:      'flex-end',
    justifyContent:  'center',
  },
  sheet: {
    width:        '100%',
    maxWidth:     'var(--max-width)',
    background:   'var(--color-bg)',
    borderTop:    'var(--border)',
    padding:      '16px 20px calc(var(--safe-bottom) + 18px)',
    boxShadow:    '0 -12px 34px rgba(26, 26, 20, 0.12)',
  },
  sheetHeader: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    gap:            '14px',
    marginBottom:   '14px',
  },
  sheetTitle: {
    margin:      0,
    fontFamily: 'var(--font-display)',
    fontSize:   '20px',
    fontWeight: 500,
    lineHeight: 1.1,
  },
  closeAction: {
    border:     'none',
    background: 'transparent',
    color:      'var(--color-muted)',
    fontSize:   '12px',
    fontWeight: 700,
    padding:    0,
  },
  form: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '14px',
  },
  mealPicker: {
    display:   'flex',
    gap:       '7px',
    flexWrap:  'wrap',
  },
  mealChip: {
    border:       'var(--border)',
    borderRadius: 'var(--radius-pill)',
    background:   'transparent',
    color:        'var(--color-muted)',
    fontSize:     '11px',
    fontWeight:   700,
    padding:      '6px 9px',
  },
  mealChipActive: {
    borderColor: 'var(--color-accent)',
    color:       'var(--color-accent)',
    background:  'color-mix(in srgb, var(--color-accent-bg) 64%, transparent)',
  },
  nameField: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '5px',
  },
  fieldLabel: {
    color:      'var(--color-muted)',
    fontSize:   '10px',
    fontWeight: 700,
  },
  lineInput: {
    width:        '100%',
    border:       'none',
    borderBottom: 'var(--border)',
    background:   'transparent',
    color:        'var(--color-text)',
    font:         'inherit',
    fontSize:     '15px',
    padding:      '7px 0 8px',
    outline:      'none',
  },
  numberGrid: {
    display:             'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap:                 '8px',
  },
  numberField: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '5px',
    minWidth:      0,
  },
  numberInput: {
    width:        '100%',
    minHeight:    '34px',
    border:       'var(--border)',
    borderRadius: '8px',
    background:   'transparent',
    color:        'var(--color-text)',
    font:         'inherit',
    fontSize:     '13px',
    padding:      '7px 8px',
  },
  sheetPrimary: {
    marginTop:     '14px',
    minHeight:     '36px',
    border:        'var(--border)',
    borderRadius:  '8px',
    background:    'transparent',
    color:         'var(--color-text)',
    fontSize:      '12px',
    fontWeight:    700,
    padding:       '8px 12px',
  },
  sheetMeta: {
    margin:    '10px 0 0',
    color:     'var(--color-muted)',
    fontSize:  '12px',
    lineHeight: 1.4,
  },
}
