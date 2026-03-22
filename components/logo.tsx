export function Logo({ className = "" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 300 220" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hexagon Crystal Logo */}
      <g transform="translate(150, 85)">
        {/* Top facet (lightest) */}
        <polygon points="0,-70 -60,-35 -20,0 20,0 60,-35" fill="#f5f5f5"/>
        
        {/* Upper left facet */}
        <polygon points="-60,-35 -60,15 -20,0" fill="#d0d0d0"/>
        
        {/* Upper right facet */}
        <polygon points="60,-35 60,15 20,0" fill="#b0b0b0"/>
        
        {/* Center facet */}
        <polygon points="-20,0 -60,15 0,50 60,15 20,0" fill="#e0e0e0"/>
        
        {/* Lower left facet */}
        <polygon points="-60,15 -30,55 0,50" fill="#a0a0a0"/>
        
        {/* Lower right facet */}
        <polygon points="60,15 30,55 0,50" fill="#808080"/>
        
        {/* Bottom facet (darkest) */}
        <polygon points="-30,55 0,85 30,55 0,50" fill="#606060"/>
      </g>
      
      {/* KINKER Text */}
      <text 
        x="150" 
        y="195" 
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" 
        fontSize="32" 
        fontWeight="300" 
        letterSpacing="8" 
        fill="currentColor" 
        textAnchor="middle"
      >
        KINKER
      </text>
    </svg>
  )
}

export function LogoIcon({ className = "" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 140 140" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Hexagon Crystal Logo - Icon only */}
      <g transform="translate(70, 70)">
        {/* Top facet (lightest) */}
        <polygon points="0,-60 -52,-30 -17,0 17,0 52,-30" fill="#f5f5f5"/>
        
        {/* Upper left facet */}
        <polygon points="-52,-30 -52,12 -17,0" fill="#d0d0d0"/>
        
        {/* Upper right facet */}
        <polygon points="52,-30 52,12 17,0" fill="#b0b0b0"/>
        
        {/* Center facet */}
        <polygon points="-17,0 -52,12 0,42 52,12 17,0" fill="#e0e0e0"/>
        
        {/* Lower left facet */}
        <polygon points="-52,12 -26,48 0,42" fill="#a0a0a0"/>
        
        {/* Lower right facet */}
        <polygon points="52,12 26,48 0,42" fill="#808080"/>
        
        {/* Bottom facet (darkest) */}
        <polygon points="-26,48 0,78 26,48 0,42" fill="#606060"/>
      </g>
    </svg>
  )
}
