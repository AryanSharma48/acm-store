export default function CartPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-24 flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-16 h-[1px] bg-gold mb-10"></div>
      
      <h1 className="font-serif text-3xl font-bold text-royal-blue tracking-widest uppercase text-center mb-6">
        Your Requisition
      </h1>
      
      <p className="text-royal-blue/60 text-sm tracking-wide uppercase text-center mb-12">
        The archive is currently empty.
      </p>

      <a 
        href="/" 
        className="border border-royal-blue text-royal-blue px-10 py-4 text-xs font-bold uppercase tracking-widest hover:bg-royal-blue hover:text-white transition-colors duration-300"
      >
        Return to Collection
      </a>
      
      <div className="w-16 h-[1px] bg-gold mt-16"></div>
    </main>
  );
}
