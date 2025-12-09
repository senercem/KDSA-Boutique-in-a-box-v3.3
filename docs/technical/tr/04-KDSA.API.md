# Katman 4: KDSA.API

## 1. Genel Bakış

`KDSA.API` katmanı, backend uygulamasının en dış katmanıdır ve harici istemciler için birincil giriş noktası olarak hizmet eder. "Headless" bir motor olarak temel amacı, sistemin yeteneklerini bir dizi RESTful API endpoint'i aracılığıyla sunmaktır. İş ortaklarının ve frontend uygulamalarının etkileşime gireceği katman budur.

**Sorumlulukları:**
-   HTTP endpoint'lerini (`GET`, `POST` vb.) tanımlamak ve sunmak.
-   Yönlendirme, parametre bağlama ve istek gövdesi serileştirmesi dahil olmak üzere gelen HTTP isteklerini işlemek.
-   İstenen iş mantığını yürütmek için `Application` katmanındaki uygun servisleri çağırmak.
-   Uygulama katmanından gelen sonuçları HTTP yanıtlarına (örneğin, durum kodları içeren JSON yükleri) formatlamak.
-   Web sunucusunu yapılandırmak ve çalıştırmak.
-   Kimlik doğrulama, yetkilendirme ve loglama gibi kesişen ilgileri (cross-cutting concerns) uygulamak (MVP'de bu endişeler minimal düzeydedir).

## 2. Proje Yapısı ve Dosyalar

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
Bu dosya, projeyi bir web uygulaması (`Microsoft.NET.Sdk.Web`) olarak tanımlar. Uygulama akışını yönetebilmesi için `KDSA.Application` ve `KDSA.Infrastructure` projelerine referanslar içerir. Ayrıca, Swagger/OpenAPI dokümantasyonu için `Microsoft.AspNetCore.OpenApi` ve JWT kimlik doğrulamasını işlemek için `Microsoft.AspNetCore.Authentication.JwtBearer` gibi web'e özgü bağımlılıkları da içerir.

### 2.2. `Program.cs`
Bu, uygulamanın ana giriş noktasıdır. Modern .NET'te bu dosya şunlardan sorumludur:
-   Web uygulaması oluşturucusunu (builder) yaratmak.
-   **Bağımlılık Enjeksiyonu (DI) Yapılandırması:** `IACOREService`, `IAuthService`, `IGeminiService` vb. dahil olmak üzere tüm servisleri somut implementasyonlarıyla kaydetmek.
-   **CORS Yapılandırması:** Geliştirme için çok önemli olan, belirli frontend kaynaklarından (ör. `http://localhost:3000`) gelen isteklere izin vermek için "AllowReactApp" adında bir politika yapılandırılmıştır.
-   **Kimlik Doğrulama Yapılandırması:** Uygulamayı, `appsettings.json` dosyasında tanımlanan `SecretKey`, `Issuer` ve `Audience`'a göre token'ları doğrulayan JWT Bearer kimlik doğrulamasını kullanacak şekilde yapılandırır.
-   **Middleware Pipeline Yapılandırması:** HTTP istek hattını kurmak. Sıralama kritiktir: `UseCors` -> `UseAuthentication` -> `UseAuthorization` -> `MapControllers`. Bu, gelen isteklerin denetleyicilere ulaşmadan önce çapraz kaynak paylaşımı, kimlik ve izinler için doğru şekilde işlenmesini sağlar.
-   Web uygulamasını başlatmak.

### 2.3. `appsettings.json` / `appsettings.Development.json`
Bunlar yapılandırma dosyalarıdır.
-   `appsettings.json`: Varsayılan ve üretim ayarlarını içerir. Gemini ve Baserow için API anahtarları ve temel URL'lerin saklandığı yerdir. Artık JWT yapılandırması için `SecretKey`, `Issuer`, `Audience` ve `ExpiryMinutes` içeren bir `JwtSettings` bölümü de içerir. Ayrıca `Baserow` bölümüne bir `UsersTableId` eklenmiştir.
-   `appsettings.Development.json`: Uygulama "Development" ortamında çalıştırıldığında temel dosyayı geçersiz kılan ayarları içerir.

### 2.4. `Properties/launchSettings.json`
Bu dosya, uygulamayı Visual Studio'dan veya `dotnet` CLI'dan başlatmak için profiller içerir ve ortam değişkenlerini ve kullanılacak URL'leri belirtir.

### 2.5. `Controllers/`
Bu klasör, API endpoint'lerini tanımlayan sınıflar olan API denetleyicilerini (controllers) içerir.

-   **`ACOREController.cs`**: **M1: ACORE** işlevselliğini sunar.
    -   `[HttpPost("analyze")]`: `/api/ACORE/analyze` adresinde bir `POST` endpoint'i tanımlar. İstek gövdesinden `ACOREInputData` alır, analiz için `IACOREService`'e iletir ve hesaplanan `ACORERiskProfile`'ı döndürür.

-   **`AuthController.cs`**: Kimlik doğrulama ve kullanıcı yönetimi için endpoint'ler sunar.
    -   `[HttpPost("register")]`: Yetkili bir kullanıcının (ör. bir admin) yeni bir kullanıcı kaydetmesine olanak tanır.
    -   `[HttpPost("login")]`: Bir kullanıcıyı e-posta ve şifreye göre doğrular ve bir JWT token'ı döndürür.
    -   `[HttpPost("change-password")]`: Kimliği doğrulanmış bir kullanıcının şifresini değiştirmesine olanak tanır.
    -   `[HttpGet("users")]`: Tüm kullanıcıların bir listesini alır. "Admin" rolüne sahip kullanıcılarla sınırlıdır.
    -   `[HttpDelete("users/{id}")]`: Bir kullanıcıyı ID'sine göre siler. Yetkilendirme gerektirir.

-   **`ComplianceController.cs`**: **M3: Project Alexandra** işlevselliğini sunar.
    -   `[Route("api/v1/[controller]")]`: Temel URL'yi `/api/v1/Compliance` olarak ayarlayarak API sürümlemesini gösterir.
    -   `IAlexandraService` üzerindeki metotlarla doğrudan eşleşen endpoint'ler (`POST /context`, `POST /metrics`, `GET /artifact/{systemId}`) tanımlar.
    -   `[HttpGet("logs")]`: Kararların tam denetim izini almak için yeni bir endpoint.
    -   `[HttpPost("generate-report")]`: Kapsamlı bir uyumluluk raporu oluşturmak ve kaydetmek için `SystemId`, M2 analiz sonucunu ve M1 risk puanını alan yeni bir endpoint.

-   **`DecisionEngineController.cs`**: **M2: Karar Motoru** işlevselliğini sunar.
    -   `[HttpPost("analyze")]`: `/api/DecisionEngine/analyze` adresinde bir `POST` endpoint'i tanımlar. İstek gövdesinden bir `AnalysisRequest` alır, `_geminiService.AnalyzeRiskAsync` metodunu çağırır ve sonucu döndürür.

## 3. Mimari İlkeler ve Kararlar

-   **İnce Denetleyiciler (Thin Controllers):** Denetleyiciler "ince" tutulur. Görevleri, HTTP ile ilgili görevleri yerine getirmek ve uygulama katmanını çağırmaktır. İş mantığı içermezler.
-   **Bağımlılık Enjeksiyonu:** API katmanı, ihtiyaç duyduğu servisleri almak için büyük ölçüde DI'ye dayanır. Bu, gerçek servisler sahte implementasyonlarla değiştirilebildiği için denetleyicilerin test edilmesini kolaylaştırır.
-   **Yapılandırma Odaklı:** Tüm harici detaylar (URL'ler, anahtarlar, JWT ayarları) yapılandırma dosyalarından yüklenir, bu da uygulamanın kod değişikliği olmadan farklı ortamlarda dağıtılmasını sağlar.
-   **Öznitelik Tabanlı Yönlendirme ve Yetkilendirme:** ASP.NET Core'un öznitelikleri (`[Route]`, `[ApiController]`, `[HttpPost]`, `[Authorize]`) rotaları, davranışı ve güvenlik gereksinimlerini bildirimsel ve okunabilir bir şekilde tanımlamak için kullanılır.
