import mongoose from "mongoose";

const url = 'mongodb://localhost:27017/chatbot';

mongoose.connect(url, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB connected!'))
  .catch(err => console.log('❌ Connection error:', err));

const userschema = new mongoose.Schema({
  name: String,
  email: String,  
  password: String,
  role: {
    type: String,
    default: "admin" 
    
  
  } ,

   isBlocked: { type: Boolean, default: false }

});

const User = mongoose.model('users', userschema);

export default User;  // ✅ ES module style export
