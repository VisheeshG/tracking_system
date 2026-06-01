import { readFile } from "node:fs/promises";
import path from "node:path";

let cachedLogoDataUrl: string | null = null;

/** Official Linkto mark (white link + gradient arrow on black). */
export async function getLogoDataUrl(): Promise<string> {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;
  const file = await readFile(
    path.join(process.cwd(), "public", "logo.png")
  );
  cachedLogoDataUrl = `data:image/png;base64,${file.toString("base64")}`;
  return cachedLogoDataUrl;
}

export function LogoMarkImage({
  width,
  height,
  src,
}: {
  width: number;
  height: number;
  src: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000000",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        width={width}
        height={height}
        alt=""
        style={{ objectFit: "contain" }}
      />
    </div>
  );
}
