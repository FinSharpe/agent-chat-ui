"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// The Web Speech API is not in TypeScript's DOM lib; only the parts used here.
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionCtor = new () => Recognition;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/**
 * Dictation into the composer through the browser's speech recognition.
 * `supported` stays false where the browser has none, and the mic is hidden
 * there rather than faked.
 *
 * Words are appended to whatever was already typed when listening started;
 * interim guesses show live and are replaced as the browser settles them.
 */
export function useSpeechDictation({
  value,
  onChange,
}: {
  value: string;
  onChange: (text: string) => void;
}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<Recognition | null>(null);
  const valueRef = useRef(value);
  valueRef.current = value;

  // Detected after mount: the server render cannot know the browser.
  useEffect(() => setSupported(!!getRecognitionCtor()), []);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  /**
   * Stop and drop anything still in flight. `stop()` delivers a last final
   * result after it is called, which would write the dictated text back into
   * a composer that a send has just cleared.
   */
  const cancel = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    recognition.onresult = null;
    recognition.abort();
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor || recognitionRef.current) return;

    const base = valueRef.current.trimEnd();
    const recognition = new Ctor();
    recognition.lang = navigator.language || "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;

    let settled = "";
    recognition.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const result = e.results[i];
        if (result.isFinal) settled += result[0].transcript;
        else interim += result[0].transcript;
      }
      const spoken = `${settled}${interim}`.trim();
      onChange(base && spoken ? `${base} ${spoken}` : base || spoken);
    };
    const finish = () => {
      recognitionRef.current = null;
      setListening(false);
    };
    recognition.onend = finish;
    recognition.onerror = finish;

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      finish();
    }
  }, [onChange]);

  const toggle = useCallback(
    () => (listening ? stop() : start()),
    [listening, start, stop],
  );

  return { supported, listening, start, stop, cancel, toggle };
}
