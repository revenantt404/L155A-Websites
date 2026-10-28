import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types matching L155A Volume-Guided Flasher ---
type WizardStep = 'image' | 'destination' | 'review' | 'progress';
type WriteState = 'idle' | 'writing' | 'done' | 'failed';

interface ImageFileMetadata {
  path: string;
  name: string;
  size_bytes: number;
  format: string;
  os_family?: 'linux' | 'windows' | 'bsd';
  iso_label?: string;
}

interface VolumeFormatOptions {
  mediaType?: 'flashdisk' | 'ssd' | 'hdd';
  filesystem: 'FAT32' | 'NTFS' | 'exFAT';
  clusterSize: number | null;
  label: string;
  quickFormat: boolean;
  formatOnly: boolean;
}

interface DiskExtent {
  disk_index: number;
  offset_bytes: number;
  length_bytes: number;
}

interface VolumeInfo {
  volume_id: string;
  drive_letter: string | null;
  label: string | null;
  filesystem: string | null;
  total_bytes: number;
  free_bytes: number | null;
  partition_type: string;
  is_system: boolean;
  is_protected: boolean;
  protection_reason?: string;
  is_selectable: boolean;
  disk_extents: DiskExtent[];
}

interface FileChecklistEntry {
  path: string;
  done: boolean;
}

// Ultra-refined animation physics tokens
const SPRING_SNAPPY = { type: 'spring' as const, stiffness: 420, damping: 32, mass: 0.8 };
const SPRING_SMOOTH = { type: 'spring' as const, stiffness: 340, damping: 28, mass: 0.9 };
const EASE_PRECISE = [0.16, 1, 0.3, 1] as const;

// --- Sample Preloaded Datasets ---
const PRESET_IMAGES: ImageFileMetadata[] = [
  {
    path: 'C:\\ISOs\\archlinux-2026.10-x86_64.iso',
    name: 'archlinux-2026.10-x86_64.iso',
    size_bytes: 1_267_984_384,
    format: 'ISO 9660 / El Torito',
    os_family: 'linux',
    iso_label: 'ARCH_202610',
  },
  {
    path: 'C:\\ISOs\\ubuntu-24.04.1-live-server-amd64.iso',
    name: 'ubuntu-24.04.1-live-server-amd64.iso',
    size_bytes: 2_812_805_120,
    format: 'ISO 9660 / UDF',
    os_family: 'linux',
    iso_label: 'UBUNTU_2404',
  },
  {
    path: 'C:\\ISOs\\win11_24h2_iot_enterprise_x64.iso',
    name: 'win11_24h2_iot_enterprise_x64.iso',
    size_bytes: 5_798_209_536,
    format: 'UDF / Dual Boot EFI',
    os_family: 'windows',
    iso_label: 'CCCOMA_X64FRE',
  },
];

const PRESET_VOLUMES: VolumeInfo[] = [
  // Disk 1 - USB 3.2 Flashdisk (SanDisk Extreme PRO 128 GB)
  {
    volume_id: '\\\\?\\Volume{8a1f3c09-42bc-449e-b15c-19d20c52a001}\\',
    drive_letter: 'E:',
    label: 'ARCH_BOOT',
    filesystem: 'FAT32',
    total_bytes: 128_000_000_000,
    free_bytes: 118_200_000_000,
    partition_type: 'ebd0a0a2-b9e5-4433-87c0-68b6b72699c7', // Basic data GPT
    is_system: false,
    is_protected: false,
    is_selectable: true,
    disk_extents: [{ disk_index: 1, offset_bytes: 1_048_576, length_bytes: 128_000_000_000 }],
  },
  // Disk 2 - USB 3.0 Flashdisk (Samsung BAR Plus 64 GB)
  {
    volume_id: '\\\\?\\Volume{9b2f4d10-53cd-55af-c26d-20e31d63b002}\\',
    drive_letter: 'F:',
    label: 'PORTABLE_DATA',
    filesystem: 'exFAT',
    total_bytes: 64_000_000_000,
    free_bytes: 59_400_000_000,
    partition_type: 'mbr:0x07',
    is_system: false,
    is_protected: false,
    is_selectable: true,
    disk_extents: [{ disk_index: 2, offset_bytes: 1_048_576, length_bytes: 64_000_000_000 }],
  },
  // Disk 0 - NVMe SSD (Internal Host OS Drive - PROTECTED)
  {
    volume_id: '\\\\?\\Volume{c12a7328-f81f-11d2-ba4b-00a0c93ec93b}\\',
    drive_letter: null,
    label: 'ESP System Partition',
    filesystem: 'FAT32',
    total_bytes: 104_857_600,
    free_bytes: 78_000_000,
    partition_type: 'c12a7328-f81f-11d2-ba4b-00a0c93ec93b',
    is_system: true,
    is_protected: true,
    protection_reason: 'EFI System Partition (Host bootloader locked)',
    is_selectable: false,
    disk_extents: [{ disk_index: 0, offset_bytes: 1_048_576, length_bytes: 104_857_600 }],
  },
  {
    volume_id: '\\\\?\\Volume{10384729-1a2b-3c4d-5e6f-7a8b9c0d1e2f}\\',
    drive_letter: 'C:',
    label: 'Windows 11 OS',
    filesystem: 'NTFS',
    total_bytes: 950_000_000_000,
    free_bytes: 412_000_000_000,
    partition_type: 'ebd0a0a2-b9e5-4433-87c0-68b6b72699c7',
    is_system: true,
    is_protected: true,
    protection_reason: 'Active Windows OS volume (Host lock active)',
    is_selectable: false,
    disk_extents: [{ disk_index: 0, offset_bytes: 105_906_176, length_bytes: 950_000_000_000 }],
  },
];

