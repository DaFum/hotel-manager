/**
 * Records the non-empty v6 save fixture from a real game.
 *
 * A fixture written by hand only proves that the migration copes with what
 * its author imagined. This one is the state of an actual group — a second
 * hotel bought, a scheme opened, a flag flown, staff hired, stock on order —
 * so the round-trip test is run against something the game can really reach.
 */
import { writeFileSync } from "node:fs";
import { GameSimulation } from "../src/game/simulation/GameSimulation";
import { createInitialGameState } from "../src/game/simulation/initialState";
import {
  commandEnvelope,
  type GameCommand,
} from "../src/game/commands/commandEnvelope";
import { QUANTUM_MINUTES } from "../src/game/simulation/clock";
import {
  CONTENT_VERSION,
  SAVE_VERSION,
  type SaveEnvelope,
} from "../src/game/persistence/saveVersions";
import { PROTOCOL_VERSION } from "../src/game/domain/protocol";
import { validateEnvelope } from "../src/game/persistence/saveSchema";

const simulation = new GameSimulation(createInitialGameState(4242));
simulation.refreshDerivedState();

let issued = 0;
function send(payload: GameCommand): void {
  issued += 1;
  const [result] = simulation.submitCommands([
    commandEnvelope({
      commandId: `fixture.${issued}.${payload.type}`,
      issuedAtMinutes: simulation.state.elapsedMinutes,
      actor: "player",
      payload,
    }),
  ]);
  if (result.status !== "accepted")
    throw new Error(`${payload.type} was refused: ${result.reason}`);
}

function runDays(days: number): void {
  const quanta = Math.ceil((days * 1440) / QUANTUM_MINUTES);
  for (let i = 0; i < quanta; i += 1) simulation.advanceQuantum();
}

const hotelId = simulation.state.hotel.id;

send({ type: "ASSIGN_BRAND", hotelId, brandId: "brand.mainblick" });
send({
  type: "SET_OPERATING_MODEL",
  hotelId,
  model: { kind: "franchise", royaltyBasisPoints: 350 },
});
send({
  type: "SET_HOTEL_BUDGET",
  hotelId,
  capexBudgetMinor: 3_000_000,
  operatingBudgetMinor: 9_000_000,
});
send({
  type: "SET_MANAGER_AUTHORITY",
  hotelId,
  authority: { repairLimitMinor: 800_000 },
});
send({
  type: "RUN_DUE_DILIGENCE",
  targetId: "target.offenbach.1",
  areas: ["building", "environment"],
});
send({
  type: "ACQUIRE_HOTEL",
  targetId: "target.offenbach.1",
  priceMinor: 30_000_000,
});
send({
  type: "TRANSFER_INTERNAL_FUNDING",
  hotelId: "hotel.offenbach.1",
  amountMinor: 1_500_000,
  direction: "fund",
});
send({
  type: "START_DEVELOPMENT",
  developmentId: "development.hanau.1",
  name: "Hanau Park",
  cityId: "city.frankfurt.de",
  rooms: 60,
  investmentMinor: 4_000_000,
  expectedAdrMinor: 14_000,
  occupancyBasisPoints: 6500,
  targetOpenDateKey: "1992-06-01",
});
for (const item of ["staff", "suppliers", "inventory"] as const)
  send({
    type: "COMPLETE_PRE_OPENING_TASK",
    developmentId: "development.hanau.1",
    item,
  });

// A working hotel underneath the group: people on the payroll and stock on
// its way, so the fixture is not a corporate shell over an empty building.
send({
  type: "HIRE",
  role: "housekeeping",
  shift: "morning",
  monthlyWageMinor: 300_000,
});
send({ type: "ORDER_SUPPLIES", sku: "cleaning-unit", quantity: 120 });

// Long enough for a month to close, so the fixture carries published results,
// a brand audit and whatever the delegation model escalated.
runDays(40);

// One more order left deliberately in flight: a delivery that has not landed
// is exactly the state a migration is most likely to lose.
send({ type: "ORDER_SUPPLIES", sku: "breakfast-portion", quantity: 200 });

const envelope: SaveEnvelope = {
  saveVersion: SAVE_VERSION,
  contentVersion: CONTENT_VERSION,
  protocolVersion: PROTOCOL_VERSION,
  rngState: simulation.state.rngState,
  state: simulation.snapshot(),
};

const problems = validateEnvelope(envelope);
if (problems.length > 0)
  throw new Error(`the recorded fixture is not valid: ${problems.join("; ")}`);

writeFileSync(
  new URL("../src/game/persistence/fixtures/save-v6.json", import.meta.url),
  `${JSON.stringify(envelope, null, 2)}\n`,
);

const state = envelope.state as ReturnType<GameSimulation["snapshot"]>;
process.stdout.write(
  `recorded v6 fixture: hotels=${state.company.portfolio.hotelIds.length} ` +
    `results=${Object.keys(state.company.hotelResults).length} ` +
    `audits=${state.company.brandAudits.length} ` +
    `escalations=${state.company.escalations.length} ` +
    `orders=${state.pendingOrders.length} staff=${state.staff.length}\n`,
);
