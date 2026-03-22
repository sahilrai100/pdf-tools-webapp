function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

function getFileIcon(filename) {
  const ext = getExtension(filename);
  const icons = {
    pdf: '📄',
    docx: '📝', doc: '📝',
    jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️', webp: '🖼️',
    zip: '📦',
  };
  return icons[ext] || '📎';
}

window.utils = { formatBytes, getExtension, getFileIcon };

// ── Floating back button (auto-inject on all tool pages) ──
(function () {
  // Only show on tool pages (not homepage)
  if (window.location.pathname === '/' || window.location.pathname === '/index.html') return;

  // Create button
  const btn = document.createElement('a');
  btn.href = '/';
  btn.className = 'float-back-btn';
  btn.setAttribute('title', 'Back to All Tools');
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
    All Tools
  `;
  document.body.appendChild(btn);

  // Show after user scrolls down 120px
  window.addEventListener('scroll', function () {
    if (window.scrollY > 120) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }, { passive: true });
})();
