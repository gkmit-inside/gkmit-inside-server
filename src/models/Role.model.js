import mongoose from 'mongoose';
import { ROLES } from '../constants/roles.js';

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: [ROLES.EMPLOYEE, ROLES.ADMIN],
    },
  },
  { timestamps: true }
);

export const Role = mongoose.model('Role', roleSchema);
