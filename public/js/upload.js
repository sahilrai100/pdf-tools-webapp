class UploadZone {
  constructor(options) {
    this.dropZone = document.getElementById(options.dropZoneId);
    this.fileInput = document.getElementById(options.fileInputId);
    this.fileList = document.getElementById(options.fileListId);
    this.accept = options.accept || '*';
    this.multiple = options.multiple !== false;
    this.maxFiles = options.maxFiles || 20;
    this.maxSizeMB = options.maxSizeMB || 50;
    this.onFilesChanged = options.onFilesChanged || (() => {});
    this.files = [];
    this._init();
  }

  _init() {
    const dz = this.dropZone;

    dz.addEventListener('click', (e) => {
      if (!e.target.closest('.remove-btn')) this.fileInput.click();
    });

    dz.addEventListener('dragover', (e) => {
      e.preventDefault();
      dz.classList.add('drag-over');
    });

    dz.addEventListener('dragleave', () => dz.classList.remove('drag-over'));

    dz.addEventListener('drop', (e) => {
      e.preventDefault();
      dz.classList.remove('drag-over');
      this._addFiles(Array.from(e.dataTransfer.files));
    });

    this.fileInput.addEventListener('change', () => {
      this._addFiles(Array.from(this.fileInput.files));
      this.fileInput.value = '';
    });
  }

  _addFiles(newFiles) {
    for (const file of newFiles) {
      if (this.files.length >= this.maxFiles) {
        notify.error(`Maximum ${this.maxFiles} files allowed.`);
        break;
      }
      if (file.size > this.maxSizeMB * 1024 * 1024) {
        notify.error(`${file.name} exceeds ${this.maxSizeMB}MB limit.`);
        continue;
      }
      if (!this.multiple) this.files = [];
      this.files.push(file);
    }
    this._render();
    this.onFilesChanged(this.files);
  }

  _render() {
    if (!this.fileList) return;
    this.fileList.innerHTML = '';

    if (this.files.length === 0) {
      this.dropZone.classList.remove('has-files');
      return;
    }

    this.dropZone.classList.add('has-files');

    this.files.forEach((file, index) => {
      const item = document.createElement('div');
      item.className = 'file-item';
      item.innerHTML = `
        <span class="file-icon">${utils.getFileIcon(file.name)}</span>
        <span class="file-name" title="${file.name}">${file.name}</span>
        <span class="file-size">${utils.formatBytes(file.size)}</span>
        <button class="remove-btn" data-index="${index}" title="Remove">✕</button>
      `;
      item.querySelector('.remove-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        this.files.splice(index, 1);
        this._render();
        this.onFilesChanged(this.files);
      });
      this.fileList.appendChild(item);
    });
  }

  getFiles() { return this.files; }
  reset() { this.files = []; this._render(); this.onFilesChanged([]); }
}

window.UploadZone = UploadZone;
