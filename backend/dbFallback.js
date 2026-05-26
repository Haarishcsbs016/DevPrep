import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const getFilePath = (filename) => path.join(DATA_DIR, filename);

const readJSON = (filename) => {
  const filePath = getFilePath(filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (e) {
    return [];
  }
};

const writeJSON = (filename, data) => {
  const filePath = getFilePath(filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

// Thenable Query Helper to support Mongoose chaining like .select() and .sort()
const makeThenableQuery = (promise) => {
  const query = {
    then: (onFulfilled, onRejected) => promise.then(onFulfilled, onRejected),
    catch: (onRejected) => promise.catch(onRejected),
    
    select: (fields) => {
      const nextPromise = promise.then(data => {
        if (!data) return data;
        const copy = JSON.parse(JSON.stringify(data));
        
        // Handle field exclusion (e.g. "-password")
        if (typeof fields === 'string' && fields.startsWith('-')) {
          const keyToRemove = fields.slice(1);
          if (Array.isArray(copy)) {
            copy.forEach(item => delete item[keyToRemove]);
          } else {
            delete copy[keyToRemove];
          }
        }
        return copy;
      });
      return makeThenableQuery(nextPromise);
    },
    
    sort: (sortObj) => {
      const nextPromise = promise.then(data => {
        if (!Array.isArray(data)) return data;
        const key = Object.keys(sortObj)[0];
        const dir = sortObj[key];
        
        return [...data].sort((a, b) => {
          const valA = a[key];
          const valB = b[key];
          if (valA < valB) return dir === -1 ? 1 : -1;
          if (valA > valB) return dir === -1 ? -1 : 1;
          return 0;
        });
      });
      return makeThenableQuery(nextPromise);
    }
  };
  return query;
};

export const fallbackDB = {
  // Users CRUD
  users: {
    find: () => {
      const promise = Promise.resolve(readJSON('users.json'));
      return makeThenableQuery(promise);
    },
    findOne: (query) => {
      const users = readJSON('users.json');
      const user = users.find(u => u.email === query.email) || null;
      return makeThenableQuery(Promise.resolve(user));
    },
    findById: (id) => {
      const users = readJSON('users.json');
      const user = users.find(u => u._id === id.toString()) || null;
      return makeThenableQuery(Promise.resolve(user));
    },
    create: async (userData) => {
      const users = readJSON('users.json');
      const newUser = {
        _id: Math.random().toString(36).substring(2, 9),
        onboardingCompleted: false,
        profile: {
          targetRole: '',
          knownSkills: [],
          weakAreas: [],
          targetCompanies: [],
          dsaConfidence: 'Beginner'
        },
        completedRoadmapTasks: [],
        githubUsername: '',
        leetcodeUsername: '',
        createdAt: new Date().toISOString(),
        ...userData
      };
      users.push(newUser);
      writeJSON('users.json', users);
      return newUser;
    },
    save: async (userObj) => {
      const users = readJSON('users.json');
      const idx = users.findIndex(u => u._id === userObj._id);
      if (idx !== -1) {
        // Strip out function bindings (like .save) before saving
        const cleaned = { ...userObj };
        delete cleaned.save;
        users[idx] = cleaned;
        writeJSON('users.json', users);
        return users[idx];
      }
      return userObj;
    }
  },

  // DSA CRUD
  dsa: {
    find: (query) => {
      const dsa = readJSON('dsa.json');
      const filtered = dsa.filter(d => d.userId === query.userId.toString());
      return makeThenableQuery(Promise.resolve(filtered));
    },
    findOne: (query) => {
      const dsa = readJSON('dsa.json');
      const progress = dsa.find(d => d.userId === query.userId.toString() && d.topic === query.topic) || null;
      return makeThenableQuery(Promise.resolve(progress));
    },
    create: async (dsaData) => {
      const dsa = readJSON('dsa.json');
      const newDsa = {
        _id: Math.random().toString(36).substring(2, 9),
        solvedCount: 0,
        solvedProblems: [],
        streak: 0,
        lastActive: new Date().toISOString(),
        ...dsaData,
        userId: dsaData.userId.toString()
      };
      dsa.push(newDsa);
      writeJSON('dsa.json', dsa);
      return newDsa;
    },
    save: async (dsaObj) => {
      const dsa = readJSON('dsa.json');
      const idx = dsa.findIndex(d => d._id === dsaObj._id);
      if (idx !== -1) {
        const cleaned = { ...dsaObj };
        delete cleaned.save;
        dsa[idx] = cleaned;
        writeJSON('dsa.json', dsa);
        return dsa[idx];
      }
      return dsaObj;
    }
  },

  // Interviews CRUD
  interviews: {
    find: (query) => {
      const interviews = readJSON('interviews.json');
      let result = interviews.filter(i => i.userId === query.userId.toString());
      if (query.status) {
        result = result.filter(i => i.status === query.status);
      }
      return makeThenableQuery(Promise.resolve(result));
    },
    create: async (interviewData) => {
      const interviews = readJSON('interviews.json');
      const newSession = {
        _id: Math.random().toString(36).substring(2, 9),
        status: 'completed',
        createdAt: new Date().toISOString(),
        ...interviewData,
        userId: interviewData.userId.toString()
      };
      interviews.push(newSession);
      writeJSON('interviews.json', interviews);
      return newSession;
    }
  },

  // Resumes CRUD
  resumes: {
    find: (query) => {
      const resumes = readJSON('resumes.json');
      const filtered = resumes.filter(r => r.userId === query.userId.toString());
      return makeThenableQuery(Promise.resolve(filtered));
    },
    create: async (resumeData) => {
      const resumes = readJSON('resumes.json');
      const newReport = {
        _id: Math.random().toString(36).substring(2, 9),
        createdAt: new Date().toISOString(),
        ...resumeData,
        userId: resumeData.userId.toString()
      };
      resumes.push(newReport);
      writeJSON('resumes.json', resumes);
      return newReport;
    }
  }
};
