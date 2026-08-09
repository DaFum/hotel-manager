# Chronicle conventions

- An entry is a completed fact: written once, keyed by a stable id, never rewritten.
- Entries carry localization keys, not sentences.
- Order by ISO date then id with plain string comparison; `localeCompare` sorts the same history differently across ICU builds.
