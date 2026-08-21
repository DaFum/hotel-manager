import { STARTER_PLANT } from "./src/game/content/1991/plant";

const baseline = STARTER_PLANT.reduce((sum, a) => {
  // maybe accumulated depreciation or condition applied?
  return sum + (a.replacementMinor * a.startingCondition / 100);
}, 0);

console.log("baseline:", baseline);
