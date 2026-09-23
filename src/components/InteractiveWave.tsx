"use client";

import React, { useEffect, useRef } from "react";

interface InteractiveWaveProps {
  variant?: "color" | "white";
  waveCount?: number;
  baseSpeed?: number;
  baseAmplitude?: number;
  baseFrequency?: number;
  className?: string;
  /** The ribbon's outer stops as "r, g, b". The brand blue by default. */
  blue?: string;
  /** Draw one still frame instead of animating (reduced motion). */
  still?: boolean;
}

export default function InteractiveWave({
  variant = "color",
  waveCount = 10,
  baseSpeed = 0.02,
  baseAmplitude = 35,
  baseFrequency = 0.005,
  className = "inset-0 w-full h-full",
  blue = "6, 59, 170",
  still = false,
}: InteractiveWaveProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, active: false });
  const animationFrameRef = useRef<number | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize handler
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = (rect.width || window.innerWidth) * window.devicePixelRatio;
      canvas.height = (rect.height || 200) * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    // Resizing clears the canvas, so a still ribbon draws its frame again.
    const handleResize = () => {
      resizeCanvas();
      if (still) draw();
    };
    window.addEventListener("resize", handleResize);

    // Mouse/Touch interaction listeners on parent
    const parent = canvas.parentElement;

    const handleMouseMove = (e: MouseEvent) => {
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      mouseRef.current.targetX = e.clientX - rect.left;
      mouseRef.current.targetY = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!parent || e.touches.length === 0) return;
      const rect = parent.getBoundingClientRect();
      mouseRef.current.targetX = e.touches[0].clientX - rect.left;
      mouseRef.current.targetY = e.touches[0].clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    if (parent) {
      parent.addEventListener("mousemove", handleMouseMove, { passive: true });
      parent.addEventListener("touchmove", handleTouchMove, { passive: true });
      parent.addEventListener("mouseleave", handleMouseLeave, { passive: true });
      parent.addEventListener("touchend", handleMouseLeave, { passive: true });
    }

    // Animation Loop
    const draw = () => {
      if (!canvas || !ctx) return;
      
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      
      ctx.clearRect(0, 0, width, height);

      // Lerp mouse coordinates
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Calculate dynamic parameters based on mouse
      let speedMultiplier = 1;
      let ampMultiplier = 1;
      let freqMultiplier = 1;

      if (mouse.active) {
        // Closer to center = slightly higher amplitude
        const dx = mouse.x - width / 2;
        const dy = mouse.y - height / 2;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const maxDist = Math.sqrt((width * width) / 4 + (height * height) / 4);
        const proximity = 1 - Math.min(1, dist / maxDist);
        
        ampMultiplier = 1 + proximity * 0.4;
        speedMultiplier = 1 + proximity * 0.5;
        freqMultiplier = 1 - proximity * 0.2;
      }

      timeRef.current += baseSpeed * speedMultiplier;
      const time = timeRef.current;
      const centerY = height / 2;

      // Draw waveCount paths close together to form a ribbon
      for (let i = 0; i < waveCount; i++) {
        ctx.beginPath();

        const ratio = i / waveCount;
        // Subtle offset shifts for each strand
        const strandOffset = ratio * 0.18;
        const strandAmp = baseAmplitude * ampMultiplier * (0.85 + 0.15 * Math.sin(time * 0.2 + ratio * Math.PI));
        
        // Setup stroke color/gradient
        ctx.lineWidth = 1.0;
        
        if (variant === "color") {
          // Draw standard blue-to-mint gradient wave matching the brand
          const grad = ctx.createLinearGradient(0, 0, width, 0);
          grad.addColorStop(0, `rgba(${blue}, ${0.08 - ratio * 0.03})`);
          grad.addColorStop(0.5, `rgba(151, 237, 204, ${0.14 - ratio * 0.04})`);
          grad.addColorStop(1, `rgba(${blue}, ${0.05 - ratio * 0.02})`);
          ctx.strokeStyle = grad;
        } else {
          // Draw clean semi-transparent white waves for dark card gradients
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.18 - ratio * 0.08})`;
        }

        // Draw curve across width
        for (let x = 0; x <= width; x += 2) {
          // Envelope: Pinches the wave at left and right boundaries (0 at edges, 1 in center)
          const envelope = Math.sin((x / width) * Math.PI);
          
          // Sine calculation
          const freq = baseFrequency * freqMultiplier;
          const sineTerm = Math.sin(x * freq * 15 + time + strandOffset * 10);
          const y = centerY + sineTerm * strandAmp * envelope;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      if (!still) animationFrameRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (parent) {
        parent.removeEventListener("mousemove", handleMouseMove);
        parent.removeEventListener("touchmove", handleTouchMove);
        parent.removeEventListener("mouseleave", handleMouseLeave);
        parent.removeEventListener("touchend", handleMouseLeave);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [variant, waveCount, baseSpeed, baseAmplitude, baseFrequency, blue, still]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute pointer-events-none z-0 ${className}`}
    />
  );
}
