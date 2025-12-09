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
    ├── ACOREController.cs
    ├── AuthController.cs
    ├── ComplianceController.cs
    └── DecisionEngineController.cs
```

### 2.1. `KDSA.API.csproj`
This file defines the project as a web application (`Microsoft.NET.Sdk.Web`). It holds references to `KDSA.Application` and `KDSA.Infrastructure` so it can orchestrate the application flow. It also includes web-specific dependencies like `Microsoft.AspNetCore.OpenApi` for Swagger/OpenAPI documentation and `Microsoft.AspNetCore.Authentication.JwtBearer` for handling JWT authentication.

### 2.2. `Program.cs`
This is the main entry point of the application. In modern .NET, this file is responsible for:
-   Creating the web application builder.
-   **Dependency Injection (DI) Configuration:** Registering all the services, including `IACOREService`, `IAuthService`, `IGeminiService`, etc., with their concrete implementations.
-   **CORS Configuration:** A policy named "AllowReactApp" is configured to allow requests from specific frontend origins (e.g., `http://localhost:3000`), which is crucial for development.
-   **Authentication Configuration:** Configures the application to use JWT Bearer authentication, validating tokens based on the `SecretKey`, `Issuer`, and `Audience` defined in `appsettings.json`.
-   **Middleware Pipeline Configuration:** Setting up the HTTP request pipeline. The order is critical: `UseCors` -> `UseAuthentication` -> `UseAuthorization` -> `MapControllers`. This ensures that incoming requests are correctly processed for cross-origin resource sharing, identity, and permissions before reaching the controllers.
-   Starting the web application.

### 2.3. `appsettings.json` / `appsettings.Development.json`
These are configuration files.
-   `appsettings.json`: Contains default and production settings. It's where the API keys and base URLs for Gemini and Baserow are stored. It now also includes a `JwtSettings` section with the `SecretKey`, `Issuer`, `Audience`, and `ExpiryMinutes` for JWT configuration. A `UsersTableId` has also been added to the `Baserow` section.
-   `appsettings.Development.json`: Contains settings that override the base file when the application is run in the "Development" environment.

### 2.4. `Properties/launchSettings.json`
This file contains profiles for launching the application from Visual Studio or the `dotnet` CLI, specifying environment variables and the URLs to use.

### 2.5. `Controllers/`
This directory holds the API controllers, which are the classes that define the API endpoints.

-   **`ACOREController.cs`**: Exposes the **M1: ACORE** functionality.
    -   `[HttpPost("analyze")]`: Defines a `POST` endpoint at `/api/ACORE/analyze`. It takes `ACOREInputData` from the request body, passes it to the `IACOREService` for analysis, and returns the calculated `ACORERiskProfile`.

-   **`AuthController.cs`**: Exposes endpoints for authentication and user management.
    -   `[HttpPost("register")]`: Allows an authorized user (e.g., an admin) to register a new user.
    -   `[HttpPost("login")]`: Authenticates a user based on email and password and returns a JWT token.
    -   `[HttpPost("change-password")]`: Allows an authenticated user to change their password.
    -   `[HttpGet("users")]`: Retrieves a list of all users. Restricted to users with the "Admin" role.
    -   `[HttpDelete("users/{id}")]`: Deletes a user by their ID. Requires authorization.

-   **`ComplianceController.cs`**: Exposes the **M3: Project Alexandra** functionality.
    -   `[Route("api/v1/[controller]")]`: Sets the base URL to `/api/v1/Compliance`, demonstrating API versioning.
    -   Defines endpoints (`POST /context`, `POST /metrics`, `GET /artifact/{systemId}`) that map directly to the methods on the `IAlexandraService`.
    -   `[HttpGet("logs")]`: A new endpoint to retrieve the full audit trail of decisions.
    -   `[HttpPost("generate-report")]`: A new endpoint that takes the `SystemId`, M2 analysis result, and M1 risk score to generate a comprehensive compliance report and log it.

-   **`DecisionEngineController.cs`**: Exposes the **M2: Decision Engine** functionality.
    -   `[HttpPost("analyze")]`: Defines a `POST` endpoint at `/api/DecisionEngine/analyze`. It takes an `AnalysisRequest` from the request body, calls the `_geminiService.AnalyzeRiskAsync` method, and returns the result.

## 3. Architectural Principles and Decisions

-   **Thin Controllers:** The controllers are kept "thin." Their job is to handle HTTP-related tasks and call the application layer. They do not contain business logic.
-   **Dependency Injection:** The API layer relies heavily on DI to get the services it needs. This makes the controllers easy to test, as the real services can be replaced with mock implementations.
-   **Configuration-Driven:** All external details (URLs, keys, JWT settings) are loaded from configuration files, allowing the application to be deployed in different environments without code changes.
-   **Attribute-Based Routing and Authorization:** ASP.NET Core's attributes (`[Route]`, `[ApiController]`, `[HttpPost]`, `[Authorize]`) are used to define routes, behavior, and security requirements in a declarative and readable way.
