import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path, { dirname } from "path";
import dotenv from "dotenv";
import { connectDB } from "./db.ts";
import { Tracks } from "./models/TrackerEvent.ts";
import { validateEvents } from "./validate.ts";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const appHTML = express();

const PORT_APP = process.env.PORT_APP || 50000;
const PORT_TRACKER = process.env.PORT_TRACKER || 8888;

connectDB();

const corsOptions = {
  origin: ["http://localhost:50000", "http://localhost:8888"],
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
appHTML.use(cors(corsOptions));

app.use(bodyParser.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.get("/tracker", (_, res) => {
  res.type("application/javascript");
  res.sendFile(path.join(__dirname, "tracker.js"));
});

app.post("/track", async (req, res) => {
  const events = req.body;
  if (!Array.isArray(events) || !validateEvents(events)) {
    return res.status(422).send({ error: "Invalid events" });
  }

  res.status(200).send({ status: "ok" });

  Promise.allSettled(events.map((event) => Tracks.insertMany(event)))
    .then((results) => {
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(`Error saving event ${index}:`, result.reason);
        }
      });
    })
    .catch((error) => {
      console.error("Error saving events:", error);
    });
});

appHTML.get("/:page.html", (req, res) => {
  const { page } = req.params;
  const validPages = ["1", "2", "3"];

  if (!validPages.includes(page)) {
    return res.status(404).send("Page not found");
  }
  res.type("text/html");
  res.sendFile(path.join(__dirname, `../client/${page}.html`));
});

app.listen(PORT_TRACKER, () =>
  console.log(`Server tracker running on http://localhost:${PORT_TRACKER}`),
);

appHTML.listen(PORT_APP, () =>
  console.log(`Server app running on http://localhost:${PORT_APP}`),
);
