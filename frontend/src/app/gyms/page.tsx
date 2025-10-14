"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

type Gym = {
  name: string;
  link: string;
  brand: string;
};

export default function GymsPage() {
  const [gyms, setGyms] = useState<Gym[]>([]);

  useEffect(() => {
    fetch("/api/proxy?target=gyms&limit=12")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setGyms(data);
        }
      })
      .catch((error) => {
        console.error("Failed to load gyms", error);
      });
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-4xl font-bold mb-6">Salles de sport en France</h1>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {gyms.map((gym, i) => (
          <a
            key={`${gym.name}-${i}`}
            href={gym.link}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border rounded-xl hover:shadow-md transition"
          >
            <p className="font-semibold">{gym.name}</p>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-primary" /> {gym.brand}
            </p>
          </a>
        ))}
      </div>
    </main>
  );
}
