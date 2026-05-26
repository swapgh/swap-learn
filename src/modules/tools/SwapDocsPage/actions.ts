"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/server/prisma";
import { getAuthUser } from "@/server/auth";
import { hasAdminToolAccess } from "@/server/tool-access";
import type { Locale } from "@/lib/locale";
import { COST_TEMPLATES, ESTIMATION_TEMPLATES, SERVICE_TEMPLATES } from "./templates";
import type { Prisma } from "@prisma/client";
import { renderInvoicePdfBuffer, renderProformaPdfBuffer } from "@/modules/tools/SwapDocsDocuments/pdf";
import { sendDocumentEmail } from "@/modules/tools/SwapDocsDocuments/email";

async function logActivity(action: string, targetType: string, targetId: string, targetName: string, metadata?: Record<string, unknown>) {
  try {
    await prisma.activityLog.create({
      data: { action, targetType, targetId, targetName, metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined },
    });
  } catch {
    // silent — activity logging should never break the main operation
  }
}

async function requireActionAccess() {
  const user = await getAuthUser();
  if (!user || !hasAdminToolAccess(user.email)) {
    throw new Error("FORBIDDEN");
  }
}

function redirectWithReturnTo(locale: Locale, formData: FormData, fallback: string, success: string) {
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  if (returnTo.startsWith(`/${locale}/account/tools/docs`)) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}success=${success}`);
  }
  redirect(fallback);
}

function redirectErrorWithReturnTo(locale: Locale, formData: FormData, fallback: string, error: string) {
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  if (returnTo.startsWith(`/${locale}/account/tools/docs`)) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=${error}`);
  }
  redirect(fallback);
}

function path(locale: Locale) {
  return `/${locale}/account/tools/docs`;
}

function clientPath(locale: Locale, clientId: string) {
  return `${path(locale)}/clients/${clientId}`;
}

function projectPath(locale: Locale, projectId: string) {
  return `${path(locale)}/projects/${projectId}`;
}

function proformaPath(locale: Locale, proformaId: string) {
  return `${path(locale)}/proformas/${proformaId}`;
}

function emailErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Error desconocido";
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

async function reserveEntityCodes(
  tx: Prisma.TransactionClient,
  key: string,
  prefix: string,
  count = 1,
) {
  if (count <= 0) return [];
  const [counter] = await tx.$queryRaw<Array<{ seq: number }>>`
    INSERT INTO "entity_counters" ("id", "seq")
    VALUES (${key}, ${count})
    ON CONFLICT ("id")
    DO UPDATE SET "seq" = "entity_counters"."seq" + ${count}
    RETURNING "seq"
  `;
  if (!counter) return [];
  const first = counter.seq - count + 1;
  return Array.from({ length: count }, (_, index) => `${prefix}-${String(first + index).padStart(4, "0")}`);
}

async function setEntityCode(tx: Prisma.TransactionClient, table: "clients" | "projects" | "client_services", id: string, code: string) {
  if (table === "clients") {
    await tx.$executeRaw`UPDATE "clients" SET "code" = ${code} WHERE "id" = ${id}`;
  } else if (table === "projects") {
    await tx.$executeRaw`UPDATE "projects" SET "code" = ${code} WHERE "id" = ${id}`;
  } else {
    await tx.$executeRaw`UPDATE "client_services" SET "code" = ${code} WHERE "id" = ${id}`;
  }
}

function legacyProformaItemData<T extends {
  billingUnit?: unknown;
  quantity?: unknown;
  providerName?: unknown;
  renewsAt?: unknown;
}>(item: T) {
  const { billingUnit, quantity, providerName, renewsAt, ...legacy } = item;
  void billingUnit;
  void quantity;
  void providerName;
  void renewsAt;
  return legacy;
}

async function setProformaItemProfessionalFields(
  tx: Prisma.TransactionClient,
  itemId: string,
  {
    quantity,
    billingUnit,
    providerName,
    renewsAt,
  }: {
    quantity: number | null;
    billingUnit: BillingUnitValue | null;
    providerName?: string | null;
    renewsAt?: Date | null;
  },
) {
  await tx.$executeRaw`
    UPDATE "proforma_items"
    SET
      "quantity" = ${quantity},
      "billing_unit" = ${billingUnit}::"BillingUnit",
      "provider_name" = ${providerName ?? null},
      "renews_at" = ${renewsAt ?? null}
    WHERE "id" = ${itemId}
  `;
}

async function setProformaItemsProfessionalFields(
  tx: Prisma.TransactionClient,
  items: Array<{ id: string }>,
  source: Array<{ quantity?: number | null; billingUnit?: BillingUnitValue | null; providerName?: string | null; renewsAt?: Date | null; hours?: number; unitType?: BillingUnitValue }>,
) {
  for (const [index, item] of items.entries()) {
    const meta = source[index];
    if (!meta) continue;
    await setProformaItemProfessionalFields(tx, item.id, {
      quantity: meta.quantity ?? meta.hours ?? null,
      billingUnit: meta.billingUnit ?? meta.unitType ?? null,
      providerName: meta.providerName ?? null,
      renewsAt: meta.renewsAt ?? null,
    });
  }
}

async function setWorkItemProformaItemId(tx: Prisma.TransactionClient, workItemId: string, proformaItemId: string) {
  await tx.$executeRaw`
    UPDATE "work_items"
    SET "proforma_item_id" = ${proformaItemId}
    WHERE "id" = ${workItemId}
  `;
}

async function setDocumentPaymentFields(
  tx: Prisma.TransactionClient,
  table: "proformas" | "invoices",
  id: string,
  paymentMethod: string,
  paymentTerms: string | null,
) {
  if (table === "proformas") {
    await tx.$executeRaw`
      UPDATE "proformas"
      SET "payment_method" = ${paymentMethod}, "payment_terms" = ${paymentTerms}
      WHERE "id" = ${id}
    `;
    return;
  }

  await tx.$executeRaw`
    UPDATE "invoices"
    SET "payment_method" = ${paymentMethod}, "payment_terms" = ${paymentTerms}
    WHERE "id" = ${id}
  `;
}

function paymentMethod(value: FormDataEntryValue | null) {
  const method = String(value ?? "bank_transfer").trim();
  return ["bank_transfer", "card", "paypal", "bizum", "cash", "other"].includes(method) ? method : "bank_transfer";
}

const businessLineTypes = ["own_work", "external_cost", "recurring_service", "margin"] as const;
const billingUnits = ["hour", "day", "fixed", "monthly", "yearly"] as const;

type BusinessLineTypeValue = (typeof businessLineTypes)[number];
type BillingUnitValue = (typeof billingUnits)[number];

function businessLineType(value: FormDataEntryValue | string | null | undefined): BusinessLineTypeValue {
  const text = String(value ?? "own_work");
  return businessLineTypes.includes(text as BusinessLineTypeValue) ? text as BusinessLineTypeValue : "own_work";
}

function billingUnit(value: FormDataEntryValue | string | null | undefined): BillingUnitValue {
  const text = String(value ?? "hour");
  if (text === "hours") return "hour";
  return billingUnits.includes(text as BillingUnitValue) ? text as BillingUnitValue : "hour";
}

function addMonths(value: Date, months: number) {
  const next = new Date(value);
  next.setMonth(next.getMonth() + months);
  return next;
}

function publicLineDescription(value: string) {
  return value.replace(/^\[[^\]]+\]\s*/, "").trim();
}

async function createClientServicesFromRecurringItems(
  tx: Prisma.TransactionClient,
  {
    clientId,
    projectId,
    proformaNumber,
    items,
    notes,
  }: {
    clientId: string;
    projectId: string;
    proformaNumber: string;
    items: Array<{
      id: string;
      description: string;
      lineType: BusinessLineTypeValue;
      unitType: BillingUnitValue;
      billingUnit?: BillingUnitValue | null;
      internalCost: number;
      clientPrice: number;
      amount: number;
      margin: number;
      provider?: string | null;
      providerName?: string | null;
      recurrenceMonths?: number | null;
      renewsAt?: Date | null;
    }>;
    notes?: string;
  },
) {
  const recurringItems = items.filter((item) => item.lineType === "recurring_service");
  if (recurringItems.length === 0) return 0;

  const existing = await tx.clientService.findMany({
    where: { proformaItemId: { in: recurringItems.map((item) => item.id) } },
    select: { proformaItemId: true },
  });
  const existingIds = new Set(existing.map((service) => service.proformaItemId).filter(Boolean));
  const newItems = recurringItems.filter((item) => !existingIds.has(item.id));
  if (newItems.length === 0) return 0;

  const now = new Date();
  const codes = await reserveEntityCodes(tx, "client_service", "SRV", newItems.length);
  for (const [index, item] of newItems.entries()) {
      const unit = item.billingUnit ?? item.unitType;
      const months = item.recurrenceMonths ?? (unit === "yearly" ? 12 : 1);
      const service = await tx.clientService.create({
        data: {
        clientId,
        projectId,
        proformaItemId: item.id,
        name: publicLineDescription(item.description),
        lineType: item.lineType,
        provider: item.providerName ?? item.provider ?? null,
        unitType: unit,
        internalCost: item.internalCost,
        clientPrice: item.clientPrice || item.amount,
        margin: item.margin,
        startedAt: now,
        renewalDate: item.renewsAt ?? addMonths(now, months),
        recurrenceMonths: months,
        notes: notes ?? `Created from proforma ${proformaNumber}`,
        },
      });
      await setEntityCode(tx, "client_services", service.id, codes[index]);
  }
  return newItems.length;
}

