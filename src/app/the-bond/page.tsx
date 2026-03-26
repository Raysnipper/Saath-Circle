import Link from "next/link";

export default function TheBond() {
  return (
    <div className="bg-surface text-on-surface font-body selection:bg-secondary-container selection:text-on-secondary-container min-h-screen flex flex-col">
      <nav className="sticky top-0 w-full z-50 bg-surface/40 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="flex justify-between items-center px-6 lg:px-12 py-4 max-w-[1600px] mx-auto relative">
          <Link href="/" className="text-xl font-extrabold tracking-tighter text-primary">SAATH CIRCLE</Link>
          <div className="hidden md:flex items-center gap-x-10 absolute left-1/2 -translate-x-1/2">
            <Link className="text-xs uppercase tracking-[0.2em] font-bold text-on-surface/50 hover:text-primary transition-colors" href="/our-story">Our Story</Link>
            <Link className="text-xs uppercase tracking-[0.2em] font-bold text-primary" href="/the-bond">The Bond</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="bg-primary text-on-primary px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary-container transition-all">Sign In</Link>
          </div>
        </div>
      </nav>
      <main className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(255,181,148,0.1),transparent_40%)]" />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_bottom_left,rgba(127,47,35,0.05),transparent_40%)]" />

        <div className="dashboard-card max-w-4xl w-full p-10 md:p-16 text-center space-y-10 relative z-10 border-none shadow-2xl bg-white/40">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-primary">The Bond</h1>
          <p className="text-lg md:text-xl text-on-surface/80 leading-relaxed font-medium">
            A Bond is a sacred promise. When you keep your word, you keep your person. Saath Circle protects your bonds by keeping an objective, immutable timeline of who paid what. No data selling, no bank reporting. Just a clear, digital Hisab book shared over a cup of chai.
          </p>
          <div className="pt-8">
            <Link href="/" className="inline-block bg-primary text-on-primary px-10 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:scale-105 hover:bg-primary-container hover:text-primary hover:shadow-xl transition-all duration-300">
              Return Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
