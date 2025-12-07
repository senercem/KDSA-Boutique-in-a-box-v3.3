# Layer 4: KDSA.API

## 1. Overview

The `KDSA.API` layer is the outermost layer of the backend application and serves as the primary entry point for external clients. As a "headless" engine, its main purpose is to expose the system's capabilities through a set of RESTful API endpoints. This is the layer that partners and frontend applications will interact with.

**Responsibilities:**
-   Define and expose HTTP endpoints (e.g., `GET`, `POST`).
-   Handle incoming HTTP requests, including routing, parameter binding, and request body deserialization.
-   Call the appropriate services in the `Application` layer to execute the requested business logic.
-   Format the results from the application layer into HTTP responses (e.g., JSON payloads with status codes).
-   Configure and run the web server.
-   Implement cross-cutting concerns like authentication, authorization, and logging (though these are minimal in the MVP).

## 2. Project Structure and Files

```
/src/KDSA.API/
├── KDSA.API.csproj
├── Program.cs
├── appsettings.json
├── appsettings.Development.json
├── Properties/launchSettings.json
└── Controllers/
    ├── ComplianceController.cs
    └── DecisionEngineController.cs
```

### 2.1. `KDSA.API.csproj`
This file defines the project as a web application (`Microsoft.NET.Sdk.Web`). It holds references to `KDSA.Application` and `KDSA.Infrastructure` so it can orchestrate the application flow. It also includes web-specific dependencies like `Microsoft.AspNetCore.OpenApi` for Swagger/OpenAPI documentation.

### 2.2. `Program.cs`
This is the main entry point of the application. In modern .NET, this file is responsible for:
-   Creating the web application builder.
-   **Dependency Injection (DI) Configuration:** Registering all the services. The line `builder.Services.AddScoped<IGeminiService, GeminiService>();` tells the application that whenever a class asks for an `IGeminiService`, it should receive an instance of `GeminiService`. This is how the layers are connected at runtime.
-   **Middleware Pipeline Configuration:** Setting up the HTTP request pipeline (e.g., enabling HTTPS redirection, development-time Swagger UI).
-   Starting the web application.

### 2.3. `appsettings.json` / `appsettings.Development.json`
These are configuration files.
-   `appsettings.json`: Contains default and production settings. It's where the API keys and base URLs for Gemini and Baserow are stored. **Important:** Real secrets should be managed via a secure secret manager, not committed to source control.
-   `appsettings.Development.json`: Contains settings that override the base file when the application is run in the "Development" environment.

### 2.4. `Properties/launchSettings.json`
This file contains profiles for launching the application from Visual Studio or the `dotnet` CLI, specifying environment variables and the URLs to use (e.g., `http://localhost:5116`).

### 2.5. `Controllers/`
This directory holds the API controllers, which are the classes that define the API endpoints.

-   **`DecisionEngineController.cs`**: Exposes the **M2: Decision Engine** functionality.
    -   `[Route("api/[controller]")]`: Sets the base URL for this controller to `/api/DecisionEngine`.
    -   It receives an `IGeminiService` via its constructor (constructor injection).
    -   `[HttpPost("analyze")]`: Defines a `POST` endpoint at `/api/DecisionEngine/analyze`. It takes an `AnalysisRequest` from the request body, calls the `_geminiService.AnalyzeRiskAsync` method, and returns the result as a JSON object.

-   **`ComplianceController.cs`**: Exposes the **M3: Project Alexandra** functionality.
    -   `[Route("api/v1/[controller]")]`: Sets the base URL to `/api/v1/Compliance`, demonstrating API versioning.
    -   It receives an `IAlexandraService` via its constructor.
    -   Defines three endpoints (`POST /context`, `POST /metrics`, `GET /artifact/{systemId}`) that map directly to the methods on the `IAlexandraService` interface, exposing the core governance functions to partners.

## 3. Architectural Principles and Decisions

-   **Thin Controllers:** The controllers are kept "thin." Their job is to handle HTTP-related tasks and call the application layer. They do not contain business logic.
-   **Dependency Injection:** The API layer relies heavily on DI to get the services it needs. This makes the controllers easy to test, as the real services can be replaced with mock implementations.
-   **Configuration-Driven:** All external details (URLs, keys) are loaded from configuration files, allowing the application to be deployed in different environments without code changes.
