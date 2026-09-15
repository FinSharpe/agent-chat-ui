import { DELETED_DATA } from "../../constants/content";

/**
 * The "what is deleted" table, as a definition list: two columns from `sm`,
 * stacked rows on a phone so neither column is squeezed.
 */
export default function DeletedDataList() {
  return (
    <dl className="divide-y divide-gray-200 border-y border-gray-200">
      <div className="text-text-tertiary hidden py-2 text-xs font-medium tracking-wide uppercase sm:grid sm:grid-cols-[2fr_3fr] sm:gap-6">
        <span>Data</span>
        <span>What happens</span>
      </div>
      {DELETED_DATA.map(({ data, outcome }) => (
        <div
          key={data}
          className="flex flex-col gap-1 py-3 sm:grid sm:grid-cols-[2fr_3fr] sm:gap-6"
        >
          <dt className="text-primary-main-dark font-medium">{data}</dt>
          <dd className="text-text-secondary">{outcome}</dd>
        </div>
      ))}
    </dl>
  );
}
