# Replay and diagnostic conventions

- Replays submit recorded envelopes through `GameSimulation.submitCommands`; never patch authoritative state to reach an expected checkpoint.
- Canonical hashes include authoritative state and RNG while explicitly excluding only derived presentation sections.
