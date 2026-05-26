import mongoose from 'mongoose';
import { fallbackDB } from '../dbFallback.js';

const projectEnhancementSchema = new mongoose.Schema({
  before: { type: String, required: true },
  after: { type: String, required: true },
  impact: { type: String, default: '' }
});

const resumeAnalysisSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: { type: String, required: true },
  atsScore: { type: Number, required: true },
  missingKeywords: { type: [String], default: [] },
  projectEnhancements: [projectEnhancementSchema],
  feedback: { type: String, default: '' },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MongooseResumeAnalysis = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);

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

const ResumeAnalysisWrapper = {
  find: (query) => {
    if (mongoose.connection.readyState === 1 && isQueryValidForMongoose(query)) {
      return MongooseResumeAnalysis.find(query);
    }
    let sortCriteria = null;
    const thenable = {
      sort: function(criteria) {
        sortCriteria = criteria;
        return this;
      },
      then: function(resolve, reject) {
        fallbackDB.resumes.find(query)
          .then(results => {
            let sortedResults = [...results];
            if (sortCriteria) {
              const sortKeys = Object.keys(sortCriteria);
              if (sortKeys.length > 0) {
                const key = sortKeys[0];
                const order = sortCriteria[key]; // -1 or 1
                sortedResults.sort((a, b) => {
                  const valA = a[key];
                  const valB = b[key];
                  if (valA < valB) return -1 * order;
                  if (valA > valB) return 1 * order;
                  return 0;
                });
              }
            }
            resolve(sortedResults);
          })
          .catch(reject);
      }
    };
    return thenable;
  },

  create: (data) => {
    if (mongoose.connection.readyState === 1 && isQueryValidForMongoose(data)) {
      return MongooseResumeAnalysis.create(data);
    }
    return fallbackDB.resumes.create(data);
  }
};

export default ResumeAnalysisWrapper;
export { MongooseResumeAnalysis };
