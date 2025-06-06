
'use client';

import React from 'react'; // Added this line
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, DollarSign, ListChecks, MapPin, Users, ArrowRight, Star, Zap, TrendingUp, Palette } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTypewriter } from '@/hooks/use-typewriter'; // Import the hook

export default function HomePage() {
  const heroTaglines = [
    "Plan, track, and settle group travel expenses with unparalleled ease.",
    "Your ultimate AI-powered companion for truly collaborative adventures.",
    "Unlock seamless group trips. Focus on memories, not spreadsheets."
  ];
  const [currentTaglineIndex, setCurrentTaglineIndex] = React.useState(0);

  const typedTagline = useTypewriter({
    text: heroTaglines[currentTaglineIndex],
    speed: 50,
    loop: false, // We'll manually loop by changing the text
    onComplete: () => {
      setTimeout(() => {
        setCurrentTaglineIndex((prevIndex) => (prevIndex + 1) % heroTaglines.length);
      }, 2500); // Delay before typing the next tagline
    }
  }, [currentTaglineIndex]);


  const features = [
    {
      icon: <DollarSign className="h-10 w-10 text-primary group-hover:text-accent transition-colors duration-300" />,
      title: 'Smart Expense Tracking',
      description: 'Effortlessly log shared costs, visualize spending, and know who owes what instantly.',
    },
    {
      icon: <MapPin className="h-10 w-10 text-primary group-hover:text-accent transition-colors duration-300" />,
      title: 'Collaborative Itineraries',
      description: 'Build detailed travel schedules together, from flights and stays to daily activities.',
    },
    {
      icon: <ListChecks className="h-10 w-10 text-primary group-hover:text-accent transition-colors duration-300" />,
      title: 'Synced Packing Lists',
      description: 'Never forget essentials with smart, shareable packing lists for your group.',
    },
    {
      icon: <TrendingUp className="h-10 w-10 text-primary group-hover:text-accent transition-colors duration-300" />,
      title: 'AI-Powered Insights',
      description: 'Let GenAI suggest optimal settlements, budget tips, and even activity ideas.',
    },
  ];

  return (
    <div className="flex flex-col items-center overflow-x-hidden">
      {/* Hero Section */}
      <section className="w-full pt-24 pb-32 md:pt-36 md:pb-48 text-center relative isolate bg-gradient-to-br from-background via-primary/5 to-accent/5 dark:from-background dark:via-primary/10 dark:to-accent/10">
        <div
          className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-40"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary/50 to-accent/50 opacity-20 dark:opacity-10 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
        <div className="container mx-auto px-4">
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary bg-300% animate-gradient-flow-fast animate-fade-in-up">
            WanderLedger
          </h1>
          <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto animate-fade-in-up delay-100 min-h-[3em] md:min-h-[2.5em]">
            <span className="typewriter-cursor">{typedTagline}</span>
          </p>
          <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-5 animate-fade-in-up delay-200">
            <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 text-base px-10 py-7 bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-primary-foreground group">
              <Link href="/signup">
                Start Your Adventure <ArrowRight className="ml-2.5 h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 text-base px-10 py-7 border-2 border-primary/40 hover:border-primary hover:bg-primary/5 group">
              <Link href="#features">
                Explore Features <Palette className="ml-2.5 h-5 w-5 group-hover:animate-pulse"/>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground animate-fade-in-up">
              Travel Smarter, Not Harder
            </h2>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up delay-100">
              WanderLedger simplifies every aspect of group travel planning and finance with intelligent features.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {features.map((feature, index) => (
              <Card key={feature.title} className={`text-center shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-2.5 border border-transparent hover:border-primary/20 dark:bg-card/80 dark:hover:border-primary/40 animate-fade-in-up delay-${(index + 1) * 100} group`}>
                <CardHeader className="items-center pt-8">
                  <div className="p-5 bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 rounded-full w-fit mb-3 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
                    {feature.icon}
                  </div>
                  <CardTitle className="mt-4 text-xl font-semibold tracking-tight">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="pb-8">
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works / Visual Section */}
      <section className="w-full bg-muted/40 dark:bg-muted/20">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="animate-fade-in-up">
            <span className="text-sm font-semibold uppercase text-accent tracking-wider">Effortless Collaboration</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-8 text-foreground leading-tight">Simplify Group Travels in 3 Easy Steps</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Focus on making memories, not managing spreadsheets. WanderLedger takes the headache out of group trip planning.
            </p>
            <ul className="space-y-5 mb-10">
              {[
                { title: "Create & Invite", text: "Set up your trip in seconds and invite friends with a simple link. Get everyone on board effortlessly.", icon: <Zap className="h-7 w-7 text-primary flex-shrink-0" /> },
                { title: "Track & Split", text: "Log expenses on the go. Our AI helps split bills fairly and accurately, no matter how complex.", icon: <DollarSign className="h-7 w-7 text-primary flex-shrink-0" /> },
                { title: "Settle & Smile", text: "Minimize transfers with smart settlement suggestions. Everyone pays their share, hassle-free.", icon: <CheckCircle className="h-7 w-7 text-primary flex-shrink-0" /> },
              ].map(item => (
                <li key={item.title} className="flex items-start gap-5 p-5 bg-background rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex-shrink-0 p-3 bg-primary/10 rounded-full">{item.icon}</div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">{item.title}</h3>
                    <p className="text-muted-foreground text-sm mt-1">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Button size="lg" asChild className="shadow-md hover:shadow-lg transition-shadow bg-accent hover:bg-accent/90 text-accent-foreground group text-base px-8 py-6">
              <Link href="/signup">
                Plan Your First Trip <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          <div className="animate-fade-in-up delay-100 mt-8 md:mt-0">
            <Image
              src="https://placehold.co/700x800.png" // Adjusted aspect ratio
              alt="WanderLedger App Interface Showcase"
              width={700}
              height={800}
              className="rounded-xl shadow-2xl object-cover transform transition-all duration-500 hover:scale-105"
              data-ai-hint="travel app mockup"
            />
          </div>
        </div>
      </section>
      
      {/* Testimonial/Social Proof Section */}
      <section className="w-full bg-background">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-16 text-foreground animate-fade-in-up">Loved by Travelers Worldwide</h2>
            <div className="grid md:grid-cols-3 gap-10">
                {[
                    { name: "Sarah L.", quote: "WanderLedger made our Europe trip SO much easier financially! The AI settlement is magic.", avatarHint: "woman travel europe" },
                    { name: "Mike P.", quote: "Finally, an app that understands group travel headaches. Indispensable for our annual ski trips.", avatarHint: "man smiling mountain" },
                    { name: "Chloe & Ben", quote: "Planning our honeymoon adventures was a breeze. Shared lists and itinerary were perfect for us.", avatarHint: "couple beach" }
                ].map((testimonial, index) => (
                    <Card key={testimonial.name} className={`bg-muted/30 dark:bg-card/70 p-8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in-up delay-${(index+1)*100}`}>
                        <CardContent className="pt-6">
                            <div className="flex justify-center mb-6">
                                <Image src={`https://placehold.co/80x80.png`} alt={testimonial.name} width={80} height={80} className="rounded-full shadow-md" data-ai-hint={testimonial.avatarHint}/>
                            </div>
                            <p className="text-muted-foreground italic text-md leading-relaxed">&quot;{testimonial.quote}&quot;</p>
                            <p className="font-semibold text-lg mt-6 text-foreground">{testimonial.name}</p>
                            <div className="flex justify-center mt-2">
                                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />)}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full py-24 md:py-36 text-center bg-gradient-to-br from-primary via-blue-600 to-accent dark:from-primary/90 dark:via-blue-700 dark:to-accent/90">
         <div
          className="absolute inset-0 -z-10 transform-gpu overflow-hidden blur-3xl opacity-30"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-full -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary/30 to-accent/30 sm:left-[calc(50%-30rem)] sm:w-[120.1875rem]"
            style={{
              clipPath:
                'polygon(20% 0%, 80% 0%, 100% 50%, 80% 100%, 20% 100%, 0% 50%)',
            }}
          />
        </div>
        <div className="container mx-auto px-4 relative">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-6 text-primary-foreground animate-fade-in-up tracking-tight">Ready for Stress-Free Group Travel?</h2>
          <p className="mt-5 text-lg md:text-xl text-primary-foreground/80 max-w-3xl mx-auto mb-12 animate-fade-in-up delay-100">
            Join thousands of travelers making group trips unforgettable for all the right reasons. Sign up today and experience the future of travel planning – it&apos;s free to start!
          </p>
          <Button size="lg" asChild className="shadow-xl hover:shadow-2xl transition-all duration-300 text-lg px-12 py-8 bg-background text-primary hover:bg-background/90 animate-fade-in-up delay-200 transform hover:scale-105 hover:-translate-y-1">
            <Link href="/signup">
              Get Started Now!
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
