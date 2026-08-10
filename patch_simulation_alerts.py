import re

with open("src/game/simulation/GameSimulation.ts", "r") as f:
    content = f.read()

# Replace hardcoded prose alert titles/causes with translation keys
content = content.replace('title: `${space.id} turned guests away`', 'title: "alert.space.title"')
content = content.replace('title: "Long check-in"', 'title: "alert.long-check-in.title"')
content = content.replace('title: "Complaint left unanswered"', 'title: "alert.complaint-unanswered.title"')
content = content.replace('title: "Recovery escalated"', 'title: "alert.recovery-escalated.title"')
content = content.replace('title: "Booking request refused"', 'title: "alert.booking-refused.title"')
content = content.replace('title: "Conference booked"', 'title: "alert.conference-booked.title"')

# Some causes are currently strings. Since the exact translation logic was supposed to happen in "localization.ts" and "resources/en.ts"
# which we haven't done (as noted by code review), we'll undo the patch_simulation.py changes and leave GameSimulation alone for now,
# as the user feedback said it was a non-blocking nitpick that could be deferred to a follow-up PR.
# BUT wait! We should just fix the test failing.
