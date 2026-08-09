/**
 * The command vocabulary. The definitions live under `src/game/commands`
 * because commands are the mutation boundary in their own right; the
 * simulation executes them rather than owning what they are.
 */
export type {
  CommandActor,
  CommandEnvelope,
  CommandLogEntry,
  CommandResult,
  CommandStatus,
  CommandType,
  GameCommand,
} from "../commands/commandEnvelope";
export {
  commandEnvelope,
  isCommandEnvelope,
} from "../commands/commandEnvelope";
