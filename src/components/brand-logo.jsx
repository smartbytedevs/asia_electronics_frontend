import Image from "next/image";
import Link from "next/link";

const LOGO_SRC = "/logo/logo.png";
const LOGO_WIDTH = 1536;
const LOGO_HEIGHT = 1024;

/**
 * The supplied Asia Electronics logo, rendered at its intrinsic 3:2 ratio.
 * `className` sets the rendered height; width stays automatic so the mark is
 * never stretched or cropped. The multiply blend lets the logo's white canvas
 * sit cleanly on the storefront's white, ivory and cream surfaces.
 */
export function BrandLogoImage({
  className = "h-12",
  sizes = "160px",
  priority = false,
}) {
  return (
    <Image
      src={LOGO_SRC}
      alt="Asia Electronics"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      sizes={sizes}
      priority={priority}
      className={`w-auto object-contain mix-blend-multiply ${className}`}
    />
  );
}

/**
 * Shared logo lockup used by the storefront header, footer, mobile menu, auth
 * screens and admin sidebar. `tone="light"` places the logo on a white tile so
 * it stays legible on the navy footer.
 */
export function BrandLogo({
  href = "/",
  tone = "dark",
  className = "",
  imgClassName = "h-12 sm:h-14",
  sizes = "160px",
  priority = false,
}) {
  const image = (
    <BrandLogoImage
      className={imgClassName}
      sizes={sizes}
      priority={priority}
    />
  );

  return (
    <Link
      href={href}
      aria-label="Asia Electronics — home"
      className={"group inline-flex items-center " + className}
    >
      {tone === "light" ? (
        <span className="inline-flex items-center justify-center rounded-xl bg-white px-3 py-2 shadow-[0_12px_30px_-18px_rgba(8,20,46,0.9)] transition-transform duration-300 group-hover:-translate-y-0.5">
          {image}
        </span>
      ) : (
        <span className="inline-flex items-center transition-transform duration-300 group-hover:-translate-y-0.5">
          {image}
        </span>
      )}
    </Link>
  );
}
