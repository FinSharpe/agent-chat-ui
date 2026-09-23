export const MONEY_ONE_ERROR_CODES = {
    DATA_NOT_READY: "Data not ready!",
} as const;

export enum ConsentType {
    MUTUAL_FUNDS = 'MUTUAL_FUNDS',
    EQUITIES = 'EQUITIES',
    ETF = 'ETF',
    BANK_ACCOUNTS = 'BANK_ACCOUNTS',
    SIP = 'SIP'
};