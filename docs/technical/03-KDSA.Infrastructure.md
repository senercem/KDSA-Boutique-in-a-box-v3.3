# Layer 3: KDSA.Infrastructure

## 1. Overview

The `KDSA.Infrastructure` layer is where the application connects to the outside world. It contains the concrete implementations of the interfaces defined in the `KDSA.Application` layer. This is where technologies are chosen and implemented, such as which database to use, which AI model to call, and how to connect to external services.

**Responsibilities:**
-   Implement the interfaces from the `Application` layer (`IGeminiService`, `IAlexandraService`, `IBaserowClient`).
-   Handle all communication with external systems: databases, third-party APIs, file systems, etc.
-   Contain the "glue" code that connects the pure business logic to the outside world.
-   Manage configuration details (API keys, connection strings) needed to access external services.

## 2. Project Structure and Files

```
/src/KDSA.Infrastructure/
├── KDSA.Infrastructure.csproj
└── Services/
    ├── AlexandraService.cs
    ├── BaserowClient.cs
    └── GeminiService.cs
```

### 2.1. `KDSA.Infrastructure.csproj`
This project file references both `KDSA.Application` (to access the interfaces it needs to implement) and `KDSA.Domain` (to work with the business entities). It also includes external library dependencies, such as `Newtonsoft.Json` for JSON serialization and `Microsoft.Extensions.Configuration` to read configuration values from `appsettings.json`.

### 2.2. `Services/`
This directory contains the concrete classes that implement the application's interfaces.

-   **`AlexandraService.cs`**: Implements `IAlexandraService`.
    -   **Current State (MVP):** In the current version, this service uses in-memory dictionaries and lists (`_systemContexts`, `_metrics`) to store data. This is a temporary solution to allow development and testing without a persistent database.
    -   **Future State:** This service will be updated to store and retrieve data from a persistent data store, likely the Baserow database, to ensure data is not lost when the application restarts.
    -   `GenerateComplianceArtifactAsync`: This method currently returns hard-coded ("mock") data that matches the `ComplianceArtifact` structure. This simulates the generation of a real report.

-   **`BaserowClient.cs`**: Implements `IBaserowClient`.
    -   This class uses `HttpClient` to make REST API calls to the self-hosted Baserow instance.
    -   It reads the Baserow URL, API Token, and Table ID from the configuration (`appsettings.json`) via `IConfiguration`. This is a best practice to avoid hard-coding secrets in the code.
    -   `LogDecisionAsync`: This method serializes the `AuditLogEntry` object into the JSON format expected by the Baserow API and sends it via an HTTP POST request. It includes error handling to log any issues with the connection or API response.

-   **`GeminiService.cs`**: Implements `IGeminiService`.
    -   This class also uses `HttpClient` to connect to the Google Gemini API.
    -   It retrieves the Gemini API key and base URL from the configuration.
    -   `AnalyzeRiskAsync`: This method constructs the JSON payload required by the Gemini API, sends the request, and then parses the response to extract just the generated text content. This encapsulates the complexity of the external API call.

## 3. Architectural Principles and Decisions

-   **Volatile Layer:** This layer is the most "volatile" or likely to change. By isolating this logic, we can change databases (from Baserow to PostgreSQL) or AI providers without touching the `Application` or `Domain` layers.
-   **Dependency Injection:** The services in this layer are designed to be registered with a dependency injection container. The `API` layer will ask for an `IGeminiService`, and the container will provide an instance of `GeminiService`. This decouples the layers at runtime.
-   **Configuration Management:** All secrets and environment-specific settings are managed through `IConfiguration`, which reads from `appsettings.json`. This keeps the code clean and secure.
