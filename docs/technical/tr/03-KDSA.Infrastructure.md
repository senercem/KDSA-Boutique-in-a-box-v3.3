# Katman 3: KDSA.Infrastructure

## 1. Genel Bakış

`KDSA.Infrastructure` katmanı, uygulamanın dış dünyaya bağlandığı yerdir. `KDSA.Application` katmanında tanımlanan arayüzlerin somut implementasyonlarını içerir. Teknolojilerin seçildiği ve uygulandığı katman burasıdır; örneğin hangi veritabanının kullanılacağı, hangi AI modelinin çağrılacağı ve harici servislere nasıl bağlanılacağı gibi kararlar burada hayata geçirilir.

**Sorumlulukları:**
-   `Application` katmanından gelen arayüzleri (`IGeminiService`, `IAlexandraService`, `IBaserowClient`) implemente etmek.
-   Harici sistemlerle (veritabanları, üçüncü parti API'lar, dosya sistemleri vb.) tüm iletişimi yönetmek.
-   Saf iş mantığını dış dünyaya bağlayan "yapıştırıcı" kodu içermek.
-   Harici servislere erişmek için gereken yapılandırma detaylarını (API anahtarları, bağlantı dizeleri) yönetmek.

## 2. Proje Yapısı ve Dosyalar

```
/src/KDSA.Infrastructure/
├── KDSA.Infrastructure.csproj
└── Services/
    ├── AlexandraService.cs
    ├── BaserowClient.cs
    └── GeminiService.cs
```

### 2.1. `KDSA.Infrastructure.csproj`
Bu proje dosyası, hem `KDSA.Application` (uygulaması gereken arayüzlere erişmek için) hem de `KDSA.Domain` (iş varlıklarıyla çalışmak için) projelerine referans verir. Ayrıca, JSON serileştirme için `Newtonsoft.Json` ve `appsettings.json`'dan yapılandırma değerlerini okumak için `Microsoft.Extensions.Configuration` gibi harici kütüphane bağımlılıklarını da içerir.

### 2.2. `Services/`
Bu klasör, uygulamanın arayüzlerini implemente eden somut sınıfları içerir.

-   **`AlexandraService.cs`**: `IAlexandraService` arayüzünü implemente eder.
    -   **Mevcut Durum (MVP):** Şu anki versiyonda bu servis, verileri saklamak için bellek içi sözlükler ve listeler (`_systemContexts`, `_metrics`) kullanır. Bu, kalıcı bir veritabanı olmadan geliştirme ve test yapmayı sağlayan geçici bir çözümdür.
    -   **Gelecek Durum:** Bu servis, verilerin uygulama yeniden başlatıldığında kaybolmamasını sağlamak için verileri Baserow veritabanı gibi kalıcı bir veri deposunda saklayacak ve oradan alacak şekilde güncellenecektir.
    -   `GenerateComplianceArtifactAsync`: Bu metot şu anda `ComplianceArtifact` yapısına uyan, sabit kodlanmış ("mock") veriler döndürmektedir. Bu, gerçek bir rapor oluşturma sürecini simüle eder.

-   **`BaserowClient.cs`**: `IBaserowClient` arayüzünü implemente eder.
    -   Bu sınıf, kendi kendine barındırılan Baserow örneğine REST API çağrıları yapmak için `HttpClient` kullanır.
    -   Baserow URL'ini, API Token'ını ve Tablo ID'sini `IConfiguration` aracılığıyla yapılandırma dosyasından (`appsettings.json`) okur. Bu, hassas bilgilerin kodda sabit olarak yazılmamasını sağlayan bir en iyi uygulamadır.
    -   `LogDecisionAsync`: Bu metot, `AuditLogEntry` nesnesini Baserow API'sinin beklediği JSON formatına serileştirir ve bir HTTP POST isteği ile gönderir. Bağlantı veya API yanıtıyla ilgili herhangi bir sorunu loglamak için hata yönetimi içerir.

-   **`GeminiService.cs`**: `IGeminiService` arayüzünü implemente eder.
    -   Bu sınıf da Google Gemini API'sine bağlanmak için `HttpClient` kullanır.
    -   Gemini API anahtarını ve temel URL'yi yapılandırmadan alır.
    -   `AnalyzeRiskAsync`: Bu metot, Gemini API'sinin gerektirdiği JSON yükünü oluşturur, isteği gönderir ve ardından yanıtı ayrıştırarak sadece üretilen metin içeriğini çıkarır. Bu, harici API çağrısının karmaşıklığını kapsüller.

## 3. Mimari İlkeler ve Kararlar

-   **Değişken Katman:** Bu katman en "değişken" veya değişmesi en muhtemel olan katmandır. Bu mantığı izole ederek, `Application` veya `Domain` katmanlarına dokunmadan veritabanlarını (Baserow'dan PostgreSQL'e) veya AI sağlayıcılarını değiştirebiliriz.
-   **Bağımlılık Enjeksiyonu (Dependency Injection):** Bu katmandaki servisler, bir bağımlılık enjeksiyonu kabı (container) ile kaydedilmek üzere tasarlanmıştır. `API` katmanı bir `IGeminiService` istediğinde, container bir `GeminiService` örneği sağlayacaktır. Bu, katmanları çalışma zamanında birbirinden ayırır.
-   **Yapılandırma Yönetimi:** Tüm sırlar ve ortama özgü ayarlar, `appsettings.json`'dan okuyan `IConfiguration` aracılığıyla yönetilir. Bu, kodun temiz ve güvenli kalmasını sağlar.
