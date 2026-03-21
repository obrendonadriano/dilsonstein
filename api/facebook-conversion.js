const crypto = require("crypto");

module.exports = async (req, res) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const pixelId = process.env.META_PIXEL_ID || "928735966754524";
    const accessToken = process.env.META_ACCESS_TOKEN;

    if (!accessToken) {
      res.status(500).json({ error: "META_ACCESS_TOKEN ausente." });
      return;
    }

    const payload = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const metaPayload = {
      test_event_code: payload.test_event_code || undefined,
      data: [
        {
          event_name: payload.event_name || "Lead",
          event_time: payload.event_time || Math.floor(Date.now() / 1000),
          action_source: payload.action_source || "website",
          event_source_url: payload.event_source_url || "",
          user_data: hashUserData(payload.user_data || {}),
          custom_data: payload.custom_data || {}
        }
      ]
    };

    const response = await fetch(`https://graph.facebook.com/v22.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(metaPayload)
    });

    const data = await response.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

function hashUserData(userData) {
  const passthroughKeys = new Set(["client_user_agent", "fbc", "fbp"]);
  const hashed = {};

  Object.entries(userData).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (passthroughKeys.has(key)) {
      hashed[key] = value;
      return;
    }

    hashed[key] = sha256(normalizeForHash(String(value)));
  });

  return hashed;
}

function normalizeForHash(value) {
  return value.trim().toLowerCase();
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

