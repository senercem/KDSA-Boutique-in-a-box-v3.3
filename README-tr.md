# Koru Karar-Bilim Mimarisi (KDSA) v3.3

[![Koru Impact](https://img.shields.io/badge/Koru_Impact-Internal_Project-blueviolet)](https://koruimpact.org)
[![Lisans](https://img.shields.io/badge/Lisans-Proprietary-red)](LICENSE)
[![Durum](https://img.shields.io/badge/Durum-Aktif_Geliştirme-brightgreen)](https://github.com/koru-impact/KDSA)

---

## 🚀 Proje Hakkında

**KDSA (Koru Decision-Science Architecture)**, kurumsal karar alma süreçlerindeki sistemsel hataları gidermek, insani bilişsel önyargıları (cognitive bias) yönetmek ve AI yönetişimini (governance) sağlamak amacıyla geliştirilmiş, **"Headless" (Sunum Katmanı Olmayan)** bir **Component-as-a-Service (CaaS)** motorudur.

Bu proje, geleneksel bir "SaaS Ürünü" değildir. Bunun yerine, iş ortaklarının (örneğin, "Big Four" danışmanlık firmaları) kendi mevcut platformlarına kolayca entegre edebilecekleri, arka planda çalışan bir **"Engine-in-Accelerator" (Hızlandırıcı İçi Motor)** çözümü olarak tasarlanmıştır.

---

## 🎯 Çözülen Temel Problem: Karar Riski Üçlüsü (The Triad of Decision Risk)

KDSA, piyasada genellikle ayrı ayrı ele alınan, ancak aslında birbirini besleyen üç temel riski tek bir entegre döngüde çözer:

1.  **İnsan Faktörü Riski (M1):** Dijital dönüşüm projelerinin %70'inin başarısız olmasına yol açan kültürel direnç, değişim yorgunluğu ve psikolojik güvenlik eksikliği gibi insani dinamikler.
2.  **Bilişsel Önyargı Riski (M2):** Yöneticilerin, özellikle stres ve belirsizlik altında, analitik "Sistem 2" düşünme yerine içgüdüsel ve hataya açık "Sistem 1" düşünme modeline kayarak verdikleri hatalı kararlar (Örn: İyimserlik Önyargısı - Optimism Bias).
3.  **Algoritmik & Yönetişim Riski (M3):** **DORA** ve **EU AI Act** gibi yeni ve katı regülasyonlara uyumsuzluk riski ve denetlenemeyen, şeffaf olmayan AI/ML modellerinin yarattığı operasyonel ve yasal riskler.

---

## 🏗️ Mimari Yapı: "The Golden Thread"

Sistem, **"Sense (Algıla) -> Decide (Karar Ver) -> Govern (Yönet)"** adımlarından oluşan bir döngü üzerine kuruludur. Bu kesintisiz ve denetlenebilir veri akışına **"Golden Thread" (Altın İplik)** adı verilir. Veri bir uçtan girer, işlenir, zenginleştirilir ve tüm bu süreç değiştirilemez (immutable) bir şekilde loglanır.

### Modüller

-   **M1: ACORE (Sensing Layer):** Organizasyonel riskleri, kültürel dinamikleri ve insan faktörünü algılayan veri giriş ve analiz katmanıdır.
-   **M2: Decision Engine (Cognitive Circuit-Breaker):** Google Gemini gibi gelişmiş AI modellerini kullanarak kritik kararları analiz eder, "Pre-mortem" (olası başarısızlık senaryolarını öngörme) analizleri yapar ve bilişsel önyargıları tespit ederek karar vericiyi uyarır.
-   **M3: Project Alexandra (Governance Layer):** M1 ve M2 modüllerinden gelen tüm verileri, analizleri ve nihai kararları, DORA/EU AI Act gibi regülasyonlarla tam uyumlu, değiştirilemez bir **"Audit Log" (Denetim Kaydı)** üzerinde saklar.

---

## 💻 Teknik Yapı ve "Clean Architecture"

Proje, sürdürülebilirlik, esneklik ve entegrasyon kolaylığı sağlamak amacıyla **.NET 8.0** üzerinde, endüstri standardı olan **"Clean Architecture"** prensiplerine göre inşa edilmiştir.

### Backend (.NET 8.0)

-   **`KDSA.Domain`**: Projenin kalbi. Dış dünyadan tamamen bağımsız, saf iş kurallarını ve varlıkları (Entities) içerir.
-   **`KDSA.Application`**: İş akışlarını ve servis arayüzlerini (Interfaces) tanımlar. Sistemin "ne yapabildiğini" belirler.
-   **`KDSA.Infrastructure`**: Dış dünya ile entegrasyonu sağlar. Google Gemini AI, Baserow (veritabanı) gibi harici servislerin somut implementasyonlarını barındırır.
-   **`KDSA.API`**: İş ortaklarının entegre olacağı "Headless" REST API uçlarını (endpoints) sunar.

### Frontend (Partner Simülasyonu)

-   **React + TypeScript**: İş ortaklarının sistemini simüle eden veya son kullanıcıya sunulabilecek basit arayüzleri geliştirmek için kullanılan hafif bir katmandır.

### Operasyonel Altyapı

-   **Google Cloud Platform (GCP):** Projenin altyapı sağlayıcısıdır.
-   **Baserow (Self-Hosted):** Veri egemenliği ve tam kontrol sağlamak amacıyla GCP üzerinde kendi kendine barındırılan açık kaynaklı bir veritabanı platformudur.

---

## 🛠️ Kurulum ve Geliştirme (Getting Started)

### Ön Gereksinimler

-   [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
-   [Visual Studio 2022](https://visualstudio.microsoft.com/) veya [VS Code](https://code.visualstudio.com/)
-   **Google Gemini API Anahtarı**: `KDSA.Infrastructure` katmanında tanımlanmalıdır.
-   **Baserow API Token ve Tablo ID'si**: `KDSA.Infrastructure` katmanında tanımlanmalıdır.

### Nasıl Çalıştırılır?

1.  **Repoyu klonlayın:**
    ```bash
    git clone <repo-url>
    ```
2.  **API Anahtarlarını yapılandırın:**
    `KDSA.API/appsettings.json` dosyasını açın ve aşağıdaki alanları kendi bilgilerinizle güncelleyin:
    ```json
    "Gemini": {
      "ApiKey": "BURAYA_GEMINI_API_KEY_GIRIN",
      "BaseUrl": "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
    },
    "Baserow": {
      "BaseUrl": "https://baserow.koruimpact.org",
      "ApiToken": "BURAYA_BASEROW_API_TOKEN_GIRIN",
      "AuditLogTableId": "BURAYA_BASEROW_TABLO_ID_GIRIN"
    }
    ```
3.  **Backend'i çalıştırın:**
    Visual Studio veya `dotnet run` komutu ile `KDSA.API` projesini `https` profiliyle başlatın.
4.  **Frontend'i bağlayın (varsa):**
    Frontend uygulamasındaki (örneğin `geminiService.ts` dosyası) `BACKEND_URL` sabitini çalışan backend adresine (örn: `https://localhost:7162`) göre güncelleyin.

---

## 📜 Lisans ve Dokümantasyon

Bu proje **Koru Impact** mülkiyetindedir. Projenin detaylı stratejik vizyonu, mimari kararları ve kullanım senaryoları için lütfen `docs` klasöründeki dokümanlara ve özellikle **KDSA Playbook v3.3**'e başvurunuz.
