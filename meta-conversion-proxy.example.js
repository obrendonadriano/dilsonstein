/*
  Exemplo simples de endpoint backend para Meta Conversions API.
  Uso sugerido:
  1. Crie um endpoint seu em Node/Express, Next.js API route, Cloudflare Worker ou servidor proprio.
  2. Defina META_PIXEL_ID e META_ACCESS_TOKEN no ambiente.
  3. Configure window.APP_CONFIG.facebook.conversionProxyUrl apontando para esse endpoint.
*/

const express = require("express");

const app = express();
app.use(express.json());

app.post("/api/facebook-conversion", async (req, res) => {
  try {
    const pixelId = process.env.META_PIXEL_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;

    if (!pixelId || !accessToken) {
      return res.status(500).json({ error: "META_PIXEL_ID ou META_ACCESS_TOKEN ausente." });
    }

    const response = await fetch(`https://graph.facebook.com/v22.0/${pixelId}/events?access_token=${accessToken}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        data: [
          {
            event_name: req.body.event_name,
            event_time: req.body.event_time,
            action_source: req.body.action_source,
            event_source_url: req.body.event_source_url,
            user_data: req.body.user_data,
            custom_data: req.body.custom_data
          }
        ]
      })
    });

    const data = await response.json();
    return res.status(response.ok ? 200 : 500).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log("Proxy Meta ativo em http://localhost:3001/api/facebook-conversion");
});
