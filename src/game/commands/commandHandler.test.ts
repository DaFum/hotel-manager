import { describe, expect, it } from "vitest";
import { GameSimulation } from "../simulation/GameSimulation";
import { createInitialGameState } from "../simulation/initialState";
import {
  COMMAND_LOG_LIMIT,
  CommandHandler,
  type CommandExecutor,
} from "./commandHandler";
import {
  commandEnvelope,
  type CommandEnvelope,
  type GameCommand,
} from "./commandEnvelope";
import type { GameState } from "../simulation/initialState";
import { restoreRngStreams } from "../domain/rng";
import { rateKey } from "../revenue/rates";

function sim(): GameSimulation {
  return new GameSimulation(createInitialGameState(7));
}

let counter = 0;
function envelope(
  payload: GameCommand,
  overrides: Partial<CommandEnvelope> = {},
): CommandEnvelope {
  counter += 1;
  return {
    ...commandEnvelope({
      commandId: `cmd.${counter}`,
      issuedAtMinutes: 0,
      actor: "player",
      payload,
    }),
    ...overrides,
  };
}

/**
 * Everything the byte-identity claim covers: the whole state apart from the
 * command journal, which by design records the refusal itself.
 */
function stateWithoutLog(state: GameState): string {
  const { commandLog: _log, commandSequence: _seq, ...rest } = state;
  return JSON.stringify(rest);
}

const RATE: GameCommand = {
  type: "SET_RATE",
  dateKey: "1991-01-05",
  category: "double",
  rateMinor: 18_000,
};

