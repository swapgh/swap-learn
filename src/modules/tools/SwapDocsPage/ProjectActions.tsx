"use client";

import { useState } from "react";
import type { Locale } from "@/lib/locale";
import { deleteProjectFromList } from "./actions";
import styles from "./styles.module.css";

export function ProjectActions({
  locale,
  id,
  name,
  returnTo,
}: {
  locale: Locale;
  id: string;
  name: string;
  returnTo?: string;
}) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className={styles.proformaActions}>
      {!confirming ? (
        <button type="button" className={styles.dangerButton} onClick={() => setConfirming(true)}>
          Eliminar
        </button>
      ) : (
        <form action={deleteProjectFromList.bind(null, locale, id)} className={styles.inlineDeleteForm}>
          {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
          <p>Vas a eliminar {name}. Esta acción no se puede deshacer.</p>
          <button type="submit" className={styles.dangerButton}>
            Eliminar proyecto
          </button>
          <button type="button" onClick={() => setConfirming(false)}>
            Cancelar
          </button>
        </form>
      )}
    </div>
  );
}
