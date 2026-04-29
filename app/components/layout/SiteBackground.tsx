export function SiteBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="absolute -top-40 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-white/12 blur-[120px]" />
      <div className="absolute top-[40%] left-[-10%] h-[28rem] w-[28rem] rounded-full bg-white/7 blur-[110px]" />
      <div className="absolute bottom-[-20%] right-[-10%] h-[32rem] w-[32rem] rounded-full bg-white/8 blur-[120px]" />
    </div>
  );
}
