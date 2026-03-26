"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";

export function LandingHero() {
  const handleSignIn = () => {
    signIn("google", undefined, { prompt: "select_account" });
  };

  return (
    <div className="bg-surface text-on-surface font-body selection:bg-secondary-container selection:text-on-secondary-container min-h-screen">
      <nav className="fixed top-0 w-full z-50 bg-surface/40 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="flex justify-between items-center px-6 lg:px-12 py-4 max-w-[1600px] mx-auto relative">
          <Link href="/" className="text-xl font-extrabold tracking-tighter text-primary cursor-pointer">SAATH CIRCLE</Link>
          <div className="hidden md:flex items-center gap-x-10 absolute left-1/2 -translate-x-1/2">
            <Link className="text-xs uppercase tracking-[0.2em] font-bold text-primary" href="/our-story">Our Story</Link>
            <Link className="text-xs uppercase tracking-[0.2em] font-bold text-on-surface/50 hover:text-primary transition-colors" href="/the-bond">The Bond</Link>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSignIn}
              className="bg-primary text-on-primary px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-primary-container transition-all"
            >
              Start Bond
            </button>
            <button 
              onClick={handleSignIn}
              className="border border-outline-variant/40 text-on-surface px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-surface-container transition-all"
            >
              Sign In
            </button>
          </div>
        </div>
      </nav>
      
      <main>
        <section className="full-bleed-hero h-screen flex items-center justify-center relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-8 text-center text-white space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/30 bg-white/10 backdrop-blur-md text-[10px] uppercase tracking-[0.3em] font-bold">
              <span className="material-symbols-outlined text-xs">favorite</span>
              The Space Between Us
            </div>
            <h1 className="text-5xl md:text-8xl font-extrabold tracking-tighter leading-none">
              For the <span className="text-secondary-container">promises</span> we keep.
            </h1>
            <p className="text-lg md:text-xl text-white/80 font-light max-w-2xl mx-auto leading-relaxed">
              Saath Circle is a private, shared space for you and your person. Record a helping hand, track a split, and keep your friendship exactly where it should be.
            </p>
            <div className="flex justify-center pt-8">
              <button 
                onClick={handleSignIn}
                className="bg-white text-primary px-10 py-4 rounded-full font-bold uppercase tracking-widest text-xs hover:scale-105 hover:bg-surface-container hover:shadow-xl transition-all duration-300"
              >
                Start your Bond
              </button>
            </div>
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
            <span className="material-symbols-outlined text-white text-3xl">keyboard_double_arrow_down</span>
          </div>
        </section>
        
        <section className="max-w-[1600px] mx-auto px-6 lg:px-12 py-20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-8 lg:col-span-4 dashboard-card p-8 rounded-[2rem] flex flex-col justify-between min-h-[400px]">
              <div>
                <div className="flex justify-between items-start mb-12">
                  <div className="bg-primary/10 p-4 rounded-2xl">
                    <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: '"FILL" 1' }}>account_balance_wallet</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full">Active Bond</span>
                </div>
                <h3 className="text-sm font-bold text-on-surface-variant uppercase tracking-widest mb-2">Our Shared Balance</h3>
                <div className="text-6xl font-extrabold text-primary tracking-tighter">₹3,500</div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-on-surface/50">
                  <span>Utilization</span>
                  <span>66%</span>
                </div>
                <div className="h-1.5 w-full bg-surface rounded-full overflow-hidden">
                  <div className="h-full w-[66%] bg-primary rounded-full"></div>
                </div>
                <div className="flex justify-between items-center text-[8px] font-extrabold tracking-widest uppercase pt-2 text-on-surface/40">
                  <span>Last check-in: Today, 2:40 PM</span>
                  <span className="text-primary">Mutual Support</span>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-12 lg:col-span-5 dashboard-card p-8 rounded-[2rem] min-h-[400px]">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-sm font-bold text-primary uppercase tracking-[0.2em]">The Mirror: Our Timeline</h3>
                <button className="text-[10px] font-bold uppercase text-secondary border-b border-secondary/30">View All</button>
              </div>
              <div className="space-y-6">
                <div className="flex items-start gap-6 group">
                  <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-secondary text-sm">handshake</span>
                  </div>
                  <div className="flex-grow border-b border-outline-variant/30 pb-4">
                    <p className="text-sm font-medium mb-1">Aarav supported with ₹2,000 for site visit.</p>
                    <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Mar 12, 2024</span>
                  </div>
                </div>
                <div className="flex items-start gap-6 group">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm">done_all</span>
                  </div>
                  <div className="flex-grow border-b border-outline-variant/30 pb-4">
                    <p className="text-sm font-medium mb-1">Settled ₹1,000 via UPI.</p>
                    <span className="text-[10px] font-bold text-on-surface/40 uppercase tracking-widest">Today, 11:30 AM</span>
                  </div>
                </div>
                <div className="flex items-start gap-6">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-on-surface/30 text-sm">more_horiz</span>
                  </div>
                  <p className="text-xs text-on-surface/40 italic flex items-center h-10">A digital Hisab book shared over a cup of chai...</p>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-4 lg:col-span-3 dashboard-card p-8 rounded-[2rem] flex flex-col justify-between !bg-primary !text-on-primary">
              <div>
                <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-8">
                  <span className="material-symbols-outlined text-white">front_hand</span>
                </div>
                <h2 className="text-2xl font-extrabold tracking-tighter mb-4 leading-tight">Trust is built on mutual agreement.</h2>
                <p className="text-xs opacity-70 leading-relaxed">Nothing enters your Shared Balance without both of you saying 'Yes'.</p>
              </div>
              <div className="space-y-3 pt-8">
                <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl border border-white/5">
                  <span className="material-symbols-outlined text-xs">edit_note</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Proposed</span>
                </div>
                <div className="flex items-center gap-3 bg-white text-primary p-3 rounded-xl">
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: '"FILL" 1' }}>verified_user</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Confirmed</span>
                </div>
              </div>
            </div>
            
            <div className="md:col-span-5 lg:col-span-3 dashboard-card p-8 rounded-[2rem] !bg-secondary-fixed text-on-secondary-fixed text-center flex flex-col items-center justify-center space-y-4">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: '"FILL" 1' }}>coffee</span>
              <h3 className="text-lg font-bold tracking-tight">Check-in with [Name]</h3>
              <p className="text-[10px] font-medium opacity-70 uppercase tracking-[0.1em]">Send a virtual chai to keep it light</p>
              <button 
                onClick={handleSignIn}
                className="mt-4 bg-on-secondary-fixed text-white w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all"
              >
                Send Nudge
              </button>
            </div>
            
            <div className="md:col-span-7 lg:col-span-6 dashboard-card p-8 rounded-[2rem] grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="bg-surface-container-high w-10 h-10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">family_restroom</span>
                </div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Sibling Support</h4>
                <p className="text-xs text-on-surface/60 leading-relaxed">Track dreams without debt feelings. Build goals together.</p>
              </div>
              <div className="space-y-4">
                <div className="bg-surface-container-high w-10 h-10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">cottage</span>
                </div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Room Expenses</h4>
                <p className="text-xs text-on-surface/60 leading-relaxed">For partners or roommates. Keep the home peace clear.</p>
              </div>
              <div className="space-y-4">
                <div className="bg-surface-container-high w-10 h-10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">volunteer_activism</span>
                </div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-primary">Friend's Dream</h4>
                <p className="text-xs text-on-surface/60 leading-relaxed">Record the intent and support. Memory and math kept safe.</p>
              </div>
              <div className="space-y-4">
                <div className="bg-surface-container-high w-10 h-10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">handshake</span>
                </div>
                <h4 className="text-sm font-bold uppercase tracking-widest text-primary">The Duo</h4>
                <p className="text-xs text-on-surface/60 leading-relaxed">Shared records building lasting trust between you two.</p>
              </div>
            </div>
            
            <div className="md:col-span-12 lg:col-span-3 dashboard-card p-8 rounded-[2rem] border-2 border-primary/20 !bg-surface-container-low flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6 text-primary">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: '"wght" 600' }}>shield_with_heart</span>
                  <span className="text-[10px] font-black uppercase tracking-widest">Privacy Sanctuary</span>
                </div>
                <h4 className="text-xl font-extrabold tracking-tighter text-primary mb-4">Privacy-first design for your inner circle.</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface/70">
                    <span className="material-symbols-outlined text-xs text-primary">check_circle</span>
                    ZERO 3RD PARTY ADS
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface/70">
                    <span className="material-symbols-outlined text-xs text-primary">check_circle</span>
                    NO BANK REPORTING
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-outline-variant/30 mt-6">
                <p className="text-[10px] font-medium text-on-surface/40 leading-tight">Your Shared Balance is a confidential conversation shared only between you.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="bg-surface-container-highest/30 py-12 px-6 border-t border-outline-variant/10 mt-20">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-lg font-black tracking-tighter text-primary">SAATH CIRCLE</div>
          <div className="flex gap-8">
            <Link className="text-[10px] font-bold uppercase tracking-widest text-on-surface/50 hover:text-primary transition-colors" href="/contact-us">Contact Us</Link>
          </div>
          <div className="text-[10px] font-bold text-on-surface/30 uppercase tracking-[0.2em]">© Saath Circle. All Trusted.</div>
        </div>
      </footer>
    </div>
  );
}
