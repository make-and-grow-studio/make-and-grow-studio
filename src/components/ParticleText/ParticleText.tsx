import { useEffect, useRef } from 'react';
import { useIsTouch, useMediaQuery, useReducedMotion } from '../../lib/env';
import s from './ParticleText.module.css';

type Props = {
  /** Each entry is one line of the headline. */
  lines: string[];
  /** Index of the line drawn in the brand colour. */
  accentLine?: number;
  /** Words the last line cycles through; the field morphs between them. */
  cycle?: string[];
  /**
   * Narrow-screen variants. The type is fitted to the box, so long lines
   * force a small size — a phone needs its own, shorter breaks to keep the
   * headline big.
   */
  linesSm?: string[];
  cycleSm?: string[];
  cycleEvery?: number;
  className?: string;
  /** Screen-reader / no-JS text. */
  label: string;
};

type Field = { xs: Float32Array; ys: Float32Array; accent: Uint8Array; count: number };

/* Dot pitch, derived from the rendered type rather than fixed.
   A flat 4px stride is right at desktop size, but the headline rasterises
   near 55px on a phone — barely nine dots across a cap height, which reads
   as a low-resolution sign rather than a dot-matrix. The sampler indexes
   raw pixels, so the stride has to stay a whole number. The clamp keeps
   desktop at exactly the 4 it already used. */
const GAP_DIVISOR = 26;
const GAP_MIN = 2;
const GAP_MAX = 4;

/* Dot diameter as a fraction of the pitch. Holds the ink-to-paper ratio
   steady, so a finer grid gives finer dots instead of fat ones overlapping
   into solid letterforms. */
const DOT_RATIO = 0.65;

/* The pointer's reach, as a multiple of the rendered type size rather than a
   fixed pixel count. The headline runs from 80px to 168px across desktop
   widths, so a constant radius carves a hole the size of a whole word on a
   laptop and a smudge on a large monitor. Scaling it keeps the disturbance
   the same size *relative to the letters* everywhere. */
const REPEL_RATIO = 1.35;
const REPEL_MIN = 150;
const REPEL_FORCE = 5.2;

/**
 * The headline, rendered as a field of dots rather than as type.
 *
 * Text is drawn to an offscreen canvas, sampled on a grid, and every inked
 * cell becomes a particle that springs to its home position. The pointer
 * pushes them out of the way; the cycling word is a morph, with each dot
 * flying to its new home rather than the word being swapped.
 */
