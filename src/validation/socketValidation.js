

import { validateRegister, validateMessage } from './schemas.js';


export function sendValidationError(socket, eventName, errors) {
  socket.emit('error:validation', {
    event: eventName,
    success: false,
    errors
  });
  console.log(`[Socket Validation Error] ${eventName}:`, errors);
}


export function handleRegisterValidation(socket, data) {
  const validation = validateRegister(data);

  if (!validation.valid) {
    sendValidationError(socket, 'register', validation.errors);
    return null;
  }

  return {
    userId: validation.userId,
    following: validation.following || [],
    followers: validation.followers || []
  };
}


export function handleMessageValidation(socket, data) {
  const validation = validateMessage(data);

  if (!validation.valid) {
    sendValidationError(socket, 'message:send', validation.errors);
    return null;
  }

  return validation.message;
}
