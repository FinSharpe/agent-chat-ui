import PfAnalysisReportMessageComponent from "@/components/pdfs_templates/pf-report/pf-report";
import ClientComponentsRegistry from "@/components/thread/messages/client-components/registry";
import { getAccessToken, getFingerprint } from "@/lib/auth/cookies";
import { createClient } from "@/providers/client";
import { PfAnalysis } from "@/types/pf-analysis";
import { UIMessage } from "@langchain/langgraph-sdk/react-ui";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function PfAnalysisReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const threadId = params.threadId;
  const analysisId = params.analysisId;
  const selectedSectionsParam = params.selectedSections as string | undefined;
  const personalComment = params.personalComment as string | undefined;

  if (
    !threadId ||
    !analysisId ||
    typeof threadId !== "string" ||
    typeof analysisId !== "string"
  ) {
    return (
      <p className="p-4 text-red-600">
        Missing or invalid required parameters: threadId and analysisId.
      </p>
    );
  }

  // Parse selected sections from JSON string
  let selectedSections: string[] | undefined;
  if (selectedSectionsParam) {
    try {
      const parsed: unknown = JSON.parse(selectedSectionsParam);
      if (
        Array.isArray(parsed) &&
        parsed.every((item) => typeof item === "string")
      ) {
        selectedSections = parsed;
      } else {
        console.error("selectedSections is not a string[]:", parsed);
      }
    } catch (e) {
      console.error("Failed to parse selectedSections:", e);
    }
  }

  const accessToken = await getAccessToken();
  const fingerprint = await getFingerprint();
  const headers: Record<string, string> = {};
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  if (fingerprint) headers["X-Fgp"] = fingerprint;

  const client = createClient(
    process.env.LANGGRAPH_API_URL!,
    process.env.LANGSMITH_API_KEY,
    headers,
  );

  let state;
  try {
    state = await client.threads.getState(threadId);
  } catch (e) {
    console.error("Failed to fetch thread state:", e);
    return (
      <p className="p-4 text-red-600">
        Failed to load thread data. Please try again.
      </p>
    );
  }

  const ui = (state.values as any)?.ui as UIMessage[] | undefined;

  const uiComponents = ui?.filter(
    (uiItem: UIMessage) => uiItem.props?.id === analysisId,
  );

  if (!uiComponents || uiComponents.length === 0) {
    return (
      <p className="p-4 text-red-600">
        No analysis found for the given analysisId.
      </p>
    );
  }

  return (
    <>
      {uiComponents.map((uiComponent: UIMessage) => {
        if (uiComponent.name === "pf_analysis")
          return (
            <PfAnalysisReportMessageComponent
              key={uiComponent.id}
              analysis={uiComponent.props as unknown as PfAnalysis}
              selectedSections={selectedSections}
              personalComment={personalComment}
            />
          );

        const Component =
          ClientComponentsRegistry[
            uiComponent.name as keyof typeof ClientComponentsRegistry
          ];

        if (!Component) return null;

        return (
          <Component
            key={uiComponent.id}
            {...(uiComponent.props as any)}
          />
        );
      })}
    </>
  );
}
