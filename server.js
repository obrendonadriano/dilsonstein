const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const ROOT = __dirname;
const PORT = 8080;
const META_PIXEL_ID = process.env.META_PIXEL_ID || "928735966754524";
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".sql": "text/plain; charset=utf-8"
};

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url) {
      res.writeHead(400);
      res.end("Bad Request");
      return;
    }

    const requestUrl = new URL(req.url, `http://${req.headers.host}`);

    if (requestUrl.pathname === "/api/facebook-conversion" && req.method === "POST") {
      const body = await readJsonBody(req);
      console.log("[Meta CAPI] Evento recebido no proxy:", {
        event_name: body.event_name,
        test_event_code: body.test_event_code || "",
        city: body.user_data?.ct || "",
        has_phone: Boolean(body.user_data?.ph)
      });
      const result = await forwardToMeta(body);
      console.log("[Meta CAPI] Resposta da Meta:", result.data);

      res.writeHead(result.statusCode, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      });
      res.end(JSON.stringify(result.data));
      return;
    }

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      });
      res.end();
      return;
    }

    let filePath = path.join(ROOT, decodeURIComponent(requestUrl.pathname));
    if (requestUrl.pathname === "/") filePath = path.join(ROOT, "index.html");

    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.stat(filePath, (statError, stats) => {
      let resolvedPath = filePath;

      if (!statError && stats.isDirectory()) {
        resolvedPath = path.join(filePath, "index.html");
      } else if (statError && !path.extname(filePath)) {
        const htmlPath = `${filePath}.html`;
        const nestedIndexPath = path.join(filePath, "index.html");

        if (fs.existsSync(htmlPath)) {
          resolvedPath = htmlPath;
        } else if (fs.existsSync(nestedIndexPath)) {
          resolvedPath = nestedIndexPath;
        }
      }

      fs.readFile(resolvedPath, (error, content) => {
        if (error) {
          if (error.code === "ENOENT") {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Not Found");
            return;
          }

          res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
          res.end("Internal Server Error");
          return;
        }

        const ext = path.extname(resolvedPath).toLowerCase();
        res.writeHead(200, {
          "Content-Type": MIME_TYPES[ext] || "application/octet-stream"
        });
        res.end(content);
      });
    });
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: error.message }));
  }
});

server.listen(PORT, () => {
  console.log(`Dilson Stein local server ativo em http://127.0.0.1:${PORT}`);
});

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";

    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

function forwardToMeta(payload) {
  return new Promise((resolve, reject) => {
    if (!META_ACCESS_TOKEN) {
      resolve({
        statusCode: 500,
        data: { error: "META_ACCESS_TOKEN ausente." }
      });
      return;
    }

    const postData = JSON.stringify({
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
    });

    const options = {
      hostname: "graph.facebook.com",
      path: `/v22.0/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(META_ACCESS_TOKEN)}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(postData)
      }
    };

    const request = https.request(options, (response) => {
      let raw = "";

      response.on("data", (chunk) => {
        raw += chunk;
      });

      response.on("end", () => {
        try {
          resolve({
            statusCode: response.statusCode || 500,
            data: raw ? JSON.parse(raw) : {}
          });
        } catch (error) {
          reject(error);
        }
      });
    });

    request.on("error", reject);
    request.write(postData);
    request.end();
  });
}

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
