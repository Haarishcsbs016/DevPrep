import mongoose from 'mongoose';
import { fallbackDB } from '../dbFallback.js';

const solvedProblemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  solvedAt: { type: Date, default: Date.now },
  platform: { type: String, default: 'Internal' }
});

const dsaProgressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    enum: ['Arrays', 'Strings', 'Linked List', 'Trees', 'Graphs', 'Dynamic Programming', 'Recursion', 'Backtracking'],
    required: true
  },
  solvedCount: { type: Number, default: 0 },
  solvedProblems: [solvedProblemSchema],
  streak: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now }
});

dsaProgressSchema.index({ userId: 1, topic: 1 }, { unique: true });

const MongooseDSAProgress = mongoose.model('DSAProgress', dsaProgressSchema);

function isQueryValidForMongoose(query) {
  if (!query) return true;
  const fieldsToCheck = ['userId', '_id'];
  for (const field of fieldsToCheck) {
    if (query[field]) {
      const val = query[field];
      if (typeof val === 'string' && !mongoose.Types.ObjectId.isValid(val)) {
        return false;
      }
      if (typeof val === 'object' && val !== null) {
        for (const k of Object.keys(val)) {
          const subVal = val[k];
          if (Array.isArray(subVal)) {
            for (const item of subVal) {
              if (typeof item === 'string' && !mongoose.Types.ObjectId.isValid(item)) {
                return false;
              }
            }
          } else if (typeof subVal === 'string' && !mongoose.Types.ObjectId.isValid(subVal)) {
            return false;
          }
        }
      }
    }
  }
  return true;
}

function DSAProgressWrapper(data) {
  if (mongoose.connection.readyState === 1) {
    return new MongooseDSAProgress(data);
  }
  const mockInstance = {
    ...data,
    save: async function() {
      if (this._id) {
        return fallbackDB.dsa.save(this);
      } else {
        const created = await fallbackDB.dsa.create(this);
        this._id = created._id;
        return created;
      }
    }
  };
  return mockInstance;
}

DSAProgressWrapper.find = (query) => {
  if (mongoose.connection.readyState === 1 && isQueryValidForMongoose(query)) {
    return MongooseDSAProgress.find(query);
  }
  return fallbackDB.dsa.find(query);
};

DSAProgressWrapper.findOne = (query) => {
  if (mongoose.connection.readyState === 1 && isQueryValidForMongoose(query)) {
    return MongooseDSAProgress.findOne(query);
  }
  const thenable = {
    then: function(resolve, reject) {
      fallbackDB.dsa.findOne(query)
        .then(res => {
          if (res) {
            res.save = async function() {
              return fallbackDB.dsa.save(this);
            };
          }
          resolve(res);
        })
        .catch(reject);
    }
  };
  return thenable;
};

DSAProgressWrapper.create = (data) => {
  if (mongoose.connection.readyState === 1 && isQueryValidForMongoose(data)) {
    return MongooseDSAProgress.create(data);
  }
  const thenable = {
    then: function(resolve, reject) {
      fallbackDB.dsa.create(data)
        .then(res => {
          if (res) {
            res.save = async function() {
              return fallbackDB.dsa.save(this);
            };
          }
          resolve(res);
        })
        .catch(reject);
    }
  };
  return thenable;
};

export default DSAProgressWrapper;
export { MongooseDSAProgress };
