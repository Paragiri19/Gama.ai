export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  try {
    const { history = [], mode = "LITE" } = req.body;

    const SYSTEM = `You are GAMA.

Current active mode: ${mode}

Follow personality strictly.`;

    const messages = [
      { role: "system", content: SYSTEM },
      ...history.slice(-10)
    ];

    let reply = "";

    // 🔥 MYTHOS → GROQ (multiple keys rotation)
    if (mode === "MYTHOS") {
      const keys = process.env.GROQ_KEYS.split(",");
      const key = keys[Math.floor(Math.random() * keys.length)];

      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          temperature: 0.9,
          messages
        })
      });

      const d = await r.json();
      reply = d.choices?.[0]?.message?.content;
    }

    // ⚡ FLUX → GEMINI
    else if (mode === "FLUX") {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: messages.map(m => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }]
            }))
          })
        }
      );

      const d = await r.json();
      reply = d.candidates?.[0]?.content?.parts?.[0]?.text;
    }

    // 🧊 LITE → TOGETHER
    else {
      const r = await fetch("https://api.together.xyz/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.TOGETHER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
          temperature: 0.7,
          messages
        })
      });

      const d = await r.json();
      reply = d.choices?.[0]?.message?.content;
    }

    res.json({ reply: reply || "No reply" });

  } catch {
    res.json({ reply: "Server error" });
  }
      }
