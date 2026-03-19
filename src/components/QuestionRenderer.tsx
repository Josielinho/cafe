import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronRight, Circle, FileText, Hash, MessageSquareText, Phone } from 'lucide-react';
import type { AnswerValue, MultipleChoiceAnswer, SingleChoiceAnswer } from '../lib/surveyRules';

interface OpcionPregunta {
  id: string;
  valor_opcion: string;
  etiqueta_opcion: string;
  posicion: number;
  permite_texto_libre?: boolean;
}

interface Question {
  id: string;
  codigo_pregunta?: string;
  texto_pregunta: string;
  tipo_pregunta:
    | 'texto_corto'
    | 'texto_largo'
    | 'numero'
    | 'booleano'
    | 'opcion_unica'
    | 'opcion_multiple';
  opciones_pregunta?: OpcionPregunta[];
}

interface Props {
  question: Question;
  onAnswer: (value?: AnswerValue) => Promise<void> | void;
  initialValue?: AnswerValue;
  required?: boolean;
  continueLabel?: string;
  isSubmitting?: boolean;
}

const inputClassName =
  'w-full rounded-[22px] border border-[#e8e0d2] bg-white px-4 py-4 text-base text-[#2f241c] outline-none transition placeholder:text-[#a49586] focus:border-[#b08f4b] focus:ring-4 focus:ring-[#f2e6c8] disabled:cursor-not-allowed disabled:bg-[#faf8f4]';

