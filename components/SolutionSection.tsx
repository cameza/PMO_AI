'use client';

import { motion } from 'motion/react';
import { Target, AlertCircle, Cpu, BarChart3, Zap, Shield } from 'lucide-react';

export function SolutionSection() {
  const features = [
    {
      icon: Target,
      title: 'Strategic Alignment',
      description: 'Automatically map every program to your 9 core strategic objectives. See your "Strategic Coverage Score" in real-time.',
      stat: '7 of 9',
      statLabel: 'Objectives Covered',
      color: 'emerald',
    },
    {
      icon: AlertCircle,
      title: 'Proactive Triage',
      description: 'Identify "Product Lines Under Pressure" before they impact the quarter. Our AI highlights high-severity risks across Mobile, Video, and Platform teams.',
      stat: '3',
      statLabel: 'At-Risk Programs',
      color: 'amber',
    },
    {
      icon: Cpu,
      title: 'Multi-LLM Grounding',
      description: 'Bring your own API key. Whether you prefer Claude or GPT-4, our RAG architecture ensures answers are 100% grounded in your actual data—never hallucinated.',
      stat: '100%',
      statLabel: 'Data Accuracy',
      color: 'violet',
    },
  ];

  const capabilities = [
    { icon: BarChart3, label: 'Real-time Analytics' },
    { icon: Zap, label: 'Instant Insights' },
    { icon: Shield, label: 'Enterprise Grade' },
  ];

  return (
    <section className="relative py-32 bg-[#0a0b10]">
      {/* Background accent */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 right-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6 tracking-tight">
            The <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Core Value Props</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Transform your program portfolio from a spreadsheet nightmare into an intelligent command center.
          </p>
        </motion.div>

        {/* Main Feature Cards (Bento Grid) */}
        <div className="grid lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const colorClasses: Record<string, {
              bg: string;
              border: string;
              text: string;
              glow: string;
            }> = {
              emerald: {
                bg: 'bg-emerald-500/10',
                border: 'border-emerald-500/20',
                text: 'text-emerald-400',
                glow: 'from-emerald-600/20 to-emerald-600/20',
              },
              amber: {
                bg: 'bg-amber-500/10',
                border: 'border-amber-500/20',
                text: 'text-amber-400',
                glow: 'from-amber-600/20 to-amber-600/20',
              },
              violet: {
                bg: 'bg-violet-500/10',
                border: 'border-violet-500/20',
                text: 'text-violet-400',
                glow: 'from-violet-600/20 to-indigo-600/20',
              },
            };
            
            const colors = colorClasses[feature.color];

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="group relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 hover:border-white/20 transition-all duration-300"
              >
                <div className={`size-14 rounded-xl ${colors.bg} ${colors.border} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`size-7 ${colors.text}`} />
                </div>

                <h3 className="text-2xl font-semibold text-white mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">{feature.description}</p>

                {/* Data Stat */}
                <div className={`rounded-xl ${colors.bg} ${colors.border} p-4 backdrop-blur-sm`}>
                  <div className={`text-3xl font-semibold ${colors.text} mb-1`}>
                    {feature.stat}
                  </div>
                  <div className="text-sm text-gray-400">{feature.statLabel}</div>
                </div>

                {/* Glow effect */}
                <div className={`absolute -inset-1 bg-gradient-to-r ${colors.glow} rounded-2xl blur-xl opacity-0 group-hover:opacity-100 -z-10 transition-opacity duration-300`} />
              </motion.div>
            );
          })}
        </div>

        {/* Quick Capabilities Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-4"
        >
          {capabilities.map((capability) => {
            const Icon = capability.icon;
            return (
              <div
                key={capability.label}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm px-6 py-3"
              >
                <Icon className="size-5 text-violet-400" />
                <span className="text-white font-medium">{capability.label}</span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
