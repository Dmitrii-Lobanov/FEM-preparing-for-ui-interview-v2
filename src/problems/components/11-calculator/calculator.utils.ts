// Run tests: bun test src/problems/components/11-calculator/test/calculator.utils.test.ts

/** Action function signature: takes the current expression string and a label, returns the new expression string. */
export type TButtonAction = (state: string, operator: string) => string

/** A calculator button definition mapping a label to its action function. */
export type TCalculatorButton = {
    label: string
    action: TButtonAction
}

/** Sentinel value returned when an expression cannot be evaluated. */
export const INVALID_VALUE = 'Invalid value'

/**
 * Formats a number with fixed precision, stripping trailing zeros.
 * @example toFixedWithoutZeros(3.10000, 5) // '3.1'
 * @example toFixedWithoutZeros(42, 5)      // '42'
 */
export const toFixedWithoutZeros = (num: number, precision: number) =>
    num.toFixed(precision).replace(/\.*0+$/, '')

// TODO: Implement the following action functions:

/**
 * Appends a digit (or decimal point) to the expression.
 * Replaces the initial '0' to avoid leading zeros like '05'.
 * @example applyNumber('0', '5')  // '5'
 * @example applyNumber('12', '3') // '123'
 * @example applyNumber('3', '.')  // '3.'
 */
export const applyNumber: TButtonAction = (_state: string, _number: string) => {
    throw new Error('Not implemented')
}

/**
 * Appends an operator (+, -, *, /, %) to the expression.
 * If the last character is already an operator, replaces it
 * to prevent invalid sequences like '2+-'.
 * @example applyOperation('5', '+')  // '5+'
 * @example applyOperation('5+', '*') // '5*' (replaces)
 */
export const applyOperation: TButtonAction = (_state: string, _operator: string) => {
    throw new Error('Not implemented')
}

/**
 * Evaluates the expression string using `new Function('return ' + state)()`.
 * Returns the result as a string, or INVALID_VALUE for:
 * - Non-numeric characters (e.g. 'abc')
 * - NaN or Infinity results (e.g. division by zero)
 * - Syntax errors in the expression
 * @example calculate('2+3*4', '=') // '14'
 * @example calculate('1/0', '=')   // 'Invalid value'
 */
export const calculate: TButtonAction = (_state: string, _: string) => {
    throw new Error('Not implemented')
}

/** Resets the calculator state back to '0'. */
export const clear: TButtonAction = (_: string, __: string) => {
    throw new Error('Not implemented')
}

/**
 * Toggles negation on the current expression.
 * Wraps in `-(…)` to negate, or unwraps if already negated.
 * @example negate('5+3', '')    // '-(5+3)'
 * @example negate('-(5+3)', '') // '5+3'
 */
export const negate: TButtonAction = (_state: string) => {
    throw new Error('Not implemented')
}

/**
 * TODO: Build the BUTTONS Map using the action functions above.
 * Drives both rendering (iterate to create buttons) and logic (look up action by label on click).
 * Layout order: AC, +/-, %, ÷, then digits 7-9, ×, 4-6, -, 1-3, +, 0, ., =
 */
export const BUTTONS = new Map<string, TCalculatorButton>()
