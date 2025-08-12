# Daily Page App

A React + TypeScript application that provides a personalized daily dashboard. The app displays:

- **Weather**: Current conditions and forecast for your location.
- **Air Quality**: Real-time air quality index and details.
- **Calendar**: Your daily events and schedule.

## Features

- Modular design for easy extension.
- Localization support (English, Polish).
- Responsive UI for desktop and mobile.

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start the development server**:
   ```bash
   npm run dev
   ```
3. **Build for production**:
   ```bash
   npm run build
   ```

## Project Structure

- `src/modules/weather` – Weather and air quality components/services
- `src/modules/header` – App header
- `src/i18n` – Localization files
- `src/theme` – Theme configuration
## Development

### Debugging
To debug in InteliJ 
1. Add new configuration ,
2. Pick `Attach to Node.js/Chrome` . Name it ( for ex. "Attach to chromium" ) , host : `localhost` , port `9229` ( defaults )
3. Save configuration
4. Edit test run configuration you want to debug and add following Vitest options and save
`--browser --browser.headless=false --no-file-parallelism --inspect-brk --run`
5. Run your test . It should now open chromium and wait
6. Run your Attach to chromoum configuration in debug mode from InteliJ

Intelij can stop in random place but then it should stop at your breakpoints
This setting can be added as Edit configuration template , but be mindful that when using it, regardless if Run or Debug , tests will always pause at test execution and wait for debugger !
If you want to run test normally without debugger , you can remove this configuration and run normally

## Technologies Used

- React
- TypeScript
- Vite

## License

See [LICENSE](./LICENSE) for details.
