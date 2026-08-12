import { vi } from 'vitest';

// Simuliert den Canvas-Kontext für jsdom und Pixi.js
Object.defineProperty(window.HTMLCanvasElement.prototype, 'getContext', {
  value: () => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn((x, y, w, h) => ({
      data: new Uint8ClampedArray((w || 1) * (h || 1) * 4),
    })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => []),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn(() => ({ width: 0, height: 0 })),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  }),
});

// Zusätzlicher minimaler Mock für WebGL, da Pixi.js danach sucht
Object.defineProperty(window.HTMLCanvasElement.prototype, 'getContextWebGL', {
  value: vi.fn(() => ({
    getParameter: vi.fn(),
    getExtension: vi.fn(),
    createTexture: vi.fn(),
    bindTexture: vi.fn(),
    texParameteri: vi.fn(),
    texImage2D: vi.fn(),
    clearColor: vi.fn(),
    clear: vi.fn(),
  })),
});
