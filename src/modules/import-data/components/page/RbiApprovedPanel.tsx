import { BANNER_WAVE } from "@/components/shared/SectionKit";

/**
 * The Account Aggregator trust panel — same treatment as the "Stay Informed"
 * SectionBanner: cyan wave, the shared bottom scrim, white text sat low.
 */
export function RbiApprovedPanel() {
  return (
    <div className="premium-shadow-sm group/media relative flex h-[260px] w-full flex-col justify-end overflow-hidden rounded-card p-7 text-white">
      <div
        className="pointer-events-none absolute -inset-px bg-cover bg-center transition-transform duration-700 ease-out group-hover/media:scale-[1.06] motion-reduce:transition-none motion-reduce:group-hover/media:scale-100"
        style={{ backgroundImage: `url(${BANNER_WAVE.cyan})` }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4"
        style={{
          background:
            "linear-gradient(to top, rgba(6,17,46,0.82) 0%, rgba(6,17,46,0.44) 42%, transparent 100%)",
        }}
      />
      <div className="relative z-10 space-y-1.5">
        <span className="v3-eyebrow block !text-white">
          RBI Approved Data Import
        </span>
        <p className="text-[13px] leading-relaxed text-white">
          Import investments &amp; transactions securely via RBI Account
          Aggregator.
        </p>
      </div>
      <div className="relative z-10 my-4 border-t border-white/20" />
      <div className="relative z-10 space-y-1.5">
        <span className="v3-eyebrow block !text-white">
          Personal Investment Data
        </span>
        <p className="text-[13px] leading-relaxed text-white">
          Imported via secure user consent. Delete anytime.
        </p>
      </div>
    </div>
  );
}
