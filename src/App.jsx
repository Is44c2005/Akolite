import { useState, useEffect, useRef } from "react";

// ─── Color system ─────────────────────────────────────────────────────────
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

const consumos = [
  { date: "30 marzo",  name: "Supermaxi",       sub: "Supermercados",   amt: -38.50, icon: "🛒" },
  { date: "30 marzo",  name: "Uber Eats",        sub: "Comida y bebida", amt: -12.90, icon: "🍔" },
  { date: "27 marzo",  name: "Netflix",           sub: "Entretenimiento",amt: -15.99, icon: "🎬" },
  { date: "27 marzo",  name: "Farmacia Fybeca",  sub: "Salud",           amt: -22.30, icon: "💊" },
];
const diferidos = [
  { name: "iPhone 15 — Movistar",     total: 12, paid: 4,  amt: 54.17,  icon: "📱" },
  { name: "Electrodomésticos — KiWi", total:  6, paid: 2,  amt: 45.00,  icon: "🏠" },
  { name: "Viaje — Copa Airlines",    total:  3, paid: 1,  amt: 120.00, icon: "✈️" },
];

export default function App() {
  const [appScreen, setAppScreen] = useState("home");
  const [overlay,   setOverlay]   = useState(null);
  const [flow,      setFlow]      = useState(null);
  const [step,      setStep]      = useState(0);
  const [tab,       setTab]       = useState("consumos");
  const [voiceOn,   setVoiceOn]   = useState(false);
  const [fade,      setFade]      = useState(true);

  const [cuenta,    setCuenta]    = useState("");
  const [monto,     setMonto]     = useState("");
  const [transferDone, setTransferDone] = useState(false);

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
    if (current.screen === "detail" && appScreen !== "detail")
      transition(() => setAppScreen("detail"));
    if (current.screen === "home" && appScreen !== "home")
      transition(() => setAppScreen("home"));
    if (current.screen === "transfer" && appScreen !== "transfer")
      transition(() => setAppScreen("transfer"));
    if (current.switchTab) setTab(current.switchTab);
  }, [step, flow]);

  const transition = (fn) => {
    setFade(false);
    setTimeout(() => { fn(); setFade(true); }, 220);
  };

  const openMenu = () => { stopVoice(); setOverlay("menu"); };

  const startFlow = (f) => {
    stopVoice();
    setCuenta(""); setMonto(""); setTransferDone(false);
    setFlow(f); setStep(0); setTab("consumos");
    setOverlay("guided");
  };

  const goNext = () => {
    if (!typeDone) return;
    stopVoice();
    if (current?.done || step >= steps.length - 1) {
      setOverlay(null); setFlow(null); setStep(0); setTransferDone(false);
      transition(() => setAppScreen("home"));
      return;
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

  // ── Tooltip position per highlighted element ─────────────────────────
  // balanceCards sits around 30% down the detail screen → tooltip at 38% (just below it)
  // all other highlights are in the lower half → tooltip near top at 14%
  // no highlight (done step) → centered at 28%
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

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(150deg, #07122e 0%, #152260 100%)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "16px 14px 24px", gap: 16,
      fontFamily: "'Helvetica Neue', Arial, sans-serif",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <AkoBadge size={26} />
        <span style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>AKOlite</span>
        <span style={{
          background: "rgba(245,166,35,0.18)", color: C.ako,
          fontSize: 10, padding: "2px 9px", borderRadius: 20,
        }}>integrado en Blu · Diners Club</span>
      </div>

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

        {appScreen === "home" && (
          <HomeScreen hlStyle={hlStyle} onModoGuiado={openMenu} />
        )}

        {appScreen === "detail" && (
          <DetailScreen hlStyle={hlStyle} tab={tab} setTab={setTab} />
        )}

        {appScreen === "transfer" && (
          <TransferScreen
            hlStyle={hlStyle}
            fieldFocus={current?.fieldFocus}
            cuenta={cuenta} setCuenta={setCuenta}
            monto={monto}   setMonto={setMonto}
            transferDone={transferDone}
            onBack={exitGuide}
          />
        )}

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
                <div key={opt.id} onClick={() => startFlow(opt.id)} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "13px 14px", marginBottom: 10,
                  border: `1.5px solid ${C.gray2}`,
                  borderRadius: 14, cursor: "pointer",
                  background: C.gray1,
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%",
                    background: C.navy,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 17, flexShrink: 0,
                  }}>{opt.icon}</div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: C.textPri, flex: 1 }}>{opt.label}</span>
                  <span style={{ color: C.gray3, fontSize: 18 }}>›</span>
                </div>
              ))}
            </div>
          </>
        )}

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
                <div onClick={goNext} style={{
                  flex: 2, padding: "11px", textAlign: "center",
                  background: typeDone ? C.navy : "rgba(13,31,110,0.4)",
                  borderRadius: 12,
                  cursor: typeDone ? "pointer" : "default",
                  color: typeDone ? C.white : "rgba(255,255,255,0.3)",
                  fontSize: 13, fontWeight: 800,
                  transition: "all 0.2s",
                  border: `1.5px solid ${typeDone ? C.navy : "transparent"}`,
                }}>
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
        @keyframes blink   { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes akoHl   {
          0%,100% { box-shadow: 0 0 0 7px rgba(245,166,35,0.22); }
          50%     { box-shadow: 0 0 0 14px rgba(245,166,35,0.06); }
        }
        input:focus { outline: none; }
      `}</style>
    </div>
  );
}

function TransferScreen({ hlStyle, fieldFocus, cuenta, setCuenta, monto, setMonto, transferDone, onBack }) {
  const inputRef = useRef(null);

  const recipientName = cuenta.length >= 7 ? "Rosa Elena Montoya" : null;
  const recipientBank = cuenta.length >= 7 ? "Banco Pichincha" : null;

  const showConfirm = fieldFocus === "confirm" || fieldFocus === "done";
  const isDone      = fieldFocus === "done" || transferDone;

  return (
    <div style={{
      background: "#3d4a6b",
      minHeight: 670,
      display: "flex", flexDirection: "column",
    }}>
      <StatusBar dark />

      <div style={{
        padding: "10px 18px 14px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <span onClick={onBack} style={{
          fontSize: 15, color: "rgba(255,255,255,0.75)", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 4,
        }}>← Volver</span>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <DinersCircleWhite size={24} />
            <span style={{ color: C.white, fontWeight: 700, fontSize: 17 }}>Transferencias</span>
          </div>
        </div>
        <div style={{ width: 60 }} />
      </div>

      <div style={{
        flex: 1, padding: "0 16px 160px",
        display: "flex", flexDirection: "column", gap: 14,
      }}>

        {!showConfirm && (
          <div style={{
            background: "rgba(255,255,255,0.10)",
            borderRadius: 18, padding: 18,
            border: fieldFocus === "cuenta" ? `2px solid ${C.ako}` : "2px solid transparent",
            transition: "border 0.2s",
            ...hlStyle("cuentaField"),
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: fieldFocus === "cuenta" ? C.ako : "rgba(255,255,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800,
                color: fieldFocus === "cuenta" ? "#fff" : "rgba(255,255,255,0.6)",
                transition: "all 0.2s",
              }}>1</div>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Cuenta destino</span>
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ color: C.white, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Número de cuenta
              </div>
              <input
                ref={fieldFocus === "cuenta" ? inputRef : null}
                value={cuenta}
                onChange={e => setCuenta(e.target.value)}
                placeholder="Ej: 1234567"
                style={{
                  width: "100%", padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.92)",
                  border: "none",
                  fontSize: 16, color: C.textPri,
                  boxSizing: "border-box",
                }}
              />
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

        {(fieldFocus === "monto" || showConfirm) && !isDone && (
          <div style={{
            background: "rgba(255,255,255,0.10)",
            borderRadius: 18, padding: 18,
            border: fieldFocus === "monto" ? `2px solid ${C.ako}` : "2px solid transparent",
            transition: "border 0.2s",
            ...hlStyle("montoField"),
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: fieldFocus === "monto" ? C.ako : "rgba(255,255,255,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 800,
                color: fieldFocus === "monto" ? "#fff" : "rgba(255,255,255,0.6)",
                transition: "all 0.2s",
              }}>2</div>
              <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>Monto a transferir</span>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ color: C.white, fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                Monto (USD)
              </div>
              <input
                value={monto}
                onChange={e => setMonto(e.target.value)}
                placeholder="Ej: 1.00 $"
                style={{
                  width: "100%", padding: "12px 14px",
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.92)",
                  border: "none",
                  fontSize: 16, color: C.textPri,
                  boxSizing: "border-box",
                }}
              />
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
              { label: "Monto",          value: `$${monto || "50.00"}` },
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
            <div style={{
              marginTop: 14,
              background: C.navy,
              borderRadius: 12, padding: "13px",
              textAlign: "center", cursor: "pointer",
              color: C.white, fontWeight: 800, fontSize: 14,
            }}>
              Confirmar transferencia
            </div>
          </div>
        )}

        {isDone && (
          <div style={{
            background: "rgba(39,174,96,0.15)",
            borderRadius: 18, padding: 24,
            border: `2px solid ${C.green}`,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
            <div style={{ color: C.white, fontWeight: 800, fontSize: 18, marginBottom: 6 }}>
              ¡Transferencia exitosa!
            </div>
            <div style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 1.6 }}>
              Se enviaron <b style={{ color: C.white }}>${monto || "50.00"}</b> a<br />
              <b style={{ color: C.white }}>{recipientName || "Rosa Elena Montoya"}</b>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function HomeScreen({ hlStyle, onModoGuiado }) {
  return (
    <div style={{ background: C.bg, minHeight: 670, paddingBottom: 80 }}>
      <StatusBar />
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: C.textPri }}>Tus productos</span>
          <span style={{ fontSize: 12, color: C.accent }}>+ Ver todo</span>
        </div>
        <div style={{
          background: C.white, borderRadius: 16, padding: 14,
          marginBottom: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <BluCard />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.textPri }}>DISCOVER UDLA INTERNACIO...</div>
              <div style={{ fontSize: 11, color: C.textSec }}>**** 4508</div>
            </div>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: C.navy }}>
            $275.03 <span style={{ fontSize: 16, color: C.gray3 }}>👁</span>
          </div>
          <div style={{ fontSize: 11, color: C.textSec, marginTop: 3 }}>
            Saldo a pagar hasta <b>01/abr/2026</b>
          </div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: C.textPri }}>Atajos principales</span>
        </div>
        <div style={{
          background: C.white, borderRadius: 16, padding: "14px 6px",
          display: "flex", justifyContent: "space-around",
          marginBottom: 14, boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
        }}>
          {[
            { id: "transferBtn", icon: "⇄",  label: "Pagar con\ntransferencia" },
            { id: "datosBtn",    icon: "»",   label: "Datos de\ntarjeta" },
            { id: "deunaBtn",    icon: "d!",  label: "Pagar con\nDeuna", color: "#8e44ad" },
            { id: "masBtn",      icon: "+",   label: "Más\nopciones", circle: true },
          ].map(item => (
            <div key={item.id} style={{ textAlign: "center", flex: 1, ...hlStyle(item.id) }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: item.circle ? C.navy : C.gray1,
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 5px",
                fontSize: item.icon === "d!" ? 17 : 19,
                color: item.circle ? C.white : (item.color || C.navy),
                fontWeight: 800,
              }}>{item.icon}</div>
              <div style={{
                fontSize: 9.5, color: C.textSec,
                whiteSpace: "pre-line", lineHeight: 1.3,
              }}>{item.label}</div>
            </div>
          ))}
        </div>

        <div
          onClick={onModoGuiado}
          style={{
            background: C.white,
            borderRadius: 16, padding: "14px 16px",
            marginBottom: 14,
            boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
            border: `1.5px solid ${C.ako}22`,
            cursor: "pointer",
            display: "flex", alignItems: "center", gap: 14,
            ...hlStyle("akoCard"),
          }}
        >
          <div style={{
            width: 42, height: 42, borderRadius: "50%",
            background: `${C.ako}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <AkoBadge size={30} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.textPri }}>
              AKO — Modo Guiado
            </div>
            <div style={{ fontSize: 11, color: C.textSec, marginTop: 2 }}>
              ¿Necesitas ayuda? Te acompaño en cada paso
            </div>
          </div>
          <div style={{
            background: C.ako, borderRadius: 10, padding: "6px 12px",
            color: "#fff", fontSize: 11, fontWeight: 700, flexShrink: 0,
          }}>Activar</div>
        </div>

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
          <div style={{
            background: C.navy, borderRadius: 10, padding: "9px 14px",
            display: "inline-block", color: C.white, fontSize: 12, fontWeight: 600,
          }}>Conócelos aquí</div>
        </div>
      </div>
      <BottomNav active="inicio" />
    </div>
  );
}