function inferLineType(text: string): BusinessLineTypeValue {
  if (/hosting|vps|servidor|dominio|licencia|api externa|proveedor/i.test(text)) return "external_cost";
  if (/margen|gesti.n|contingencia/i.test(text)) return "margin";
  return "own_work";
}

function inferUnitType(text: string): BillingUnitValue {
  if (/mensual|hosting|vps|servidor/i.test(text)) return "monthly";
  if (/anual|dominio/i.test(text)) return "yearly";
  return "hour";
}

function parseWorkTask(description: string) {
  const raw = description.trim();
  const prefixed = raw.match(/^\[([^\]]+)\]\s*(.+)$/);
  const rawCategory = prefixed?.[1]?.trim() ?? "";
  const task = (prefixed?.[2] ?? raw).trim();
  const lower = task.toLowerCase();

  if (rawCategory && rawCategory.toLowerCase() !== "plantilla") {
    return { category: rawCategory, task };
  }

  if (/\b(frontend|interfaz|vista|vistas|maquetado|diseño|diseno|ui)\b/.test(lower)) {
    return { category: "Frontend", task };
  }
  if (/\b(backend|endpoint|api|base de datos|bbdd|lógica|logica)\b/.test(lower)) {
    return { category: "Backend", task };
  }
  if (/\b(testing|prueba|pruebas|bug|bugs)\b/.test(lower)) {
    return { category: "Testing", task };
  }
  if (/\b(deploy|despliegue|servidor|configuración|configuracion)\b/.test(lower)) {
    return { category: "Deploy", task };
  }
  if (/\b(gestión|gestion|cliente|reunión|reunion|análisis|analisis)\b/.test(lower)) {
    return { category: "Gestión", task };
  }

  return { category: "General", task };
}

function normalizeWorkKey(category: string, task: string) {
  const normalizedCategory = category.trim().toLowerCase() === "proforma" ? "general" : category.trim().toLowerCase();
  const normalizedTask = task.replace(/^\[plantilla\]\s*/i, "").trim().toLowerCase();
  return `${normalizedCategory}::${normalizedTask}`;
}


export async function createClient(locale: Locale, formData: FormData) {
  await requireActionAccess();

  const client = await prisma.$transaction(async (tx) => {
    const [code] = await reserveEntityCodes(tx, "client", "CLI");
    const created = await tx.client.create({
      data: {
        name: String(formData.get("name") ?? "").trim(),
        nifCif: String(formData.get("nifCif") ?? "").trim() || null,
        email: String(formData.get("email") ?? "").trim() || null,
        address: String(formData.get("address") ?? "").trim() || null,
        country: String(formData.get("country") ?? "ES").trim() || "ES",
        isCompany: String(formData.get("clientType") ?? "company") === "company",
      },
    });
    await setEntityCode(tx, "clients", created.id, code);
    return created;
  });

  await logActivity("created", "client", client.id, client.name);
  redirect(`${path(locale)}?clientId=${client.id}&success=Cliente+creado`);
}

export async function updateClient(locale: Locale, clientId: string, formData: FormData) {
  await requireActionAccess();

  const client = await prisma.client.update({
    where: { id: clientId },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      nifCif: String(formData.get("nifCif") ?? "").trim() || null,
      email: String(formData.get("email") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      address: String(formData.get("address") ?? "").trim() || null,
      vatId: String(formData.get("vatId") ?? "").trim() || null,
      country: String(formData.get("country") ?? "ES").trim() || "ES",
      isCompany: String(formData.get("clientType") ?? "company") === "company",
    },
  });

  await logActivity("updated", "client", client.id, client.name);
  revalidatePath(path(locale));
  revalidatePath(clientPath(locale, clientId));
}

export async function deleteClient(locale: Locale, clientId: string, formData: FormData) {
  void formData;
  await requireActionAccess();

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { name: true },
  });

  if (!client) {
    redirect(`${path(locale)}?error=Cliente+no+encontrado`);
  }

  await prisma.$transaction(async (tx) => {
    const proformas = await tx.proforma.findMany({
      where: { project: { clientId } },
      select: { id: true },
    });
    await tx.invoice.deleteMany({ where: { proformaId: { in: proformas.map((proforma) => proforma.id) } } });
    await tx.client.delete({ where: { id: clientId } });
  });
  await logActivity("deleted", "client", clientId, client.name);
  redirect(`${path(locale)}?success=Cliente+eliminado`);
}

export async function createProject(locale: Locale, formData: FormData) {
  await requireActionAccess();
  const clientId = String(formData.get("clientId") ?? "");

  const project = await prisma.$transaction(async (tx) => {
    const [code] = await reserveEntityCodes(tx, "project", "PRJ");
    const created = await tx.project.create({
      data: {
        name: String(formData.get("name") ?? "").trim(),
        clientId,
      },
    });
    await setEntityCode(tx, "projects", created.id, code);
    return created;
  });

  await logActivity("created", "project", project.id, project.name, { clientId });
  redirectWithReturnTo(locale, formData, `${path(locale)}?projectId=${project.id}&success=Proyecto+creado`, "Proyecto+creado");
}

export async function updateProject(locale: Locale, projectId: string, formData: FormData) {
  await requireActionAccess();

  const project = await prisma.project.update({
    where: { id: projectId },
    data: {
      name: String(formData.get("name") ?? "").trim(),
      status: String(formData.get("status") ?? "draft") as
        | "draft"
        | "sent"
        | "accepted"
        | "rejected"
        | "completed",
    },
  });

  await logActivity("updated", "project", project.id, project.name, { status: project.status });
  revalidatePath(path(locale));
  revalidatePath(projectPath(locale, projectId));
}

export async function deleteProject(locale: Locale, projectId: string, formData: FormData) {
  void formData;
  await requireActionAccess();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true, clientId: true },
  });

  if (!project) {
    redirect(`${path(locale)}?error=Proyecto+no+encontrado`);
  }

  await prisma.$transaction(async (tx) => {
    const proformas = await tx.proforma.findMany({
      where: { projectId },
      select: { id: true },
    });
    await tx.invoice.deleteMany({ where: { proformaId: { in: proformas.map((proforma) => proforma.id) } } });
    await tx.project.delete({ where: { id: projectId } });
  });
  await logActivity("deleted", "project", projectId, project.name);
  redirect(`${path(locale)}?success=Proyecto+eliminado`);
}

