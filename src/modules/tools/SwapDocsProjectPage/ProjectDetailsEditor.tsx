"use client";

import { useState } from "react";
import type { Locale } from "@/lib/locale";
import { updateProject } from "@/modules/tools/SwapDocsPage/actions";
import styles from "./styles.module.css";

type ProjectDetails = {
  id: string;
  name: string;
  status: "draft" | "sent" | "accepted" | "rejected" | "completed";
};

export function ProjectDetailsEditor({
  locale,
  project,
}: {
  locale: Locale;
  project: ProjectDetails;
}) {
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <div className={styles.readPanel}>
        <button
          type="button"
          className={styles.editIconButton}
          aria-label="Editar Proyecto"
          title="Editar"
          onClick={() => setIsEditing(true)}
        >
          Editar
        </button>
        <dl className={styles.detailsList}>
          <div>
            <dt>Nombre</dt>
            <dd>{project.name}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{project.status}</dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <form action={updateProject.bind(null, locale, project.id)} className={styles.formGrid}>
      <label className={styles.full}>
        Nombre
        <input name="name" required defaultValue={project.name} />
      </label>
      <label>
        Estado
        <select name="status" defaultValue={project.status}>
          <option value="draft">Borrador</option>
          <option value="sent">Enviado</option>
          <option value="accepted">Aceptado</option>
          <option value="rejected">Rechazado</option>
          <option value="completed">Completado</option>
        </select>
      </label>
      <div className={styles.formActions}>
        <button type="submit">Guardar Cambios</button>
        <button type="button" className={styles.secondaryButton} onClick={() => setIsEditing(false)}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
