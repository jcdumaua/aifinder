import "server-only";

import { NextResponse } from "next/server";
import type { AdminAuditAction } from "../../../../lib/admin-audit-log";
import type { VerifyAdminSessionResult } from "../../../../lib/admin-auth";
import {
  ADMIN_RATE_LIMIT_ACTIONS,
  type AdminRateLimitResult,
} from "../../../../lib/admin-rate-limit";
import {
  parseBoundedFormData,
  PublicLiveRouteSafetyError,
  readBoundedRequestBody,
} from "../../../../lib/public-live-route-safety";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_REQUEST_SIZE_BYTES = 3 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 16_384;
const MAX_WEBP_CHUNKS = 128;
const TOOL_LOGO_BUCKET = "tool-logos";

type StorageResult = Promise<{ error: unknown | null }>;
type LogoStorage = {
  upload: (
    path: string,
    body: Blob,
    options: { cacheControl: string; contentType: string; upsert: boolean },
  ) => StorageResult;
  remove: (paths: string[]) => StorageResult;
  getPublicUrl: (path: string) => { data: { publicUrl: string } };
};

type AuditInput = {
  request: Request;
  action: AdminAuditAction;
  targetType?: string;
  targetId?: string | number;
  targetName?: string | null;
  details?: Record<string, unknown>;
};

export type AdminUploadLogoHandlerDependencies = {
  verifySession: (request: Request) => VerifyAdminSessionResult;
  verifyCsrf: (request: Request) => boolean;
  checkRateLimit: (input: {
    request: Request;
    action: typeof ADMIN_RATE_LIMIT_ACTIONS.uploadLogo;
    actor: NonNullable<VerifyAdminSessionResult["actor"]>;
  }) => AdminRateLimitResult;
  storage: LogoStorage;
  writeAudit: (input: AuditInput) => Promise<void>;
  createObjectName: (extension: string) => string;
};

function jsonResponse(data: object, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function getExtensionFromMimeType(mimeType: string) {
  if (mimeType === "image/png") return "png";
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "";
}

function readUint24LittleEndian(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function validDimensions(width: number, height: number) {
  return (
    Number.isInteger(width) &&
    Number.isInteger(height) &&
    width > 0 &&
    height > 0 &&
    width <= MAX_IMAGE_DIMENSION &&
    height <= MAX_IMAGE_DIMENSION
  );
}

function pngChunkCrc(bytes: Uint8Array, start: number, end: number) {
  let crc = 0xffffffff;
  for (let index = start; index < end; index += 1) {
    crc ^= bytes[index];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function isValidPngHeader(bytes: Uint8Array, dataOffset: number) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const width = view.getUint32(dataOffset, false);
  const height = view.getUint32(dataOffset + 4, false);
  const bitDepth = bytes[dataOffset + 8];
  const colorType = bytes[dataOffset + 9];
  const validBitDepths: Record<number, readonly number[]> = {
    0: [1, 2, 4, 8, 16],
    2: [8, 16],
    3: [1, 2, 4, 8],
    4: [8, 16],
    6: [8, 16],
  };
  return (
    validDimensions(width, height) &&
    Boolean(validBitDepths[colorType]?.includes(bitDepth)) &&
    bytes[dataOffset + 10] === 0 &&
    bytes[dataOffset + 11] === 0 &&
    (bytes[dataOffset + 12] === 0 || bytes[dataOffset + 12] === 1)
  );
}

export function validatePngStructure(bytes: Uint8Array) {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length < 46 || !signature.every((value, index) => bytes[index] === value)) {
    return false;
  }
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8;
  let sawHeader = false;
  let sawPalette = false;
  let sawImageData = false;
  let imageDataEnded = false;
  let colorType = -1;
  let bitDepth = -1;

  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset, false);
    const typeOffset = offset + 4;
    const dataOffset = offset + 8;
    if (length > bytes.length - dataOffset - 4) return false;
    const dataEnd = dataOffset + length;
    const end = dataEnd + 4;
    const type = String.fromCharCode(...bytes.slice(typeOffset, typeOffset + 4));
    if (!/^[A-Za-z]{4}$/.test(type)) return false;
    if (
      pngChunkCrc(bytes, typeOffset, dataEnd) !==
      view.getUint32(dataEnd, false)
    ) {
      return false;
    }

    if (!sawHeader) {
      if (
        type !== "IHDR" ||
        length !== 13 ||
        !isValidPngHeader(bytes, dataOffset)
      ) {
        return false;
      }
      bitDepth = bytes[dataOffset + 8];
      colorType = bytes[dataOffset + 9];
      sawHeader = true;
    } else if (type === "IHDR") {
      return false;
    } else if (type === "PLTE") {
      if (
        sawPalette ||
        sawImageData ||
        colorType === 0 ||
        colorType === 4 ||
        length === 0 ||
        length % 3 !== 0 ||
        length > 768 ||
        (colorType === 3 && length / 3 > 2 ** bitDepth)
      ) {
        return false;
      }
      sawPalette = true;
    } else if (type === "IDAT") {
      if (
        length === 0 ||
        imageDataEnded ||
        (colorType === 3 && !sawPalette)
      ) {
        return false;
      }
      sawImageData = true;
    } else if (type === "IEND") {
      return sawImageData && length === 0 && end === bytes.length;
    } else {
      if (sawImageData) imageDataEnded = true;
      if (/^[A-Z]/.test(type)) return false;
    }

    offset = end;
  }
  return false;
}

