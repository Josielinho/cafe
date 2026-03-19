import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CircleAlert, LoaderCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchSurvey } from '../services/surveyService';
import { submitSurveyResponse } from '../services/responseService';
import QuestionRenderer from './QuestionRenderer';
import ProgressBar from './ProgressBar';
import ThankYouScreen from './ThankYouScreen';
import { type AnswerValue, isQuestionRequired, isQuestionVisible } from '../lib/surveyRules';

type SurveyQuestion = {
  id: string;
  codigo_pregunta: string;
  texto_pregunta: string;
  tipo_pregunta:
    | 'texto_corto'
    | 'texto_largo'
    | 'numero'
    | 'booleano'
    | 'opcion_unica'
    | 'opcion_multiple';
  posicion: number;
  es_obligatoria: boolean;
  reglas_validacion?: Record<string, unknown> | null;
  seccion_titulo?: string;
  opciones_pregunta?: Array<{
    id: string;
    valor_opcion: string;
    etiqueta_opcion: string;
    posicion: number;
    permite_texto_libre?: boolean;
  }>;
};

type SurveyData = {
  titulo?: string | null;
  descripcion?: string | null;
  logo_url?: string | null;
  secciones_encuesta: Array<{
    titulo: string;
    posicion: number;
    preguntas_encuesta: SurveyQuestion[];
  }>;
};

const FALLBACK_SURVEY_ID = import.meta.env.VITE_DEFAULT_SURVEY_ID as string | undefined;

function cleanQuestionText(text: string) {
  return text.replace(/^\s*\d+[.)-]?\s*/, '').replace(/\s*:+\s*$/, ':').trim();
}

function isEmptyAnswer(value?: AnswerValue) {
  if (typeof value === 'undefined') return true;
  if (typeof value === 'string') return !value.trim();
  if (typeof value === 'number') return Number.isNaN(value);
  if (typeof value === 'boolean') return false;

  if (typeof value === 'object' && value !== null && 'type' in value) {
    if (value.type === 'single_choice') return !value.optionId;
    if (value.type === 'multiple_choice') return value.selections.length === 0;
  }

  return true;
}

function pruneHiddenAnswers(
  surveyQuestions: SurveyQuestion[],
  answers: Record<string, AnswerValue | undefined>
): Record<string, AnswerValue | undefined> {
  const visibleCodes = new Set(
    surveyQuestions.filter((question) => isQuestionVisible(question, answers)).map((question) => question.codigo_pregunta)
  );

  return Object.fromEntries(Object.entries(answers).filter(([code]) => visibleCodes.has(code)));
}

