import { Link } from "@tanstack/react-router";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 wood-panel border-b-4 border-wood-dark">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-3 sm:px-6">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-2.5"
          aria-label="Inicio de reservaciones"
        >
          <img
            src="/images/brand/dragon-pixel.png"
            alt=""
            width={163}
            height={179}
            className="pixelated h-11 w-auto shrink-0 drop-shadow"
          />
          <span className="min-w-0 leading-tight">
            <span className="block truncate font-display text-base font-bold text-cream text-shadow-pixel sm:text-xl">
              El Descanso del Héroe
            </span>
            <span className="block font-pixel text-sm text-gold">Reservaciones</span>
          </span>
        </Link>
        <nav aria-label="Principal" className="flex items-center font-pixel text-sm sm:text-base">
          <Link
            to="/"
            hash="eventos"
            className="px-2 py-1.5 text-cream/85 transition-colors hover:text-gold sm:px-3"
          >
            Eventos
          </Link>
          <a
            href="https://eldescansodelheroe.com"
            className="hidden px-2 py-1.5 text-cream/85 transition-colors hover:text-gold min-[420px]:block sm:px-3"
          >
            Sitio ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
