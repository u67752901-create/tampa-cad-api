import express from "express";
import fs from "fs";
import cors from "cors";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// Directory for storing JSON files
const DATA_DIR = path.resolve("data");

// GET file
app.get("/api/get/:file", (req, res) => {
  const file = path.join(DATA_DIR, req.params.file);
  if (!fs.existsSync(file)) return res.json([]);
  const data = fs.readFileSync(file, "utf8");
  res.send(data);
});

// SAVE file
app.post("/api/save/:file", (req, res) => {
  const file = path.join(DATA_DIR, req.params.file);
  fs.writeFileSync(file, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

// Render provides PORT via env variable
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CAD API running on ${PORT}`));
