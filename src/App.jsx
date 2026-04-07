import { useState, useEffect, useRef } from "react";

// ─── Color system ──────────────────────────────────────────────────────────────
const C = {
  navy:    "#0d1f6e",
  bg:      "#edf0f6",
  white:   "#ffffff",
  gray1:   "#f5f6fa",
  gray2:   "#e8eaf0",
  gray3:   "#b0b8cc",
  textPri: "#0d1b4b",
  textSec: "#6b7490",
  accent:  "#3a7bd5",
  ako:     "#f5a623",
  akoGlow: "rgba(245,166,35,0.22)",
  dim:     "rgba(13,19,60,0.78)",
  red:     "#e74c3c",
  green:   "#27ae60",
};

// ─── Guided flow definitions ───────────────────────────────────────────────────
const FLOWS = {
  estado: [
    {
      screen: "detail", hl: "balanceCards",
      tip: "Aquí ves dos datos clave: cuánto debes pagar en tu próximo estado de cuenta y tu deuda total. Muy útil para planificar.",
    },
    {
      screen: "detail", hl: "estadoAtajo",
      tip: "Este atajo de «Estado de cuenta» también te lleva directo al detalle completo de tu tarjeta en cualquier momento.",
    },
    {
      screen: "detail", hl: null,
      tip: "¡Lo lograste! Ya sabes ver tu estado de cuenta sin llamar al banco ni ir a una oficina.", done: true,
    },
  ],
  diferidos: [
    {
      screen: "detail", hl: "consumosTab",
      tip: "En la pestaña «Consumos» ves todos tus gastos recientes organizados por fecha. Puedes buscar cualquier compra.",
    },
    {
      screen: "detail", hl: "diferidosTab", switchTab: "diferidos",
      tip: "Toca «Diferidos» para ver todas tus compras en cuotas: cuánto llevas pagado y cuánto te falta. ¡Sin llamar al banco!",
    },
    {
      screen: "detail", hl: null,
      tip: "¡Muy bien! Ya puedes revisar tus diferidos sola. Recuerda: esta información siempre está aquí, disponible para ti.", done: true,
    },
  ],
  transferencia: [
    {
      screen: "home", hl: "transferBtn",
      tip: "Para hacer una transferencia, toca «Pagar con transferencia» en tus atajos principales. ¡Te acompañaré en cada paso!",
      assistedNext: true,
    },
    {
      screen: "transfer", hl: "cuentaField",
      tip: "Ingresa el número de cuenta de la persona a la que quieres transferir.",
      fieldFocus: "cuenta",
    },
    {
      screen: "transfer", hl: "montoField",
      tip: "Ingresa el valor a transferir.",
      fieldFocus: "monto",
    },
    {
      screen: "transfer", hl: "confirmPanel",
      tip: "Revisa bien los datos: nombre del destinatario, banco y monto. Si todo está correcto, toca «Confirmar transferencia».",
      fieldFocus: "confirm",
    },
    {
      screen: "transfer", hl: null,
      tip: "¡Transferencia completada! Lo hiciste perfectamente. Recuerda siempre verificar los datos antes de confirmar.", done: true,
      fieldFocus: "done",
    },
  ],
};

// ─── TTS ──────────────────────────────────────────────────────────────────────
function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "es-EC"; u.rate = 0.88; u.pitch = 1.05;
  const voices = window.speechSynthesis.getVoices();
  const v = voices.find(v => v.lang.startsWith("es")) || null;
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}
const stopVoice = () => window.speechSynthesis?.cancel();

// ─── Typewriter hook ───────────────────────────────────────────────────────────
function useTypewriter(text) {
  const [display, setDisplay] = useState("");
  const [done, setDone]       = useState(false);
  useEffect(() => {
    setDisplay(""); setDone(false);
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i++; setDisplay(text.slice(0, i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, 17);
    return () => clearInterval(id);
  }, [text]);
  return { display, done };
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const consumos = [
  { date: "30 marzo",  name: "Supermaxi",       sub: "Supermercados",   amt: -38.50, icon: "🛒" },
  { date: "30 marzo",  name: "Uber Eats",        sub: "Comida y bebida", amt: -12.90, icon: "🍔" },
  { date: "27 marzo",  name: "Netflix",           sub: "Entretenimiento", amt: -15.99, icon: "🎬" },
  { date: "27 marzo",  name: "Farmacia Fybeca",  sub: "Salud",           amt: -22.30, icon: "💊" },
];
const diferidos = [
  { name: "iPhone 15 — Movistar",     total: 12, paid: 4,  amt: 54.17,  icon: "📱" },
  { name: "Electrodomésticos — KiWi", total:  6, paid: 2,  amt: 45.00,  icon: "🏠" },
  { name: "Viaje — Copa Airlines",    total:  3, paid: 1,  amt: 120.00, icon: "✈️" },
];

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  const bg = toast.type === "success" ? C.green : toast.type === "error" ? C.red : C.accent;
  return (
    <div style={{
      position: "absolute", top: 54, left: 14, right: 14, zIndex: 110,
      background: bg, borderRadius: 12, padding: "11px 16px",
      color: "#fff", fontSize: 13, fontWeight: 600,
      textAlign: "center",
      boxShadow: "0 6px 28px rgba(0,0,0,0.32)",
      animation: "slideDown 0.28s ease",
      pointerEvents: "none",
    }}>
      {toast.msg}
    </div>
  );
}

// ─── TappableItem — handles press-scale micro-interaction ─────────────────────
function TappableItem({ children, onClick, style, scale = 0.93, disabled = false }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      style={{
        transform: pressed && !disabled ? `scale(${scale})` : "scale(1)",
        transition: "transform 0.12s ease",
        cursor: disabled ? "default" : "pointer",
        ...style,
      }}
      onPointerDown={() => { if (!disabled) setPressed(true); }}
      onPointerUp={() => { setPressed(false); if (!disabled) onClick?.(); }}
      onPointerLeave={() => setPressed(false)}
    >
      {children}
    </div>
  );
}