export async function deleteProjectFromList(locale: Locale, projectId: string, formData: FormData) {
  await requireActionAccess();

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true, clientId: true },
  });

  if (!project) {
    redirectErrorWithReturnTo(locale, formData, `${path(locale)}?error=Proyecto+no+encontrado`, "Proyecto+no+encontrado");
  }

  await prisma.$transaction(async (tx) => {
    const proformas = await tx.proforma.findMany({
      where: { projectId },
      select: { id: true },
    });
    await tx.invoice.deleteMany({ where: { proformaId: { in: proformas.map((proforma) => proforma.id) } } });
    await tx.project.delete({ where: { id: projectId } });
  });
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  if (returnTo.startsWith(`/${locale}/account/tools/docs/clients/`)) {
    redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}success=Proyecto+eliminado`);
  }
  redirect(`${path(locale)}?success=Proyecto+eliminado`);
}

async function nextProformaNumber() {
  const year = new Date().getFullYear();
  const id = `PRO-${year}`;
  const counter = await prisma.proformaCounter.upsert({
    where: { id },
    create: { id, year, seq: 1 },
    update: { seq: { increment: 1 } },
  });

  return `${id}-${String(counter.seq).padStart(4, "0")}`;
}

export async function createProforma(locale: Locale, formData: FormData) {
  await requireActionAccess();

  const projectId = String(formData.get("projectId") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const hours = Number(formData.get("hours") ?? 0);
  const rate = Number(formData.get("rate") ?? 0);
  const discount = Number(formData.get("discount") ?? 0);
  const ivaRate = Number(formData.get("ivaRate") ?? 21);
  const payMethod = paymentMethod(formData.get("paymentMethod"));
  const payTerms = String(formData.get("paymentTerms") ?? "").trim() || null;
  const subtotal = Math.max(0, hours * rate);
  const ivaBase = Math.max(0, subtotal - discount);
  const ivaAmount = ivaBase * (ivaRate / 100);
  const total = ivaBase + ivaAmount;

  const proforma = await prisma.$transaction(async (tx) => {
    const created = await tx.proforma.create({
    data: {
      projectId,
      number: await nextProformaNumber(),
      subtotal,
      discount,
      ivaRate,
      ivaAmount,
      total,
      items: {
        create: {
          description,
          hours,
          rate,
          amount: subtotal,
          clientPrice: subtotal,
          internalCost: 0,
          margin: subtotal,
        },
      },
    },
    include: {
      items: true,
      project: { select: { clientId: true } },
    },
  });
    if (created.items[0]) {
      await setProformaItemProfessionalFields(tx, created.items[0].id, {
        quantity: hours,
        billingUnit: "hour",
      });
    }
    await setDocumentPaymentFields(tx, "proformas", created.id, payMethod, payTerms);
    return created;
  });

  await logActivity("created", "proforma", proforma.id, proforma.number);
  redirect(`${proformaPath(locale, proforma.id)}?success=Proforma+creada`);
}

export async function createProformaFromServiceTemplate(locale: Locale, formData: FormData) {
  await requireActionAccess();

  const templateId = String(formData.get("serviceTemplateId") ?? "");
  const template = SERVICE_TEMPLATES.find((item) => item.id === templateId);

  if (!template) {
    return;
  }

  const projectId = String(formData.get("projectId") ?? "");
  const discount = Number(formData.get("discount") ?? 0);
  const ivaRate = Number(formData.get("ivaRate") ?? 21);
  const payMethod = paymentMethod(formData.get("paymentMethod"));
  const payTerms = String(formData.get("paymentTerms") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "draft") as
    | "draft"
    | "sent"
    | "accepted"
    | "rejected"
    | "converted"
    | "cancelled";
  const customDescriptions = formData.getAll("lineDescription").map((value) => String(value).trim());
  const customCategories = formData.getAll("lineCategory").map((value) => String(value).trim());
  const customHours = formData.getAll("lineHours").map((value) => Number(value));
  const customRates = formData.getAll("lineRate").map((value) => Number(value));
  const customAmounts = formData.getAll("lineAmount").map((value) => Number(value));
  const customLineTypes = formData.getAll("lineType").map((value) => businessLineType(value));
  const customUnitTypes = formData.getAll("lineUnitType").map((value) => billingUnit(value));
  const customInternalCosts = formData.getAll("lineInternalCost").map((value) => Number(value));
  const customProviders = formData.getAll("lineProvider").map((value) => String(value).trim());
  const customRecurrenceMonths = formData.getAll("lineRecurrenceMonths").map((value) => Number(value));
  const customItems = customDescriptions
    .map((description, index) => {
      const category = customCategories[index] ?? "";
      const fullDescription = category ? `[${category}] ${description}` : description;
      const hours = Number.isFinite(customHours[index]) ? customHours[index] : 0;
      const rate = Number.isFinite(customRates[index]) ? customRates[index] : 0;
      const fallbackAmount = roundMoney(hours * rate);
      const amount = Number.isFinite(customAmounts[index]) ? roundMoney(customAmounts[index]) : fallbackAmount;
      const lineType = customLineTypes[index] ?? "own_work";
      const unitType = customUnitTypes[index] ?? "hour";
      const internalCost = Number.isFinite(customInternalCosts[index]) ? roundMoney(customInternalCosts[index]) : 0;
      const recurrenceMonths = Number.isFinite(customRecurrenceMonths[index]) && customRecurrenceMonths[index] > 0
        ? customRecurrenceMonths[index]
        : (unitType === "yearly" ? 12 : unitType === "monthly" ? 1 : null);
      return {
        description: fullDescription,
        hours,
        rate,
        amount,
        lineType,
        unitType,
        billingUnit: unitType,
        quantity: hours,
        internalCost,
        clientPrice: amount,
        margin: roundMoney(amount - internalCost),
        provider: customProviders[index] || null,
        providerName: customProviders[index] || null,
        isRecurring: lineType === "recurring_service" || unitType === "monthly" || unitType === "yearly",
        recurrenceMonths,
        renewsAt: recurrenceMonths ? addMonths(new Date(), recurrenceMonths) : null,
      };
    })
    .filter((item) => item.description && item.hours >= 0 && item.rate >= 0);
  const templateItems = customItems.length > 0 ? customItems : template.proformaItems.map((item) => {
    const baseAmount = roundMoney(item.hours * item.rate);
    const meta = item as typeof item & {
      lineType?: string;
      unitType?: string;
      internalCost?: number;
      clientPrice?: number;
      provider?: string;
      recurrenceMonths?: number | null;
    };
    const clientPrice = roundMoney(meta.clientPrice ?? baseAmount);
    const internalCost = roundMoney(meta.internalCost ?? 0);
    const lineType = businessLineType(meta.lineType);
    const unitType = billingUnit(meta.unitType);
    return {
      description: item.description,
      hours: item.hours,
      rate: item.rate,
      amount: baseAmount,
      lineType,
      unitType,
      billingUnit: unitType,
      quantity: item.hours,
      internalCost,
      clientPrice,
      margin: roundMoney(clientPrice - internalCost),
      provider: meta.provider ?? null,
      providerName: meta.provider ?? null,
      isRecurring: lineType === "recurring_service" || unitType === "monthly" || unitType === "yearly",
      recurrenceMonths: meta.recurrenceMonths ?? null,
      renewsAt: meta.recurrenceMonths ? addMonths(new Date(), meta.recurrenceMonths) : null,
    };
  });
  const subtotal = roundMoney(templateItems.reduce((sum, item) => sum + item.amount, 0));
  const ivaBase = Math.max(0, subtotal - discount);
  const ivaAmount = roundMoney(ivaBase * (ivaRate / 100));
  const total = roundMoney(ivaBase + ivaAmount);

  const created = await prisma.$transaction(async (tx) => {
    const proforma = await tx.proforma.create({
      data: {
        projectId,
        number: await nextProformaNumber(),
        subtotal,
        discount,
        ivaRate,
        ivaAmount,
        total,
        notes: `Plantilla origen: ${template.name}`,
        status,
        items: {
          create: templateItems.map((item) => legacyProformaItemData(item)),
        },
      },
      include: { items: true },
    });
    await setProformaItemsProfessionalFields(tx, proforma.items, templateItems);
    await setDocumentPaymentFields(tx, "proformas", proforma.id, payMethod, payTerms);

    const project = await tx.project.findUnique({
      where: { id: projectId },
      select: { clientId: true },
    });

    if (status === "accepted" && project?.clientId) {
      await createClientServicesFromRecurringItems(tx, {
        clientId: project.clientId,
        projectId,
        proformaNumber: proforma.number,
        items: proforma.items.map((item, index) => ({
          ...item,
          billingUnit: templateItems[index]?.billingUnit ?? item.unitType,
          quantity: templateItems[index]?.quantity ?? item.hours,
          providerName: templateItems[index]?.providerName ?? item.provider,
          renewsAt: templateItems[index]?.renewsAt ?? null,
        })),
      });
    }

    return { ...proforma, clientId: project?.clientId };
  });

  await logActivity("created", "proforma", created.id, created.number, { templateId });
  redirectWithReturnTo(locale, formData, `${proformaPath(locale, created.id)}?success=Proforma+creada`, "Proforma+creada");
}

export async function generateProformaFromProjectCosts(locale: Locale, formData: FormData) {
  await requireActionAccess();

  const projectId = String(formData.get("projectId") ?? "");
  const discount = Number(formData.get("discount") ?? 0);
  const ivaRate = Number(formData.get("ivaRate") ?? 21);
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: { select: { id: true } },
      costItems: { orderBy: [{ stage: "asc" }, { task: "asc" }] },
    },
  });

  if (!project || project.costItems.length === 0) {
    revalidatePath(projectPath(locale, projectId));
    return;
  }

  const items = project.costItems.map((item) => ({
    description: `[${item.stage}] ${item.task}`,
    hours: item.hours,
    rate: item.clientUnitPrice || item.unitCost,
    amount: roundMoney(item.clientUnitPrice > 0 ? item.hours * item.clientUnitPrice : item.total),
    lineType: item.isRecurring ? "recurring_service" as const : item.lineType,
    unitType: item.unitType,
    billingUnit: item.unitType,
    quantity: item.hours,
    internalCost: roundMoney(item.hours * (item.internalUnitCost || item.unitCost)),
    clientPrice: roundMoney(item.clientUnitPrice > 0 ? item.hours * item.clientUnitPrice : item.total),
    margin: roundMoney((item.clientUnitPrice > 0 ? item.hours * item.clientUnitPrice : item.total) - (item.hours * (item.internalUnitCost || item.unitCost))),
    provider: item.provider,
    providerName: item.provider,
    isRecurring: item.isRecurring,
    recurrenceMonths: item.recurrenceMonths,
    renewsAt: item.recurrenceMonths ? addMonths(new Date(), item.recurrenceMonths) : null,
  }));
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.amount, 0));
  const ivaBase = Math.max(0, subtotal - discount);
  const ivaAmount = roundMoney(ivaBase * (ivaRate / 100));
  const total = roundMoney(ivaBase + ivaAmount);

  const proforma = await prisma.proforma.create({
    data: {
      projectId,
      number: await nextProformaNumber(),
      subtotal,
      discount,
      ivaRate,
      ivaAmount,
      total,
      notes,
      items: { create: items.map((item) => legacyProformaItemData(item)) },
    },
    include: { items: true },
  });
  await prisma.$transaction(async (tx) => {
    await setProformaItemsProfessionalFields(tx, proforma.items, items);
  });

  redirect(`${proformaPath(locale, proforma.id)}?success=Proforma+generada`);
}

export async function syncProjectFromProformaTemplate(locale: Locale, proformaId: string) {
  await requireActionAccess();

  const proforma = await prisma.proforma.findUnique({
    where: { id: proformaId },
    include: { items: true },
  });

  if (!proforma) {
    return;
  }

  revalidatePath(path(locale));
  revalidatePath(projectPath(locale, proforma.projectId));
  revalidatePath(proformaPath(locale, proformaId));
}

export async function updateProformaStatus(locale: Locale, formData: FormData) {
  await requireActionAccess();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "draft") as
    | "draft"
    | "sent"
    | "accepted"
    | "rejected"
    | "converted"
    | "cancelled";

  const proforma = await prisma.$transaction(async (tx) => {
    const updated = await tx.proforma.update({
      where: { id },
      data: { status },
      select: { projectId: true, number: true, project: { select: { clientId: true } } },
    });

    if (status === "accepted") {
      const recurringItems = await tx.proformaItem.findMany({
        where: { proformaId: id, OR: [{ isRecurring: true }, { lineType: "recurring_service" }] },
      });
      await createClientServicesFromRecurringItems(tx, {
        clientId: updated.project.clientId,
        projectId: updated.projectId,
        proformaNumber: updated.number,
        items: recurringItems,
      });
    }

    return updated;
  });

  revalidatePath(path(locale));
  revalidatePath(proformaPath(locale, id));
  revalidatePath(projectPath(locale, proforma.projectId));
  revalidatePath(clientPath(locale, proforma.project.clientId));
  redirectWithReturnTo(locale, formData, `${proformaPath(locale, id)}?success=Estado+actualizado`, "Estado+actualizado");
}

export async function updateProforma(locale: Locale, proformaId: string, formData: FormData) {
  await requireActionAccess();

  const discount = Number(formData.get("discount") ?? 0);
  const ivaRate = Number(formData.get("ivaRate") ?? 21);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "draft") as
    | "draft"
    | "sent"
    | "accepted"
    | "rejected"
    | "converted"
    | "cancelled";
  const itemIds = formData.getAll("itemId").map((value) => String(value));
  const deleteItemIds = new Set(formData.getAll("deleteItemId").map((value) => String(value)));

  const proforma = await prisma.proforma.findUnique({
    where: { id: proformaId },
    select: { projectId: true, number: true, project: { select: { clientId: true } } },
  });

  if (!proforma) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const itemId of itemIds) {
      if (deleteItemIds.has(itemId)) {
        await tx.proformaItem.delete({ where: { id: itemId } });
        continue;
      }

      const hours = Number(formData.get(`hours_${itemId}`) ?? 0);
      const rate = Number(formData.get(`rate_${itemId}`) ?? 0);
      const amount = Number(formData.get(`amount_${itemId}`) ?? Number.NaN);
      const lineType = businessLineType(formData.get(`lineType_${itemId}`));
      const unitType = billingUnit(formData.get(`unitType_${itemId}`));
      const internalCost = Number(formData.get(`internalCost_${itemId}`) ?? Number.NaN);
      const provider = String(formData.get(`provider_${itemId}`) ?? "").trim() || null;
      const recurrenceMonths = Number(formData.get(`recurrenceMonths_${itemId}`) ?? 0);
      const clientAmount = Number.isFinite(amount) ? roundMoney(amount) : roundMoney(hours * rate);
      const normalizedInternalCost = Number.isFinite(internalCost) ? roundMoney(internalCost) : undefined;

      await tx.proformaItem.update({
        where: { id: itemId },
        data: {
          description: String(formData.get(`description_${itemId}`) ?? "").trim(),
          hours,
          rate,
          amount: clientAmount,
          lineType,
          unitType,
          internalCost: normalizedInternalCost,
          clientPrice: clientAmount,
          margin: normalizedInternalCost === undefined ? undefined : roundMoney(clientAmount - normalizedInternalCost),
          provider,
          isRecurring: lineType === "recurring_service" || unitType === "monthly" || unitType === "yearly",
          recurrenceMonths: recurrenceMonths > 0 ? recurrenceMonths : (unitType === "yearly" ? 12 : unitType === "monthly" ? 1 : null),
        },
      });
      await setProformaItemProfessionalFields(tx, itemId, {
        quantity: hours,
        billingUnit: unitType,
        providerName: provider,
        renewsAt: recurrenceMonths > 0 ? addMonths(new Date(), recurrenceMonths) : null,
      });
    }

    const newDescriptions = formData.getAll("newDescription").map((value) => String(value).trim());
    const newHoursValues = formData.getAll("newHours").map((value) => Number(value));
    const newRateValues = formData.getAll("newRate").map((value) => Number(value));
    const newAmountValues = formData.getAll("newAmount").map((value) => Number(value));

    for (const [index, newDescription] of newDescriptions.entries()) {
      const newHours = Number.isFinite(newHoursValues[index]) ? newHoursValues[index] : 0;
      const newRate = Number.isFinite(newRateValues[index]) ? newRateValues[index] : 0;
      const newAmount = Number.isFinite(newAmountValues[index]) ? newAmountValues[index] : newHours * newRate;
      if (newDescription && newHours > 0 && newRate >= 0) {
        const lineType = businessLineType(formData.getAll("newLineType")[index]);
        const unitType = billingUnit(formData.getAll("newLineUnitType")[index]);
        const internalCost = Number(formData.getAll("newInternalCost")[index] ?? 0);
        const recurrenceMonths = Number(formData.getAll("newRecurrenceMonths")[index] ?? 0);
        const created = await tx.proformaItem.create({
          data: {
            proformaId,
            description: newDescription,
            hours: newHours,
            rate: newRate,
            amount: roundMoney(newAmount),
            lineType,
            unitType,
            internalCost: Number.isFinite(internalCost) ? roundMoney(internalCost) : 0,
            clientPrice: roundMoney(newAmount),
            margin: roundMoney(newAmount - (Number.isFinite(internalCost) ? internalCost : 0)),
            provider: String(formData.getAll("newProvider")[index] ?? "").trim() || null,
            isRecurring: lineType === "recurring_service" || unitType === "monthly" || unitType === "yearly",
            recurrenceMonths: recurrenceMonths > 0 ? recurrenceMonths : (unitType === "yearly" ? 12 : unitType === "monthly" ? 1 : null),
          },
        });
        await setProformaItemProfessionalFields(tx, created.id, {
          quantity: newHours,
          billingUnit: unitType,
          providerName: String(formData.getAll("newProvider")[index] ?? "").trim() || null,
          renewsAt: recurrenceMonths > 0 ? addMonths(new Date(), recurrenceMonths) : null,
        });
      }
    }

    const items = await tx.proformaItem.findMany({ where: { proformaId } });
    const subtotal = roundMoney(items.reduce((sum, item) => sum + item.amount, 0));
    const ivaBase = Math.max(0, subtotal - discount);
    const ivaAmount = roundMoney(ivaBase * (ivaRate / 100));
    const total = roundMoney(ivaBase + ivaAmount);

    await tx.proforma.update({
      where: { id: proformaId },
      data: {
        subtotal,
        discount,
        ivaRate,
        ivaAmount,
        total,
        notes,
        status,
      },
    });

    if (status === "accepted") {
      const recurringItems = await tx.proformaItem.findMany({
        where: {
          proformaId,
          OR: [{ isRecurring: true }, { lineType: "recurring_service" }],
        },
      });
      await createClientServicesFromRecurringItems(tx, {
        clientId: proforma.project.clientId,
        projectId: proforma.projectId,
        proformaNumber: proforma.number,
        items: recurringItems,
        notes: "Created when proforma was accepted",
      });
    }
  });

  revalidatePath(path(locale));
  revalidatePath(proformaPath(locale, proformaId));
  revalidatePath(projectPath(locale, proforma.projectId));
  revalidatePath(clientPath(locale, proforma.project.clientId));
  redirectWithReturnTo(locale, formData, `${proformaPath(locale, proformaId)}?success=Proforma+actualizada`, "Proforma+actualizada");
}

export async function deleteProforma(locale: Locale, proformaId: string, formData: FormData) {
  await requireActionAccess();

  const proforma = await prisma.proforma.findUnique({
    where: { id: proformaId },
    select: { number: true, projectId: true, project: { select: { clientId: true } }, invoices: { select: { id: true } } },
  });

  if (!proforma) {
    redirectErrorWithReturnTo(locale, formData, `${path(locale)}?error=Proforma+no+encontrada`, "Proforma+no+encontrada");
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.invoice.deleteMany({ where: { proformaId } });
    await tx.proforma.delete({ where: { id: proformaId } });
  });

  await logActivity("deleted", "proforma", proformaId, proforma.number, {
    projectId: proforma.projectId,
    deletedInvoices: proforma.invoices.length,
  });
  revalidatePath(path(locale));
  revalidatePath(projectPath(locale, proforma.projectId));
  revalidatePath(clientPath(locale, proforma.project.clientId));
  redirectWithReturnTo(locale, formData, `${path(locale)}?success=Proforma+eliminada`, "Proforma+eliminada");
}

export async function sendProformaByEmail(locale: Locale, proformaId: string, formData: FormData) {
  await requireActionAccess();

  const proforma = await prisma.proforma.findUnique({
    where: { id: proformaId },
    include: {
      items: true,
      project: { include: { client: true } },
    },
  });

  const to = String(formData.get("to") ?? proforma?.project.client.email ?? "").trim();
  const subject = String(formData.get("subject") ?? `Proforma ${proforma?.number ?? ""}`).trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!proforma || !to) {
    redirectErrorWithReturnTo(locale, formData, `${proformaPath(locale, proformaId)}?error=Email+no+disponible`, "Email+no+disponible");
    return;
  }

  try {
    const pdf = await renderProformaPdfBuffer(proforma);
    const providerMessageId = await sendDocumentEmail({
      to,
      subject,
      filename: `${proforma.number}.pdf`,
      pdf,
      html: `
        <p>Hola ${proforma.project.client.name},</p>
        <p>Te enviamos la proforma <strong>${proforma.number}</strong> del proyecto <strong>${proforma.project.name}</strong>.</p>
        ${message ? `<p>${message.replace(/\n/g, "<br />")}</p>` : ""}
        <p>Adjuntamos el PDF en este correo.</p>
      `,
    });

    await prisma.$transaction([
      prisma.proforma.update({ where: { id: proforma.id }, data: { status: "sent" } }),
      prisma.documentEmailLog.create({
        data: {
          documentType: "proforma",
          documentId: proforma.id,
          proformaId: proforma.id,
          to,
          subject,
          status: "sent",
          providerMessageId,
        },
      }),
    ]);
    await logActivity("email", "proforma", proforma.id, proforma.number, { to, provider: "resend" });
    revalidatePath(path(locale));
    revalidatePath(proformaPath(locale, proforma.id));
    revalidatePath(projectPath(locale, proforma.projectId));
    revalidatePath(clientPath(locale, proforma.project.clientId));
    redirectWithReturnTo(locale, formData, `${proformaPath(locale, proforma.id)}?success=Proforma+enviada`, "Proforma+enviada");
  } catch (error) {
    const messageText = emailErrorMessage(error);
    await prisma.documentEmailLog.create({
      data: {
        documentType: "proforma",
        documentId: proforma.id,
        proformaId: proforma.id,
        to,
        subject,
        status: "failed",
        error: messageText,
      },
    });
    await logActivity("email_failed", "proforma", proforma.id, proforma.number, { to, error: messageText });
    redirectErrorWithReturnTo(locale, formData, `${proformaPath(locale, proforma.id)}?error=${encodeURIComponent(messageText)}`, encodeURIComponent(messageText));
  }
}

export async function updateProjectStatus(locale: Locale, formData: FormData) {
  await requireActionAccess();

  const projectId = String(formData.get("projectId") ?? "");

  await prisma.project.update({
    where: { id: projectId },
    data: {
      status: String(formData.get("status") ?? "draft") as
        | "draft"
        | "sent"
        | "accepted"
        | "rejected"
        | "completed",
    },
  });

  revalidatePath(path(locale));
  revalidatePath(projectPath(locale, projectId));
}

export async function createEstimationItem(locale: Locale, formData: FormData) {
  await requireActionAccess();

  const optimistic = Number(formData.get("optimistic") ?? 0);
  const probable = Number(formData.get("probable") ?? 0);
  const pessimistic = Number(formData.get("pessimistic") ?? 0);
  const tpe = Math.round(((optimistic + 4 * probable + pessimistic) / 6) * 100) / 100;

  const projectId = String(formData.get("projectId") ?? "");

  await prisma.estimationItem.create({
    data: {
      projectId,
      category: String(formData.get("category") ?? "").trim(),
      task: String(formData.get("task") ?? "").trim(),
      optimistic,
      probable,
      pessimistic,
      tpe,
    },
  });

  redirect(`${projectPath(locale, projectId)}?tab=tareas&success=Tarea+propia+añadida`);
}

export async function applyEstimationTemplate(locale: Locale, formData: FormData) {
  await requireActionAccess();

  const projectId = String(formData.get("projectId") ?? "");
  const templateId = String(formData.get("estimationTemplateId") ?? "");
  const template = ESTIMATION_TEMPLATES.find((item) => item.id === templateId);

  if (!template) {
    return;
  }

  await prisma.estimationItem.createMany({
    data: template.items.map((item) => {
      const tpe = Math.round(((item.optimistic + 4 * item.probable + item.pessimistic) / 6) * 100) / 100;
      return {
        projectId,
        category: item.category,
        task: item.task,
        optimistic: item.optimistic,
        probable: item.probable,
        pessimistic: item.pessimistic,
        tpe,
      };
    }),
  });

  redirect(`${projectPath(locale, projectId)}?tab=tareas&success=Plantilla+añadida`);
}

export async function createCostItem(locale: Locale, formData: FormData) {
  await requireActionAccess();

  const hours = Number(formData.get("hours") ?? 0);
  const unitCost = Number(formData.get("unitCost") ?? 0);
  const internalUnitCost = Number(formData.get("internalUnitCost") ?? unitCost);
  const clientUnitPrice = Number(formData.get("clientUnitPrice") ?? unitCost);
  const lineType = businessLineType(formData.get("lineType"));
  const unitType = billingUnit(formData.get("unitType"));
  const recurrenceMonths = Number(formData.get("recurrenceMonths") ?? 0);

  const projectId = String(formData.get("projectId") ?? "");

  await prisma.costItem.create({
    data: {
      projectId,
      stage: String(formData.get("stage") ?? "").trim(),
      task: String(formData.get("task") ?? "").trim(),
      hours,
      unitCost,
      total: roundMoney(hours * internalUnitCost),
      lineType,
      unitType,
      internalUnitCost,
      clientUnitPrice,
      margin: roundMoney(hours * (clientUnitPrice - internalUnitCost)),
      provider: String(formData.get("provider") ?? "").trim() || null,
      isRecurring: lineType === "recurring_service" || unitType === "monthly" || unitType === "yearly",
      recurrenceMonths: recurrenceMonths > 0 ? recurrenceMonths : (unitType === "yearly" ? 12 : unitType === "monthly" ? 1 : null),
      notes: String(formData.get("notes") ?? "").trim() || null,
    },
  });

  redirect(`${projectPath(locale, projectId)}/costs?success=Coste+añadido`);
}

export async function applyCostTemplate(locale: Locale, formData: FormData) {
  await requireActionAccess();

  const projectId = String(formData.get("projectId") ?? "");
  const templateId = String(formData.get("costTemplateId") ?? "");
  const template = COST_TEMPLATES.find((item) => item.id === templateId);

  if (!template) {
    return;
  }

  await prisma.costItem.createMany({
    data: template.items.map((item) => ({
      projectId,
      stage: item.stage,
      task: item.task,
      hours: item.hours,
      unitCost: item.unitCost,
      total: Math.round(item.hours * item.unitCost * 100) / 100,
      lineType: inferLineType(`${item.stage} ${item.task}`),
      unitType: inferUnitType(`${item.stage} ${item.task}`),
      internalUnitCost: item.unitCost,
      clientUnitPrice: item.unitCost,
      margin: 0,
      isRecurring: /mensual|hosting|vps|servidor|dominio|licencia/i.test(`${item.stage} ${item.task}`),
      recurrenceMonths: /anual|dominio/i.test(`${item.stage} ${item.task}`) ? 12 : /mensual|hosting|vps|servidor|licencia/i.test(`${item.stage} ${item.task}`) ? 1 : null,
    })),
  });

  redirect(`${projectPath(locale, projectId)}/costs?success=Plantilla+añadida`);
}

export async function createWorkItem(locale: Locale, formData: FormData) {
  await requireActionAccess();

  const status = String(formData.get("status") ?? "pending") as
    | "pending"
    | "in_progress"
    | "done";
  const now = new Date();

  const projectId = String(formData.get("projectId") ?? "");

  await prisma.workItem.create({
    data: {
      projectId,
      category: String(formData.get("category") ?? "").trim(),
      task: String(formData.get("task") ?? "").trim(),
      estimatedHours: Number(formData.get("estimatedHours") ?? 0),
      actualHours: Number(formData.get("actualHours") ?? 0),
      status,
      sortOrder: Number(formData.get("sortOrder") ?? 0),
      notes: String(formData.get("notes") ?? "").trim() || null,
      startedAt: status === "in_progress" || status === "done" ? now : null,
      completedAt: status === "done" ? now : null,
    },
  });

  redirect(`${projectPath(locale, projectId)}?tab=tareas&success=Tarea+añadida`);
}

export async function generateWorkItemsFromAcceptedProforma(locale: Locale, formData: FormData) {
  await requireActionAccess();

  const projectId = String(formData.get("projectId") ?? "");
  const proformaId = String(formData.get("proformaId") ?? "");

  const [project, proforma, existingItems] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId }, select: { clientId: true, name: true } }),
    prisma.proforma.findUnique({ where: { id: proformaId }, include: { items: true } }),
    prisma.workItem.findMany({
      where: { projectId },
      select: { category: true, task: true, sortOrder: true },
    }),
  ]);

  const returnTo = String(formData.get("returnTo") ?? "").trim();

  if (!project || !proforma || proforma.projectId !== projectId || proforma.status !== "accepted") {
    if (returnTo.startsWith(`/${locale}/account/tools/docs/clients/`)) {
      redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}error=No+se+pudo+generar+seguimiento`);
    }
    redirect(`${projectPath(locale, projectId)}?error=No+se+pudo+generar+seguimiento`);
  }

  const existingKeys = new Set(existingItems.map((item) => normalizeWorkKey(item.category, item.task)));
  const existingProformaItemRows = await prisma.$queryRaw<Array<{ proforma_item_id: string | null }>>`
    SELECT "proforma_item_id"
    FROM "work_items"
    WHERE "project_id" = ${projectId}
      AND "proforma_item_id" IS NOT NULL
  `;
  const existingProformaItemIds = new Set(existingProformaItemRows.map((item) => item.proforma_item_id).filter(Boolean));
  const createdKeys = new Set<string>();
  const nextSortOrder = existingItems.length > 0 ? Math.max(...existingItems.map((item) => item.sortOrder)) + 1 : 0;
  const data = proforma.items
    .filter((item) => item.lineType === "own_work" && !existingProformaItemIds.has(item.id))
    .map((item, index) => {
      const parsed = parseWorkTask(item.description);
      const key = normalizeWorkKey(parsed.category, parsed.task);
      return {
        key,
        projectId,
        proformaItemId: item.id,
        category: parsed.category,
        task: parsed.task,
        estimatedHours: item.quantity ?? item.hours,
        actualHours: 0,
        status: "pending" as const,
        sortOrder: nextSortOrder + index,
        notes: null,
      };
    })
    .filter((item) => {
      if (existingKeys.has(item.key) || createdKeys.has(item.key)) {
        return false;
      }
      createdKeys.add(item.key);
      return true;
    })
    .map((item) => ({
      projectId: item.projectId,
      proformaItemId: item.proformaItemId,
      category: item.category,
      task: item.task,
      estimatedHours: item.estimatedHours,
      actualHours: item.actualHours,
      status: item.status,
      sortOrder: item.sortOrder,
      notes: item.notes,
    }));

  if (data.length === 0) {
    redirectErrorWithReturnTo(locale, formData, `${projectPath(locale, projectId)}?tab=tareas&error=No+hay+tareas+nuevas+para+sincronizar`, "No+hay+tareas+nuevas+para+sincronizar");
  }

  await prisma.$transaction(async (tx) => {
    for (const item of data) {
      const created = await tx.workItem.create({
        data: {
          projectId: item.projectId,
          category: item.category,
          task: item.task,
          estimatedHours: item.estimatedHours,
          actualHours: item.actualHours,
          status: item.status,
          sortOrder: item.sortOrder,
          notes: item.notes,
        },
      });
      await setWorkItemProformaItemId(tx, created.id, item.proformaItemId);
    }
  });

  await logActivity("created", "workItem", projectId, `Seguimiento de ${project.name}`, { projectId, proformaId, created: data.length });
  redirectWithReturnTo(locale, formData, `${clientPath(locale, project.clientId)}?tab=proyectos&success=${data.length}+tareas+sincronizadas`, `${data.length}+tareas+sincronizadas`);
}

