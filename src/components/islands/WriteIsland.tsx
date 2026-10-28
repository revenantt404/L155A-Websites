import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';

const IMAGE_MB = 5400; // 5.4 GB Windows 11 installation media
const TOOLS = [
  { name: 'L155A REV 2', rate: 124.8, verify: 'CRC32 + SHA-256, inline', main: true },
  { name: 'Standard raw imager', rate: 78.5, verify: 'Post-write pass only', main: false },
  { name: 'Legacy Windows flasher', rate: 48.2, verify: 'None', main: false },
];
const SPEEDUP = 12; // 1 s on screen = 12 s of real transfer

const clock = (s: number) => {
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
};

export default function WriteIsland() {
  const [t, setT] = useState(0); // simulated seconds
  const [running, setRunning] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const raf = useRef<number>();
  const slowest = IMAGE_MB / Math.min(...TOOLS.map((x) => x.rate));

  const run = () => {
    if (raf.current) cancelAnimationFrame(raf.current);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setT(slowest);
      return;
    }
    setT(0);
    setRunning(true);
    const t0 = performance.now();
    const tick = (now: number) => {
      const sim = ((now - t0) / 1000) * SPEEDUP;
      if (sim >= slowest) {
        setT(slowest);
        setRunning(false);
        return;
      }
      setT(sim);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !started.current) {
          started.current = true;
          run();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return (
    <div ref={host} className="font-mono">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.13] text-[11px] text-foreground-muted">
        <span>5.4 GB Windows 11 media · USB 3.2 Gen 1 · replay ×{SPEEDUP}</span>
        <span className="flex items-center gap-4">
          <span className="text-foreground tabular-nums" aria-live="off">
            t+{clock(t)}
          </span>
          <button type="button" onClick={run} disabled={running} className="btn btn-sm btn-ghost !h-7 !px-2.5 !text-[11px]">
            <RotateCcw className="w-3 h-3" aria-hidden="true" />
            Replay
          </button>
        </span>
      </div>

      <ul className="divide-y divide-white/[0.07]">
        {TOOLS.map((x) => {
          const total = IMAGE_MB / x.rate;
          const p = Math.min(1, t / total);
          const done = p >= 1;
          return (
            <li key={x.name} className="py-5 grid grid-cols-1 sm:grid-cols-[13rem_minmax(0,1fr)_6.5rem] gap-x-6 gap-y-2 items-center">
              <div className="flex items-baseline gap-3 sm:block">
                <p className={`text-[13px] ${x.main ? 'text-foreground' : 'text-foreground-secondary'}`}>{x.name}</p>
                <p className="sm:mt-1 text-[11px] text-foreground-muted">verify: {x.verify}</p>
              </div>
              <div className="relative h-3 bg-white/[0.05]" aria-hidden="true">
                <div
                  className="absolute inset-y-0 left-0 origin-left"
                  style={{
                    width: '100%',
                    transform: `scaleX(${p})`,
                    background: x.main ? (done ? '#22C55E' : '#F59E0B') : done ? '#8A8F98' : '#5b5f66',
                  }}
                />
              </div>
              <div className="flex sm:flex-col items-baseline sm:items-end justify-between gap-1 text-[12px]">
                <span className={x.main ? 'text-foreground' : 'text-foreground-secondary'}>{x.rate} MB/s</span>
                <span className={`text-[11px] ${done ? (x.main ? 'st-ok' : 'text-foreground-secondary') : 'text-foreground-muted'}`}>
                  {done ? `done ${clock(total)}` : `${Math.floor(p * 100)}%`}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="sr-only">
        Measured throughput: L155A 124.8 MB/s (about 43 seconds), standard raw imager 78.5 MB/s (about 69 seconds), legacy Windows
        flasher 48.2 MB/s (about 1 minute 52 seconds).
      </p>
    </div>
  );
}