// ─── Para Ti Screen ───────────────────────────────────────────────────────────
function ParaTiScreen({ onBack, onNav, activeNav }) {
  const products = [
    {
      icon: "💰",
      title: "Préstamo Personal Diners",
      desc: "Hasta $50,000 con tasas preferenciales para socios Diners Club Ecuador.",
      tag: "12.5% anual",
      tagColor: C.accent,
      cta: "Solicitar ahora",
    },
    {
      icon: "🛡️",
      title: "Seguro de Vida Plus",
      desc: "Protege a tu familia con cobertura de hasta $200,000. Incluye asistencia médica.",
      tag: "Desde $15.99/mes",
      tagColor: C.green,
      cta: "Ver detalles",
    },
    {
      icon: "✈️",
      title: "Millas Diners Club",
      desc: "Viaja más por menos. Acumula millas en cada compra y canjéalas por vuelos.",
      tag: "12,400 millas disponibles",
      tagColor: C.ako,
      cta: "Canjear millas",
    },
  ];

  return (
    <div style={{ background: C.bg, minHeight: 670, paddingBottom: 80 }}>
      <StatusBar />
      <div style={{
        background: C.white, padding: "8px 18px 12px",
        display: "flex", alignItems: "center", gap: 10,
        borderBottom: `1px solid ${C.gray2}`,
      }}>
        <TappableItem onClick={onBack} style={{ padding: "2px 4px" }}>
          <span style={{ fontSize: 20, color: C.navy, lineHeight: 1 }}>←</span>
        </TappableItem>
        <div style={{ flex: 1, textAlign: "center" }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.textPri }}>Para ti</span>
        </div>
        <div style={{ width: 28 }} />
      </div>

      <div style={{ padding: "16px 14px 0" }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: C.textPri, marginBottom: 4 }}>
            Pensado para usted
          </div>
          <div style={{ fontSize: 12, color: C.textSec, lineHeight: 1.6 }}>
            Productos Diners Club seleccionados según su perfil de cliente.
          </div>
        </div>

        {products.map((p, i) => (
          <TappableItem key={i} scale={0.98} style={{
            background: C.white, borderRadius: 16, padding: 16,
            marginBottom: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{
                width: 46, height: 46, borderRadius: 14,
                background: C.gray1, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22,
              }}>{p.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.textPri, marginBottom: 4 }}>
                  {p.title}
                </div>
                <div style={{ fontSize: 11, color: C.textSec, lineHeight: 1.55 }}>
                  {p.desc}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{
                fontSize: 10, fontWeight: 700, color: p.tagColor,
                background: `${p.tagColor}18`,
                padding: "3px 9px", borderRadius: 20,
              }}>{p.tag}</span>
              <div style={{
                background: C.navy, borderRadius: 10, padding: "7px 14px",
                color: C.white, fontSize: 11, fontWeight: 700,
              }}>{p.cta}</div>
            </div>
          </TappableItem>
        ))}

        <div style={{
          background: `${C.ako}14`, border: `1.5px solid ${C.ako}44`,
          borderRadius: 14, padding: "12px 16px",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <AkoBadge size={32} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.textPri, marginBottom: 2 }}>
              ¿Quiere saber más?
            </div>
            <div style={{ fontSize: 11, color: C.textSec, lineHeight: 1.5 }}>
              AKO puede explicarle cada producto con calma.
            </div>
          </div>
        </div>
      </div>
      <BottomNav active={activeNav} onNav={onNav} />
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [appScreen,     setAppScreen]     = useState("home"); // "home"|"detail"|"transfer"|"parati"
  const [overlay,       setOverlay]       = useState(null);
  const [flow,          setFlow]          = useState(null);
  const [step,          setStep]          = useState(0);
  const [tab,           setTab]           = useState("consumos");
  const [voiceOn,       setVoiceOn]       = useState(false);
  const [fade,          setFade]          = useState(true);
  const [cuenta,        setCuenta]        = useState("");
  const [monto,         setMonto]         = useState("");
  const [transferDone,  setTransferDone]  = useState(false);
  const [toast,         setToast]         = useState(null);
  const [completedFlows, setCompletedFlows] = useState(new Set());
  const [akoPulse,      setAkoPulse]      = useState(false);
  const [nextShake,     setNextShake]     = useState(false);

  const toastTimer   = useRef(null);
  const akoIdleTimer = useRef(null);

  // ── Toast helper ──
  const showToast = (msg, type = "info", duration = 3500) => {
    setToast({ msg, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), duration);
  };

  // ── AKO idle pulse (5s on home with no overlay) ──
  useEffect(() => {
    setAkoPulse(false);
    clearTimeout(akoIdleTimer.current);
    if (appScreen === "home" && overlay === null) {
      akoIdleTimer.current = setTimeout(() => setAkoPulse(true), 5000);
    }
    return () => clearTimeout(akoIdleTimer.current);
  }, [appScreen, overlay]);

  // ── Guided flow state ──
  const steps   = flow ? FLOWS[flow] : [];
  const current = steps[step] || null;
  const tipText = current?.tip ?? "";
  const hl      = current?.hl;

  const { display, done: typeDone } = useTypewriter(tipText);

  useEffect(() => {
    if (typeDone && voiceOn && tipText) speak(tipText);
  }, [typeDone, voiceOn, tipText]);

  useEffect(() => {
    if (!current) return;
    if (current.screen === "detail"   && appScreen !== "detail")   transition(() => setAppScreen("detail"));
    if (current.screen === "home"     && appScreen !== "home")     transition(() => setAppScreen("home"));
    if (current.screen === "transfer" && appScreen !== "transfer") transition(() => setAppScreen("transfer"));
    if (current.switchTab) setTab(current.switchTab);
  }, [step, flow]);

  const transition = (fn) => {
    setFade(false);
    setTimeout(() => { fn(); setFade(true); }, 220);
  };

  const navigate = (screen) => {
    if (overlay) return;
    transition(() => setAppScreen(screen));
  };

  const openMenu = () => {
    setAkoPulse(false);
    clearTimeout(akoIdleTimer.current);
    stopVoice();
    setOverlay("menu");
  };

  const startFlow = (f) => {
    stopVoice();
    setCuenta(""); setMonto(""); setTransferDone(false);
    setFlow(f); setStep(0); setTab("consumos");
    setOverlay("guided");
  };

  const goNext = () => {
    if (!typeDone) {
      setNextShake(true);
      setTimeout(() => setNextShake(false), 500);
      return;
    }
    stopVoice();

    // Finishing the flow
    if (current?.done || step >= steps.length - 1) {
      setCompletedFlows(prev => new Set([...prev, flow]));
      setOverlay(null); setFlow(null); setStep(0); setTransferDone(false);
      transition(() => setAppScreen("home"));
      setTimeout(() => showToast("Puedes volver a AKO cuando quieras 💙", "info"), 280);
      return;
    }

    // About to show transfer "done" step → fire success toast
    const nextStep = steps[step + 1];
    if (flow === "transferencia" && nextStep?.done) {
      const amt = monto ? parseFloat(monto).toFixed(2) : "50.00";
      showToast(`¡Transferencia de $${amt} enviada a Rosa Elena! ✓`, "success");
      setTransferDone(true);
    }

    if (current?.assistedNext) {
      transition(() => setAppScreen("transfer"));
    }
    setStep(s => s + 1);
  };

  const exitGuide = () => {
    stopVoice();
    setOverlay(null); setFlow(null); setStep(0); setTransferDone(false);
    transition(() => setAppScreen("home"));
    setTimeout(() => showToast("Puedes volver a AKO cuando quieras 💙", "info"), 280);
  };

  const toggleVoice = () => {
    if (voiceOn) { stopVoice(); setVoiceOn(false); }
    else { setVoiceOn(true); if (typeDone && tipText) speak(tipText); }
  };

  const hlStyle = (id) => hl === id ? {
    position:  "relative",
    zIndex:    50,
    outline:   `2.5px solid ${C.ako}`,
    outlineOffset: 3,
    boxShadow: `0 0 0 7px ${C.akoGlow}`,
    borderRadius: 14,
    animation: "akoHl 1.4s ease-in-out infinite",
  } : {};

  const TOOLTIP_POS = {
    balanceCards: "38%",
    estadoAtajo:  "14%",
    consumosTab:  "14%",
    diferidosTab: "14%",
    transferBtn:  "14%",
    akoCard:      "14%",
  };
  const tooltipTop = current?.screen === "transfer"
    ? "8%"
    : hl ? (TOOLTIP_POS[hl] ?? "18%") : "28%";

  const activeNav = appScreen === "home" ? "inicio"
    : appScreen === "detail" ? "pagos"
    : appScreen === "parati" ? "parati"
    : null;

  const handleNav = (id) => {
    if (overlay) return;
    const map = { inicio: "home", pagos: "detail", parati: "parati" };
    if (map[id]) transition(() => setAppScreen(map[id]));
  };

  // When standalone transfer confirms
  const handleStandaloneComplete = (amt) => {
    showToast(`¡Transferencia de $${amt} enviada a Rosa Elena! ✓`, "success");
    setCompletedFlows(prev => new Set([...prev, "transferencia"]));
  };

  // Guided confirm button in confirm panel → advance step
  const handleGuidedConfirm = () => {
    if (overlay === "guided" && current?.fieldFocus === "confirm") goNext();
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(150deg, #07122e 0%, #152260 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "16px 14px 24px", gap: 16,
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <AkoBadge size={26} />
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>AKOlite</span>
        <span style={{
          background: "rgba(245,166,35,0.18)", color: C.ako,
          fontSize: 10, padding: "2px 9px", borderRadius: 20,
        }}>integrado en Blu · Diners Club</span>
      </div>

      {/* Phone shell */}
      <div style={{
        width: "100%", maxWidth: 345,
        borderRadius: 42,
        border: "2.5px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
        background: C.bg,
        boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
        minHeight: 670,
        position: "relative",
        opacity: fade ? 1 : 0,
        transition: "opacity 0.22s ease",
      }}>
        <Toast toast={toast} />

        {appScreen === "home" && (
          <HomeScreen
            hlStyle={hlStyle}
            onModoGuiado={openMenu}
            onGoDetail={() => navigate("detail")}
            onTransfer={() => { setCuenta(""); setMonto(""); setTransferDone(false); navigate("transfer"); }}
            onConócelos={() => showToast("¡Próximamente disponible en Blu! Te notificaremos pronto.", "info")}
            onNav={handleNav}
            activeNav={activeNav}
            akoPulse={akoPulse}
            completedFlows={completedFlows}
          />
        )}

        {appScreen === "detail" && (
          <DetailScreen
            hlStyle={hlStyle}
            tab={tab}
            setTab={setTab}
            onBack={() => navigate("home")}
            onNav={handleNav}
            activeNav={activeNav}
          />
        )}

        {appScreen === "transfer" && (
          <TransferScreen
            hlStyle={hlStyle}
            fieldFocus={current?.fieldFocus}
            cuenta={cuenta}        setCuenta={setCuenta}
            monto={monto}          setMonto={setMonto}
            transferDone={transferDone}
            onBack={() => {
              if (overlay === "guided") exitGuide();
              else transition(() => setAppScreen("home"));
            }}
            onStandaloneComplete={handleStandaloneComplete}
            onGuidedConfirm={handleGuidedConfirm}
            isGuided={overlay === "guided"}
          />
        )}

        {appScreen === "parati" && (
          <ParaTiScreen onBack={() => navigate("home")} onNav={handleNav} activeNav={activeNav} />
        )}

        {/* ── AKO Menu overlay ──────────────────────────────────────────── */}
        {overlay === "menu" && (
          <>
            <div onClick={() => setOverlay(null)} style={{
              position: "absolute", inset: 0, background: C.dim, zIndex: 30,
            }} />
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: C.white, borderRadius: "22px 22px 0 0",
              padding: "10px 18px 36px", zIndex: 40,
              animation: "slideUp 0.26s ease",
            }}>
              <div style={{
                width: 38, height: 4, borderRadius: 2,
                background: C.gray2, margin: "6px auto 16px",
              }} />
              <div style={{ fontSize: 18, fontWeight: 800, color: C.textPri, marginBottom: 16 }}>
                ¿Qué desea hacer?
              </div>
              {[
                { id: "estado",        icon: "📋", label: "Ver estado de cuenta" },
                { id: "diferidos",     icon: "📊", label: "Ver diferidos" },
                { id: "transferencia", icon: "⇄",  label: "Hacer una transferencia" },
              ].map(opt => (
                <TappableItem
                  key={opt.id}
                  onClick={() => startFlow(opt.id)}
                  scale={0.97}
                  style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "13px 14px", marginBottom: 10,
                    border: `1.5px solid ${C.gray2}`,
                    borderRadius: 14,
                    background: C.gray1,
                  }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: C.navy,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 17, flexShrink: 0,
                  }}>{opt.icon}</div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.textPri, flex: 1 }}>{opt.label}</span>
                  {completedFlows.has(opt.id) && (
                    <span style={{
                      background: C.green, color: "#fff",
                      fontSize: 9, fontWeight: 700,
                      padding: "3px 8px", borderRadius: 10, flexShrink: 0,
                    }}>✓ Completado</span>
                  )}
                  <span style={{ color: C.gray3, fontSize: 18 }}>›</span>
                </TappableItem>
              ))}
            </div>
          </>
        )}

        {/* ── Guided overlay ────────────────────────────────────────────── */}
        {overlay === "guided" && current && (
          <>
            <div style={{
              position: "absolute", inset: 0,
              background: C.dim, zIndex: 30,
              animation: "fadeIn 0.2s ease",
              pointerEvents: "none",
            }} />

            {tipText && (
              <div style={{
                position: "absolute",
                top: tooltipTop,
                left: 12, right: 12,
                zIndex: 60,
                animation: "fadeIn 0.25s ease",
              }}>
                {!hl && (
                  <div style={{ textAlign: "center", fontSize: 42, marginBottom: 10 }}>🎉</div>
                )}
                <div style={{
                  background: C.white, borderRadius: 16,
                  padding: "14px 16px",
                  boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 8 }}>
                    <AkoBadge size={28} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: C.navy }}>AKO</div>
                      <div style={{ display: "flex", gap: 3, marginTop: 3 }}>
                        {steps.map((_, i) => (
                          <div key={i} style={{
                            height: 3, borderRadius: 2,
                            width: i === step ? 18 : 6,
                            background: i <= step ? C.ako : C.gray2,
                            transition: "all 0.3s",
                          }} />
                        ))}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: C.gray3 }}>{step + 1}/{steps.length}</span>
                  </div>
                  <p style={{
                    fontSize: 14, color: C.textSec,
                    lineHeight: 1.65, margin: 0, minHeight: 44,
                  }}>
                    {display}
                    {!typeDone && (
                      <span style={{ animation: "blink 0.6s infinite", display: "inline-block" }}>▋</span>
                    )}
                  </p>
                </div>
                {hl && (
                  <div style={{
                    width: 0, height: 0, margin: "0 auto",
                    borderLeft: "8px solid transparent",
                    borderRight: "8px solid transparent",
                    borderTop: `10px solid ${C.white}`,
                  }} />
                )}
              </div>
            )}

            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "10px 14px 22px",
              background: "linear-gradient(180deg, transparent, rgba(8,16,50,0.97) 22%)",
              zIndex: 61,
              display: "flex", flexDirection: "column", gap: 9,
            }}>
              <div onClick={toggleVoice} style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
                padding: "10px",
                border: `1.5px solid ${voiceOn ? C.ako : "rgba(255,255,255,0.25)"}`,
                borderRadius: 12, cursor: "pointer",
                background: voiceOn ? "rgba(245,166,35,0.12)" : "transparent",
                transition: "all 0.2s",
              }}>
                <span style={{ fontSize: 17 }}>{voiceOn ? "🔊" : "🔇"}</span>
                <span style={{
                  fontSize: 13, fontWeight: 600,
                  color: voiceOn ? C.ako : "rgba(255,255,255,0.75)",
                }}>
                  {voiceOn ? "Voz activada — toca para desactivar" : "Leer en voz alta"}
                </span>
              </div>

              <div style={{ display: "flex", gap: 9 }}>
                <div onClick={exitGuide} style={{
                  flex: 1, padding: "11px", textAlign: "center",
                  border: "1.5px solid rgba(255,255,255,0.2)",
                  borderRadius: 12, cursor: "pointer",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 13, fontWeight: 600,
                }}>Salir</div>
                <div
                  onClick={goNext}
                  style={{
                    flex: 2, padding: "11px", textAlign: "center",
                    background: typeDone ? C.navy : "rgba(13,31,110,0.4)",
                    borderRadius: 12,
                    cursor: typeDone ? "pointer" : "default",
                    color: typeDone ? C.white : "rgba(255,255,255,0.3)",
                    fontSize: 13, fontWeight: 800,
                    transition: "background 0.2s, color 0.2s",
                    border: `1.5px solid ${typeDone ? C.navy : "transparent"}`,
                    animation: nextShake ? "shake 0.42s ease" : "none",
                  }}
                >
                  {current?.done ? "¡Terminar! ✓" : "Siguiente →"}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <p style={{
        color: "rgba(140,170,220,0.65)", fontSize: 11,
        textAlign: "center", margin: 0, maxWidth: 300, lineHeight: 1.7,
      }}>
        El adulto mayor sí quiere usar la banca digital.<br />
        <span style={{ color: C.ako, fontWeight: 700 }}>AKOlite no solo le enseña — lo acompaña.</span>
      </p>

      <style>{`
        @keyframes blink     { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes slideUp   { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes slideDown { from{transform:translateY(-18px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes akoHl {
          0%,100% { box-shadow: 0 0 0 7px rgba(245,166,35,0.22); }
          50%     { box-shadow: 0 0 0 14px rgba(245,166,35,0.06); }
        }
        @keyframes akoPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(245,166,35,0.55); transform: scale(1); }
          50%     { box-shadow: 0 0 0 9px rgba(245,166,35,0); transform: scale(1.05); }
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-6px); }
          40%     { transform: translateX(6px); }
          60%     { transform: translateX(-3px); }
          80%     { transform: translateX(3px); }
        }
        @keyframes successPop {
          0%   { transform: scale(0.7); opacity: 0; }
          70%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes tabIn {
          from { opacity: 0; transform: translateY(5px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        input:focus { outline: none; }
        * { -webkit-tap-highlight-color: transparent; }
      `}</style>
    </div>
  );
}

