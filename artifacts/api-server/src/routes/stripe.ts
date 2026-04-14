import { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import { db } from "@workspace/db";
import { resumeSessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-04-30.basil",
});

const router = Router();

router.post("/sessions/:sessionId/checkout", async (req: Request, res: Response) => {
  try {
    const [session] = await db
      .select()
      .from(resumeSessionsTable)
      .where(eq(resumeSessionsTable.id, req.params.sessionId));

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    const baseUrl = process.env.FRONTEND_URL || `https://${process.env.REPLIT_DOMAINS?.split(",")[0] || "localhost"}`;

    const priceId = process.env.STRIPE_PRICE_ID;

    let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];

    if (priceId) {
      lineItems = [{ price: priceId, quantity: 1 }];
    } else {
      lineItems = [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: "Currículo Otimizado por IA",
              description: "Currículo personalizado para a vaga com análise ATS e PDF final",
            },
            unit_amount: 1990,
          },
          quantity: 1,
        },
      ];
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${baseUrl}/?session=${req.params.sessionId}&payment=success`,
      cancel_url: `${baseUrl}/?session=${req.params.sessionId}&payment=cancelled`,
      metadata: {
        resumeSessionId: req.params.sessionId,
      },
      customer_email: session.email || undefined,
      locale: "pt-BR",
    });

    await db
      .update(resumeSessionsTable)
      .set({
        stripeCheckoutSessionId: checkoutSession.id,
        updatedAt: new Date(),
      })
      .where(eq(resumeSessionsTable.id, req.params.sessionId));

    res.json({ checkoutUrl: checkoutSession.url });
  } catch (err) {
    req.log.error({ err }, "Error creating checkout");
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

router.post("/stripe/webhook", async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!webhookSecret) {
      req.log.error("STRIPE_WEBHOOK_SECRET is required for webhook verification");
      res.status(500).json({ error: "Stripe webhook secret is not configured" });
      return;
    }

    if (!sig) {
      res.status(400).json({ error: "Missing Stripe signature" });
      return;
    }

    event = stripe.webhooks.constructEvent(
      req.body as Buffer,
      sig,
      webhookSecret
    );
  } catch (err) {
    req.log.error({ err }, "Webhook signature verification failed");
    res.status(400).json({ error: "Webhook signature verification failed" });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;
    const resumeSessionId = checkoutSession.metadata?.resumeSessionId;

    if (resumeSessionId) {
      await db
        .update(resumeSessionsTable)
        .set({
          paymentStatus: "paid",
          status: "paid",
          updatedAt: new Date(),
        })
        .where(eq(resumeSessionsTable.id, resumeSessionId));
    }
  }

  res.json({ received: true });
});

export default router;
