// Deploy via the Supabase Dashboard: Edge Functions -> Create a function -> "create-subscription",
// paste this file's contents, then set the secrets listed below (Edge Functions -> Manage secrets).
//
// Required secrets:
//   RAZORPAY_KEY_ID
//   RAZORPAY_KEY_SECRET
//   RAZORPAY_PLAN_ID
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically by Supabase.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const RAZORPAY_KEY_ID = Deno.env.get('RAZORPAY_KEY_ID')!;
const RAZORPAY_KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET')!;
const RAZORPAY_PLAN_ID = Deno.env.get('RAZORPAY_PLAN_ID')!;
const RAZORPAY_AUTH = 'Basic ' + btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Missing Authorization header', { status: 401 });

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) return new Response('Unauthorized', { status: 401 });

    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('razorpay_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = existingSub?.razorpay_customer_id;
    if (!customerId) {
      const customerResp = await fetch('https://api.razorpay.com/v1/customers', {
        method: 'POST',
        headers: { Authorization: RAZORPAY_AUTH, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: user.email, email: user.email, fail_existing: 0 }),
      });
      const customer = await customerResp.json();
      if (!customerResp.ok) return new Response(JSON.stringify(customer), { status: 400 });
      customerId = customer.id;
    }

    const subResp = await fetch('https://api.razorpay.com/v1/subscriptions', {
      method: 'POST',
      headers: { Authorization: RAZORPAY_AUTH, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: RAZORPAY_PLAN_ID,
        customer_notify: 1,
        total_count: 120,
        notes: { supabase_user_id: user.id },
      }),
    });
    const subscription = await subResp.json();
    if (!subResp.ok) return new Response(JSON.stringify(subscription), { status: 400 });

    await supabase.from('subscriptions').upsert({
      user_id: user.id,
      razorpay_customer_id: customerId,
      razorpay_subscription_id: subscription.id,
      plan: 'free',
      status: 'inactive',
    });

    return new Response(JSON.stringify({ short_url: subscription.short_url }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), { status: 500 });
  }
});
