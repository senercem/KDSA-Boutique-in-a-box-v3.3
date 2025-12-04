using System;
using System.Collections.Generic;

namespace KDSA.Domain.Entities
{
    // PROTOKOL BÖLÜM 2.1: Input Structure (AI System Context)
    public class AISystemContext
    {
        public string SystemId { get; set; } // Mandatory - GOVERN 2.2
        public string SystemName { get; set; } // Mandatory
        public string IntendedUse { get; set; } // Mandatory - MAP 1.1
        public string ForeseeableMisuse { get; set; } // Mandatory - MAP 2.1
        public string DeploymentEnvironment { get; set; } // Cloud, On-Premise etc.
        public List<DataSourceInfo> DataSources { get; set; } = new(); // MAP 3.1
        public string OwnerId { get; set; } // Mandatory - GOVERN 2.1
        public string RiskClassification { get; set; } // High-Risk, Limited-Risk etc.
    }

    public class DataSourceInfo
    {
        public string Type { get; set; } // Structured/Unstructured
        public string Volume { get; set; }
        public bool ContainsPII { get; set; }
    }

    // PROTOKOL BÖLÜM 2.2: Input Structure (Model Performance Data)
    public class ModelMetric
    {
        public DateTime Timestamp { get; set; } // MEASURE 3.1
        public string MetricName { get; set; } // Accuracy, F1-Score etc.
        public double MetricValue { get; set; }
        public string ThresholdStatus { get; set; } // OK, Warning, Violation
        public string SegmentAnalyzed { get; set; } // e.g. "Gender: Female"
        public string SystemId { get; set; } // Hangi sisteme ait olduğu
    }

    // PROTOKOL BÖLÜM 3.1: Output Structure (Compliance Artifact)
    public class ComplianceArtifact
    {
        public string ArtifactId { get; set; } = Guid.NewGuid().ToString();
        public DateTime GenerationDate { get; set; } = DateTime.UtcNow;
        public double OverallRiskScore { get; set; }
        public string IncidentResponseStatus { get; set; }
        public string AuditLogLink { get; set; } // URL to full logs

        public List<RiskControl> RiskSummary { get; set; } = new();
        public List<string> RegulatoryComplianceGaps { get; set; } = new();
    }

    public class RiskControl
    {
        public string RiskCategory { get; set; } // Fairness, Security
        public string ControlImplemented { get; set; }
        public string ControlStatus { get; set; } // Implemented, Pending
    }
}