/**
 * L155A — Volume-Guided Flashing System
 * Core Interaction & Physics Script
 * Reverse-Engineered Isometric Geometry & Spring Mechanics
 */

document.addEventListener('DOMContentLoaded', () => {
  initAmbientSpotlight();
  initFig1AccordionStack();
  initFig2DotMatrices();
  initFig3SpringSlabs();
  initWorkflowTabs();
  initChecksumCopy();
});

/* ==========================================================================
   1. Ambient Spotlight Tracking
   ========================================================================== */
function initAmbientSpotlight() {
  window.addEventListener('mousemove', (e) => {
    document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
    document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
  }, { passive: true });
}

/* ==========================================================================
   2. FIG 0.1: Volume-Guided Layer Stack (Accordion Lift & Hitboxes)
   ========================================================================== */
function initFig1AccordionStack() {
  const L = 114.46; // Base Y position
  const B = 16.3015; // Layer height / spacing
  const layerCount = 5;
  const layers = document.querySelectorAll('.purpose-lift-layer');
  const hitAreasGroup = document.getElementById('fig1HitAreas');

  if (!hitAreasGroup || layers.length === 0) return;

  // Generate paths for each layer
  layers.forEach((layerEl, idx) => {
    const y = L + idx * B;

    // Outer contour path
    const fillPath = `M250.355 ${y} a3.43 3.43 0 0 1 1.895 3.067 v${B} a3.43 3.43 0 0 1 -1.895 3.067 L136.85 ${y + 62.886 + B} a10.29 10.29 0 0 1 -9.2 0 L14.145 ${y + 6.134 + B} a3.43 3.43 0 0 1 -1.895 -3.067 V${y + 3.067} c0 -1.299 .734 -2.486 1.895 -3.067 L129.183 ${y - 57.519} a6.86 6.86 0 0 1 6.134 0 z`;

    // Top-face edge stroke
    const strokePath = `M14.145 ${y + 6.134 + B} a3.43 3.43 0 0 1 -1.895 -3.067 V${y + 3.067} c0 -1.299 .734 -2.486 1.895 -3.067 L129.183 ${y - 57.519} a6.86 6.86 0 0 1 6.134 0 L250.355 ${y} a3.43 3.43 0 0 1 1.895 3.067 v${B} a3.43 3.43 0 0 1 -1.895 3.067`;

    // Center divider
    const edgePath = `M250.355 ${y + 6.134 + B} L136.85 ${y + 62.886 + B} a10.29 10.29 0 0 1 -9.2 0 L14.145 ${y + 6.134 + B}`;

    const fillEl = layerEl.querySelector('.layer-fill');
    const strokeEl = layerEl.querySelector('.layer-stroke');
    const edgeEl = layerEl.querySelector('.layer-edge');

    if (fillEl) fillEl.setAttribute('d', fillPath);
    if (strokeEl) strokeEl.setAttribute('d', strokePath);
    if (edgeEl) edgeEl.setAttribute('d', edgePath);

    // Create invisible hover hit-box path
    const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hitPath.setAttribute('class', 'hit-area-path');
    hitPath.setAttribute('d', fillPath);
    hitPath.setAttribute('data-layer-idx', idx.toString());

    hitPath.addEventListener('mouseenter', () => {
      setHoverState(idx);
    });

    hitAreasGroup.appendChild(hitPath);
  });

  const fig1Viewport = document.getElementById('fig1Viewport');
  if (fig1Viewport) {
    fig1Viewport.addEventListener('mouseleave', () => {
      setHoverState(-1);
    });
  }

  function setHoverState(hoverIdx) {
    layers.forEach((layerEl, idx) => {
      if (hoverIdx >= 0 && idx <= hoverIdx) {
        const delay = (hoverIdx - idx) * 0.05;
        layerEl.style.setProperty('--lift-delay', `${delay}s`);
        layerEl.classList.add('lifted');
      } else {
        layerEl.style.setProperty('--lift-delay', '0s');
        layerEl.classList.remove('lifted');
      }
    });
  }
}

/* ==========================================================================
   3. FIG 0.2: 3D Projected LED Dot Matrix Animations
   ========================================================================== */
