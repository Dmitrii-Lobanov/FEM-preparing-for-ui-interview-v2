import { AbstractComponent } from '../../00-abstract-component/component'
import css from './calculator.module.css'
import flex from '@course/styles'
import cx from '@course/cx'

interface ICalculatorState {
  value: string
}

import { BUTTONS, INVALID_VALUE } from './calculator.utils'

export class Calculator extends AbstractComponent<{}> {
  state: ICalculatorState = {
    value: '0',
  }

  onButtonClick(e: Event) {
    const target = e.target as HTMLElement
    const label = target.dataset.label

    if (label) {
      const button = BUTTONS.get(label)
      if (button) {
        this.state.value = button.action(this.state.value, label)
        this.updateDisplay()
      }
    }
  }

  updateDisplay() {
    const output = this.container?.querySelector(`.${css.output}`)
    if (output) {
      output.textContent = this.state.value
    }
    this.updateButtonStates()
  }

  updateButtonStates() {
    if (this.state.value === INVALID_VALUE) {
      const buttons = this.container?.querySelectorAll(`.${css.button}`)
      buttons?.forEach((btn) => {
        if ((btn as HTMLElement).dataset.label !== 'AC') {
          ; (btn as HTMLButtonElement).disabled = true
        }
      })
    } else {
      const buttons = this.container?.querySelectorAll(`.${css.button}:disabled`)
      buttons?.forEach((btn) => {
        ; (btn as HTMLButtonElement).disabled = false
      })
    }
  }

  toHTML() {
    return `
            <div class="${cx(flex.bgBlack10, flex.w100, css.calculator)}">
                <output class="${cx(flex.w100, flex.cWhite10, css.output)}">${this.state.value}</output>
                <section class="${cx(css.keypad, flex.w100)}">
                    ${Array.from(BUTTONS.values())
        .map(
          (btn) => `
                        <button 
                            class="${cx(flex.bNone, flex.cWhite10, flex.br128, css.button)}" 
                            data-label="${btn.label}"
                            ${this.state.value === INVALID_VALUE && btn.label !== 'AC' ? 'disabled' : ''}
                        >
                            ${btn.label}
                        </button>
                    `,
        )
        .join('')}
                </section>
            </div>
        `
  }

  afterRender() {
    this.container
      ?.querySelector(`.${css.keypad}`)
      ?.addEventListener('click', this.onButtonClick.bind(this))
  }
}
