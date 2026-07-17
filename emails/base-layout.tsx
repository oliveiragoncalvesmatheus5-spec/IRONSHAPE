import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Tailwind,
} from '@react-email/components';
import type { ReactNode } from 'react';

type BaseLayoutProps = {
  preview: string;
  children: ReactNode;
};

export function BaseLayout({ preview, children }: BaseLayoutProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="m-0 bg-[#0b0f14] px-4 py-8 font-sans text-[#f8fafc]">
          <Container className="mx-auto max-w-[560px] rounded-[8px] bg-[#111827] p-8">
            <Section>{children}</Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
