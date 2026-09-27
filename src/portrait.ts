import './portrait.css';

/** A cached character portrait, revealed through a soft cursor mask. */
export function setupPortrait(figure: HTMLElement, reduced: MediaQueryList): { dispose(): void } {
  const photo = figure.querySelector<HTMLImageElement>('img');
  if (!photo) return { dispose() {} };

  const canvas = document.createElement('canvas');
  canvas.className = 'portrait-ascii';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d', { alpha: true });
  const field = document.createElement('canvas');
  const fieldContext = field.getContext('2d');
  const sample = document.createElement('canvas');
  const sampleContext = sample.getContext('2d', { willReadFrequently: true });
  if (!context || !fieldContext || !sampleContext) return { dispose() {} };

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'portrait-ascii-toggle';
  button.hidden = true;
  button.setAttribute('aria-pressed', 'false');
  const icon = document.createElement('span');
  icon.className = 'icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = 'grid_view';
  const label = document.createElement('span');
  label.textContent = 'Ver retrato ASCII';
  button.append(icon, label);
  photo.after(canvas);
  figure.append(button);

  const hover = matchMedia('(hover: hover) and (pointer: fine)');
  let width = 0;
  let height = 0;
  let ratio = 1;
  let ready = false;
  let disposed = false;
  let full = false;
  let inside = false;
  let visible = true;
  let frame = 0;
  let resizeFrame = 0;
  let x = 0;
  let y = 0;
  let targetX = 0;
  let targetY = 0;
  let radius = 0;
  let targetRadius = 0;
  let lastTime = 0;
  let moveTime = 0;
  let velocity = 0;

  const baseRadius = () => Math.min(148, Math.max(90, width * 0.26));
  const stop = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    lastTime = 0;
  };

  function paint() {
    if (!context || !ready) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    if (full) {
      context.drawImage(field, 0, 0, width, height);
      return;
    }
    if (radius < 0.5) return;
    context.drawImage(field, 0, 0, width, height);
    context.globalCompositeOperation = 'destination-in';
    const feather = Math.min(28, radius * 0.25);
    const mask = context.createRadialGradient(x, y, Math.max(0, radius - feather), x, y, radius);
    mask.addColorStop(0, '#000');
    mask.addColorStop(1, 'transparent');
    context.fillStyle = mask;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'source-over';
  }

  function animate(time: number) {
    frame = 0;
    if (disposed || !visible || !ready) return;
    const elapsed = lastTime ? Math.min(50, time - lastTime) : 16.67;
    lastTime = time;
    const ease = 1 - Math.pow(0.79, elapsed / 16.67);
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    radius += (targetRadius - radius) * ease;
    paint();
    const unsettled = Math.abs(x - targetX) + Math.abs(y - targetY) + Math.abs(radius - targetRadius) > 0.2;
    if (unsettled && !reduced.matches && !full) frame = requestAnimationFrame(animate);
    else {
      x = targetX;
      y = targetY;
      radius = targetRadius;
      lastTime = 0;
      paint();
    }
  }

  function update() {
    if (!ready || disposed || !visible) return;
    if (full || reduced.matches) {
      stop();
      radius = targetRadius;
      x = targetX;
      y = targetY;
      paint();
    } else if (!frame) frame = requestAnimationFrame(animate);
  }

  function rebuild() {
    resizeFrame = 0;
    if (disposed || !photo || !photo.complete || !photo.naturalWidth || !fieldContext || !sampleContext) return;
    const bounds = photo.getBoundingClientRect();
    if (bounds.width < 1 || bounds.height < 1) return;
    width = bounds.width;
    height = bounds.height;
    ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.style.left = `${photo.offsetLeft}px`;
    canvas.style.top = `${photo.offsetTop}px`;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = field.width = Math.round(width * ratio);
    canvas.height = field.height = Math.round(height * ratio);

    // Match the original photograph's cover crop before sampling luminance.
    const scale = Math.max(width / photo.naturalWidth, height / photo.naturalHeight);
    const cropWidth = width / scale;
    const cropHeight = height / scale;
    const position = getComputedStyle(photo).objectPosition.split(' ');
    const positionFraction = (value: string | undefined) => value?.endsWith('%') ? parseFloat(value) / 100 : 0.5;
    const cropX = (photo.naturalWidth - cropWidth) * positionFraction(position[0]);
    const cropY = (photo.naturalHeight - cropHeight) * positionFraction(position[1]);
    const columns = Math.max(36, Math.min(110, Math.floor(width / 6.5)));
    const cellWidth = width / columns;
    const cellHeight = cellWidth * 1.5;
    const rows = Math.ceil(height / cellHeight);
    sample.width = columns;
    sample.height = rows;

    try {
      sampleContext.drawImage(photo, cropX, cropY, cropWidth, cropHeight, 0, 0, columns, rows);
      const pixels = sampleContext.getImageData(0, 0, columns, rows).data;
      fieldContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      fieldContext.fillStyle = '#131211';
      fieldContext.fillRect(0, 0, width, height);
      fieldContext.font = `500 ${cellHeight * 0.95}px ui-monospace, SFMono-Regular, Consolas, monospace`;
      fieldContext.textAlign = 'center';
      fieldContext.textBaseline = 'middle';
      const characters = ' .,:;+=xX#%@';
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          const pixel = (row * columns + col) * 4;
          const luminance = (pixels[pixel] * 0.2126 + pixels[pixel + 1] * 0.7152 + pixels[pixel + 2] * 0.0722) / 255;
          const value = Math.min(1, Math.max(0, (luminance - 0.04) * 1.18));
          const character = characters[Math.round(Math.pow(value, 0.78) * (characters.length - 1))];
          // A restrained red accent in midtones keeps the facial highlights clear.
          fieldContext.fillStyle = value > 0.32 && value < 0.55 && (row + col) % 5 === 0 ? '#ff476c' : value > 0.55 ? '#f2eae3' : '#d0c9c3';
          fieldContext.fillText(character, (col + 0.5) * cellWidth, (row + 0.5) * cellHeight);
        }
      }
      ready = true;
      button.hidden = false;
      figure.classList.add('portrait-ascii-ready');
      if (!inside) {
        targetX = x = width / 2;
        targetY = y = height * 0.43;
      }
      update();
    } catch {
      // The original photograph remains available if pixel access is unavailable.
      ready = false;
      button.hidden = true;
      figure.classList.remove('portrait-ascii-ready');
      context?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function scheduleRebuild() {
    if (!resizeFrame && !disposed) resizeFrame = requestAnimationFrame(rebuild);
  }

  function pointerMove(event: PointerEvent) {
    if (!photo || !ready || full || reduced.matches || !hover.matches || event.pointerType === 'touch') return;
    const bounds = photo.getBoundingClientRect();
    const nextX = event.clientX - bounds.left;
    const nextY = event.clientY - bounds.top;
    const overControl = (event.target as Element | null)?.closest('button, a');
    if (overControl || nextX < 0 || nextY < 0 || nextX > width || nextY > height) {
      pointerLeave();
      return;
    }
    const elapsed = Math.max(16, event.timeStamp - moveTime);
    velocity = Math.min(28, Math.hypot(nextX - targetX, nextY - targetY) * 16 / elapsed);
    moveTime = event.timeStamp;
    targetX = nextX;
    targetY = nextY;
    if (!inside) {
      x = targetX;
      y = targetY;
      inside = true;
      velocity = 0;
    }
    targetRadius = baseRadius() + velocity * 0.6;
    update();
  }

  function pointerLeave() {
    inside = false;
    targetRadius = 0;
    velocity = 0;
    update();
  }

  function toggle() {
    full = !full;
    button.setAttribute('aria-pressed', String(full));
    label.textContent = full ? 'Ver fotografía' : 'Ver retrato ASCII';
    icon.textContent = full ? 'image' : 'grid_view';
    figure.classList.toggle('portrait-ascii-full', full);
    targetRadius = radius = 0;
    inside = false;
    update();
  }

  function motionChange() {
    stop();
    inside = false;
    targetRadius = radius = 0;
    update();
  }

  function visibilityChange() {
    visible = !document.hidden;
    if (!visible) {
      stop();
      inside = false;
      targetRadius = radius = 0;
    } else update();
  }

  figure.addEventListener('pointerenter', pointerMove);
  figure.addEventListener('pointermove', pointerMove);
  figure.addEventListener('pointerleave', pointerLeave);
  button.addEventListener('click', toggle);
  reduced.addEventListener('change', motionChange);
  hover.addEventListener('change', motionChange);
  document.addEventListener('visibilitychange', visibilityChange);
  photo.addEventListener('load', scheduleRebuild);
  const observer = new ResizeObserver(scheduleRebuild);
  observer.observe(photo);
  // decode() safely handles cached images as well as the lazy-loaded portrait.
  void photo.decode().then(scheduleRebuild).catch(() => {
    if (photo.complete && photo.naturalWidth) scheduleRebuild();
  });

  return {
    dispose() {
      disposed = true;
      stop();
      cancelAnimationFrame(resizeFrame);
      observer.disconnect();
      figure.removeEventListener('pointerenter', pointerMove);
      figure.removeEventListener('pointermove', pointerMove);
      figure.removeEventListener('pointerleave', pointerLeave);
      button.removeEventListener('click', toggle);
      reduced.removeEventListener('change', motionChange);
      hover.removeEventListener('change', motionChange);
      document.removeEventListener('visibilitychange', visibilityChange);
      photo.removeEventListener('load', scheduleRebuild);
      figure.classList.remove('portrait-ascii-ready', 'portrait-ascii-full');
      canvas.remove();
      button.remove();
    },
  };
}
