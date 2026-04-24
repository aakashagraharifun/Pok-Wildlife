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
import { checkProximity } from "@/services/overpass";
import { findSpecies } from "@/data/species";
import { calculateScore } from "@/utils/scoring";
import { LoadingOverlay } from "@/components/wildlife/LoadingOverlay";
import { formatCoord } from "@/utils/formatters";
import type { Coords, Sighting } from "@/types";
import { createServerFn } from "@tanstack/react-start";
import { supabase } from "@/lib/supabase";

// SERVER FUNCTIONS (Defined inside route for automatic splitting)
const checkAlreadyCapturedServer = createServerFn({ method: "POST" })
  .validator((data: { userId: string; speciesName: string }) => data)
  .handler(async ({ data: { userId, speciesName } }) => {
    const { data, error } = await supabase
      .from("sightings")
      .select("created_at")
      .eq("user_id", userId)
      .eq("species_name", speciesName);

    if (error || !data) return { hasCapturedBefore: false, hasCapturedToday: false };

    const hasCapturedBefore = data.length > 0;
    const today = new Date().toISOString().split("T")[0];
    const hasCapturedToday = data.some((s: any) => s.created_at.startsWith(today));

    return { hasCapturedBefore, hasCapturedToday };
  });

const addSightingServer = createServerFn({ method: "POST" })
  .validator((data: Omit<Sighting, "id" | "createdAt">) => data)
  .handler(async ({ data: input }) => {
    let finalImageUrl = input.imageUrl;

    if (input.imageUrl.startsWith("data:")) {
      try {
        // Strict dynamic imports to prevent AWS SDK from touching the client build
        const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
        const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

        const r2 = new S3Client({
          region: "auto",
          endpoint: process.env.R2_ENDPOINT,
          credentials: {
            accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
            secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
          },
        });

        const key = `sightings/${Date.now()}-${input.speciesName.replace(/\s+/g, "_")}.jpg`;
        const command = new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
          ContentType: "image/jpeg",
        });

        const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
        const publicUrlBase = process.env.R2_PUBLIC_URL_BASE || `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}`;
        const publicUrl = `${publicUrlBase}/${key}`;

        const blob = await (await fetch(input.imageUrl)).blob();
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: blob,
          headers: { "Content-Type": "image/jpeg" },
        });

        if (!uploadRes.ok) throw new Error("R2 upload failed");
        finalImageUrl = publicUrl;
      } catch (err) {
        console.error("Storage upload failed", err);
      }
    }

    const { data, error } = await supabase
      .from("sightings")
      .insert({
        user_id: input.userId,
        image_url: finalImageUrl,
        species_name: input.speciesName,
        emoji: input.emoji,
        confidence: input.confidence,
        lat: input.lat,
        lng: input.lng,
        score: input.score,
        is_suspicious: input.isSuspicious,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.rpc("increment_user_score", {
      user_id: input.userId,
      score_delta: input.score,
    });

    return {
      ...data,
      id: data.id,
      userId: data.user_id,
      imageUrl: data.image_url,
      speciesName: data.species_name,
      createdAt: data.created_at,
    };
  });

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
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Secure context (HTTPS) required for direct camera access.");
        return;
      }

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

  async function handleFileSelect(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      processCapture(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleCapture() {
    if (!user || busy) return;
    const imageUrl = cameraReady ? captureFrame() : ""; 
    processCapture(imageUrl);
  }

  async function processCapture(imageUrl: string) {
    if (!user || busy) return;
    setBusy(true);
    setBusyMsg("Locking GPS…");
    try {
      const where = coords ?? (await getCurrentCoords());

      if ("vibrate" in navigator) navigator.vibrate?.(40);

      setBusyMsg("Identifying species…");
      const id = await identifySpecies(imageUrl);

      if (id.confidence < 0.7) {
        toast.error("Species not identified clearly — try again.", {
          description: `Best guess: ${id.speciesName} (${Math.round(id.confidence * 100)}%)`,
        });
        setBusy(false);
        return;
      }

      setBusyMsg("Checking history...");
      const { hasCapturedBefore, hasCapturedToday } = await checkAlreadyCapturedServer({ data: { userId: user.id, speciesName: id.speciesName } });

      setBusyMsg("Checking location…");
      const { isNearZoo: nearZoo, isNearPark: nearPark } = await checkProximity(where);

      const cached = findSpecies(id.speciesName);
      const rarityScore = cached?.rarityScore ?? 30;
      
      const isNew = !hasCapturedBefore;
      const isDup = hasCapturedToday;

      const breakdown = calculateScore({
        confidence: id.confidence,
        isNewSpecies: isNew,
        rarityScore,
        isDuplicate: isDup,
        isNearZoo: nearZoo,
        isNearPark: nearPark,
      });

      const sighting = await addSightingServer({
        data: {
          userId: user.id,
          imageUrl,
          speciesName: id.speciesName,
          emoji: id.emoji,
          confidence: id.confidence,
          lat: where.lat,
          lng: where.lng,
          score: breakdown.total,
          isSuspicious: breakdown.isSuspicious,
        }
      });

      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;

      if ("vibrate" in navigator) navigator.vibrate?.([20, 50, 80]);

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
          <CameraFallback message={cameraError} onFileSelect={handleFileSelect} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary-foreground/70">
            <Camera className="mr-2 h-5 w-5 animate-pulse" />
            Starting camera…
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 safe-top">
          <Link
            to="/home"
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

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-44 w-44 rounded-3xl border-2 border-primary-foreground/40" />
        </div>
      </div>

      <div className="bg-foreground/95 p-6 safe-bottom">
        <div className="mb-3 text-center text-xs text-primary-foreground/70">
          {cameraReady ? "Frame the wildlife and tap to capture" : "Tap to simulate capture"}
        </div>
        <div className="flex items-center justify-center">
          <button
            onClick={handleCapture}
            disabled={busy}
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

function CameraFallback({ message, onFileSelect }: { message: string; onFileSelect: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center text-primary-foreground/80">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/20">
        <AlertCircle className="h-7 w-7 text-warning" />
      </div>
      <p className="font-semibold text-lg">Camera Access Restricted</p>
      <p className="text-xs opacity-70 mb-4">
        Modern browsers require **HTTPS** for direct camera access. <br/>
        To fix this, use an HTTPS tunnel (like ngrok) or open your device's native camera below.
      </p>
      
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelect(file);
        }}
      />
      
      <button
        onClick={() => inputRef.current?.click()}
        className="rounded-full bg-primary-foreground px-8 py-3.5 text-sm font-bold text-foreground shadow-lg active:scale-95"
      >
        Open Native Camera
      </button>

      <p className="mt-6 text-[10px] opacity-40 italic">
        (Or tap the white shutter below to use a demo image)
      </p>
    </div>
  );
}