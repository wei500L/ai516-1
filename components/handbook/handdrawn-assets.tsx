import React from "react";
import { cn } from "@/lib/utils";

/**
 * Handdrawn SVG Filters for textures and rough edges
 */
export const HanddrawnFilters = () => (
  <svg className="absolute h-0 w-0" aria-hidden="true">
    <defs>
      {/* Filter for rough, fibrous paper edges */}
      <filter id="roughEdge" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" />
      </filter>
      
      {/* Filter for paper grain texture */}
      <filter id="paperGrain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
        <feDiffuseLighting in="noise" lightingColor="#fff" surfaceScale="2">
          <feDistantLight azimuth="45" elevation="60" />
        </feDiffuseLighting>
        <feComposite in="SourceGraphic" operator="in" />
      </filter>

      {/* Filter for subtle hand-drawn wobble */}
      <filter id="handWobble" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" />
      </filter>
    </defs>
  </svg>
);

export const HanddrawnIcons = {
  Flower: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 12c2.2-2.5 4.5-2.5 4.5-2.5s0 2.2-2.3 4.5c2.5 2.2 2.5 4.5 2.5 4.5s-2.2 0-4.5-2.5c-2.2 2.5-4.5 2.5-4.5 2.5s0-2.2 2.3-4.5c-2.5-2.2-2.5-4.5-2.5-4.5s2.2 0 4.5 2.5z" filter="url(#handWobble)" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <path d="M12 15.5v4.5" />
      <path d="M12 17.5c-1 0.5-2 1.5-2 1.5" />
      <path d="M12 18.5c1 0.5 2 1.5 2 1.5" />
    </svg>
  ),
  Heart: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" filter="url(#handWobble)" />
    </svg>
  ),
  Paperclip: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="#4a3b2f" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M13.44 6.22a4.5 4.5 0 0 0-6.36 6.36l6.89 6.89a2.5 2.5 0 0 0 3.54-3.54l-5.94-5.94a1 1 0 0 0-1.42 1.42l5.94 5.94a.5.5 0 1 1-.71.71l-5.94-5.94a2.5 2.5 0 0 1 3.54-3.54l5.94 5.94a4.5 4.5 0 0 1-6.36 6.36L6.5 13.5" />
      <path d="M13.44 6.22L6.5 13.5" opacity="0.2" strokeWidth="0.5" />
    </svg>
  ),
  Sprout: ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20V10" />
      <path d="M12 10c2-1 5-1 7 1" />
      <path d="M12 13c-2-1-5-1-7 1" />
      <path d="M12 10c0-2.5 1-5 4-6" />
      <path d="M12 10c0-2.5-1-5-4-6" />
    </svg>
  )
};

