import "server-only";

function getAuthHeader(name: string, envVar: string | undefined): string {
  if (!envVar) {
    console.warn(`MoneyOne auth header "${name}" is not configured. Set the corresponding environment variable.`);
  }
  return envVar || "";
}

export const moneyOneAuthHeaders = {
  client_id: getAuthHeader("client_id", process.env.MONEY_ONE_CLIENT_ID),
  client_secret: getAuthHeader("client_secret", process.env.MONEY_ONE_CLIENT_SECRET),
  organisationId: getAuthHeader("organisationId", process.env.MONEY_ONE_ORG_ID),
  appIdentifier: getAuthHeader("appIdentifier", process.env.MONEY_ONE_APP_IDENTIFIER),
};
