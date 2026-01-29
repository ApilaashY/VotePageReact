# VoteDemo

## How to Run the Project

1.  **Install Dependencies**
    Open your terminal in the project directory and run:

    ```bash
    npm install
    ```

2.  **Start the Development Server**
    To run the app in development mode:

    ```bash
    npm run dev
    ```

3.  **Build for Production**
    To create a production build:
    ```bash
    npm run build
    ```

## Folder Structure

### `public/`

Contains static assets and data files utilized by the application.

- `WardBoundaries.geojson`: GeoJSON file defining ward boundaries for the map.
- `events.csv`: Dataset containing event information.
- `media.csv`: Dataset containing media-related information.
- `municipality-map.csv`: Mapping data for municipalities.
- `nominees.csv`: Dataset containing nominee information.
- `vite.svg`: Vite logo asset.

### `src/`

Contains the source code for the React application.

- `MapSection/`: Components responsible for rendering and interacting with the map.
- `Navbar/`: Components for the application's navigation bar.
- `Race/`: Components for displaying election race details.
- `Region/`: Components for handling and displaying region-specific data.
- `Worksheet/`: Components related to worksheet functionality.
- `App.jsx`: The main root component of the application.
- `main.jsx`: The entry point that mounts the React application.
- `App.css` & `index.css`: Global and component-specific styles.
