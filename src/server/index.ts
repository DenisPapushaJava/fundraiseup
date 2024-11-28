import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import mongoose from 'mongoose';
import {fileURLToPath} from 'url';
import{dirname} from 'path'


const app = express();
const PAGE_PORT = 50000;
const PORT = 8888;


const corsOptions = {
  origin: ['http://localhost:50000', 'https://localhost:8888'],
  optionsSuccessStatus: 200,
}
app.use(cors(corsOptions));
app.use(bodyParser.json());


mongoose.connect("mongodb://localhost:27017/tracker");
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => console.log("Connected to MongoDB"));

const eventSchema = new mongoose.Schema({
  event: String,
  tags:[String],
  url: String,
  title: String,
  ts: Number,
})

const Event = mongoose.model("Event", eventSchema);

app.post("/track", async (req, res) => {
  const events = req.body;
  if(!Array.isArray(events)){
    return res.status(422).send({error: "Invalid format"})
  }
  res.status(200).send({message: "Events received"});

  try{
    await Event.insertMany(events);
  } catch(error) {
    console.error("Error mongo:", error)
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.get("/tracker", (req, res) =>{
  res.setHeader("Content-Type", "application/javascript");
  res.sendFile(path.join(__dirname, "./tracker.js"));
})

const pageApp = express();
pageApp.use(express.static("public"));
pageApp.listen(PAGE_PORT, () => console.log(`Page server running on http://localhost:${PAGE_PORT}`))

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
