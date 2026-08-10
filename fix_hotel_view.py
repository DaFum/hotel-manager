with open("src/ui/HotelView.tsx", "r") as f:
    content = f.read()

# Fix React rendering of problems objects
problem_render_old = """          <h3>Open problems</h3>
          {problems.length === 0 ? (
            <p>Nothing outstanding in this room.</p>
          ) : (
            <ul>
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}"""

# Also localize the other labels while we are here, to match the plan.
problem_render_new = """          <h3>{translateGame(props.locale ?? "en-GB", "room.detail.openProblems" as any) || "Open problems"}</h3>
          {problems.length === 0 ? (
            <p>{translateGame(props.locale ?? "en-GB", "room.problems.none")}</p>
          ) : (
            <ul>
              {problems.map((problem) => (
                <li key={problem.key}>{translateGame(props.locale ?? "en-GB", problem.key as any, problem.values as any)}</li>
              ))}
            </ul>
          )}"""

content = content.replace(problem_render_old, problem_render_new)

# Localize detail labels
content = content.replace("<dt>Status</dt>", "<dt>{translateGame(props.locale ?? \"en-GB\", \"room.detail.status\" as any)}</dt>")
content = content.replace("<dt>Category</dt>", "<dt>{translateGame(props.locale ?? \"en-GB\", \"room.detail.category\" as any)}</dt>")
content = content.replace("<dt>Guest</dt>", "<dt>{translateGame(props.locale ?? \"en-GB\", \"room.detail.guest\" as any)}</dt>")
content = content.replace("<dt>Rate</dt>", "<dt>{translateGame(props.locale ?? \"en-GB\", \"room.detail.rate\" as any)}</dt>")
content = content.replace("<dt>Departing</dt>", "<dt>{translateGame(props.locale ?? \"en-GB\", \"room.detail.departing\" as any)}</dt>")
content = content.replace("<dt>Condition</dt>", "<dt>{translateGame(props.locale ?? \"en-GB\", \"room.detail.condition\" as any)}</dt>")
content = content.replace("<dt>Fitted out as</dt>", "<dt>{translateGame(props.locale ?? \"en-GB\", \"room.detail.fittedOutAs\" as any)}</dt>")
content = content.replace("<dt>Years since refit</dt>", "<dt>{translateGame(props.locale ?? \"en-GB\", \"room.detail.yearsSinceRefit\" as any)}</dt>")

content = content.replace('stay ? stay.bookingId : "none"', 'stay ? stay.bookingId : (translateGame(props.locale ?? "en-GB", "room.detail.none" as any) || "none")')
content = content.replace('rateMinor === undefined ? "not priced"', 'rateMinor === undefined ? (translateGame(props.locale ?? "en-GB", "room.detail.notPriced" as any) || "not priced")')

with open("src/ui/HotelView.tsx", "w") as f:
    f.write(content)
