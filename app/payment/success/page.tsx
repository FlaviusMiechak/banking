export default function PaymentSuccessPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="rounded-lg border bg-white p-10 shadow">
        <h1 className="text-3xl font-bold text-green-600">
          Payment Successful 🎉
        </h1>

        <p className="mt-4 text-gray-600">
          Thank you. Your payment has been processed successfully.
        </p>
      </div>
    </main>
  );
}