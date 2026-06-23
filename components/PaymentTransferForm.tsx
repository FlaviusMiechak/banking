"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  name: z.string().optional(),
  amount: z.coerce
    .number()
    .positive("Amount must be greater than zero"),
});

type FormValues = z.infer<typeof formSchema>;

const PaymentTransferForm = () => {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      name: "",
      amount: 0,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/payments/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientEmail: values.email,
          amount: values.amount,
          note: values.name,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment failed");
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      alert("Payment created successfully.");
      form.reset();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to process payment."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="border-t border-gray-200">
              <div className="payment-transfer_form-item py-6">
                <div className="payment-transfer_form-content">
                  <FormLabel className="text-14 font-medium text-gray-700">
                    Payment Note
                  </FormLabel>

                  <FormDescription className="text-12 text-gray-600">
                    Add an optional note for this payment.
                  </FormDescription>
                </div>

                <div className="flex w-full flex-col">
                  <FormControl>
                    <Textarea
                      placeholder="Dinner, Rent, Invoice #1001..."
                      className="input-class"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </div>
              </div>
            </FormItem>
          )}
        />

        <div className="payment-transfer_form-details">
          <h2 className="text-18 font-semibold text-gray-900">
            Recipient Details
          </h2>

          <p className="text-16 text-gray-600">
            Enter the email of the person receiving the payment.
          </p>
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="border-t border-gray-200">
              <div className="payment-transfer_form-item py-5">
                <FormLabel className="w-full max-w-[280px] text-14 font-medium text-gray-700">
                  Recipient Email
                </FormLabel>

                <div className="flex w-full flex-col">
                  <FormControl>
                    <Input
                      placeholder="john@example.com"
                      className="input-class"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </div>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem className="border-y border-gray-200">
              <div className="payment-transfer_form-item py-5">
                <FormLabel className="w-full max-w-[280px] text-14 font-medium text-gray-700">
                  Amount (USD)
                </FormLabel>

                <div className="flex w-full flex-col">
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.50"
                      placeholder="50.00"
                      className="input-class"
                      {...field}
                    />
                  </FormControl>

                  <FormMessage />
                </div>
              </div>
            </FormItem>
          )}
        />

        <div className="payment-transfer_btn-box">
          <Button
            type="submit"
            className="payment-transfer_btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2
                  className="mr-2 h-5 w-5 animate-spin"
                />
                Processing...
              </>
            ) : (
              "Continue to Payment"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PaymentTransferForm;