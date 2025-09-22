import { motion } from "motion/react";

interface DynamicBackgroundProps {
  variant?: 'home' | 'registration' | 'onboarding' | 'dashboard';
}

export function DynamicBackground({ variant = 'home' }: DynamicBackgroundProps) {
  const getVariantConfig = () => {
    switch (variant) {
      case 'home':
        return {
          gradient: 'from-blue-50 via-orange-50 to-white',
          shapes: [
            { color: '#E3701B', opacity: 0.1, size: 300, x: 10, y: 10 },
            { color: '#4285F4', opacity: 0.08, size: 200, x: 80, y: 60 },
            { color: '#C4423D', opacity: 0.06, size: 150, x: 60, y: 30 }
          ]
        };
      case 'registration':
        return {
          gradient: 'from-gray-50 to-white',
          shapes: [
            { color: '#E3701B', opacity: 0.05, size: 200, x: 85, y: 15 },
            { color: '#4285F4', opacity: 0.04, size: 250, x: 15, y: 70 }
          ]
        };
      case 'onboarding':
        return {
          gradient: 'from-blue-50/30 via-orange-50/20 to-red-50/10',
          shapes: [
            { color: '#4285F4', opacity: 0.08, size: 180, x: 20, y: 20 },
            { color: '#E3701B', opacity: 0.06, size: 120, x: 70, y: 50 },
            { color: '#C4423D', opacity: 0.05, size: 100, x: 50, y: 80 }
          ]
        };
      default:
        return {
          gradient: 'from-gray-50 to-white',
          shapes: []
        };
    }
  };

  const config = getVariantConfig();

  return (
    <div className={`fixed inset-0 -z-10 bg-gradient-to-br ${config.gradient}`}>
      {/* Animated geometric shapes */}
      {config.shapes.map((shape, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full"
          style={{
            backgroundColor: shape.color,
            opacity: shape.opacity,
            width: shape.size,
            height: shape.size,
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 20 + index * 5,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      ))}
      
      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(45deg, #000 1px, transparent 1px),
            linear-gradient(-45deg, #000 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Neural network lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="neural-network" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
            <circle cx="50" cy="50" r="2" fill="#4285F4" />
            <circle cx="150" cy="100" r="2" fill="#E3701B" />
            <circle cx="100" cy="150" r="2" fill="#C4423D" />
            <line x1="50" y1="50" x2="150" y2="100" stroke="#4285F4" strokeWidth="1" />
            <line x1="150" y1="100" x2="100" y2="150" stroke="#E3701B" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#neural-network)" />
      </svg>
    </div>
  );
}