function DetailScreen({ hlStyle, tab, setTab }) {
  return (
    <div style={{ background: C.bg, minHeight: 670, paddingBottom: 80 }}>
      <StatusBar />
      <div style={{
        background: C.white, padding: "8px 18px 12px",
        display: "flex", alignItems: "center", gap: 10,
        borderBottom: `1px solid ${C.gray2}`,
      }}>
        <span style={{ fontSize: 20, color: C.navy }}>←</span>
      </div>

      <div style={{ padding: "14px 14px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
          <BluCard />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.textPri }}>Discover Udla Internacional</div>
            <div style={{ fontSize: 12, color: C.textSec }}>**** 4508</div>
          </div>
        </div>

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
            <div key={i} style={{ textAlign: "center", flex: 1, ...hlStyle(item.hId) }}>
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
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.textPri }}>Tus últimos movimientos</span>
          <div style={{ display: "flex", gap: 10, color: C.textSec }}>
            <span>🔍</span><span>⊟</span>
          </div>
        </div>

        <div style={{
          display: "flex", gap: 6, background: C.gray2, borderRadius: 30,
          padding: 4, marginBottom: 12,
        }}>
          {["consumos", "diferidos"].map(t => {
            const hlId = t === "consumos" ? "consumosTab" : "diferidosTab";
            return (
              <div key={t} onClick={() => setTab(t)} style={{
                flex: 1, textAlign: "center", padding: "8px 0",
                borderRadius: 26, fontSize: 12, fontWeight: 600, cursor: "pointer",
                background: tab === t ? C.navy : "transparent",
                color: tab === t ? C.white : C.textSec,
                transition: "all 0.2s",
                ...hlStyle(hlId),
              }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </div>
            );
          })}
        </div>

        {tab === "consumos" ? <ConsumosList /> : <DiferidosList />}
      </div>
      <BottomNav active="pagos" />
    </div>
  );
}

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

function BottomNav({ active }) {
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0,
      background: C.white, borderTop: `1px solid ${C.gray2}`,
      display: "flex", alignItems: "center", padding: "7px 12px 12px", gap: 4,
    }}>
      {[
        { id: "inicio", icon: "🏠", label: "Inicio" },
        { id: "pagos",  icon: "👛", label: "Pagos" },
        { id: "parati", icon: "⊞",  label: "Para ti" },
      ].map(item => (
        <div key={item.id} style={{
          flex: 1, display: "flex",
          flexDirection: item.id === active ? "row" : "column",
          alignItems: "center", justifyContent: "center",
          gap: item.id === active ? 5 : 2,
          background: item.id === active ? C.navy : "transparent",
          borderRadius: 24, padding: item.id === active ? "7px 12px" : "5px 0",
        }}>
          <span style={{ fontSize: 15 }}>{item.icon}</span>
          <span style={{
            fontSize: 10, fontWeight: item.id === active ? 600 : 400,
            color: item.id === active ? C.white : C.textSec,
          }}>{item.label}</span>
        </div>
      ))}
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
