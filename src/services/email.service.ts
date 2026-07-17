import { createElement, type ReactElement } from 'react';
import { WelcomeEmail, type WelcomeEmailProps } from '../../emails';
import { resend } from '../lib/resend';

type EmailAddress = string | string[];

export type SendEmailParams = {
  to: EmailAddress;
  subject: string;
  react: ReactElement;
  from?: string;
  replyTo?: EmailAddress;
  cc?: EmailAddress;
  bcc?: EmailAddress;
  tags?: Array<{ name: string; value: string }>;
};

const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL?.trim() || 'IronShape <onboarding@resend.dev>';

function assertEmailConfig() {
  if (!DEFAULT_FROM) {
    throw new Error('RESEND_FROM_EMAIL não configurada. Defina o remetente padrão dos emails do IronShape.');
  }
}

export class EmailService {
  static async sendEmail({
    to,
    subject,
    react,
    from = DEFAULT_FROM,
    replyTo,
    cc,
    bcc,
    tags,
  }: SendEmailParams) {
    assertEmailConfig();

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      react,
      replyTo,
      cc,
      bcc,
      tags,
    });

    if (error) {
      throw new Error(`Erro ao enviar email pelo Resend: ${error.message}`);
    }

    return data;
  }

  static async sendWelcomeEmail({ to, ...templateProps }: WelcomeEmailProps & { to: EmailAddress }) {
    return EmailService.sendEmail({
      to,
      subject: 'Bem-vindo ao IronShape',
      react: createElement(WelcomeEmail, templateProps),
      tags: [{ name: 'email_type', value: 'welcome' }],
    });
  }
}
