import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  isAuthorizedAdminRequest,
  verifyAdminCsrfRequest,
} from "../../../../lib/admin-auth";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_REQUEST_SIZE_BYTES = 3 * 1024 * 1024; // 3MB including form data
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_UPLOADS = 20; // admin uploads per hour per IP

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function jsonResponse(data: object, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return realIp || "unknown";
}

function checkRateLimit(ip: string) {
  const now = Date.now();
  const current = rateLimitMap.get(ip);

  if (!current || current.resetAt <= now) {
    rateLimitMap.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });

    return true;
  }

  if (current.count >= RATE_LIMIT_MAX_UPLOADS) {
    return false;
  }

  current.count += 1;
  rateLimitMap.set(ip, current);

  return true;
}

function requireAdminSecurity(request: Request) {
  const clientIp = getClientIp(request);

  if (!checkRateLimit(clientIp)) {
    return jsonResponse(
      {
        error:
          "Too many logo uploads. Please wait before uploading another logo.",
      },
      429
    );
  }

  if (!isAuthorizedAdminRequest(request)) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  if (!verifyAdminCsrfRequest(request)) {
    return jsonResponse(
      { error: "Security token missing or expired. Please log in again." },
      403
    );
  }

  return null;
}

function getExtensionFromMimeType(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";

  return "";
}

function hasValidImageSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/png") {
    return (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === "image/webp") {
    const header = String.fromCharCode(...bytes.slice(0, 12));

    return header.startsWith("RIFF") && header.slice(8, 12) === "WEBP";
  }

  return false;
}

function looksLikeSvgOrHtml(bytes: Uint8Array) {
  const firstBytes = new TextDecoder()
    .decode(bytes.slice(0, 300))
    .toLowerCase()
    .trim();

  return (
    firstBytes.includes("<svg") ||
    firstBytes.includes("<script") ||
    firstBytes.includes("<html") ||
    firstBytes.includes("<iframe") ||
    firstBytes.includes("javascript:")
  );
}

export async function POST(request: Request) {
  try {
    const securityError = requireAdminSecurity(request);

    if (securityError) {
      return securityError;
    }

    const contentType = request.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return jsonResponse({ error: "Invalid upload format." }, 415);
    }

    const contentLengthHeader = request.headers.get("content-length");
    const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;

    if (contentLength > MAX_REQUEST_SIZE_BYTES) {
      return jsonResponse(
        { error: "Upload is too large. Logo file must be under 2MB." },
        413
      );
    }

    const formData = await request.formData();

    const uploadedFiles = formData
      .getAll("file")
      .filter((item): item is File => item instanceof File);

    if (uploadedFiles.length !== 1) {
      return jsonResponse(
        { error: "Please upload one logo file only." },
        400
      );
    }

    const file = uploadedFiles[0];

    if (!file || file.size === 0) {
      return jsonResponse({ error: "No file uploaded." }, 400);
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return jsonResponse({ error: "Logo file must be under 2MB." }, 400);
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return jsonResponse(
        { error: "Only PNG, JPG, JPEG, and WEBP logo files are allowed." },
        400
      );
    }

    const fileBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(fileBuffer);

    if (looksLikeSvgOrHtml(bytes)) {
      return jsonResponse(
        {
          error:
            "Invalid logo file. SVG, HTML, script, and embedded code are not allowed.",
        },
        400
      );
    }

    if (!hasValidImageSignature(bytes, file.type)) {
      return jsonResponse(
        {
          error:
            "Invalid image file. Please upload a real PNG, JPG, JPEG, or WEBP image.",
        },
        400
      );
    }

    const fileExtension = getExtensionFromMimeType(file.type);

    if (!fileExtension) {
      return jsonResponse({ error: "Unsupported logo file type." }, 400);
    }

    const fileName = `admin/${randomUUID()}.${fileExtension}`;

    const safeFile = new Blob([fileBuffer], {
      type: file.type,
    });

    const { error } = await supabaseAdmin.storage
      .from("tool-logos")
      .upload(fileName, safeFile, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Admin logo upload error:", error.message);

      return jsonResponse(
        { error: "Unable to upload logo. Please try again later." },
        500
      );
    }

    const { data } = supabaseAdmin.storage
      .from("tool-logos")
      .getPublicUrl(fileName);

    return jsonResponse({
      success: true,
      logoUrl: data.publicUrl,
    });
  } catch (error) {
    console.error("Admin logo upload route error:", error);

    return jsonResponse(
      { error: "Logo upload failed. Please try again." },
      500
    );
  }
}
