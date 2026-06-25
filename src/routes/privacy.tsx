import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({ component: PrivacyPage });

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#fbfaf7] px-5 py-8 text-[#201b17]">
      <main className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-[#e8ddd2] bg-white px-4 py-2 text-sm font-bold"
        >
          <ArrowLeft className="h-4 w-4" />
          BitePass
        </Link>

        <section className="mt-8 rounded-[1.5rem] border border-[#e8ddd2] bg-white/80 p-6 shadow-[0_18px_40px_-32px_#201b17]">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#fff2eb] text-[#df521b]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-5 text-3xl font-black">Privacy Policy</h1>
          <p className="mt-2 text-sm leading-6 text-[#70665d]">Last updated: June 25, 2026</p>

          <div className="mt-6 space-y-5 text-sm leading-7 text-[#5f554d]">
            <section>
              <h2 className="font-black text-[#201b17]">What We Collect</h2>
              <p>
                We collect account details, location details you choose to save, orders, restaurant
                profiles, reviews, feedback, and payment references needed to operate BitePass.
              </p>
            </section>
            <section>
              <h2 className="font-black text-[#201b17]">How We Use It</h2>
              <p>
                We use this data to show nearby restaurants, process orders, support customers and
                restaurants, improve the platform, and keep operational records visible to
                authorized admins.
              </p>
            </section>
            <section>
              <h2 className="font-black text-[#201b17]">Payments</h2>
              <p>
                Payment card details are handled by the payment provider. BitePass stores order
                totals, payment status, references, and the restaurant recipient needed for
                reconciliation.
              </p>
            </section>
            <section>
              <h2 className="font-black text-[#201b17]">Your Controls</h2>
              <p>
                You can update your location, notification preferences, and feedback through the
                app. Restaurant owners can update store profile and payment setup details from their
                dashboard.
              </p>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}
