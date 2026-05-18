export default function AboutPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-24">
      <div className="w-16 h-[1px] bg-gold mb-10 mx-auto"></div>
      <h1 className="font-serif text-4xl md:text-6xl font-bold text-royal-blue tracking-wider leading-snug mb-16 text-center uppercase">
        A Legacy of <br /> Engineering Excellence
      </h1>
      
      <div className="space-y-12 text-royal-blue/80 leading-relaxed font-medium">
        <p className="text-lg">
          The ACM Merch Collective was established to serve the premier academic computer science organization. We believe that what you wear is a reflection of your dedication to the craft of software engineering. 
        </p>
        
        <div className="border-l-2 border-gold pl-8 my-16">
          <p className="font-serif text-2xl text-royal-blue italic">
            "Our pieces are not just merchandise. They are bespoke artifacts representing a commitment to architectural perfection and computational theory."
          </p>
        </div>

        <p className="text-lg">
          Every piece in our collection is strictly curated, utilizing only the finest textiles and minimal, structured designs. The deep royal blue represents academic heritage, while our subtle gold accents signify the prestige of technological innovation. 
        </p>
        
        <p className="text-lg">
          Welcome to the Collective. Dress for the paradigm shift.
        </p>
      </div>
    </main>
  );
}