export function HanddrawnTornPaper({ color = "var(--cream)", className, children }: { color?: string, className?: string, children?: React.ReactNode }) {
  return (
    <div className={cn("relative p-6 overflow-visible", className)}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path
          d="M2,2 Q5,0 10,2 T20,1 T30,3 T40,1 T50,2 T60,0 T70,3 T80,1 T90,2 T98,5 
             L97,95 Q95,98 90,96 T80,98 T70,95 T60,97 T50,95 T40,98 T30,96 T20,97 T10,95 T2,92 Z"
          fill={color}
          filter="url(#roughEdge)"
          stroke="rgba(0,0,0,0.05)"
          strokeWidth="0.5"
        />
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function HanddrawnTape({ className, color = "rgba(221, 197, 147, 0.5)" }: { className?: string, color?: string }) {
  return (
    <div className={cn("absolute z-20 pointer-events-none", className)}>
      <svg width="100" height="30" viewBox="0 0 100 30" preserveAspectRatio="none">
        <path
          d="M2,5 Q5,2 15,4 T35,3 T55,5 T75,2 T95,6 L98,25 Q95,28 85,26 T65,27 T45,25 T25,28 T5,24 Z"
          fill={color}
          filter="url(#roughEdge)"
          opacity="0.8"
        />
        <path
          d="M2,5 Q5,2 15,4 T35,3 T55,5 T75,2 T95,6"
          fill="none"
          stroke="white"
          strokeOpacity="0.3"
          strokeWidth="1"
        />
        {/* Washi tape fibers */}
        <path
          d="M10,5 L90,25 M20,4 L80,26 M30,6 L70,24"
          stroke="white"
          strokeOpacity="0.1"
          strokeWidth="0.5"
        />
      </svg>
    </div>
  );
}

export function HanddrawnWaxSeal({ className, color = "var(--wax-red)" }: { className?: string, color?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-md">
        <path
          d="M50,5 Q70,5 85,20 T95,50 T85,80 T50,95 T15,80 T5,50 T15,20 Z"
          fill={color}
          filter="url(#handWobble)"
        />
        <path
          d="M50,12 Q68,12 78,22 T83,50 T78,78 T50,88 T22,78 T17,50 T22,22 Z"
          fill="black"
          fillOpacity="0.1"
        />
      </svg>
      <HanddrawnIcons.Heart className="relative z-10 w-1/2 h-1/2 text-white/40" />
    </div>
  );
}

export function HanddrawnEnvelope({ className, color = "var(--parchment)" }: { className?: string, color?: string }) {
  return (
    <div className={cn("relative w-64 h-40 overflow-visible", className)}>
      <svg viewBox="0 0 200 130" className="absolute inset-0 w-full h-full drop-shadow-lg" preserveAspectRatio="none">
        {/* Main body */}
        <rect x="5" y="5" width="190" height="120" rx="2" fill={color} filter="url(#handWobble)" />
        {/* Side folds */}
        <path d="M5,5 L100,65 L5,125 Z" fill="black" fillOpacity="0.05" />
        <path d="M195,5 L100,65 L195,125 Z" fill="black" fillOpacity="0.05" />
        {/* Bottom fold */}
        <path d="M5,125 L100,65 L195,125 Z" fill={color} filter="url(#handWobble)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
        {/* Top flap */}
        <path d="M5,5 L100,70 L195,5 Z" fill={color} filter="url(#handWobble)" stroke="rgba(0,0,0,0.1)" strokeWidth="0.5" />
      </svg>
      <HanddrawnWaxSeal className="absolute left-1/2 top-[55px] -translate-x-1/2 w-10 h-10" />
    </div>
  );
}

export function HanddrawnCabin({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-64 h-56", className)}>
      <svg viewBox="0 0 200 180" className="w-full h-full drop-shadow-xl" preserveAspectRatio="none">
        {/* Ground shadow */}
        <ellipse cx="100" cy="165" rx="80" ry="10" fill="black" fillOpacity="0.1" filter="url(#roughEdge)" />
        
        {/* Main walls */}
        <path d="M30,160 L30,70 L170,70 L170,160 Z" fill="#d2b48c" filter="url(#roughEdge)" />
        {/* Left wall shadow */}
        <path d="M30,160 L30,70 L50,80 L50,170 Z" fill="black" fillOpacity="0.1" />
        
        {/* Roof */}
        <path d="M20,80 L100,10 L180,80 Z" fill="#8b4513" filter="url(#roughEdge)" />
        {/* Roof texture (tiles) */}
        <path d="M40,70 L100,25 L160,70" fill="none" stroke="black" strokeOpacity="0.1" strokeWidth="5" strokeDasharray="10 5" />
        
        {/* Door */}
        <path d="M85,160 L85,110 Q100,95 115,110 L115,160 Z" fill="#ffbc54" filter="url(#handWobble)" />
        {/* Door glow */}
        <path d="M85,160 L85,110 Q100,95 115,110 L115,160 Z" fill="url(#doorGlow)" fillOpacity="0.8" />
        
        {/* Windows */}
        <rect x="50" y="100" width="20" height="25" fill="#fff" fillOpacity="0.4" filter="url(#handWobble)" />
        <rect x="130" y="100" width="20" height="25" fill="#ffd477" fillOpacity="0.6" filter="url(#handWobble)" />
        
        <defs>
          <radialGradient id="doorGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffda8b" stopOpacity="1" />
            <stop offset="100%" stopColor="#ff9c33" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

export function HanddrawnCircle({ color = "currentColor", className }: { color?: string, className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
        <path
          d="M50,10 Q70,8 85,25 T92,50 T82,78 T50,90 T18,78 T8,50 T15,25 Z"
          fill={color}
          filter="url(#handWobble)"
          stroke="rgba(0,0,0,0.1)"
          strokeWidth="0.5"
        />
      </svg>
    </div>
  );
}

export function HanddrawnButtonShape({ color = "var(--cream)", className, children }: { color?: string, className?: string, children?: React.ReactNode }) {
  return (
    <div className={cn("relative px-8 py-4 flex items-center justify-center overflow-visible", className)}>
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 300 60">
        <path
          d="M5,8 Q10,2 30,5 T70,3 T110,6 T150,2 T190,5 T230,3 T270,6 T295,8 
             L292,52 Q285,58 250,55 T200,57 T150,54 T100,56 T50,54 T10,52 Z"
          fill={color}
          filter="url(#roughEdge)"
          stroke="rgba(0,0,0,0.05)"
          strokeWidth="0.5"
        />
      </svg>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