export async function applyServiceTemplateToProject(locale: Locale, formData: FormData) {
  await requireActionAccess();

  const projectId = String(formData.get("projectId") ?? "");
  const templateId = String(formData.get("templateId") ?? "");

  const result = await prisma.$transaction(async (tx) => {
    const [project, template, existingItems] = await Promise.all([
      tx.project.findUnique({ where: { id: projectId }, select: { id: true, name: true } }),
      tx.serviceTemplate.findUnique({
        where: { id: templateId },
        include: { lines: { orderBy: [{ sortOrder: "asc" }, { description: "asc" }] } },
      }),
      tx.workItem.findMany({
        where: { projectId },
        select: { category: true, task: true },
      }),
    ]);

    if (!project || !template || template.lines.length === 0) {
      return { created: 0, projectName: project?.name ?? "", templateName: template?.name ?? "" };
    }

    const existingKeys = new Set(existingItems.map((item) => normalizeWorkKey(item.category, item.task)));
    const data = template.lines
      .map((line, index) => ({ line, index, parsed: parseWorkTask(line.description) }))
      .filter((item) => !existingKeys.has(normalizeWorkKey(item.parsed.category, item.parsed.task)))
      .map(({ line, index, parsed }) => ({
        projectId,
        category: parsed.category,
        task: parsed.task,
        estimatedHours: line.hours ?? 0,
        actualHours: 0,
        status: "pending" as const,
        sortOrder: line.sortOrder || index,
        notes: null,
      }));

    if (data.length === 0) {
      return { created: 0, projectName: project.name, templateName: template.name };
    }

    await tx.workItem.createMany({ data });
    return { created: data.length, projectName: project.name, templateName: template.name };
  });

  if (result.created > 0) {
    await logActivity("created", "workItem", projectId, `Checklist ${result.templateName}`, { projectId, templateId, created: result.created });
    revalidatePath(projectPath(locale, projectId));
    redirect(`${projectPath(locale, projectId)}?tab=tareas&success=${result.created}+tareas+añadidas`);
  }

  redirect(`${projectPath(locale, projectId)}?tab=tareas&error=No+hay+tareas+nuevas+para+añadir`);
}

