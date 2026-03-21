class ProgressUI {
  constructor(sectionId, fillId, textId) {
    this.section = document.getElementById(sectionId);
    this.fill = document.getElementById(fillId);
    this.text = document.getElementById(textId);
  }

  show(message = 'Processing...') {
    if (this.section) this.section.classList.add('visible');
    this.update(0, message);
  }

  update(percent, message) {
    if (this.fill) this.fill.style.width = `${percent}%`;
    if (this.text) this.text.textContent = message || `${percent}%`;
  }

  hide() {
    if (this.section) this.section.classList.remove('visible');
  }

  indeterminate(message) {
    this.show(message);
    let pct = 0;
    this._interval = setInterval(() => {
      pct = pct < 85 ? pct + 2 : 85;
      this.update(pct, message);
    }, 200);
  }

  complete(message = 'Done!') {
    if (this._interval) { clearInterval(this._interval); this._interval = null; }
    this.update(100, message);
  }
}

window.ProgressUI = ProgressUI;
