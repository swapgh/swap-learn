import "server-only";

import { Resend } from "resend";

type SendDocumentEmailInput = {
  to: string;
  subject: string;
  html: string;
  filename: string;
  pdf: Buffer;
};

function mailFrom() {
  return process.env.SWAPDOCS_MAIL_FROM?.trim() || "SwapDocs <onboarding@resend.dev>";
}

function mailReplyTo() {
  return process.env.SWAPDOCS_MAIL_REPLY_TO?.trim() || undefined;
}

export async function sendDocumentEmail({
  to,
  subject,
  html,
  filename,
  pdf,
}: SendDocumentEmailInput) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY no configurada");
  }

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: mailFrom(),
    to,
    replyTo: mailReplyTo(),
    subject,
    html,
    attachments: [
      {
        filename,
        content: pdf,
      },
    ],
  });

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data?.id ?? null;
}
