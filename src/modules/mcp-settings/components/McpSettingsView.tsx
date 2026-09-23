"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";

import {
  getMeListGrantsApiMeMcpGrantsGetQueryKey,
  useMeListDevicesApiMeMcpDevicesGet,
  useMeListGrantsApiMeMcpGrantsGet,
  useMeRequestGrantApiMeMcpGrantsRequestPost,
} from "@/api/generated/mcp-apis/me-mcp/me-mcp";
import type { MCPGrantResponse } from "@/api/generated/mcp-apis/models";
import FeatureHeader from "@/components/discover/FeatureHeader";
import useIsDesktopWeb from "@/hooks/useIsDesktopWeb";

import { ActiveGrantBanner } from "./ActiveGrantBanner";
// import { DevicesList } from "./DevicesList";
import { GrantsList } from "./GrantsList";
import {
  RequestGrantForm,
  type RequestGrantFormValues,
} from "./RequestGrantForm";
import { SetupInstructions } from "./SetupInstructions";
import { deriveDisplayStatus, isActiveGrant } from "../utils/grant-display";

const MCP_SERVER_URL = process.env.NEXT_PUBLIC_MCP_SERVER_URL ?? "";

/**
 * MCP Access, laid out as a reference feature page: FeatureHeader with back,
 * then one scrolling column (centred on desktop, like a Discover feature).
 * Reached from Account Settings → Settings → MCP Access.
 */
export function McpSettingsView() {
  const router = useRouter();
  const isDesktopWeb = useIsDesktopWeb();
  const queryClient = useQueryClient();

  const grantsQuery = useMeListGrantsApiMeMcpGrantsGet();
  const devicesQuery = useMeListDevicesApiMeMcpDevicesGet();

  const requestGrant = useMeRequestGrantApiMeMcpGrantsRequestPost({
    mutation: {
      onSuccess: () => {
        toast.success("Request submitted — admin will be notified.");
        queryClient.invalidateQueries({
          queryKey: getMeListGrantsApiMeMcpGrantsGetQueryKey(),
        });
      },
      onError: (err) => {
        const message =
          err instanceof Error ? err.message : "Couldn't submit request.";
        toast.error(message);
      },
    },
  });

  const grants: MCPGrantResponse[] | undefined =
    grantsQuery.data?.status === 200 ? grantsQuery.data.data : undefined;
  // Fetched for the (currently hidden) devices list below.
  const _devices =
    devicesQuery.data?.status === 200 ? devicesQuery.data.data : undefined;

  const activeGrant = grants?.find(isActiveGrant);
  const hasPending = Boolean(
    grants?.some((g) => deriveDisplayStatus(g) === "pending"),
  );

  const handleSubmit = (values: RequestGrantFormValues) => {
    requestGrant.mutate({ data: values });
  };

  // Back returns to wherever the page was opened from; a direct visit has
  // nothing to go back to inside the app, so it lands on Chat instead.
  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  const body = (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-transparent">
      <FeatureHeader
        title="MCP Access"
        subtitle="Connect Claude Desktop & other MCP clients"
        onBack={goBack}
      />
      <div
        className={`scrollbar-none flex-1 space-y-6 overflow-y-auto px-5 py-5 ${isDesktopWeb ? "pb-16" : "pb-[130px]"}`}
      >
        {activeGrant && <ActiveGrantBanner grant={activeGrant} />}

        <RequestGrantForm
          disabled={hasPending}
          isSubmitting={requestGrant.isPending}
          onSubmit={handleSubmit}
        />

        <SetupInstructions
          enabled={Boolean(activeGrant)}
          serverUrl={MCP_SERVER_URL}
        />

        <GrantsList
          grants={grants}
          isLoading={grantsQuery.isLoading}
        />

        {/* <DevicesList devices={_devices} isLoading={devicesQuery.isLoading} /> */}
      </div>
    </div>
  );

  return (
    <div className="font-funnel relative h-full w-full flex-1 overflow-hidden bg-transparent">
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.22 }}
        className="absolute inset-0 flex flex-col"
      >
        {isDesktopWeb ? (
          <div className="mx-auto flex h-full min-h-0 w-full max-w-[calc(804px*var(--wx,1))] flex-col">
            {body}
          </div>
        ) : (
          body
        )}
      </motion.div>
    </div>
  );
}
