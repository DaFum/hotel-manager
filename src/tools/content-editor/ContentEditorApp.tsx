import { useEffect, useMemo, useState } from "react";
import type {
  ContentEntry,
  ContentPack,
} from "../../content-schema/contentPack";
import { ContentEntrySchema } from "../../content-schema/contentPack";
import { CORE_CONTENT_PACK } from "../../game/content/corePack";
import { validateReferences } from "../../game/content/validateReferences";
import { exportContentPack, importContentPack } from "./contentFileIO";
import { ValidationSummary } from "./ValidationSummary";
import { CityEditor } from "./editors/CityEditor";
import { FacilityEditor } from "./editors/FacilityEditor";
import { TechnologyEditor } from "./editors/TechnologyEditor";
import { GuestSegmentEditor } from "./editors/GuestSegmentEditor";
import { EventEditor } from "./editors/EventEditor";
import { RecipeEditor } from "./editors/RecipeEditor";
import { SupplierEditor } from "./editors/SupplierEditor";
import { RivalEditor } from "./editors/RivalEditor";
import { BrandEditor } from "./editors/BrandEditor";
import { RoomProductEditor } from "./editors/RoomProductEditor";

function Editor({
  value,
  onChange,
}: {
  value: ContentEntry;
  onChange: (value: ContentEntry) => void;
}) {
  switch (value.kind) {
    case "city":
      return <CityEditor value={value} onChange={onChange} />;
    case "facility":
      return <FacilityEditor value={value} onChange={onChange} />;
    case "roomProduct":
      return <RoomProductEditor value={value} onChange={onChange} />;
    case "technology":
      return <TechnologyEditor value={value} onChange={onChange} />;
    case "guestSegment":
      return <GuestSegmentEditor value={value} onChange={onChange} />;
    case "event":
      return <EventEditor value={value} onChange={onChange} />;
    case "recipe":
      return <RecipeEditor value={value} onChange={onChange} />;
    case "supplier":
      return <SupplierEditor value={value} onChange={onChange} />;
    case "rival":
      return <RivalEditor value={value} onChange={onChange} />;
    case "brand":
      return <BrandEditor value={value} onChange={onChange} />;
    default:
      return <p>This supporting record is edited as reviewed JSON.</p>;
  }
}

export function nextDraftFacilityId(
  entries: Readonly<Record<string, { id: string }>>,
): string {
  let suffix = 1;
  while (Object.hasOwn(entries, `facility.draft-${suffix}`)) suffix++;
  return `facility.draft-${suffix}`;
}

export function ContentEditorApp() {
  const [pack, setPack] = useState<ContentPack>(
    () => structuredClone(CORE_CONTENT_PACK) as ContentPack,
  );
  const [selectedId, setSelectedId] = useState(
    Object.keys(pack.entries).sort()[0],
  );
  const [importError, setImportError] = useState("");
  const entries = Object.values(pack.entries).sort((a, b) =>
    a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
  );
  const selected = pack.entries[selectedId];
  const [jsonDraft, setJsonDraft] = useState("");
  const [jsonError, setJsonError] = useState("");
  useEffect(() => {
    setJsonDraft(selected ? JSON.stringify(selected, null, 2) : "");
    setJsonError("");
  }, [selected]);
  const errors = useMemo(() => validateReferences(entries), [entries]);
  const update = (value: ContentEntry) => {
    setPack((current) => {
      const next = { ...current.entries };
      delete next[selectedId];
      next[value.id] = value;
      return { ...current, entries: next };
    });
    setSelectedId(value.id);
  };
  const addFacility = () => {
    const id = nextDraftFacilityId(pack.entries);
    setPack((current) => ({
      ...current,
      entries: {
        ...current.entries,
        [id]: {
          id,
          kind: "facility",
          nameKey: "facility.draft.name",
          areaSquareMeters: 1,
          capacity: 1,
          monthlyFixedCostMinor: 0,
          requiredTechnologyIds: [],
        },
      },
    }));
    setSelectedId(id);
  };
  const download = () => {
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(
      new Blob([exportContentPack(pack)], { type: "application/json" }),
    );
    anchor.download = `${pack.packId}-${pack.contentVersion}.json`;
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };
  return (
    <main aria-label="Content editor">
      <h1>Content pack editor</h1>
      <p>Edit explicit units and stable IDs. Validation errors block export.</p>
      <label>
        Pack ID
        <input
          value={pack.packId}
          onChange={(event) => setPack({ ...pack, packId: event.target.value })}
        />
      </label>
      <label>
        Content version
        <input
          value={pack.contentVersion}
          onChange={(event) =>
            setPack({ ...pack, contentVersion: event.target.value })
          }
        />
      </label>
      <nav aria-label="Content records">
        <ul>
          {entries.map((entry) => (
            <li key={entry.id}>
              <button onClick={() => setSelectedId(entry.id)}>
                {entry.id} ({entry.kind})
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <button onClick={addFacility}>Add facility</button>
      {selected && <Editor value={selected} onChange={update} />}
      {selected && (
        <label>
          Selected record JSON
          <textarea
            aria-label="Selected record JSON"
            rows={18}
            value={jsonDraft}
            onChange={(event) => {
              const text = event.target.value;
              setJsonDraft(text);
              try {
                update(ContentEntrySchema.parse(JSON.parse(text)));
                setJsonError("");
              } catch (error) {
                setJsonError(
                  error instanceof Error ? error.message : "Invalid JSON",
                );
              }
            }}
          />
        </label>
      )}
      {jsonError && <p role="alert">Invalid JSON or schema: {jsonError}</p>}
      <ValidationSummary errors={errors} />
      <button
        disabled={errors.length > 0 || Boolean(jsonError)}
        onClick={download}
      >
        Export pack
      </button>
      <label>
        Import pack
        <input
          aria-label="Import pack"
          type="file"
          accept="application/json"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            try {
              const imported = importContentPack(await file.text());
              setPack(imported);
              setSelectedId(Object.keys(imported.entries).sort()[0] ?? "");
              setImportError("");
            } catch (error) {
              setImportError(
                error instanceof Error ? error.message : "Invalid content pack",
              );
            }
          }}
        />
      </label>
      {importError && <p role="alert">{importError}</p>}
    </main>
  );
}