const ARCH_FILES = [
  'EFI/BOOT/BOOTX64.EFI',
  'EFI/BOOT/grubx64.efi',
  'arch/boot/x86_64/vmlinuz-linux',
  'arch/boot/x86_64/initramfs-linux.img',
  'arch/boot/syslinux/syslinux.cfg',
  'arch/x86_64/airootfs.sfs',
  'loader/entries/archiso-x86_64-linux.conf',
];

const WIN_FILES = [
  'efi/boot/bootx64.efi',
  'bootmgr.efi',
  'bootmgr',
  'sources/boot.wim',
  'sources/install.wim',
  'support/logging/setupact.log',
  'setup.exe',
];

// Helper formatters
function formatBytes(bytes: number | null | undefined): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) return 'Unavailable';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unit = -1;
  do {
    size /= 1024;
    unit += 1;
  } while (size >= 1024 && unit < units.length - 1);
  return `${size.toFixed(1)} ${units[unit]}`;
}

function volumeTitle(vol: VolumeInfo): string {
  const letter = vol.drive_letter || '—';
  const label = vol.label ? vol.label.trim() : 'Unlabeled volume';
  return `${letter} · ${label}`;
}

function deriveFormatProfile(image: ImageFileMetadata | null, mediaType: 'flashdisk' | 'ssd' | 'hdd' = 'flashdisk') {
  if (!image) {
    return { filesystem: 'FAT32' as const, clusterSize: 16384, label: 'USB_DRIVE' };
  }
  if (image.os_family === 'windows') {
    return { filesystem: 'NTFS' as const, clusterSize: 4096, label: 'WIN11_USB' };
  }
  return { filesystem: 'FAT32' as const, clusterSize: 8192, label: 'ARCH_BOOT' };
}

