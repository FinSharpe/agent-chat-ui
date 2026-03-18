import StockAnalysisReportMessageComponent from "@/components/pdfs_templates/stock-report/stock-report";
import ClientComponentsRegistry from "@/components/thread/messages/client-components/registry";
import { getAccessToken, getFingerprint } from "@/lib/auth/cookies";
import { createClient } from "@/providers/client";
import { StockAnalysis } from "@/types/stock-analysis";
import { UIMessage } from "@langchain/langgraph-sdk/react-ui";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function StockAnalysisReportPage({ searchParams }: Props) {
  const params = await searchParams;
  const threadId = params.threadId;
  const analysisId = params.analysisId;
  const selectedSectionsParam = params.selectedSections as string | undefined;
  const personalComment = params.personalComment as string | undefined;

  // Parse selected sections from JSON string
  let selectedSections: string[] | undefined;
  if (selectedSectionsParam) {
    try {
      selectedSections = JSON.parse(selectedSectionsParam);
    } catch (e) {
      console.error("Failed to parse selectedSections:", e);
    }
  }

  try {
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
    const state = await client.threads.getState(threadId as string);

    const ui = (state.values as any)?.ui as UIMessage[] | undefined;

    const uiComponents = ui?.filter(
      (uiItem: UIMessage) => uiItem.props?.id === analysisId,
    );

    if (!uiComponents || uiComponents.length === 0) {
      console.error("No matching component for analysisId:", analysisId);
      return <div>No analysis found with ID: {analysisId}</div>;
    }

    return (
    <main>
        {uiComponents.map((uiComponent: UIMessage) => {
          const Component =
            ClientComponentsRegistry[
              uiComponent.name as keyof typeof ClientComponentsRegistry
            ];

          if (uiComponent.name === "stock_analysis") {
            return (
              <StockAnalysisReportMessageComponent
                key={uiComponent.id}
                analysis={uiComponent.props as unknown as StockAnalysis}
                selectedSections={selectedSections}
                personalComment={personalComment}
              />
            );
          }
          return (
            <Component
              key={uiComponent.id}
              {...(uiComponent.props as any)}
            />
          );
        })}
      </main>
    );
  } catch (error: any) {
    console.error("=== ERROR:", error.message);
    return <div>Error loading report: {error.message}</div>;
  }
}
