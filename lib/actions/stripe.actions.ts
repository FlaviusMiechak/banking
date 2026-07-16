"use server";

import Stripe from "stripe";
export const dynamic = 'force-dynamic'
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

export interface CreateStripeCustomerParams {
  email: string;
  firstName: string;
  lastName: string;
  userId: string;
}

export const createStripeCustomer = async ({
  email,
  firstName,
  lastName,
  userId,
}: CreateStripeCustomerParams) => {
  const customer = await stripe.customers.create({
    email,
    name: `${firstName} ${lastName}`,
    metadata: {
      user_id: userId,
    },
  });

  return customer;
};

export interface CreateStripeCardholderParams {
  userId: string;
  customerId: string;
  email: string;
  firstName: string;
  lastName: string;
  address: Stripe.Issuing.CardholderCreateParams.Billing.Address;
}

export const createStripeCardholder = async ({
  userId,
  customerId,
  email,
  firstName,
  lastName,
  address,
}: CreateStripeCardholderParams) => {
  const cardholder = await stripe.issuing.cardholders.create({
    type: "individual",
    name: `${firstName} ${lastName}`,
    email,

    billing: {
      address,
    },

    individual: {
      first_name: firstName,
      last_name: lastName,
    },

    metadata: {
      user_id: userId,
      stripe_customer_id: customerId,
    },
  });

  return cardholder;
};