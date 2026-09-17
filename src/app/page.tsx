const features = [
  {
    title: "Property Listings",
    description:
      "Explore neighborhood homes, rentals, and shared community spaces.",
  },
  {
    title: "Neighborhood Sponsors",
    description:
      "Discover local businesses and organizations that support the community.",
  },
  {
    title: "Voice Help",
    description:
      "Get accessible voice-guided help while navigating property information.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <p className="mb-3 font-semibold uppercase tracking-widest text-blue-700">
            Welcome to your neighborhood
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Neighborhood Listing Platform
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            A community-focused platform that connects residents with local
            properties, neighborhood sponsors, and accessible support.
          </p>
        </header>

        <section
          className="mt-12 grid gap-6 md:grid-cols-3"
          aria-labelledby="features-heading"
        >
          <h2 id="features-heading" className="sr-only">
            Platform features
          </h2>

          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-xl font-semibold">{feature.title}</h3>
              <p className="mt-3 leading-7 text-slate-600">
                {feature.description}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}