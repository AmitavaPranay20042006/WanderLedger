import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, DollarSign, ListChecks, MapPin, Users, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  const features = [
    {
      icon: <DollarSign className="h-8 w-8 text-primary" />,
      title: 'Expense Tracking',
      description: 'Easily record and split shared costs. Know who owes what, instantly.',
    },
    {
      icon: <MapPin className="h-8 w-8 text-primary" />,
      title: 'Itinerary Planning',
      description: 'Collaboratively build your travel schedule, from flights to activities.',
    },
    {
      icon: <ListChecks className="h-8 w-8 text-primary" />,
      title: 'Shared Packing Lists',
      description: 'Ensure nothing is forgotten with a synchronized packing list for the group.',
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: 'Seamless Collaboration',
      description: 'Designed for groups, making travel planning transparent and fun.',
    },
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-32 text-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
            WanderLedger
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Plan, track, and settle group travel expenses effortlessly. Your ultimate companion for collaborative adventures.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/signup">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="shadow-lg hover:shadow-xl transition-shadow">
              <Link href="/login">
                Login to Your Account
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            Why Choose WanderLedger?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center shadow-lg hover:shadow-xl transition-shadow transform hover:-translate-y-1">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
                    {feature.icon}
                  </div>
                  <CardTitle className="mt-4 text-xl font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works / Visual Section */}
      <section className="w-full py-16 md:py-24 bg-muted/50">
        <div className="container mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Simplify Your Group Travels</h2>
            <p className="text-muted-foreground mb-4">
              WanderLedger takes the headache out of group trip planning. Focus on making memories, not managing spreadsheets.
            </p>
            <ul className="space-y-3 mb-8">
              {[
                'Create trips and invite friends in seconds.',
                'Track who paid for what, and split bills fairly.',
                'AI-powered settlement suggestions to minimize transfers.',
                'Stay organized with shared itineraries and packing lists.',
                'Access your trip info anywhere, anytime.'
              ].map(item => (
                <li key={item} className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Button size="lg" asChild className="shadow-md hover:shadow-lg transition-shadow">
              <Link href="/signup">
                Start Planning Today
              </Link>
            </Button>
          </div>
          <div>
            <Image
              src="https://placehold.co/600x400.png"
              alt="WanderLedger App Screenshot"
              width={600}
              height={400}
              className="rounded-xl shadow-2xl object-cover"
              data-ai-hint="travel planning app"
            />
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full py-20 md:py-32 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">Ready for Stress-Free Group Travel?</h2>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-8">
            Join thousands of travelers who use WanderLedger to make their group trips unforgettable for all the right reasons.
          </p>
          <Button size="lg" asChild className="shadow-lg hover:shadow-xl transition-shadow text-lg px-8 py-6">
            <Link href="/signup">
              Sign Up Now & Plan Your Next Adventure
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
