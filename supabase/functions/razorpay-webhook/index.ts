// Deploy via the Supabase Dashboard: Edge Functions -> Create a function -> "razorpay-webhook",
// paste this file's contents, then set the RAZORPAY_WEBHOOK_SECRET secret (Edge Functions -> Manage secrets).
// After deploying, copy the function's URL into Razorpay Dashboard -> Settings -> Webhooks,
// selecting the subscription.* events, and paste the same secret there.
//
// This function must accept unauthenticated requests (Razorpay calls it directly) —
// when creating it in the dashboard, turn OFF "Enforce JWT verification".

import { createClient } from 'jsr:@supabase/supabase-js@2';

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET')!;

async function verifySignature(body: string, signature: string | null): Promise<boolean> {
  if (!signature) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(RAZORPAY_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuffer = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  const expected = Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return expected === signature;
}

Deno.serve(async (req) => {
  const rawBody = await req.text();
  const signature = req.headers.get('X-Razorpay-Signature');

  if (!(await verifySignature(rawBody, signature))) {
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(rawBody);
  const subscriptionEntity = event.payload?.subscription?.entity;
  if (!subscriptionEntity) return new Response('ok');

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const statusByEvent: Record<string, 'active' | 'canceled' | 'past_due'> = {
    'subscription.activated': 'active',
    'subscription.charged': 'active',
    'subscription.cancelled': 'canceled',
    'subscription.completed': 'canceled',
    'subscription.halted': 'past_due',
  };
  const status = statusByEvent[event.event];
  if (!status) return new Response('ok');

  await supabase
    .from('subscriptions')
    .update({
      status,
      plan: status === 'active' ? 'paid' : 'free',
      current_period_end: subscriptionEntity.current_end
        ? new Date(subscriptionEntity.current_end * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('razorpay_subscription_id', subscriptionEntity.id);

  return new Response('ok');
});
