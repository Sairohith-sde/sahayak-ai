import mongoose from 'mongoose';
import { registerMongooseModel } from '../utils/repository.js';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['worker', 'supervisor'], default: 'worker' },
  supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  languagePref: { type: String, default: 'en' },
  createdAt: { type: Date, default: Date.now }
});

registerMongooseModel('User', UserSchema);

export default UserSchema;