// ─── Transfer Screen ──────────────────────────────────────────────────────────
function TransferScreen({
  hlStyle, fieldFocus, cuenta, setCuenta, monto, setMonto,
  transferDone, onBack, onStandaloneComplete, onGuidedConfirm, isGuided,
}) {
  const [localStep, setLocalStep] = useState("cuenta"); // standalone step
  const cuentaRef = useRef(null);
  const montoRef  = useRef(null);

  // Effective focus: guided mode uses prop, standalone uses local step
  const ef = isGuided ? (fieldFocus || "cuenta") : localStep;

  const recipientName = cuenta.length >= 7 ? "Rosa Elena Montoya" : null;
  const recipientBank = cuenta.length >= 7 ? "Banco Pichincha"    : null;

  const showMonto   = ef === "monto"   || ef === "confirm" || ef === "done";
  const showConfirm = ef === "confirm" || ef === "done";
  const isDone      = ef === "done"    || transferDone;

  const cuentaValid = cuenta.replace(/\D/g, "").length >= 7;
  const montoVal    = parseFloat(monto) || 0;
  const montoValid  = montoVal > 0;

  // Auto-focus in guided mode
  useEffect(() => {
    if (fieldFocus === "cuenta" && cuentaRef.current) cuentaRef.current.focus();
    if (fieldFocus === "monto"  && montoRef.current)  montoRef.current.focus();
  }, [fieldFocus]);

  const handleCuentaChange = (e) => {
    setCuenta(e.target.value.replace(/\D/g, "").slice(0, 14));
  };

  const handleMontoChange = (e) => {
    let v = e.target.value.replace(/[^0-9.]/g, "");
    const parts = v.split(".");
    if (parts.length > 2) return;
    if (parts[1]?.length > 2) return;
    if (parseFloat(v) > 9999) return;
    setMonto(v);
  };

  const handleConfirmPress = () => {
    if (isGuided) {
      onGuidedConfirm?.();
    } else {
      const amt = montoVal.toFixed(2);
      setLocalStep("done");
      onStandaloneComplete?.(amt);
    }
  };

  const montoDisplay = monto
    ? `$${parseFloat(monto).toFixed(2)}`
    : "$0.00";

  return (
    <div style={{ background: "#3d4a6b", minHeight: 670, display: "flex", flexDirection: "column" }}>
      <StatusBar dark />

      {/* Header */}
      <div style={{
        padding: "10px 18px 14px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <TappableItem onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 15, color: "rgba(255,255,255,0.8)" }}>← Volver</span>
        </TappableItem>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <DinersCircleWhite size={24} />
            <span style={{ color: C.white, fontWeight: 700, fontSize: 17 }}>Transferencias</span>
          </div>
        </div>
        <div style={{ width: 60 }} />
      </div>

      {/* Content */}
      <div style={{
        flex: 1, padding: "0 16px 24px",
        display: "flex", flexDirection: "column", gap: 14,
        overflowY: "auto",
      }}>

        {/* Cuenta field */}
        {!showConfirm && (
          <div style={{
            background: "rgba(255,255,255,0.10)",
            borderRadius: 18, padding: 18,
            border: ef === "cuenta" ? `2px solid ${C.ako}` : "2px solid transparent",
            transition: "border 0.2s",
            ...hlStyle("cuentaField"),
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: ef === "cuenta" ? C.ako : cuentaValid ? C.green : "rgba(255,255,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800,
                color: "#fff",
                transition: "all 0.2s",
              }}>{cuentaValid ? "✓" : "1"}</div>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Cuenta destino</span>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ color: C.white, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Número de cuenta
              </div>
              <input
                ref={cuentaRef}
                value={cuenta}
                onChange={handleCuentaChange}
                placeholder="Ej: 2200567890"
                inputMode="numeric"
                style={{
                  width: "100%", padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.92)",
                  border: "none",
                  fontSize: 16, color: C.textPri,
                  boxSizing: "border-box",
                  letterSpacing: 1,
                }}
              />
              {cuenta.length > 0 && cuenta.length < 7 && (
                <div style={{ fontSize: 10, color: "#f9a825", marginTop: 5 }}>
                  Mínimo 7 dígitos ({cuenta.length}/7)
                </div>
              )}
              {cuentaValid && (
                <div style={{ fontSize: 11, color: "#81c784", marginTop: 5, fontWeight: 600 }}>
                  ✓ Rosa Elena Montoya — Banco Pichincha
                </div>
              )}
            </div>

            <div style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: 10, padding: "10px 12px",
              display: "flex", alignItems: "flex-start", gap: 8,
            }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>ⓘ</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
                Verifica que el número de cuenta sea correcto antes de continuar
              </span>
            </div>
          </div>
        )}

        {/* Monto field */}
        {showMonto && !isDone && (
          <div style={{
            background: "rgba(255,255,255,0.10)",
            borderRadius: 18, padding: 18,
            border: ef === "monto" ? `2px solid ${C.ako}` : "2px solid transparent",
            transition: "border 0.2s",
            ...hlStyle("montoField"),
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: ef === "monto" ? C.ako : montoValid ? C.green : "rgba(255,255,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800, color: "#fff",
                transition: "all 0.2s",
              }}>{montoValid && ef !== "monto" ? "✓" : "2"}</div>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Monto a transferir</span>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ color: C.white, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Monto (USD)
              </div>
              <div style={{ position: "relative" }}>
                <span style={{
                  position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
                  fontSize: 16, fontWeight: 700, color: C.textSec, pointerEvents: "none",
                }}>$</span>
                <input
                  ref={montoRef}
                  value={monto}
                  onChange={handleMontoChange}
                  placeholder="0.00"
                  inputMode="decimal"
                  style={{
                    width: "100%", padding: "12px 14px 12px 28px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.92)",
                    border: "none",
                    fontSize: 16, color: C.textPri,
                    boxSizing: "border-box",
                    fontWeight: 700,
                  }}
                />
              </div>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.08)",
              borderRadius: 10, padding: "10px 12px",
            }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>
                Saldo Disponible
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.white }}>$ 1,234.56</div>
            </div>
          </div>
        )}

        {/* Confirm panel */}
        {showConfirm && !isDone && (
          <div style={{
            background: "rgba(255,255,255,0.10)",
            borderRadius: 18, padding: 18,
            border: `2px solid ${C.ako}`,
            ...hlStyle("confirmPanel"),
          }}>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginBottom: 12 }}>
              Confirmar transferencia
            </div>
            {[
              { label: "Cuenta destino", value: cuenta || "1234567" },
              { label: "Destinatario",   value: recipientName || "Rosa Elena Montoya" },
              { label: "Banco",          value: recipientBank || "Banco Pichincha" },
              { label: "Monto",          value: montoDisplay },
            ].map((row, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between",
                padding: "8px 0",
                borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.1)" : "none",
              }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{row.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.white }}>{row.value}</span>
              </div>
            ))}
            <TappableItem
              onClick={handleConfirmPress}
              scale={0.97}
              style={{
                marginTop: 14,
                background: C.navy,
                borderRadius: 12, padding: "13px",
                textAlign: "center",
                color: C.white, fontWeight: 800, fontSize: 14,
              }}
            >
              Confirmar transferencia
            </TappableItem>
          </div>
        )}

        {/* Standalone continuar buttons */}
        {!isGuided && !isDone && (
          <div>
            {ef === "cuenta" && (
              <TappableItem
                onClick={() => { if (cuentaValid) setLocalStep("monto"); }}
                disabled={!cuentaValid}
                scale={0.97}
                style={{
                  background: cuentaValid ? C.navy : "rgba(255,255,255,0.15)",
                  borderRadius: 14, padding: "14px",
                  textAlign: "center",
                  color: cuentaValid ? C.white : "rgba(255,255,255,0.4)",
                  fontWeight: 800, fontSize: 14,
                  transition: "background 0.2s",
                }}
              >
                {cuentaValid ? "Continuar →" : "Ingresa al menos 7 dígitos"}
              </TappableItem>
            )}
            {ef === "monto" && (
              <TappableItem
                onClick={() => { if (montoValid) setLocalStep("confirm"); }}
                disabled={!montoValid}
                scale={0.97}
                style={{
                  background: montoValid ? C.navy : "rgba(255,255,255,0.15)",
                  borderRadius: 14, padding: "14px",
                  textAlign: "center",
                  color: montoValid ? C.white : "rgba(255,255,255,0.4)",
                  fontWeight: 800, fontSize: 14,
                  transition: "background 0.2s",
                }}
              >
                {montoValid ? "Continuar →" : "Ingresa el monto a transferir"}
              </TappableItem>
            )}
          </div>
        )}

        {/* Success state */}
        {isDone && (
          <div style={{
            background: "rgba(39,174,96,0.15)",
            borderRadius: 18, padding: 28,
            border: `2px solid ${C.green}`,
            textAlign: "center",
            animation: "successPop 0.45s cubic-bezier(0.22,1,0.36,1)",
          }}>
            <div style={{ fontSize: 52, marginBottom: 12, lineHeight: 1 }}>✅</div>
            <div style={{ color: C.white, fontWeight: 800, fontSize: 19, marginBottom: 8 }}>
              ¡Transferencia exitosa!
            </div>
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.7 }}>
              Se enviaron <b style={{ color: "#81c784" }}>{montoDisplay}</b> a<br />
              <b style={{ color: C.white }}>{recipientName || "Rosa Elena Montoya"}</b>
            </div>
            {!isGuided && (
              <TappableItem
                onClick={onBack}
                scale={0.97}
                style={{
                  marginTop: 20,
                  background: C.white,
                  borderRadius: 12, padding: "11px 24px",
                  color: C.navy, fontWeight: 700, fontSize: 13,
                  display: "inline-block",
                }}
              >
                ← Volver al inicio
              </TappableItem>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
function HomeScreen({
  hlStyle, onModoGuiado, onGoDetail, onTransfer, onConócelos,
  onNav, activeNav, akoPulse, completedFlows,
}) {
  const atajos = [
    { id: "transferBtn", icon: "⇄",  label: "Pagar con\ntransferencia", onClick: onTransfer },
    { id: "datosBtn",    icon: "»",   label: "Datos de\ntarjeta",        onClick: null },
    { id: "deunaBtn",    icon: "d!",  label: "Pagar con\nDeuna",         color: "#8e44ad", onClick: null },
    { id: "masBtn",      icon: "+",   label: "Más\nopciones",            circle: true, onClick: null },
  ];

  const completedCount = completedFlows.size;

  return (
    <div style={{ background: C.bg, minHeight: 670, paddingBottom: 80 }}>
      <StatusBar />

      {/* App bar */}
      <div style={{
        background: C.white, padding: "6px 18px 12px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        borderBottom: `1px solid ${C.gray2}`,
      }}>
        <span style={{ fontSize: 25, fontWeight: 900, color: C.navy, letterSpacing: -0.5 }}>blu</span>
        <div style={{ display: "flex", gap: 14 }}>
          <span style={{ fontSize: 18, color: C.navy }}>🔔</span>
          <span style={{ fontSize: 18, color: C.navy }}>👤</span>
        </div>
      </div>

      <div style={{ padding: "14px 14px 0" }}>

        {/* Product card → taps to detail */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: C.textPri }}>Tus productos</span>
          <span style={{ fontSize: 12, color: C.accent }}>+ Ver todo</span>
        </div>

        <TappableItem
          onClick={onGoDetail}
          scale={0.98}
          style={{
            background: C.white, borderRadius: 16, padding: 14,
            marginBottom: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <BluCard />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.textPri }}>DISCOVER UDLA INTERNACIO...</div>
              <div style={{ fontSize: 11, color: C.textSec }}>**** 4508</div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: 10, color: C.accent, fontWeight: 600 }}>Ver detalle ›</div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.navy }}>
            $275.03 <span style={{ fontSize: 16, color: C.gray3 }}>👁</span>
          </div>
          <div style={{ fontSize: 11, color: C.textSec, marginTop: 3 }}>
            Saldo a pagar hasta <b>01/abr/2026</b>
          </div>
        </TappableItem>

        {/* Atajos */}
        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: C.textPri }}>Atajos principales</span>
        </div>
        <div style={{
          background: C.white, borderRadius: 16, padding: "14px 6px",
          display: "flex", justifyContent: "space-around",
          marginBottom: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
        }}>
          {atajos.map(item => (
            <TappableItem
              key={item.id}
              onClick={item.onClick}
              scale={0.88}
              style={{ textAlign: "center", flex: 1, ...hlStyle(item.id) }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: item.circle ? C.navy : C.gray1,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 5px",
                fontSize: item.icon === "d!" ? 17 : 19,
                color: item.circle ? C.white : (item.color || C.navy),
                fontWeight: 800,
                transition: "transform 0.12s ease",
              }}>{item.icon}</div>
              <div style={{
                fontSize: 9.5, color: C.textSec,
                whiteSpace: "pre-line", lineHeight: 1.3,
              }}>{item.label}</div>
            </TappableItem>
          ))}
        </div>

        {/* AKO card */}
        <TappableItem
          onClick={onModoGuiado}
          scale={0.97}
          style={{
            background: C.white,
            borderRadius: 16, padding: "14px 16px",
            marginBottom: 14,
            boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
            border: `1.5px solid ${C.ako}22`,
            display: "flex", alignItems: "center", gap: 14,
            ...hlStyle("akoCard"),
          }}
        >
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 42, height: 42, borderRadius: "50%",
              background: `${C.ako}18`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <AkoBadge size={30} />
            </div>
            {/* Progress indicator */}
            {completedCount > 0 && (
              <div style={{
                position: "absolute", bottom: -2, right: -2,
                width: 14, height: 14, borderRadius: "50%",
                background: C.green, border: "2px solid #fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 7, color: "#fff", fontWeight: 800,
              }}>{completedCount}</div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.textPri }}>
              AKO — Modo Guiado
            </div>
            <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>
              {completedCount > 0
                ? `${completedCount}/3 flujos completados · Toca para continuar`
                : "¿Necesitas ayuda? Te acompaño en cada paso"}
            </div>
          </div>
          <div style={{
            background: C.ako,
            borderRadius: 10, padding: "6px 12px",
            color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
            animation: akoPulse ? "akoPulse 1.6s ease-in-out infinite" : "none",
          }}>Activar</div>
        </TappableItem>

        {/* Promo card */}
        <div style={{
          background: C.white, borderRadius: 16, padding: 16,
          boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.textPri, marginBottom: 4 }}>
            Más opciones, más productos para ti
          </div>
          <div style={{ fontSize: 11, color: C.textSec, marginBottom: 12 }}>
            Conoce los productos Diners Club que pueden ayudarte a llegar más lejos.
          </div>
          <TappableItem
            onClick={onConócelos}
            scale={0.94}
            style={{
              background: C.navy, borderRadius: 10, padding: "9px 14px",
              display: "inline-block", color: C.white, fontSize: 12, fontWeight: 600,
            }}
          >
            Conócelos aquí
          </TappableItem>
        </div>
      </div>
      <BottomNav active={activeNav} onNav={onNav} />
    </div>
  );
}

