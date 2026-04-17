"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Plug } from "lucide-react";
import { toast } from "sonner";

import {
  getMeListGrantsApiMeMcpGrantsGetQueryKey,
  useMeListDevicesApiMeMcpDevicesGet,
  useMeListGrantsApiMeMcpGrantsGet,
  useMeRequestGrantApiMeMcpGrantsRequestPost,
} from "@/api/generated/mcp-apis/me-mcp/me-mcp";
import type { MCPGrantResponse } from "@/api/generated/mcp-apis/models";

import { ActiveGrantBanner } from "./ActiveGrantBanner";
import { DevicesList } from "./DevicesList";
import { GrantsList } from "./GrantsList";
import { RequestGrantForm, type RequestGrantFormValues } from "./RequestGrantForm";
import { SetupInstructions } from "./SetupInstructions";
import { deriveDisplayStatus, isActiveGrant } from "../utils/grant-display";

const MCP_SERVER_URL =
  process.env.NEXT_PUBLIC_MCP_SERVER_URL ?? "";

export function McpSettingsView() {
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
  const devices =
    devicesQuery.data?.status === 200 ? devicesQuery.data.data : undefined;

  const activeGrant = grants?.find(isActiveGrant);
  const hasPending = Boolean(
    grants?.some((g) => deriveDisplayStatus(g) === "pending"),
  );

  const handleSubmit = (values: RequestGrantFormValues) => {
    requestGrant.mutate({ data: values });
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 mb-16 sm:px-6 sm:py-10">
      <header className="mb-6 flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-paper text-primary-main-light">
          <Plug className="size-5" strokeWidth={2.25} />
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-text-primary">
            MCP Access
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Connect FinSharpe to Claude Desktop and other MCP-compatible
            clients.
          </p>
        </div>
      </header>

      <div className="space-y-6">
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

        <GrantsList grants={grants} isLoading={grantsQuery.isLoading} />

        {/* <DevicesList devices={devices} isLoading={devicesQuery.isLoading} /> */}
      </div>
    </div>
  );
}
