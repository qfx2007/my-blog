type ProjectThreadWindow = Window & {
  __navfolioProjectThreadCleanup?: () => void;
  __navfolioProjectThreadEvents?: boolean;
};

type ProjectDotPosition = {
  x: number;
  y: number;
};

const getProjectThreadWindow = (): ProjectThreadWindow => window as ProjectThreadWindow;

const clearProjectThread = (): void => {
  const projectWindow = getProjectThreadWindow();

  projectWindow.__navfolioProjectThreadCleanup?.();
  projectWindow.__navfolioProjectThreadCleanup = undefined;
};

const getDotPositions = (stream: HTMLElement): ProjectDotPosition[] => {
  const streamBox = stream.getBoundingClientRect();
  const dots = Array.from(stream.querySelectorAll('[data-project-dot]')).filter(
    (dot): dot is HTMLElement => dot instanceof HTMLElement && dot.getClientRects().length > 0,
  );

  return dots.map((dot) => {
    const dotBox = dot.getBoundingClientRect();

    return {
      x: dotBox.left + dotBox.width / 2 - streamBox.left,
      y: dotBox.top + dotBox.height / 2 - streamBox.top + 28,
    };
  });
};

const buildProjectThreadPath = (dots: ProjectDotPosition[]): string => {
  if (dots.length < 2) {
    return '';
  }

  const commands = [`M ${dots[0].x.toFixed(2)} ${dots[0].y.toFixed(2)}`];

  for (let index = 0; index < dots.length - 1; index += 1) {
    const previous = dots[index - 1] ?? dots[index];
    const current = dots[index];
    const next = dots[index + 1];
    const after = dots[index + 2] ?? next;
    const segmentGap = Math.max(44, Math.abs(next.y - current.y));
    const smoothness = Math.min(0.24, 34 / segmentGap);
    const c1x = current.x + (next.x - previous.x) * smoothness;
    const c1y = current.y + (next.y - previous.y) * smoothness;
    const c2x = next.x - (after.x - current.x) * smoothness;
    const c2y = next.y - (after.y - current.y) * smoothness;

    commands.push(
      `C ${c1x.toFixed(2)} ${c1y.toFixed(2)}, ${c2x.toFixed(2)} ${c2y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`,
    );
  }

  return commands.join(' ');
};

const mountCurrentProjectThread = (): void => {
  clearProjectThread();

  const stream = document.querySelector<HTMLElement>('.project-stream');
  const svg = stream?.querySelector<SVGSVGElement>('.project-thread');
  const path = svg?.querySelector<SVGPathElement>('[data-project-thread-path]');
  const grain = svg?.querySelector<SVGPathElement>('[data-project-thread-grain]');

  if (!stream || !svg || !path || !grain) {
    return;
  }

  const drawProjectThread = (): void => {
    const streamBox = stream.getBoundingClientRect();
    const line = buildProjectThreadPath(getDotPositions(stream));

    svg.setAttribute('viewBox', `0 0 ${streamBox.width} ${streamBox.height + 52}`);
    path.setAttribute('d', line);
    grain.setAttribute('d', line);
  };

  const scheduleDraw = (): void => {
    window.requestAnimationFrame(drawProjectThread);
  };
  const resizeObserver = 'ResizeObserver' in window ? new ResizeObserver(scheduleDraw) : null;

  scheduleDraw();
  window.addEventListener('load', scheduleDraw, { once: true });
  window.addEventListener('resize', scheduleDraw);
  resizeObserver?.observe(stream);

  getProjectThreadWindow().__navfolioProjectThreadCleanup = () => {
    window.removeEventListener('resize', scheduleDraw);
    resizeObserver?.disconnect();
  };
};

export const mountProjectThread = (): void => {
  const projectWindow = getProjectThreadWindow();

  if (!projectWindow.__navfolioProjectThreadEvents) {
    projectWindow.__navfolioProjectThreadEvents = true;
    document.addEventListener('astro:page-load', mountCurrentProjectThread);
    document.addEventListener('astro:before-swap', clearProjectThread);
    window.addEventListener('pagehide', clearProjectThread);
  }

  mountCurrentProjectThread();
};
