'use client';
import {
  ArrowRight,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Landmark,
  BarChart3,
  Globe,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
    //buttons to navigate to login and signup pages
    const handleLogin = () => {
        window.location.href = "/sign-in";
    };

    const handleSignup = () => {
        window.location.href = "/sign-up";
    };

  return (
    <main className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
              MI
            </div>

            <span className="text-2xl font-bold">
              Mifacash
            </span>
          </div>

          <div className="hidden gap-10 text-gray-600 md:flex">
            <a href="#">Home</a>
            <a href="#">Features</a>
            <a href="#">Cards</a>
            <a href="#">Business</a>
            <a href="#">Support</a>
          </div>

          <div className="flex gap-3">
            <button className="rounded-xl px-5 py-2 font-medium hover:bg-gray-100" onClick={handleLogin}>
              Login
            </button>

            <button className="rounded-xl bg-blue-600 px-5 py-2 font-medium text-white hover:bg-blue-700" onClick={handleSignup}>
              Open Account
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 py-24 lg:grid-cols-2">

          <div>
            <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-700">
              Trusted by 5 Million+ Customers
            </span>

            <h1 className="mt-8 text-6xl font-extrabold leading-tight">
              Banking
              <span className="block text-blue-600">
                Made Simple
              </span>
            </h1>

            <p className="mt-8 text-lg leading-8 text-gray-600">
              Manage your money, send transfers, pay bills, invest,
              and grow your finances from anywhere in the world.
            </p>

            <div className="mt-10 flex flex-wrap gap-5">
              <Link href="/sign-in" className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white hover:bg-blue-700">
                Get Started
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap gap-10">
              <div>
                <h2 className="text-3xl font-bold">$12B+</h2>
                <p className="text-gray-500">
                  Transactions
                </p>
              </div>

              <div>
                <h2 className="text-3xl font-bold">180+</h2>
                <p className="text-gray-500">
                  Countries
                </p>
              </div>

              <div>
                <h2 className="text-3xl font-bold">5M+</h2>
                <p className="text-gray-500">
                  Customers
                </p>
              </div>
            </div>
          </div>

          {/* Right Card */}
          <div className="relative">

            <div className="rounded-3xl bg-gradient-to-br from-blue-700 to-indigo-600 p-8 text-white shadow-2xl">

              <div className="flex justify-between">
                <div>
                  <p className="opacity-70">
                    Available Balance
                  </p>

                  <h2 className="mt-2 text-5xl font-bold">
                    $24,850
                  </h2>
                </div>

                <CreditCard size={55} />
              </div>

              <div className="mt-20 flex justify-between">
                <div>
                  <p className="opacity-70">
                    Card Holder
                  </p>

                  <h3 className="font-semibold">
                    John Doe
                  </h3>
                </div>

                <div>
                  <p className="opacity-70">
                    Valid
                  </p>

                  <h3 className="font-semibold">
                    09/30
                  </h3>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features */}

      <section className="bg-gray-50 py-24">

        <div className="mx-auto max-w-7xl px-6">

          <div className="text-center">
            <h2 className="text-5xl font-bold">
              Everything You Need
            </h2>

            <p className="mt-4 text-lg text-gray-600">
              Powerful banking features built for modern life.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">

            {[
              {
                icon: ShieldCheck,
                title: "Secure Banking",
                text: "Military-grade encryption protects every transaction.",
              },
              {
                icon: Smartphone,
                title: "Mobile Banking",
                text: "Access your accounts anywhere, anytime.",
              },
              {
                icon: CreditCard,
                title: "Virtual Cards",
                text: "Create secure cards instantly.",
              },
              {
                icon: Landmark,
                title: "Bank Transfers",
                text: "Send money worldwide within seconds.",
              },
              {
                icon: Globe,
                title: "International Payments",
                text: "Support for over 180 countries.",
              },
              {
                icon: BarChart3,
                title: "Analytics",
                text: "Track spending with beautiful insights.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="rounded-3xl bg-white p-8 shadow-sm transition hover:-translate-y-2 hover:shadow-xl"
              >
                <item.icon
                  className="text-blue-600"
                  size={40}
                />

                <h3 className="mt-6 text-2xl font-bold">
                  {item.title}
                </h3>

                <p className="mt-3 text-gray-600">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose */}

      <section className="py-24">

        <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2">

          <div>
            <h2 className="text-5xl font-bold">
              Why Customers Love Us
            </h2>

            <div className="mt-10 space-y-8">

              {[
                "No hidden banking fees",
                "Free international transfers",
                "24/7 customer support",
                "Instant virtual cards",
                "Fast mobile payments",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-4"
                >
                  <CheckCircle
                    className="text-blue-600"
                  />
                  <span className="text-lg">
                    {item}
                  </span>
                </div>
              ))}

            </div>
          </div>

          <div className="rounded-3xl bg-blue-600 p-10 text-white">

            <h2 className="text-4xl font-bold">
              Open Your Account Today
            </h2>

            <p className="mt-6 text-lg text-blue-100">
              Join millions of customers using BlueBank to
              manage their finances securely.
            </p>

            <div className="mt-10 flex flex-wrap gap-5">
              <Link href="/sign-in" className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white hover:bg-blue-700">
                Create account
                <ArrowRight size={18} />
              </Link>
            </div>

          </div>

        </div>

      </section>
    </main>
  );
}