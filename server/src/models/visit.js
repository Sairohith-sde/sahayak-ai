import mongoose from 'mongoose';
import { registerMongooseModel } from '../utils/repository.js';

const VisitSchema = new mongoose.Schema({
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
  inputMode: { type: String, enum: ['voice', 'typed'], default: 'typed' },
  rawTranscript: { type: String, required: true },
  extractedData: {
    observations: [{ type: String }],
    riskIndicators: [{ type: String }],
    followUpNeeded: { type: String, default: 'no' }, // "yes" | "no"
    followUpReason: { type: String, default: '' }
  },
  riskLevel: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'critical'], 
    default: 'low' 
  },
  riskJustification: { type: String, default: '' },
  report: { type: mongoose.Schema.Types.Mixed, default: {} },
  embedding: { type: [Number], default: [] },
  status: { 
    type: String, 
    enum: ['pending_review', 'reviewed', 'escalated'], 
    default: 'pending_review' 
  },
  trace: [{
    stage: { type: String },
    input: { type: mongoose.Schema.Types.Mixed },
    output: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now }
  }]
});

registerMongooseModel('Visit', VisitSchema);

export default VisitSchema;