export async function updateWorkItem(locale: Locale, formData: FormData) {
  await requireActionAccess();

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "pending") as "pending" | "in_progress" | "done";
  const now = new Date();

  const item = await prisma.workItem.findUnique({ where: { id } });
  if (!item) return redirect(`${projectPath(locale, "404")}?error=Tarea+no+encontrada`);

  const estimatedHours = Number(formData.get("estimatedHours") ?? item.estimatedHours ?? 0);
  const submittedActualHours = Number(formData.get("actualHours") ?? item.actualHours ?? 0);
  const actualHours = status === "done" && (!Number.isFinite(submittedActualHours) || submittedActualHours <= 0)
    ? estimatedHours
    : submittedActualHours;

  await prisma.workItem.update({
    where: { id },
    data: {
      category: String(formData.get("category") ?? item.category).trim() || item.category,
      task: String(formData.get("task") ?? item.task).trim() || item.task,
      estimatedHours,
      actualHours,
      status,
      sortOrder: item.sortOrder,
      notes: String(formData.get("notes") ?? "").trim() || null,
      startedAt: status === "in_progress" || status === "done"
        ? (item.startedAt ?? now)
        : (status === "pending" ? null : item.startedAt),
      completedAt: status === "done"
        ? (item.completedAt ?? now)
        : null,
    },
  });

  logActivity("update", "workItem", id, String(formData.get("task")) || "WorkItem", { projectId: item.projectId });
  redirect(`${projectPath(locale, item.projectId)}?tab=tareas&success=Tarea+actualizada`);
}

