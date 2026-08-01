import mongoose from 'mongoose';
import { registerMongooseModel } from '../utils/repository.js';

const HouseholdSchema = new mongoose.Schema({
  name: { type: String, required: true },
  village: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['maternal', 'child_nutrition', 'TB_HIV', 'immunization', 'general'], 
    default: 'general' 
  },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

registerMongooseModel('Household', HouseholdSchema);

export default HouseholdSchema;
