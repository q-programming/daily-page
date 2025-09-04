# Daily Page App

A Java Spring Boot application with embedded React + TypeScript frontend that provides a personalized daily dashboard. The app displays:

- **Weather**: Current conditions and forecast for your location.
- **Air Quality**: Real-time air quality index and details.
- **Calendar**: Your daily events and schedule.

## Features

- Modular design for easy extension.
- Localization support (English, Polish).
- Responsive UI for desktop and mobile.
- Spring Boot backend with RESTful API.
- React frontend communicating with the API.

## Getting Started
### Backend
1. **Build and run the application**:
   ```bash
   ./mvnw spring-boot:run
   ```
   or
   ```bash
   mvnw.cmd spring-boot:run
   ```
2. **Access the application**:
   ```
   http://localhost:8080
   ```

### Frontend
1. **Install dependencies**:
   ```bash
   cd src/main/webapp
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

> Note: During the packaging process, the React Vite application is built into the static folder so that Spring Boot can serve it. The frontend communicates with the backend API.

## Building
The application can be built with two different profiles:

### JAR Package
```bash
./mvnw clean package
```
This creates a standalone executable JAR file that includes an embedded web server.

### WAR Package
```bash
./mvnw clean package -Pwar
```
This creates a WAR file that can be deployed to an external web server or servlet container.

### Differences
- **JAR**: Self-contained, includes embedded Tomcat, easier for microservices and standalone deployments.
- **WAR**: Deployable to existing application servers, suitable for environments where multiple applications share the same server.

### Project Structure

- `src/main/webapp/modules/weather` – Weather and air quality components/services
- `src/main/webapp/modules/calendar` – Google Calendar components/services
- `src/main/webapp/src/modules/header` – App header
- `src/main/webapp/src/i18n` – Localization files
- `src/main/webapp/src/theme` – Theme configuration
- `src/main/java` - Backend Java code
- `src/main/resources` - Backend configuration files

### Development

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

### Technologies Used

- Spring Boot (Backend)
- React (Frontend)
- TypeScript
- Vite
- Maven

## License

See [LICENSE](./LICENSE) for details.
