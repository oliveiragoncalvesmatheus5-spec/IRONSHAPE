import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY?.trim();

if (!resendApiKey) {
  throw new Error('RESEND_API_KEY não configurada. Defina a variável de ambiente antes de enviar emails pelo IronShape.');
}

export const resend = new Resend(resendApiKey);
