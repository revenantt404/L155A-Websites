import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { STAGES, DOWNLOADS } from '@/data/stages';

interface Cmd {
  id: string;
  label: string;
  hint: string;
  run: () => void | Promise<void>;
}

const go = (hash: string) => {
  const el = document.querySelector(hash);
  if (el) el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  history.replaceState(null, '', hash);
};

const download = (href: string, file: string) => {
  const a = document.createElement('a');
  a.href = href;
  a.download = file;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const [note, setNote] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const cmds: Cmd[] = useMemo(
    () => [
      ...DOWNLOADS.map((d) => ({
        id: `dl-${d.kind}`,
        label: `Download ${d.label}`,
        hint: `${d.file} · ${d.size}`,
        run: () => download(d.href, d.file),
      })),
      {
        id: 'hash',
        label: 'Copy SHA-256 · setup x64',
        hint: 'copy',
        run: async () => {
          try {
            await navigator.clipboard.writeText(DOWNLOADS[0].sha256);
            setNote('SHA-256 copied');
          } catch {
            setNote('Clipboard blocked');
          }
        },
      },
      ...STAGES.map((s) => ({ id: s.id, label: `Go to ${s.name}`, hint: s.log, run: () => go(`#${s.id}`) })),
      { id: 'top', label: 'Back to top', hint: 'boot.log', run: () => go('#top') },
    ],
    [],
  );

  const list = cmds.filter((c) => (c.label + ' ' + c.hint).toLowerCase().includes(q.trim().toLowerCase()));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('l155a:palette', onOpen);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('l155a:palette', onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      lastFocus.current = document.activeElement as HTMLElement;
      setQ('');
      setIdx(0);
      setNote('');
      requestAnimationFrame(() => input.current?.focus());
    } else {
      lastFocus.current?.focus?.();
    }
  }, [open]);

  const exec = async (c: Cmd | undefined) => {
    if (!c) return;
    await c.run();
    if (c.id === 'hash') {
      setTimeout(() => setOpen(false), 700);
    } else setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh] bg-black/70" onMouseDown={() => setOpen(false)}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-full max-w-[560px] bg-surface-card border border-white/[0.13] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)] font-mono"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
          else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setIdx((i) => Math.min(list.length - 1, i + 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setIdx((i) => Math.max(0, i - 1));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            exec(list[idx]);
          } else if (e.key === 'Tab') e.preventDefault();
        }}
      >
        <div className="flex items-center gap-3 px-4 h-12 border-b border-white/[0.07]">
          <Search className="w-4 h-4 text-foreground-muted shrink-0" aria-hidden="true" />
          <span className="text-foreground-muted text-[13px]" aria-hidden="true">
            &gt;
          </span>
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setIdx(0);
            }}
            placeholder="type a command"
            aria-label="Search commands"
            aria-controls="cmd-list"
            aria-activedescendant={list[idx] ? `cmd-${list[idx].id}` : undefined}
            className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-foreground-muted outline-none"
            style={{ outline: 'none' }}
          />
          <kbd className="key">Esc</kbd>
        </div>
        <ul id="cmd-list" role="listbox" className="max-h-[320px] overflow-y-auto py-1.5">
          {list.length === 0 && <li className="px-4 py-6 text-[12px] text-foreground-muted">No command matches “{q}”.</li>}
          {list.map((c, i) => (
            <li
              key={c.id}
              id={`cmd-${c.id}`}
              role="option"
              aria-selected={i === idx}
              onMouseEnter={() => setIdx(i)}
              onClick={() => exec(c)}
              className={`mx-1.5 px-3 py-2 grid grid-cols-[1rem_minmax(0,1fr)] sm:grid-cols-[1rem_minmax(0,1fr)_auto] gap-2 items-baseline cursor-pointer text-[12px] ${
                i === idx ? 'bg-white/[0.07] text-foreground' : 'text-foreground-secondary'
              }`}
            >
              <span className="text-[#F59E0B]" aria-hidden="true">
                {i === idx ? '›' : ''}
              </span>
              <span className="truncate">{c.label}</span>
              <span className="hidden sm:inline text-[11px] text-foreground-muted truncate max-w-[14rem]">{c.hint}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-between px-4 h-9 border-t border-white/[0.07] text-[11px] text-foreground-muted">
          <span>↑↓ move · Enter run</span>
          <span className="st-ok" aria-live="polite">
            {note}
          </span>
        </div>
      </div>
    </div>
  );
}
