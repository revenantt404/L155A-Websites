import { useState } from 'react';

interface Region {
  id: string;
  name: string;
  short: string;
  start: number;
  end: number;
  /** Visual width share; the map is not to scale. */
  w: number;
  fill: string;
  note: string;
}

const TOTAL = 250_000_000; // 128 GB / 512-byte sectors
const REGIONS: Region[] = [
  { id: 'mbr', name: 'Protective MBR', short: 'MBR', start: 0, end: 0, w: 5, fill: '#A0A6AD', note: 'Single 0xEE entry so legacy tools see the disk as in use, not empty.' },
  { id: 'gpt', name: 'Primary GPT header + entries', short: 'GPT', start: 1, end: 33, w: 7, fill: '#D0D6E0', note: 'Header at LBA 1, 128 partition entries in LBA 2–33, both CRC32-sealed.' },
  { id: 'gap', name: 'Alignment gap', short: '', start: 34, end: 2047, w: 4, fill: 'transparent', note: 'Left empty so the first partition starts on a 1 MiB boundary for flash erase blocks.' },
  { id: 'esp', name: 'EFI System Partition', short: 'ESP', start: 2048, end: 206_847, w: 18, fill: '#22C55E', note: '100 MiB FAT32, label ESP_L155A. Signed BOOTX64.EFI injected so Secure Boot firmware finds a loader even when the ISO ships none.' },
  { id: 'data', name: 'Image data partition', short: 'DATA', start: 206_848, end: TOTAL - 34, w: 58, fill: '#EDEDED', note: 'Image contents written by unbuffered direct I/O. Filesystem follows the image: FAT32 for Linux, NTFS for Windows installers.' },
  { id: 'bgpt', name: 'Backup GPT', short: 'B', start: TOTAL - 33, end: TOTAL - 1, w: 5, fill: '#D0D6E0', note: 'Mirror of the header and entries at the end of the disk, so a damaged primary can be rebuilt.' },
];

const fmt = (n: number) => n.toLocaleString('en-US');

export default function PartitionIsland() {
  const [active, setActive] = useState('esp');
  const r = REGIONS.find((x) => x.id === active)!;
  const sectors = r.end - r.start + 1;
  const bytes = sectors * 512;
  const size =
    bytes >= 1e9 ? `${(bytes / 1024 ** 3).toFixed(1)} GiB` : bytes >= 1024 ** 2 ? `${(bytes / 1024 ** 2).toFixed(0)} MiB` : `${fmt(bytes)} B`;

  return (
    <div className="font-mono">
      <div className="flex items-baseline justify-between text-[11px] text-foreground-muted pb-2">
        <span>disk1 · GPT · 512 B sectors</span>
        <span>not to scale</span>
      </div>

      <div
        role="tablist"
        aria-label="Disk regions"
        className="flex h-16 sm:h-20 border border-white/[0.13]"
        onKeyDown={(e) => {
          const i = REGIONS.findIndex((x) => x.id === active);
          const next =
            e.key === 'ArrowRight' ? (i + 1) % REGIONS.length : e.key === 'ArrowLeft' ? (i - 1 + REGIONS.length) % REGIONS.length : -1;
          if (next >= 0) {
            e.preventDefault();
            setActive(REGIONS[next].id);
            e.currentTarget.querySelectorAll<HTMLElement>('[role="tab"]')[next]?.focus();
          }
        }}
      >
        {REGIONS.map((x) => {
          const on = x.id === active;
          const isGap = x.id === 'gap';
          return (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={on}
              tabIndex={on ? 0 : -1}
              aria-label={x.name}
              onClick={() => setActive(x.id)}
              onMouseEnter={() => setActive(x.id)}
              onFocus={() => setActive(x.id)}
              className="relative h-full border-r border-white/[0.13] last:border-r-0 group"
              style={{ flexGrow: x.w, flexBasis: 0 }}
            >
              <span
                className="absolute inset-[3px] transition-opacity duration-150"
                style={{
                  background: isGap
                    ? 'repeating-linear-gradient(135deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 6px)'
                    : x.fill,
                  opacity: on ? 1 : isGap ? 1 : 0.28,
                }}
              />
              {x.short && (
                <span
                  className="relative text-[10px] sm:text-[11px] tracking-wide"
                  style={{ color: on && !isGap ? '#08090A' : '#A0A6AD' }}
                >
                  {x.short}
                </span>
              )}
              {on && <span className="absolute -bottom-[7px] left-1/2 -translate-x-1/2 w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-[#D0D6E0]" aria-hidden="true" />}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between text-[10px] text-foreground-muted pt-2">
        <span>LBA 0</span>
        <span className="hidden sm:inline">2048</span>
        <span>{fmt(TOTAL - 1)}</span>
      </div>

      <div role="tabpanel" aria-live="polite" className="mt-6 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-x-10 gap-y-4 border-t border-white/[0.13] pt-5">
        <div className="min-w-0">
          <p className="text-[13px] text-foreground">{r.name}</p>
          <p className="mt-2 font-sans text-[15px] leading-relaxed text-foreground-secondary max-w-[46ch]">{r.note}</p>
        </div>
        <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1.5 text-[12px] content-start">
          <dt className="text-foreground-muted">start</dt>
          <dd className="text-right text-foreground">{fmt(r.start)}</dd>
          <dt className="text-foreground-muted">end</dt>
          <dd className="text-right text-foreground">{fmt(r.end)}</dd>
          <dt className="text-foreground-muted">sectors</dt>
          <dd className="text-right text-foreground">{fmt(sectors)}</dd>
          <dt className="text-foreground-muted">size</dt>
          <dd className="text-right text-foreground">{size}</dd>
        </dl>
      </div>
    </div>
  );
}
