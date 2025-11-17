'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ReactNode } from 'react';

const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Solo crear la promesa de Stripe si tenemos la clave
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

interface StripeProviderWrapperProps {
  children: ReactNode;
}

export function StripeProviderWrapper({ children }: StripeProviderWrapperProps) {
  // Solo renderizar Elements si tenemos la clave pública y la promesa de Stripe
  if (!stripePublishableKey || !stripePromise) {
    console.warn('Stripe no está configurado. Verifica NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
    return <>{children}</>;
  }

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}

