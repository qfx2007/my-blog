(() => {
  const controls = document.querySelector('[data-particle-controls]');
  const root = controls?.parentElement;
  const demo = root?.querySelector('[data-particle-demo]');
  if (!root || !demo || demo.dataset.particleReady) return;
  demo.dataset.particleReady = 'true';
  const buttons = [...root.querySelectorAll('[data-mode]')];
  const countInput = root.querySelector('[data-particle-count]');
  const countOutput = root.querySelector('[data-count]');
  let mode = root.querySelector('[data-mode].active')?.dataset.mode || 'combo';
  const updateCount = () => {
    if (countOutput && countInput) countOutput.textContent = countInput.value;
  };
  const setMode = (nextMode) => {
    mode = nextMode;
    buttons.forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  };
  buttons.forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
  countInput?.addEventListener('input', updateCount);
  updateCount();
  const burst = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = demo.getBoundingClientRect();
    const localX = (event.clientX ?? rect.left + rect.width / 2) - rect.left;
    const localY = (event.clientY ?? rect.top + rect.height / 2) - rect.top;
    if (mode === 'ring' || mode === 'combo') {
      const ring = document.createElement('i');
      ring.className = 'demo-ring';
      ring.style.left = `${localX}px`;
      ring.style.top = `${localY}px`;
      demo.append(ring);
      ring.addEventListener('animationend', () => ring.remove(), { once: true });
    }
    if (mode === 'particles' || mode === 'combo') {
      const count = Number(countInput?.value || 14);
      for (let i = 0; i < count; i += 1) {
        const particle = document.createElement('i');
        const angle = (Math.PI * 2 * i) / count;
        const distance = 32 + Math.random() * 52;
        particle.className = 'demo-particle';
        particle.style.left = `${localX}px`;
        particle.style.top = `${localY}px`;
        particle.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
        particle.style.setProperty('--y', `${Math.sin(angle) * distance}px`);
        particle.style.setProperty('--size', `${3 + Math.random() * 4}px`);
        particle.style.setProperty('--color', ['#e99b9b', '#e7b85d', '#82b894', '#82a9cf'][i % 4]);
        demo.append(particle);
        particle.addEventListener('animationend', () => particle.remove(), { once: true });
      }
    }
  };
  demo.addEventListener('click', burst);
  demo.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') burst(event);
  });
})();
