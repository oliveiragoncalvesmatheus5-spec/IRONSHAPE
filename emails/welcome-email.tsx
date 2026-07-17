import { Button, Heading, Hr, Text } from '@react-email/components';
import { BaseLayout } from './base-layout';

export type WelcomeEmailProps = {
  name?: string;
  dashboardUrl: string;
};

export function WelcomeEmail({ name = 'atleta', dashboardUrl }: WelcomeEmailProps) {
  return (
    <BaseLayout preview="Bem-vindo ao IronShape">
      <Heading className="m-0 text-[28px] font-bold text-white">
        Bem-vindo ao IronShape, {name}.
      </Heading>
      <Text className="mt-4 text-[16px] leading-[24px] text-[#cbd5e1]">
        Sua conta está pronta. Acesse o painel para continuar seu treino, nutrição e evolução.
      </Text>
      <Button
        href={dashboardUrl}
        className="mt-4 rounded-[6px] bg-[#22c55e] px-5 py-3 text-[14px] font-bold text-[#04130a]"
      >
        Abrir IronShape
      </Button>
      <Hr className="my-6 border-[#1f2937]" />
      <Text className="m-0 text-[12px] leading-[18px] text-[#94a3b8]">
        Se você não criou uma conta no IronShape, ignore este email.
      </Text>
    </BaseLayout>
  );
}

export default WelcomeEmail;
