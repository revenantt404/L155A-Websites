import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Download, FileCode, CheckCircle, Terminal, ArrowRight, X } from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  category: string;
  icon: React.ReactNode;
  action: () => void;
}

export default function CommandPaletteModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: CommandItem[] = [
    {
      id: 'download-installer',
      title: 'Download L155A Installer (Windows x64)',
      category: 'Downloads',
      icon: <Download className="w-4 h-4 text-accent" />,
      action: () => {
        window.location.href = '#download';
        setIsOpen(false);
      },
    },
    {
      id: 'download-portable',
      title: 'Download Portable Standalone (.exe)',
      category: 'Downloads',
      icon: <FileCode className="w-4 h-4 text-accent" />,
      action: () => {
        window.location.href = '#download';
        setIsOpen(false);
      },
    },
    {
      id: 'copy-hash',
      title: 'Copy Official SHA-256 Checksum',
      category: 'Security',
      icon: <CheckCircle className="w-4 h-4 text-accent-success" />,
      action: () => {
        navigator.clipboard.writeText('4f82a93b5e7d1c8209bb7e12f90a541620c31be9450a8d71239c0fa1e6e9c31b');
        alert('SHA-256 Checksum copied to clipboard!');
        setIsOpen(false);
      },
    },
    {
      id: 'nav-pillars',
      title: 'Jump to Isometric Mechanisms (Fig 0.1 - 0.3)',
      category: 'Navigation',
      icon: <Terminal className="w-4 h-4 text-foreground-secondary" />,
      action: () => {
        window.location.href = '#pillars';
        setIsOpen(false);
      },
    },
    {
      id: 'nav-benchmarks',
      title: 'Jump to Direct DMA Benchmarks',
      category: 'Navigation',
      icon: <ArrowRight className="w-4 h-4 text-foreground-secondary" />,
      action: () => {
        window.location.href = '#benchmarks';
        setIsOpen(false);
      },
    },
  ];

  const filtered = commands.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelect = (idx: number) => {
    if (filtered[idx]) {
      filtered[idx].action();
    }
  };

  return (
    <>
      {/* Shortcut button in page to open palette */}
      <button
        onClick={() => setIsOpen(true)}
        className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 text-foreground-secondary text-xs font-mono transition-colors border border-border-hairline"
        title="Command Palette (Cmd+K)"
      >
        <span>Search</span>
        <kbd className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-foreground-muted">⌘K</kbd>
      </button>

      {/* Modal Backdrop and Palette */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-[560px] rounded-xl bg-surface-card border border-border-subtle shadow-window-elevated overflow-hidden text-left"
            >
              {/* Search Bar */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-hairline bg-surface-elevated/40">
                <Search className="w-4 h-4 text-foreground-muted shrink-0" />
                <input
                  type="text"
                  autoFocus
                  placeholder="Type a command or search documentation..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-foreground-muted focus:outline-none font-sans"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded text-foreground-muted hover:text-foreground hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Command List */}
              <div className="p-2 max-h-[320px] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="p-6 text-center text-xs text-foreground-muted font-mono">
                    No matching commands found.
                  </div>
                ) : (
                  filtered.map((cmd, idx) => (
                    <div
                      key={cmd.id}
                      onClick={() => handleSelect(idx)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center justify-between p-3 rounded-lg text-sm cursor-pointer transition-colors ${
                        idx === selectedIndex ? 'bg-white/10 text-foreground' : 'text-foreground-secondary hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">{cmd.icon}</div>
                        <span className="font-medium">{cmd.title}</span>
                      </div>
                      <span className="text-[11px] font-mono text-foreground-muted uppercase tracking-wider">
                        {cmd.category}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Guide */}
              <div className="px-4 py-2 bg-surface-elevated/30 border-t border-border-hairline flex items-center justify-between text-[11px] font-mono text-foreground-muted">
                <div className="flex items-center gap-3">
                  <span>Navigation: ↑ ↓</span>
                  <span>Select: Enter</span>
                </div>
                <span>Close: Esc</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
