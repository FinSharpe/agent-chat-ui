interface PolicySectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export default function PolicySection({
  id,
  title,
  children,
}: PolicySectionProps) {
  return (
    <section
      aria-labelledby={id}
      className="border-t border-gray-200 py-8"
    >
      <h2
        id={id}
        className="text-primary-main-dark mb-4 text-lg font-semibold sm:text-xl"
      >
        {title}
      </h2>
      <div className="text-text-secondary flex flex-col gap-4 text-base leading-relaxed">
        {children}
      </div>
    </section>
  );
}