export async function swapWorkItemOrder(locale: Locale, formData: FormData) {
  await requireActionAccess();

  const id = String(formData.get("id") ?? "");
  const direction = String(formData.get("direction") ?? "down");
  const item = await prisma.workItem.findUnique({ where: { id } });
  if (!item) return redirect(`${projectPath(locale, "404")}?tab=tareas&error=Tarea+no+encontrada`);

  await prisma.$transaction(async (tx) => {
    const siblings = await tx.workItem.findMany({
      where: { projectId: item.projectId, category: item.category },
      orderBy: [{ sortOrder: "asc" }, { task: "asc" }, { id: "asc" }],
    });
    const currentIndex = siblings.findIndex((sibling) => sibling.id === id);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= siblings.length) {
      return;
    }

    const current = siblings[currentIndex];
    const target = siblings[targetIndex];
    const currentOrder = current.sortOrder === target.sortOrder ? currentIndex : current.sortOrder;
    const targetOrder = current.sortOrder === target.sortOrder ? targetIndex : target.sortOrder;

    await Promise.all([
      tx.workItem.update({ where: { id: current.id }, data: { sortOrder: targetOrder } }),
      tx.workItem.update({ where: { id: target.id }, data: { sortOrder: currentOrder } }),
    ]);
  });

  revalidatePath(projectPath(locale, item.projectId));
  redirect(`${projectPath(locale, item.projectId)}?tab=tareas&success=Orden+actualizado`);
}

export async function deleteWorkItem(locale: Locale, formData: FormData) {
  await requireActionAccess();

  const id = String(formData.get("id") ?? "");
  const item = await prisma.workItem.findUnique({ where: { id } });
  if (!item) return redirect(`${projectPath(locale, "404")}?error=Tarea+no+encontrada`);

  await prisma.workItem.delete({ where: { id } });

  logActivity("delete", "workItem", id, item.task, { projectId: item.projectId });
  redirect(`${projectPath(locale, item.projectId)}?tab=tareas&success=Tarea+eliminada`);
}

function invoicePath(locale: Locale, invoiceId: string) {
  return `${path(locale)}/invoices/${invoiceId}`;
}

function templatesPath(locale: Locale) {
  return `${path(locale)}/templates`;
}

function servicesPath(locale: Locale) {
  return `${path(locale)}/services`;
}

async function nextInvoiceNumber() {
  const year = new Date().getFullYear();
  const id = `FAC-${year}`;
  const counter = await prisma.invoiceCounter.upsert({
    where: { id },
    create: { id, year, seq: 1 },
    update: { seq: { increment: 1 } },
  });

  return `${id}-${String(counter.seq).padStart(4, "0")}`;
}

export async function createInvoiceFromProforma(locale: Locale, formData: FormData) {
  await requireActionAccess();

  const proformaId = String(formData.get("proformaId") ?? "");
  const dueDate = formData.get("dueDate")
    ? new Date(String(formData.get("dueDate") ?? ""))
    : undefined;
  const discount = Number(formData.get("discount") ?? 0);
  const ivaRate = Number(formData.get("ivaRate") ?? 21);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const payMethod = paymentMethod(formData.get("paymentMethod"));
  const payTerms = String(formData.get("paymentTerms") ?? "").trim() || null;

  const proforma = await prisma.proforma.findUnique({
    where: { id: proformaId },
    include: { items: true },
  });

  if (!proforma || proforma.status !== "accepted") {
    redirect(`${proformaPath(locale, proformaId)}?error=La+proforma+debe+estar+aceptada`);
    return;
  }

  const items = proforma.items.map((item) => ({
    description: publicLineDescription(item.description),
    hours: null,
    rate: null,
    amount: item.clientPrice || item.amount,
  }));
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.amount, 0));
  const ivaBase = Math.max(0, subtotal - discount);
  const ivaAmount = roundMoney(ivaBase * (ivaRate / 100));
  const total = roundMoney(ivaBase + ivaAmount);

  const invoice = await prisma.$transaction(async (tx) => {
    await tx.proforma.update({
      where: { id: proformaId },
      data: { status: "converted" },
    });

    const created = await tx.invoice.create({
      data: {
        proformaId,
        number: await nextInvoiceNumber(),
        issueDate: new Date(),
        dueDate: dueDate ?? null,
        subtotal,
        discount,
        ivaRate,
        ivaAmount,
        total,
        notes,
        items: { create: items },
      },
    });
    await setDocumentPaymentFields(tx, "invoices", created.id, payMethod, payTerms);
    return created;
  });

  await logActivity("created", "invoice", invoice.id, invoice.number, { proformaId });
  redirectWithReturnTo(locale, formData, `${invoicePath(locale, invoice.id)}?success=Factura+creada+desde+proforma`, "Factura+creada+desde+proforma");
}

