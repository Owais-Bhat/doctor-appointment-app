"use client";

import { useMemo, useState } from "react";
import { Bot, CalendarPlus, Check, Loader2, Mic, MicOff, Send, Sparkles, Volume2 } from "lucide-react";

type SpeechRecognitionCtor = new () => SpeechRecognition;
type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

const quickCommands = [
  "Book Maya Rivera for a voice follow-up tomorrow at 9 AM",
  "Find a cardiology slot this week for a high risk patient",
  "Confirm James Okonkwo and attach the pre-op checklist",
];

export function MedFlowVoiceAssistant() {
  const [listening, setListening] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [booked, setBooked] = useState(false);
  const [result, setResult] = useState("Voice scheduling is ready. Dictate an appointment request or choose a command.");

  const speechSupported = useMemo(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  }, []);

  const synthesizeReply = (text: string) => {
    const lower = text.toLowerCase();
    const patient = ["Maya Rivera", "James Okonkwo", "David Klein", "Priya Shah"].find((name) =>
      lower.includes(name.toLowerCase().split(" ")[0])
    );
    const visitType = lower.includes("video") ? "video consultation" : lower.includes("voice") ? "voice consultation" : "clinic visit";
    const time = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s?(am|pm)\b/i)?.[0] || "the next optimized slot";
    return `Drafted ${visitType} for ${patient || "the patient"} at ${time}. Eligibility is clean, reminders are queued, and the clinician brief is attached.`;
  };

  const handleSubmit = (text = prompt) => {
    if (!text.trim()) return;
    setPrompt(text);
    setIsThinking(true);
    setBooked(false);
    window.setTimeout(() => {
      const reply = synthesizeReply(text);
      setResult(reply);
      setBooked(true);
      setIsThinking(false);
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(reply);
        utterance.rate = 0.94;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    }, 700);
  };

  const toggleListening = () => {
    if (!speechSupported) {
      setResult("Voice recognition is not available in this browser. Text commands still work.");
      return;
    }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || "";
      setPrompt(transcript);
      handleSubmit(transcript);
    };
    recognition.onend = () => setListening(false);
    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      setListening(true);
      recognition.start();
    }
  };

  return (
    <section className="glass" style={{ padding: 22 }}>
      <div className="row between" style={{ marginBottom: 14 }}>
        <div className="row gap-3">
          <div style={{ color: "var(--accent)" }}>
            <Bot size={20} />
          </div>
          <div>
            <div className="eyebrow">AI voice desk</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Appointment command</div>
          </div>
        </div>
        <span className="pill good">
          <Sparkles size={11} /> Live
        </span>
      </div>

      <div className="search" style={{ padding: "8px 8px 8px 12px" }}>
        <button
          type="button"
          onClick={toggleListening}
          className="icon-btn"
          aria-label={listening ? "Stop voice recognition" : "Start voice recognition"}
          style={{
            width: 34,
            height: 34,
            color: listening ? "var(--bad)" : "var(--accent)",
          }}
        >
          {listening ? <MicOff size={15} /> : <Mic size={15} />}
        </button>
        <input
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSubmit();
          }}
          placeholder="Say: book a voice follow-up tomorrow at 9 AM"
          style={{ fontSize: 13 }}
        />
        <button type="button" onClick={() => handleSubmit()} className="btn btn-primary btn-sm" aria-label="Send appointment command">
          {isThinking ? <Loader2 className="animate-spin" size={13} /> : <Send size={13} />}
        </button>
      </div>

      <div className="col gap-2" style={{ marginTop: 12 }}>
        {quickCommands.map((command) => (
          <button key={command} type="button" onClick={() => handleSubmit(command)} className="pill" style={{ justifyContent: "flex-start", width: "100%" }}>
            <CalendarPlus size={12} style={{ color: "var(--accent)" }} />
            {command}
          </button>
        ))}
      </div>

      <div className="glass-strong" style={{ padding: 14, marginTop: 14 }}>
        <div className="row gap-2" style={{ marginBottom: 6 }}>
          {booked ? <Check size={14} style={{ color: "var(--good)" }} /> : <Volume2 size={14} style={{ color: "var(--accent)" }} />}
          <div className="eyebrow">Assistant output</div>
        </div>
        <p className="small" style={{ margin: 0 }}>{result}</p>
      </div>
    </section>
  );
}
