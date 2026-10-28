import React, { useState, useEffect } from 'react';

export default function AgentMatrixIsland() {
  const [frameUpDown, setFrameUpDown] = useState(0);
  const [pongState, setPongState] = useState({ bx: 2, by: 2, vx: 1, vy: 1, py: 2 });
  const [pulseIdx, setPulseIdx] = useState(0);

  // Animation 1: UpDown Wave
  useEffect(() => {
    const timer = setInterval(() => {
      setFrameUpDown((prev) => prev + 1);
    }, 120);
    return () => clearInterval(timer);
  }, []);

  // Animation 2: Pong Game
  useEffect(() => {
    const timer = setInterval(() => {
      setPongState((prev) => {
        let { bx, by, vx, vy, py } = prev;
        bx += vx;
        by += vy;

        if (by <= 0 || by >= 4) vy *= -1;
        if (bx <= 0) {
          vx *= -1;
          py = by;
        }
        if (bx >= 4) {
          vx *= -1;
        }

        py = Math.max(1, Math.min(3, by));
        return { bx, by, vx, vy, py };
      });
    }, 140);
    return () => clearInterval(timer);
  }, []);

  // Animation 3: Neural Pulse
  useEffect(() => {
    const pulseFrames = [
      [12],
      [7, 11, 13, 17],
      [2, 6, 8, 10, 14, 16, 18, 22],
      [1, 3, 5, 9, 15, 19, 21, 23],
      [0, 4, 20, 24],
      [],
    ];

    const timer = setInterval(() => {
      setPulseIdx((prev) => (prev + 1) % pulseFrames.length);
    }, 160);
    return () => clearInterval(timer);
  }, []);

  const renderBackGrid = () => {
    const dots = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const wave = Math.sin((c + frameUpDown * 0.5) * 0.8) * 1.8 + 2;
        const isLit = Math.abs(r - wave) < 0.7;
        dots.push(
          <div
            key={`back-${r}-${c}`}
            className={`w-[3px] h-[3px] rounded-full transition-opacity duration-100 ${
              isLit ? 'bg-accent opacity-100' : 'bg-accent opacity-15'
            }`}
          />
        );
      }
    }
    return dots;
  };

  const renderLeftGrid = () => {
    const dots = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const isBall = r === pongState.by && c === pongState.bx;
        const isPaddle = c === 0 && Math.abs(r - pongState.py) <= 1;
        const isLit = isBall || isPaddle;
        dots.push(
          <div
            key={`left-${r}-${c}`}
            className={`w-[3px] h-[3px] rounded-full transition-opacity duration-100 ${
              isLit ? 'bg-accent opacity-100' : 'bg-accent opacity-15'
            }`}
          />
        );
      }
    }
    return dots;
  };

  const renderRightGrid = () => {
    const pulseFrames = [
      [12],
      [7, 11, 13, 17],
      [2, 6, 8, 10, 14, 16, 18, 22],
      [1, 3, 5, 9, 15, 19, 21, 23],
      [0, 4, 20, 24],
      [],
    ];
    const currentLit = pulseFrames[pulseIdx] || [];

    const dots = [];
    for (let idx = 0; idx < 25; idx++) {
      const isLit = currentLit.includes(idx);
      dots.push(
        <div
          key={`right-${idx}`}
          className={`w-[3px] h-[3px] rounded-full transition-opacity duration-100 ${
            isLit ? 'bg-accent opacity-100' : 'bg-accent opacity-15'
          }`}
        />
      );
    }
    return dots;
  };

  return (
    <div className="w-full h-[280px] flex items-center justify-center relative select-none">
      <div className="w-[304px] h-[281px] relative [perspective:1000px]">
        {/* Back Cube LED Screen */}
        <div
          className="absolute top-[14px] left-[136px] w-[32px] h-[32px] grid grid-cols-5 gap-[2px] pointer-events-none z-10"
          style={{
            transform: 'rotateX(60deg) rotateY(3deg) scale(0.85) rotate(43deg)',
            transformOrigin: '0 0',
          }}
        >
          {renderBackGrid()}
        </div>

        {/* Left Cube LED Screen */}
        <div
          className="absolute top-[66px] left-[72px] w-[32px] h-[32px] grid grid-cols-5 gap-[2px] pointer-events-none z-10"
          style={{
            transform: 'rotateX(60deg) rotateY(3deg) scale(0.85) rotate(43deg)',
            transformOrigin: '0 0',
          }}
        >
          {renderLeftGrid()}
        </div>

        {/* Right Cube LED Screen */}
        <div
          className="absolute top-[110px] left-[200px] w-[32px] h-[32px] grid grid-cols-5 gap-[2px] pointer-events-none z-10"
          style={{
            transform: 'rotateX(60deg) rotateY(3deg) scale(0.85) rotate(43deg)',
            transformOrigin: '0 0',
          }}
        >
          {renderRightGrid()}
        </div>

        {/* Wireframe Cubes SVG */}
        <svg width="304" height="281" viewBox="0 0 304 281" fill="none" className="absolute top-0 left-0">
          {/* Back Cube (Tall) */}
          <path
            fill="#08090A"
            stroke="#D0D6E0"
            strokeWidth="0.5"
            d="M148.534 1.068a7.75 7.75 0 0 1 6.932 0l50.211 25.106a3.75 3.75 0 0 1 2.073 3.354v125.056c0 1.42-.803 2.718-2.073 3.354l-50.211 25.105a7.75 7.75 0 0 1-6.932 0l-50.21-25.105a3.75 3.75 0 0 1-2.074-3.354V29.528a3.75 3.75 0 0 1 2.073-3.354z"
          />
          <path
            stroke="rgba(255, 255, 255, 0.15)"
            strokeLinecap="round"
            strokeWidth="0.5"
            d="m102 30.056 46.422 23.21a8 8 0 0 0 7.156 0L202 30.057"
          />

          {/* Left Cube (Medium) */}
          <path
            fill="#08090A"
            stroke="#D0D6E0"
            strokeWidth="0.5"
            d="M84.534 53.069a7.75 7.75 0 0 1 6.932 0l50.211 25.105a3.75 3.75 0 0 1 2.073 3.353v73.057c0 1.42-.803 2.718-2.073 3.354l-50.211 25.105a7.75 7.75 0 0 1-6.932 0l-50.21-25.105a3.75 3.75 0 0 1-2.074-3.354V81.528a3.75 3.75 0 0 1 2.073-3.354z"
          />
          <path
            stroke="rgba(255, 255, 255, 0.15)"
            strokeLinecap="round"
            strokeWidth="0.5"
            d="m38 82.056 46.422 23.211a8 8 0 0 0 7.156 0L138 82.056"
          />

          {/* Right Cube (Medium) */}
          <path
            fill="#08090A"
            stroke="#D0D6E0"
            strokeWidth="0.5"
            d="M212.534 97.069a7.75 7.75 0 0 1 6.932 0l50.211 25.105a3.75 3.75 0 0 1 2.073 3.353v61.057c0 1.42-.803 2.718-2.073 3.354l-50.211 25.105a7.75 7.75 0 0 1-6.932 0l-50.211-25.105a3.75 3.75 0 0 1-2.073-3.354v-61.057a3.75 3.75 0 0 1 2.073-3.353z"
          />
          <path
            stroke="rgba(255, 255, 255, 0.15)"
            strokeLinecap="round"
            strokeWidth="0.5"
            d="m166 126.056 46.422 23.211a8 8 0 0 0 7.156 0l46.422-23.211"
          />

          {/* Front Small Cube */}
          <path
            fill="#08090A"
            stroke="rgba(255, 255, 255, 0.25)"
            strokeWidth="0.5"
            d="M84.534 139.068a7.76 7.76 0 0 1 6.932 0l50.211 25.106a3.75 3.75 0 0 1 2.073 3.353v19.057c0 1.42-.803 2.718-2.073 3.354l-50.211 25.105a7.75 7.75 0 0 1-6.932 0l-50.21-25.105a3.75 3.75 0 0 1-2.074-3.354v-19.057a3.75 3.75 0 0 1 2.073-3.353z"
          />
          <path
            stroke="rgba(255, 255, 255, 0.15)"
            strokeLinecap="round"
            strokeWidth="0.5"
            d="m38 168.056 46.422 23.211a8 8 0 0 0 7.156 0L138 168.056"
          />
        </svg>
      </div>
    </div>
  );
}
