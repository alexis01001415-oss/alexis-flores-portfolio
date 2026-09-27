import './portrait.css';

const vertexSource = `
  attribute vec2 aPosition;
  varying vec2 vUv;
  void main() {
    vUv = vec2(aPosition.x * 0.5 + 0.5, 0.5 - aPosition.y * 0.5);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const fragmentSource = `
  precision mediump float;
  uniform sampler2D uPhoto;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform vec2 uVelocity;
  uniform vec4 uCrop;
  uniform float uStrength;
  varying vec2 vUv;

  vec3 photograph(vec2 uv) {
    return texture2D(uPhoto, clamp(uCrop.xy + uv * uCrop.zw, 0.001, 0.999)).rgb;
  }

  void main() {
    vec2 proportion = uResolution / min(uResolution.x, uResolution.y);
    vec2 delta = (vUv - uPointer) * proportion;
    float angle = atan(delta.y, delta.x);
    // The edge follows a slightly irregular lens, rather than a perfect circle.
    float organic = sin(angle * 3.0 + uPointer.x * 4.0) * 0.009
                  + cos(angle * 5.0 - uPointer.y * 3.0) * 0.004;
    float distance = length(delta) + organic;
    float mask = 1.0 - smoothstep(0.215, 0.325, distance);
    float alpha = mask * uStrength;
    if (alpha < 0.002) {
      gl_FragColor = vec4(0.0);
      return;
    }

    // Small, local refraction keeps the face recognizable, even during movement.
    float glass = smoothstep(0.07, 0.24, distance)
                * (1.0 - smoothstep(0.24, 0.33, distance));
    vec2 displacement = delta * (0.016 * glass) / proportion;
    displacement += uVelocity * 0.006 * mask;
    vec2 uv = vUv - displacement * uStrength;
    vec2 fringe = delta * (0.0023 * glass * uStrength) / proportion;
    vec3 color;
    color.r = photograph(uv + fringe).r;
    color.g = photograph(uv).g;
    color.b = photograph(uv - fringe).b;
    color = (color - 0.5) * 1.035 + 0.5;
    // A soft, directional reflection is confined to the glass edge.
    float reflection = glass * max(0.0, dot(normalize(delta + 0.0001), vec2(-0.6, -0.8)));
    color += vec3(0.026, 0.024, 0.022) * reflection;
    gl_FragColor = vec4(clamp(color, 0.0, 1.0), alpha);
  }