export default function ParticleText({
  lines: linesLg,
  accentLine,
  cycle: cycleLg,
  linesSm,
  cycleSm,
  cycleEvery = 3800,
  className,
  label,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isTouch = useIsTouch();
  const reduced = useReducedMotion();
  const wide = useMediaQuery('(min-width: 900px)');

  const lines = !wide && linesSm ? linesSm : linesLg;
  const cycle = !wide && cycleSm ? cycleSm : cycleLg;
  const accentIdx = accentLine ?? lines.length - 1;

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Offscreen surface we rasterise the type onto before sampling it.
    const off = document.createElement('canvas');
    const offCtx = off.getContext('2d', { willReadFrequently: true });
    if (!offCtx) return;

    let dpr = 1;
    let w = 0;
    let h = 0;
    let raf = 0;
    let disposed = false;

    // Particle pool. Sized on first build, grown if a later word needs more.
    let px = new Float32Array(0);
    let py = new Float32Array(0);
    let vx = new Float32Array(0);
    let vy = new Float32Array(0);
    let tx = new Float32Array(0);
    let ty = new Float32Array(0);
    let accent = new Uint8Array(0);
    let alive = new Float32Array(0); // 0..1, fades dots in and out on a morph
    let pool = 0;
    let active = 0;

    const pointer = { x: -9999, y: -9999, on: false };

    // Canvas text does not wrap — an oversized line simply runs off the
    // edge. So the size is fitted to the box once per layout, measured
    // against every line *and* every word the last line can cycle to, and
    // then held fixed. Fitting per word instead would resize the whole
    // headline on each morph.
    let fittedSize = 0;
    /* Both follow fittedSize, set in fit() before anything samples or draws. */
    let gap = GAP_MAX;
    let dotSize = GAP_MAX * DOT_RATIO;

    const fit = () => {
      // Derived from the measured box, never from --pt-size. That property
      // is unregistered, so getPropertyValue hands back the literal
      // "clamp(...)" string rather than a resolved length — parseFloat gives
      // NaN and the whole field silently rasterises at the fallback size.
      // The box height is the real constraint, so use it directly.
      let size = (h * 0.9) / (lines.length * 0.88);

      // Then pull it in further if any line — including every word the last
      // line can morph to — would run off the edge. Canvas text never wraps.
      const availW = Math.max(1, w) * 0.985;
      offCtx.font = `700 ${size}px "Archivo", system-ui, sans-serif`;
      const candidates = [...lines, ...(cycle ?? [])];
      let widest = 1;
      for (const line of candidates) {
        widest = Math.max(widest, offCtx.measureText(line).width);
      }
      if (widest > availW) size *= availW / widest;

      fittedSize = size;
      gap = Math.max(GAP_MIN, Math.min(GAP_MAX, Math.round(size / GAP_DIVISOR)));
      dotSize = gap * DOT_RATIO;
    };

    /** Rasterise the given lines and return every inked cell. */
    const sample = (renderLines: string[]): Field => {
      const fontSize = fittedSize;
      const lineHeight = fontSize * 0.88;
      const font = `700 ${fontSize}px "Archivo", system-ui, sans-serif`;

      off.width = Math.max(1, Math.round(w));
      off.height = Math.max(1, Math.round(h));
      offCtx.clearRect(0, 0, off.width, off.height);
      offCtx.font = font;
      offCtx.textBaseline = 'alphabetic';
      offCtx.fillStyle = '#000';

      const blockH = lineHeight * renderLines.length;
      const top = (h - blockH) / 2;

      renderLines.forEach((line, i) => {
        // Baseline sits ~0.78 down the line box for this face.
        offCtx.fillText(line, 0, top + lineHeight * i + lineHeight * 0.78);
      });

      const data = offCtx.getImageData(0, 0, off.width, off.height).data;
      const xs: number[] = [];
      const ys: number[] = [];
      const acc: number[] = [];

      for (let y = 0; y < off.height; y += gap) {
        const lineIndex = Math.floor((y - top) / lineHeight);
        const isAccent = lineIndex === accentIdx ? 1 : 0;
        for (let x = 0; x < off.width; x += gap) {
          // Alpha channel of this pixel.
          if (data[(y * off.width + x) * 4 + 3] > 128) {
            xs.push(x);
            ys.push(y);
            acc.push(isAccent);
          }
        }
      }

      return {
        xs: Float32Array.from(xs),
        ys: Float32Array.from(ys),
        accent: Uint8Array.from(acc),
        count: xs.length,
      };
    };

    const grow = (n: number) => {
      if (n <= pool) return;
      const next = Math.ceil(n * 1.25);
      const copy = (old: Float32Array) => {
        const a = new Float32Array(next);
        a.set(old);
        return a;
      };
      px = copy(px);
      py = copy(py);
      vx = copy(vx);
      vy = copy(vy);
      tx = copy(tx);
      ty = copy(ty);
      alive = copy(alive);
      const a = new Uint8Array(next);
      a.set(accent);
      accent = a;
      pool = next;
    };

    /** Point the pool at a new field. Existing dots fly to new homes. */
    const retarget = (field: Field, seed: boolean) => {
      grow(field.count);
      for (let i = 0; i < field.count; i++) {
        tx[i] = field.xs[i];
        ty[i] = field.ys[i];
        accent[i] = field.accent[i];
        if (seed || alive[i] === 0) {
          // New dots arrive from a scatter rather than popping in.
          px[i] = field.xs[i] + (Math.random() - 0.5) * (seed ? 320 : 160);
          py[i] = field.ys[i] + (Math.random() - 0.5) * (seed ? 320 : 160);
          vx[i] = 0;
          vy[i] = 0;
        }
      }
      active = field.count;
    };

    let currentWord = 0;
    const linesFor = (wordIndex: number) =>
      cycle ? [...lines.slice(0, -1), cycle[wordIndex % cycle.length]] : lines;

    const measure = () => {
      const r = wrap.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const rebuild = (seed = false) => {
      measure();
      fit();
      retarget(sample(linesFor(currentWord)), seed);
    };

    const styles = getComputedStyle(document.documentElement);
    const inkColor = styles.getPropertyValue('--ink').trim() || '#101e28';
    const brandColor = styles.getPropertyValue('--brand').trim() || '#e4551c';

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // Two passes so the canvas only switches fillStyle twice per frame.
      for (let pass = 0; pass < 2; pass++) {
        ctx.fillStyle = pass === 0 ? inkColor : brandColor;
        ctx.beginPath();
        for (let i = 0; i < active; i++) {
          if (accent[i] !== pass) continue;
          if (alive[i] < 0.05) continue;
          ctx.rect(px[i] - dotSize / 2, py[i] - dotSize / 2, dotSize, dotSize);
        }
        ctx.fill();
      }
    };

    const step = () => {
      if (disposed) return;
      raf = requestAnimationFrame(step);

      const pxr = pointer.x;
      const pyr = pointer.y;
      const on = pointer.on;

      // Once per frame, not per particle — fittedSize only moves on resize.
      const repelR = Math.max(REPEL_MIN, fittedSize * REPEL_RATIO);
      const repelR2 = repelR * repelR;

      for (let i = 0; i < active; i++) {
        // Spring toward home.
        let ax = (tx[i] - px[i]) * 0.14;
        let ay = (ty[i] - py[i]) * 0.14;

        if (on) {
          const dx = px[i] - pxr;
          const dy = py[i] - pyr;
          const d2 = dx * dx + dy * dy;
          if (d2 < repelR2 && d2 > 0.01) {
            // Smooth quadratic falloff, not inverse-square. Inverse-square
            // evacuates everything inside the radius at once and leaves a
            // hard-edged circular hole; this lets the type bend around the
            // pointer and stay legible.
            const d = Math.sqrt(d2);
            const k = 1 - d / repelR;
            const f = REPEL_FORCE * k * k;
            ax += (dx / d) * f;
            ay += (dy / d) * f;
          }
        }

        vx[i] = (vx[i] + ax) * 0.76;
        vy[i] = (vy[i] + ay) * 0.76;
        px[i] += vx[i];
        py[i] += vy[i];

        if (alive[i] < 1) alive[i] = Math.min(1, alive[i] + 0.06);
      }

      draw();
    };

    const onPointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
      pointer.on = true;
    };
    const onLeave = () => {
      pointer.on = false;
      pointer.x = -9999;
      pointer.y = -9999;
    };

    let cycleTimer = 0;
    const startCycle = () => {
      if (!cycle || cycle.length < 2) return;
      cycleTimer = window.setInterval(() => {
        currentWord++;
        retarget(sample(linesFor(currentWord)), false);
      }, cycleEvery);
    };

    const ro = new ResizeObserver(() => rebuild(false));

    // Sampling before the real face lands would rasterise the fallback.
    const ready = document.fonts?.ready ?? Promise.resolve();
    ready.then(() => {
      if (disposed) return;
      rebuild(true);

      if (reduced) {
        // Settle straight onto the target positions and draw once.
        for (let i = 0; i < active; i++) {
          px[i] = tx[i];
          py[i] = ty[i];
          alive[i] = 1;
        }
        draw();
        ro.observe(wrap);
        return;
      }

      raf = requestAnimationFrame(step);
      ro.observe(wrap);
      startCycle();
      if (!isTouch) {
        window.addEventListener('pointermove', onPointer, { passive: true });
        document.documentElement.addEventListener('pointerleave', onLeave);
      }
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      clearInterval(cycleTimer);
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [lines, accentIdx, cycle, cycleEvery, isTouch, reduced]);

  return (
    <div ref={wrapRef} className={`${s.wrap} ${className ?? ''}`}>
      <canvas ref={canvasRef} className={s.canvas} aria-hidden="true" />
      <h1 className={s.srOnly}>{label}</h1>
    </div>
  );
}
