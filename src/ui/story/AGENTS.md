# Story-UI conventions

- Resolve narrative keys with `translateKey`; a raw id or text key must never reach the player.
- Every story choice and recovery measure is a command the worker decides. Never resolve one locally.
- A toast announces once and can be dismissed; the outcome dialog takes focus when it opens.
