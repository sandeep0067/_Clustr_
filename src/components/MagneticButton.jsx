import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';


export const MagneticButton = ({
  label = 'Magnetic Button',
  onClick,
  className = '',
  magneticStrength = 0.4,
  children,
}) => {
  const buttonRef = useRef(null);
  const [magneticPosition, setMagneticPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const buttonCenterX = rect.left + rect.width / 2;
    const buttonCenterY = rect.top + rect.height / 2;

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const distanceX = mouseX - buttonCenterX;
    const distanceY = mouseY - buttonCenterY;

    
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
    const maxDistance = 100; 

    
    if (distance < maxDistance) {
      setMagneticPosition({
        x: distanceX * magneticStrength,
        y: distanceY * magneticStrength,
      });
    } else {
      setMagneticPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseLeave = () => {
    setMagneticPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        x: magneticPosition.x,
        y: magneticPosition.y,
      }}
      transition={{
        type: 'spring',
        stiffness: 150,
        damping: 15,
        mass: 0.5,
      }}
      onClick={onClick}
      className={`px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold transition-all duration-200 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children || label}
    </motion.button>
  );
};


export const MagneticCard = ({
  children,
  className = '',
  magneticStrength = 0.3,
  onHover,
}) => {
  const cardRef = useRef(null);
  const [magneticPosition, setMagneticPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const cardCenterX = rect.left + rect.width / 2;
    const cardCenterY = rect.top + rect.height / 2;

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const distanceX = mouseX - cardCenterX;
    const distanceY = mouseY - cardCenterY;
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
    const maxDistance = 150;

    if (distance < maxDistance) {
      setMagneticPosition({
        x: distanceX * magneticStrength,
        y: distanceY * magneticStrength,
      });

      
      const rotationX = (distanceY / maxDistance) * 8;
      const rotationY = (distanceX / maxDistance) * -8;
      setRotation({ x: rotationX, y: rotationY });
    } else {
      setMagneticPosition({ x: 0, y: 0 });
      setRotation({ x: 0, y: 0 });
    }
  };

  const handleMouseLeave = () => {
    setMagneticPosition({ x: 0, y: 0 });
    setRotation({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        x: magneticPosition.x,
        y: magneticPosition.y,
        rotateX: rotation.x,
        rotateY: rotation.y,
      }}
      transition={{
        type: 'spring',
        stiffness: 120,
        damping: 20,
      }}
      className={`rounded-xl bg-white shadow-lg p-6 cursor-pointer ${className}`}
      style={{ transformPerspective: 1200 }}
      whileHover={{ boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
    >
      {children}
    </motion.div>
  );
};

export default MagneticButton;
