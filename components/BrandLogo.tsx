import Image from "next/image";

type BrandLogoProps = {
  size?: number;
  className?: string;
  priority?: boolean;
};

/** App mark — chain link with growth arrow (see /public/logo.png). */
export function BrandLogo({
  size = 40,
  className = "",
  priority = false,
}: BrandLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Linkto"
      width={size}
      height={size}
      priority={priority}
      className={`object-contain ${className}`.trim()}
    />
  );
}
