import mongoose from 'mongoose';
import { registerMongooseModel } from '../utils/repository.js';

const EscalationSchema = new mongoose.Schema({
  visitId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visit', default: null },
  supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date, default: null }
});

registerMongooseModel('Escalation', EscalationSchema);

export default EscalationSchema;
