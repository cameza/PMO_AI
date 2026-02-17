'use client';

import { motion } from 'motion/react';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    title: 'Executive Dashboard',
    description: 'Get a comprehensive view of your entire portfolio with real-time insights on strategic coverage, velocity, and launch readiness.',
    image: '/assets/dashboard.png',
  },
  {
    title: 'Project Deep-Dive',
    description: 'Track individual projects with active risk monitoring, milestone progress, and strategic alignment—all automatically updated from your source data.',
    image: '/assets/project.png',
  },
  {
    title: 'Slack Integration',
    description: 'Receive proactive portfolio summaries and answer ad-hoc questions directly in Slack. Your AI assistant keeps you informed without leaving your workflow.',
    image: '/assets/slack.png',
  },
];

export function ProductShowcase() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'center' });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  return (
    <section id="product-showcase" className="relative py-32 bg-[#0a0b10] overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-gradient-to-b from-violet-600/10 to-indigo-600/10 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6 tracking-tight">
            See Portfolio AI in{' '}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              Action
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            From high-level dashboards to Slack conversations, Portfolio AI brings clarity to every level of your portfolio.
          </p>
        </motion.div>

        {/* Carousel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6">
              {slides.map((slide, index) => (
                <div key={index} className="flex-[0_0_100%] min-w-0 px-4">
                  <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden shadow-2xl">
                    {/* Image Container */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-violet-950/20 to-indigo-950/20 p-6">
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-auto object-contain rounded-lg"
                        loading="lazy"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-8">
                      <h3 className="text-2xl font-semibold text-white mb-3 tracking-tight">
                        {slide.title}
                      </h3>
                      <p className="text-gray-300 text-lg">
                        {slide.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={scrollPrev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 size-12 rounded-full border border-white/10 bg-[#0a0b10]/80 backdrop-blur-xl text-white hover:bg-white/10 transition-all duration-300 flex items-center justify-center shadow-lg hover:border-violet-500/50"
            aria-label="Previous slide"
          >
            <ChevronLeft className="size-6" />
          </button>

          <button
            onClick={scrollNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 size-12 rounded-full border border-white/10 bg-[#0a0b10]/80 backdrop-blur-xl text-white hover:bg-white/10 transition-all duration-300 flex items-center justify-center shadow-lg hover:border-violet-500/50"
            aria-label="Next slide"
          >
            <ChevronRight className="size-6" />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => emblaApi?.scrollTo(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === selectedIndex
                    ? 'w-8 bg-violet-400'
                    : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
