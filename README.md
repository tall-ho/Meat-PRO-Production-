# MEAT PRO Cloud - Production System

MEAT PRO Cloud is a web-based Manufacturing Execution System (MES) designed for Halal meat processing. It provides real-time monitoring, production planning, and tracking capabilities, integrated with Google Sheets as a backend.

## Features

- **Real-time Dashboard:** Monitor production lines, alerts, and KPIs.
- **Production Planning:** Manage daily production plans and mixing schedules.
- **Tracking:** Track production stages from mixing to packing.
- **Configuration:** Manage master items, equipment, and production standards.
- **Google Sheets Integration:** Uses Google Sheets as a database for easy management and accessibility.

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **State Management:** React Hooks (useState, useEffect)
- **Backend:** Google Apps Script (GAS) & Google Sheets

## Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/t-all-dcc/MEAT-PRO-Production-.git
    cd MEAT-PRO-Production-
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  **Open in browser:**
    Navigate to `http://localhost:3000` (or the URL provided by your terminal).

## Configuration

The system connects to a Google Sheet backend. The connection URL is managed via the `ConnectionScreen` (currently bypassed for development).

- **Master Registry URL:** Configured in `src/constants.ts`.
- **API URL:** Stored in `localStorage` under `meatpro_api_url`.

## License

Private - T-All DCC
