import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildExternalId,
  extractWebhookMetadata,
  getCheckoutConfig,
  getPaymentDate,
  isActivationEvent,
  isCancellationEvent,
  isPaidPlan,
  shouldUseStaticCheckout,
  signAbacatePayload,
  validateCreatePaymentBody,
  verifyAbacateSignature,
} from '../src/server/payment';

test('validates paid plans only', () => {
  assert.equal(isPaidPlan('Pro'), true);
  assert.equal(isPaidPlan('Elite'), true);
  assert.equal(isPaidPlan('Iniciante'), false);
  assert.equal(isPaidPlan(undefined), false);
});

test('validates create payment payload', () => {
  assert.deepEqual(validateCreatePaymentBody({ plan: 'free', userId: 'user-123456' }), {
    ok: false,
    error: 'Plano inválido para pagamento.',
  });

  assert.deepEqual(validateCreatePaymentBody({ plan: 'Pro', userId: 'abc' }), {
    ok: false,
    error: 'userId é obrigatório para criar pagamento.',
  });

  assert.deepEqual(validateCreatePaymentBody({ plan: 'Pro', userId: 'user-123456', customerEmail: 'bad-email' }), {
    ok: false,
    error: 'Email do cliente inválido.',
  });

  assert.deepEqual(validateCreatePaymentBody({ plan: 'Elite', userId: ' user-123456 ', customerEmail: 'user@test.com', referralCode: 'REF_01' }), {
    ok: true,
    value: {
      plan: 'Elite',
      userId: 'user-123456',
      customerEmail: 'user@test.com',
      referralCode: 'REF_01',
      analyticsClientId: null,
    },
  });

  assert.deepEqual(validateCreatePaymentBody({ plan: 'Pro', userId: 'user-123456', analyticsClientId: '123456.abcdef' }), {
    ok: true,
    value: {
      plan: 'Pro',
      userId: 'user-123456',
      customerEmail: undefined,
      referralCode: null,
      analyticsClientId: '123456.abcdef',
    },
  });
});

test('uses static checkout when api key or product id is missing', () => {
  const env = {
    ABACATEPAY_CHECKOUT_PRO_URL: 'https://checkout.example/pro',
  } as NodeJS.ProcessEnv;

  assert.equal(shouldUseStaticCheckout('Pro', env), true);
  assert.equal(getCheckoutConfig('Pro', env).fallbackUrl, 'https://checkout.example/pro');

  assert.equal(shouldUseStaticCheckout('Pro', {
    ABACATEPAY_API_KEY: 'key',
    ABACATEPAY_PRODUCT_PRO_ID: 'product-pro',
  } as NodeJS.ProcessEnv), false);
});

test('builds external id with referral fallback', () => {
  assert.equal(buildExternalId({ userId: 'user-1', plan: 'Pro', referralCode: null, now: 123 }), 'ironshape:user-1:Pro:no-ref:123');
  assert.equal(buildExternalId({ userId: 'user-1', plan: 'Elite', referralCode: 'AFF', now: 456 }), 'ironshape:user-1:Elite:AFF:456');
});

test('verifies AbacatePay webhook signature', () => {
  const rawBody = JSON.stringify({ event: 'checkout.completed' });
  const key = 'test-secret';
  const signature = signAbacatePayload(rawBody, key);

  assert.equal(verifyAbacateSignature(rawBody, signature, key), true);
  assert.equal(verifyAbacateSignature(rawBody, 'wrong-signature', key), false);
  assert.equal(verifyAbacateSignature(rawBody, undefined, key), false);
});

test('extracts webhook metadata from metadata and external id', () => {
  const env = { ABACATEPAY_PRODUCT_PRO_ID: 'product-pro' } as NodeJS.ProcessEnv;
  const eventWithMetadata = {
    event: 'checkout.completed',
    data: {
      checkout: {
        externalId: 'ironshape:fallback-user:Elite:AFF2:999',
        metadata: { userId: 'user-1', plan: 'Pro', referralCode: 'AFF1', analyticsClientId: '123456.abcdef' },
      },
    },
  };

  assert.deepEqual(extractWebhookMetadata(eventWithMetadata, env), {
    checkout: eventWithMetadata.data.checkout,
    customer: undefined,
    payment: undefined,
    subscription: undefined,
    userId: 'user-1',
    plan: 'Pro',
    referralCode: 'AFF1',
    analyticsClientId: '123456.abcdef',
  });

  const eventWithProductAndExternalId = {
    event: 'checkout.completed',
    data: {
      checkout: {
        externalId: 'ironshape:user-2:Elite:AFF2:999',
        items: [{ id: 'product-pro' }],
      },
    },
  };

  const metadata = extractWebhookMetadata(eventWithProductAndExternalId, env);
  assert.equal(metadata.userId, 'user-2');
  assert.equal(metadata.plan, 'Elite');
  assert.equal(metadata.referralCode, 'AFF2');
});

test('classifies webhook events', () => {
  assert.equal(isActivationEvent('checkout.completed'), true);
  assert.equal(isActivationEvent('subscription.renewed'), true);
  assert.equal(isActivationEvent('subscription.cancelled'), false);
  assert.equal(isCancellationEvent('subscription.cancelled'), true);
  assert.equal(isCancellationEvent('checkout.completed'), false);
});

test('uses the confirmed payment date from the webhook', () => {
  assert.equal(getPaymentDate({ data: { payment: { paidAt: '2026-06-18T15:30:00.000Z' } } }), '2026-06-18T15:30:00.000Z');
  assert.equal(
    getPaymentDate({ data: {} }, new Date('2026-06-19T10:00:00.000Z')),
    '2026-06-19T10:00:00.000Z',
  );
});
