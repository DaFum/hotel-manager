with open("src/game/simulation/GameSimulation.ts", "r") as f:
    content = f.read()

# Housekeeping backlog alert
content = content.replace(
    'title: "Housekeeping backlog",\n        cause: `${dirty} rooms waiting for cleaning`,',
    'title: "alert.housekeeping-backlog.title",\n        cause: `${dirty}`, // Store data instead of prose'
)

# Overdue liabilities alert (this is likely somewhere inside GameSimulation, we'll replace the ones we find)
# We will use grep to find other alerts in the file
import re
alert_matches = re.finditer(r'pushAlert\(\{\s*id:\s*"([^"]+)",\s*severity:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*cause:\s*([^,]+)', content)
for match in alert_matches:
    full_match = match.group(0)
    id_val = match.group(1)
    severity = match.group(2)
    title = match.group(3)
    cause = match.group(4)
    if title != id_val + ".title":
        # Keep cause if it's already an expression, or make it a key if it's a static string
        new_title = id_val + ".title"
        new_cause = cause
        if cause.startswith('"') and cause.endswith('"'):
            # Convert static prose to a key
            new_cause = '"' + id_val + '.cause"'
        content = content.replace(
            full_match,
            f'pushAlert({{\n        id: "{id_val}",\n        severity: "{severity}",\n        title: "{new_title}",\n        cause: {new_cause}'
        )

with open("src/game/simulation/GameSimulation.ts", "w") as f:
    f.write(content)
