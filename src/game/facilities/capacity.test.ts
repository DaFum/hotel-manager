import {expect,it} from 'vitest';
import {availableThroughput,utilizationBp} from './capacity';
it('uses the tightest capacity constraint',()=>{
  expect(availableThroughput({space:120,equipment:80,staffed:60})).toBe(60);
  expect(utilizationBp(54,60)).toBe(9000);
});
