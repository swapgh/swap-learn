"use client";

import { useState } from "react";
import type { Locale } from "@/lib/locale";
import { updateClient } from "@/modules/tools/SwapDocsPage/actions";
import styles from "./styles.module.css";

type ClientDetails = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  nifCif: string | null;
  vatId: string | null;
  country: string;
  address: string | null;
  isCompany: boolean;
};

export function ClientDetailsEditor({
  locale,
  client,
}: {
  locale: Locale;
  client: ClientDetails;
}) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className={styles.clientDetailsCompact} id="datos-cliente">
      {!isEditing ? (
        <>
          <div className={styles.detailsHeader}>
            <h2>Datos del cliente</h2>
            <button type="button" onClick={() => setIsEditing(true)}>Editar</button>
          </div>
          <dl className={styles.detailsGrid}>
            <div><dt>Nombre</dt><dd>{client.name}</dd></div>
            <div><dt>Tipo</dt><dd>{client.isCompany ? "Empresa" : "Persona física"}</dd></div>
            {client.email && <div><dt>Email</dt><dd>{client.email}</dd></div>}
            {client.phone && <div><dt>Teléfono</dt><dd>{client.phone}</dd></div>}
            {client.nifCif && <div><dt>NIF/CIF/DNI</dt><dd>{client.nifCif}</dd></div>}
            {client.vatId && <div><dt>VAT ID</dt><dd>{client.vatId}</dd></div>}
            <div><dt>País</dt><dd>{client.country}</dd></div>
            {client.address && <div className={styles.full}><dt>Dirección</dt><dd>{client.address}</dd></div>}
          </dl>
        </>
      ) : (
        <form action={updateClient.bind(null, locale, client.id)} className={styles.formGrid}>
          <h2 className={styles.formTitle}>Editar datos del cliente</h2>
          <label>Nombre<input name="name" required defaultValue={client.name} /></label>
          <label>Tipo<select name="clientType" defaultValue={client.isCompany ? "company" : "person"}><option value="company">Empresa</option><option value="person">Persona física</option></select></label>
          <label>Email<input name="email" type="email" defaultValue={client.email ?? ""} /></label>
          <label>Teléfono<input name="phone" type="tel" defaultValue={client.phone ?? ""} /></label>
          <label>NIF/CIF/DNI<input name="nifCif" defaultValue={client.nifCif ?? ""} /></label>
          <label>VAT ID<input name="vatId" defaultValue={client.vatId ?? ""} /></label>
          <label>País<input name="country" defaultValue={client.country} /></label>
          <label className={styles.full}>Dirección<input name="address" defaultValue={client.address ?? ""} /></label>
          <div className={styles.inlineFormActions}>
            <button type="submit">Guardar cambios</button>
            <button type="button" className={styles.secondaryButton} onClick={() => setIsEditing(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
