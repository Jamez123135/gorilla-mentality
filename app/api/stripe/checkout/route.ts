import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia", // Use latest version
});

export async function POST(req: Request) {
  try {
    // In a real app, we'd get the userId from the session
    // For now, we create a session for the current user
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "One-on-One Gorilla Coaching Deposit",
              description: "Initial consultation and onboarding fee to secure your spot in the elite coaching program.",
            },
            unit_amount: 14900, // $149.00
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/dashboard?success=coaching`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/pricing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
