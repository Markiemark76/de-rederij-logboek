const http = require("http");
const path = require("path");
const fs = require("fs");
const {
  listUsers,
  getUserById,
  createLogbookEntry,
  getLogbookEntry,
  listLogbookEntries,
  updateLogbookEntry,
  deleteLogbookEntry,
} = require("./database");

const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(new Error("Invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function json(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.end(JSON.stringify(payload));
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

const server = http.createServer(async (req, res) => {
  cors(res);

  if (req.method === "OPTIONS") {
    res.statusCode = 200;
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // API Routes
  if (pathname === "/api/members") {
    if (req.method === "GET") {
      try {
        const members = listUsers();
        json(res, 200, { success: true, data: members });
      } catch (error) {
        json(res, 500, { success: false, error: error.message });
      }
    } else {
      json(res, 405, { success: false, error: "Method not allowed" });
    }
    return;
  }

  if (pathname === "/api/logbook") {
    if (req.method === "GET") {
      try {
        const entries = listLogbookEntries();
        json(res, 200, { success: true, data: entries });
      } catch (error) {
        json(res, 500, { success: false, error: error.message });
      }
      return;
    }

    if (req.method === "POST") {
      try {
        const body = await parseJsonBody(req);
        const entry = createLogbookEntry({
          entryDate: body.entryDate,
          departureTime: body.departureTime,
          arrivalTime: body.arrivalTime,
          skipperId: body.skipperId,
          crewMembers: body.crewMembers,
          windForce: body.windForce,
          motorHoursStart: body.motorHoursStart,
          motorHoursEnd: body.motorHoursEnd,
          route: body.route,
          ports: body.ports,
          waterTaken: body.waterTaken,
          dieselTaken: body.dieselTaken,
          waterRemaining: body.waterRemaining,
          dieselRemaining: body.dieselRemaining,
          damage: body.damage,
          notes: body.notes,
          createdBy: body.createdBy || 1,
        });
        json(res, 201, { success: true, data: entry });
      } catch (error) {
        json(res, 400, { success: false, error: error.message });
      }
      return;
    }
  }

  if (pathname.startsWith("/api/logbook/")) {
    const id = parseInt(pathname.split("/")[3]);

    if (req.method === "GET") {
      try {
        const entry = getLogbookEntry(id);
        if (!entry) {
          json(res, 404, { success: false, error: "Entry not found" });
          return;
        }
        json(res, 200, { success: true, data: entry });
      } catch (error) {
        json(res, 500, { success: false, error: error.message });
      }
      return;
    }

    if (req.method === "PUT") {
      try {
        const body = await parseJsonBody(req);
        const entry = updateLogbookEntry(id, {
          entryDate: body.entryDate,
          departureTime: body.departureTime,
          arrivalTime: body.arrivalTime,
          skipperId: body.skipperId,
          crewMembers: body.crewMembers,
          windForce: body.windForce,
          motorHoursStart: body.motorHoursStart,
          motorHoursEnd: body.motorHoursEnd,
          route: body.route,
          ports: body.ports,
          waterTaken: body.waterTaken,
          dieselTaken: body.dieselTaken,
          waterRemaining: body.waterRemaining,
          dieselRemaining: body.dieselRemaining,
          damage: body.damage,
          notes: body.notes,
        });
        json(res, 200, { success: true, data: entry });
      } catch (error) {
        json(res, 400, { success: false, error: error.message });
      }
      return;
    }

    if (req.method === "DELETE") {
      try {
        deleteLogbookEntry(id);
        json(res, 200, { success: true, message: "Entry deleted" });
      } catch (error) {
        json(res, 500, { success: false, error: error.message });
      }
      return;
    }
  }

  // Static files
  if (pathname === "/" || pathname === "/index.html") {
    res.setHeader("Content-Type", "text/html");
    res.end(fs.readFileSync(path.join(__dirname, "dist", "index.html")));
    return;
  }

  if (pathname.startsWith("/assets/")) {
    const file = path.join(__dirname, "dist", pathname);
    const ext = path.extname(file);
    const contentTypes = {
      ".js": "application/javascript",
      ".css": "text/css",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".svg": "image/svg+xml",
    };
    if (fs.existsSync(file)) {
      res.setHeader("Content-Type", contentTypes[ext] || "application/octet-stream");
      res.end(fs.readFileSync(file));
      return;
    }
  }

  json(res, 404, { success: false, error: "Not found" });
});

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
