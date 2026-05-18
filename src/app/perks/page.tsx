export default function PerksPage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-24">
      <h1 className="font-serif text-3xl font-bold text-royal-blue tracking-widest uppercase text-center mb-20 border-b border-royal-blue/10 pb-6">
        Exclusive Member Privileges
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div className="border border-royal-blue p-8 relative group hover:bg-royal-blue transition-colors duration-500">
          <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-gold -translate-x-[1px] -translate-y-[1px]"></div>
          <h3 className="font-serif text-xl font-bold text-royal-blue group-hover:text-white mb-4">First Access</h3>
          <p className="text-sm text-royal-blue/80 group-hover:text-white/80 leading-relaxed">
            Members of the ACM Collective receive 48-hour priority access to all new limited edition collections before they are released to the general student body.
          </p>
        </div>

        <div className="border border-royal-blue p-8 relative group hover:bg-royal-blue transition-colors duration-500">
          <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-gold translate-x-[1px] -translate-y-[1px]"></div>
          <h3 className="font-serif text-xl font-bold text-royal-blue group-hover:text-white mb-4">Subsidized Pricing</h3>
          <p className="text-sm text-royal-blue/80 group-hover:text-white/80 leading-relaxed">
            Enjoy academic subsidies on all premium apparel. Verified members automatically receive tier-based pricing reductions at checkout.
          </p>
        </div>

        <div className="border border-royal-blue p-8 relative group hover:bg-royal-blue transition-colors duration-500">
          <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-gold translate-x-[1px] translate-y-[1px]"></div>
          <h3 className="font-serif text-xl font-bold text-royal-blue group-hover:text-white mb-4">Bespoke Embroidery</h3>
          <p className="text-sm text-royal-blue/80 group-hover:text-white/80 leading-relaxed">
            Gain the exclusive ability to commission custom gold-thread embroidery, including graduation year and specific academic distinctions.
          </p>
        </div>
      </div>
    </main>
  );
}
