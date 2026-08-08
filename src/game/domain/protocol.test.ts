import { describe, expect, it } from 'vitest';
import { PROTOCOL_VERSION, type WorkerRequest } from './protocol';

describe('worker protocol',()=>{it('uses MASTER message names and protocol version',()=>{
 const request:WorkerRequest={protocolVersion:PROTOCOL_VERSION,type:'COMMAND',requestId:'r1',command:{type:'SET_ROOM_RATE',dateKey:'1991-01-01',category:'single',minor:9000}};
 expect(request.type).toBe('COMMAND');expect(request.protocolVersion).toBe(1);
});});
