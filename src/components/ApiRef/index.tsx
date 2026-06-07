import React, { useEffect, useState } from "react";
import { MODELS, ModelDetail } from "../ModelExplorer";
import styles from "./styles.module.css";

// ApiRef renders a compact "API参照" button (for use inside the model price
// tables). Clicking it opens a modal that shows the model's API parameters and
// sample code, reusing ModelDetail from ModelExplorer.
export default function ApiRef({ id }: { id: string }): React.ReactElement | null {
  const [open, setOpen] = useState(false);
  const model = MODELS.find((m) => m.id === id);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!model) return null;

  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        API参照
      </button>
      {open && (
        <div
          className={styles.overlay}
          role="dialog"
          aria-modal="true"
          aria-label={`${model.id} API参照`}
          onClick={() => setOpen(false)}
        >
          <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
            <div className={styles.dialogHeader}>
              <code className={styles.dialogTitle}>{model.id}</code>
              <button
                type="button"
                className={styles.close}
                onClick={() => setOpen(false)}
                aria-label="閉じる"
              >
                ×
              </button>
            </div>
            <div className={styles.dialogBody}>
              <ModelDetail model={model} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
