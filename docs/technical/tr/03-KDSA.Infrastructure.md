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
    ├── ACOREService.cs
    ├── AlexandraService.cs
    ├── AuthService.cs
    ├── BaserowClient.cs
    └── GeminiService.cs
```

### 2.1. `KDSA.Infrastructure.csproj`
Bu proje dosyası, hem `KDSA.Application` (uygulaması gereken arayüzlere erişmek için) hem de `KDSA.Domain` (iş varlıklarıyla çalışmak için) projelerine referans verir. Ayrıca, JSON serileştirme için `Newtonsoft.Json`, yapılandırma değerlerini okumak için `Microsoft.Extensions.Configuration`, şifre hashleme için `BCrypt.Net-Next` ve JWT token oluşturma için `System.IdentityModel.Tokens.Jwt` gibi harici kütüphane bağımlılıklarını da içerir.

### 2.2. `Services/`
Bu klasör, uygulamanın arayüzlerini implemente eden somut sınıfları içerir.

-   **`ACOREService.cs`**: `IACOREService` arayüzünü implemente eder. `ACOREInputData`'ya dayanarak `ACORERiskProfile`'ı hesaplamak ve saklamak için basit bir bellek içi implementasyon sunar.

-   **`AlexandraService.cs`**: `IAlexandraService` arayüzünü implemente eder.
    -   **Entegrasyon:** Bu servis artık en son risk skorunu çekmek için `IACOREService` ile ve tam `AuditLogEntry`'yi veritabanına kaydetmek için `IBaserowClient` ile entegre çalışır.
    -   `GenerateComplianceArtifactAsync`: Bu metot, M1 ve M2'den gelen verileri içeren tam bir `ComplianceArtifact` oluşturur ve tüm işlemi Baserow'a kaydederek kalıcı bir denetim izi oluşturur.

-   **`AuthService.cs`**: `IAuthService` arayüzünü implemente eder.
    -   Bu servis, tüm kullanıcı kimlik doğrulama ve yönetim mantığını ele alır.
    -   Kullanıcı verilerini özel bir `Users` tablosundan saklamak ve almak için Baserow API'sine bağlanır.
    -   Şifreleri hashlemek ve doğrulamak için `BCrypt.Net-Next` kullanır.
    -   Kimliği doğrulanmış kullanıcılar için kullanıcı adı, e-posta ve rol içeren claim'lere sahip JWT token'ları oluşturur.

-   **`BaserowClient.cs`**: `IBaserowClient` arayüzünü implemente eder.
    -   Bu sınıf, kendi kendine barındırılan Baserow örneğine REST API çağrıları yapmak için `HttpClient` kullanır.
    -   Baserow URL'ini, API Token'ını ve Tablo ID'lerini yapılandırmadan (`appsettings.json`) okur.
    -   `LogDecisionAsync`: `AuditLogEntry` nesnesini serileştirir ve Baserow'daki `KDSA_Audit_Log` tablosuna gönderir.
    -   `GetAuditLogsAsync`: `KDSA_Audit_Log` tablosundaki tüm girişleri alır.

-   **`GeminiService.cs`**: `IGeminiService` arayüzünü implemente eder.
    -   Bu sınıf da Google Gemini API'sine bağlanmak için `HttpClient` kullanır.
    -   Gemini API anahtarını ve temel URL'yi yapılandırmadan alır.
    -   `AnalyzeRiskAsync`: Bu metot, Gemini API'sinin gerektirdiği JSON yükünü oluşturur, isteği gönderir ve ardından yanıtı ayrıştırarak sadece üretilen metin içeriğini çıkarır. Bu, harici API çağrısının karmaşıklığını kapsüller.

## 3. Mimari İlkeler ve Kararlar

-   **Değişken Katman:** Bu katman en "değişken" veya değişmesi en muhtemel olan katmandır. Bu mantığı izole ederek, `Application` veya `Domain` katmanlarına dokunmadan veritabanlarını (Baserow'dan PostgreSQL'e) veya AI sağlayıcılarını değiştirebiliriz.
-   **Bağımlılık Enjeksiyonu (Dependency Injection):** Bu katmandaki servisler, bir bağımlılık enjeksiyonu kabı (container) ile kaydedilmek üzere tasarlanmıştır. `API` katmanı bir `IGeminiService` istediğinde, container bir `GeminiService` örneği sağlayacaktır. Bu, katmanları çalışma zamanında birbirinden ayırır.
-   **Yapılandırma Yönetimi:** Tüm sırlar ve ortama özgü ayarlar, `appsettings.json`'dan okuyan `IConfiguration` aracılığıyla yönetilir. Bu, kodun temiz ve güvenli kalmasını sağlar.