export default function SurveyContainer() {
  const { id: routeSurveyId } = useParams();
  const surveyId = routeSurveyId ?? FALLBACK_SURVEY_ID;

  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyDescription, setSurveyDescription] = useState('');
  const [surveyLogo, setSurveyLogo] = useState<string>('/acaro-logo.png');
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [answersByCode, setAnswersByCode] = useState<Record<string, AnswerValue | undefined>>({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [done, setDone] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  const visibleQuestions = useMemo(() => {
    return questions.filter((question) => isQuestionVisible(question, answersByCode));
  }, [questions, answersByCode]);

  useEffect(() => {
    void loadSurvey();
  }, [surveyId]);

  useEffect(() => {
    if (index >= visibleQuestions.length && visibleQuestions.length > 0) {
      setIndex(visibleQuestions.length - 1);
    }
  }, [index, visibleQuestions.length]);

  async function loadSurvey() {
    if (!surveyId) {
      setError('No se encontró un identificador de encuesta. Abre la encuesta desde la lista principal.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(undefined);
      setSaveError(undefined);
      setDone(false);
      setAnswersByCode({});
      setIndex(0);

      const data = (await fetchSurvey(surveyId)) as SurveyData;
      const flat = data.secciones_encuesta
        .sort((a, b) => a.posicion - b.posicion)
        .flatMap((section) =>
          [...section.preguntas_encuesta]
            .sort((a, b) => a.posicion - b.posicion)
            .map((question) => ({ ...question, seccion_titulo: section.titulo }))
        );

      setSurveyTitle(data.titulo ?? 'Encuesta');
      setSurveyDescription(data.descripcion ?? '');
      setSurveyLogo(data.logo_url || '/acaro-logo.png');
      setQuestions(flat);
    } catch (e) {
      console.error(e);
      setError('No fue posible cargar la encuesta. Verifica la conexión y vuelve a intentarlo.');
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswers(finalAnswers: Record<string, AnswerValue | undefined>) {
    if (!surveyId) {
      setSaveError('No se encontró el identificador de la encuesta.');
      return;
    }

    const finalVisibleQuestions = questions.filter((question) => isQuestionVisible(question, finalAnswers));
    const answersToSave = finalVisibleQuestions.flatMap((question) => {
      const value = finalAnswers[question.codigo_pregunta];
      const required = isQuestionRequired(question, finalAnswers);

      if (required && isEmptyAnswer(value)) {
        throw new Error('Hay preguntas obligatorias sin responder.');
      }

      if (isEmptyAnswer(value)) return [];
      return [{ preguntaId: question.id, value }];
    });

    try {
      setIsSaving(true);
      setSaveError(undefined);
      await submitSurveyResponse(surveyId, answersToSave);
      setDone(true);
    } catch (e) {
      console.error(e);
      setSaveError('No se pudo enviar la encuesta. Verifica la conexión e intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  }

  async function answer(value?: AnswerValue) {
    const q = visibleQuestions[index];
    if (!q || isSaving) return;

    const required = isQuestionRequired(q, answersByCode);
    if (required && isEmptyAnswer(value)) {
      setSaveError('Esta pregunta es obligatoria antes de continuar.');
      return;
    }

    const draftAnswers = { ...answersByCode, [q.codigo_pregunta]: value };
    if (typeof value === 'undefined') delete draftAnswers[q.codigo_pregunta];

    const nextAnswers = pruneHiddenAnswers(questions, draftAnswers);
    const nextVisibleQuestions = questions.filter((question) => isQuestionVisible(question, nextAnswers));
    const currentVisibleIndex = nextVisibleQuestions.findIndex((question) => question.id === q.id);
    const nextIndex = currentVisibleIndex + 1;

    setSaveError(undefined);
    setAnswersByCode(nextAnswers);

    if (nextIndex >= nextVisibleQuestions.length) {
      await submitAnswers(nextAnswers);
      return;
    }

    setIndex(nextIndex);
  }

  function goToPreviousQuestion() {
    if (index === 0 || isSaving) return;
    setSaveError(undefined);
    setIndex((currentIndex) => Math.max(0, currentIndex - 1));
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-6">
        <div className="flex items-center gap-3 rounded-[26px] border border-[#ebe6dc] bg-white px-6 py-4 text-[#7b6c5f] shadow-[0_22px_55px_-40px_rgba(80,58,33,0.25)]">
          <LoaderCircle className="h-5 w-5 animate-spin text-[#306131]" />
          Cargando formulario...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-6">
        <section className="w-full max-w-md rounded-[32px] border border-rose-200 bg-white p-8 shadow-[0_22px_55px_-40px_rgba(80,58,33,0.25)]">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <CircleAlert className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-[#2f241c]">No se pudo abrir la encuesta</h1>
              <p className="mt-2 text-sm text-[#7b6c5f]">{error}</p>
              <Link to="/" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#306131] hover:text-[#274f28]">
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (done || visibleQuestions.length === 0) return <ThankYouScreen />;

  const q = visibleQuestions[index] ?? visibleQuestions[0];
  const currentPosition = visibleQuestions.findIndex((question) => question.id === q.id) + 1;
  const currentSection = q.seccion_titulo ?? 'Sección actual';
  const progressLabel = `Paso ${currentPosition} de ${visibleQuestions.length}`;
  const currentAnswer = answersByCode[q.codigo_pregunta];
  const continueLabel = currentPosition === visibleQuestions.length ? 'ENVIAR ENCUESTA' : 'CONTINUAR';
  const isRequired = isQuestionRequired(q, answersByCode);

  return (
    <main className="min-h-screen bg-white px-4 py-6 text-[#2f241c] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#e8e0d2] bg-white px-4 py-2 text-sm font-medium text-[#6e4f33] transition hover:border-[#d9caa8] hover:text-[#2f241c]"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al listado
          </Link>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 rounded-full border border-[#e8e0d2] bg-white px-3 py-2 text-sm font-medium text-[#7b6c5f] shadow-sm"
          >
            <img src={surveyLogo} alt="Logo" className="h-8 w-auto" />
            <span className="hidden sm:inline">Encuesta</span>
          </motion.div>
        </div>

        <section className="relative overflow-hidden rounded-[36px] border border-[#ebe6dc] bg-white shadow-[0_36px_100px_-52px_rgba(80,58,33,0.20)]">
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute -top-16 right-0 h-40 w-40 rounded-full bg-[#f7efe4] blur-3xl"
            animate={{ y: [0, 12, 0], opacity: [0.4, 0.65, 0.4] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-44 h-36 w-36 rounded-full bg-[#eef4eb] blur-3xl"
            animate={{ y: [0, -14, 0], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative px-6 pt-6 sm:px-8 sm:pt-8">
            <div className="flex items-center gap-3">
              <span className="h-4 w-4 rounded-full bg-[#7a4a2a] shadow-sm" />
              <span className="h-4 w-4 rounded-full bg-[#b08f4b] shadow-sm" />
              <span className="h-4 w-4 rounded-full bg-[#306131] shadow-sm" />
            </div>
          </div>

          <div className="relative border-b border-[#f0eadf] px-6 pb-6 pt-4 sm:px-8 sm:pb-8 sm:pt-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#efe3c6] bg-[#fcf4e1] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6e4f33]">
                    {progressLabel}
                  </span>
                  <span className="rounded-full border border-[#e7f0e2] bg-[#f6faf4] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#306131]">
                    {currentSection}
                  </span>
                </div>

                <div className="mt-5 flex items-center gap-4">
                  <img src={surveyLogo} alt={surveyTitle} className="h-16 w-auto sm:h-20" />
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight text-[#2f241c] sm:text-4xl">{surveyTitle}</h1>
                    <p className="mt-2 max-w-2xl text-base leading-7 text-[#7b6c5f]">
                      {surveyDescription?.trim()
                        ? surveyDescription
                        : 'Complete el formulario siguiendo el orden de las preguntas. Sus respuestas se enviarán al finalizar.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="mt-6">
              <ProgressBar current={currentPosition} total={visibleQuestions.length} label="Avance de la encuesta" />
            </div>
          </div>

          <div className="relative px-6 py-6 sm:px-8 sm:py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 }}
              className="rounded-[32px] border border-[#ebe6dc] bg-[#fffdfa] p-6 shadow-[0_24px_70px_-50px_rgba(80,58,33,0.22)] sm:p-8 md:p-10"
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-[#e8e0d2] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7b6c5f]">
                  {currentSection}
                </span>
                <span className="rounded-full border border-[#efe3c6] bg-[#fcf4e1] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6e4f33]">
                  Pregunta {currentPosition}
                </span>
                {isRequired ? (
                  <span className="rounded-full border border-[#e7f0e2] bg-[#f6faf4] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#306131]">
                    Obligatoria
                  </span>
                ) : (
                  <span className="rounded-full border border-[#f0eadf] bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8f7f72]">
                    Opcional
                  </span>
                )}
              </div>

              <h2 className="mt-6 text-3xl font-black uppercase leading-tight tracking-[-0.03em] text-[#1f1820] sm:text-4xl md:text-5xl">
                {cleanQuestionText(q.texto_pregunta)}
              </h2>

              {saveError ? (
                <div className="mt-6 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {saveError}
                </div>
              ) : null}

              <div className="mt-8 space-y-6">
                <QuestionRenderer
                  key={q.id}
                  question={q}
                  initialValue={currentAnswer}
                  required={isRequired}
                  continueLabel={continueLabel}
                  onAnswer={answer}
                  isSubmitting={isSaving}
                />

                <div className="flex flex-col gap-3 border-t border-[#f0eadf] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={goToPreviousQuestion}
                    disabled={index === 0 || isSaving}
                    className="inline-flex items-center justify-center rounded-full border border-[#e8e0d2] bg-white px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[#6e4f33] transition hover:-translate-y-0.5 hover:border-[#d9caa8] hover:text-[#2f241c] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Anterior
                  </button>

                  <p className="text-sm leading-6 text-[#8f7f72] sm:text-right">
                    {currentPosition === visibleQuestions.length
                      ? isSaving
                        ? 'Enviando respuestas...'
                        : 'Al continuar, la encuesta se enviará con todas las respuestas registradas.'
                      : 'Continúe hasta el final para enviar el formulario completo.'}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </main>
  );
}