export default function HeroFlasherConsole() {
  // Wizard state
  const [step, setStep] = useState<WizardStep>('image');
  const [selectedImage, setSelectedImage] = useState<ImageFileMetadata | null>(PRESET_IMAGES[0]);
  const [formatOptions, setFormatOptions] = useState<VolumeFormatOptions>({
    mediaType: 'flashdisk',
    filesystem: 'FAT32',
    clusterSize: 8192,
    label: 'ARCH_BOOT',
    quickFormat: true,
    formatOnly: false,
  });
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  // Volumes state
  const [volumes, setVolumes] = useState<VolumeInfo[]>(PRESET_VOLUMES);
  const [selectedVolumeId, setSelectedVolumeId] = useState<string | null>(PRESET_VOLUMES[0].volume_id);
  const [isRescanning, setIsRescanning] = useState(false);

  // Review & Write state
  const [confirmed, setConfirmed] = useState(false);
  const [writeState, setWriteState] = useState<WriteState>('idle');
  const [percentage, setPercentage] = useState(0);
  const [speedMbps, setSpeedMbps] = useState(128.4);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(42);
  const [statusText, setStatusText] = useState('Preparing volume write sequence.');
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<FileChecklistEntry[]>(
    ARCH_FILES.map(f => ({ path: f, done: false }))
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedVolume = useMemo(
    () => volumes.find(v => v.volume_id === selectedVolumeId) ?? null,
    [volumes, selectedVolumeId]
  );

  // Step reachability guards
  const hasStep1Ready = Boolean(selectedImage || formatOptions.formatOnly);
  function isStepReachable(target: WizardStep): boolean {
    if (step === 'progress' || writeState === 'writing' || writeState === 'done') return target === 'progress';
    if (target === 'image') return true;
    if (target === 'destination') return hasStep1Ready;
    if (target === 'review') return Boolean(hasStep1Ready && selectedVolume && selectedVolume.is_selectable);
    if (target === 'progress') return writeState !== 'idle';
    return false;
  }

  // Toast auto-clear
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Image select handler
  const handleSelectImage = (img: ImageFileMetadata) => {
    setSelectedImage(img);
    const profile = deriveFormatProfile(img, formatOptions.mediaType ?? 'flashdisk');
    setFormatOptions(prev => ({
      ...prev,
      filesystem: profile.filesystem,
      clusterSize: profile.clusterSize,
      label: profile.label,
    }));
    setImagePickerOpen(false);
    setConfirmed(false);
    const files = img.os_family === 'windows' ? WIN_FILES : ARCH_FILES;
    setChecklist(files.map(f => ({ path: f, done: false })));
  };

  // Rescan simulation
  const handleRescan = () => {
    setIsRescanning(true);
    showToast('Rescanning storage buses via direct kernel discovery...');
    setTimeout(() => {
      setIsRescanning(false);
      showToast('Disk bus inventory refreshed: 3 storage devices verified.');
    }, 600);
  };

  // Real-time flash simulation
  const writeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleStartWrite = () => {
    if (!selectedVolume || !confirmed) return;
    setStep('progress');
    setWriteState('writing');
    setPercentage(0);
    setEtaSeconds(38);
    setStatusText('Locking volume handle and dismounting filesystem...');
    setCurrentFile('EFI/BOOT/BOOTX64.EFI');

    const files = selectedImage?.os_family === 'windows' ? WIN_FILES : ARCH_FILES;
    setChecklist(files.map(f => ({ path: f, done: false })));

    let currentPct = 0;
    let fileIdx = 0;

    if (writeTimerRef.current) clearInterval(writeTimerRef.current);

    writeTimerRef.current = setInterval(() => {
      currentPct += 1.8;
      const speed = Number((124.5 + Math.random() * 12.8).toFixed(1));
      setSpeedMbps(speed);

      const remainingTime = Math.max(0, Math.ceil((100 - currentPct) * 0.38));
      setEtaSeconds(remainingTime);

      if (currentPct < 15) {
        setStatusText('Creating FAT32 volume and writing ESP boot stub...');
      } else if (currentPct < 40) {
        setStatusText('Streaming kernel and initramfs via Direct DMA pipeline...');
      } else if (currentPct < 85) {
        setStatusText('Transferring root filesystem and firmware modules...');
      } else if (currentPct < 98) {
        setStatusText('Synchronizing disk caches and verifying hardware sector hashes...');
      }

      // Progressively mark files done
      const targetDone = Math.floor((currentPct / 100) * files.length);
      if (targetDone > fileIdx && fileIdx < files.length) {
        setChecklist(prev =>
          prev.map((item, idx) => (idx <= fileIdx ? { ...item, done: true } : item))
        );
        fileIdx++;
        if (fileIdx < files.length) {
          setCurrentFile(files[fileIdx]);
        }
      }

      if (currentPct >= 100) {
        if (writeTimerRef.current) clearInterval(writeTimerRef.current);
        setPercentage(100);
        setWriteState('done');
        setEtaSeconds(0);
        setCurrentFile(null);
        setChecklist(prev => prev.map(item => ({ ...item, done: true })));
        setStatusText(
          `Bootable volume ${selectedVolume.drive_letter || 'E:'} (${formatOptions.label}) is ready — ${files.length} files copied (UEFI & Legacy BIOS).`
        );
      } else {
        setPercentage(currentPct);
      }
    }, 110);
  };

  const handleReturnMainMenu = () => {
    if (writeTimerRef.current) clearInterval(writeTimerRef.current);
    setWriteState('idle');
    setPercentage(0);
    setConfirmed(false);
    setStep('image');
  };

  useEffect(() => {
    return () => {
      if (writeTimerRef.current) clearInterval(writeTimerRef.current);
    };
  }, []);

  // Footer status message computation
  const footerStatus = useMemo(() => {
    if (step === 'image') {
      return selectedImage
        ? `${selectedImage.name} loaded. Continue to select target volume.`
        : 'Choose a bootable OS image to continue.';
    }
    if (step === 'destination') {
      return selectedVolume
        ? `Target: ${volumeTitle(selectedVolume)} on Disk 1.`
        : 'Select an eligible destination partition.';
    }
    if (step === 'review') {
      return confirmed
        ? `Ready to write to ${selectedVolume ? volumeTitle(selectedVolume) : 'target'}.`
        : 'Check the safety confirmation box to proceed with volume write.';
    }
    if (writeState === 'writing') return 'Writing in progress. Do not disconnect the storage device.';
    if (writeState === 'done') return 'Volume provisioning completed with zero sector faults.';
    return 'Ready.';
  }, [step, selectedImage, selectedVolume, confirmed, writeState]);

  // Group volumes by disk
  const disks = useMemo(() => {
    const map = new Map<number, VolumeInfo[]>();
    volumes.forEach(vol => {
      const diskIdx = vol.disk_extents[0]?.disk_index ?? 99;
      const list = map.get(diskIdx) || [];
      list.push(vol);
      map.set(diskIdx, list);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [volumes]);

  return (
    <div className="w-full max-w-[860px] mx-auto select-none font-sans text-left relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            transition={SPRING_SMOOTH}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-[#18181c]/95 backdrop-blur-md border border-white/10 text-xs font-mono text-[#ececef] shadow-2xl flex items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></span>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main 1:1 Desktop App Shell */}
      <div
        id="l155a-desktop-shell"
        className="w-full rounded-2xl bg-[#0a0a0c] text-[#ececef] border border-white/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col"
      >
        {/* --- 1:1 Titlebar --- */}
        <header
          id="custom-titlebar"
          className="h-[52px] grid grid-cols-[180px_1fr_180px] items-center px-4 bg-[#0a0a0c] border-b border-white/[0.04]"
        >
          {/* Brand Badge */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={SPRING_SMOOTH}
            className="flex items-center gap-2.5 min-w-0 cursor-default"
          >
            <div className="w-5 h-5 flex items-center justify-center text-[#ececef] shrink-0">
              <svg className="w-5 h-5 text-[#ececef]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="4" stroke="currentColor" strokeWidth="1.5" />
                <path d="M7 12H17M12 7V17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[13px] font-semibold tracking-tight text-[#ececef]">L155A</span>
              <span className="text-[10px] font-mono text-[#8b8b96]">v2.4.1</span>
            </div>
          </motion.div>

          {/* Wizard Step Breadcrumbs with Fluid Gliding Pill */}
          <nav className="justify-self-center relative inline-flex items-center gap-1 p-1 rounded-lg bg-[#121215]">
            {[
              { id: 'image' as const, index: 1, label: 'Image' },
              { id: 'destination' as const, index: 2, label: 'Destination' },
              { id: 'review' as const, index: 3, label: 'Review' },
              { id: 'progress' as const, index: 4, label: 'Write' },
            ].map(s => {
              const isCurrent = s.id === step;
              const reachable = isStepReachable(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!reachable}
                  onClick={() => reachable && setStep(s.id)}
                  className={`relative inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-colors z-10 ${
                    isCurrent
                      ? 'text-[#ececef] font-semibold'
                      : reachable
                        ? 'text-[#a0a0ab] hover:text-[#ececef] cursor-pointer'
                        : 'text-[#52525b] cursor-not-allowed opacity-60'
                  }`}
                >
                  {isCurrent && (
                    <motion.div
                      layoutId="activeStepIndicator"
                      transition={SPRING_SMOOTH}
                      className="absolute inset-0 rounded-md bg-[#1f1f24] -z-10 shadow-sm"
                    />
                  )}
                  <span className="font-mono text-[11px] opacity-75">{s.index}</span>
                  <span>{s.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Window Controls & Refresh */}
          <div className="h-full flex items-center justify-end gap-1.5">
            <motion.button
              type="button"
              onClick={handleRescan}
              disabled={isRescanning}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={SPRING_SNAPPY}
              title="Rescan Storage Devices"
              aria-label="Rescan Storage Devices"
              className="w-7 h-7 grid place-items-center rounded-md text-[#a0a0ab] hover:bg-[#18181c] hover:text-[#ececef] transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                className={`w-3.5 h-3.5 ${isRescanning ? 'animate-spin text-[#4ade80]' : ''}`}
                fill="none"
              >
                <path
                  d="M20 7v5h-5M4 17v-5h5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.6 9a7 7 0 0 1 11.8-2L20 12M4 12l2.6 5a7 7 0 0 0 11.8-2"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.button>

            <div className="h-full inline-flex items-center ml-1">
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => showToast('Desktop demo: Window minimized to taskbar')}
                title="Minimize"
                aria-label="Minimize"
                className="w-8 h-7 grid place-items-center rounded text-[#a0a0ab] hover:bg-[#18181c] hover:text-[#ececef] transition-colors"
              >
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none">
                  <path d="M2 6h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => showToast('Desktop demo: Fixed 1020 × 620 landscape locked')}
                title="Fixed Landscape"
                aria-label="Fixed Landscape"
                className="w-8 h-7 grid place-items-center rounded text-[#8b8b96] hover:bg-[#18181c] hover:text-[#ececef] transition-colors"
              >
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none">
                  <rect
                    x="2.25"
                    y="2.25"
                    width="7.5"
                    height="7.5"
                    rx="1"
                    stroke="currentColor"
                    strokeWidth="1.3"
                  />
                </svg>
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => showToast('Desktop demo: L155A running in interactive preview mode')}
                title="Close"
                aria-label="Close"
                className="w-8 h-7 grid place-items-center rounded text-[#a0a0ab] hover:bg-[#b91c1c] hover:text-white transition-colors"
              >
                <svg viewBox="0 0 12 12" className="w-2.5 h-2.5" fill="none">
                  <path
                    d="M2.5 2.5 9.5 9.5M9.5 2.5 2.5 9.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.button>
            </div>
          </div>
        </header>

        {/* --- Main Workspace Canvas with Smooth Step Fade/Slide --- */}
        <main className="min-h-[440px] p-6 sm:p-7 flex flex-col justify-center bg-[#0a0a0c] overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            {/* ================= STEP 1: IMAGE SELECTION ================= */}
            {step === 'image' && (
              <motion.div
                key="step-image"
                initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
                transition={{ duration: 0.28, ease: EASE_PRECISE }}
                className="w-full max-w-[700px] mx-auto flex flex-col gap-4"
              >
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-[#ececef]">Select disk image</h2>
                  <p className="mt-1 text-xs text-[#a0a0ab]">
                    Choose an ISO or raw disk image to prepare a volume-guided bootable drive.
                  </p>
                </div>

                {/* File Browser Card */}
                <div className="flex items-center justify-between gap-4 p-5 rounded-xl bg-[#121215] border border-white/[0.04]">
                  <div>
                    <h3 className="text-sm font-semibold text-[#ececef]">Operating system image</h3>
                    <p className="mt-1 text-xs text-[#a0a0ab]">
                      Supports ISO, IMG, BIN, and RAW images. System and boot partitions remain locked.
                    </p>
                  </div>
                  <motion.button
                    type="button"
                    onClick={() => setImagePickerOpen(prev => !prev)}
                    whileHover={{ y: -1, scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    transition={SPRING_SNAPPY}
                    className="min-h-[36px] px-4 rounded-lg bg-[#ececef] text-xs font-semibold text-[#0a0a0c] hover:bg-white transition-colors shrink-0 flex items-center gap-1.5"
                  >
                    <span>Browse image</span>
                    <motion.span
                      animate={{ rotate: imagePickerOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-[10px]"
                    >
                      ▾
                    </motion.span>
                  </motion.button>
                </div>

                {/* Preloaded Images Popover with Smooth Dropdown */}
                <AnimatePresence>
                  {imagePickerOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.98 }}
                      transition={SPRING_SMOOTH}
                      className="p-3 rounded-xl bg-[#18181c]/95 backdrop-blur-md border border-white/[0.08] flex flex-col gap-1.5 shadow-2xl"
                    >
                      <span className="text-[11px] font-mono text-[#8b8b96] px-2 py-1 uppercase tracking-wider">
                        Select Available Operating System:
                      </span>
                      {PRESET_IMAGES.map(img => (
                        <motion.button
                          key={img.path}
                          type="button"
                          whileHover={{ x: 3 }}
                          whileTap={{ scale: 0.98 }}
                          transition={SPRING_SNAPPY}
                          onClick={() => handleSelectImage(img)}
                          className={`text-left px-3 py-2.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            selectedImage?.path === img.path
                              ? 'bg-[#1f1f24] text-[#4ade80] font-semibold'
                              : 'text-[#ececef] hover:bg-[#121215]'
                          }`}
                        >
                          <div className="flex flex-col">
                            <span>{img.name}</span>
                            <span className="text-[11px] text-[#8b8b96] font-mono">{img.format}</span>
                          </div>
                          <span className="font-mono text-xs text-[#a0a0ab]">{formatBytes(img.size_bytes)}</span>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Selected Image Metadata Pill with Smooth Layout */}
                <AnimatePresence>
                  {selectedImage && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.99 }}
                      transition={SPRING_SMOOTH}
                      className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-[#18181c] border border-white/[0.04]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-semibold text-[#ececef] truncate">{selectedImage.name}</div>
                        <div className="mt-0.5 text-xs font-mono text-[#a0a0ab]">
                          {formatBytes(selectedImage.size_bytes)} · {selectedImage.format} · Label:{' '}
                          {selectedImage.iso_label}
                        </div>
                      </div>
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.12 }}
                        whileTap={{ scale: 0.9 }}
                        transition={SPRING_SNAPPY}
                        onClick={() => {
                          setSelectedImage(null);
                          setFormatOptions(prev => ({
                            ...prev,
                            filesystem: 'FAT32',
                            clusterSize: null,
                            label: '',
                          }));
                        }}
                        className="w-7 h-7 grid place-items-center rounded-md text-[#a0a0ab] hover:bg-[#1f1f24] hover:text-[#ececef] transition-colors text-base"
                        title="Clear image selection"
                        aria-label="Clear image selection"
                      >
                        ×
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Advanced Drive Format Accordion */}
                <div className="flex flex-col gap-2.5 pt-1">
                  <motion.button
                    type="button"
                    disabled={!selectedImage}
                    whileHover={selectedImage ? { y: -1 } : undefined}
                    whileTap={selectedImage ? { scale: 0.98 } : undefined}
                    transition={SPRING_SNAPPY}
                    onClick={() => selectedImage && setAdvancedOpen(prev => !prev)}
                    className="self-start min-h-[32px] px-3 rounded-lg bg-[#121215] hover:bg-[#18181c] text-xs font-semibold text-[#a0a0ab] hover:text-[#ececef] inline-flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span>Advanced drive format options</span>
                    <motion.span
                      animate={{ rotate: advancedOpen ? 180 : 0 }}
                      transition={{ duration: 0.22, ease: EASE_PRECISE }}
                      className="inline-block"
                    >
                      ▾
                    </motion.span>
                  </motion.button>

                  <AnimatePresence>
                    {selectedImage && advancedOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, scale: 0.99 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.99 }}
                        transition={{ duration: 0.32, ease: EASE_PRECISE }}
                        className="flex flex-col gap-3 p-4 rounded-xl bg-[#121215] border border-white/[0.04] overflow-hidden"
                      >
                        {/* Format only toggle */}
                        <label className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-[#18181c] cursor-pointer hover:bg-[#1f1f24] transition-colors">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-[#ececef]">
                              Format drive only (Non-bootable)
                            </span>
                            <span className="text-[11px] text-[#a0a0ab]">
                              Format target volume without writing an ISO image, exactly like Rufus Non-bootable mode.
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            checked={formatOptions.formatOnly}
                            onChange={e => setFormatOptions(p => ({ ...p, formatOnly: e.target.checked }))}
                            className="w-4 h-4 accent-[#ececef] cursor-pointer"
                          />
                        </label>

                        {/* Format parameters grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-[#a0a0ab]">Target media</span>
                            <select
                              value={formatOptions.mediaType ?? 'flashdisk'}
                              onChange={e =>
                                setFormatOptions(p => ({
                                  ...p,
                                  mediaType: e.target.value as 'flashdisk' | 'ssd' | 'hdd',
                                }))
                              }
                              className="h-[34px] px-2.5 rounded-lg bg-[#18181c] text-xs text-[#ececef] border-0 outline-none focus:ring-1 focus:ring-white/20 transition-all"
                            >
                              <option value="flashdisk">Flashdisk (USB)</option>
                              <option value="ssd">SSD / NVMe</option>
                              <option value="hdd">HDD</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-[#a0a0ab]">File system</span>
                            <select
                              value={formatOptions.filesystem}
                              onChange={e =>
                                setFormatOptions(p => ({
                                  ...p,
                                  filesystem: e.target.value as 'FAT32' | 'NTFS' | 'exFAT',
                                }))
                              }
                              className="h-[34px] px-2.5 rounded-lg bg-[#18181c] text-xs text-[#ececef] border-0 outline-none focus:ring-1 focus:ring-white/20 transition-all"
                            >
                              <option value="FAT32">FAT32 (Default)</option>
                              <option value="NTFS">NTFS</option>
                              <option value="exFAT">exFAT</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-[#a0a0ab]">Cluster size</span>
                            <select
                              value={formatOptions.clusterSize ?? 8192}
                              onChange={e =>
                                setFormatOptions(p => ({
                                  ...p,
                                  clusterSize: Number(e.target.value),
                                }))
                              }
                              className="h-[34px] px-2.5 rounded-lg bg-[#18181c] text-xs text-[#ececef] border-0 outline-none focus:ring-1 focus:ring-white/20 transition-all"
                            >
                              <option value={4096}>4096 bytes (4 KB)</option>
                              <option value={8192}>8192 bytes (8 KB)</option>
                              <option value={16384}>16 KB</option>
                              <option value={32768}>32 KB</option>
                              <option value={65536}>64 KB</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-[#a0a0ab]">Volume label</span>
                            <input
                              type="text"
                              maxLength={32}
                              value={formatOptions.label}
                              onChange={e => setFormatOptions(p => ({ ...p, label: e.target.value }))}
                              className="h-[34px] px-2.5 rounded-lg bg-[#18181c] text-xs text-[#ececef] border-0 outline-none font-mono focus:ring-1 focus:ring-white/20 transition-all"
                            />
                          </div>
                        </div>

                        {/* Quick format check */}
                        <label className="inline-flex items-center gap-2 text-xs text-[#a0a0ab] cursor-pointer pt-1">
                          <input
                            type="checkbox"
                            checked={formatOptions.quickFormat}
                            onChange={e => setFormatOptions(p => ({ ...p, quickFormat: e.target.checked }))}
                            className="w-3.5 h-3.5 accent-[#ececef] cursor-pointer"
                          />
                          <span>Quick format</span>
                        </label>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* ================= STEP 2: DESTINATION VOLUME ================= */}
            {step === 'destination' && (
              <motion.div
                key="step-destination"
                initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
                transition={{ duration: 0.28, ease: EASE_PRECISE }}
                className="w-full max-w-[700px] mx-auto flex flex-col gap-4"
              >
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-[#ececef]">
                    Select destination volume
                  </h2>
                  <p className="mt-1 text-xs text-[#a0a0ab]">
                    Pick one eligible partition or unallocated space. Other partitions on the disk remain untouched.
                  </p>
                </div>

                {/* Subheader status bar */}
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-[#a0a0ab] font-mono">
                    {volumes.length} volumes detected · hardware volume lock active
                  </span>
                  <div className="flex items-center gap-2">
                    {selectedVolume && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={SPRING_SMOOTH}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#18181c] text-xs"
                      >
                        <span className="text-[#8b8b96]">Target:</span>
                        <span className="font-mono font-semibold text-[#4ade80]">
                          {volumeTitle(selectedVolume)}
                        </span>
                      </motion.div>
                    )}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      transition={SPRING_SNAPPY}
                      onClick={handleRescan}
                      className="min-h-[28px] px-3 rounded-md bg-[#121215] text-xs text-[#a0a0ab] hover:bg-[#18181c] hover:text-[#ececef] transition-colors"
                    >
                      Rescan
                    </motion.button>
                  </div>
                </div>

                {/* Disks & Volumes Tree */}
                <div className="flex flex-col gap-3 max-h-[340px] overflow-y-auto pr-1">
                  {disks.map(([diskIndex, diskVolumes]) => {
                    const isSystemDisk = diskIndex === 0;
                    return (
                      <div
                        key={diskIndex}
                        className="p-3.5 rounded-xl bg-[#121215] border border-white/[0.04] flex flex-col gap-2.5"
                      >
                        <div className="flex items-center justify-between px-0.5">
                          <h3 className="text-xs font-semibold text-[#ececef]">
                            {isSystemDisk ? 'Disk 0 (Internal NVMe Host Disk)' : `Disk ${diskIndex} (Removable USB 3.2)`}
                          </h3>
                          <span className="text-xs font-mono text-[#8b8b96]">
                            {diskVolumes.length} volume{diskVolumes.length > 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Interactive Partition Map Bar */}
                        <div className="h-2.5 flex gap-1 rounded-full overflow-hidden bg-black/40 p-0.5">
                          {diskVolumes.map(vol => {
                            const isSel = vol.volume_id === selectedVolumeId;
                            const isProtect = !vol.is_selectable;
                            return (
                              <motion.button
                                key={vol.volume_id}
                                type="button"
                                disabled={isProtect}
                                whileHover={vol.is_selectable ? { scaleY: 1.35, y: -0.5 } : undefined}
                                whileTap={vol.is_selectable ? { scale: 0.96 } : undefined}
                                transition={SPRING_SNAPPY}
                                onClick={() => vol.is_selectable && setSelectedVolumeId(vol.volume_id)}
                                title={`${volumeTitle(vol)} (${formatBytes(vol.total_bytes)})`}
                                className={`h-full flex-1 rounded-full transition-colors ${
                                  isSel
                                    ? 'bg-[#4ade80] shadow-[0_0_8px_rgba(74,222,128,0.5)]'
                                    : isProtect
                                      ? 'bg-[#f87171]/40 cursor-not-allowed'
                                      : 'bg-[#facc15]/50 hover:bg-[#facc15]/80 cursor-pointer'
                                }`}
                              />
                            );
                          })}
                        </div>

                        {/* Volume Rows */}
                        <div className="flex flex-col gap-1.5">
                          {diskVolumes.map(vol => {
                            const isSel = vol.volume_id === selectedVolumeId;
                            const isSelectable = vol.is_selectable;
                            const freeFormatted = formatBytes(vol.free_bytes);
                            const totalFormatted = formatBytes(vol.total_bytes);

                            return (
                              <motion.div
                                key={vol.volume_id}
                                whileHover={isSelectable ? { x: 3 } : undefined}
                                whileTap={isSelectable ? { scale: 0.995 } : undefined}
                                transition={SPRING_SNAPPY}
                                onClick={() => isSelectable && setSelectedVolumeId(vol.volume_id)}
                                className={`grid grid-cols-[44px_minmax(0,1fr)_auto_auto] items-center gap-3 px-3.5 py-2.5 rounded-lg bg-[#0a0a0c] transition-colors relative ${
                                  isSel
                                    ? 'bg-[#1f1f24] border-l-2 border-[#4ade80]'
                                    : isSelectable
                                      ? 'hover:bg-[#18181c] cursor-pointer'
                                      : 'opacity-65 cursor-not-allowed'
                                }`}
                              >
                                {/* Drive Letter Badge */}
                                <div className="h-7 rounded-md bg-[#121215] inline-flex items-center justify-center">
                                  <span className="text-xs font-mono font-semibold text-[#ececef]">
                                    {vol.drive_letter || '—'}
                                  </span>
                                </div>

                                {/* Label & Filesystem */}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-[#ececef] truncate">
                                      {vol.label || 'Unlabeled'}
                                    </span>
                                    <span className="px-1.5 py-0.5 rounded bg-[#18181c] text-[10px] font-mono text-[#a0a0ab]">
                                      {vol.partition_type.includes('c12a') ? 'EFI System' : 'GPT Basic'}
                                    </span>
                                  </div>
                                  <span className="block text-[11px] font-mono text-[#8b8b96]">
                                    {vol.filesystem} {vol.protection_reason && `· ${vol.protection_reason}`}
                                  </span>
                                </div>

                                {/* Capacity Metric */}
                                <div className="flex flex-col items-end gap-1 font-mono text-[11px] text-[#a0a0ab] whitespace-nowrap">
                                  <span>
                                    {freeFormatted} free · {totalFormatted}
                                  </span>
                                  <div className="w-[84px] h-1 rounded-full bg-[#18181c] overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{
                                        width: `${Math.min(
                                          100,
                                          vol.free_bytes ? ((vol.total_bytes - vol.free_bytes) / vol.total_bytes) * 100 : 0
                                        )}%`,
                                      }}
                                      transition={{ duration: 0.6, ease: EASE_PRECISE }}
                                      className="h-full bg-[#a0a0ab]"
                                    />
                                  </div>
                                </div>

                                {/* State Tag */}
                                <span
                                  className={`inline-flex justify-center min-w-[70px] px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                                    isSelectable
                                      ? 'bg-[#facc15]/15 text-[#facc15]'
                                      : vol.is_system
                                        ? 'bg-[#f87171]/15 text-[#f87171]'
                                        : 'bg-[#8b8b96]/15 text-[#8b8b96]'
                                  }`}
                                >
                                  {isSelectable ? 'Available' : vol.is_system ? 'System' : 'Protected'}
                                </span>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ================= STEP 3: REVIEW & CONFIRM ================= */}
            {step === 'review' && (
              <motion.div
                key="step-review"
                initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
                transition={{ duration: 0.28, ease: EASE_PRECISE }}
                className="w-full max-w-[700px] mx-auto flex flex-col gap-4"
              >
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-[#ececef]">Review and confirm</h2>
                  <p className="mt-1 text-xs text-[#a0a0ab]">
                    Verify the selected image and target volume before flashing.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#121215] border border-white/[0.04] flex flex-col gap-2">
                  <ul className="m-0 p-0 list-none flex flex-col gap-1.5 text-xs">
                    {[
                      { key: 'Image', value: selectedImage?.name || 'Format Only' },
                      {
                        key: 'Destination',
                        value: selectedVolume ? volumeTitle(selectedVolume) : 'Not selected',
                      },
                      {
                        key: 'Volume ID',
                        value: selectedVolume?.volume_id || 'Unavailable',
                      },
                      {
                        key: 'Filesystem',
                        value: `${formatOptions.filesystem} (Cluster: ${formatOptions.clusterSize} bytes)`,
                      },
                      {
                        key: 'Free space',
                        value: selectedVolume ? formatBytes(selectedVolume.free_bytes) : 'Unavailable',
                      },
                    ].map(row => (
                      <li
                        key={row.key}
                        className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 px-3.5 py-2.5 rounded-lg bg-[#0a0a0c]"
                      >
                        <span className="text-[#a0a0ab]">{row.key}</span>
                        <span className="font-mono text-[#ececef] break-all">{row.value}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Confirmation Checkbox */}
                  <motion.div
                    whileHover={{ scale: 1.005 }}
                    transition={SPRING_SNAPPY}
                    className="p-3.5 rounded-lg bg-[#18181c] border border-white/[0.04] mt-1"
                  >
                    <label className="flex items-center gap-2.5 text-xs text-[#ececef] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={e => setConfirmed(e.target.checked)}
                        className="w-4 h-4 accent-[#ececef] cursor-pointer"
                      />
                      <span className="font-medium">
                        I understand all files on the selected destination volume will be overwritten.
                      </span>
                    </label>
                    <p className="mt-2 text-xs text-[#8b8b96] leading-relaxed">
                      Formats only the selected destination volume ({selectedVolume?.drive_letter || 'target'}), copies image
                      files, and provisions UEFI and BIOS boot structures without touching any other partition on the disk.
                    </p>
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* ================= STEP 4: WRITE PROGRESS ================= */}
            {step === 'progress' && (
              <motion.div
                key="step-progress"
                initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
                transition={{ duration: 0.28, ease: EASE_PRECISE }}
                className="w-full max-w-[700px] mx-auto flex flex-col gap-3"
              >
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-[#ececef]">
                    {writeState === 'done' ? 'Volume provisioning complete' : 'Writing volume'}
                  </h2>
                  <p className="mt-1 text-xs text-[#a0a0ab]">
                    {writeState === 'done'
                      ? 'The media is verified, bootable, and ready for deployment.'
                      : 'Formatting the selected target and streaming raw sectors via Direct DMA.'}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#121215] border border-white/[0.04] flex flex-col gap-3.5">
                  {/* Status header & Progress bar */}
                  <div className="p-3.5 rounded-lg bg-[#0a0a0c]">
                    <div className="flex items-center justify-between gap-3">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={statusText}
                          initial={{ opacity: 0, y: 2 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -2 }}
                          transition={{ duration: 0.18 }}
                          className={`text-[13px] font-semibold truncate ${
                            writeState === 'done'
                              ? 'text-[#4ade80]'
                              : writeState === 'failed'
                                ? 'text-[#f87171]'
                                : 'text-[#facc15]'
                          }`}
                        >
                          {statusText}
                        </motion.p>
                      </AnimatePresence>
                      <div className="inline-flex items-center gap-2 font-mono text-xs text-[#a0a0ab]">
                        <span>ETA: {writeState === 'done' ? '00:00' : `00:${String(etaSeconds || 0).padStart(2, '0')}`}</span>
                        <span className="font-semibold text-[#ececef]">{percentage.toFixed(0)}%</span>
                      </div>
                    </div>

                    <div className="h-1.5 mt-2.5 rounded-full bg-[#18181c] overflow-hidden">
                      <motion.div
                        className={`h-full ${writeState === 'done' ? 'bg-[#4ade80]' : 'bg-[#facc15]'}`}
                        animate={{ width: `${percentage}%` }}
                        transition={{ ease: 'easeOut', duration: 0.15 }}
                      />
                    </div>
                  </div>

                  {/* 4 Telemetry Metrics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-[#0a0a0c]">
                      <span className="block text-[#8b8b96]">Target</span>
                      <strong className="block mt-0.5 font-mono font-medium text-[#ececef] truncate">
                        {selectedVolume ? volumeTitle(selectedVolume) : '—'}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#0a0a0c]">
                      <span className="block text-[#8b8b96]">Files</span>
                      <strong className="block mt-0.5 font-mono font-medium text-[#ececef]">
                        {checklist.filter(c => c.done).length} / {checklist.length} files
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#0a0a0c]">
                      <span className="block text-[#8b8b96]">Throughput</span>
                      <strong className="block mt-0.5 font-mono font-medium text-[#ececef]">
                        {writeState === 'writing' ? `${speedMbps.toFixed(1)} MB/s` : '124.8 MB/s'}
                      </strong>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#0a0a0c]">
                      <span className="block text-[#8b8b96]">Remaining</span>
                      <strong className="block mt-0.5 font-mono font-medium text-[#ececef]">
                        {writeState === 'done' ? '00:00' : `00:${String(etaSeconds || 0).padStart(2, '0')} remaining`}
                      </strong>
                    </div>
                  </div>

                  {/* Copied files checklist */}
                  <div className="flex items-center justify-between px-1 text-xs text-[#a0a0ab]">
                    <span>Hardware file pipeline</span>
                    <span className="font-mono text-[#ececef] truncate max-w-[280px]">
                      {currentFile || (writeState === 'done' ? 'All sectors verified' : 'Idle')}
                    </span>
                  </div>

                  <div className="max-h-[140px] overflow-y-auto px-1 py-1 font-mono text-xs flex flex-col gap-1.5">
                    {checklist.map(entry => (
                      <motion.div
                        key={entry.path}
                        layout
                        transition={SPRING_SNAPPY}
                        className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-md bg-[#0a0a0c]"
                      >
                        <span className="text-[#ececef] truncate">{entry.path}</span>
                        <motion.span
                          key={entry.done ? 'done' : 'copying'}
                          initial={{ scale: 0.9, opacity: 0.7 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={SPRING_SNAPPY}
                          className={`font-semibold shrink-0 text-[11px] ${
                            entry.done ? 'text-[#4ade80]' : 'text-[#facc15]'
                          }`}
                        >
                          {entry.done ? '✓ Copied' : 'Copying…'}
                        </motion.span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* --- 1:1 Studio Footer with Smooth Cross-Fade --- */}
        <footer className="h-[58px] flex items-center justify-between gap-4 px-6 bg-[#0a0a0c] border-t border-white/[0.04]">
          <div className="min-w-0 text-xs text-[#a0a0ab] font-mono flex items-center gap-2">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                writeState === 'writing'
                  ? 'bg-[#facc15] animate-pulse'
                  : writeState === 'done'
                    ? 'bg-[#4ade80]'
                    : 'bg-[#ececef]/40'
              }`}
            />
            <AnimatePresence mode="wait">
              <motion.span
                key={footerStatus}
                initial={{ opacity: 0, y: 3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.18 }}
                className="truncate"
              >
                {footerStatus}
              </motion.span>
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {step !== 'image' && step !== 'progress' && (
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                transition={SPRING_SNAPPY}
                onClick={() => {
                  if (step === 'destination') setStep('image');
                  else if (step === 'review') setStep('destination');
                }}
                className="min-w-[92px] min-h-[34px] px-4 rounded-lg bg-[#18181c] text-xs font-semibold text-[#ececef] hover:bg-[#1f1f24] transition-colors"
              >
                Back
              </motion.button>
            )}

            {step === 'image' && (
              <motion.button
                type="button"
                disabled={!hasStep1Ready}
                whileHover={hasStep1Ready ? { y: -1 } : undefined}
                whileTap={hasStep1Ready ? { scale: 0.96 } : undefined}
                transition={SPRING_SNAPPY}
                onClick={() => hasStep1Ready && setStep('destination')}
                className="min-w-[96px] min-h-[34px] px-4 rounded-lg bg-[#ececef] text-xs font-semibold text-[#0a0a0c] hover:bg-white disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </motion.button>
            )}

            {step === 'destination' && (
              <motion.button
                type="button"
                disabled={!selectedVolume || !selectedVolume.is_selectable}
                whileHover={selectedVolume?.is_selectable ? { y: -1 } : undefined}
                whileTap={selectedVolume?.is_selectable ? { scale: 0.96 } : undefined}
                transition={SPRING_SNAPPY}
                onClick={() => selectedVolume && selectedVolume.is_selectable && setStep('review')}
                className="min-w-[96px] min-h-[34px] px-4 rounded-lg bg-[#ececef] text-xs font-semibold text-[#0a0a0c] hover:bg-white disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
              >
                Continue
              </motion.button>
            )}

            {step === 'review' && (
              <motion.button
                type="button"
                disabled={!confirmed}
                whileHover={confirmed ? { y: -1 } : undefined}
                whileTap={confirmed ? { scale: 0.96 } : undefined}
                transition={SPRING_SNAPPY}
                onClick={handleStartWrite}
                className="min-w-[130px] min-h-[34px] px-4 rounded-lg bg-[#ececef] text-xs font-semibold text-[#0a0a0c] hover:bg-white disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
              >
                Write image
              </motion.button>
            )}

            {step === 'progress' && (
              <motion.button
                type="button"
                disabled={writeState === 'writing'}
                whileHover={writeState !== 'writing' ? { y: -1 } : undefined}
                whileTap={writeState !== 'writing' ? { scale: 0.96 } : undefined}
                transition={SPRING_SNAPPY}
                onClick={handleReturnMainMenu}
                className="min-w-[140px] min-h-[34px] px-4 rounded-lg bg-[#ececef] text-xs font-semibold text-[#0a0a0c] hover:bg-white disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
              >
                Back to main menu
              </motion.button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
