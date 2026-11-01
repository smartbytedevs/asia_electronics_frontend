import Image from "next/image";

const ABSOLUTE_URL = /^https?:\/\//i;

/**
 * Remote product image with a graceful branded placeholder. Absolute URLs go
 * through next/image (remote patterns are configured in next.config.mjs);
 * anything else (missing, relative, invalid) falls back to a monogram tile.
 * The `className` lands on the wrapping frame so hover transforms work for
 * both branches.
 */
export function ProductImage({
  src,
  alt,
  className = "",
  imgClassName = "",
  sizes = "400px",
  preload = false,
}) {
  const absolute = typeof src === "string" && ABSOLUTE_URL.test(src);

  return (
    <div className={"relative h-full w-full overflow-hidden " + className}>
      {absolute ? (
        <Image
          src={src}
          alt={alt || "Product image"}
          fill
          sizes={sizes}
          preload={preload}
          className={imgClassName || "object-cover"}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sand via-white to-sand">
          <span className="text-[0.7rem] font-extrabold uppercase tracking-[0.3em] text-ink/35">
            AE
          </span>
        </div>
      )}
    </div>
  );
}
