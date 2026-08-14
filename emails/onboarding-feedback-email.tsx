import { Button, Heading, Hr, Text } from '@react-email/components';
import { BaseLayout } from './base-layout';

export type OnboardingFeedbackEmailProps = {
  name?: string;
  dashboardUrl: string;
  replyToEmail: string;
};

const reasons = [
  'Fiquei sem tempo',
  'Travei em alguma etapa',
  'Nao entendi como continuar',
  'O plano/preco me fez parar',
  'Nao era o que eu buscava',
];

function feedbackMailto(replyToEmail: string, reason: string) {
  const subject = encodeURIComponent(`IronShape onboarding - ${reason}`);
  const body = encodeURIComponent(`Oi, parei no onboarding porque: ${reason}\n\nMeu comentario: `);
  return `mailto:${replyToEmail}?subject=${subject}&body=${body}`;
}

export function OnboardingFeedbackEmail({ name = 'atleta', dashboardUrl, replyToEmail }: OnboardingFeedbackEmailProps) {
  return (
    <BaseLayout preview="Seu plano inicial do IronShape ficou quase pronto">
      <Heading className="m-0 text-[28px] font-bold text-white">
        {name}, seu plano ficou quase pronto.
      </Heading>
      <Text className="mt-4 text-[16px] leading-[24px] text-[#cbd5e1]">
        Vi que voce criou sua conta no IronShape, mas nao finalizou o diagnostico inicial. Quero entender se algo travou para melhorar o app.
      </Text>
      <Text className="mt-4 text-[15px] leading-[23px] text-[#cbd5e1]">
        Pode clicar em uma opcao abaixo? Abre uma resposta pronta e leva menos de 10 segundos.
      </Text>
      {reasons.map(reason => (
        <Button
          key={reason}
          href={feedbackMailto(replyToEmail, reason)}
          className="mt-3 block rounded-[6px] border border-[#334155] bg-[#172033] px-5 py-3 text-center text-[14px] font-bold text-[#f8fafc]"
        >
          {reason}
        </Button>
      ))}
      <Hr className="my-6 border-[#1f2937]" />
      <Text className="text-[15px] leading-[23px] text-[#cbd5e1]">
        Se quiser continuar agora, seu cadastro ainda esta salvo.
      </Text>
      <Button
        href={dashboardUrl}
        className="mt-2 rounded-[6px] bg-[#ff6a00] px-5 py-3 text-[14px] font-bold text-white"
      >
        Finalizar meu diagnostico
      </Button>
      <Text className="mt-6 text-[12px] leading-[18px] text-[#94a3b8]">
        Se voce nao criou uma conta no IronShape, ignore este email.
      </Text>
    </BaseLayout>
  );
}

export default OnboardingFeedbackEmail;
