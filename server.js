import express from "express";
import fs from "fs";
import cors from "cors";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// Directory for storing JSON files
const DATA_DIR = path.resolve("data");

// Make sure folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// List of CAD collections
const COLLECTIONS = [
  "civilians",
  "vehicles",
  "units_police",
  "units_fire",
  "units_ems",
  "calls",
  "bolos",
  "warrants",
  "citations",
  "arrests",
  "crash_reports",
  "incident_reports",
  "officer_messages",
  "history"
];

// Load one file
function loadFile(name) {
  const file = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(file)) return [];
  try {
    const raw = fs.readFileSync(file, "utf8");
    return raw.trim() ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Save one file
function saveFile(name, data) {
  const file = path.join(DATA_DIR, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ------------------------------
// OLD ENDPOINTS (KEEP FOR SAFETY)
// ------------------------------
app.get("/api/get/:file", (req, res) => {
  const file = path.join(DATA_DIR, req.params.file);
  if (!fs.existsSync(file)) return res.json([]);
  const data = fs.readFileSync(file, "utf8");
  res.send(data);
});

app.post("/api/save/:file", (req, res) => {
  const file = path.join(DATA_DIR, req.params.file);
  fs.writeFileSync(file, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

// ------------------------------
// NEW ENDPOINTS FOR YOUR MDT
// ------------------------------

// GET EVERYTHING
app.get("/api/get", (req, res) => {
  const out = {};
  for (const col of COLLECTIONS) {
    out[col] = loadFile(col);
  }
  res.json(out);
});

// SAVE A SPECIFIC COLLECTION
app.post("/api/save", (req, res) => {
  const { collection, data } = req.body;

  if (!collection || !COLLECTIONS.includes(collection)) {
    return res.status(400).json({
      ok: false,
      error: "Invalid or missing collection name"
    });
  }

  if (!Array.isArray(data)) {
    return res.status(400).json({
      ok: false,
      error: "Data must be an array"
    });
  }

  saveFile(collection, data);
  res.json({ ok: true });
});

// ------------------------------
// PORT SETUP (Render)
// ------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CAD API running on ${PORT}`));
