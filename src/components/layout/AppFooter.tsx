export function AppFooter() {
  return (
    <footer className="wood-panel mt-20 border-t-4 border-wood-dark">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <img
            src="/images/brand/dragon-pixel.png"
            alt=""
            width={163}
            height={179}
            className="pixelated h-12 w-auto"
          />
          <div>
            <p className="font-display text-lg font-bold text-cream">El Descanso del Héroe</p>
            <p className="font-pixel text-sm text-gold">Cafetería · Juegos de mesa · Rol</p>
          </div>
        </div>
        <div className="text-sm text-cream/80">
          <p>Blvd. Gustavo Díaz Ordaz 224, Zona Centro, Chihuahua, Chih.</p>
          <p className="font-pixel text-gold">Horarios en hora de Chihuahua</p>
        </div>
      </div>
      <div className="border-t-2 border-wood-dark/60 py-4 text-center font-pixel text-xs text-cream/60">
        Mockup de reservaciones · Datos ficticios
      </div>
    </footer>
  );
}
