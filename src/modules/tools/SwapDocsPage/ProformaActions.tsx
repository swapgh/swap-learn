"use client";

import { useState } from "react";
import type { Locale } from "@/lib/locale";
import { deleteProforma } from "./actions";
import styles from "./styles.module.css";

export function ProformaActions({
  locale,
  id,
  number,
  deleteOnly = false,
  returnTo,
  hideDetail = false,
  editHref,
}: {
  locale: Locale;
  id: string;
  number: string;
  deleteOnly?: boolean;
  returnTo?: string;
  hideDetail?: boolean;
  editHref?: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const returnQuery = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";

  return (
    <div className={styles.proformaActions}>
      {!deleteOnly && (
        <>
          {!hideDetail && <a href={`/${locale}/account/tools/docs/proformas/${id}${returnQuery}`}>Ver detalle</a>}
          {editHref && <a href={editHref}>Editar</a>}
        </>
      )}
      {!confirming ? (
        <button type="button" className={styles.dangerButton} onClick={() => setConfirming(true)}>
          Eliminar
        </button>
      ) : (
        <form action={deleteProforma.bind(null, locale, id)} className={styles.inlineDeleteForm}>
          {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
          <p>Vas a eliminar {number}. También se eliminarán sus facturas asociadas.</p>
          <button type="submit" className={styles.dangerButton}>
            Eliminar proforma
          </button>
          <button type="button" onClick={() => setConfirming(false)}>
            Cancelar
          </button>
        </form>
      )}
    </div>
  );
}
