import { useMemo, useState } from "react";
import { IndexedDbSaveRepository } from "../../game/persistence/indexedDbSaveRepository";
import {
  exportSaveFile,
  importSaveFile,
} from "../../game/persistence/saveTransfer";
import { DEFAULT_MANUAL_SLOT } from "../../game/persistence/savePolicy";
import { translate } from "../localization";

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
      if (!save)
        throw new Error(`${translate("save.transfer.noSave")} ${slot}`);
      const bytes = await exportSaveFile(save);
      const anchor = document.createElement("a");
      anchor.href = URL.createObjectURL(
        new Blob([bytes as BlobPart], { type: "application/json" }),
      );
      anchor.download = `hotel-manager-${slot}.json`;
      anchor.click();
      URL.revokeObjectURL(anchor.href);
      setStatus(translate("save.transfer.exported"));
    } catch (error) {
      setStatus(
        error instanceof Error
          ? error.message
          : translate("save.transfer.exportFailed"),
      );
    }
  };
  return (
    <section aria-label={translate("save.transfer.region")}>
      <h2>{translate("save.transfer.heading")}</h2>
      <button onClick={() => void download()}>
        {translate("save.transfer.export")}
      </button>
      <label>
        {translate("save.transfer.import")}
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
              setStatus(translate("save.transfer.imported"));
            } catch (error) {
              setStatus(
                error instanceof Error
                  ? error.message
                  : translate("save.transfer.importFailed"),
              );
            }
          }}
        />
      </label>
      <p role="status">{status}</p>
    </section>
  );
}
