import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { DOWNLOADS, TOTAL_SIZE } from '@/data/stages';

export default function DownloadManifest() {
  const [copied, setCopied] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const copy = async (file: string, sha256: string) => {
    try {
      await navigator.clipboard.writeText(sha256);
      setCopied(file);
      setFailed(false);
    } catch {
      setFailed(true);
    }
    setTimeout(() => setCopied(null), 2200);
  };

  return (
    <div className="font-mono">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 pb-2.5 border-b border-background/25 text-[11px] text-background/65">
        <span>downloads · REV 2 · x64</span>
        <span className="tabular-nums">{DOWNLOADS.length} artifacts · {TOTAL_SIZE}</span>
      </div>

      <ol className="divide-y divide-background/[0.12]">
        {DOWNLOADS.map((d, i) => (
          <li
            key={d.file}
            className="relative grid grid-cols-[1.75rem_minmax(0,1fr)_auto] sm:grid-cols-[1.75rem_5.75rem_minmax(0,1fr)_4.75rem_auto] items-center gap-x-3 py-3.5 hover:bg-background/[0.045] transition-colors"
          >
            <span className="text-[11px] tabular-nums text-background/50" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>

            <span className="hidden sm:inline text-[10px] uppercase tracking-[0.16em] text-background/60">{d.kind}</span>

            <span className="min-w-0">
              <span className="block truncate text-[12px] sm:text-[13px] text-background">{d.file}</span>
              <span className="sm:hidden mt-0.5 flex gap-x-2 text-[10px] uppercase tracking-[0.14em] text-background/55">
                <span>{d.kind}</span>
                <span className="tabular-nums normal-case tracking-normal">{d.size}</span>
              </span>
            </span>

            <span className="hidden sm:block text-[11px] text-background/65 text-right tabular-nums">{d.size}</span>

            <span className="relative z-10 flex items-center gap-1">
              <button
                type="button"
                onClick={() => copy(d.file, d.sha256)}
                title={`Copy SHA-256 for ${d.file}`}
                aria-label={`Copy SHA-256 for ${d.file}`}
                className="inline-flex items-center justify-center w-7 h-7 border border-background/25 text-background/70 hover:text-background hover:border-background/60 transition-colors"
              >
                {copied === d.file ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : <Copy className="w-3.5 h-3.5" aria-hidden="true" />}
              </button>
              <span
                className="hidden sm:inline-flex items-center justify-center w-7 h-7 border border-background/25 text-background/70"
                aria-hidden="true"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1.25v6.5M3.4 5.15 6 7.75l2.6-2.6M1.75 10.25h8.5" stroke="currentColor" stroke-width="1.25" stroke-linecap="square" />
                </svg>
              </span>
            </span>

            <a
              href={d.href}
              download={d.file}
              aria-label={`Download ${d.file}, ${d.size}`}
              className="absolute inset-0"
            />
          </li>
        ))}
      </ol>

      <div className="flex items-center justify-between gap-3 pt-2.5 text-[11px] text-background/60">
        <span>verify: sha256 · copy per row</span>
        <span aria-live="polite" className={failed ? 'text-[#991b1b]' : 'text-[#166534]'}>
          {failed ? 'clipboard blocked' : copied ? 'sha256 copied' : ''}
        </span>
      </div>
    </div>
  );
}
