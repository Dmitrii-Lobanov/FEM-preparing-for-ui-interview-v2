import { useState } from 'react'
import css from './calculator.module.css'
import styles from '@course/styles'
import cx from '@course/cx'

import { BUTTONS, INVALID_VALUE } from './calculator.utils'

export const Calculator = () => {
  const [state, setState] = useState<string>('0')

  const handleButtonClick = ({ target }: React.MouseEvent<HTMLButtonElement>) => {
    if (target instanceof HTMLElement && target.dataset.label?.length) {
      const label = target.dataset.label
      const button = BUTTONS.get(label)
      if (button) {
        setState((state) => button.action(state, label))
      }
    }
  }

  return (
    <div className={cx(styles.flexColumnCenter, styles.bgBlack10, styles.w100, css.calculator)}>
      <output className={cx(css.output, styles.w100, styles.cWhite10)}>{state}</output>
      <section className={cx(css.keypad, styles.w100)} onClick={handleButtonClick}>
        {Array.from(BUTTONS.values()).map((button) => (
          <button
            disabled={state === INVALID_VALUE && button.label !== 'AC'}
            key={button.label}
            className={cx(css.button, styles.bNone, styles.cWhite10, styles.br128)}
            data-label={button.label}
          >
            {button.label}
          </button>
        ))}
      </section>
    </div>
  )
}
