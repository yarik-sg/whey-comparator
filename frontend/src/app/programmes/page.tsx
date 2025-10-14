"use client";
import { useEffect, useState } from "react";
import { Dumbbell } from "lucide-react";

type Programme = {
  id: number;
  nom: string;
  objectif: string;
  duree: string;
  niveau: string;
};

export default function ProgrammesPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);

  useEffect(() => {
    fetch("/api/proxy?target=programmes")
      .then((res) => res.json())
      .then((data) => setProgrammes(data as Programme[]))
      .catch(() => setProgrammes([]));
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-6">Programmes de Fitness</h1>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {programmes.map((programme) => (
          <div
            key={programme.id}
            className="p-6 bg-white border rounded-xl hover:shadow-md transition"
          >
            <Dumbbell className="w-6 h-6 text-primary mb-2" />
            <h2 className="font-semibold">{programme.nom}</h2>
            <p className="text-sm text-gray-500">{programme.objectif}</p>
            <p className="mt-2 text-sm">Durée : {programme.duree}</p>
            <p className="text-sm">Niveau : {programme.niveau}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
