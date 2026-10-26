import { motion } from "framer-motion";
import { Zap } from "lucide-react";

const shapes = [
  { w: 72, h: 72, top: "32%", left: "4%", rz: 18, delay: 0, dur: 5.5, color: "#ff7a59", round: false },
  { w: 48, h: 48, top: "22%", right: "5%", rz: -22, delay: 1.1, dur: 6.2, color: "#7cc4f2", round: true },
  { w: 36, h: 36, top: "68%", left: "2%", rz: 40, delay: 2.3, dur: 5, color: "#ffd23f", round: false },
  { w: 60, h: 60, top: "72%", right: "8%", rz: -12, delay: 0.6, dur: 6.8, color: "#9adb84", round: true },
  { w: 28, h: 28, top: "50%", left: "10%", rz: 60, delay: 1.8, dur: 4.5, color: "#f6a9c6", round: false },
];

export const LandingBackground = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {/* subtle dot grid */}
    <div
      className="absolute inset-0 opacity-[0.35]"
      style={{
        backgroundImage: "radial-gradient(circle, #c4bdb4 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }}
    />


    {/* flat poster shapes — desktop only */}
    {shapes.map((s, i) => (
      <motion.div
        key={i}
        className={`absolute hidden lg:block ${s.round ? "rounded-full" : "rounded-xl"}`}
        style={{
          width: s.w,
          height: s.h,
          top: s.top,
          left: (s as any).left,
          right: (s as any).right,
          rotate: s.rz,
          background: s.color,
          border: "2px solid #1c1917",
          boxShadow: "4px 4px 0 #1c1917",
        }}
        animate={{ y: [0, -(10 + i * 2), 0] }}
        transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
      />
    ))}

    {/* floating stat badge — desktop only */}
    <motion.div
      className="absolute top-[18%] right-[10%] hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl"
      style={{
        background: "#ffd23f",
        border: "2px solid #1c1917",
        boxShadow: "3px 3px 0 #1c1917",
      }}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
      transition={{
        opacity: { duration: 0.6, delay: 0.9 },
        x: { duration: 0.6, delay: 0.9 },
        y: { duration: 4, delay: 0.9, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <span className="flex items-center justify-center w-5 h-5 rounded-md bg-white border-2 border-stone-900">
        <Zap className="w-3 h-3 text-stone-900" />
      </span>
      <span className="text-[12px] font-['Inter'] font-bold text-stone-900">Accenture 2026 rounds</span>
    </motion.div>
  </div>
);
