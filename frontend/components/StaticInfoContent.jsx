import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Heart,
  Leaf,
  Sparkles,
} from "lucide-react";
import { CONTACT } from "@/lib/site";

const linkClass = "inline-flex items-center gap-2 font-semibold text-forest underline-offset-4 hover:underline";

function Intro({ eyebrow, title, children }) {
  return (
    <header className="max-w-3xl">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 text-4xl leading-tight sm:text-5xl lg:text-6xl">{title}</h1>
      <p className="mt-5 max-w-2xl text-lg text-deep/75 sm:text-xl">{children}</p>
    </header>
  );
}

function WhySsv() {
  const reasons = [
    [Leaf, "Thoughtful ingredients", "We focus on familiar ingredients and products that keep their natural character at the centre."],
    [Sparkles, "Careful preparation", "From cold-pressed oils to ground spices, we value methods that put care before shortcuts."],
    [Heart, "Made for your home", "Useful, everyday essentials for cooking, sharing, and the small rituals that make a home."],
  ];
  return <section className="shell py-16 sm:py-20 lg:py-24">
    <Intro eyebrow="The SSV difference" title="Good essentials begin with good choices.">We bring together naturally inspired products and a simple promise: to make everyday choices with care.</Intro>
    <div className="mt-12 grid gap-5 md:grid-cols-3">{reasons.map(([Icon, title, text], index) => <article key={title} className="rounded-card border border-sand bg-white/45 p-6 sm:p-8"><span className="grid size-12 place-items-center rounded-full bg-forest text-cream"><Icon aria-hidden size={22} /></span><p className="mt-7 text-sm font-semibold tracking-widest text-clay">0{index + 1}</p><h2 className="mt-2 text-2xl">{title}</h2><p className="mt-3 text-deep/70">{text}</p></article>)}</div>
    
  </section>;
}

function Events() {
  const events = [
    {
      title: "Community Product Tasting",
      date: "Add event date",
      location: "Add venue or city",
      description: "Share a few details about the products guests discovered and how the day went.",
    },
    {
      title: "Local Market Showcase",
      date: "Add event date",
      location: "Add venue or city",
      description: "Tell visitors what SSV brought to the market and any memorable moments.",
    },
    {
      title: "Healthy Living Workshop",
      date: "Add event date",
      location: "Add venue or city",
      description: "Add a short recap of the session, the people who joined, and what they explored.",
    },
  ];
  return <section className="shell py-16 sm:py-20 lg:py-24">
    <Intro eyebrow="SSV events" title="Good moments, shared together.">Take a look back at the markets, tastings, and community gatherings hosted by SSV.</Intro>
    <div className="mt-12 flex items-center gap-4 border-b border-sand pb-4"><CalendarDays aria-hidden className="text-forest" /><h2 className="text-2xl">Past events</h2></div>
    <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{events.map((event) => <article key={event.title} className="rounded-card border border-sand bg-white/45 p-6"><p className="text-xs font-bold tracking-widest text-clay uppercase">Sample event</p><h3 className="mt-3 text-2xl">{event.title}</h3><p className="mt-3 text-sm text-deep/70">{event.description}</p><div className="mt-6 border-t border-sand pt-4 text-sm text-deep/65"><p><span className="font-semibold text-deep">Date:</span> {event.date}</p><p className="mt-1"><span className="font-semibold text-deep">Location:</span> {event.location}</p></div></article>)}</div>
    <p className="mt-5 text-sm text-deep/55">Sample event cards. Replace with SSV event photos, dates, locations, and recaps.</p>
  </section>;
}

function Contact() {
  return <section className="shell py-16 sm:py-20 lg:py-24">
    <Intro eyebrow="Contact" title="Get in touch.">Questions about a product or order? Contact the SSV team.</Intro>
    <div className="mt-8 max-w-2xl divide-y divide-sand rounded-card border border-sand bg-white/45 px-6 sm:px-8">
      <p className="py-4"><span className="font-semibold">Email:</span> <span className="text-deep/75">{CONTACT.email}</span></p>
      <p className="py-4"><span className="font-semibold">Phone:</span> <span className="text-deep/75">{CONTACT.phone}</span></p>
      <address className="py-4 not-italic"><span className="font-semibold">Address:</span> <span className="text-deep/75">{CONTACT.address.join(", ")}</span></address>
    </div>
    <p className="mt-4 text-sm text-deep/55">Contact details are sample placeholders.</p>
  </section>;
}

export default function StaticInfoContent({ page, title }) {
  switch (page) {
    case "why-ssv": return <WhySsv />;
    case "events": return <Events />;
    case "contact": return <Contact />;
    default: return <section className="shell py-20"><Intro eyebrow="SSV" title={title}>Thoughtful essentials, made with care.</Intro></section>;
  }
}
