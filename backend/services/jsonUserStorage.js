const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, '../../data/users.json');

const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

if (!fs.existsSync(usersFile)) {
  fs.writeFileSync(usersFile, JSON.stringify([], null, 2));
}

function readUsers() {
  try {
    const data = fs.readFileSync(usersFile, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

function writeUsers(users) {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing users file:', error);
  }
}

function findUserByEmail(email) {
  const users = readUsers();
  return users.find(u => u.email === email);
}

function findUserById(id) {
  const users = readUsers();
  return users.find(u => u.uid === id);
}

function createUser(userData) {
  const users = readUsers();
  const newUser = {
    uid: userData.uid || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: userData.name,
    email: userData.email,
password: userData.password,
    displayName: userData.displayName || userData.name,
    photoURL: userData.photoURL || '',
    bio: userData.bio || '',
    createdAt: new Date().toISOString(),
    followers: [],
    following: [],
    savedPosts: []
  };
  users.push(newUser);
  writeUsers(users);
  return newUser;
}

function updateUser(uid, updates) {
  const users = readUsers();
  const userIndex = users.findIndex(u => u.uid === uid);
  if (userIndex === -1) {
    throw new Error('User not found');
  }
  users[userIndex] = { ...users[userIndex], ...updates };
  writeUsers(users);
  return users[userIndex];
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  readUsers
};
