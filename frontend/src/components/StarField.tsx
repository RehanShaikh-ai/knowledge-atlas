import React, { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

/**
 * Animated background canvas featuring:
 * 1. Large Fisheye Lens styled curved blueprint grid
 * 2. Subtle optical center tracking with mouse parallax
 * 3. Deep space twinkling constellation starfield
 */
export const StarField: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    let stars: Star[] = [];
    let lastDrawTime = 0;
    const fpsInterval = 1000 / 30; // Cap at 30 FPS for massive CPU/GPU savings
    
    // Optical & mouse tracking
    let targetFocalX = window.innerWidth / 2;
    let targetFocalY = window.innerHeight / 2;
    let focalX = targetFocalX;
    let focalY = targetFocalY;
    let mouseX = targetFocalX;
    let mouseY = targetFocalY;
    let time = 0;

    const initStars = () => {
      const density = 14000;
      const count = Math.floor((canvas.width * canvas.height) / density);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.1 + 0.2,
        baseOpacity: Math.random() * 0.5 + 0.15,
        twinkleSpeed: Math.random() * 0.004 + 0.001,
        twinkleOffset: Math.random() * Math.PI * 2,
      }));
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    // Fisheye Lens Projection
    const projectFisheye = (x: number, y: number, fx: number, fy: number, maxRadius: number) => {
      const dx = x - fx;
      const dy = y - fy;
      const dist = Math.hypot(dx, dy);
      if (dist === 0) return { x, y };

      const norm = dist / maxRadius;
      // Barrel fisheye expansion: curves lines radially outwards from the optical center
      const factor = 1 + 0.34 * Math.pow(norm, 2);
      return {
        x: fx + dx * factor,
        y: fy + dy * factor,
      };
    };

    const draw = (now: number) => {
      animFrame = requestAnimationFrame(draw);

      if (document.hidden) return;

      const elapsed = now - lastDrawTime;
      if (elapsed < fpsInterval) return;
      lastDrawTime = now - (elapsed % fpsInterval);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      // Smooth dampening for the fisheye optical focal center
      focalX += (targetFocalX - focalX) * 0.04;
      focalY += (targetFocalY - focalY) * 0.04;

      const w = canvas.width;
      const h = canvas.height;
      const maxRadius = Math.hypot(w, h) * 0.65;

      // ======================================================================
      // 1. Large Fisheye Lens Grid
      // ======================================================================
      const gridSize = 120; // Optimized grid spacing
      const step = 40;      // Step size along curve for smooth arcs with half calculation overhead

      // Create radial lens gradient for subtle, high-end visibility
      const gridGradient = ctx.createRadialGradient(focalX, focalY, 40, focalX, focalY, maxRadius);
      gridGradient.addColorStop(0, 'rgba(56, 189, 248, 0.22)');     // Optical center cyan tint
      gridGradient.addColorStop(0.4, 'rgba(148, 163, 184, 0.16)');  // Subtle, clearly visible body
      gridGradient.addColorStop(0.85, 'rgba(148, 163, 184, 0.08)'); // Distant horizon fade
      gridGradient.addColorStop(1, 'rgba(148, 163, 184, 0.02)');

      ctx.save();
      ctx.strokeStyle = gridGradient;
      ctx.lineWidth = 1.1;

      // Vertical Curved Lines
      const startX = Math.floor((focalX % gridSize) - gridSize * 3);
      const endX = w + gridSize * 3;
      for (let gx = startX; gx <= endX; gx += gridSize) {
        ctx.beginPath();
        let first = true;
        for (let gy = -gridSize * 2; gy <= h + gridSize * 2; gy += step) {
          const pt = projectFisheye(gx, gy, focalX, focalY, maxRadius);
          if (first) {
            ctx.moveTo(pt.x, pt.y);
            first = false;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        ctx.stroke();
      }

      // Horizontal Curved Lines
      const startY = Math.floor((focalY % gridSize) - gridSize * 3);
      const endY = h + gridSize * 3;
      for (let gy = startY; gy <= endY; gy += gridSize) {
        ctx.beginPath();
        let first = true;
        for (let gx = -gridSize * 2; gx <= w + gridSize * 2; gx += step) {
          const pt = projectFisheye(gx, gy, focalX, focalY, maxRadius);
          if (first) {
            ctx.moveTo(pt.x, pt.y);
            first = false;
          } else {
            ctx.lineTo(pt.x, pt.y);
          }
        }
        ctx.stroke();
      }

      // Fisheye Grid Intersection Nodes
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      for (let gx = startX; gx <= endX; gx += gridSize) {
        for (let gy = startY; gy <= endY; gy += gridSize) {
          const pt = projectFisheye(gx, gy, focalX, focalY, maxRadius);
          if (pt.x >= -10 && pt.x <= w + 10 && pt.y >= -10 && pt.y <= h + 10) {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 1.6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      ctx.restore();

      // ======================================================================
      // 2. Constellation Stars & Twinkle
      // ======================================================================
      const cx = w / 2;
      const cy = h / 2;
      const dx = (mouseX - cx) / cx;
      const dy = (mouseY - cy) / cy;

      for (const star of stars) {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
        const opacity = Math.max(0.06, Math.min(1, star.baseOpacity + twinkle * 0.15));

        // Parallax effect
        const parallaxScale = star.size * 1.8;
        const px = star.x + dx * parallaxScale;
        const py = star.y + dy * parallaxScale;

        // Edge wrapping
        const wx = ((px % w) + w) % w;
        const wy = ((py % h) + h) % h;

        ctx.beginPath();
        ctx.arc(wx, wy, star.size, 0, Math.PI * 2);

        // Dynamic star coloring
        const hue = star.size > 0.9 ? 210 : 220;
        ctx.fillStyle = `hsla(${hue}, 80%, 92%, ${opacity})`;
        ctx.fill();

        // Star glow effect for brighter stars
        if (star.size > 0.85) {
          ctx.beginPath();
          ctx.arc(wx, wy, star.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue}, 80%, 80%, ${opacity * 0.12})`;
          ctx.fill();
        }
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      // Gently bias focal center toward cursor for interactive optical depth
      targetFocalX = canvas.width / 2 + (e.clientX - canvas.width / 2) * 0.25;
      targetFocalY = canvas.height / 2 + (e.clientY - canvas.height / 2) * 0.25;
    };

    resize();
    animFrame = requestAnimationFrame(draw);

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="starfield-canvas" aria-hidden="true" />;
};
