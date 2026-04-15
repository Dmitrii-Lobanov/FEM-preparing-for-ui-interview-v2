import { AbstractComponent, type TComponentConfig } from '@course/utils'
import css from './toast.module.css'
import flex from '@course/styles'
import cx from '@course/cx'

type TToastItem = {
  id: string
  text: string
}

/**
 * Expected usage:
 *   const toast = new Toast({ root: containerElement })
 *   toast.render()
 *   toast.toast({ id: '1', text: 'Hello' })
 *
 * Toast item: { id: '1', text: 'Vanilla Toast: 1' }
 */
let toastInstanceID = 0
const TIMEOUT = 3000

export class Toast extends AbstractComponent<object> {
  id = toastInstanceID++
  listElement: HTMLUListElement | null = null
  // Step 1: Constructor — pass listeners: ['animationend'], store a unique instance id
  // Step 2: toast(item) — create a DOM element from getToastTemplate(item),
  //   append it to this.listElement,
  //   setTimeout(3000) to swap fadeIn→fadeOut class and set data-removed='true'
  // Step 3: onAnimationend(event) — if target.dataset.removed === 'true', remove the element from DOM
  // Step 4: toHTML() — return a <ul> with unique id, aria-live="polite", toast-list class
  // Step 5: getToastTemplate(item) — return <li> with role="status", data-removed="false",
  //   data-id, fadeIn class, containing <div class="toast"><p>{text}</p></div>
  // Step 6: afterRender() — store reference to the <ul> element via document.getElementById
  constructor(config: TComponentConfig<object>) {
    super({
      ...config,
      listeners: ['animationend']
    })
  }

  toHTML() {
    return `<ul aria-live="polite" aria-relevant="additions removals" id="toast-instance-${this.id}"></ul>`
  }

  getToastItem(item: TToastItem) {
    return `
      <li role="status" data-removed="false" data-id="${item.id}" id="${item.id}" class="${css.toast}">
        <p>${item.text}</p>
      </li>
    `
  }

  afterRender() {
    this.listElement = document.getElementById(`toast-instance-${this.id}`) as HTMLUListElement
  }

  onAnimationend(event: AnimationEvent) {
    const element = event.target as HTMLLIElement
    if (element.dataset.removed === 'true') {
      element.remove()
    }
  }

  toast({id, text}: TToastItem) {
    const wrapper = document.createElement('div')
    wrapper.innerHTML = this.getToastItem({id, text})
    const element = wrapper.firstElementChild!
    this.listElement?.appendChild(element)
    
    element.classList.add(css.fadeIn);
    
    setTimeout(() => {
      element.classList.remove(css.fadeIn)
      element.classList.add(css.fadeOut)
      element.dataset.removed = 'true'
    }, TIMEOUT)
  }
}
