import type { Sighting } from "@/types";
import { supabase } from "@/lib/supabase";
import { createServerFn } from "@tanstack/react-start";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

function mapSighting(s: any): Sighting {
  return {
    id: s.id,
    userId: s.user_id,
    imageUrl: s.image_url,
    speciesName: s.species_name,
    emoji: s.emoji,
    confidence: s.confidence,
    lat: s.lat,
    lng: s.lng,
    score: s.score,
    isSuspicious: s.is_suspicious,
    createdAt: s.created_at,
  };
}

export const addSightingServer = createServerFn({ method: "POST" })
  .validator((data: Omit<Sighting, "id" | "createdAt">) => data)
  .handler(async ({ data: input }) => {
    let finalImageUrl = input.imageUrl;

    if (input.imageUrl.startsWith("data:")) {
      try {
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

    return mapSighting(data);
  });

export const checkAlreadyCapturedServer = createServerFn({ method: "POST" })
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
