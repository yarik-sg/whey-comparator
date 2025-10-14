import Link from "next/link";

import ComingSoon from "@/components/ComingSoon";
import { buttonClassName } from "@/components/ui/button";

export default function EquipementsPage() {
  return (
    <div className="min-h-screen bg-background text-dark dark:bg-dark dark:text-[var(--text)]">
      <section className="bg-secondary text-dark dark:bg-secondary/80 dark:text-dark">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="space-y-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Explorez nos Équipements connectés
            </h1>
            <p className="mx-auto max-w-2xl text-base text-dark/80 sm:text-lg">
              Restez motivé avec une sélection d’appareils intelligents, testés et triés pour améliorer chaque séance d’entraînement.
            </p>
            <div className="flex justify-center">
              <Link
                href="/catalogue"
                className={buttonClassName({ size: "lg", className: "shadow-neo" })}
              >
                Explorer le matériel
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <ComingSoon />
      </section>
    </div>
  );
}
