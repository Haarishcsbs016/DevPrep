import mongoose from 'mongoose';
import { fallbackDB } from '../dbFallback.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  onboardingCompleted: {
    type: Boolean,
    default: false,
  },
  profile: {
    targetRole: { type: String, default: '' },
    knownSkills: { type: [String], default: [] },
    weakAreas: { type: [String], default: [] },
    targetCompanies: { type: [String], default: [] },
    dsaConfidence: { type: String, default: 'Beginner' }
  },
  completedRoadmapTasks: {
    type: [String],
    default: [],
  },
  githubUsername: { type: String, default: '' },
  leetcodeUsername: { type: String, default: '' },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const MongooseUser = mongoose.model('User', userSchema);

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

const UserWrapper = {
  findOne: async (query) => {
    if (mongoose.connection.readyState === 1) {
      if (isQueryValidForMongoose(query)) {
        const mongoUser = await MongooseUser.findOne(query);
        if (mongoUser) return mongoUser;
      }
    }
    return fallbackDB.users.findOne(query);
  },
  
  findById: (id) => {
    const isMongoValid = mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(id);
    if (isMongoValid) {
      const query = MongooseUser.findById(id);
      const originalThen = query.then.bind(query);
      query.then = function(resolve, reject) {
        return originalThen(
          async (user) => {
            if (user) {
              resolve(user);
            } else {
              try {
                const fallbackUser = await fallbackDB.users.findById(id);
                if (fallbackUser) {
                  fallbackUser.save = async function() {
                    return fallbackDB.users.save(this);
                  };
                }
                resolve(fallbackUser);
              } catch (e) {
                resolve(null);
              }
            }
          },
          async (err) => {
            try {
              const fallbackUser = await fallbackDB.users.findById(id);
              if (fallbackUser) {
                fallbackUser.save = async function() {
                  return fallbackDB.users.save(this);
                };
              }
              resolve(fallbackUser);
            } catch (e) {
              reject(err);
            }
          }
        );
      };
      return query;
    }

    const fallbackQuery = fallbackDB.users.findById(id);
    const originalThen = fallbackQuery.then.bind(fallbackQuery);
    fallbackQuery.then = function(resolve, reject) {
      return originalThen(
        (user) => {
          if (user) {
            user.save = async function() {
              return fallbackDB.users.save(this);
            };
          }
          resolve(user);
        },
        reject
      );
    };
    return fallbackQuery;
  },

  create: async (userData) => {
    if (mongoose.connection.readyState === 1 && isQueryValidForMongoose(userData)) {
      return MongooseUser.create(userData);
    }
    const user = await fallbackDB.users.create(userData);
    if (user) {
      user.save = async function() {
        return fallbackDB.users.save(this);
      };
    }
    return user;
  }
};

export default UserWrapper;
export { MongooseUser };
