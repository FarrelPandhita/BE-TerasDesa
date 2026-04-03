import { supabase } from "../utils/supabase"
import { v4 as uuid } from "uuid"
import path from "path"
import { AppError } from "../utils/app-error"

// Uploads a file buffer to a Supabase bucket and returns the file path.
export async function uploadFile(
  bucket: string,
  file: Express.Multer.File,
  folder: string = ""
): Promise<string> {
  const fileExt = path.extname(file.originalname)
  const fileName = `${Date.now()}-${uuid()}${fileExt}`
  const filePath = folder ? `${folder}/${fileName}` : fileName

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    })

  if (error) {
    console.error("[Supabase Upload Error]", error)
    throw new AppError(500, "Failed to upload file to storage")
  }

  return filePath
}

// Deletes a file from a Supabase bu
// cket.
export async function deleteFile(bucket: string, filePath: string) {
  const { error } = await supabase.storage.from(bucket).remove([filePath])
  if (error) {
    console.warn("[Supabase Delete Error]", error)
  }
}

// Gets the public URL for a file in a Supabase bucket.
export function getPublicUrl(bucket: string, filePath: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
  return data.publicUrl
}

// Extracts the file path from a Supabase public URL.
export function extractPathFromUrl(url: string, bucket: string): string | null {
  const baseUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${bucket}/`
  if (url.startsWith(baseUrl)) {
    return url.replace(baseUrl, "")
  }
  return null
}
