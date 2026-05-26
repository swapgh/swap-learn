"use client";

import { useState } from "react";
import type { Locale } from "@/lib/locale";
import { deleteClient } from "@/modules/tools/SwapDocsPage/actions";
import styles from "./styles.module.css";

export function DeleteClientAction({
  locale,
  clientId,
  clientName,
}: {
  locale: Locale;
  clientId: string;
  clientName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.headerDanger}>
      <button type="button" className={styles.headerDangerTrigger} onClick={() => setOpen((value) => !value)}>
        Eliminar
      </button>
      {open && (
        <form action={deleteClient.bind(null, locale, clientId)}>
          <span>Vas a eliminar {clientName}. Esta acción no se puede deshacer.</span>
          <div className={styles.headerDangerActions}>
            <button type="submit">Eliminar cliente</button>
            <button type="button" onClick={() => setOpen(false)}>Cancelar</button>
          </div>
        </form>
      )}
    </div>
  );
}
