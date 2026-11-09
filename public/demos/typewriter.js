const output = document.querySelector('[data-typing-output]');
const toggle = document.querySelector('[data-typing-toggle]');
const next = document.querySelector('[data-typing-next]');

const messages = ['用代码创造有趣的东西。', '把想法做成可以点击的体验。', '慢慢写，持续记录。'];
let message = 0;
let index = 0;
let paused = false;

const tick = () => {
  if (!paused) {
    output.textContent = messages[message].slice(0, index);
    index += 1;
    if (index > messages[message].length) index = 0;
  }
  setTimeout(tick, index === 0 ? 900 : 90);
};
toggle?.addEventListener('click', () => {
  paused = !paused;
  toggle.textContent = paused ? '继续' : '暂停';
});
next?.addEventListener('click', () => {
  message = (message + 1) % messages.length;
  index = 0;
});
tick();