// ─── Detail Screen ────────────────────────────────────────────────────────────
function DetailScreen({ hlStyle, tab, setTab, onBack, onNav, activeNav }) {
  return (
    <div style={{ background: C.bg, minHeight: 670, paddingBottom: 80 }}>
      <StatusBar />
      <div style={{
        background: C.white, padding: "8px 18px 12px",
        display: "flex", alignItems: "center", gap: 10,
        borderBottom: `1px solid ${C.gray2}`,
      }}>
        <TappableItem onClick={onBack} style={{ padding: "2px 4px" }}>
          <span style={{ fontSize: 20, color: C.navy, lineHeight: 1 }}>←</span>
        </TappableItem>
        <div style={{ flex: 1 }} />
      </div>

      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <BluCard />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.textPri }}>Discover Udla Internacional</div>
            <div style={{ fontSize: 12, color: C.textSec }}>**** 4508</div>
          </div>
        </div>

        {/* Balance cards */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14, ...hlStyle("balanceCards") }}>
          {[
            { dot: C.gray3, label: "Próx. estado de cuenta", amt: "$275.03", sub: "16/03/26 – 15/04/26" },
            { dot: C.navy,  label: "Deuda total",            amt: "$275.03", sub: "$17.63 disponible" },
          ].map((c, i) => (
            <div key={i} style={{
              flex: 1, background: C.white, borderRadius: 12,
              padding: "11px 10px", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: c.dot }} />
                <span style={{ fontSize: 9, color: C.textSec }}>{c.label}</span>
              </div>
              <div style={{ fontSize: 19, fontWeight: 800, color: C.navy }}>{c.amt}</div>
              <div style={{ fontSize: 9, color: C.textSec, marginTop: 2 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 7, marginBottom: 14 }}>
          <DinersCircle size={18} />
          <span style={{ fontSize: 12, color: C.accent, textDecoration: "underline" }}>Todo sobre tu tarjeta</span>
        </div>

        {/* Atajos */}
        <div style={{ marginBottom: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.textPri }}>Mis atajos</span>
        </div>
        <div style={{
          background: C.white, borderRadius: 14, padding: "12px 6px",
          display: "flex", justifyContent: "space-around", marginBottom: 14,
          boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        }}>
          {[
            { hId: null,          icon: "»",   label: "Datos de\ntarjeta" },
            { hId: null,          icon: "d!",  label: "Pagar con\nDeuna", color: "#8e44ad" },
            { hId: "estadoAtajo", icon: "📋",  label: "Estado de\ncuenta" },
            { hId: null,          icon: "+",   label: "Más\nopciones", circle: true },
          ].map((item, i) => (
            <TappableItem key={i} scale={0.88} style={{ textAlign: "center", flex: 1, ...hlStyle(item.hId) }}>
              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: item.circle ? C.navy : C.gray1,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 4px",
                fontSize: item.icon === "d!" ? 15 : 17,
                color: item.circle ? C.white : (item.color || C.navy), fontWeight: 700,
              }}>{item.icon}</div>
              <div style={{ fontSize: 9, color: C.textSec, whiteSpace: "pre-line", lineHeight: 1.3 }}>
                {item.label}
              </div>
            </TappableItem>
          ))}
        </div>

        {/* Movements */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.textPri }}>Tus últimos movimientos</span>
          <div style={{ display: "flex", gap: 10, color: C.textSec }}>
            <span>🔍</span><span>⊟</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 6, background: C.gray2, borderRadius: 30,
          padding: 4, marginBottom: 12,
        }}>
          {["consumos", "diferidos"].map(t => {
            const hlId = t === "consumos" ? "consumosTab" : "diferidosTab";
            return (
              <div
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1, textAlign: "center", padding: "8px 0",
                  borderRadius: 26, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: tab === t ? C.navy : "transparent",
                  color: tab === t ? C.white : C.textSec,
                  transition: "all 0.22s",
                  ...hlStyle(hlId),
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </div>
            );
          })}
        </div>

        {/* Tab content — key forces remount + entrance animation */}
        <div key={tab} style={{ animation: "tabIn 0.22s ease" }}>
          {tab === "consumos" ? <ConsumosList /> : <DiferidosList />}
        </div>
      </div>
      <BottomNav active={activeNav} onNav={onNav} />
    </div>
  );
}

