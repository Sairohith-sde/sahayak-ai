import mongoose from 'mongoose';
import { isMongoMode } from '../config/db.js';

// In-memory collections store for Fallback Memory Mode
const MEMORY_DB = {
  User: [],
  Household: [],
  Visit: [],
  Escalation: []
};

// Map collections to Mongoose models dynamically
let mongooseModels = {};

export function registerMongooseModel(name, schema) {
  mongooseModels[name] = mongoose.models[name] || mongoose.model(name, schema);
}

// Generate unique string IDs for Memory Mode
function generateId() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

// Helper to filter items in Memory Mode
function filterItems(items, filter) {
  if (!filter || Object.keys(filter).length === 0) return items;
  return items.filter(item => {
    return Object.entries(filter).every(([key, val]) => {
      if (val && typeof val === 'object' && val.$in) {
        return val.$in.includes(item[key]);
      }
      return String(item[key]) === String(val);
    });
  });
}

// Helper to sort items in Memory Mode
function sortItems(items, sort) {
  if (!sort || Object.keys(sort).length === 0) return items;
  const sorted = [...items];
  const [field, direction] = Object.entries(sort)[0];
  const dirMultiplier = direction === 'desc' || direction === -1 ? -1 : 1;

  return sorted.sort((a, b) => {
    let valA = a[field];
    let valB = b[field];

    if (valA instanceof Date) valA = valA.getTime();
    if (valB instanceof Date) valB = valB.getTime();

    if (valA < valB) return -1 * dirMultiplier;
    if (valA > valB) return 1 * dirMultiplier;
    return 0;
  });
}

export const repository = {
  async getAll(collection, filter = {}, sort = null) {
    if (isMongoMode() && mongooseModels[collection]) {
      let query = mongooseModels[collection].find(filter);
      if (sort) {
        query = query.sort(sort);
      }
      return await query.lean();
    } else {
      let items = MEMORY_DB[collection] || [];
      items = filterItems(items, filter);
      if (sort) {
        items = sortItems(items, sort);
      }
      return JSON.parse(JSON.stringify(items)); // clone
    }
  },

  async getById(collection, id) {
    if (isMongoMode() && mongooseModels[collection]) {
      try {
        return await mongooseModels[collection].findById(id).lean();
      } catch (err) {
        return null;
      }
    } else {
      const items = MEMORY_DB[collection] || [];
      const found = items.find(item => String(item._id || item.id) === String(id));
      return found ? JSON.parse(JSON.stringify(found)) : null;
    }
  },

  async getOne(collection, filter) {
    if (isMongoMode() && mongooseModels[collection]) {
      return await mongooseModels[collection].findOne(filter).lean();
    } else {
      const items = MEMORY_DB[collection] || [];
      const filtered = filterItems(items, filter);
      return filtered.length > 0 ? JSON.parse(JSON.stringify(filtered[0])) : null;
    }
  },

  async create(collection, data) {
    const rawData = { ...data };
    if (!rawData.createdAt && !rawData.timestamp) {
      rawData.createdAt = new Date();
    }

    if (isMongoMode() && mongooseModels[collection]) {
      const newDoc = new mongooseModels[collection](rawData);
      const saved = await newDoc.save();
      return saved.toObject();
    } else {
      rawData._id = rawData._id || generateId();
      rawData.id = rawData._id;
      if (!MEMORY_DB[collection]) MEMORY_DB[collection] = [];
      MEMORY_DB[collection].push(rawData);
      return JSON.parse(JSON.stringify(rawData));
    }
  },

  async updateById(collection, id, updates) {
    if (isMongoMode() && mongooseModels[collection]) {
      try {
        return await mongooseModels[collection]
          .findByIdAndUpdate(id, { $set: updates }, { new: true })
          .lean();
      } catch (err) {
        return null;
      }
    } else {
      if (!MEMORY_DB[collection]) return null;
      const idx = MEMORY_DB[collection].findIndex(item => String(item._id || item.id) === String(id));
      if (idx === -1) return null;

      MEMORY_DB[collection][idx] = {
        ...MEMORY_DB[collection][idx],
        ...updates
      };
      return JSON.parse(JSON.stringify(MEMORY_DB[collection][idx]));
    }
  },

  async upsert(collection, filter, createData, updateData) {
    if (isMongoMode() && mongooseModels[collection]) {
      return await mongooseModels[collection].findOneAndUpdate(
        filter,
        { $setOnInsert: createData, $set: updateData },
        { upsert: true, new: true }
      ).lean();
    } else {
      const existing = await this.getOne(collection, filter);
      if (existing) {
        return await this.updateById(collection, existing._id, updateData);
      } else {
        return await this.create(collection, { ...filter, ...createData, ...updateData });
      }
    }
  },

  async deleteById(collection, id) {
    if (isMongoMode() && mongooseModels[collection]) {
      try {
        const deleted = await mongooseModels[collection].findByIdAndDelete(id).lean();
        return !!deleted;
      } catch (err) {
        return false;
      }
    } else {
      if (!MEMORY_DB[collection]) return false;
      const initialLength = MEMORY_DB[collection].length;
      MEMORY_DB[collection] = MEMORY_DB[collection].filter(item => String(item._id || item.id) !== String(id));
      return MEMORY_DB[collection].length < initialLength;
    }
  },

  async deleteWhere(collection, filter) {
    if (isMongoMode() && mongooseModels[collection]) {
      const res = await mongooseModels[collection].deleteMany(filter);
      return res.deletedCount > 0;
    } else {
      if (!MEMORY_DB[collection]) return false;
      const initialLength = MEMORY_DB[collection].length;
      
      const itemsToKeep = MEMORY_DB[collection].filter(item => {
        const matchesFilter = Object.entries(filter).every(([key, val]) => {
          if (val && typeof val === 'object' && val.$in) {
            return val.$in.map(String).includes(String(item[key]));
          }
          return String(item[key]) === String(val);
        });
        return !matchesFilter;
      });
      
      MEMORY_DB[collection] = itemsToKeep;
      return MEMORY_DB[collection].length < initialLength;
    }
  },

  async count(collection, filter = {}) {
    if (isMongoMode() && mongooseModels[collection]) {
      return await mongooseModels[collection].countDocuments(filter);
    } else {
      const items = MEMORY_DB[collection] || [];
      return filterItems(items, filter).length;
    }
  }
};
