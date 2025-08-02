import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import axios from "axios";
import twilio from "twilio";
import routes from "./routes/index.js";
import bodyParser from "body-parser";
import session from "express-session";

const app = express();

app.use(session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: true
}));


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const MessagingResponse = twilio.twiml.MessagingResponse;
const port = 3000;

app.use("/", routes);


app.get("/", (req, res) => {
  res.render('index', { user:req.session.user })
});
app.get("/chat", (req, res) => {
  res.render('index', { user:req.session.user })
});

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: userMessage
              }
            ]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );

    const botReply = response.data.candidates[0].content.parts[0].text;
    res.json({ reply: botReply });

  } catch (err) {
    console.error("Gemini API Error:", err.response?.data || err.message);
    res.status(500).send("Gemini API Error");
  }
});

// Twilio voice endpoint
app.post('/voice', (req, res) => {
  const twiml = `
    <Response>
      <Gather input="speech" action="/process-voice" method="POST">
        <Say voice="alice">How can I help you? This is your AI chatbot.</Say>
      </Gather>
      <Say voice="alice">Thank you!</Say>
    </Response>
  `;
  res.type('text/xml');
  res.send(twiml);
});

// Process voice input
app.post('/process-voice', async (req, res) => {
  const speechResult = req.body.SpeechResult;

  console.log('User said:', speechResult);

  let botReply = "Kuch galti ho gayi, try again!";
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: speechResult }]
          }
        ]
      },
      { headers: { "Content-Type": "application/json" } }
    );

    botReply = response.data.candidates[0].content.parts[0].text;

  } catch (err) {
    console.error("Gemini API Error:", err.response?.data || err.message);
  }

  const twiml = `
    <Response>
      <Say voice="alice">${botReply}</Say>
    </Response>
  `;
  res.type('text/xml');
  res.send(twiml);
});

// WhatsApp webhook
app.post("/whatsapp-webhook", async (req, res) => {
  const twiml = new MessagingResponse();
  const incomingMsg = req.body.Body;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [{ text: incomingMsg }]
          }
        ]
      },
      { headers: { "Content-Type": "application/json" } }
    );

    const botReply = response.data.candidates[0].content.parts[0].text;
    twiml.message(botReply);

  } catch (err) {
    console.error("Gemini API Error:", err.response?.data || err.message);
    twiml.message("Sorry, AI server error.");
  }

  res.writeHead(200, { "Content-Type": "text/xml" });
  res.end(twiml.toString());
});

app.listen(port, () => {
  console.log(`✅ Server running on http://localhost:${port}`);
});
