export interface Stage {
  id: string;
  name: string;
  /** Short line shown in the boot log and the stage gutter. */
  log: string;
  /** Final status token once the stage has run. */
  final: 'OK' | 'RDY';
}

export const STAGES: Stage[] = [
  { id: 'post', name: 'POST', log: 'host disk 0 locked · ESP + C: excluded', final: 'OK' },
  { id: 'detect', name: 'DETECT', log: '3 disks enumerated · 2 eligible volumes', final: 'OK' },
  { id: 'partition', name: 'PARTITION', log: 'GPT · ESP 100 MiB FAT32 @ LBA 2048', final: 'OK' },
  { id: 'write', name: 'WRITE', log: 'unbuffered direct I/O · 124.8 MB/s', final: 'OK' },
  { id: 'verify', name: 'VERIFY', log: 'CRC32 + SHA-256 · inline with write', final: 'OK' },
  { id: 'boot', name: 'BOOT', log: 'UEFI + legacy BIOS · REV 2 ready', final: 'RDY' },
];

/** Fixed-width status token, e.g. "[  OK  ]". */
export function token(word: string): string {
  const inner = 6;
  const pad = inner - word.length;
  const left = Math.floor(pad / 2);
  return `[${' '.repeat(left)}${word}${' '.repeat(pad - left)}]`;
}

/** Published artifacts in public/downloads, measured from the real files. */
export interface Download {
  kind: 'installer' | 'msi' | 'portable' | 'archive';
  /** Short label for the manifest row. */
  label: string;
  file: string;
  href: string;
  bytes: number;
  size: string;
  sha256: string;
}

const mb = (bytes: number) => `${(bytes / 1_000_000).toFixed(1)} MB`;

const artifact = (d: Omit<Download, 'size'>): Download => ({ ...d, size: mb(d.bytes) });

export const DOWNLOADS: Download[] = [
  artifact({
    kind: 'installer',
    label: 'Setup · x64',
    file: 'L155A_REV2_x64-setup.exe',
    href: '/downloads/L155A_REV2_x64-setup.exe',
    bytes: 2_625_080,
    sha256: '35858c29ff7c31cf53d0ead2c573d2f62d4eadb38fc6a7455dfae86610978321',
  }),
  artifact({
    kind: 'msi',
    label: 'MSI package',
    file: 'L155A_REV2_x64_en-US.msi',
    href: '/downloads/L155A_REV2_x64_en-US.msi',
    bytes: 3_911_680,
    sha256: 'a7acab4fd8f8cc731f580a56c8a59c4a12c564860567ce9304785df364603523',
  }),
  artifact({
    kind: 'portable',
    label: 'Portable · exe',
    file: 'L155A_REV2_Portable.exe',
    href: '/downloads/L155A_REV2_Portable.exe',
    bytes: 11_511_296,
    sha256: '2ec496ed671a3c7c59bb3693f9f16b661778782f774a93fb278e44ea14dd3bf2',
  }),
  artifact({
    kind: 'archive',
    label: 'Portable · zip',
    file: 'L155A_REV2_Portable.zip',
    href: '/downloads/L155A_REV2_Portable.zip',
    bytes: 3_617_807,
    sha256: 'd1a5c54ba023c360d10d8880d6cd35af61134fea12fcb2741ab1fd1002c5f9ce',
  }),
];

export const SETUP = DOWNLOADS[0];
export const PORTABLE = DOWNLOADS[2];
export const TOTAL_BYTES = DOWNLOADS.reduce((n, d) => n + d.bytes, 0);
export const TOTAL_SIZE = mb(TOTAL_BYTES);

export const RELEASE = {
  version: 'REV 2',
  size: SETUP.size,
  sha256: SETUP.sha256,
};
