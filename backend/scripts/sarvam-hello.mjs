import { SarvamAIClient } from "sarvamai";

if (!process.env.SARVAM_API_KEY) {
  console.error("SARVAM_API_KEY is not set. Paste your key into backend/.env first.");
  process.exit(1);
}

const client = new SarvamAIClient({ apiSubscriptionKey: process.env.SARVAM_API_KEY });

const response = await client.chat.completions({
  model: "sarvam-105b-conversations",
  messages: [{ role: "user", content: "Namaste! Ek line mein apna parichay dijiye." }],
});

console.log(response.choices[0].message.content);
