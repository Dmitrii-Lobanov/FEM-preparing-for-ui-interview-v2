import { AbstractComponent, type TComponentConfig } from '@course/utils'
import flex from '@course/styles'
import cx from '@course/cx'
import css from './tabs.module.css'

export type TTabProps = {
  name: string
  content: string
}

export type TTabsProps = {
  target?: HTMLElement
  defaultTab?: string
  tabs: TTabProps[]
}

/**
 * Expected input:
 * {
 *   "tabs": [
 *     { "name": "Tab 1", "content": "<p>Content for tab 1</p>" },
 *     { "name": "Tab 2", "content": "<p>Content for tab 2</p>" }
 *   ],
 *   "defaultTab": "Tab 1",
 *   "target": HTMLElement (optional, external container for tab content)
 * }
 *
 * Step 1: Extend AbstractComponent<TTabsProps>
 * - Call super() with config, adding listeners: ['click']
 * - Store the default tab name (from config.defaultTab or first tab's name)
 */
export class Tabs extends AbstractComponent<TTabsProps> {
  value: string

  constructor(config: TComponentConfig<TTabsProps>) {
    super({
      ...config,
      listeners: ['click'],
    })

    this.value = config.defaultTab || config.tabs[0].name
  }

  /**
   * Step 2: Implement toHTML
   * - Render a <nav> with a <ul> containing tab buttons (use getTab helper)
   * - If no external target, render a <section> for the content panel
   * - Use cx() and flex utilities for layout (flexRowStart, flexGap16)
   *
   * ARIA attributes for toHTML:
   * - <ul>: role="tablist" — identifies the tab control container
   * - <li>: role="presentation" — removes list item semantics
   * - <section>: role="tabpanel" — identifies the content area as a tab panel
   * - <section>: id="tab-panel" — referenced by aria-controls on each tab button
   * - <section>: aria-labelledby="tab-{defaultTab}" — links panel to the active tab
   */
  toHTML(): string {
    const tabs = this.config.tabs.map((tab) => this.getTab(tab)).join('')

    const panel = this.config.target
      ? ''
      : `
      <section id="tab-panel" role="tabpanel" aria-labelledby="tab-${this.value}">
        ${this.config.tabs.find((tab) => tab.name === this.value)?.content}
      </section>
    `

    return `
      <ul role="tablist" class="${cx(flex.flexRowGap8)}">
        ${tabs}
      </ul>
      ${panel}
    `
  }

  /**
   * ARIA attributes for getTab (<button>):
   * - role="tab" — identifies the button as a tab control
   * - id="tab-{name}" — unique id linked by aria-labelledby on the panel
   * - aria-controls="tab-panel" — points to the content panel's id
   * - aria-selected="false" — indicates whether this tab is active
   * - data-tab="{name}" — used for click handling (not ARIA)
   */
  getTab({ name }: TTabProps) {
    return `
      <li>
        <button 
          id="${name}" 
          role="tab" 
          aria-controls="tab-panel"
          aria-selected="${this.value === name}"
          data-tab="${name}"
        >
          ${name}
        </button>
      </li>
    `
  }

  /**
   * Step 3: Implement afterRender
   * - If no external target, query the content container from this.container
   * - Activate the default tab
   */
  afterRender(): void {
    this.activate(this.value)
  }

  /**
   * Step 4: Implement activate
   * - Update aria-selected on all tab buttons (true for active, false for others)
   * - Update the content panel's innerHTML and aria-labelledby="tab-{tabName}"
   */
  activate(tab: string) {
    const element = this.config.target ?? document.getElementById('tab-panel')

    const content = this.config.tabs.find((t) => t.name === tab)

    if (!element || !content) return

    element.innerHTML = content.content
    element.setAttribute('aria-labelledby', `tab-${tab}`)

    this.value = tab
  }

  /**
   * Step 5: Implement onClick
   * - Find the closest <button> from event.target
   * - Read data-tab attribute
   * - If tab name changed, activate the new tab
   */
  onClick({ target }: MouseEvent): void {
    if (target instanceof HTMLButtonElement && target.dataset.tab) {
      const tab = target.dataset.tab
      this.activate(tab)
    }
  }
}