export function validateJpegStructure(bytes: Uint8Array) {
  if (
    bytes.length < 12 ||
    bytes[0] !== 0xff ||
    bytes[1] !== 0xd8 ||
    bytes[bytes.length - 2] !== 0xff ||
    bytes[bytes.length - 1] !== 0xd9
  ) {
    return false;
  }
  let offset = 2;
  let sawFrame = false;
  let sawScan = false;
  const frameComponentIds = new Set<number>();
  const frameMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) return false;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) return false;
    const marker = bytes[offset];
    offset += 1;

    if (marker === 0xd9) {
      return sawFrame && sawScan && offset === bytes.length;
    }
    if (
      marker === 0x00 ||
      marker === 0x01 ||
      marker === 0xd8 ||
      (marker >= 0xd0 && marker <= 0xd7)
    ) {
      return false;
    }
    if (offset + 2 > bytes.length) return false;
    const length = (bytes[offset] << 8) | bytes[offset + 1];
    if (length < 2 || offset + length > bytes.length) return false;

    if (marker === 0xda) {
      if (!sawFrame || length < 8 || offset + length > bytes.length - 2) {
        return false;
      }
      const componentCount = bytes[offset + 2];
      if (
        componentCount < 1 ||
        componentCount > 4 ||
        length !== 6 + 2 * componentCount
      ) {
        return false;
      }
      const scanComponentIds = new Set<number>();
      for (let index = 0; index < componentCount; index += 1) {
        const componentId = bytes[offset + 3 + index * 2];
        const tableSelectors = bytes[offset + 4 + index * 2];
        if (
          !frameComponentIds.has(componentId) ||
          scanComponentIds.has(componentId) ||
          (tableSelectors >> 4) > 3 ||
          (tableSelectors & 0x0f) > 3
        ) {
          return false;
        }
        scanComponentIds.add(componentId);
      }

      let scanOffset = offset + length;
      let sawEntropyByte = false;
      while (scanOffset < bytes.length) {
        if (bytes[scanOffset] !== 0xff) {
          sawEntropyByte = true;
          scanOffset += 1;
          continue;
        }
        if (scanOffset + 1 >= bytes.length) return false;
        const scanMarker = bytes[scanOffset + 1];
        if (scanMarker === 0x00) {
          sawEntropyByte = true;
          scanOffset += 2;
          continue;
        }
        if (scanMarker === 0xff) {
          scanOffset += 1;
          continue;
        }
        if (scanMarker >= 0xd0 && scanMarker <= 0xd7) {
          scanOffset += 2;
          continue;
        }
        break;
      }
      if (!sawEntropyByte || scanOffset >= bytes.length) return false;
      sawScan = true;
      offset = scanOffset;
      continue;
    }

    const isLengthMarker =
      (marker >= 0xc0 && marker <= 0xcf) ||
      (marker >= 0xdb && marker <= 0xfe);
    if (!isLengthMarker) return false;
    if (frameMarkers.has(marker)) {
      if (sawFrame || length < 11) return false;
      const height = (bytes[offset + 3] << 8) | bytes[offset + 4];
      const width = (bytes[offset + 5] << 8) | bytes[offset + 6];
      const componentCount = bytes[offset + 7];
      if (
        !validDimensions(width, height) ||
        componentCount < 1 ||
        componentCount > 4 ||
        length !== 8 + 3 * componentCount
      ) {
        return false;
      }
      for (let index = 0; index < componentCount; index += 1) {
        const componentOffset = offset + 8 + index * 3;
        const componentId = bytes[componentOffset];
        const samplingFactors = bytes[componentOffset + 1];
        if (
          frameComponentIds.has(componentId) ||
          (samplingFactors >> 4) < 1 ||
          (samplingFactors >> 4) > 4 ||
          (samplingFactors & 0x0f) < 1 ||
          (samplingFactors & 0x0f) > 4 ||
          bytes[componentOffset + 2] > 3
        ) {
          return false;
        }
        frameComponentIds.add(componentId);
      }
      sawFrame = true;
    }
    offset += length;
  }
  return false;
}

