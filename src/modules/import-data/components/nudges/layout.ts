/** Width of one card in a Smart Alerts row — two per view on desktop, a
 *  fixed 270px peek on mobile (as Home's market news row). */
export const rowCardWidth = (isDesktopWeb: boolean) =>
  isDesktopWeb
    ? "min-w-[calc(50%-9px)] w-[calc(50%-9px)]"
    : "min-w-[270px] w-[270px]";
