import express from "express";
import fs from "fs";
import cors from "cors";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

// Directory for storing JSON files
const DATA_DIR = path.resolve("data");

// Helper functions
function filePath(file) {
  return path.join(DATA_DIR, file);
}

function readJson(file) {
  const p = filePath(file);
  if (!fs.existsSync(p)) return { locks: [] };
  try {
    const raw = fs.readFileSync(p, "utf8") || "{}";
    return JSON.parse(raw);
  } catch {
    return { locks: [] };
  }
}

function writeJson(file, data) {
  const p = filePath(file);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");
}

// ======================================================
// GET file
// ======================================================
app.get("/api/get/:file", (req, res) => {
  const file = filePath(req.params.file);
  if (!fs.existsSync(file)) return res.json([]);
  const data = fs.readFileSync(file, "utf8");
  res.send(data);
});

// ======================================================
// SAVE file
// ======================================================
app.post("/api/save/:file", (req, res) => {
  const file = filePath(req.params.file);
  fs.writeFileSync(file, JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

// ======================================================
// 🔓 UNLOCK ENDPOINT (Called by Discord button)
// ======================================================
app.post("/api/unlock", (req, res) => {
  const { lockoutId } = req.body;

  if (!lockoutId) {
    return res.json({ success: false, message: "Missing Lockout ID" });
  }

  let lockData = readJson("user_lockouts.json");

  const before = lockData.locks.length;

  // Remove lockout entry by lockoutId
  lockData.locks = lockData.locks.filter(l => l.lockoutId !== lockoutId);

  const after = lockData.locks.length;

  writeJson("user_lockouts.json", lockData);

  if (after === before) {
    return res.json({ success: false, message: "Invalid Lockout ID" });
  }

  return res.json({ success: true, message: "User unlocked successfully" });
});

// ======================================================
// 🔘 DISCORD INTERACTION HANDLER (button clicks)
// ======================================================
app.post("/interactions", async (req, res) => {
  const interaction = req.body;

  // Button click
  if (interaction.type === 3) {
    const customId = interaction.data.custom_id;

    // Unlock button?
    if (customId.startsWith("unlock_")) {
      const lockoutId = customId.replace("unlock_", "");

      // Call unlock endpoint internally
      let result = await fetch("https://tampa-cad-api.onrender.com/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lockoutId })
      }).then(r => r.json());

      return res.send({
        type: 4,
        data: {
          content: result.success
            ? `🔓 **User unlocked** (Lockout ID: \`${lockoutId}\`)`
            : `❌ Unlock failed. Invalid Lockout ID.`,
          flags: 64 // ephemeral response
        }
      });
    }
  }

  // Default
  return res.send({ type: 4, data: { content: "Unknown interaction.", flags: 64 } });
});

// ======================================================
// SERVER START
// ======================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`CAD API running on ${PORT}`));