const primaryButtonClassName =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[#306131] px-8 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[#274f28] disabled:cursor-not-allowed disabled:bg-[#c7c1b8] disabled:text-white shadow-[0_18px_35px_-22px_rgba(48,97,49,0.55)]';

const cardButtonBaseClassName =
  'w-full rounded-[22px] border px-4 py-4 text-left transition duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f2e6c8] disabled:cursor-not-allowed disabled:opacity-60';

function isPhoneQuestion(question: Question) {
  const code = (question.codigo_pregunta ?? '').toLowerCase();
  const text = question.texto_pregunta.toLowerCase();
  return code.includes('telefono') || code.includes('tel') || text.includes('teléfono') || text.includes('telefono');
}

function isAgeQuestion(question: Question) {
  const code = (question.codigo_pregunta ?? '').toLowerCase();
  const text = question.texto_pregunta.toLowerCase();
  return code.includes('edad') || text.includes('edad');
}

function formatPhoneValue(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

function getPhoneError(value: string) {
  if (!value.trim()) return 'El número de teléfono es obligatorio.';
  if (!/^\d{4}-\d{4}$/.test(value)) return 'Use el formato xxxx-xxxx.';
  return '';
}

function getAgeError(rawValue: string) {
  if (!rawValue.trim()) return 'La edad es obligatoria.';
  const value = Number(rawValue);
  if (!Number.isFinite(value)) return 'Ingrese una edad válida.';
  if (!Number.isInteger(value)) return 'La edad debe ser un número entero.';
  if (value < 0) return 'La edad no puede ser negativa.';
  if (value > 100) return 'La edad no puede ser mayor a 100 años.';
  return '';
}

function getSingleChoiceInitialValue(value?: AnswerValue) {
  if (value && typeof value === 'object' && 'type' in value && value.type === 'single_choice') {
    return value as SingleChoiceAnswer;
  }

  return undefined;
}

function getMultipleChoiceInitialValue(value?: AnswerValue) {
  if (value && typeof value === 'object' && 'type' in value && value.type === 'multiple_choice') {
    return value as MultipleChoiceAnswer;
  }

  return undefined;
}

export default function QuestionRenderer({
  question,
  onAnswer,
  initialValue,
  required = false,
  continueLabel = 'CONTINUAR',
  isSubmitting = false,
}: Props) {
  const [textValue, setTextValue] = useState('');
  const [longTextValue, setLongTextValue] = useState('');
  const [numberValue, setNumberValue] = useState('');
  const [selectedBoolean, setSelectedBoolean] = useState<boolean | null>(null);
  const [selectedSingleId, setSelectedSingleId] = useState<string>('');
  const [selectedMultiIds, setSelectedMultiIds] = useState<string[]>([]);
  const [freeTextByOptionId, setFreeTextByOptionId] = useState<Record<string, string>>({});

  useEffect(() => {
    setTextValue('');
    setLongTextValue('');
    setNumberValue('');
    setSelectedBoolean(null);
    setSelectedSingleId('');
    setSelectedMultiIds([]);
    setFreeTextByOptionId({});

    if (question.tipo_pregunta === 'texto_corto' && typeof initialValue === 'string') {
      setTextValue(initialValue);
    }

    if (question.tipo_pregunta === 'texto_largo' && typeof initialValue === 'string') {
      setLongTextValue(initialValue);
    }

    if (question.tipo_pregunta === 'numero' && typeof initialValue === 'number') {
      setNumberValue(String(initialValue));
    }

    if (question.tipo_pregunta === 'booleano' && typeof initialValue === 'boolean') {
      setSelectedBoolean(initialValue);
    }

    const singleChoice = getSingleChoiceInitialValue(initialValue);
    if (question.tipo_pregunta === 'opcion_unica' && singleChoice) {
      setSelectedSingleId(singleChoice.optionId);
      if (singleChoice.textFree) {
        setFreeTextByOptionId({ [singleChoice.optionId]: singleChoice.textFree });
      }
    }

    const multipleChoice = getMultipleChoiceInitialValue(initialValue);
    if (question.tipo_pregunta === 'opcion_multiple' && multipleChoice) {
      setSelectedMultiIds(multipleChoice.selections.map((selection) => selection.optionId));
      setFreeTextByOptionId(
        Object.fromEntries(
          multipleChoice.selections
            .filter((selection) => selection.textFree)
            .map((selection) => [selection.optionId, selection.textFree ?? ''])
        )
      );
    }
  }, [initialValue, question.id, question.tipo_pregunta]);

  const sortedOptions = useMemo(() => {
    return [...(question.opciones_pregunta ?? [])].sort((a, b) => a.posicion - b.posicion);
  }, [question.opciones_pregunta]);

  const phoneQuestion = isPhoneQuestion(question);
  const ageQuestion = isAgeQuestion(question);

  if (question.tipo_pregunta === 'booleano') {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: 'Sí', value: true },
            { label: 'No', value: false },
          ].map((option) => {
            const isSelected = selectedBoolean === option.value;

            return (
              <button
                key={option.label}
                type="button"
                disabled={isSubmitting}
                className={`${cardButtonBaseClassName} ${
                  isSelected
                    ? 'border-[#306131] bg-[#f5f9f3] shadow-[0_18px_35px_-28px_rgba(48,97,49,0.45)]'
                    : 'border-[#e8e0d2] bg-white hover:border-[#b08f4b] hover:bg-[#fcfaf5]'
                }`}
                onClick={() => setSelectedBoolean(option.value)}
              >
                <span className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${isSelected ? 'bg-[#306131] text-white' : 'bg-[#f4ecdf] text-[#6e4f33]'}`}>
                  <Check className="h-5 w-5" />
                </span>
                <span className="block text-lg font-semibold text-[#2f241c]">{option.label}</span>
                <span className="mt-1 block text-sm text-[#8f7f72]">Selecciona una opción para continuar.</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className={primaryButtonClassName}
          disabled={isSubmitting || (required && selectedBoolean === null)}
          onClick={() => onAnswer(selectedBoolean === null ? undefined : selectedBoolean)}
        >
          {isSubmitting ? 'ENVIANDO...' : continueLabel}
          {!isSubmitting ? <ChevronRight className="h-4 w-4" /> : null}
        </button>
      </div>
    );
  }

  if (question.tipo_pregunta === 'texto_corto') {
    const phoneError = phoneQuestion && (required || textValue.trim()) ? getPhoneError(textValue) : '';
    const textError = phoneQuestion ? phoneError : '';
    const disabled = isSubmitting || (!!textError || (required && !textValue.trim()));

    return (
      <div className="space-y-4">
        <div className="relative">
          {phoneQuestion ? (
            <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8f7f72]" />
          ) : (
            <FileText className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8f7f72]" />
          )}

          <input
            className={`${inputClassName} pl-12 ${textError ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : ''}`}
            placeholder={phoneQuestion ? 'Ejemplo: 6123-4567' : required ? 'Tu respuesta aquí...' : 'Tu respuesta aquí... (opcional)'}
            value={textValue}
            inputMode={phoneQuestion ? 'numeric' : 'text'}
            maxLength={phoneQuestion ? 9 : undefined}
            disabled={isSubmitting}
            onChange={(e) => {
              const nextValue = phoneQuestion ? formatPhoneValue(e.target.value) : e.target.value;
              setTextValue(nextValue);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !disabled) {
                void onAnswer(textValue.trim() ? textValue.trim() : undefined);
              }
            }}
          />
        </div>

        {textError ? <p className="text-sm text-rose-700">{textError}</p> : null}

        <button
          type="button"
          className={primaryButtonClassName}
          disabled={disabled}
          onClick={() => onAnswer(textValue.trim() ? textValue.trim() : undefined)}
        >
          {isSubmitting ? 'ENVIANDO...' : continueLabel}
          {!isSubmitting ? <ChevronRight className="h-4 w-4" /> : null}
        </button>
      </div>
    );
  }

  if (question.tipo_pregunta === 'texto_largo') {
    const disabled = isSubmitting || (required && !longTextValue.trim());

    return (
      <div className="space-y-4">
        <div className="relative">
          <MessageSquareText className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-[#8f7f72]" />
          <textarea
            className={`${inputClassName} min-h-36 resize-y pl-12`}
            placeholder={required ? 'Escribe tu respuesta' : 'Escribe tu respuesta (opcional)'}
            value={longTextValue}
            disabled={isSubmitting}
            onChange={(e) => setLongTextValue(e.target.value)}
          />
        </div>

        <button
          type="button"
          className={primaryButtonClassName}
          disabled={disabled}
          onClick={() => onAnswer(longTextValue.trim() ? longTextValue.trim() : undefined)}
        >
          {isSubmitting ? 'ENVIANDO...' : continueLabel}
          {!isSubmitting ? <ChevronRight className="h-4 w-4" /> : null}
        </button>
      </div>
    );
  }

  if (question.tipo_pregunta === 'numero') {
    const ageError = ageQuestion && (required || numberValue.trim()) ? getAgeError(numberValue) : '';
    const disabled = isSubmitting || !!ageError || (required && !numberValue.trim());

    return (
      <div className="space-y-4">
        <div className="relative">
          <Hash className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8f7f72]" />
          <input
            type="number"
            min={ageQuestion ? 0 : undefined}
            max={ageQuestion ? 100 : undefined}
            className={`${inputClassName} pl-12 ${ageError ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-100' : ''}`}
            placeholder={ageQuestion ? 'Ingrese su edad' : required ? 'Escribe un número' : 'Escribe un número (opcional)'}
            value={numberValue}
            disabled={isSubmitting}
            onChange={(e) => setNumberValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !disabled) {
                void onAnswer(numberValue.trim() ? Number(numberValue) : undefined);
              }
            }}
          />
        </div>

        {ageError ? <p className="text-sm text-rose-700">{ageError}</p> : null}

        <button
          type="button"
          className={primaryButtonClassName}
          disabled={disabled}
          onClick={() => onAnswer(numberValue.trim() ? Number(numberValue) : undefined)}
        >
          {isSubmitting ? 'ENVIANDO...' : continueLabel}
          {!isSubmitting ? <ChevronRight className="h-4 w-4" /> : null}
        </button>
      </div>
    );
  }

  if (question.tipo_pregunta === 'opcion_unica') {
    const selectedOption = sortedOptions.find((option) => option.id === selectedSingleId);
    const requiresFreeText = !!selectedOption?.permite_texto_libre;
    const freeText = selectedOption ? freeTextByOptionId[selectedOption.id] ?? '' : '';
    const disabled =
      isSubmitting ||
      (required && !selectedOption) ||
      (!!selectedOption && requiresFreeText && !freeText.trim());

    return (
      <div className="space-y-4">
        {sortedOptions.map((option) => {
          const isSelected = selectedSingleId === option.id;

          return (
            <div key={option.id} className="space-y-2">
              <button
                type="button"
                className={`${cardButtonBaseClassName} ${
                  isSelected
                    ? 'border-[#306131] bg-[#f5f9f3] ring-4 ring-[#edf4e8]'
                    : 'border-[#e8e0d2] bg-white hover:border-[#b08f4b] hover:bg-[#fcfaf5]'
                }`}
                disabled={isSubmitting}
                onClick={() => setSelectedSingleId(option.id)}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border ${
                      isSelected ? 'border-[#306131] bg-[#306131] text-white' : 'border-[#ccbca8] text-transparent'
                    }`}
                  >
                    <Circle className="h-2.5 w-2.5 fill-current" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-[#2f241c]">{option.etiqueta_opcion}</p>
                    {option.permite_texto_libre ? (
                      <p className="mt-1 text-sm text-[#8f7f72]">Requiere un detalle adicional.</p>
                    ) : null}
                  </div>
                </div>
              </button>

              {isSelected && option.permite_texto_libre ? (
                <input
                  className={inputClassName}
                  placeholder="Especifica tu respuesta"
                  value={freeTextByOptionId[option.id] ?? ''}
                  disabled={isSubmitting}
                  onChange={(e) =>
                    setFreeTextByOptionId((prev) => ({
                      ...prev,
                      [option.id]: e.target.value,
                    }))
                  }
                />
              ) : null}
            </div>
          );
        })}

        <button
          type="button"
          className={primaryButtonClassName}
          disabled={disabled}
          onClick={() =>
            onAnswer(
              selectedOption
                ? {
                    type: 'single_choice',
                    optionId: selectedOption.id,
                    value: selectedOption.valor_opcion,
                    textFree: selectedOption.permite_texto_libre ? freeText.trim() : undefined,
                  }
                : undefined
            )
          }
        >
          {isSubmitting ? 'ENVIANDO...' : continueLabel}
          {!isSubmitting ? <ChevronRight className="h-4 w-4" /> : null}
        </button>
      </div>
    );
  }

  if (question.tipo_pregunta === 'opcion_multiple') {
    const requiresMissingFreeText = sortedOptions.some(
      (option) =>
        selectedMultiIds.includes(option.id) && option.permite_texto_libre && !(freeTextByOptionId[option.id] ?? '').trim()
    );
    const disabled = isSubmitting || requiresMissingFreeText || (required && selectedMultiIds.length === 0);

    return (
      <div className="space-y-4">
        {sortedOptions.map((option) => {
          const isSelected = selectedMultiIds.includes(option.id);

          return (
            <div key={option.id} className="space-y-2">
              <button
                type="button"
                className={`${cardButtonBaseClassName} ${
                  isSelected
                    ? 'border-[#306131] bg-[#f5f9f3] ring-4 ring-[#edf4e8]'
                    : 'border-[#e8e0d2] bg-white hover:border-[#b08f4b] hover:bg-[#fcfaf5]'
                }`}
                disabled={isSubmitting}
                onClick={() => {
                  setSelectedMultiIds((prev) =>
                    prev.includes(option.id) ? prev.filter((id) => id !== option.id) : [...prev, option.id]
                  );
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border ${
                      isSelected ? 'border-[#306131] bg-[#306131] text-white' : 'border-[#ccbca8] bg-white text-transparent'
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <div>
                    <p className="text-base font-semibold text-[#2f241c]">{option.etiqueta_opcion}</p>
                    {option.permite_texto_libre ? (
                      <p className="mt-1 text-sm text-[#8f7f72]">Requiere un detalle adicional.</p>
                    ) : null}
                  </div>
                </div>
              </button>

              {isSelected && option.permite_texto_libre ? (
                <input
                  className={inputClassName}
                  placeholder="Especifica tu respuesta"
                  value={freeTextByOptionId[option.id] ?? ''}
                  disabled={isSubmitting}
                  onChange={(e) =>
                    setFreeTextByOptionId((prev) => ({
                      ...prev,
                      [option.id]: e.target.value,
                    }))
                  }
                />
              ) : null}
            </div>
          );
        })}

        <button
          type="button"
          className={primaryButtonClassName}
          disabled={disabled}
          onClick={() =>
            onAnswer(
              selectedMultiIds.length > 0
                ? {
                    type: 'multiple_choice',
                    selections: sortedOptions
                      .filter((option) => selectedMultiIds.includes(option.id))
                      .map((option) => ({
                        optionId: option.id,
                        value: option.valor_opcion,
                        textFree: option.permite_texto_libre
                          ? (freeTextByOptionId[option.id] ?? '').trim()
                          : undefined,
                      })),
                  }
                : undefined
            )
          }
        >
          {isSubmitting ? 'ENVIANDO...' : continueLabel}
          {!isSubmitting ? <ChevronRight className="h-4 w-4" /> : null}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
      Tipo de pregunta no soportado: {question.tipo_pregunta}
    </div>
  );
}
