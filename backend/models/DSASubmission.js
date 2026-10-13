import mongoose from 'mongoose';
import { fallbackDB } from '../dbFallback.js';

const dsaSubmissionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problemId: { type: String, required: true },
  problemTitle: { type: String, required: true },
  topicSlug: { type: String, default: '' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
  language: { type: String, required: true },
  code: { type: String, required: true },
  status: {
    type: String,
    enum: ['Accepted', 'Failed', 'Compilation Error', 'Runtime Error'],
    required: true
  },
  runtimeMs: { type: Number, default: 0 },
  passedTests: { type: Number, default: 0 },
  totalTests: { type: Number, default: 0 },
  testResults: { type: Array, default: [] },
  feedback: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const MongooseDSASubmission = mongoose.model('DSASubmission', dsaSubmissionSchema);

function isQueryValidForMongoose(query) {
  if (!query) return true;
  const fieldsToCheck = ['userId', '_id'];
  for (const field of fieldsToCheck) {
    if (query[field]) {
      const val = query[field];
      if (typeof val === 'string' && !mongoose.Types.ObjectId.isValid(val)) {
        return false;
      }
    }
  }
  return true;
}

const DSASubmissionWrapper = {
  find: (query) => {
    if (mongoose.connection.readyState === 1 && isQueryValidForMongoose(query)) {
      return MongooseDSASubmission.find(query);
    }
    return fallbackDB.submissions.find(query);
  },
  create: (data) => {
    if (mongoose.connection.readyState === 1 && isQueryValidForMongoose(data)) {
      return MongooseDSASubmission.create(data);
    }
    return fallbackDB.submissions.create(data);
  }
};

export default DSASubmissionWrapper;
export { MongooseDSASubmission };
