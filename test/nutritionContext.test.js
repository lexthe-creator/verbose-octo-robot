import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getLoggedMealSlotCount,
  getNutritionProgress,
  getNutritionStatusSymbol,
} from '../src/utils/nutrition.js'

const entry = mealSlot => ({
  id:        mealSlot,
  mealSlot,
  name:      mealSlot,
  calories:  1,
  protein:   1,
  carbs:     1,
  fat:       1,
  createdAt: '2026-06-03T12:00:00.000Z',
  updatedAt: '2026-06-03T12:00:00.000Z',
})

test('nutrition progress counts completed meal slots out of four', () => {
  assert.equal(getLoggedMealSlotCount([entry('breakfast')]), 1)
  assert.equal(getNutritionProgress([entry('breakfast')]), 0.25)

  assert.equal(getNutritionProgress([entry('breakfast'), entry('lunch')]), 0.5)
  assert.equal(getNutritionProgress([entry('breakfast'), entry('lunch'), entry('dinner')]), 0.75)
  assert.equal(getNutritionProgress([
    entry('breakfast'),
    entry('lunch'),
    entry('dinner'),
    entry('snack'),
  ]), 1)
})

test('nutrition status symbols follow meal-slot completion', () => {
  assert.equal(getNutritionStatusSymbol([]), '○')
  assert.equal(getNutritionStatusSymbol([entry('breakfast')]), '◐')
  assert.equal(getNutritionStatusSymbol([
    entry('breakfast'),
    entry('lunch'),
    entry('dinner'),
    entry('snack'),
  ]), '☑')
})
