import type { ReservationEvent } from "./types";

/**
 * Fictional events for the visual mockup only. Nothing here is persisted.
 */
export const MOCK_EVENTS: ReservationEvent[] = [
  {
    id: "noche-de-dragones",
    name: "Noche de Dragones",
    tagline: "One-shots de D&D para todos los niveles",
    description:
      "Seis mesas, seis aventuras. Elige tu Dungeon Master, trae tus dados (o usa los nuestros) y vive una noche épica en la taberna.",
    dateLabel: "Sábado 14 de noviembre",
    timeLabel: "5:00 p.m.",
    opensAtLabel: "Miércoles 11 de noviembre · 12:00 p.m.",
    timezone: "America/Chihuahua",
    status: "open",
    band: "band-provision",
    tables: [
      {
        id: "guarida-del-dragon",
        name: "La Guarida del Dragón",
        game: "D&D 5e · Aventura clásica",
        host: "DM Aldric",
        capacity: 6,
        taken: 3,
        level: "Intermedio",
      },
      {
        id: "cripta-del-lich",
        name: "Cripta del Lich",
        game: "D&D 5e · Terror",
        host: "DM Morgana",
        capacity: 5,
        taken: 4,
        level: "Avanzado",
      },
      {
        id: "taberna-del-kraken",
        name: "Taberna del Kraken",
        game: "D&D 5e · Piratas",
        host: "DM Bram",
        capacity: 4,
        taken: 1,
        level: "Principiantes",
      },
      {
        id: "bosque-de-susurros",
        name: "Bosque de los Susurros",
        game: "D&D 5e · Primera partida",
        host: "DM Elara",
        capacity: 6,
        taken: 6,
        level: "Principiantes",
      },
      {
        id: "fortaleza-enana",
        name: "Fortaleza Enana",
        game: "D&D 5e · Exploración",
        host: "DM Thorin",
        capacity: 5,
        taken: 0,
        level: "Intermedio",
      },
      {
        id: "torre-del-archimago",
        name: "Torre del Archimago",
        game: "D&D 5e · Intriga arcana",
        host: "DM Ysolde",
        capacity: 4,
        taken: 1,
        closed: true,
        closedReason: "El DM no podrá asistir",
        level: "Avanzado",
      },
    ],
  },
  {
    id: "torneo-de-colonos",
    name: "Torneo de Colonos",
    tagline: "Catán por eliminatorias, premio para la mejor party",
    description:
      "Cuatro mesas de cuatro jugadores. Las dos mejores puntuaciones pasan a la final. Café de cortesía para los finalistas.",
    dateLabel: "Sábado 21 de noviembre",
    timeLabel: "4:00 p.m.",
    opensAtLabel: "Miércoles 18 de noviembre · 12:00 p.m.",
    timezone: "America/Chihuahua",
    status: "published",
    band: "band-lattes",
    tables: [
      {
        id: "mesa-trigo",
        name: "Mesa del Trigo",
        game: "Catán",
        host: "Juez Nilo",
        capacity: 4,
        taken: 0,
      },
      {
        id: "mesa-ladrillo",
        name: "Mesa del Ladrillo",
        game: "Catán",
        host: "Juez Nilo",
        capacity: 4,
        taken: 0,
      },
      {
        id: "mesa-lana",
        name: "Mesa de la Lana",
        game: "Catán",
        host: "Juez Vera",
        capacity: 4,
        taken: 0,
      },
      {
        id: "mesa-mineral",
        name: "Mesa del Mineral",
        game: "Catán",
        host: "Juez Vera",
        capacity: 4,
        taken: 0,
      },
    ],
  },
  {
    id: "cripta-de-medianoche",
    name: "Cripta de Medianoche",
    tagline: "Especial de terror con Call of Cthulhu",
    description: "Una noche de investigación, locura y velas. Las reservaciones ya cerraron.",
    dateLabel: "Sábado 31 de octubre",
    timeLabel: "8:00 p.m.",
    opensAtLabel: "Miércoles 28 de octubre · 12:00 p.m.",
    timezone: "America/Chihuahua",
    status: "closed",
    band: "band-pociones",
    tables: [
      {
        id: "biblioteca",
        name: "La Biblioteca Prohibida",
        game: "Call of Cthulhu",
        host: "Guardián Silas",
        capacity: 5,
        taken: 5,
      },
      {
        id: "faro",
        name: "El Faro Abandonado",
        game: "Call of Cthulhu",
        host: "Guardiana Iris",
        capacity: 4,
        taken: 3,
      },
    ],
  },
];

/**
 * Mockup-only: reserving this table simulates someone else taking the last
 * seat first, so the "mesa llena" state can be previewed.
 */
export const SIMULATED_RACE_TABLE_ID = "cripta-del-lich";

/** Mockup-only: this table loses a seat a few seconds after opening the page. */
export const SIMULATED_LIVE_TABLE_ID = "taberna-del-kraken";

export function findMockEvent(id: string): ReservationEvent | undefined {
  return MOCK_EVENTS.find((event) => event.id === id);
}
