export default function PaymentCancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="rounded-lg border bg-white p-10 shadow">
        <h1 className="text-3xl font-bold text-red-600">
          Payment Cancelled
        </h1>

        <p className="mt-4 text-gray-600">
          Your payment was cancelled.
        </p>
      </div>
    </main>
  );
}