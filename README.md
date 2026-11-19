# Mini Factory Ways

Mini Factory Ways is a free, single-player browser strategy game. Connect suppliers to factories and expand the freight network as orders increase.

Open `dist/index.html` in a desktop browser to play locally. To host it, serve the contents of `dist/` as a static website.

## Replace the placeholder art

1. Put transparent PNG or WebP files in `dist/assets/`.
2. Open `dist/assets/sprites.js` and set the corresponding entries to paths such as `assets/copper-truck.webp`.
3. Reload the game. Empty entries and unavailable images fall back to the built-in shapes.

The map uses square art for suppliers, factories, rocks, and trees. Use a landscape image for each truck, pointing to the right. Keep the copper circle, machinery diamond, ceramics triangle, and grain cross visible on the supplier and factory sprites so players can match the destinations. The road network, terrain, and demand bars are drawn in `dist/map-view.js`.

District layouts, scoring, demand, and routing live in `dist/simulation.js`. High scores are stored in the browser per district.