export async function updateInvoice(locale: Locale, invoiceId: string, formData: FormData) {
  await requireActionAccess();

  const discount = Number(formData.get("discount") ?? 0);
  const ivaRate = Number(formData.get("ivaRate") ?? 21);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const payMethod = paymentMethod(formData.get("paymentMethod"));
  const payTerms = String(formData.get("paymentTerms") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "draft") as
    | "draft"
    | "sent"
    | "paid"
    | "cancelled"
    | "overdue";
  const dueDate = formData.get("dueDate")
    ? new Date(String(formData.get("dueDate") ?? ""))
    : null;
  const itemIds = formData.getAll("itemId").map((value) => String(value));
  const deleteItemIds = new Set(formData.getAll("deleteItemId").map((value) => String(value)));

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { id: true },
  });

  if (!invoice) return;

  await prisma.$transaction(async (tx) => {
    for (const itemId of itemIds) {
      if (deleteItemIds.has(itemId)) {
        await tx.invoiceItem.delete({ where: { id: itemId } });
        continue;
      }

      const amount = Number(formData.get(`amount_${itemId}`) ?? Number.NaN);

      await tx.invoiceItem.update({
        where: { id: itemId },
        data: {
          description: String(formData.get(`description_${itemId}`) ?? "").trim(),
          hours: null,
          rate: null,
          amount: Number.isFinite(amount) ? roundMoney(amount) : 0,
        },
      });
    }

    const newDescription = String(formData.get("newDescription") ?? "").trim();
    const newAmount = Number(formData.get("newAmount") ?? 0);

    if (newDescription && newAmount > 0) {
      await tx.invoiceItem.create({
        data: {
          invoiceId,
          description: newDescription,
          hours: null,
          rate: null,
          amount: roundMoney(newAmount),
        },
      });
    }

    const items = await tx.invoiceItem.findMany({ where: { invoiceId } });
    const subtotal = roundMoney(items.reduce((sum, item) => sum + item.amount, 0));
    const ivaBase = Math.max(0, subtotal - discount);
    const ivaAmount = roundMoney(ivaBase * (ivaRate / 100));
    const total = roundMoney(ivaBase + ivaAmount);

    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        subtotal,
        discount,
        ivaRate,
        ivaAmount,
        total,
        notes,
        status,
        dueDate,
      },
    });
    await setDocumentPaymentFields(tx, "invoices", invoiceId, payMethod, payTerms);
  });

  revalidatePath(path(locale));
  revalidatePath(invoicePath(locale, invoiceId));
  const returnTo = String(formData.get("returnTo") ?? "").trim();
  if (returnTo.startsWith(`/${locale}/account/tools/docs`)) {
    redirect(`${invoicePath(locale, invoiceId)}?returnTo=${encodeURIComponent(returnTo)}&success=Factura+actualizada`);
  }
  redirect(`${invoicePath(locale, invoiceId)}?success=Factura+actualizada`);
}

export async function sendInvoiceByEmail(locale: Locale, invoiceId: string, formData: FormData) {
  await requireActionAccess();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      items: true,
      proforma: {
        include: {
          project: {
            include: { client: true },
          },
        },
      },
    },
  });

  const to = String(formData.get("to") ?? invoice?.proforma.project.client.email ?? "").trim();
  const subject = String(formData.get("subject") ?? `Factura ${invoice?.number ?? ""}`).trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!invoice || !to) {
    redirectErrorWithReturnTo(locale, formData, `${invoicePath(locale, invoiceId)}?error=Email+no+disponible`, "Email+no+disponible");
    return;
  }

  try {
    const pdf = await renderInvoicePdfBuffer(invoice);
    const providerMessageId = await sendDocumentEmail({
      to,
      subject,
      filename: `${invoice.number}.pdf`,
      pdf,
      html: `
        <p>Hola ${invoice.proforma.project.client.name},</p>
        <p>Te enviamos la factura <strong>${invoice.number}</strong> del proyecto <strong>${invoice.proforma.project.name}</strong>.</p>
        ${message ? `<p>${message.replace(/\n/g, "<br />")}</p>` : ""}
        <p>Adjuntamos el PDF en este correo.</p>
      `,
    });

    await prisma.documentEmailLog.create({
      data: {
        documentType: "invoice",
        documentId: invoice.id,
        invoiceId: invoice.id,
        to,
        subject,
        status: "sent",
        providerMessageId,
      },
    });
    await logActivity("email", "invoice", invoice.id, invoice.number, { to, provider: "resend" });
    revalidatePath(path(locale));
    revalidatePath(invoicePath(locale, invoice.id));
    revalidatePath(proformaPath(locale, invoice.proformaId));
    redirectWithReturnTo(locale, formData, `${invoicePath(locale, invoice.id)}?success=Factura+enviada`, "Factura+enviada");
  } catch (error) {
    const messageText = emailErrorMessage(error);
    await prisma.documentEmailLog.create({
      data: {
        documentType: "invoice",
        documentId: invoice.id,
        invoiceId: invoice.id,
        to,
        subject,
        status: "failed",
        error: messageText,
      },
    });
    await logActivity("email_failed", "invoice", invoice.id, invoice.number, { to, error: messageText });
    redirectErrorWithReturnTo(locale, formData, `${invoicePath(locale, invoice.id)}?error=${encodeURIComponent(messageText)}`, encodeURIComponent(messageText));
  }
}

export async function deleteInvoice(locale: Locale, invoiceId: string, formData: FormData) {
  void formData;
  await requireActionAccess();

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { number: true, proforma: { select: { id: true } } },
  });

  if (!invoice) {
    redirect(`${path(locale)}?error=Factura+no+encontrada`);
  }

  await prisma.invoice.delete({ where: { id: invoiceId } });
  redirect(`${path(locale)}?success=Factura+eliminada`);
}

export async function registerPayment(locale: Locale, formData: FormData) {
  await requireActionAccess();

  const invoiceId = String(formData.get("invoiceId") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const method = String(formData.get("method") ?? "").trim() || null;
  const reference = String(formData.get("reference") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (amount <= 0) {
    redirect(`${invoicePath(locale, invoiceId)}?error=El+importe+debe+ser+mayor+que+cero`);
    return;
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { total: true, number: true },
  });

  if (!invoice) return;

  await prisma.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        invoiceId,
        amount,
        method,
        reference,
        notes,
        paidAt: new Date(),
      },
    });

    const payments = await tx.payment.aggregate({
      where: { invoiceId },
      _sum: { amount: true },
    });

    const totalPaid = payments._sum.amount ?? 0;

    if (totalPaid >= invoice.total) {
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: "paid" },
      });
    }
  });

  await logActivity("payment", "invoice", invoiceId, invoice.number, { amount, method });
  revalidatePath(invoicePath(locale, invoiceId));
  revalidatePath(path(locale));
}

export async function deletePayment(locale: Locale, paymentId: string, _formData: FormData) {
  void _formData;
  await requireActionAccess();

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { invoiceId: true },
  });

  if (!payment) return;

  await prisma.$transaction(async (tx) => {
    await tx.payment.delete({ where: { id: paymentId } });

    const invoice = await tx.invoice.findUnique({
      where: { id: payment.invoiceId },
      select: { total: true, status: true },
    });
    if (!invoice) return;

    const payments = await tx.payment.aggregate({
      where: { invoiceId: payment.invoiceId },
      _sum: { amount: true },
    });

    const totalPaid = payments._sum.amount ?? 0;

    const newStatus = totalPaid >= invoice.total ? "paid" : "sent";
    await tx.invoice.update({
      where: { id: payment.invoiceId },
      data: { status: newStatus },
    });
  });

  revalidatePath(invoicePath(locale, payment.invoiceId));
  revalidatePath(path(locale));
}

export async function createService(locale: Locale, formData: FormData) {
  await requireActionAccess();

  const rateLabels = formData.getAll("rateLabel").map((v) => String(v));
  const rateValues = formData.getAll("rateValue").map((v) => Number(v));
  const rateCosts = formData.getAll("rateCost").map((v) => Number(v));
  const rateTypes = formData.getAll("rateType").map((v) => String(v));

  const rates = rateLabels
    .map((label, i) => ({
      label,
      rate: rateValues[i] ?? 0,
      internalCost: rateCosts[i] ?? 0,
      clientPrice: rateValues[i] ?? 0,
      unitType: rateTypes[i] ?? "hours",
    }))
    .filter((r) => r.label.trim() && r.rate > 0);

  await prisma.service.create({
    data: {
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || null,
      category: String(formData.get("category") ?? "").trim() || null,
      lineType: businessLineType(formData.get("lineType")),
      provider: String(formData.get("provider") ?? "").trim() || null,
      defaultUnitType: billingUnit(formData.get("defaultUnitType")),
      rates: { create: rates },
    },
  });

  revalidatePath(servicesPath(locale));
  revalidatePath(path(locale));
}

