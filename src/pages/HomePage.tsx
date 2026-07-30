import React, { useState } from 'react';
import { 
  Shield, 
  Cpu, 
  Activity, 
  Zap, 
  MapPin, 
  Lock, 
  ArrowRight, 
  Sparkles,
  Layers,
  BatteryCharging,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Gauge,
  Smartphone,
  Server,
  FileCode,
  Terminal,
  RefreshCw,
  Eye
} from 'lucide-react';
import { useTelemetry } from '../context/TelemetryContext';

export const HomePage: React.FC = () => {
  const { setActiveTab } = useTelemetry();
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(0);

  const workflowSteps = [
    {
      step: '01',
      title: 'Physical Attack Detection',
      actor: 'Hardware Subsystem',
      badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
      icon: Lock,
      summary: 'Physical tampering on handlebar lock triggers hardware interrupt in microseconds.',
      details: 'When an unauthorized person attempts to force the handlebar lock or presses the side lock tamper push button connected to GPIO 4, the ESP32 senses a falling edge interrupt instantly. Concurrently, the ACS712 Hall-Effect sensor on GPIO 34 detects any un-authorized motor current draw.'
    },
    {
      step: '02',
      title: 'ESP32 Realtime Processing',
      actor: 'Microcontroller Gateway',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      icon: Cpu,
      summary: 'ESP32 processes sensor signals, evaluates threat level, and packages JSON payload.',
      details: 'The Xtensa dual-core processor reads analog voltage from the 10k/3.3k battery divider (GPIO 36), parses NMEA satellite coordinates from NEO-6M GPS (GPIO 32/33), and verifies system parameters. If tamper is detected, an emergency alert flag is appended.'
    },
    {
      step: '03',
      title: 'Firebase Realtime Cloud Sync',
      actor: 'Cloud Backend',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      icon: Server,
      summary: 'Telemetry is streamed to /telemetry node in under 50ms via REST/WebSocket API.',
      details: 'The ESP32 pushes JSON telemetry directly to Firebase Realtime Database. The web dashboard listens live to data mutations using Firebase real-time database SDK, updating vehicle speed, current, voltage, and map position without page reload.'
    },
    {
      step: '04',
      title: 'Remote Progressive Immobilization',
      actor: 'SaaS SaaS Console & Actuators',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      icon: Zap,
      summary: 'Owner dispatches STOP command. L298N ramps motor speed to 0% and cuts ignition relay.',
      details: 'Upon receiving the STOP_VEHICLE command from Firebase /controls node, the ESP32 initiates a 7-stage progressive PWM deceleration (45% -> 35% -> 25% -> 15% -> 8% -> 3% -> 0%) on L298N ENA (GPIO 18), cuts engine ignition relay (GPIO 23), engages solenoid lock (GPIO 22), and dispatches emergency SMS via SIM800L.'
    }
  ];

  const hardwareSpecs = [
    {
      name: 'ESP32 DevKit V1 (38-Pin)',
      role: 'Master IoT Gateway Microcontroller',
      pinout: '38 Header Pins (GPIO 0 - 39)',
      icon: Cpu,
      color: '#06B6D4',
      features: [
        'Dual-Core Xtensa LX6 @ 240 MHz',
        'Built-in 2.4GHz Wi-Fi & Bluetooth LE',
        'Hardware Interrupts on GPIO 4 for Instant Tamper Response',
        'Bidirectional HTTP REST & WebSocket Firebase Engine'
      ]
    },
    {
      name: 'ACS712 Current Sensor Module',
      role: 'Motor Load & Current Monitoring',
      pinout: 'GPIO 34 (ADC1_CH6 Analog Input)',
      icon: Activity,
      color: '#F59E0B',
      features: [
        'Hall-effect current sensing up to 5A / 20A / 30A',
        'Detects motor stall spikes & abnormal current draw',
        'Precision 185mV/A sensitivity calibration in C++',
        'Prevents battery drainage & motor burnout'
      ]
    },
    {
      name: 'L298N H-Bridge Driver & 12V Motor',
      role: 'Vehicle Propulsion & PWM Speed Ramp-Down',
      pinout: 'GPIO 18 (PWM ENA), GPIO 19 (IN1), GPIO 21 (IN2)',
      icon: Zap,
      color: '#3B82F6',
      features: [
        '8-bit Version-Agnostic LEDC PWM speed control',
        'Progressive 7-stage deceleration safety routine',
        'Bi-directional motor direction control',
        'Heavy-duty dual H-bridge output terminals'
      ]
    },
    {
      name: 'NEO-6M-V2 GPS Receiver Module',
      role: 'Satellite Location & Live Tracking',
      pinout: 'GPIO 32 (RX1) / GPIO 33 (TX1)',
      icon: MapPin,
      color: '#A855F7',
      features: [
        '50-channel u-blox 6 positioning engine',
        'HardwareSerial1 UART communication at 9600 baud',
        'Streams Latitude, Longitude, Altitude & Speed',
        'Integrated ceramic antenna with high sensitivity'
      ]
    },
    {
      name: 'Side Lock Push Button & Solenoid Relay',
      role: 'Handlebar Anti-Tamper & Electronic Lock',
      pinout: 'GPIO 4 (Push Button), GPIO 22 (Solenoid Relay)',
      icon: Lock,
      color: '#EF4444',
      features: [
        'Push button with internal pull-up interrupt (GPIO 4)',
        '12V heavy-duty handlebar solenoid locking relay (GPIO 22)',
        'Immediate threat flag dispatch upon physical tamper',
        'Automated solenoid re-locking on remote stop'
      ]
    },
    {
      name: '12V Power Adapter & Battery Sense',
      role: 'Main Power & Supply Health Monitoring',
      pinout: 'GPIO 36 (VP / ADC1_CH0 Analog Input)',
      icon: BatteryCharging,
      color: '#10B981',
      features: [
        '12V DC Adapter main power supply rail',
        '10k / 3.3k precision resistor voltage divider',
        'Continuous voltage measurement (0 - 15V range)',
        'Low battery & power disconnected warning alerts'
      ]
    }
  ];

  return (
    <div className="space-y-12 pb-12">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden glass-card p-8 md:p-12 border-blue-500/30 bg-gradient-to-br from-[#131C2E] via-[#0B1220] to-[#131C2E]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-blue-400">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>Commercial-Grade Automotive SaaS & IoT Security System</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Smart Two-Wheeler <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-indigo-400">
              Theft Detection & Remote Immobilization
            </span>
          </h1>

          <p className="text-sm md:text-base text-slate-300 font-medium leading-relaxed max-w-3xl">
            A comprehensive, enterprise-ready IoT platform designed to prevent two-wheeler theft. Powered by the <strong>ESP32 DevKit V1 (38-Pin)</strong>, <strong>ACS712 Current Sensor</strong>, <strong>L298N Motor Driver</strong>, <strong>GPIO 4 Push Button Tamper Switch</strong>, <strong>NEO-6M GPS Receiver</strong>, and <strong>Firebase Realtime Database</strong>.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs tracking-wide flex items-center gap-2.5 shadow-xl shadow-blue-600/30 transition-all transform hover:-translate-y-0.5"
            >
              <Gauge className="w-4 h-4" />
              <span>Launch Live Telemetry Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveTab('esp32')}
              className="px-6 py-3.5 rounded-xl bg-[#0B1220] border border-[#1E2D4A] hover:border-emerald-500/40 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all"
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>View ESP32 Firmware & Pinout</span>
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-[#1E2D4A]/80">
            <div className="bg-[#0B1220]/60 p-3 rounded-xl border border-[#1E2D4A]/60">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Response Latency</span>
              <strong className="text-lg font-black text-emerald-400 font-mono">38 ms</strong>
            </div>

            <div className="bg-[#0B1220]/60 p-3 rounded-xl border border-[#1E2D4A]/60">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Immobilization Method</span>
              <strong className="text-lg font-black text-blue-400 font-mono">7-Stage PWM</strong>
            </div>

            <div className="bg-[#0B1220]/60 p-3 rounded-xl border border-[#1E2D4A]/60">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Telemetry Sync</span>
              <strong className="text-lg font-black text-purple-400 font-mono">Firebase RTDB</strong>
            </div>

            <div className="bg-[#0B1220]/60 p-3 rounded-xl border border-[#1E2D4A]/60">
              <span className="text-[11px] font-semibold text-slate-400 block uppercase">Hardware Platform</span>
              <strong className="text-lg font-black text-amber-400 font-mono">ESP32 38-Pin</strong>
            </div>
          </div>
        </div>
      </section>

      {/* EXECUTIVE SUMMARY & PROBLEM STATEMENT */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-4 border-l-4 border-l-red-500">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">The Problem: Vulnerability of Conventional Locks</h2>
              <span className="text-xs text-slate-400">Why standard two-wheeler security fails</span>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Traditional mechanical handlebar locks and disc locks can be easily bypassed by experienced thieves using master keys, lock picks, or bolt cutters within 30 to 60 seconds. Traditional GPS trackers only report location post-theft, offering no active mechanism to stop the vehicle once it is driven away.
          </p>
        </div>

        <div className="glass-card p-6 space-y-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">The Solution: Smart IoT Active Security</h2>
              <span className="text-xs text-slate-400">Real-time prevention, tracking & immobilization</span>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Our IoT system combines real-time physical tamper detection (GPIO 4 push button), current sensing (ACS712), live GPS tracking (NEO-6M), and bidirectional Firebase cloud sync. Owners can remotely trigger **Progressive PWM Speed Ramp-Down** to bring the vehicle to a safe stop from anywhere in the world.
          </p>
        </div>
      </section>

      {/* PROJECT A-TO-Z ARCHITECTURE WORKFLOW */}
      <section className="glass-card p-6 space-y-6">
        <div className="border-b border-[#1E2D4A] pb-4">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-400" />
            Project Architecture: A to Z Operational Workflow
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Click any step below to explore how physical hardware events flow to the SaaS dashboard in real time
          </p>
        </div>

        {/* Workflow Step Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {workflowSteps.map((ws, idx) => {
            const Icon = ws.icon;
            const isActive = activeWorkflowStep === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveWorkflowStep(idx)}
                className={`p-4 rounded-xl text-left transition-all border ${
                  isActive
                    ? 'bg-blue-600/20 border-blue-500/50 shadow-lg shadow-blue-500/10'
                    : 'bg-[#0B1220] border-[#1E2D4A] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${ws.badgeColor}`}>
                    STEP {ws.step}
                  </span>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                </div>
                <h3 className="text-xs font-bold text-white line-clamp-1">{ws.title}</h3>
                <span className="text-[11px] text-slate-400 block mt-0.5">{ws.actor}</span>
              </button>
            );
          })}
        </div>

        {/* Active Workflow Detail Card */}
        <div className="bg-[#070C14] p-6 rounded-2xl border border-[#1E2D4A] space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold px-3 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              STEP {workflowSteps[activeWorkflowStep].step}
            </span>
            <h3 className="text-base font-bold text-white">{workflowSteps[activeWorkflowStep].title}</h3>
          </div>

          <p className="text-xs text-slate-200 font-semibold">{workflowSteps[activeWorkflowStep].summary}</p>
          <p className="text-xs text-slate-400 leading-relaxed pt-1">{workflowSteps[activeWorkflowStep].details}</p>
        </div>
      </section>

      {/* COMPLETE HARDWARE COMPONENT & PINOUT DIRECTORY */}
      <section className="glass-card p-6 space-y-6">
        <div className="border-b border-[#1E2D4A] pb-4">
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Cpu className="w-6 h-6 text-emerald-400" />
            Complete Hardware Components & Pinout Directory
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Detailed hardware pin mapping and operational specifications for ESP32 DevKit V1 (38-Pin)
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hardwareSpecs.map((spec, idx) => {
            const Icon = spec.icon;
            return (
              <div key={idx} className="bg-[#0B1220] p-5 rounded-2xl border border-[#1E2D4A] space-y-3 hover:border-blue-500/40 transition-all">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-500/10" style={{ color: spec.color }}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{spec.name}</h3>
                    <span className="text-[11px] text-slate-400 block">{spec.role}</span>
                  </div>
                </div>

                <div className="bg-[#070C14] px-3 py-1.5 rounded-lg border border-[#1E2D4A]">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold block">{spec.pinout}</span>
                </div>

                <ul className="space-y-1.5 pt-1">
                  {spec.features.map((feat, fIdx) => (
                    <li key={fIdx} className="text-[11px] text-slate-300 flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* KEY TECHNICAL INNOVATIONS */}
      <section className="glass-card p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-[#1E2D4A] pb-3">
          Key System Innovations & Engineering Features
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0B1220] p-4 rounded-xl border border-[#1E2D4A] space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
              <Zap className="w-4 h-4" />
              <span>Progressive PWM Deceleration</span>
            </div>
            <p className="text-xs text-slate-300">Prevents dangerous sudden wheel lockups during high-speed remote stop commands by stepping PWM speed down over 7 seconds.</p>
          </div>

          <div className="bg-[#0B1220] p-4 rounded-xl border border-[#1E2D4A] space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Radio className="w-4 h-4" />
              <span>Firebase Realtime Pipeline</span>
            </div>
            <p className="text-xs text-slate-300">Bi-directional WebSocket streaming ensures command dispatches and telemetry updates execute with sub-50ms latency globally.</p>
          </div>

          <div className="bg-[#0B1220] p-4 rounded-xl border border-[#1E2D4A] space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
              <RefreshCw className="w-4 h-4" />
              <span>Offline Standalone Protection</span>
            </div>
            <p className="text-xs text-slate-300">If Wi-Fi or cellular signal drops, the ESP32 hardware interrupt loop continues locally to trigger alarm buzzers upon physical tamper.</p>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA BANNER */}
      <section className="glass-card p-8 bg-gradient-to-r from-blue-900/30 via-[#131C2E] to-emerald-900/30 border-blue-500/40 text-center space-y-4">
        <h2 className="text-2xl font-black text-white">Ready to Monitor Your Smart Two-Wheeler Live?</h2>
        <p className="text-xs text-slate-300 max-w-xl mx-auto">
          Access the real-time telemetry console, inspect live motor current, track satellite GPS position, and execute remote immobilization.
        </p>

        <div className="flex justify-center gap-4 pt-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
          >
            <Gauge className="w-4 h-4" />
            <span>Open Telemetry Dashboard</span>
          </button>
        </div>
      </section>
    </div>
  );
};