function initFig2DotMatrices() {
  const loaderBack = document.getElementById('loaderBack');
  const loaderLeft = document.getElementById('loaderLeft');
  const loaderRight = document.getElementById('loaderRight');

  if (!loaderBack || !loaderLeft || !loaderRight) return;

  // Build 5x5 grids
  const backDots = createGrid(loaderBack);
  const leftDots = createGrid(loaderLeft);
  const rightDots = createGrid(loaderRight);

  function createGrid(container) {
    container.innerHTML = '';
    const dots = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const dot = document.createElement('div');
        dot.className = 'matrix-dot';
        container.appendChild(dot);
        dots.push(dot);
      }
    }
    return dots;
  }

  // Animation 1: UpDown Wave (Sine Wave)
  let frameUpDown = 0;
  setInterval(() => {
    frameUpDown++;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const idx = r * 5 + c;
        const wave = Math.sin((c + frameUpDown * 0.5) * 0.8) * 1.8 + 2;
        const isLit = Math.abs(r - wave) < 0.7;
        backDots[idx].classList.toggle('lit', isLit);
      }
    }
  }, 120);

  // Animation 2: Pong Game (Paddle & Ball)
  let ballX = 2, ballY = 2;
  let velX = 1, velY = 1;
  let paddleY = 2;

  setInterval(() => {
    ballX += velX;
    ballY += velY;

    if (ballY <= 0 || ballY >= 4) velY *= -1;
    if (ballX <= 0) {
      velX *= -1;
      paddleY = ballY;
    }
    if (ballX >= 4) {
      velX *= -1;
    }

    paddleY = Math.max(1, Math.min(3, ballY));

    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const idx = r * 5 + c;
        const isBall = (r === ballY && c === ballX);
        const isPaddle = (c === 0 && Math.abs(r - paddleY) <= 1);
        leftDots[idx].classList.toggle('lit', isBall || isPaddle);
      }
    }
  }, 140);

  // Animation 3: Agent Pulse / Flashing Activity Heartbeat
  const pulseFrames = [
    [12],
    [7, 11, 13, 17],
    [2, 6, 8, 10, 14, 16, 18, 22],
    [1, 3, 5, 9, 15, 19, 21, 23],
    [0, 4, 20, 24],
    []
  ];
  let pulseIdx = 0;

  setInterval(() => {
    const litIndices = pulseFrames[pulseIdx] || [];
    pulseIdx = (pulseIdx + 1) % pulseFrames.length;

    rightDots.forEach((dot, idx) => {
      dot.classList.toggle('lit', litIndices.includes(idx));
    });
  }, 160);
}

/* ==========================================================================
   4. FIG 0.3: Spring Physics Wave Slabs (Framer-Motion Reproduction)
   ========================================================================== */
