import { useMemo, useState } from "react";
import { IndexedDbSaveRepository } from "../../game/persistence/indexedDbSaveRepository";
import {
  exportSaveFile,
  importSaveFile,
} from "../../game/persistence/saveTransfer";
import { DEFAULT_MANUAL_SLOT } from "../../game/persistence/savePolicy";

export function SaveTransferPanel({
  databaseName = "hotel-manager",
  slot = DEFAULT_MANUAL_SLOT,
}: {
  databaseName?: string;
  slot?: string;
}) {
  const [status, setStatus] = useState("");
  const repository = useMemo(
    () => new IndexedDbSaveRepository(databaseName),
    [databaseName],
  );
  const download = async () => {
    try {
      const save = await repository.load(slot);
      if (!save) throw new Error(`No save in ${slot}`);
      const bytes = await exportSaveFile(save);
      const anchor = document.createElement("a");
      anchor.href = URL.createObjectURL(
        new Blob([bytes as BlobPart], { type: "application/json" }),
      );
      anchor.download = `hotel-manager-${slot}.json`;
      anchor.click();
      URL.revokeObjectURL(anchor.href);
      setStatus("Save exported.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Export failed");
    }
  };
  return (
    <section aria-label="Save transfer">
      <h2>Save file transfer</h2>
      <button onClick={() => void download()}>Export save file</button>
      <label>
        Import save file
        <input
          type="file"
          accept="application/json"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            try {
              await importSaveFile(
                repository,
                slot,
                new Uint8Array(await file.arrayBuffer()),
              );
              setStatus("Save imported.");
            } catch (error) {
              setStatus(
                error instanceof Error ? error.message : "Import failed",
              );
            }
          }}
        />
      </label>
      <p role="status">{status}</p>
    </section>
  );
}
