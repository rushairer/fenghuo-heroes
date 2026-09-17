const BLOCKED = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '])

export class Input {
  constructor(target = window) {
    this.target = target
    this.down = new Set()
    this.pressed = []
    this.onKeyDown = (event) => {
      if (BLOCKED.has(event.key)) event.preventDefault()
      if (!event.repeat) this.pressed.push(event.key)
      this.down.add(event.key)
    }
    this.onKeyUp = (event) => this.down.delete(event.key)
    target.addEventListener('keydown', this.onKeyDown, { passive: false })
    target.addEventListener('keyup', this.onKeyUp)
  }

  consume() {
    return this.pressed.shift() ?? null
  }

  isDown(key) {
    return this.down.has(key)
  }

  destroy() {
    this.target.removeEventListener('keydown', this.onKeyDown)
    this.target.removeEventListener('keyup', this.onKeyUp)
  }
}