function initFig3SpringSlabs() {
  const group = document.getElementById('springSlabsGroup');
  const viewport = document.getElementById('fig3Viewport');
  if (!group || !viewport) return;

  // 15 Isometric Anchors
  const anchors = [
    {x: 254.46, y: 188.84}, {x: 246.01, y: 193.07}, {x: 237.56, y: 197.29},
    {x: 229.11, y: 201.52}, {x: 220.66, y: 205.74}, {x: 212.21, y: 209.97},
    {x: 203.76, y: 214.19}, {x: 195.31, y: 218.42}, {x: 186.86, y: 222.65},
    {x: 178.41, y: 226.87}, {x: 169.96, y: 231.09}, {x: 161.51, y: 235.32},
    {x: 153.05, y: 239.55}, {x: 144.60, y: 243.77}, {x: 136.15, y: 248.00}
  ];

  const defaultHeights = [20.5, 34.0, 54.3, 81.3, 128.6, 81.3, 54.3, 34.0, 20.5, 13.7, 10.3, 8.6, 7.8, 7.8, 7.8];

  // Spring parameters: damping: 18, mass: 1, stiffness: 180
  const stiffness = 180;
  const damping = 18;
  const mass = 1;

  const slabs = anchors.map((anchor, i) => ({
    x: anchor.x,
    y: anchor.y,
    baseHeight: defaultHeights[i],
    height: defaultHeights[i],
    targetHeight: defaultHeights[i],
    velocity: 0,
    mainPath: null,
    edgePath: null
  }));

  // Create SVG path elements
  slabs.forEach((slab) => {
    const main = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    main.setAttribute('fill', '#08090A');
    main.setAttribute('stroke', '#D0D6E0');
    main.setAttribute('stroke-width', '0.5');

    const edge = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    edge.setAttribute('fill', 'none');
    edge.setAttribute('stroke', '#3E3E44');
    edge.setAttribute('stroke-width', '0.5');

    group.appendChild(main);
    group.appendChild(edge);

    slab.mainPath = main;
    slab.edgePath = edge;
  });

  // Cursor tracking
  let isMouseInside = false;
  let mouseX = 136;

  viewport.addEventListener('mousemove', (e) => {
    isMouseInside = true;
    const rect = viewport.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width) * 272;
    updateTargets();
  });

  viewport.addEventListener('mouseleave', () => {
    isMouseInside = false;
    slabs.forEach(s => s.targetHeight = s.baseHeight);
  });

  function updateTargets() {
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
  }

  // Real-time Dynamic Path Geometry Helpers
  function getSlabPath(x, y, h) {
    const G = 117.416, H = 60.643;
    const px = x - G;
    const py = y - H - h;
    return `M${px} ${py} a1.44 1.44 0 0 1 1.288 0 l115.686 57.843 a3.13 3.13 0 0 1 1.73 2.8 v${h} a1.44 1.44 0 0 1 -.796 1.288 l-1.69 .845 a1.44 1.44 0 0 1 -1.288 0 l-115.686 -57.843 a3.13 3.13 0 0 1 -1.73 -2.8 v${-h} c0 -.545 .308 -1.044 .796 -1.288 z`;
  }

  function getFrontEdgePath(x, y, h) {
    const G = 117.416, H = 60.643;
    const px = x - G;
    const py = y - H - h;
    return `M${px + 0.645} ${py + 2.778} l113.061 56.531 a3.38 3.38 0 0 1 1.868 3.023 v${Math.max(0, h - 2.336)}`;
  }

  // 60fps Spring Simulation Loop
  let lastTime = performance.now();

  function animate(now) {
    const dt = Math.min((now - lastTime) / 1000, 0.032);
    lastTime = now;

    slabs.forEach((slab) => {
      const displacement = slab.height - slab.targetHeight;
      const springForce = -stiffness * displacement;
      const dampingForce = -damping * slab.velocity;
      const totalForce = springForce + dampingForce;
      const acceleration = totalForce / mass;

      slab.velocity += acceleration * dt;
      slab.height += slab.velocity * dt;

      // Update SVG path attributes
      const mainD = getSlabPath(slab.x, slab.y, slab.height);
      const edgeD = getFrontEdgePath(slab.x, slab.y, slab.height);

      slab.mainPath.setAttribute('d', mainD);
      slab.edgePath.setAttribute('d', edgeD);
    });

    requestAnimationFrame(animate);
  }

  requestAnimationFrame(animate);
}

/* ==========================================================================
   5. Technical Workflows Tab Switcher
   ========================================================================== */
function initWorkflowTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');

      tabs.forEach(t => t.classList.remove('active'));
      panels.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });
}

/* ==========================================================================
   6. Checksum Clipboard Copy
   ========================================================================== */
function initChecksumCopy() {
  const copyBtn = document.getElementById('copyChecksumBtn');
  const checksumText = document.getElementById('checksumText');

  if (!copyBtn || !checksumText) return;

  copyBtn.addEventListener('click', async () => {
    try {
      const text = checksumText.innerText.trim();
      await navigator.clipboard.writeText(text);
      const originalText = copyBtn.innerText;
      copyBtn.innerText = 'Copied!';
      copyBtn.style.borderColor = 'var(--color-success)';
      copyBtn.style.color = 'var(--color-success)';

      setTimeout(() => {
        copyBtn.innerText = originalText;
        copyBtn.style.borderColor = '';
        copyBtn.style.color = '';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy hash:', err);
    }
  });
}
