import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, Armchair, BadgeCheck } from "lucide-react";

import { AppFooter } from "@/components/layout/AppFooter";
import { AppHeader } from "@/components/layout/AppHeader";
import { EventCard } from "@/features/reservations/components/EventCard";
import { usePublishedEvents } from "@/features/reservations/firebase/use-published-events";
import { toReservationEvent } from "@/features/reservations/firebase/reservation-adapters";

const LOGO_URL = "/images/brand/logo.png";
const TAVERNA_URL = "/images/brand/taberna.webp";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reservaciones · El Descanso del Héroe" },
      {
        name: "description",
        content:
          "Aparta tu lugar en las mesas de juegos de mesa y D&D de El Descanso del Héroe, Chihuahua.",
      },
      { property: "og:title", content: "Reservaciones · El Descanso del Héroe" },
      {
        property: "og:description",
        content: "Elige tu evento, escoge tu mesa y asegura tu lugar en la taberna.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

const STEPS = [
  { icon: CalendarDays, title: "Elige el evento", text: "Consulta fechas y la hora de apertura." },
  { icon: Armchair, title: "Escoge tu mesa", text: "Mira cuántos lugares quedan en cada una." },
  {
    icon: BadgeCheck,
    title: "Asegura tu lugar",
    text: "Escribe tu alias una vez y recibe tu confirmación.",
  },
];

function HomePage() {
  const { events, loading, error } = usePublishedEvents();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const nextOpening = events
      .map((event) => event.opensAt.toMillis())
      .filter((opensAt) => opensAt > now)
      .sort((a, b) => a - b)[0];
    if (nextOpening === undefined) return;
    const timer = window.setTimeout(
      () => setNow(Date.now()),
      Math.min(nextOpening - now, 2_147_000_000),
    );
    return () => window.clearTimeout(timer);
  }, [events, now]);
  return (
    <>
      <AppHeader />
      <main>
        <section className="relative isolate overflow-hidden">
          <img
            src={TAVERNA_URL}
            alt=""
            width={1820}
            height={1024}
            className="pixelated absolute inset-0 -z-20 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 night-veil" />
          <span
            aria-hidden
            className="absolute left-[12%] top-[18%] size-2 bg-gold animate-twinkle"
          />
          <span
            aria-hidden
            className="absolute left-[82%] top-[24%] size-2 bg-gold animate-twinkle [animation-delay:0.8s]"
          />
          <span
            aria-hidden
            className="absolute left-[70%] top-[70%] size-2 bg-gold animate-twinkle [animation-delay:1.6s]"
          />
          <span
            aria-hidden
            className="absolute left-[22%] top-[66%] size-2 bg-gold animate-twinkle [animation-delay:1.2s]"
          />

          <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 pb-16 pt-10 sm:px-6 md:grid-cols-[0.8fr_1.2fr] md:pb-24 md:pt-16">
            <div className="mx-auto w-full max-w-[11rem] md:max-w-xs">
              <div className="parchment-panel pixel-frame-gold animate-float px-5 py-5 md:px-8 md:py-8">
                <img
                  src={LOGO_URL}
                  alt="El Descanso del Héroe"
                  width={358}
                  height={520}
                  className="mx-auto h-auto w-full max-w-56"
                />
              </div>
            </div>
            <div className="text-center md:text-left">
              <p className="font-pixel text-base uppercase tracking-[0.2em] text-gold">
                Tablón de reservaciones
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold leading-[1.1] text-cream text-shadow-pixel sm:text-5xl lg:text-6xl">
                Aparta tu lugar en la mesa
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-lg text-cream/90 md:mx-0">
                Las reservaciones abren a las 12:00 p.m. (hora de Chihuahua). El primero en llegar,
                se sienta.
              </p>
              <div className="mt-7 flex justify-center md:justify-start">
                <a
                  href="#eventos"
                  className="bg-primary px-5 py-3 font-pixel text-primary-foreground shadow-pixel-sm"
                >
                  Ver eventos ▸
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="eventos" className="mx-auto max-w-6xl scroll-mt-20 px-5 pt-14 sm:px-6">
          <div className="text-center">
            <p className="font-pixel text-sm uppercase tracking-[0.2em] text-primary">
              Próximas misiones
            </p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Eventos</h2>
            <div className="mx-auto mt-4 w-40 ornament-rule" />
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div
                className="col-span-full grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                aria-label="Cargando eventos"
                aria-busy="true"
              >
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="h-56 animate-pulse bg-card pixel-frame" />
                ))}
              </div>
            ) : error ? (
              <p role="alert" className="col-span-full text-center text-destructive">
                No pudimos cargar los eventos. Comprueba tu conexión e inténtalo de nuevo.
              </p>
            ) : events.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground">
                No hay eventos publicados por el momento. Vuelve pronto.
              </p>
            ) : (
              events.map((record) => {
                const event = toReservationEvent(record, now);
                return <EventCard key={event.id} event={event} />;
              })
            )}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pt-20 sm:px-6">
          <div className="parchment-panel pixel-frame-gold px-6 py-8 sm:px-10">
            <h2 className="text-center text-2xl font-bold sm:text-3xl">¿Cómo funciona?</h2>
            <ol className="mt-8 grid gap-5 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="flex items-start gap-4 border-2 border-wood-dark/20 bg-card/70 p-4 sm:flex-col sm:gap-3 sm:p-5"
                >
                  <span className="flex size-14 shrink-0 items-center justify-center bg-secondary text-secondary-foreground shadow-pixel-sm">
                    <step.icon className="size-7" strokeWidth={2.5} aria-hidden />
                  </span>
                  <div>
                    <p className="font-pixel text-xs uppercase tracking-widest text-primary">
                      Paso {i + 1}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-bold">{step.title}</h3>
                    <p className="text-foreground/80">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <AppFooter />
    </>
  );
}
