import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

client.calls
  .create({
    url: 'https://3c7d1f47a912.ngrok-free.app/voice',  // ✅ ngrok link with /voice
    to: '+919785792278',  // ✅ your verified number
    from: fromNumber
  })
  .then(call => console.log('✅ Call SID:', call.sid))
  .catch(error => console.error('❌ Twilio Error:', error));
