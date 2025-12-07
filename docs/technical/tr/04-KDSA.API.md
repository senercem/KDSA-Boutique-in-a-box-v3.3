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
    ├── ComplianceController.cs
    └── DecisionEngineController.cs
```

### 2.1. `KDSA.API.csproj`
Bu dosya, projeyi bir web uygulaması (`Microsoft.NET.Sdk.Web`) olarak tanımlar. Uygulama akışını yönetebilmesi için `KDSA.Application` ve `KDSA.Infrastructure` projelerine referanslar içerir. Ayrıca, Swagger/OpenAPI dokümantasyonu için `Microsoft.AspNetCore.OpenApi` gibi web'e özgü bağımlılıkları da içerir.

### 2.2. `Program.cs`
Bu, uygulamanın ana giriş noktasıdır. Modern .NET'te bu dosya şunlardan sorumludur:
-   Web uygulaması oluşturucusunu (builder) yaratmak.
-   **Bağımlılık Enjeksiyonu (DI) Yapılandırması:** Tüm servisleri kaydetmek. `builder.Services.AddScoped<IGeminiService, GeminiService>();` satırı, bir sınıf `IGeminiService` istediğinde bir `GeminiService` örneği alması gerektiğini uygulamaya bildirir. Katmanlar çalışma zamanında bu şekilde birbirine bağlanır.
-   **Middleware Pipeline Yapılandırması:** HTTP istek hattını kurmak (örneğin, HTTPS yönlendirmesini, geliştirme zamanı Swagger UI'ını etkinleştirmek).
-   Web uygulamasını başlatmak.

### 2.3. `appsettings.json` / `appsettings.Development.json`
Bunlar yapılandırma dosyalarıdır.
-   `appsettings.json`: Varsayılan ve üretim ayarlarını içerir. Gemini ve Baserow için API anahtarları ve temel URL'lerin saklandığı yerdir. **Önemli:** Gerçek sırlar, kaynak kontrolüne gönderilmemeli, güvenli bir sır yöneticisi aracılığıyla yönetilmelidir.
-   `appsettings.Development.json`: Uygulama "Development" ortamında çalıştırıldığında temel dosyayı geçersiz kılan ayarları içerir.

### 2.4. `Properties/launchSettings.json`
Bu dosya, uygulamayı Visual Studio'dan veya `dotnet` CLI'dan başlatmak için profiller içerir ve ortam değişkenlerini ve kullanılacak URL'leri (örneğin, `http://localhost:5116`) belirtir.

### 2.5. `Controllers/`
Bu klasör, API endpoint'lerini tanımlayan sınıflar olan API denetleyicilerini (controllers) içerir.

-   **`DecisionEngineController.cs`**: **M2: Karar Motoru** işlevselliğini sunar.
    -   `[Route("api/[controller]")]`: Bu denetleyicinin temel URL'sini `/api/DecisionEngine` olarak ayarlar.
    -   Yapıcısı aracılığıyla bir `IGeminiService` alır (constructor injection).
    -   `[HttpPost("analyze")]`: `/api/DecisionEngine/analyze` adresinde bir `POST` endpoint'i tanımlar. İstek gövdesinden bir `AnalysisRequest` alır, `_geminiService.AnalyzeRiskAsync` metodunu çağırır ve sonucu bir JSON nesnesi olarak döndürür.

-   **`ComplianceController.cs`**: **M3: Project Alexandra** işlevselliğini sunar.
    -   `[Route("api/v1/[controller]")]`: Temel URL'yi `/api/v1/Compliance` olarak ayarlayarak API sürümlemesini gösterir.
    -   Yapıcısı aracılığıyla bir `IAlexandraService` alır.
    -   Temel yönetişim fonksiyonlarını iş ortaklarına sunmak için `IAlexandraService` arayüzündeki metotlarla doğrudan eşleşen üç endpoint (`POST /context`, `POST /metrics`, `GET /artifact/{systemId}`) tanımlar.

## 3. Mimari İlkeler ve Kararlar

-   **İnce Denetleyiciler (Thin Controllers):** Denetleyiciler "ince" tutulur. Görevleri, HTTP ile ilgili görevleri yerine getirmek ve uygulama katmanını çağırmaktır. İş mantığı içermezler.
-   **Bağımlılık Enjeksiyonu:** API katmanı, ihtiyaç duyduğu servisleri almak için büyük ölçüde DI'ye dayanır. Bu, gerçek servisler sahte implementasyonlarla değiştirilebildiği için denetleyicilerin test edilmesini kolaylaştırır.
-   **Yapılandırma Odaklı:** Tüm harici detaylar (URL'ler, anahtarlar) yapılandırma dosyalarından yüklenir, bu da uygulamanın kod değişikliği olmadan farklı ortamlarda dağıtılmasını sağlar.
