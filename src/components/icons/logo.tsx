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
        <linearGradient
          id="blue-grad"
          x1="0"
          y1="0"
          x2="0"
          y2="500"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#00a2ff" />
          <stop offset="100%" stopColor="#00388a" />
        </linearGradient>
        <linearGradient
          id="teal-grad"
          x1="0"
          y1="0"
          x2="0"
          y2="500"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#0b8c87" />
          <stop offset="100%" stopColor="#45e3d7" />
        </linearGradient>
        <linearGradient
          id="stroke-grad"
          x1="0"
          y1="0"
          x2="0"
          y2="500"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#606060" />
          <stop offset="100%" stopColor="#484848" />
        </linearGradient>
      </defs>
      <g
        stroke="url(#stroke-grad)"
        strokeWidth={6}
        strokeLinejoin="miter"
        strokeMiterlimit={20}
      >
        {/* BACK LAYER: Teal wing shapes */}
        <polygon points="246,120 83,91 246,480" fill="url(#teal-grad)" />
        <polygon points="254,120 417,91 254,480" fill="url(#teal-grad)" />
        {/* FRONT LAYER: Blue arrow shapes */}
        <polygon points="246,20 77,420 246,380" fill="url(#blue-grad)" />
        <polygon points="254,20 423,420 254,380" fill="url(#blue-grad)" />
      </g>
    </svg>
  );
}
