import { useEffect, useRef, useState } from "react";
import {
  createFileRoute,
  useNavigate,
  Link,
} from "@tanstack/react-router";
import { ArrowLeft, Camera, MapPin, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentCoords } from "@/services/geolocation";
import { identifySpecies } from "@/services/inaturalist";
import { isNearZoo } from "@/services/overpass";
import { findSpecies } from "@/data/species";
import { calculateScore } from "@/utils/scoring";
import {
  addSighting,
  userCapturedSpeciesToday,
  userHasCapturedSpecies,
} from "@/services/sightings";
import { LoadingOverlay } from "@/components/wildlife/LoadingOverlay";
import { formatCoord } from "@/utils/formatters";
import type { Coords } from "@/types";

export const Route = createFileRoute("/_app/capture")({
  head: () => ({ meta: [{ title: "Capture — Pok Wildlife" }] }),
  component: CaptureScreen,
});

function CaptureScreen() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [coords, setCoords] = useState<Coords | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyMsg, setBusyMsg] = useState("Identifying species…");

  // Start camera
  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraReady(true);
      } catch (err) {
        setCameraError(
          err instanceof Error
            ? err.message
            : "Camera unavailable on this device.",
        );
      }
    }
    start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, []);

  // Get GPS
  useEffect(() => {
    getCurrentCoords().then(setCoords);
  }, []);

  function captureFrame(): string {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !cameraReady) return "";
    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(video, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.85);
  }

  async function handleCapture() {
    if (!user || busy) return;
    setBusy(true);
    setBusyMsg("Locking GPS…");
    try {
      const where = coords ?? (await getCurrentCoords());
      const imageUrl = cameraReady
        ? captureFrame()
        : ""; // Will use placeholder when camera unavailable

      // Haptic
      if ("vibrate" in navigator) navigator.vibrate?.(40);

      setBusyMsg("Identifying species…");
      // TODO: replace with real iNaturalist Vision API call
      const id = await identifySpecies(imageUrl);

      if (id.confidence < 0.7) {
        toast.error("Species not identified clearly — try again.", {
          description: `Best guess: ${id.speciesName} (${Math.round(id.confidence * 100)}%)`,
        });
        setBusy(false);
        return;
      }

      setBusyMsg("Checking location…");
      // TODO: replace with real Overpass API
      const nearZoo = await isNearZoo(where);

      const cached = findSpecies(id.speciesName);
      const rarityScore = cached?.rarityScore ?? 30;
      const isNew = !userHasCapturedSpecies(user.id, id.speciesName);
      const isDup = userCapturedSpeciesToday(user.id, id.speciesName);

      const breakdown = calculateScore({
        confidence: id.confidence,
        isNewSpecies: isNew,
        rarityScore,
        isDuplicate: isDup,
        isNearZoo: nearZoo,
      });

      const sighting = await addSighting({
        userId: user.id,
        imageUrl,
        speciesName: id.speciesName,
        emoji: id.emoji,
        confidence: id.confidence,
        lat: where.lat,
        lng: where.lng,
        score: breakdown.total,
        isSuspicious: breakdown.isSuspicious,
      });

      // Stop camera before navigating
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      if ("vibrate" in navigator) navigator.vibrate?.([20, 50, 80]);

      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ["sightings"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });

      navigate({
        to: "/result",
        search: { id: sighting.id },
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Capture failed");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex flex-col bg-foreground text-primary-foreground">
      {/* Camera preview */}
      <div className="relative flex-1 overflow-hidden bg-foreground">
        {cameraReady ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        ) : cameraError ? (
          <CameraFallback message={cameraError} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary-foreground/70">
            <Camera className="mr-2 h-5 w-5 animate-pulse" />
            Starting camera…
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />

        {/* Top bar */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 safe-top">
          <Link
            to="/home"
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/40 backdrop-blur"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {coords && (
            <div className="flex items-center gap-1.5 rounded-full bg-foreground/40 px-3 py-1.5 text-xs backdrop-blur">
              <MapPin className="h-3.5 w-3.5" />
              <span className="font-mono">
                {formatCoord(coords.lat)}, {formatCoord(coords.lng)}
              </span>
            </div>
          )}
        </div>

        {/* Crosshair */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-44 w-44 rounded-3xl border-2 border-primary-foreground/40" />
        </div>
      </div>

      {/* Shutter */}
      <div className="bg-foreground/95 p-6 safe-bottom">
        <div className="mb-3 text-center text-xs text-primary-foreground/70">
          {cameraReady ? "Frame the wildlife and tap to capture" : "Tap to simulate capture"}
        </div>
        <div className="flex items-center justify-center">
          <button
            onClick={handleCapture}
            disabled={busy}
            aria-label="Capture"
            className="relative flex h-20 w-20 items-center justify-center rounded-full border-4 border-primary-foreground bg-transparent transition-transform active:scale-95 disabled:opacity-60 animate-pulse-ring"
          >
            <span className="h-14 w-14 rounded-full bg-primary-foreground" />
          </button>
        </div>
      </div>

      {busy && <LoadingOverlay message={busyMsg} sub="This usually takes a few seconds" />}
    </div>
  );
}

function CameraFallback({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center text-primary-foreground/80">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/20">
        <AlertCircle className="h-7 w-7 text-warning" />
      </div>
      <p className="font-semibold">Camera unavailable</p>
      <p className="text-sm opacity-80">{message}</p>
      <p className="mt-2 text-xs opacity-70">
        You can still tap the shutter to simulate a capture.
      </p>
    </div>
  );
}