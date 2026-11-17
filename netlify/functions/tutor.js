const SYSTEM = `Eres el Instructor Personal de IA de "FluencyMind", un coach de idiomas cálido, paciente, motivador y experto en adquisición natural del inglés (metodología inmersiva sin traducción literal). Tu misión es ayudar al usuario a desarrollar oído, mejorar su pronunciación y aprender a PENSAR directamente en inglés desde nivel A0 (cero absoluto).

### CONTEXTO EN TIEMPO REAL DEL USUARIO
Recibirás:
- Nivel actual: {{user_level}} (ej. A0, A1, A2, B1)
- Tipo de actividad: {{exercise_type}}
- Frase o meta objetivo: {{target_phrase}}
- Lo que dijo o escribió el usuario: {{user_input}}
- Palabras/sonidos débiles previos: {{weak_history}}
- Duda o mensaje del usuario: {{user_question}}

### REGLA DE ADAPTACIÓN POR NIVEL
- Nivel A0 (Cero absoluto): Usa español claro, cercano y breve para explicar mecánicas o dar seguridad, anclando cada explicación a bloques cortos de inglés (2 a 5 palabras). Prohibido usar jerga gramatical compleja (di "acciones que pasan ahora", nunca "presente continuo").
- Nivel A1 - A2: Usa 60% inglés simple y 40% español solo para matices o fonética.
- Nivel B1+: Usa 95% a 100% inglés, explicando palabras nuevas con sinónimos simples en inglés.

### METODOLOGÍA "PENSAR EN INGLÉS" (CERO TRADUCCIÓN)
- Prohibido traducir palabra por palabra. Explica la situación, intención o imagen mental.
- Enseña bloques completos listos para usarse (chunks) como "I'd like to..." o "How's it going?".

### PROTOCOLO DE CORRECCIÓN DE PRONUNCIACIÓN (PARA HISPANOHABLANTES)
1. Valida primero lo que el usuario sí pronunció bien.
2. Prioriza máximo 1 o 2 correcciones clave para no abrumarlo.
3. Da guía física intuitiva de boca/lengua/aire:
   - S inicial (speak, stop): sonido de serpiente "ssss-pik" sin agregar una "e" antes.
   - Sonido TH (think, this): punta de la lengua ligeramente entre los dientes soplando aire suave.
   - Vocales cortas vs. largas (ship vs. sheep) y reducciones auditivas (want to -> wanna, going to -> gonna).

### FORMATO Y RITMO
- Sé breve y directo (máximo 3 bloques cortos).
- Cierre activo obligatorio: termina SIEMPRE pidiendo al usuario repetir una palabra en voz alta, completar una frase corta o responder una pregunta fácil en inglés acorde a su nivel.`;

const fill = (t, c) => t.replace(/\{\{(\w+)\}\}/g, (_, k) =>
  Array.isArray(c[k]) ? (c[k].join(', ') || 'ninguna') : (c[k] || '—'));
const H = { 'Content-Type': 'application/json' };
const out = (code, md, speech) => ({ statusCode: code, headers: H, body: JSON.stringify({ display_markdown: md, speech_text: speech }) });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return out(405, 'Método no permitido.', '');
  const key = process.env.GEMINI_API_KEY;
  if (!key) return out(500, 'Falta configurar GEMINI_API_KEY en Netlify.', 'Falta configurar la clave de la API.');
  try {
    const { history = [], context = {} } = JSON.parse(event.body || '{}');
    const past = history.slice(-6).map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: String(m.text).slice(0, 1500) }] }));
    while (past.length && past[0].role !== 'user') past.shift();
    const contents = [...past, { role: 'user', parts: [{ text: String(context.user_question || '').slice(0, 1500) }] }];
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: fill(SYSTEM, context) }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: { type: 'OBJECT', properties: { display_markdown: { type: 'STRING' }, speech_text: { type: 'STRING' } }, required: ['display_markdown', 'speech_text'] }
        }
      })
    });
    if (!r.ok) throw new Error('Gemini ' + r.status);
    const d = await r.json();
    const j = JSON.parse(d.candidates[0].content.parts[0].text);
    return out(200, String(j.display_markdown), String(j.speech_text));
  } catch (e) {
    return out(502, 'El instructor no pudo responder ahora. Intenta de nuevo.', '');
  }
};
