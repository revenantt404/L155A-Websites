import React, { useRef, useEffect } from 'react';

const ANCHORS = [
  { x: 254.46, y: 188.84 }, { x: 246.01, y: 193.07 }, { x: 237.56, y: 197.29 },
  { x: 229.11, y: 201.52 }, { x: 220.66, y: 205.74 }, { x: 212.21, y: 209.97 },
  { x: 203.76, y: 214.19 }, { x: 195.31, y: 218.42 }, { x: 186.86, y: 222.65 },
  { x: 178.41, y: 226.87 }, { x: 169.96, y: 231.09 }, { x: 161.51, y: 235.32 },
  { x: 153.05, y: 239.55 }, { x: 144.60, y: 243.77 }, { x: 136.15, y: 248.00 },
];

const DEFAULT_HEIGHTS = [
  20.5, 34.0, 54.3, 81.3, 128.6, 81.3, 54.3, 34.0, 20.5, 13.7, 10.3, 8.6, 7.8, 7.8, 7.8,
];

function getSlabPath(x: number, y: number, h: number) {
  const G = 117.416, H = 60.643;
  const px = x - G;
  const py = y - H - h;
  return `M${px} ${py} a1.44 1.44 0 0 1 1.288 0 l115.686 57.843 a3.13 3.13 0 0 1 1.73 2.8 v${h} a1.44 1.44 0 0 1 -.796 1.288 l-1.69 .845 a1.44 1.44 0 0 1 -1.288 0 l-115.686 -57.843 a3.13 3.13 0 0 1 -1.73 -2.8 v${-h} c0 -.545 .308 -1.044 .796 -1.288 z`;
}

function getFrontEdgePath(x: number, y: number, h: number) {
  const G = 117.416, H = 60.643;
  const px = x - G;
  const py = y - H - h;
  return `M${px + 0.645} ${py + 2.778} l113.061 56.531 a3.38 3.38 0 0 1 1.868 3.023 v${Math.max(0, h - 2.336)}`;
}

export default function SpeedWaveIsland() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainPathsRef = useRef<SVGPathElement[]>([]);
  const edgePathsRef = useRef<SVGPathElement[]>([]);

  useEffect(() => {
    const stiffness = 180;
    const damping = 18;
    const mass = 1;

    const slabs = ANCHORS.map((anchor, i) => ({
      x: anchor.x,
      y: anchor.y,
      baseHeight: DEFAULT_HEIGHTS[i],
      height: DEFAULT_HEIGHTS[i],
      targetHeight: DEFAULT_HEIGHTS[i],
      velocity: 0,
    }));

    let mouseX = 136;
    let animId: number;
    let lastTime = performance.now();

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 272;

      slabs.forEach((slab) => {
        const plateX = slab.x - 59;
        const t = Math.abs(mouseX - plateX);

        if (t <= 0) {
          slab.targetHeight = 128;
        } else if (t <= 25) {
          slab.targetHeight = 128 - (t / 25) * 88;
        } else if (t <= 60) {
          slab.targetHeight = 40 - ((t - 25) / 35) * 28;
        } else {
          slab.targetHeight = slab.baseHeight;
        }
      });
    };

    const handleMouseLeave = () => {
      slabs.forEach((slab) => {
        slab.targetHeight = slab.baseHeight;
      });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', handleMouseLeave);
    }

    const animate = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.032);
      lastTime = now;

      slabs.forEach((slab, i) => {
        const displacement = slab.height - slab.targetHeight;
        const springForce = -stiffness * displacement;
        const dampingForce = -damping * slab.velocity;
        const totalForce = springForce + dampingForce;
        const acceleration = totalForce / mass;

        slab.velocity += acceleration * dt;
        slab.height += slab.velocity * dt;

        const mainD = getSlabPath(slab.x, slab.y, slab.height);
        const edgeD = getFrontEdgePath(slab.x, slab.y, slab.height);

        if (mainPathsRef.current[i]) {
          mainPathsRef.current[i].setAttribute('d', mainD);
        }
        if (edgePathsRef.current[i]) {
          edgePathsRef.current[i].setAttribute('d', edgeD);
        }
      });

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animId);
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-[280px] flex items-center justify-center relative cursor-crosshair select-none"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="272"
        height="267"
        viewBox="0 0 272 267"
        fill="none"
        className="overflow-visible"
      >
        {ANCHORS.map((anchor, i) => (
          <g key={i}>
            <path
              ref={(el) => {
                if (el) mainPathsRef.current[i] = el;
              }}
              fill="#08090A"
              stroke="#D0D6E0"
              strokeWidth="0.5"
              d={getSlabPath(anchor.x, anchor.y, DEFAULT_HEIGHTS[i])}
            />
            <path
              ref={(el) => {
                if (el) edgePathsRef.current[i] = el;
              }}
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="0.5"
              d={getFrontEdgePath(anchor.x, anchor.y, DEFAULT_HEIGHTS[i])}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
