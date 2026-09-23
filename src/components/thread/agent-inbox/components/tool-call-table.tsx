import { ToolCall } from "@langchain/core/messages/tool";
import { unknownToPrettyDate } from "../utils";

export function ToolCallTable({ toolCall }: { toolCall: ToolCall }) {
  return (
    <div className="max-w-full min-w-[300px] overflow-hidden rounded-nested border border-slate-100">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th
              className="bg-slate-50 px-3 py-1.5 text-left text-[11px] font-medium text-[#0A1F4D]"
              colSpan={2}
            >
              {toolCall.name}
            </th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(toolCall.args).map(([key, value]) => {
            let valueStr = "";
            if (["string", "number"].includes(typeof value)) {
              valueStr = value.toString();
            }

            const date = unknownToPrettyDate(value);
            if (date) {
              valueStr = date;
            }

            try {
              valueStr = valueStr || JSON.stringify(value, null);
            } catch {
              // failed to stringify, just assign an empty string
              valueStr = "";
            }

            return (
              <tr
                key={key}
                className="border-t border-slate-100"
              >
                <td className="w-1/3 px-3 py-1.5 align-top text-[11px] text-slate-500">{key}</td>
                <td className="px-3 py-1.5 font-mono text-[11px] break-words text-[#0A1F4D]">{valueStr}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
