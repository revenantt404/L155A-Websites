import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function PurposeStackIsland() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const L = 114.46;
  const B = 16.3015;
  const liftDistance = 31.667;

  const layers = [0, 1, 2, 3, 4];

  const getLayerPaths = (idx: number) => {
    const y = L + idx * B;
    const fillPath = `M250.355 ${y} a3.43 3.43 0 0 1 1.895 3.067 v${B} a3.43 3.43 0 0 1 -1.895 3.067 L136.85 ${y + 62.886 + B} a10.29 10.29 0 0 1 -9.2 0 L14.145 ${y + 6.134 + B} a3.43 3.43 0 0 1 -1.895 -3.067 V${y + 3.067} c0 -1.299 .734 -2.486 1.895 -3.067 L129.183 ${y - 57.519} a6.86 6.86 0 0 1 6.134 0 z`;
    const strokePath = `M14.145 ${y + 6.134 + B} a3.43 3.43 0 0 1 -1.895 -3.067 V${y + 3.067} c0 -1.299 .734 -2.486 1.895 -3.067 L129.183 ${y - 57.519} a6.86 6.86 0 0 1 6.134 0 L250.355 ${y} a3.43 3.43 0 0 1 1.895 3.067 v${B} a3.43 3.43 0 0 1 -1.895 3.067`;
    const edgePath = `M250.355 ${y + 6.134 + B} L136.85 ${y + 62.886 + B} a10.29 10.29 0 0 1 -9.2 0 L14.145 ${y + 6.134 + B}`;
    const dividerPath = `m19.107 ${y + 5.235} 108.543 54.272a10.29 10.29 0 0 0 9.2 0l108.543-54.272`;

    return { fillPath, strokePath, edgePath, dividerPath };
  };

  return (
    <div
      className="w-full h-[280px] flex items-center justify-center select-none relative"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="265"
        height="262"
        viewBox="0 0 265 262"
        fill="none"
        className="overflow-visible"
      >
        {/* Dashed Vertical Axis */}
        <path
          d="M136.85 240V70"
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="0.75"
          strokeDasharray="2 4"
          strokeLinecap="round"
        />

        {/* 5 Stack Layers rendered from bottom (4) to top (0) */}
        {layers.slice().reverse().map((idx) => {
          const { fillPath, strokePath, edgePath, dividerPath } = getLayerPaths(idx);
          const isLifted = hoveredIndex !== null && idx <= hoveredIndex;
          const delay = hoveredIndex !== null && isLifted ? (hoveredIndex - idx) * 0.05 : 0;

          return (
            <motion.g
              key={idx}
              animate={{ y: isLifted ? -liftDistance : 0 }}
              transition={{
                duration: 0.6,
                delay,
                ease: [0.32, 0.72, 0, 1],
              }}
            >
              <path fill="#08090A" d={fillPath} />
              <path stroke="#D0D6E0" strokeWidth="0.5" d={strokePath} />
              <path stroke="rgba(255, 255, 255, 0.2)" strokeWidth="0.5" d={edgePath} />
              <path stroke="rgba(255, 255, 255, 0.15)" strokeLinecap="round" strokeWidth="0.5" d={dividerPath} />

              {/* L155A Core Disk Icon on Layer 0 */}
              {idx === 0 && (
                <g transform="translate(136.85, 78) scale(0.65)" stroke="#D0D6E0" strokeWidth="0.75" fill="none">
                  <circle cx="0" cy="0" r="28" stroke="rgba(255, 255, 255, 0.2)" />
                  <circle cx="0" cy="0" r="18" stroke="rgba(255, 255, 255, 0.35)" />
                  <circle cx="0" cy="0" r="6" stroke="#D0D6E0" fill="#08090A" />
                  <line x1="-28" y1="0" x2="28" y2="0" stroke="rgba(255, 255, 255, 0.2)" strokeDasharray="2 2" />
                  <line x1="0" y1="-28" x2="0" y2="28" stroke="rgba(255, 255, 255, 0.2)" strokeDasharray="2 2" />
                </g>
              )}
            </motion.g>
          );
        })}

        {/* Interactive Invisible Hover Hit Areas */}
        {layers.map((idx) => {
          const { fillPath } = getLayerPaths(idx);
          return (
            <path
              key={`hit-${idx}`}
              d={fillPath}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(idx)}
            />
          );
        })}
      </svg>
    </div>
  );
}
