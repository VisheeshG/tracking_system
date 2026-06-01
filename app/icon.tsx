import { ImageResponse } from "next/og";
import { getLogoDataUrl, LogoMarkImage } from "@/lib/favicon-image";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const src = await getLogoDataUrl();
  return new ImageResponse(<LogoMarkImage width={32} height={32} src={src} />, {
    width: 32,
    height: 32,
  });
}
