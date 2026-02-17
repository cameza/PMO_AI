'use client';

import { motion } from 'motion/react';
import { AlertTriangle, FileSpreadsheet, Clock, TrendingDown } from 'lucide-react';

export function ProblemSection() {
  const problems = [
    {
      icon: FileSpreadsheet,
      title: 'Stale by Monday',
      description: 'Spreadsheets are outdated the moment you share them',
    },
    {
      icon: AlertTriangle,
      title: 'Buried Risks',
      description: 'Critical issues like vendor delays hidden in 50-page decks',
    },
    {
      icon: Clock,
      title: 'Manual Compilation',
      description: 'Hours spent gathering data instead of making decisions',
    },
    {
      icon: TrendingDown,
      title: 'No Single Source',
      description: 'Executives lack a unified view of program health',
    },
  ];

  return (
    <section className="relative py-32 bg-[#0a0b10]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6 tracking-tight">
            Why Program Portfolios <span className="text-red-400">Break</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Spreadsheets are stale by Monday. Critical risks, like vendor delays in Project Titan, 
            get buried in 50-page decks. Executives need a <span className="text-white font-semibold">single source of truth</span>, 
            not a manual compilation.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {problems.map((problem, index) => {
            const Icon = problem.icon;
            return (
              <motion.div
                key={problem.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 hover:border-white/20 hover:bg-white/10 transition-all duration-300"
              >
                <div className="size-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="size-6 text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{problem.title}</h3>
                <p className="text-gray-400">{problem.description}</p>

                {/* Subtle glow on hover */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600/0 to-red-600/0 group-hover:from-red-600/10 group-hover:to-red-600/10 rounded-2xl blur-lg -z-10 transition-all duration-300" />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
