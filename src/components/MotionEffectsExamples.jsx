import React from 'react';
import { motion } from 'framer-motion';
import { MagneticButton, MagneticCard } from './MagneticButton';
import { TextTicker, ImageTicker, LogoTicker } from './InfiniteScrollTicker';






export const HeroCTASection = () => {
  return (
    <section className="min-h-64 bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center p-4">
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold text-white mb-6"
        >
          Magnetic Interactions
        </motion.h1>
        <MagneticButton
          label="Explore Now"
          onClick={() => window.scrollTo(0, window.innerHeight)}
          magneticStrength={0.5}
          className="bg-white text-purple-600 hover:bg-gray-100 font-bold text-lg"
        />
      </div>
    </section>
  );
};




export const ProductCardsSection = () => {
  const products = [
    {
      id: 1,
      title: 'Product One',
      description: 'Interactive and engaging product experience',
      icon: '🎨',
    },
    {
      id: 2,
      title: 'Product Two',
      description: 'Smooth magnetic cursor following',
      icon: '⚡',
    },
    {
      id: 3,
      title: 'Product Three',
      description: 'Scroll effects that captivate users',
      icon: '🚀',
    },
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
        Our Products
      </h2>
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {products.map((product) => (
          <MagneticCard
            key={product.id}
            magneticStrength={0.3}
            className="bg-gradient-to-br from-gray-50 to-gray-100"
          >
            <div className="text-5xl mb-4">{product.icon}</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {product.title}
            </h3>
            <p className="text-gray-600 mb-6">{product.description}</p>
            <MagneticButton
              label="Learn More"
              onClick={() => console.log(`Clicked: ${product.title}`)}
              magneticStrength={0.2}
              className="w-full bg-blue-500 hover:bg-blue-600"
            />
          </MagneticCard>
        ))}
      </div>
    </section>
  );
};




export const TestimonialsSection = () => {
  const testimonials = [
    'Amazing product that transformed our workflow',
    'The smooth animations are incredibly professional',
    'Customers love the interactive experience',
    'Best UI library we have used',
    'Performance is exceptional across all devices',
  ];

  return (
    <section className="py-16 px-4 bg-gray-900">
      <h2 className="text-4xl font-bold text-center mb-12 text-white">
        What Our Users Say
      </h2>
      <div className="max-w-6xl mx-auto">
        <TextTicker
          texts={testimonials}
          duration={35}
          direction="left"
          className="rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 py-8"
          textClassName="text-white text-lg"
        />
      </div>
    </section>
  );
};




export const ImageGallerySection = () => {
  const galleryImages = [
    'https://images.unsplash.com/photo-1516733732345-e7427ba67e98?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=400&fit=crop',
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
        Featured Gallery
      </h2>
      <div className="max-w-6xl mx-auto">
        <ImageTicker
          images={galleryImages}
          duration={30}
          onImageClick={(index) => alert(`Clicked image ${index + 1}`)}
          className="rounded-xl overflow-hidden"
        />
      </div>
    </section>
  );
};




export const PartnersSection = () => {
  const partnerLogos = [
    '🚀 Startup Hub',
    '💼 Enterprise Co',
    '🌟 Innovation Lab',
    '⚡ Tech Leaders',
    '🎯 Digital Agency',
    '🔥 Creative Studio',
  ];

  return (
    <section className="py-16 px-4 bg-gray-50">
      <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
        Trusted Partners
      </h2>
      <LogoTicker logos={partnerLogos} duration={20} />
    </section>
  );
};




export const FeatureShowcaseSection = () => {
  const features = [
    'Smooth Motion Effects',
    'Responsive Design',
    'Easy Integration',
    'Performance Optimized',
    'Accessibility Focused',
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-black">
      <h2 className="text-4xl font-bold text-center mb-16 text-white">
        Powerful Features
      </h2>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <MagneticCard
          magneticStrength={0.4}
          className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30"
        >
          <h3 className="text-2xl font-bold text-white mb-4">
            🎬 Magnetic Effects
          </h3>
          <p className="text-gray-200">
            Create interactive button and card components that follow user cursor
            with smooth spring physics.
          </p>
        </MagneticCard>

        <MagneticCard
          magneticStrength={0.35}
          className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30"
        >
          <h3 className="text-2xl font-bold text-white mb-4">
            ✨ Scroll Tickers
          </h3>
          <p className="text-gray-200">
            Seamless horizontal scrolling with infinite loop effects for text,
            images, and custom content.
          </p>
        </MagneticCard>
      </div>

      <div className="max-w-6xl mx-auto">
        <h3 className="text-2xl font-bold text-white mb-6">Key Capabilities</h3>
        <TextTicker
          texts={features}
          duration={25}
          direction="left"
          className="rounded-lg bg-gradient-to-r from-slate-800 to-slate-700"
          textClassName="text-white text-base font-semibold"
        />
      </div>
    </section>
  );
};




export const CTABanner = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 to-purple-600">
      <div className="max-w-4xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-4xl font-bold text-white mb-6"
        >
          Ready to Build Amazing Interactions?
        </motion.h2>
        <p className="text-xl text-indigo-100 mb-8">
          Enhance your React app with professional motion effects and interactive
          components.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <MagneticButton
            label="Get Started"
            onClick={() => console.log('Starting...')}
            magneticStrength={0.5}
            className="bg-white text-indigo-600 hover:bg-gray-100 font-bold"
          />
          <MagneticButton
            label="View Docs"
            onClick={() => console.log('Opening docs...')}
            magneticStrength={0.4}
            className="bg-indigo-500 text-white hover:bg-indigo-700 font-bold border border-white/20"
          />
        </div>
      </div>
    </section>
  );
};




export const CompleteShowcasePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeroCTASection />
      <ProductCardsSection />
      <TestimonialsSection />
      <ImageGallerySection />
      <FeatureShowcaseSection />
      <PartnersSection />
      <CTABanner />
    </div>
  );
};

export default CompleteShowcasePage;
