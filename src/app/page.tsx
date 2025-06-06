
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, DollarSign, ListChecks, MapPin, Users, ArrowRight, Star, Zap } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  const features = [
    {
      icon: <DollarSign className="h-10 w-10 text-primary" />,
      title: 'Smart Expense Tracking',
      description: 'Effortlessly log shared costs, visualize spending, and know who owes what instantly.',
    },
    {
      icon: <MapPin className="h-10 w-10 text-primary" />,
      title: 'Collaborative Itineraries',
      description: 'Build detailed travel schedules together, from flights and stays to daily activities.',
    },
    {
      icon: <ListChecks className="h-10 w-10 text-primary" />,
      title: 'Synced Packing Lists',
      description: 'Never forget essentials with smart, shareable packing lists for your group.',
    },
    {
      icon: <Users className="h-10 w-10 text-primary" />,
      title: 'Seamless Group Hub',
      description: 'A central place for all trip details, making group travel transparent and fun for everyone.',
    },
  ];

  return (
    <div className="flex flex-col items-center overflow-x-hidden"> {/* Prevent horizontal scroll */}
      {/* Hero Section */}
      <section className="w-full pt-20 pb-28 md:pt-32 md:pb-40 text-center relative isolate">
        <div
          className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-20"
          aria-hidden="true"
        >
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary/70 to-accent/70 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>
        <div className="container mx-auto px-4">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground animate-fade-in-up">
            WanderLedger
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto animate-fade-in-up delay-100">
            Plan, track, and settle group travel expenses with unparalleled ease. Your ultimate AI-powered companion for truly collaborative adventures.
          </p>
          <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-4 animate-fade-in-up delay-200">
            <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 text-base px-8 py-6 bg-primary hover:bg-primary/90 group">
              <Link href="/signup">
                Start Your Adventure <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out transform hover:-translate-y-1 text-base px-8 py-6 border-2 border-primary/50 hover:border-primary">
              <Link href="/login">
                Explore Features
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-foreground animate-fade-in-up">
              Everything You Need, Nothing You Don&apos;t
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto animate-fade-in-up delay-100">
              WanderLedger simplifies every aspect of group travel planning and finance.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={feature.title} className={`text-center shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-2 border border-transparent hover:border-primary/30 animate-fade-in-up delay-${(index + 1) * 100}`}>
                <CardHeader className="items-center">
                  <div className="p-4 bg-primary/10 rounded-full w-fit mb-2">
                    {feature.icon}
                  </div>
                  <CardTitle className="mt-4 text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works / Visual Section */}
      <section className="w-full bg-muted/30">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="animate-fade-in-up">
            <span className="text-sm font-semibold uppercase text-primary tracking-wider">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-6 text-foreground">Simplify Your Group Travels in 3 Easy Steps</h2>
            <p className="text-muted-foreground mb-6 text-lg">
              WanderLedger takes the headache out of group trip planning. Focus on making memories, not managing spreadsheets.
            </p>
            <ul className="space-y-4 mb-8">
              {[
                { title: "Create & Invite", text: "Set up your trip in seconds and invite friends with a simple link.", icon: <Zap className="h-6 w-6 text-accent flex-shrink-0" /> },
                { title: "Track & Split", text: "Log expenses on the go. AI helps split bills fairly and accurately.", icon: <DollarSign className="h-6 w-6 text-accent flex-shrink-0" /> },
                { title: "Settle & Smile", text: "Minimize transfers with smart settlement suggestions. Everyone pays their share, hassle-free.", icon: <CheckCircle className="h-6 w-6 text-accent flex-shrink-0" /> },
              ].map(item => (
                <li key={item.title} className="flex items-start gap-4 p-4 bg-background rounded-lg shadow-sm">
                  {item.icon}
                  <div>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-muted-foreground text-sm">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Button size="lg" asChild className="shadow-md hover:shadow-lg transition-shadow bg-accent hover:bg-accent/90 text-accent-foreground group">
              <Link href="/signup">
                Plan Your First Trip <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          <div className="animate-fade-in-up delay-100">
            <Image
              src="https://placehold.co/700x500.png"
              alt="WanderLedger App Interface Showcase"
              width={700}
              height={500}
              className="rounded-xl shadow-2xl object-cover"
              data-ai-hint="travel app interface"
            />
          </div>
        </div>
      </section>
      
      {/* Testimonial/Social Proof (Example) */}
      <section className="w-full bg-background">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-10 text-foreground animate-fade-in-up">Loved by Travelers Worldwide</h2>
            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { name: "Sarah L.", quote: "WanderLedger made our Europe trip so much easier to manage financially!", avatarHint: "woman travel" },
                    { name: "Mike P.", quote: "Finally, an app that understands group travel headaches. The settlement feature is a lifesaver.", avatarHint: "man smiling" },
                    { name: "Chloe T.", quote: "Planning our ski trip was a breeze. Shared lists and itinerary were perfect.", avatarHint: "group friends" }
                ].map((testimonial, index) => (
                    <Card key={testimonial.name} className={`bg-muted/50 p-6 shadow-lg animate-fade-in-up delay-${(index+1)*100}`}>
                        <CardContent className="pt-4">
                            <div className="flex justify-center mb-4">
                                <Image src={`https://placehold.co/80x80.png`} alt={testimonial.name} width={80} height={80} className="rounded-full" data-ai-hint={testimonial.avatarHint}/>
                            </div>
                            <p className="text-muted-foreground italic">&quot;{testimonial.quote}&quot;</p>
                            <p className="font-semibold mt-4">{testimonial.name}</p>
                            <div className="flex justify-center mt-1">
                                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />)}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      </section>


      {/* Call to Action Section */}
      <section className="w-full py-20 md:py-32 text-center bg-gradient-to-br from-primary/80 to-accent/80">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-primary-foreground animate-fade-in-up">Ready for Stress-Free Group Travel?</h2>
          <p className="mt-4 text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-10 animate-fade-in-up delay-100">
            Join thousands of travelers who use WanderLedger to make their group trips unforgettable for all the right reasons. Sign up today and experience the future of travel planning.
          </p>
          <Button size="lg" asChild className="shadow-xl hover:shadow-2xl transition-shadow text-lg px-10 py-7 bg-background text-primary hover:bg-background/90 animate-fade-in-up delay-200 transform hover:scale-105">
            <Link href="/signup">
              Sign Up Now - It&apos;s Free!
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
