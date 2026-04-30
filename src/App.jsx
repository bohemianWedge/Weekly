export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center px-16">
      <div className="max-w-xl">
        <p className="text-xs uppercase tracking-[0.1em] text-text-faint mb-6">
          Setup OK · Étape 1
        </p>
        <h1 className="font-serif text-6xl leading-none mb-6">
          Bonjour, mardi.
        </h1>
        <p className="text-text-muted leading-relaxed">
          Vite, React, Tailwind et les polices Fraunces + Inter sont chargés.
          On peut passer à l'étape 2 : helpers de dates, storage et slotEngine.
        </p>
        <p className="mt-8 text-text-faint text-sm tabular">
          08:00 — 13:00 · 5h00
        </p>
      </div>
    </div>
  )
}
