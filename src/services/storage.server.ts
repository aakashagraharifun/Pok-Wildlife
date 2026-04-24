import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createServerFn } from "@tanstack/react-start";

const r2 = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

export const getUploadUrl = createServerFn({ method: "POST" })
  .validator((data: { fileName: string; contentType: string }) => data)
  .handler(async ({ data }) => {
    const key = `sightings/${Date.now()}-${data.fileName}`;
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: data.contentType,
    });

    const url = await getSignedUrl(r2, command, { expiresIn: 3600 });
    
    // Construct the public URL
    // Best practice is to use a Custom Domain or the .r2.dev public URL
    const publicUrlBase = process.env.R2_PUBLIC_URL_BASE || `${process.env.R2_ENDPOINT}/${process.env.R2_BUCKET_NAME}`;
    const publicUrl = `${publicUrlBase}/${key}`;
    
    return { uploadUrl: url, publicUrl, key };
  });