export function validateWebpStructure(bytes: Uint8Array) {
  if (bytes.length < 32) return false;
  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));
  if (riff !== "RIFF" || webp !== "WEBP") return false;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(4, true) + 8 !== bytes.length) return false;
  let offset = 12;
  let chunkCount = 0;
  let sawExtendedHeader = false;
  let sawImagePayload = false;

  while (offset < bytes.length) {
    if (offset + 8 > bytes.length || chunkCount >= MAX_WEBP_CHUNKS) {
      return false;
    }
    chunkCount += 1;
    const chunk = String.fromCharCode(...bytes.slice(offset, offset + 4));
    const chunkLength = view.getUint32(offset + 4, true);
    const dataOffset = offset + 8;
    if (chunkLength > bytes.length - dataOffset) return false;
    const dataEnd = dataOffset + chunkLength;
    const paddedEnd = dataEnd + (chunkLength % 2);
    if (paddedEnd > bytes.length) return false;
    if (chunkLength % 2 === 1 && bytes[dataEnd] !== 0) return false;

    if (chunk === "VP8X") {
      if (
        offset !== 12 ||
        sawExtendedHeader ||
        sawImagePayload ||
        chunkLength !== 10 ||
        (bytes[dataOffset] & 0xc3) !== 0 ||
        bytes[dataOffset + 1] !== 0 ||
        bytes[dataOffset + 2] !== 0 ||
        bytes[dataOffset + 3] !== 0 ||
        !validDimensions(
          readUint24LittleEndian(bytes, dataOffset + 4) + 1,
          readUint24LittleEndian(bytes, dataOffset + 7) + 1,
        )
      ) {
        return false;
      }
      sawExtendedHeader = true;
    } else if (chunk === "VP8 ") {
      if (
        sawImagePayload ||
        chunkLength <= 10 ||
        (bytes[dataOffset] & 1) !== 0 ||
        bytes[dataOffset + 3] !== 0x9d ||
        bytes[dataOffset + 4] !== 0x01 ||
        bytes[dataOffset + 5] !== 0x2a ||
        !validDimensions(
          view.getUint16(dataOffset + 6, true) & 0x3fff,
          view.getUint16(dataOffset + 8, true) & 0x3fff,
        )
      ) {
        return false;
      }
      sawImagePayload = true;
    } else if (chunk === "VP8L") {
      if (sawImagePayload || chunkLength <= 5 || bytes[dataOffset] !== 0x2f) {
        return false;
      }
      const bits = view.getUint32(dataOffset + 1, true);
      if (
        (bits >>> 29) !== 0 ||
        !validDimensions(
          (bits & 0x3fff) + 1,
          ((bits >>> 14) & 0x3fff) + 1,
        )
      ) {
        return false;
      }
      sawImagePayload = true;
    } else if (!sawExtendedHeader || chunk === "ANIM" || chunk === "ANMF") {
      return false;
    }

    offset = paddedEnd;
  }

  return offset === bytes.length && sawImagePayload;
}

function looksLikeSvgOrHtml(bytes: Uint8Array) {
  const firstBytes = new TextDecoder().decode(bytes.slice(0, 300)).toLowerCase().trim();
  return ["<svg", "<script", "<html", "<iframe", "javascript:"].some((marker) =>
    firstBytes.includes(marker),
  );
}

function hasValidImageStructure(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/png") return validatePngStructure(bytes);
  if (mimeType === "image/jpeg") return validateJpegStructure(bytes);
  if (mimeType === "image/webp") return validateWebpStructure(bytes);
  return false;
}

