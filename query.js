import mongoose from "mongoose";

const querySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String
  },
  status: {
    type: String,
    enum: ["open", "closed"],
    default: "open"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  answeredAt: {
    type: Date
  }
});

const Query = mongoose.model("Query", querySchema);

export default Query;
