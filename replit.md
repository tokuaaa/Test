# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

The project now includes a public Japanese school festival crowd-status site that replaces the Apps Script-hosted public view. Google Forms remain the entry points for registration and updates, while the Replit API reads the linked Google Spreadsheet and serves normalized festival group/crowd data to the web app.

The public site includes a school map feature based on the provided floor-map PDF data. It places organizations on fixed classroom coordinates and requests the visitor's browser geolocation on page load and when the refresh/current-location buttons are pressed. Floor structure: 中学棟3F=中1, 4F=中2, 5F=中3 / 高校棟3F=高1, 4F=高2, 5F=高3, plus ハンドボールコート, 打越アリーナ, 校庭, その他. Map shows wait-time color dots, an empty-room banner per floor, a 3D stacked-floor view when "すべて" is selected, a Wi-Fi/Network info card (uses Network Information API as a proxy because browsers cannot read SSID/RSSI directly), and an event schedule grid (9–17時, 30-min slots) that highlights currently running events such as the クイズ大会 in 打越アリーナ. Visitors can star groups as お気に入り (persisted in localStorage under key `festival-favorites`); favorites are summarized in an amber panel near the top with current wait status.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Festival data source**: Google Sheets public visualization endpoint, cached in the API server for 5 minutes

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