export function createAdminUploadLogoHandler(
  dependencies: AdminUploadLogoHandlerDependencies,
) {
  async function requireAdminSecurity(request: Request) {
    const session = dependencies.verifySession(request);
    if (!session.isAdmin || !session.actor) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    if (!dependencies.verifyCsrf(request)) {
      return jsonResponse({ error: "Security token missing or expired. Please log in again." }, 403);
    }
    const rateLimit = dependencies.checkRateLimit({
      request,
      action: ADMIN_RATE_LIMIT_ACTIONS.uploadLogo,
      actor: session.actor,
    });
    if (!rateLimit.allowed) {
      return jsonResponse(
        { error: "Too many logo uploads. Please wait before uploading another logo." },
        rateLimit.status,
      );
    }
    return null;
  }

  async function removeUploadedObject(objectName: string) {
    try {
      const { error } = await dependencies.storage.remove([objectName]);
      if (error) {
        console.error("admin_logo_upload_cleanup_failed");
        return false;
      }
      return true;
    } catch {
      console.error("admin_logo_upload_cleanup_failed");
      return false;
    }
  }

  async function POST(request: Request) {
    const securityError = await requireAdminSecurity(request);
    if (securityError) return securityError;

    const contentType = request.headers.get("content-type") || "";
    if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
      return jsonResponse({ error: "Invalid upload format." }, 415);
    }

    let formData: FormData;
    try {
      const bounded = await readBoundedRequestBody(request, MAX_REQUEST_SIZE_BYTES);
      formData = await parseBoundedFormData(bounded, contentType);
    } catch (error) {
      if (
        error instanceof PublicLiveRouteSafetyError &&
        error.code === "request_body_too_large"
      ) {
        return jsonResponse({ error: "Upload is too large. Logo file must be under 2MB." }, 413);
      }
      return jsonResponse({ error: "Invalid upload format." }, 400);
    }

    const uploadedFiles = formData
      .getAll("file")
      .filter((item): item is File => typeof File !== "undefined" && item instanceof File);
    if (uploadedFiles.length !== 1) {
      return jsonResponse({ error: "Please upload one logo file only." }, 400);
    }
    const file = uploadedFiles[0];
    if (!file || file.size === 0) return jsonResponse({ error: "No file uploaded." }, 400);
    if (file.size > MAX_FILE_SIZE_BYTES) return jsonResponse({ error: "Logo file must be under 2MB." }, 400);
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return jsonResponse({ error: "Only PNG, JPG, JPEG, and WEBP logo files are allowed." }, 400);
    }

    const fileBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(fileBuffer);
    if (looksLikeSvgOrHtml(bytes)) {
      return jsonResponse({ error: "Invalid logo file. SVG, HTML, script, and embedded code are not allowed." }, 400);
    }
    if (!hasValidImageStructure(bytes, file.type)) {
      console.warn("admin_logo_upload_image_structure_invalid");
      return jsonResponse({ error: "Invalid image file. Please upload a real PNG, JPG, JPEG, or WEBP image." }, 400);
    }

    const extension = getExtensionFromMimeType(file.type);
    if (!extension) return jsonResponse({ error: "Unsupported logo file type." }, 400);
    const objectName = dependencies.createObjectName(extension);
    const safeFile = new Blob([fileBuffer], { type: file.type });
    const { error: uploadError } = await dependencies.storage.upload(objectName, safeFile, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });
    if (uploadError) {
      console.error("admin_logo_upload_storage_failed");
      return jsonResponse({ error: "Unable to upload logo. Please try again later." }, 500);
    }

    try {
      const { data } = dependencies.storage.getPublicUrl(objectName);
      if (!data.publicUrl) throw new Error("post_upload_failure");
      await dependencies.writeAudit({
        request,
        action: "logo_uploaded",
        targetType: "storage_object",
        targetId: objectName,
        targetName: objectName,
        details: {
          bucket: TOOL_LOGO_BUCKET,
          contentType: file.type,
          sizeBytes: file.size,
          publicUrl: data.publicUrl,
        },
      });
      return jsonResponse({ success: true, logoUrl: data.publicUrl });
    } catch {
      console.error("admin_logo_upload_post_upload_failure");
      await removeUploadedObject(objectName);
      return jsonResponse({ error: "Logo upload failed. Please try again." }, 500);
    }
  }

  return { POST };
}