describe("command handler", () => {
  it("records the envelope identity of an accepted command", () => {
    const s = sim();
    const env = envelope(RATE, {
      commandId: "cmd.rate.1",
      issuedAtMinutes: 240,
      actor: "player",
    });
    const [result] = s.submitCommands([env]);

    expect(result.commandId).toBe("cmd.rate.1");
    expect(result.status).toBe("accepted");
    const entry = s.state.commandLog.at(-1);
    expect(entry).toMatchObject({
      commandId: "cmd.rate.1",
      issuedAtMinutes: 240,
      actor: "player",
      type: "SET_RATE",
      status: "accepted",
    });
  });

  it("keeps protocol request ids out of authoritative command identity", () => {
    const env = commandEnvelope({
      commandId: "cmd.identity",
      issuedAtMinutes: 5,
      actor: "player",
      payload: RATE,
    });
    // A correlation id is a transport concern; the envelope has no room for it.
    expect(Object.keys(env).sort()).toEqual([
      "actor",
      "commandId",
      "expectedStateVersion",
      "issuedAtMinutes",
      "payload",
    ]);
    expect(env.expectedStateVersion).toBeUndefined();
    expect(() =>
      commandEnvelope({
        commandId: "",
        issuedAtMinutes: 0,
        actor: "player",
        payload: RATE,
      }),
    ).toThrow(/command id/i);
  });

  it("rejects a duplicate command id without touching state", () => {
    const s = sim();
    const env = envelope(RATE, { commandId: "cmd.dupe" });
    s.submitCommands([env]);
    const before = stateWithoutLog(s.state);

    const [second] = s.submitCommands([{ ...env }]);

    expect(second.status).toBe("rejected");
    expect(second.reason).toMatch(/duplicate/i);
    expect(stateWithoutLog(s.state)).toBe(before);
  });

  it("rejects a stale expected state version", () => {
    const s = sim();
    s.submitCommands([envelope(RATE)]);
    const current = s.state.stateVersion;

    const [stale] = s.submitCommands([
      envelope(
        { ...RATE, rateMinor: 19_000 },
        { expectedStateVersion: current - 1 },
      ),
    ]);

    expect(stale.status).toBe("rejected");
    expect(stale.reason).toMatch(/state version/i);
    expect(s.state.stateVersion).toBe(current);

    const [fresh] = s.submitCommands([
      envelope(
        { ...RATE, rateMinor: 19_000 },
        { expectedStateVersion: current },
      ),
    ]);
    expect(fresh.status).toBe("accepted");
  });

  it("applies queued commands in acceptance order", () => {
    const s = sim();
    const results = s.submitCommands([
      envelope({ ...RATE, rateMinor: 10_000 }),
      envelope({ ...RATE, rateMinor: 11_000 }),
      envelope({ ...RATE, rateMinor: 12_000 }),
    ]);

    expect(results.map((r) => r.status)).toEqual([
      "accepted",
      "accepted",
      "accepted",
    ]);
    // The last write wins, which is only true if they ran in order.
    expect(s.state.rates[rateKey("1991-01-05", "double")]).toBe(12_000);
    expect(s.state.commandLog.map((e) => e.stateVersion)).toEqual([1, 2, 3]);
  });

  it("leaves state byte-for-byte unchanged when a command is rejected", () => {
    const s = sim();
    const before = stateWithoutLog(s.state);

    const [result] = s.submitCommands([
      envelope({ type: "SET_SPECIALIZATION", specializationId: "not-a-thing" }),
    ]);

    expect(result.status).toBe("rejected");
    expect(stateWithoutLog(s.state)).toBe(before);
    // The rejection is still recorded, so the log is the only thing that moved.
    expect(s.state.commandLog.at(-1)?.status).toBe("rejected");
  });

  it("rolls back a multi-write command that fails midway", () => {
    const state = createInitialGameState(7);
    const before = stateWithoutLog(state);
    let committed: GameState = state;
    const executor: CommandExecutor = {
      validate: () => ({ ok: true }),
      apply: (draft, streams) => {
        // Two authoritative writes and an RNG draw, then a failure.
        draft.finance.cashMinor -= 5_000;
        draft.alerts.push({
          category: "half-written",
          groupId: `${draft.hotel.id}:half-written`,
          source: { companyId: draft.company.companyId },
          gameTime: "1991-01-01:0",
          acknowledged: false,
          id: "alert.half-written",
          severity: "info",
          title: "alert.half-written.title",
          cause: "alert.half-written.cause",
        });
        streams.staffing.nextUint32();
        throw new Error("supplier refused the order");
      },
    };
    const handler = new CommandHandler(
      () => committed,
      (next) => {
        committed = next;
      },
      executor,
    );

    const staffingBefore = state.rngState.staffing;
    const [result] = handler.run([envelope(RATE)]);

    expect(result.status).toBe("rejected");
    expect(result.reason).toMatch(/supplier refused/);
    expect(stateWithoutLog(committed)).toBe(before);
    expect(committed.alerts.some((a) => a.id === "alert.half-written")).toBe(
      false,
    );
    // Snapshotted before the run: comparing the live state with itself would
    // pass whether or not the draw was actually rolled back.
    expect(committed.rngState.staffing).toBe(staffingBefore);
  });

  it("increments the state version exactly once per applied command", () => {
    const s = sim();
    expect(s.state.stateVersion).toBe(0);

    // HIRE writes staff, draws RNG and reads the labour market: several writes,
    // one commit.
    s.submitCommands([
      envelope({
        type: "HIRE",
        role: "reception",
        shift: "morning",
        monthlyWageMinor: 400_000,
      }),
    ]);

    expect(s.state.stateVersion).toBe(1);
    expect(s.state.commandLog.at(-1)?.stateVersion).toBe(1);
  });

  it("appends accepted and rejected results to a bounded command log", () => {
    const s = sim();
    const wanted = COMMAND_LOG_LIMIT + 12;
    for (let i = 0; i < wanted; i++)
      s.submitCommands([
        envelope(
          { ...RATE, rateMinor: 10_000 + i },
          { commandId: `bulk.${i}` },
        ),
      ]);

    expect(s.state.commandLog.length).toBe(COMMAND_LOG_LIMIT);
    // The window keeps the newest decisions and drops the oldest.
    expect(s.state.commandLog.at(-1)?.commandId).toBe(`bulk.${wanted - 1}`);
    expect(s.state.commandLog.some((e) => e.commandId === "bulk.0")).toBe(
      false,
    );
  });

  it("routes every player action through the same command boundary", () => {
    const s = sim();
    const payloads: GameCommand[] = [
      RATE,
      { type: "ORDER_SUPPLIES", sku: "cleaning-unit", quantity: 100 },
      {
        type: "HIRE",
        role: "housekeeping",
        shift: "morning",
        monthlyWageMinor: 400_000,
      },
      { type: "START_RENOVATION" },
      { type: "SET_SPECIALIZATION", specializationId: null },
      { type: "EXPAND_FACILITY", area: "conferenceSqm" },
      { type: "BUY_MARKET_RESEARCH" },
    ];

    const results = s.submitCommands(payloads.map((p) => envelope(p)));

    expect(results.map((r) => r.status)).toEqual(
      payloads.map(() => "accepted"),
    );
    // One command, one version: seven applied actions moved it seven times.
    expect(s.state.stateVersion).toBe(payloads.length);
    expect(s.state.commandLog.map((e) => e.type)).toEqual(
      payloads.map((p) => p.type),
    );
  });

  it("advances no rng stream when a command is rejected", () => {
    const s = sim();
    const before = { ...s.state.rngState };

    s.submitCommands([
      envelope({
        type: "HIRE",
        role: "reception",
        shift: "midnight" as never,
        monthlyWageMinor: 400_000,
      }),
    ]);

    expect(s.state.rngState).toEqual(before);
    // And the streams the simulation is holding agree with the saved record.
    expect(restoreRngStreams(s.state.rngState).staffing.state).toBe(
      before.staffing,
    );
  });
});