`;

/** An optional, decorative WebGL lens over the original accessible photograph. */
export function setupPortrait(figure: HTMLElement, reduced: MediaQueryList): { dispose(): void } {
  const photo = figure.querySelector<HTMLImageElement>('img');
  if (!photo) return { dispose() {} };

  const canvas = document.createElement('canvas');
  canvas.className = 'portrait-webgl';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.hidden = true;
  photo.after(canvas);

  let gl: WebGLRenderingContext | null = null;
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let texture: WebGLTexture | null = null;
  let uniforms: Record<string, WebGLUniformLocation | null> = {};
  let ready = false;
  let disposed = false;
  let failed = false;
  let inView = false;
  let frame = 0;
  let resizeFrame = 0;
  let previousTime = 0;
  let width = 1;
  let height = 1;
  let inside = false;
  let touchDown = false;
  let x = 0.5;
  let y = 0.45;
  let targetX = x;
  let targetY = y;
  let strength = 0;
  let targetStrength = 0;
  let velocityX = 0;
  let velocityY = 0;
  const available = () => inView && !document.hidden && !reduced.matches && !disposed;

  function stop() {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
  }

  function reset() {
    stop();
    inside = touchDown = false;
    strength = targetStrength = velocityX = velocityY = 0;
    if (gl && ready) gl.clear(gl.COLOR_BUFFER_BIT);
  }

  function releaseResources() {
    if (!gl) return;
    if (texture) gl.deleteTexture(texture);
    if (buffer) gl.deleteBuffer(buffer);
    if (program) gl.deleteProgram(program);
    texture = buffer = program = null;
    ready = false;
  }

  function fallback() {
    reset();
    releaseResources();
    failed = true;
    canvas.hidden = true;
    figure.classList.remove('portrait-webgl-ready');
  }

  function initialize(): boolean {
    if (gl && program) return true;
    if (failed || !available()) return false;
    try {
      gl = gl || canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false,
        powerPreference: 'low-power',
      });
      if (!gl || gl.isContextLost()) return false;
      const compile = (type: number, source: string) => {
        const shader = gl!.createShader(type);
        if (!shader) throw new Error('Portrait shader unavailable');
        gl!.shaderSource(shader, source);
        gl!.compileShader(shader);
        if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
          gl!.deleteShader(shader);
          throw new Error('Portrait shader compilation failed');
        }
        return shader;
      };
      const vertex = compile(gl.VERTEX_SHADER, vertexSource);
      let fragment: WebGLShader;
      try {
        fragment = compile(gl.FRAGMENT_SHADER, fragmentSource);
      } catch (error) {
        gl.deleteShader(vertex);
        throw error;
      }
      program = gl.createProgram();
      if (!program) throw new Error('Portrait program unavailable');
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Portrait program link failed');
      gl.useProgram(program);
      buffer = gl.createBuffer();
      texture = gl.createTexture();
      if (!buffer || !texture) throw new Error('Portrait memory unavailable');
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'aPosition');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      uniforms = Object.fromEntries(['uPhoto', 'uResolution', 'uPointer', 'uVelocity', 'uCrop', 'uStrength'].map(name => [name, gl!.getUniformLocation(program!, name)]));
      gl.uniform1i(uniforms.uPhoto, 0);
      gl.clearColor(0, 0, 0, 0);
      return true;
    } catch {
      fallback();
      return false;
    }
  }

  function draw() {
    if (!gl || !ready || !available()) return;
    gl.uniform2f(uniforms.uPointer, x, y);
    gl.uniform2f(uniforms.uVelocity, velocityX, velocityY);
    gl.uniform1f(uniforms.uStrength, strength);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  function animate(time: number) {
    frame = 0;
    if (!ready || !available()) return;
    const elapsed = previousTime ? Math.min(50, time - previousTime) : 16.67;
    previousTime = time;
    const ease = 1 - Math.exp(-elapsed / 86);
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    strength += (targetStrength - strength) * ease;
    velocityX *= 1 - ease;
    velocityY *= 1 - ease;
    draw();
    const unsettled = Math.abs(targetX - x) + Math.abs(targetY - y)
      + Math.abs(targetStrength - strength) + Math.abs(velocityX) + Math.abs(velocityY) > 0.001;
    if (unsettled) frame = requestAnimationFrame(animate);
    else {
      x = targetX;
      y = targetY;
      strength = targetStrength;
      velocityX = velocityY = previousTime = 0;
      draw();
    }
  }

  function requestDraw() {
    if (ready && available() && !frame) frame = requestAnimationFrame(animate);
  }

  function rebuild() {
    resizeFrame = 0;
    if (!available() || !photo || !photo.complete || !photo.naturalWidth) return;
    const bounds = photo.getBoundingClientRect();
    if (bounds.width < 1 || bounds.height < 1 || !initialize() || !gl) return;
    width = bounds.width;
    height = bounds.height;
    const ratio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.style.left = `${photo.offsetLeft}px`;
    canvas.style.top = `${photo.offsetTop}px`;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uniforms.uResolution, width, height);

    // Use the same object-fit: cover crop and object-position as the DOM image.
    const scale = Math.max(width / photo.naturalWidth, height / photo.naturalHeight);
    const cropWidth = width / scale / photo.naturalWidth;
    const cropHeight = height / scale / photo.naturalHeight;
    const positions = getComputedStyle(photo).objectPosition.split(' ');
    const fraction = (value: string | undefined) => value?.endsWith('%') ? parseFloat(value) / 100 : 0.5;
    gl.uniform4f(uniforms.uCrop, (1 - cropWidth) * fraction(positions[0]), (1 - cropHeight) * fraction(positions[1]), cropWidth, cropHeight);
    try {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, photo);
      ready = true;
      canvas.hidden = false;
      figure.classList.add('portrait-webgl-ready');
      draw();
    } catch {
      // A failed texture upload or cross-origin image leaves the original photo intact.
      fallback();
    }
  }

  function scheduleRebuild() {
    if (!resizeFrame && available()) resizeFrame = requestAnimationFrame(rebuild);
  }

  function move(event: PointerEvent) {
    if (!ready || !available() || !photo || (event.pointerType === 'touch' && !touchDown)) return;
    if ((event.target as Element | null)?.closest('a, button')) return leave();
    const bounds = photo.getBoundingClientRect();
    const nextX = (event.clientX - bounds.left) / width;
    const nextY = (event.clientY - bounds.top) / height;
    if (nextX < 0 || nextX > 1 || nextY < 0 || nextY > 1) return leave();
    velocityX = Math.max(-0.4, Math.min(0.4, (nextX - targetX) * 5));
    velocityY = Math.max(-0.4, Math.min(0.4, (nextY - targetY) * 5));
    targetX = nextX;
    targetY = nextY;
    if (!inside) {
      x = targetX;
      y = targetY;
      velocityX = velocityY = 0;
    }
    inside = true;
    targetStrength = 1;
    requestDraw();
  }

  function down(event: PointerEvent) {
    touchDown = true;
    move(event);
  }

  function leave() {
    inside = touchDown = false;
    targetStrength = 0;
    requestDraw();
  }

  function up(event: PointerEvent) {
    if (event.pointerType === 'touch' || event.pointerType === 'pen') leave();
  }

  function motionChange() {
    reset();
    canvas.hidden = reduced.matches || !ready;
    if (!reduced.matches) scheduleRebuild();
  }

  function visibilityChange() {
    if (document.hidden) reset();
    else scheduleRebuild();
  }

  function contextLost(event: Event) {
    event.preventDefault();
    reset();
    ready = false;
    canvas.hidden = true;
    figure.classList.remove('portrait-webgl-ready');
  }

  function contextRestored() {
    program = buffer = texture = null;
    failed = false;
    scheduleRebuild();
  }

  const resizeObserver = new ResizeObserver(scheduleRebuild);
  const intersectionObserver = new IntersectionObserver(entries => {
    inView = entries[0]?.isIntersecting ?? false;
    if (inView) scheduleRebuild();
    else reset();
  });
  resizeObserver.observe(photo);
  intersectionObserver.observe(photo);
  figure.addEventListener('pointerenter', move, { passive: true });
  figure.addEventListener('pointermove', move, { passive: true });
  figure.addEventListener('pointerdown', down, { passive: true });
  figure.addEventListener('pointerup', up, { passive: true });
  figure.addEventListener('pointerleave', leave, { passive: true });
  figure.addEventListener('pointercancel', leave, { passive: true });
  reduced.addEventListener('change', motionChange);
  document.addEventListener('visibilitychange', visibilityChange);
  photo.addEventListener('load', scheduleRebuild);
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', contextRestored);
  void photo.decode().then(scheduleRebuild).catch(() => {
    if (photo.complete && photo.naturalWidth) scheduleRebuild();
  });

  return {
    dispose() {
      disposed = true;
      stop();
      cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      figure.removeEventListener('pointerenter', move);
      figure.removeEventListener('pointermove', move);
      figure.removeEventListener('pointerdown', down);
      figure.removeEventListener('pointerup', up);
      figure.removeEventListener('pointerleave', leave);
      figure.removeEventListener('pointercancel', leave);
      reduced.removeEventListener('change', motionChange);
      document.removeEventListener('visibilitychange', visibilityChange);
      photo.removeEventListener('load', scheduleRebuild);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
      releaseResources();
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      figure.classList.remove('portrait-webgl-ready');
      canvas.remove();
    },
  };
}
