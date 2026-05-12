import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';


export const InfiniteScrollTicker = ({
  children,
  duration = 20,
  direction = 'left',
  className = '',
  pauseOnHover = false,
}) => {
  const [isPaused, setIsPaused] = React.useState(false);

  
  const getAnimationVariants = () => {
    const distance = direction === 'left' ? -100 : 100;
    return {
      animate: {
        x: distance + '%',
        transition: {
          duration: duration,
          repeat: Infinity,
          ease: 'linear',
          pause: isPaused ? 'paused' : undefined,
        },
      },
    };
  };

  return (
    <div
      className={`overflow-hidden bg-gradient-to-r from-transparent via-black/10 to-transparent ${className}`}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={getAnimationVariants().animate}
      >
        {}
        {children}
        {children}
      </motion.div>
    </div>
  );
};


export const TickerItem = ({ children, className = '' }) => (
  <div className={`shrink-0 px-4 py-2 ${className}`}>
    {children}
  </div>
);


export const TextTicker = ({
  texts = [],
  duration = 20,
  direction = 'left',
  className = '',
  textClassName = '',
}) => {
  return (
    <InfiniteScrollTicker duration={duration} direction={direction} className={className}>
      {texts.map((text, index) => (
        <TickerItem key={index} className={textClassName}>
          <span className="text-lg font-semibold text-white">{text}</span>
          <span className="mx-6 text-gray-400">•</span>
        </TickerItem>
      ))}
    </InfiniteScrollTicker>
  );
};


export const ImageTicker = ({
  images = [],
  duration = 25,
  onImageClick,
  className = '',
}) => {
  return (
    <InfiniteScrollTicker duration={duration} className={className}>
      {images.map((image, index) => (
        <TickerItem key={index} className="cursor-pointer">
          <motion.img
            src={image}
            alt={`Ticker image ${index}`}
            className="h-32 w-32 object-cover rounded-lg shadow-lg"
            onClick={() => onImageClick?.(index)}
            whileHover={{
              scale: 1.1,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            }}
            transition={{ type: 'spring', stiffness: 200 }}
          />
        </TickerItem>
      ))}
    </InfiniteScrollTicker>
  );
};


export const LogoTicker = ({
  logos = [],
  duration = 20,
  className = '',
  onLogoClick,
}) => {
  return (
    <div className={`w-full bg-gray-50 py-8 ${className}`}>
      <InfiniteScrollTicker duration={duration} pauseOnHover={true}>
        {logos.map((logo, index) => (
          <TickerItem key={index} className="flex items-center justify-center">
            <motion.div
              className="h-12 rounded-lg bg-white p-2 shadow-md cursor-pointer"
              onClick={() => onLogoClick?.(index)}
              whileHover={{
                scale: 1.15,
                boxShadow: '0 15px 35px rgba(0,0,0,0.15)',
              }}
            >
              {typeof logo === 'string' ? (
                <img src={logo} alt={`Logo ${index}`} className="h-full object-contain" />
              ) : (
                logo
              )}
            </motion.div>
          </TickerItem>
        ))}
      </InfiniteScrollTicker>
    </div>
  );
};

export default InfiniteScrollTicker;
