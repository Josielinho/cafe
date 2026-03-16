import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, LoaderCircle } from 'lucide-react';
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
    <main className="min-h-screen px-4 py-8 text-stone-900 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[32px] border border-[#d8c9b5] bg-white/90 p-6 shadow-[0_30px_80px_-45px_rgba(78,52,38,0.35)] backdrop-blur sm:p-10">
          <div className="mx-auto max-w-3xl text-center">
            <img
              src="/acaro-logo.png"
              alt="ACARO - Asociación Café Robusta OBC"
              className="mx-auto mb-6 h-28 w-auto sm:h-36"
            />

            <div className="inline-flex items-center rounded-full border border-[#d5c0a0] bg-[#f4ecdf] px-4 py-2 text-sm font-medium text-[#2d5b3c]">
              Asociación Café Robusta OBC
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[#3e291f] sm:text-5xl">
              Formulario Disponible
            </h1>

            <p className="mt-4 text-lg leading-8 text-[#6f5849]">
              Seleccione la encuesta  correspondiente para iniciar el registro.
              
            </p>
          </div>

          {loading ? (
            <div className="mt-10 flex items-center gap-3 rounded-2xl border border-[#e2d7c8] bg-[#faf7f1] px-4 py-4 text-[#6f5849]">
              <LoaderCircle className="h-5 w-5 animate-spin text-[#2d5b3c]" />
              Cargando encuestas publicadas...
            </div>
          ) : null}

          {error ? (
            <div className="mt-10 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-rose-700">
              {error}
            </div>
          ) : null}

          {!loading && !error ? (
            <div className="mt-10 grid gap-5">
              {surveys.length > 0 ? (
                surveys.map((survey) => (
                  <Link
                    key={survey.id}
                    to={`/encuesta/${survey.id}`}
                    className="group rounded-[28px] border border-[#decebb] bg-[#fffdf9] p-5 transition hover:-translate-y-0.5 hover:border-[#cbb08a] hover:shadow-[0_24px_60px_-35px_rgba(78,52,38,0.30)] sm:p-6"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-start gap-4 sm:gap-6">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[#e2d7c8] bg-[#faf7f1] p-3 sm:h-24 sm:w-24">
                          <img
                            src={survey.logo_url || '/acaro-logo.png'}
                            alt={`Logo de ${survey.titulo}`}
                            className="h-full w-full object-contain"
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#8a725d]">
                            Encuesta publicada
                          </p>

                          <h2 className="mt-2 text-2xl font-semibold leading-tight text-[#3e291f]">
                            {survey.titulo}
                          </h2>

                          {survey.descripcion?.trim() ? (
                            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6f5849]">
                              {survey.descripcion}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <span className="inline-flex items-center gap-2 self-start rounded-2xl bg-[#2d5b3c] px-5 py-3 text-sm font-semibold text-white transition group-hover:bg-[#4c3428] sm:self-center">
                        Abrir encuesta
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-2xl border border-[#e2d7c8] bg-[#faf7f1] px-4 py-6 text-[#6f5849]">
                  No hay encuestas publicadas en este momento.
                </div>
              )}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
