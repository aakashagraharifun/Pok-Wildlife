import { useEffect, useState } from "react";
import {
  createFileRoute,
  useNavigate,
  Link,
} from "@tanstack/react-router";
import { z } from "zod";
import { AlertTriangle, Share2, Camera, Home } from "lucide-react";
import { toast } from "sonner";
import type { Sighting } from "@/types";
import { getSightingById } from "@/services/sightings";
import { ScoreBreakdownCard } from "@/components/wildlife/ScoreBreakdownCard";
import { findSpecies } from "@/data/species";
import { calculateScore } from "@/utils/scoring";

const searchSchema = z.object({ id: z.string() });

export const Route = createFileRoute("/_app/result")({
  head: () => ({ meta: [{ title: "Sighting result — Pok Wildlife" }] }),
  validateSearch: searchSchema,
  component: ResultScreen,
});

function ResultScreen() {
  const { id } = Route.useSearch();
  const navigate = useNavigate();
  const [sighting, setSighting] = useState<Sighting | null>(null);

  useEffect(() => {
    getSightingById(id).then(setSighting);
  }, [id]);

  if (!sighting) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="skeleton h-40 w-72 rounded-2xl" />
      </div>
    );
  }

  const cached = findSpecies(sighting.speciesName);
  // Reconstruct breakdown for display (mock-friendly).
  const breakdown = calculateScore({
    confidence: sighting.confidence,
    isNewSpecies: false, // already saved; show base contribution context
    rarityScore: cached?.rarityScore ?? 30,
    isDuplicate: false,
    isNearZoo: sighting.isSuspicious,
  });
  // Override total to the actually-saved score so users see the real number.
  const display = { ...breakdown, total: sighting.score };

  const confidencePct = Math.round(sighting.confidence * 100);

  const handleShare = async () => {
    const text = `I just spotted a ${sighting.speciesName} ${sighting.emoji} on Pok Wildlife! +${sighting.score} pts`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Pok Wildlife", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
      }
    } catch {
      // user cancelled
    }
  };

  return (
    <div className="min-h-dvh bg-background pb-32 safe-top">
      {/* Hero */}
      <div className="relative h-72 w-full overflow-hidden bg-gradient-hero">
        {sighting.imageUrl ? (
          <img
            src={sighting.imageUrl}
            alt={sighting.speciesName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-9xl">
            <span className="animate-pop-in drop-shadow-lg">{sighting.emoji}</span>
          </div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <Link
            to="/home"
            aria-label="Home"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/40 text-primary-foreground backdrop-blur"
          >
            <Home className="h-5 w-5" />
          </Link>
          <button
            onClick={handleShare}
            aria-label="Share"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/40 text-primary-foreground backdrop-blur"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="-mt-8 rounded-t-3xl bg-background px-5 pt-6">
        <div className="animate-pop-in">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">
            Identified
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-foreground">
            {sighting.speciesName}
          </h1>
        </div>

        {/* Confidence bar */}
        <div className="mt-5 rounded-2xl bg-card p-4 shadow-card">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-muted-foreground">AI Confidence</span>
            <span className="font-bold text-foreground">{confidencePct}%</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-primary transition-[width] duration-700"
              style={{ width: `${confidencePct}%` }}
            />
          </div>
        </div>

        {sighting.isSuspicious && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-warning/40 bg-warning/15 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-warning shrink-0" />
            <div className="text-xs text-foreground">
              <p className="font-semibold">Suspicious capture</p>
              <p className="opacity-80">
                You're within 500m of a zoo or animal park. Score reduced.
              </p>
            </div>
          </div>
        )}

        <div className="mt-4">
          <ScoreBreakdownCard breakdown={display} />
        </div>

        <div className="mt-6 flex gap-3">
          <Link
            to="/capture"
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-base font-semibold text-primary-foreground shadow-card"
          >
            <Camera className="h-5 w-5" />
            Capture again
          </Link>
          <Link
            to="/home"
            className="flex items-center justify-center rounded-full border border-border bg-card px-5 py-3.5 text-base font-semibold text-foreground"
          >
            Done
          </Link>
        </div>
      </div>
    </div>
  );
}