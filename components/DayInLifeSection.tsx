'use client';

import { motion } from 'motion/react';
import { Coffee, MessageSquare, TrendingUp, Calendar } from 'lucide-react';

export function DayInLifeSection() {
  const features = [
    {
      icon: Coffee,
      title: 'The Monday Morning Brief',
      description: 'A Slack bot that summarizes your week\'s launches and risks before you even finish your first coffee.',
      time: '8:30 AM',
      demo: {
        type: 'slack' as const,
        content: [
          { label: '✅ Launches This Week', value: '3 products shipping' },
          { label: '⚠️ Risks Detected', value: '1 vendor delay' },
          { label: '📊 Coverage Score', value: '78%' },
        ] as { label: string; value: string }[],
      },
    },
    {
      icon: MessageSquare,
      title: 'Context-Aware Chat',
      description: 'Ask the AI about specific program risks or upcoming milestones directly on the dashboard.',
      time: '10:15 AM',
      demo: {
        type: 'chat' as const,
        content: [
          { type: 'user', text: 'What\'s the status of Project Titan?' },
          { type: 'ai', text: 'Project Titan is currently at risk due to a vendor delay affecting Q2 milestones. The team is working on mitigation strategies.' },
        ] as { type: string; text: string }[],
      },
    },
  ];

  return (
    <section className="relative py-32 bg-[#0a0b10]">
      {/* Background accent */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]" />
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
            A Day in the <span className="text-violet-400">Life</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            See how AI transforms your daily workflow from reactive firefighting to proactive strategy.
          </p>
        </motion.div>

        <div className="space-y-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isReversed = index % 2 === 1;

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className={`grid lg:grid-cols-2 gap-8 items-center ${isReversed ? 'lg:flex-row-reverse' : ''}`}
              >
                {/* Content */}
                <div className={`space-y-6 ${isReversed ? 'lg:order-2' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                      <Icon className="size-6 text-violet-400" />
                    </div>
                    <span className="text-sm text-gray-400 font-medium">{feature.time}</span>
                  </div>

                  <h3 className="text-3xl font-semibold text-white tracking-tight">
                    {feature.title}
                  </h3>
                  <p className="text-lg text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Demo Card */}
                <div className={`${isReversed ? 'lg:order-1' : ''}`}>
                  <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
                    {feature.demo.type === 'slack' ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                          <div className="size-8 rounded bg-violet-600 flex items-center justify-center text-white text-sm font-semibold">
                            P
                          </div>
                          <div>
                            <div className="text-white font-medium">Portfolio Assistant</div>
                            <div className="text-xs text-gray-400">Bot · 8:30 AM</div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="text-white font-medium mb-3">Good morning! Here&apos;s your weekly brief:</div>
                          {feature.demo.content.map((item) => (
                            <div key={item.label} className="flex justify-between items-center rounded-lg bg-white/5 border border-white/10 p-3">
                              <span className="text-gray-300 text-sm">{item.label}</span>
                              <span className="text-white font-semibold">{item.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {feature.demo.content.map((message, idx) => (
                          <div
                            key={idx}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                                message.type === 'user'
                                  ? 'bg-violet-600 text-white'
                                  : 'bg-white/5 border border-white/10 text-gray-200'
                              }`}
                            >
                              <p className="text-sm">{message.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Glow effect */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 rounded-2xl blur-xl -z-10" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Additional Quick Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-16 grid md:grid-cols-2 gap-6"
        >
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <div className="flex items-start gap-4">
              <div className="size-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="size-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Real-Time Risk Detection</h4>
                <p className="text-gray-400">AI continuously monitors all programs and alerts you instantly when patterns suggest emerging risks.</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <div className="flex items-start gap-4">
              <div className="size-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Calendar className="size-5 text-indigo-400" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-2">Milestone Tracking</h4>
                <p className="text-gray-400">Automatically track upcoming launches, deadlines, and strategic checkpoints across your entire portfolio.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
