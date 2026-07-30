import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Gauge, Cpu, ArrowRight } from 'lucide-react';

interface HeroContentPanelProps {
  onLaunchDashboard: () => void;
  onViewFirmware: () => void;
}

const stats = [
  { label: 'Response Latency', value: '38 ms', color: 'text-emerald-400' },
  { label: 'Immobilization Method', value: '7-Stage PWM', color: 'text-blue-400' },
  { label: 'Telemetry Sync', value: 'Firebase RTDB', color: 'text-purple-400' },
  { label: 'Hardware Platform', value: 'ESP32 38-Pin', color: 'text-amber-400' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const slideLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: 'easeOut' as const },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' as const },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' as const },
  },
};

export const HeroContentPanel: React.FC<HeroContentPanelProps> = ({
  onLaunchDashboard,
  onViewFirmware,
}) => {
  return (
    <motion.section
      className="relative glass-card p-6 md:p-10 lg:p-12 border-blue-500/20 bg-gradient-to-br from-[#131C2E]/90 via-[#0B1220]/95 to-[#131C2E]/90 -mt-4 md:-mt-8 mx-0 z-20"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="absolute top-0 right-0 w-72 h-72 bg-blue-600/8 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl space-y-5 md:space-y-6">
        <motion.div
          variants={slideLeft}
          className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-blue-400"
        >
          <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
          <span>Commercial-Grade Automotive SaaS & IoT Security System</span>
        </motion.div>

        <motion.h1
          variants={slideLeft}
          className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight"
        >
          Smart Two-Wheeler{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-indigo-400">
            Theft Detection & Remote Immobilization
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="text-sm md:text-base text-slate-300 font-medium leading-relaxed max-w-3xl"
        >
          A comprehensive, enterprise-ready IoT platform designed to prevent two-wheeler theft. Powered by the{' '}
          <strong className="text-white">ESP32 DevKit V1 (38-Pin)</strong>,{' '}
          <strong className="text-white">ACS712 Current Sensor</strong>,{' '}
          <strong className="text-white">L298N Motor Driver</strong>,{' '}
          <strong className="text-white">GPIO 4 Push Button Tamper Switch</strong>,{' '}
          <strong className="text-white">NEO-6M GPS Receiver</strong>, and{' '}
          <strong className="text-white">Firebase Realtime Database</strong>.
        </motion.p>

        <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3 md:gap-4 pt-1">
          <motion.button
            onClick={onLaunchDashboard}
            className="group px-5 md:px-6 py-3 md:py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs tracking-wide flex items-center gap-2.5 shadow-xl shadow-blue-600/30 transition-colors"
            whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)' }}
            whileTap={{ scale: 0.98 }}
          >
            <Gauge className="w-4 h-4" />
            <span>Launch Live Telemetry Dashboard</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </motion.button>

          <motion.button
            onClick={onViewFirmware}
            className="px-5 md:px-6 py-3 md:py-3.5 rounded-xl bg-[#0B1220] border border-[#1E2D4A] hover:border-emerald-500/40 text-slate-200 font-bold text-xs flex items-center gap-2 transition-colors"
            whileHover={{ scale: 1.03, borderColor: 'rgba(52, 211, 153, 0.4)' }}
            whileTap={{ scale: 0.98 }}
          >
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>View ESP32 Firmware & Pinout</span>
          </motion.button>
        </motion.div>

        <motion.div
          variants={containerVariants}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4 pt-4 md:pt-6 border-t border-[#1E2D4A]/80"
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={scaleIn}
              className="bg-[#0B1220]/60 backdrop-blur-sm p-3 md:p-3.5 rounded-xl border border-[#1E2D4A]/60 hover:border-blue-500/30 transition-colors"
              whileHover={{ y: -2 }}
            >
              <span className="text-[10px] md:text-[11px] font-semibold text-slate-400 block uppercase tracking-wide">
                {stat.label}
              </span>
              <strong className={`text-base md:text-lg font-black font-mono ${stat.color}`}>
                {stat.value}
              </strong>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};
