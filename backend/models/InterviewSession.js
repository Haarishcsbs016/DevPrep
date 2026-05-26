import mongoose from 'mongoose';
import { fallbackDB } from '../dbFallback.js';

const questionSessionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  answerText: { type: String, default: '' },
  score: { type: Number, default: 0 },
  feedback: { type: String, default: '' },
  analysis: {
    fillerWords: { type: [String], default: [] },
    fillerCount: { type: Number, default: 0 },
    fluencyScore: { type: Number, default: 0 },
    speakingSpeed: { type: String, default: 'Normal' }
  }
});

const interviewSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['HR', 'Technical', 'Coding'],
    required: true
  },
  company: { type: String, default: 'General' },
  status: {
    type: String,
    enum: ['in-progress', 'completed'],
    default: 'in-progress'
  },
  questions: [questionSessionSchema],
  overallFeedback: {
    communicationScore: { type: Number, default: 0 },
    technicalScore: { type: Number, default: 0 },
    confidenceScore: { type: Number, default: 0 },
    summary: { type: String, default: '' },
    weakAreas: { type: [String], default: [] },
    behaviorFeedback: {
      pros: { type: [String], default: [] },
      cons: { type: [String], default: [] }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MongooseInterviewSession = mongoose.model('InterviewSession', interviewSessionSchema);

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

const InterviewSessionWrapper = {
  find: (query) => {
    if (mongoose.connection.readyState === 1 && isQueryValidForMongoose(query)) {
      return MongooseInterviewSession.find(query);
    }
    let sortCriteria = null;
    const thenable = {
      sort: function(criteria) {
        sortCriteria = criteria;
        return this;
      },
      then: function(resolve, reject) {
        fallbackDB.interviews.find(query)
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
      return MongooseInterviewSession.create(data);
    }
    return fallbackDB.interviews.create(data);
  }
};

export default InterviewSessionWrapper;
export { MongooseInterviewSession };
