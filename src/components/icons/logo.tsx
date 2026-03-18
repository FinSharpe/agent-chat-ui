import React from "react";

export default function Logo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 500"
      width="100%"
      height="100%"
    >
      <defs>
        {/* Precise color grading for the front blue shapes (Bright Cyan to Deep Navy) */}
        <linearGradient
          id="blue-grad"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor="#00a2ff"
          />
          <stop
            offset="100%"
            stopColor="#00388a"
          />
        </linearGradient>
        {/* Precise color grading for the back teal shapes (Dark Teal to Bright Cyan-Teal) */}
        <linearGradient
          id="teal-grad"
          x1="0%"
          y1="0%"
          x2="0%"
          y2="100%"
        >
          <stop
            offset="0%"
            stopColor="#0b8c87"
          />
          <stop
            offset="100%"
            stopColor="#45e3d7"
          />
        </linearGradient>
      </defs>
      {/* Group for shared metallic dark gray stroke and perfectly sharp miter joints */}
      <g
        stroke="#555555"
        strokeWidth={6}
        strokeLinejoin="miter"
        strokeMiterlimit={20}
      >
        {/* BACK LAYER: Teal Shapes */}
        {/* Left Teal: Extends from the outer left point down to the bottom center */}
        <polygon
          points="246,480 246,120 50,80"
          fill="url(#teal-grad)"
        />
        {/* Right Teal: Mirrored equivalent */}
        <polygon
          points="254,480 254,120 450,80"
          fill="url(#teal-grad)"
        />
        {/* FRONT LAYER: Blue Shapes */}
        {/* Left Blue: Pointing upwards, covers the inner geometry of the teal shape */}
        <polygon
          points="246,20 50,420 246,380"
          fill="url(#blue-grad)"
        />
        {/* Right Blue: Mirrored equivalent */}
        <polygon
          points="254,20 450,420 254,380"
          fill="url(#blue-grad)"
        />
      </g>
    </svg>
  );
}
