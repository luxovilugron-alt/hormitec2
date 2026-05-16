import { useState, useRef } from 'react'

const KEY = import.meta.env.VITE_ANTHROPIC_KEY

const zonas = [
  { value: 'costa', label: 'Costa / Zona normal' },
  { value: 'mar', label: 'Mar / Exposición a sulfatos' },
  { value: 'norte', label: 'Norte / Zona seca y árida' },
  { value: 'montana', label: 'Montaña / Cordillera con hielo' },
  { value: 'sur', label: 'Sur / Zona lluviosa' },
]

const modulos = [
  { value: 'radier', label: '🏗️ Radier' },
  { value: 'losa', label: '🧱 Losa' },
  { value: 'muro', label: '🪟 Muro' },
  { value: 'otro', label: '📐 Otro elemento' },
]

export default function App() {
  const [modulo, setModulo] = useState('radier')
  const [zona, setZona] = useState('costa')
  const [mpa, setMpa] = useState('')
  const [bombeable, setBombeable] = useState('no')
  const [largo, setLargo] = useState('')
  const [ancho, setAncho] = useState('')
  const [espesor, setEspesor] = useState('')
  const [altura, setAltura] = useState('')
  const [enfierradura, setEnfierradura] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [resultado, setResultado] = useState(null)
  const [cargando, setCargando] = useState(false)
  const [escuchando, setEscuchando] = useState(false)
  const recognitionRef = useRef(null)

  const iniciarMicrofono = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return alert('Tu navegador no soporta micrófono')
    const rec = new SR()
    rec.lang = 'es-CL'
    rec.continuous = false
    rec.interimResults = false
    rec.onresult = (e) => {
      const texto = e.results[0][0].transcript
      setDescripcion(prev => prev + ' ' + texto)
      setEscuchando(false)
    }
    rec.onerror = () => setEscuchando(false)
    rec.onend = () => setEscuchando(false)
    recognitionRef.current = rec
    rec.start()
    setEscuchando(true)
  }

  const calcularVolumen = () => {
    const l = parseFloat(largo) || 0
    const e = parseFloat(espesor) / 100 || 0
    const h = parseFloat(altura) || 0
    const a = parseFloat(ancho) || 0
    if (modulo === 'muro') return (l * h * e * 1.05).toFixed(2)
    return (l * a * e * 1.05).toFixed(2)
  }

  const generarFicha = async () => {
    if (!descripcion.trim()) return alert('Por favor describe tu situación primero')
    setCargando(true)
    setResultado(null)

    const volumen = calcularVolumen()

    const prompt = `Eres un experto en hormigón y la norma chilena NCh170. 
Un maestro o capataz te describe su obra. Debes generar una ficha técnica de pedido de hormigón.

DATOS INGRESADOS:
- Tipo de elemento: ${modulo}
- Zona geográfica: ${zona}
- Resistencia requerida: ${mpa || 'no especificada'} MPa
- ¿Bombeable?: ${bombeable}
- Volumen calculado (con 5% desperdicio): ${volumen} m³
${modulo === 'muro' ? `- Enfierradura declarada: ${enfierradura}` : ''}

DESCRIPCIÓN DEL MAESTRO:
"${descripcion}"

Responde SOLO con este formato JSON, sin texto adicional ni markdown:
{
  "grado": "G25 (ejemplo)",
  "mpa": "25 MPa",
  "tmc": "TMN 20mm",
  "cono": "Cono 10",
  "bombeable": "Sí o No",
  "volumen": "${volumen} m³",
  "aditivos": "ninguno o descripción",
  "observaciones": "texto breve con recomendaciones según NCh170",
  "resumen_whatsapp": "texto listo para enviar a la planta hormigonera"
}`

    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }]
        })
      })
      const data = await res.json()
      const texto = data.content[0].text
      const clean = texto.replace(/```json|```/g, '').trim()
      const ficha = JSON.parse(clean)
      setResultado(ficha)
    } catch (e) {
      alert('Error al generar la ficha. Revisa tu conexión o API key.')
    }
    setCargando(false)
  }

  const enviarWhatsApp = () => {
    if (!resultado) return
    const msg = `*FICHA DE PEDIDO — HORMITEC*\n\n${resultado.resumen_whatsapp}\n\n_Generado por Hormitec_`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const selectStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 15,
    marginBottom: 14,
    boxSizing: 'border-box',
    background: '#fff',
    color: '#1a1a2e',
    appearance: 'auto',
  }

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 15,
    marginBottom: 14,
    boxSizing: 'border-box',
    background: '#fff',
    color: '#1a1a2e',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0ede8', fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ background: '#1a1a2e', padding: '16px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ background: '#e8a020', borderRadius: 8, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: '#fff', fontSize: 20 }}>H</div>
        <div>
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 22, letterSpacing: 1 }}>HORMITEC</div>
          <div style={{ color: '#aaa', fontSize: 13 }}>Ficha técnica de hormigón con IA</div>
        </div>
      </div>

      <div style={{ maxWidth: 520, margin: '28px auto', padding: '0 16px' }}>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {modulos.map(m => (
            <button key={m.value}
              onClick={() => setModulo(m.value)}
              style={{
                padding: '8px 14px', borderRadius: 20,
                border: `2px solid ${modulo === m.value ? '#e8a020' : '#ddd'}`,
                background: modulo === m.value ? '#e8a020' : '#fff',
                color: modulo === m.value ? '#fff' : '#555',
                fontWeight: modulo === m.value ? 'bold' : 'normal',
                cursor: 'pointer', fontSize: 14
              }}>
              {m.label}
            </button>
          ))}
        </div>

        <div style={{ background: '#fff', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 18px', fontSize: 17, color: '#1a1a2e' }}>Datos de la obra</h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Largo (m)</label>
              <input style={inputStyle} type="number" placeholder="Ej: 10" value={largo} onChange={e => setLargo(e.target.value)} />
            </div>
            {modulo !== 'muro' && (
              <div>
                <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Ancho (m)</label>
                <input style={inputStyle} type="number" placeholder="Ej: 8" value={ancho} onChange={e => setAncho(e.target.value)} />
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Espesor (cm)</label>
              <input style={inputStyle} type="number" placeholder="Ej: 10" value={espesor} onChange={e => setEspesor(e.target.value)} />
            </div>
            {modulo === 'muro' && (
              <div>
                <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Altura muro (m)</label>
                <input style={inputStyle} type="number" placeholder="Ej: 2.4" value={altura} onChange={e => setAltura(e.target.value)} />
              </div>
            )}
          </div>

          {modulo === 'muro' && (
            <>
              <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Enfierradura (indicada por calculista)</label>
              <input style={inputStyle} type="text" placeholder="Ej: barras 12mm cada 20cm" value={enfierradura} onChange={e => setEnfierradura(e.target.value)} />
              <p style={{ fontSize: 12, color: '#999', marginTop: -10, marginBottom: 14 }}>Indica el diámetro y espaciado. Hormitec ajustará el árido máximo para que pase entre las barras.</p>
            </>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Resistencia (MPa)</label>
              <input style={inputStyle} type="number" placeholder="Ej: 25" value={mpa} onChange={e => setMpa(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>¿Bombeable?</label>
              <select style={selectStyle} value={bombeable} onChange={e => setBombeable(e.target.value)}>
                <option value="no">No</option>
                <option value="si">Sí</option>
              </select>
            </div>
          </div>

          <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Zona geográfica</label>
          <select style={selectStyle} value={zona} onChange={e => setZona(e.target.value)}>
            {zonas.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
          </select>

          <label style={{ fontSize: 13, color: '#555', display: 'block', marginBottom: 4 }}>Describe tu situación a la IA 🤖</label>
          <div style={{ position: 'relative', marginBottom: 6 }}>
            <textarea
              style={{ ...inputStyle, height: 100, resize: 'vertical', marginBottom: 0, paddingRight: 44 }}
              placeholder="Cuéntanos sobre tu obra..."
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
            />
            <button onClick={iniciarMicrofono}
              style={{ position: 'absolute', right: 10, top: 10, background: escuchando ? '#e8a020' : '#f0ede8', border: 'none', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', fontSize: 18 }}>
              {escuchando ? '🔴' : '🎙️'}
            </button>
          </div>
          <p style={{ fontSize: 12, color: '#999', marginBottom: 14, lineHeight: 1.5 }}>
            Para mejores resultados menciona: tipo de estructura · cómo se vaciará el hormigón (bomba, canaleta, balde) · exposición a humedad, sulfatos, hielo o agua de mar · ambiente agresivo · árido máximo restringido por enfierradura · fecha estimada de hormigonado.
          </p>

          <button onClick={generarFicha} disabled={cargando}
            style={{ width: '100%', padding: 14, background: '#e8a020', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 'bold', fontSize: 16, cursor: 'pointer' }}>
            {cargando ? '⏳ Generando ficha...' : '⚡ Generar Ficha Técnica con IA'}
          </button>
        </div>

        {resultado && (
          <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 24, boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
            <h3 style={{ color: '#e8a020', margin: '0 0 16px', fontSize: 15, textTransform: 'uppercase', letterSpacing: 1 }}>📋 Ficha de Pedido</h3>
            {[
              ['Grado', resultado.grado],
              ['Resistencia', resultado.mpa],
              ['Árido Máx. Nominal', resultado.tmc],
              ['Consistencia (Cono)', resultado.cono],
              ['Bombeable', resultado.bombeable],
              ['Volumen a pedir', resultado.volumen],
              ['Aditivos', resultado.aditivos],
            ].map(([label, valor]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ffffff15', paddingBottom: 9, marginBottom: 9 }}>
                <span style={{ color: '#aaa', fontSize: 14 }}>{label}</span>
                <span style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{valor}</span>
              </div>
            ))}
            <div style={{ background: '#ffffff12', borderRadius: 8, padding: 12, marginTop: 12, color: '#ccc', fontSize: 13, lineHeight: 1.5 }}>
              <strong style={{ color: '#e8a020' }}>Observaciones NCh170:</strong><br />
              {resultado.observaciones}
            </div>
            <button onClick={enviarWhatsApp}
              style={{ width: '100%', marginTop: 16, padding: 13, background: '#25D366', border: 'none', borderRadius: 10, color: '#fff', fontWeight: 'bold', fontSize: 15, cursor: 'pointer' }}>
              📲 Enviar por WhatsApp a la planta
            </button>
          </div>
        )}
      </div>
    </div>
  )
}