export async function updateService(locale: Locale, serviceId: string, formData: FormData) {
  await requireActionAccess();

  await prisma.$transaction(async (tx) => {
    await tx.service.update({
      where: { id: serviceId },
      data: {
        name: String(formData.get("name") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim() || null,
        category: String(formData.get("category") ?? "").trim() || null,
        lineType: businessLineType(formData.get("lineType")),
        provider: String(formData.get("provider") ?? "").trim() || null,
        defaultUnitType: billingUnit(formData.get("defaultUnitType")),
      },
    });

    await tx.serviceRate.deleteMany({ where: { serviceId } });

    const rateLabels = formData.getAll("rateLabel").map((v) => String(v));
    const rateValues = formData.getAll("rateValue").map((v) => Number(v));
    const rateCosts = formData.getAll("rateCost").map((v) => Number(v));
    const rateTypes = formData.getAll("rateType").map((v) => String(v));

    const rates = rateLabels
      .map((label, i) => ({
        label,
        rate: rateValues[i] ?? 0,
        internalCost: rateCosts[i] ?? 0,
        clientPrice: rateValues[i] ?? 0,
        unitType: rateTypes[i] ?? "hours",
      }))
      .filter((r) => r.label.trim() && r.rate > 0);

    if (rates.length > 0) {
      await tx.serviceRate.createMany({
        data: rates.map((r) => ({ ...r, serviceId })),
      });
    }
  });

  revalidatePath(servicesPath(locale));
  revalidatePath(path(locale));
}

export async function deleteService(locale: Locale, serviceId: string, formData: FormData) {
  void formData;
  await requireActionAccess();

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    select: { name: true },
  });

  if (!service) {
    redirect(`${servicesPath(locale)}?error=Servicio+no+encontrado`);
  }

  await prisma.service.delete({ where: { id: serviceId } });
  revalidatePath(servicesPath(locale));
  revalidatePath(path(locale));
}

export async function createServiceTemplateFromDb(locale: Locale, formData: FormData) {
  await requireActionAccess();

  const descriptions = formData.getAll("lineDescription").map((v) => String(v));
  const hours = formData.getAll("lineHours").map((v) => Number(v) || null);
  const rates = formData.getAll("lineRate").map((v) => Number(v) || null);
  const amounts = formData.getAll("lineAmount").map((v) => Number(v) || 0);
  const lineTypes = formData.getAll("lineType").map((v) => businessLineType(v));
  const unitTypes = formData.getAll("lineUnitType").map((v) => billingUnit(v));
  const internalCosts = formData.getAll("lineInternalCost").map((v) => Number(v) || 0);
  const providers = formData.getAll("lineProvider").map((v) => String(v).trim());
  const recurrenceMonths = formData.getAll("lineRecurrenceMonths").map((v) => Number(v) || null);

  const lines = descriptions
    .map((description, i) => ({
      description,
      hours: hours[i] ?? null,
      rate: rates[i] ?? null,
      amount: amounts[i] ?? 0,
      lineType: lineTypes[i] ?? "own_work",
      unitType: unitTypes[i] ?? "hour",
      internalCost: internalCosts[i] ?? 0,
      clientPrice: amounts[i] ?? 0,
      provider: providers[i] || null,
      isRecurring: (lineTypes[i] ?? "own_work") === "recurring_service" || (unitTypes[i] ?? "hour") === "monthly" || (unitTypes[i] ?? "hour") === "yearly",
      recurrenceMonths: recurrenceMonths[i] ?? ((unitTypes[i] ?? "hour") === "yearly" ? 12 : (unitTypes[i] ?? "hour") === "monthly" ? 1 : null),
      sortOrder: i,
    }))
    .filter((l) => l.description.trim());

  await prisma.serviceTemplate.create({
    data: {
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim() || null,
      category: String(formData.get("category") ?? "").trim() || null,
      lines: { create: lines },
    },
  });

  revalidatePath(templatesPath(locale));
  revalidatePath(path(locale));
}

export async function deleteServiceTemplateFromDb(locale: Locale, templateId: string, formData: FormData) {
  void formData;
  await requireActionAccess();

  const template = await prisma.serviceTemplate.findUnique({
    where: { id: templateId },
    select: { name: true },
  });

  if (!template) {
    redirect(`${templatesPath(locale)}?error=Plantilla+no+encontrada`);
  }

  await prisma.serviceTemplate.delete({ where: { id: templateId } });
  revalidatePath(templatesPath(locale));
  revalidatePath(path(locale));
}

export async function updateServiceTemplateFromDb(locale: Locale, templateId: string, formData: FormData) {
  await requireActionAccess();

  const descriptions = formData.getAll("lineDescription").map((v) => String(v));
  const hours = formData.getAll("lineHours").map((v) => Number(v) || null);
  const rates = formData.getAll("lineRate").map((v) => Number(v) || null);
  const amounts = formData.getAll("lineAmount").map((v) => Number(v) || 0);
  const lineTypes = formData.getAll("lineType").map((v) => businessLineType(v));
  const unitTypes = formData.getAll("lineUnitType").map((v) => billingUnit(v));
  const internalCosts = formData.getAll("lineInternalCost").map((v) => Number(v) || 0);
  const providers = formData.getAll("lineProvider").map((v) => String(v).trim());
  const recurrenceMonths = formData.getAll("lineRecurrenceMonths").map((v) => Number(v) || null);

  const lines = descriptions
    .map((description, i) => ({
      description,
      hours: hours[i] ?? null,
      rate: rates[i] ?? null,
      amount: amounts[i] ?? 0,
      lineType: lineTypes[i] ?? "own_work",
      unitType: unitTypes[i] ?? "hour",
      internalCost: internalCosts[i] ?? 0,
      clientPrice: amounts[i] ?? 0,
      provider: providers[i] || null,
      isRecurring: (lineTypes[i] ?? "own_work") === "recurring_service" || (unitTypes[i] ?? "hour") === "monthly" || (unitTypes[i] ?? "hour") === "yearly",
      recurrenceMonths: recurrenceMonths[i] ?? ((unitTypes[i] ?? "hour") === "yearly" ? 12 : (unitTypes[i] ?? "hour") === "monthly" ? 1 : null),
      sortOrder: i,
    }))
    .filter((l) => l.description.trim());

  await prisma.$transaction(async (tx) => {
    await tx.serviceTemplate.update({
      where: { id: templateId },
      data: {
        name: String(formData.get("name") ?? "").trim(),
        description: String(formData.get("description") ?? "").trim() || null,
        category: String(formData.get("category") ?? "").trim() || null,
      },
    });

    await tx.serviceTemplateLine.deleteMany({ where: { templateId } });

    if (lines.length > 0) {
      await tx.serviceTemplateLine.createMany({
        data: lines.map((l) => ({ ...l, templateId })),
      });
    }
  });

  revalidatePath(templatesPath(locale));
  revalidatePath(path(locale));
}

export async function importCsv(locale: Locale, formData: FormData) {
  await requireActionAccess();

  const type = String(formData.get("type") ?? "");
  const raw = String(formData.get("data") ?? "");

  let rows: Record<string, string>[];
  try {
    rows = JSON.parse(raw);
  } catch {
    redirect(`${path(locale)}/import?error=Datos+JSON+inválidos`);
    return;
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    redirect(`${path(locale)}/import?error=No+hay+datos+para+importar`);
    return;
  }

  let created = 0;
  let errors = 0;

  if (type === "clients") {
    for (const row of rows) {
      const name = (row.name || row.Nombre || row.nombre || row.NAME || "").toString().trim();
      if (!name) { errors++; continue; }

      try {
        await prisma.client.create({
          data: {
            name,
            nifCif: (row.nifCif || row.NIF || row.CIF || row.nif || "").toString().trim() || null,
            email: (row.email || row.Email || row.EMAIL || row.mail || "").toString().trim() || null,
            phone: (row.phone || row.Phone || row.Telefono || row.teléfono || row.tlf || "").toString().trim() || null,
            address: (row.address || row.Address || row.Direccion || row.dirección || "").toString().trim() || null,
            country: (row.country || row.Country || row.Pais || row.país || "ES").toString().trim() || "ES",
            vatId: (row.vatId || row.VAT || row.vat || "").toString().trim() || null,
          },
        });
        created++;
      } catch {
        errors++;
      }
    }
  } else if (type === "services") {
    for (const row of rows) {
      const name = (row.name || row.Nombre || row.nombre || row.NAME || row.Service || "").toString().trim();
      if (!name) { errors++; continue; }

      try {
        const rate = Number(row.rate || row.Rate || row.Precio || row.precio || row.tarifa || 0);
        const rateLabel = row.rateLabel || row.Label || row.Tipo || row.tipo || "Hora base";

        await prisma.service.create({
          data: {
            name,
            description: (row.description || row.Description || row.Descripcion || row.descripción || "").toString().trim() || null,
            category: (row.category || row.Category || row.Categoria || row.categoría || "").toString().trim() || null,
            rates: rate > 0 ? {
              create: {
                label: rateLabel.toString().trim(),
                rate,
                unitType: (row.unitType || row.Unit || row.Unidad || "hours").toString().trim(),
              },
            } : undefined,
          },
        });
        created++;
      } catch {
        errors++;
      }
    }
  } else {
    redirect(`${path(locale)}/import?error=Tipo+no+válido`);
    return;
  }

  const msg = encodeURIComponent(`Importados ${created} registros${errors > 0 ? `, ${errors} errores` : ""}`);
  redirect(`${path(locale)}/import?success=${msg}`);
}
