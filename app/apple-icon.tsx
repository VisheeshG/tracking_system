import { ImageResponse } from "next/og";
import { getLogoDataUrl, LogoMarkImage } from "@/lib/favicon-image";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const src = await getLogoDataUrl();
  return new ImageResponse(
    <LogoMarkImage width={180} height={180} src={src} />,
    { width: 180, height: 180 }
  );
}
