import { EventEmitter } from 'events';

export const pipelineEvents = new EventEmitter();
// Buffer active session parameters
export const sessionRequests = new Map();
