import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LoaderCircle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchPublishedSurveys } from '../services/surveyService';

type PublishedSurvey = {
  id: string;
  titulo: string;
  descripcion?: string | null;
  logo_url?: string | null;
};

export default function Index() {
  const [surveys, setSurveys] = useState<PublishedSurvey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    void loadSurveys();
  }, []);

  async function loadSurveys() {
    try {
      setLoading(true);
      const data = (await fetchPublishedSurveys()) as PublishedSurvey[];
      setSurveys(data);
      setError(undefined);
    } catch (e) {
      console.error(e);
      setError('No fue posible cargar las encuestas publicadas.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-stone-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="relative overflow-hidden rounded-[36px] border border-[#ebe6dc] bg-white shadow-[0_36px_100px_-52px_rgba(80,58,33,0.20)]">
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -left-16 top-10 h-40 w-40 rounded-full bg-[#f7efe4] blur-3xl"
            animate={{ y: [0, -12, 0], opacity: [0.55, 0.8, 0.55] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 bottom-8 h-52 w-52 rounded-full bg-[#eef4eb] blur-3xl"
            animate={{ y: [0, 16, 0], opacity: [0.4, 0.65, 0.4] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative px-6 pt-6 sm:px-10 sm:pt-8">
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 rounded-full bg-[#7a4a2a] shadow-sm" />
              <span className="h-4 w-4 rounded-full bg-[#b08f4b] shadow-sm" />
              <span className="h-4 w-4 rounded-full bg-[#306131] shadow-sm" />
            </div>
          </div>

          <div className="relative border-b border-[#f0eadf] px-6 pb-8 pt-4 sm:px-10 sm:pb-10 sm:pt-5">
            <div className="grid gap-8">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="min-w-0"
              >
                <div className="inline-flex items-center gap-2 rounded-full border border-[#e8dfd1] bg-[#fcfaf6] px-4 py-2 text-sm font-medium text-[#6e4f33]">
                  <ShieldCheck className="h-4 w-4 text-[#306131]" />
                  Plataforma de encuestas
                </div>

                <div className="mt-8 flex flex-col items-center text-center">
                  <img
                    src="/acaro-logo.png.png"
                    alt="ACARO"
                    className="h-36 w-auto object-contain sm:h-44 md:h-48"
                  />

                  <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-[#2f241c] sm:text-5xl">
                    Seleccione la encuesta a responder
                  </h1>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="relative px-6 py-6 sm:px-10 sm:py-8">
            {loading ? (
              <div className="flex items-center gap-3 rounded-[24px] border border-[#ebe6dc] bg-[#fcfaf6] px-5 py-5 text-[#7b6c5f]">
                <LoaderCircle className="h-5 w-5 animate-spin text-[#306131]" />
                Cargando encuestas publicadas...
              </div>
            ) : null}

            {error ? (
              <div className="rounded-[24px] border border-rose-200 bg-rose-50 px-5 py-5 text-rose-700">
                {error}
              </div>
            ) : null}

            {!loading && !error ? (
              <div className="grid gap-5">
                {surveys.length > 0 ? (
                  surveys.map((survey, surveyIndex) => (
                    <motion.div
                      key={survey.id}
                      initial={{ opacity: 0, y: 22 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: surveyIndex * 0.06 }}
                    >
                      <Link
                        to={`/encuesta/${survey.id}`}
                        className="group block rounded-[30px] border border-[#ebe6dc] bg-white p-5 transition duration-300 hover:-translate-y-1 hover:border-[#d9caa8] hover:shadow-[0_30px_70px_-48px_rgba(80,58,33,0.28)] sm:p-6"
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex min-w-0 items-start gap-4 sm:gap-5">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] border border-[#ebe6dc] bg-[#fffdfa] p-3 sm:h-24 sm:w-24">
                              <img
                                src={survey.logo_url && survey.logo_url.trim() ? survey.logo_url : '/acaro-logo.png.png'}
                                alt={`Logo de ${survey.titulo}`}
                                className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                                onError={(e) => {
                                  e.currentTarget.src = '/acaro-logo.png.png';
                                }}
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-[#efe3c6] bg-[#fcf4e1] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6e4f33]">
                                  Encuesta {surveyIndex + 1}
                                </span>
                                <span className="rounded-full border border-[#e7f0e2] bg-[#f6faf4] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#306131]">
                                  Lista para responder
                                </span>
                              </div>

                              <h2 className="mt-3 text-2xl font-semibold leading-tight text-[#2f241c]">
                                {survey.titulo}
                              </h2>

                              <p className="mt-3 max-w-3xl text-sm leading-7 text-[#7b6c5f]">
                                {survey.descripcion?.trim()
                                  ? survey.descripcion
                                  : 'Formulario disponible para registro y análisis de información.'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-4 lg:min-w-[210px] lg:flex-col lg:items-end">
                            <span className="inline-flex items-center gap-2 rounded-full bg-[#306131] px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-white transition duration-300 group-hover:bg-[#274f28] group-hover:shadow-[0_18px_40px_-25px_rgba(48,97,49,0.65)]">
                              Abrir encuesta
                              <ArrowRight className="h-4 w-4 transition duration-300 group-hover:translate-x-1" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <div className="rounded-[28px] border border-[#ebe6dc] bg-[#fcfaf6] px-5 py-8 text-center text-[#7b6c5f]">
                    No hay encuestas publicadas en este momento.
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
