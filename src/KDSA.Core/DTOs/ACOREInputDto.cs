namespace KDSA.Core.DTOs
{
    public class ACOREInputDto
    {
        // Ekrandaki 4 temel veri girişi - Dilek'in modülünden geliyor.
        // İsimlerin Frontend ile (kdsaM1Service.ts içindeki payload ile) aynı olması önemli.

        public double PsychologicalSafety { get; set; } // Örn: 25
        public double ChangeFatigue { get; set; }       // Örn: 82
        public double RoleClarity { get; set; }         // Örn: 24
        public double LeadershipTrust { get; set; }     // Örn: 26
    }
}