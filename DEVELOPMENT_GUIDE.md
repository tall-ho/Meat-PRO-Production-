# MEAT PRO Cloud - Development & Maintenance Guide

This guide provides an overview of the system architecture, development workflow, and maintenance procedures for the MEAT PRO Cloud system.

## 1. Project Structure

The project follows a standard React/Vite structure:

- **`src/`**: Source code directory.
  - **`App.tsx`**: The main application component. Handles routing (tab switching), state management (user, connection), and layout (sidebar, header).
  - **`components/`**: Reusable UI components and specific module views.
    - `Sidebar.tsx`: Navigation menu component.
    - `ConnectionScreen.tsx`: Login/Connection screen (currently bypassed for dev).
    - `DashboardView.tsx`: Main dashboard with KPIs and alerts.
    - `ProductionPlan.tsx`, `MixingPlan.tsx`, etc.: Specific module implementations.
  - **`services/`**: API integration logic.
    - `sheetService.ts`: Handles communication with Google Apps Script (GAS).
  - **`constants.ts`**: System-wide constants (API URLs, storage keys, module definitions).
  - **`types.ts`**: TypeScript interfaces for data models (User, MasterItem, ProductionPlan, etc.).
  - **`index.css`**: Global styles and Tailwind directives.

## 2. Key Concepts

### State Management
The application uses React's `useState` and `useEffect` for local state management. Global state (like user info, connection status) is lifted up to `App.tsx` and passed down via props.

### Routing
Routing is handled manually within `App.tsx` using the `activeTab` state. The `getTabContent` function renders the appropriate component based on the selected tab.

### Data Fetching
Data is fetched from Google Sheets via `sheetService.ts`. The backend is a Google Apps Script deployed as a Web App.
- **Read:** `fetchSheetData<T>(sheetName)` sends a GET request with `action=read&sheet=SheetName`.
- **Write:** `saveSheetData<T>(sheetName, data)` sends a POST request with `action=write&sheet=SheetName&data=...`.

## 3. Adding New Modules

To add a new module (e.g., "Quality Control"):

1.  **Define the Module:**
    - Open `src/constants.ts`.
    - Add a new entry to `SYSTEM_MODULES`:
      ```typescript
      { id: 'qc', label: 'QUALITY CONTROL', icon: 'clipboard-check', subItems: [...] }
      ```

2.  **Create the Component:**
    - Create a new file `src/components/QualityControl.tsx`.
    - Implement the UI and logic.

3.  **Register the Route:**
    - Open `src/App.tsx`.
    - Import the new component.
    - Add a case to `getTabContent`:
      ```typescript
      if (tabId === 'qc') return <QualityControl />;
      ```

## 4. Google Sheets Integration

The backend relies on a specific Google Sheet structure. The sheet names must match `SHEET_NAMES` in `src/constants.ts`.

### Key Sheets:
- **Users:** User accounts and permissions.
- **MasterItems:** Product catalog (SKU, Name, Weight, etc.).
- **ProductionPlan:** Daily production schedules.
- **Equipment:** Machinery list and status.
- **ProductMatrix:** Recipes and BOMs.

### API Actions (Google Apps Script):
- `action=lookup&key=LICENSE_KEY`: Validates license and returns sheet URL.
- `action=read&sheet=SHEET_NAME`: Returns all rows as JSON objects.
- `action=write`: Overwrites the specified sheet with new data.

## 5. Maintenance

### Updating Master Data
- **Via UI:** Use the "Master Item" or "Equipment" modules to add/edit items. Changes are saved back to Sheets.
- **Via Sheets:** You can directly edit the Google Sheet. Ensure column headers remain consistent with the TypeScript interfaces in `src/types.ts`.

### Troubleshooting
- **Connection Issues:** Check `localStorage` for `meatpro_api_url`. Ensure the Google Apps Script deployment is active and accessible ("Anyone").
- **Data Mismatch:** Verify that the Google Sheet column names match the JSON keys expected by the frontend (case-sensitive).

## 6. Deployment

To deploy the application:

1.  **Build:**
    ```bash
    npm run build
    ```
    This generates a `dist/` folder with static assets.

2.  **Host:**
    - Upload the contents of `dist/` to any static hosting service (Netlify, Vercel, Firebase Hosting, or GitHub Pages).
    - Ensure the hosting service supports SPA routing (redirect all requests to `index.html`).

## 7. Development Tips

- **Bypassing Login:** The `ConnectionScreen` is currently bypassed in `App.tsx` by setting `isConnected` to `true` by default. To re-enable login, change it back to `false`.
- **Mock Data:** Use `MOCK_DATA` in `App.tsx` for UI testing without API connectivity.