// ─── Lists ────────────────────────────────────────────────────────────────────
function ConsumosList() {
  let lastDate = null;
  return (
    <div>
      {consumos.map((c, i) => {
        const showDate = c.date !== lastDate;
        lastDate = c.date;
        return (
          <div key={i}>
            {showDate && (
              <div style={{ fontSize: 12, color: C.textSec, padding: "6px 0 3px", fontWeight: 500 }}>
                {c.date}
              </div>
            )}
            <div style={{
              background: C.white, borderRadius: 12, padding: "10px 12px",
              display: "flex", alignItems: "center", gap: 10, marginBottom: 4,
              boxShadow: "0 1px 5px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%", background: C.gray1,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, flexShrink: 0,
              }}>{c.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textPri }}>{c.name}</div>
                <div style={{ fontSize: 10, color: C.textSec }}>{c.sub}</div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.red }}>
                {c.amt.toFixed(2)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DiferidosList() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {diferidos.map((d, i) => {
        const pct = Math.round((d.paid / d.total) * 100);
        return (
          <div key={i} style={{
            background: C.white, borderRadius: 14, padding: 13,
            boxShadow: "0 1px 8px rgba(0,0,0,0.05)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 34, height: 34, borderRadius: "50%", background: C.gray1,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, flexShrink: 0,
              }}>{d.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: C.textPri }}>{d.name}</div>
                <div style={{ fontSize: 10, color: C.textSec }}>Cuota {d.paid}/{d.total} — ${d.amt.toFixed(2)}/mes</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.navy }}>
                  ${(d.amt * (d.total - d.paid)).toFixed(2)}
                </div>
                <div style={{ fontSize: 9, color: C.textSec }}>restante</div>
              </div>
            </div>
            <div style={{ height: 5, background: C.gray2, borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%", width: `${pct}%`,
                background: `linear-gradient(90deg, ${C.accent}, ${C.navy})`,
                borderRadius: 4, transition: "width 0.6s",
              }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span style={{ fontSize: 9, color: C.textSec }}>{d.paid} pagadas</span>
              <span style={{ fontSize: 9, fontWeight: 700, color: C.navy }}>{pct}% completado</span>
              <span style={{ fontSize: 9, color: C.textSec }}>{d.total - d.paid} restantes</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Primitives ───────────────────────────────────────────────────────────────
function StatusBar({ dark }) {
  return (
    <div style={{
      background: dark ? "transparent" : C.white,
      padding: "10px 18px 0",
      display: "flex", justifyContent: "space-between",
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: dark ? C.white : C.textPri }}>9:41</span>
      <span style={{ fontSize: 11, color: dark ? "rgba(255,255,255,0.6)" : C.textSec }}>▲ ◉ ◼</span>
    </div>
  );
}

function BluCard() {
  return (
    <div style={{
      width: 62, height: 40, borderRadius: 6, flexShrink: 0,
      background: "linear-gradient(135deg, #7b0f0f 0%, #c0392b 55%, #1a1a30 100%)",
      display: "flex", alignItems: "flex-end", padding: "3px 5px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    }}>
      <span style={{ fontSize: 7, color: "rgba(255,255,255,0.65)", fontStyle: "italic" }}>DISCOVER</span>
    </div>
  );
}

function DinersCircle({ size = 22 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: `2px solid ${C.navy}`,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <div style={{ width: size * 0.44, height: size * 0.44, borderRadius: "50%", background: C.navy }} />
    </div>
  );
}

function DinersCircleWhite({ size = 22 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      border: "2px solid rgba(255,255,255,0.7)",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <div style={{ width: size * 0.44, height: size * 0.44, borderRadius: "50%", background: "rgba(255,255,255,0.7)" }} />
    </div>
  );
}

function AkoBadge({ size = 28 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: C.ako, flexShrink: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 900, fontSize: size * 0.42, color: "#fff",
      boxShadow: `0 2px 8px ${C.akoGlow}`,
    }}>A</div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
function BottomNav({ active, onNav }) {
  const [pressing, setPressing] = useState(null);

  const items = [
    { id: "inicio",  icon: "🏠", label: "Inicio" },
    { id: "pagos",   icon: "👛", label: "Pagos" },
    { id: "parati",  icon: "⊞",  label: "Para ti" },
  ];

  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      background: C.white, borderTop: `1px solid ${C.gray2}`,
      display: "flex", alignItems: "center", padding: "7px 12px 12px", gap: 4,
    }}>
      {items.map(item => {
        const isActive  = item.id === active;
        const isPressed = item.id === pressing;
        return (
          <div
            key={item.id}
            onPointerDown={() => setPressing(item.id)}
            onPointerUp={() => { setPressing(null); onNav?.(item.id); }}
            onPointerLeave={() => setPressing(null)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: isActive ? "row" : "column",
              alignItems: "center",
              justifyContent: "center",
              gap: isActive ? 5 : 2,
              background: isActive ? C.navy : "transparent",
              borderRadius: 24,
              padding: isActive ? "7px 12px" : "5px 0",
              cursor: "pointer",
              transform: isPressed ? "scale(0.92)" : "scale(1)",
              transition: "transform 0.12s ease, background 0.2s ease",
            }}
          >
            <span style={{ fontSize: 15 }}>{item.icon}</span>
            <span style={{
              fontSize: 10,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? C.white : C.textSec,
            }}>{item.label}</span>
          </div>
        );
      })}
      <div style={{
        width: 36, height: 36, borderRadius: "50%",
        border: `2px solid ${C.navy}`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <div style={{ width: 16, height: 16, borderRadius: "50%", background: C.navy }} />
      </div>
    </div>
  );
}
