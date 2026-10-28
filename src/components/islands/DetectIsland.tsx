import { useState } from 'react';
import { Lock } from 'lucide-react';

interface Vol {
  id: string;
  letter: string | null;
  label: string;
  fs: string;
  sizeGB: number;
  usedPct: number;
  locked?: string;
}
interface Disk {
  index: number;
  model: string;
  bus: string;
  sizeLabel: string;
  vols: Vol[];
}

const DISKS: Disk[] = [
  {
    index: 0,
    model: 'Internal NVMe',
    bus: 'PCIe · host',
    sizeLabel: '953 GB',
    vols: [
      { id: 'd0p1', letter: null, label: 'EFI System Partition', fs: 'FAT32', sizeGB: 0.1, usedPct: 26, locked: 'Host bootloader' },
      { id: 'd0p2', letter: 'C:', label: 'Windows 11', fs: 'NTFS', sizeGB: 950, usedPct: 57, locked: 'Active OS volume · pagefile' },
    ],
  },
  {
    index: 1,
    model: 'SanDisk Extreme PRO',
    bus: 'USB 3.2',
    sizeLabel: '128 GB',
    vols: [{ id: 'd1p1', letter: 'E:', label: 'ARCH_BOOT', fs: 'FAT32', sizeGB: 128, usedPct: 8 }],
  },
  {
    index: 2,
    model: 'Samsung BAR Plus',
    bus: 'USB 3.0',
    sizeLabel: '64 GB',
    vols: [{ id: 'd2p1', letter: 'F:', label: 'PORTABLE_DATA', fs: 'exFAT', sizeGB: 64, usedPct: 7 }],
  },
];

export default function DetectIsland() {
  const [sel, setSel] = useState('d1p1');
  const all = DISKS.flatMap((d) => d.vols.map((v) => ({ ...v, disk: d })));
  const chosen = all.find((v) => v.id === sel)!;

  return (
    <div className="font-mono text-[12px]">
      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-white/[0.13] text-foreground-muted text-[11px]">
        <span>$ l155a detect --all</span>
        <span>3 disks · 4 volumes · 2 eligible</span>
      </div>

      <div role="radiogroup" aria-label="Destination volume" className="divide-y divide-white/[0.07]">
        {DISKS.map((d) => (
          <div key={d.index} className="py-4">
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-foreground-secondary">
              <span className="text-foreground">disk{d.index}</span>
              <span>{d.model}</span>
              <span className="text-foreground-muted">{d.bus}</span>
              <span className="text-foreground-muted ml-auto">{d.sizeLabel}</span>
            </div>
            <ul className="mt-3 space-y-1">
              {d.vols.map((v) => {
                const isSel = v.id === sel;
                const locked = Boolean(v.locked);
                return (
                  <li key={v.id}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={isSel}
                      aria-disabled={locked}
                      onClick={() => !locked && setSel(v.id)}
                      className={`w-full text-left grid grid-cols-[5.5rem_minmax(0,1fr)] sm:grid-cols-[5.5rem_2.5rem_minmax(0,1fr)_5.5rem_7.5rem] items-center gap-x-3 gap-y-1 px-2 py-2 -mx-2 rounded-[2px] transition-colors ${
                        locked
                          ? 'cursor-not-allowed text-foreground-muted'
                          : isSel
                            ? 'bg-white/[0.06] text-foreground'
                            : 'text-foreground-secondary hover:bg-white/[0.03]'
                      }`}
                    >
                      <span className={locked ? 'st-lock' : isSel ? 'st-ok' : 'st-wait'}>
                        {locked ? '[ LOCK ]' : isSel ? '[ PICK ]' : '[      ]'}
                      </span>
                      <span className="hidden sm:inline">{v.letter ?? '—'}</span>
                      <span className="sm:truncate">
                        <span className="sm:hidden">{v.letter ?? '—'} </span>
                        {v.label}
                        {locked && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[11px] st-lock">
                            <Lock className="w-3 h-3" aria-hidden="true" />
                            {v.locked}
                          </span>
                        )}
                      </span>
                      <span className="hidden sm:flex items-center gap-2">
                        <span className="relative block h-[4px] w-14 bg-white/[0.08]" aria-hidden="true">
                          <span
                            className="absolute inset-y-0 left-0"
                            style={{ width: `${v.usedPct}%`, background: locked ? '#F87171' : '#A0A6AD', opacity: locked ? 0.6 : 1 }}
                          />
                        </span>
                        <span className="text-foreground-muted text-[11px] tabular-nums">{v.usedPct}%</span>
                      </span>
                      <span className="hidden sm:block text-right text-foreground-muted whitespace-nowrap">
                        {v.fs} · {v.sizeGB < 1 ? '100 MB' : `${v.sizeGB} GB`}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <p className="pt-3 border-t border-white/[0.13] text-foreground-secondary" aria-live="polite">
        <span className="text-foreground-muted">target →</span>{' '}
        <span className="text-foreground">
          disk{chosen.disk.index} · {chosen.letter} {chosen.label}
        </span>{' '}
        <span className="text-foreground-muted">· other partitions on this disk stay untouched</span>
      </p>
    </div>
  );
}
