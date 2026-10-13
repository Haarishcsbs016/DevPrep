import mongoose from 'mongoose';
import { fallbackDB } from '../dbFallback.js';

const dsaBookmarkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  problemId: { type: String, required: true },
  problemTitle: { type: String, required: true },
  topicSlug: { type: String, default: '' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Easy' },
  createdAt: { type: Date, default: Date.now }
});

dsaBookmarkSchema.index({ userId: 1, problemId: 1 }, { unique: true });

const MongooseDSABookmark = mongoose.model('DSABookmark', dsaBookmarkSchema);

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

const DSABookmarkWrapper = {
  find: (query) => {
    if (mongoose.connection.readyState === 1 && isQueryValidForMongoose(query)) {
      return MongooseDSABookmark.find(query);
    }
    return fallbackDB.bookmarks.find(query);
  },
  findOne: (query) => {
    if (mongoose.connection.readyState === 1 && isQueryValidForMongoose(query)) {
      return MongooseDSABookmark.findOne(query);
    }
    return fallbackDB.bookmarks.findOne(query);
  },
  create: (data) => {
    if (mongoose.connection.readyState === 1 && isQueryValidForMongoose(data)) {
      return MongooseDSABookmark.create(data);
    }
    return fallbackDB.bookmarks.create(data);
  },
  deleteOne: (query) => {
    if (mongoose.connection.readyState === 1 && isQueryValidForMongoose(query)) {
      return MongooseDSABookmark.deleteOne(query);
    }
    return fallbackDB.bookmarks.deleteOne(query);
  }
};

export default DSABookmarkWrapper;
export { MongooseDSABookmark };
