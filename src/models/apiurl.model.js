import mongoose, { Schema } from "mongoose";

const apiUrlSchema = new Schema({
  whatsappApiUrl: {
    type: String,
    required: true,
  },
  smsApiUrl: {
    type: String,
    required: true,
  },
}, {
  timestamps: true,
});

export const ApiUrl = mongoose.model('ApiUrl', apiUrlSchema);
