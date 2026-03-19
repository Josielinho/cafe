import { CheckCircle2, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ThankYouScreen() {
  return (
    <main className="min-h-screen bg-white px-4 py-8 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[80vh] max-w-4xl items-center justify-center">
        <section className="relative w-full overflow-hidden rounded-[36px] border border-[#ebe6dc] bg-white p-8 shadow-[0_36px_100px_-52px_rgba(80,58,33,0.20)] sm:p-12">
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -left-10 top-8 h-32 w-32 rounded-full bg-[#f7efe4] blur-3xl"
            animate={{ y: [0, -10, 0], opacity: [0.45, 0.65, 0.45] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -right-8 bottom-10 h-36 w-36 rounded-full bg-[#eef4eb] blur-3xl"
            animate={{ y: [0, 12, 0], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative mx-auto flex max-w-2xl flex-col items-center text-center">
            <img src="/acaro-logo.png" alt="ACARO - Asociación Café Robusta OBC" className="mb-8 h-28 w-auto" />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#eef4eb] text-[#306131] shadow-[0_18px_40px_-28px_rgba(48,97,49,0.55)]"
            >
              <CheckCircle2 className="h-10 w-10" />
            </motion.div>

            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-[#306131]">Encuesta enviada</p>
            <h1 className="text-4xl font-semibold tracking-tight text-[#2f241c] sm:text-5xl">
              Gracias por completar la encuesta
            </h1>
            <p className="mt-4 text-lg leading-8 text-[#7b6c5f]">
              Su información fue enviada correctamente. Puede cerrar esta página o regresar al listado de formularios disponibles.
            </p>

            <div className="mt-8 rounded-[28px] border border-[#ebe6dc] bg-[#fcfaf6] px-6 py-5 text-left text-sm leading-7 text-[#7b6c5f]">
              Sus respuestas se registraron al finalizar el formulario para mantener un flujo más limpio y consistente durante todo el proceso.
            </div>

            <Link
              to="/"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#306131] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#274f28]"
            >
              <Home className="h-4 w-4" />
              Volver al inicio
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
