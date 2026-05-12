import React from 'react';
import { motion } from 'framer-motion';
import { MagneticButton, MagneticCard } from './MagneticButton';
import {
  TextTicker,
  ImageTicker,
  LogoTicker,
  InfiniteScrollTicker,
  TickerItem,
} from './InfiniteScrollTicker';


export const MotionEffectsShowcase = () => {
  const handleMagneticClick = () => {
    console.log('Magnetic button clicked!');
  };

  const testimonials = [
    'Building interactive UI has never been easier',
    'Smooth animations with Framer Motion',
    'Create engaging user experiences',
    'Professional-grade motion effects',
    'Enhance your React applications',
  ];

  const demoImages = [
    'https://images.unsplash.com/photo-1649360572241-5c4ee1b4b3f1?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=400&h=400&fit=crop',
  ];

  const technologies = [
    '⚛️ React',
    '🎬 Framer Motion',
    '🎨 Tailwind CSS',
    '⚡ Vite',
    '🔥 TypeScript',
    '🎯 Motion Effects',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      {}
      <section className="relative px-4 py-20 md:px-8 md:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            Motion+ Effects
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8">
            Build magnetic cursors and infinite scrolling experiences
          </p>
        </motion.div>
      </section>

      {}
      <section className="px-4 py-16 md:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12">Magnetic Cursor Effects</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <MagneticButton
                label="Weak Magnetic"
                onClick={handleMagneticClick}
                magneticStrength={0.2}
                className="w-full"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <MagneticButton
                label="Medium Magnetic"
                onClick={handleMagneticClick}
                magneticStrength={0.4}
                className="w-full bg-purple-500 hover:bg-purple-600"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <MagneticButton
                label="Strong Magnetic"
                onClick={handleMagneticClick}
                magneticStrength={0.6}
                className="w-full bg-pink-500 hover:bg-pink-600"
              />
            </motion.div>
          </div>

          {}
          <div className="mb-16">
            <h3 className="text-2xl font-bold mb-8">Interactive Magnetic Cards</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <MagneticCard>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Cursor Following
                </h3>
                <p className="text-gray-600">
                  Watch as this card smoothly follows your cursor with magnetic
                  attraction. Perfect for creating engaging interactive elements.
                </p>
              </MagneticCard>

              <MagneticCard magneticStrength={0.5}>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  3D Perspective
                </h3>
                <p className="text-gray-600">
                  With stronger magnetic strength, the card gains subtle 3D rotation
                  for a more immersive interaction experience.
                </p>
              </MagneticCard>
            </div>
          </div>
        </div>
      </section>

      {}
      <section className="px-4 py-16 md:px-8 bg-black/40">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Infinite Scrolling Tickers</h2>

          {}
          <div className="mb-12">
            <h3 className="text-xl font-semibold mb-4">Text Ticker (Left to Right)</h3>
            <TextTicker
              texts={testimonials}
              duration={30}
              direction="left"
              className="rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20"
            />
          </div>

          {}
          <div className="mb-12">
            <h3 className="text-xl font-semibold mb-4">Text Ticker (Right to Left)</h3>
            <TextTicker
              texts={technologies}
              duration={25}
              direction="right"
              className="rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20"
            />
          </div>

          {}
          <div>
            <h3 className="text-xl font-semibold mb-4">Image Carousel Ticker</h3>
            <ImageTicker
              images={demoImages}
              duration={30}
              onImageClick={(index) => console.log(`Clicked image ${index}`)}
              className="rounded-lg"
            />
          </div>
        </div>
      </section>

      {}
      <section className="px-4 py-16 md:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Partner Logos Ticker</h2>
          <LogoTicker
            logos={[
              '🚀',
              '⚛️',
              '🎨',
              '⚡',
              '🔧',
              '📱',
              '💻',
              '🌐',
            ]}
            duration={15}
          />
        </div>
      </section>

      {}
      <section className="px-4 py-16 md:px-8 bg-black/40">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Custom Ticker Example</h2>
          <InfiniteScrollTicker duration={20} pauseOnHover={true}>
            {Array.from({ length: 5 }).map((_, i) => (
              <TickerItem key={i} className="flex items-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 360 }}
                  className="inline-block"
                >
                  <span className="text-4xl">✨</span>
                </motion.div>
                <span className="text-lg font-semibold">Custom Content</span>
              </TickerItem>
            ))}
          </InfiniteScrollTicker>
        </div>
      </section>

      {}
      <section className="px-4 py-20 md:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto text-center"
        >
          <h2 className="text-3xl font-bold mb-6">Ready to use these effects?</h2>
          <p className="text-gray-300 mb-8">
            Import the MagneticButton and InfiniteScrollTicker components into your
            React app and start creating engaging interactions today.
          </p>
          <MagneticButton
            label="Get Started"
            onClick={() => console.log('Navigating...')}
            magneticStrength={0.4}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-lg px-8 py-4"
          />
        </motion.div>
      </section>
    </div>
  );
};

export default MotionEffectsShowcase;
