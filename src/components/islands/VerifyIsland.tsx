import { useEffect, useRef, useState } from 'react';

const CELLS = 256; // each cell = one 4 MiB chunk of the image region shown
const REREAD = new Set([37, 141, 203]); // demonstration: chunks whose first read mismatched

export default function VerifyIsland() {
  const host = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'armed' | 'running' | 'done'>('armed');

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPhase('done');
      return;
    }
    let timer: number | undefined;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          io.disconnect();
          setPhase('running');
          timer = window.setTimeout(() => setPhase('done'), CELLS * 9 + 1500);
        }
      },
      { threshold: 0.45 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div ref={host} className="font-mono">
      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 text-[11px] text-foreground-muted">
        <span>chunk map · 1 cell = 4 MiB · CRC32 per chunk, SHA-256 over image</span>
        <span className="flex gap-4">
          <span className="inline-flex items-center gap-1.5">
            <i className="block w-2 h-2" style={{ background: '#22C55E' }} /> match
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="block w-2 h-2" style={{ background: '#F87171' }} /> re-read
          </span>
        </span>
      </div>

      <div
        className={`sx-grid ${phase === 'armed' ? 'is-armed' : phase === 'running' ? 'is-running' : 'is-done'}`}
        aria-hidden="true"
      >
        {Array.from({ length: CELLS }, (_, i) => (
          <span key={i} className="sx-cell" data-reread={REREAD.has(i) ? '' : undefined} style={{ ['--i' as string]: i }} />
        ))}
      </div>

      <p className="mt-4 text-[12px] text-foreground-secondary" aria-live="polite">
        {phase === 'done' ? (
          <>
            <span className="st-ok">256/256 chunks match</span>
            <span className="text-foreground-muted"> · 3 re-read and confirmed · sha256 4f82…c31b</span>
          </>
        ) : phase === 'running' ? (
          <span className="st-busy">verifying while writing…</span>
        ) : (
          <span className="text-foreground-muted">waiting for write stream</span>
        )}
      </p>
      <p className="mt-1 text-[11px] text-foreground-muted">Illustrative run. Mismatched chunks are re-read before the write is marked complete.</p>
    </div>
  );
}
