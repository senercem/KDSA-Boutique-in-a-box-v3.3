using System.Text.Json.Serialization;

namespace KDSA.Application.DTOs
{
    public class CompanyDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; } // Baserow'un kendi sıra numarası
       
        [JsonPropertyName("Company_ID")]
        public string? Company_ID { get; set; } // Bizim üreteceğimiz GUID

        [JsonPropertyName("Company_Name")]
        public string Company_Name { get; set; }

        [JsonPropertyName("Contact_Email")]
        public string? Contact_Email { get; set; }

        [JsonPropertyName("Created_Date")]
        public string? Created_Date { get; set; }
    }
}