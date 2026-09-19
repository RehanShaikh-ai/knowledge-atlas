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
 * Animated canvas starfield with subtle mouse parallax and twinkling.
 * Renders behind all UI layers as a fixed background.
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
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let time = 0;

    const initStars = () => {
      const density = 8000; // Pixels squared per star
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

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const dx = (mouseX - cx) / cx; // Range: -1 to 1
      const dy = (mouseY - cy) / cy; // Range: -1 to 1

      for (const star of stars) {
        const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
        const opacity = Math.max(0.05, Math.min(1, star.baseOpacity + twinkle * 0.15));

        // Parallax effect
        const parallaxScale = star.size * 1.8;
        const px = star.x + dx * parallaxScale;
        const py = star.y + dy * parallaxScale;

        // Edge wrapping
        const wx = ((px % canvas.width) + canvas.width) % canvas.width;
        const wy = ((py % canvas.height) + canvas.height) % canvas.height;

        ctx.beginPath();
        ctx.arc(wx, wy, star.size, 0, Math.PI * 2);

        // Dynamic star coloring
        const hue = star.size > 0.9 ? 210 : 220;
        ctx.fillStyle = `hsla(${hue}, 80%, 92%, ${opacity})`;
        ctx.fill();

        // Star glow effect
        if (star.size > 0.85) {
          ctx.beginPath();
          ctx.arc(wx, wy, star.size * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${hue}, 80%, 80%, ${opacity * 0.12})`;
          ctx.fill();
        }
      }

      animFrame = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    resize();
    draw();

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
