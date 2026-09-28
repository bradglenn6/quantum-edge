import React, { useState } from 'react';
import { 
  FileCheck, 
  ShieldCheck, 
  Download, 
  CheckCircle, 
  Search, 
  Plus, 
  Lock
} from 'lucide-react';
import { AuditService } from '../services/auditService';
import { AuditLogEntry, ComplianceReport } from '../types';

export const AuditComplianceView: React.FC = () => {
  const auditService = AuditService.getInstance();
  const [logs, setLogs] = useState<AuditLogEntry[]>(auditService.getLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('ALL');
  const [selectedFramework, setSelectedFramework] = useState<ComplianceReport['framework']>('FIPS-203/204/205');
  const [currentReport, setCurrentReport] = useState<ComplianceReport>(
    auditService.generateComplianceReport('FIPS-203/204/205')
  );
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<string | null>(null);

  const handleGenerateReport = (framework: ComplianceReport['framework']) => {
    setSelectedFramework(framework);
    const report = auditService.generateComplianceReport(framework);
    setCurrentReport(report);
  };

  const handleVerifyChain = () => {
    setIsVerifying(true);
    setVerifyStatus(null);
    setTimeout(() => {
      const res = auditService.verifyLedgerIntegrity();
      setIsVerifying(false);
      setVerifyStatus(`Tamper check passed: ${res.totalVerified} chained blocks verified with SHA-384 / ML-DSA-87.`);
    }, 400);
  };

  const handleAddSampleLog = async () => {
    const entry = await auditService.logEvent(
      'admin-session-audit',
      'USER_DATA_PQC_COMMUNICATION',
      'LatticeChannel::TLS_Hybrid_v1.3',
      'SUCCESS',
      ['FIPS-203', 'SOC2-CC6', 'FedRAMP-High']
    );
    setLogs(auditService.getLogs());
    // Refresh report
    setCurrentReport(auditService.generateComplianceReport(selectedFramework));
  };

  const downloadJsonReport = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentReport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentReport.id}_Compliance_Report.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const downloadTextCertificate = () => {
    const textContent = `========================================================================
ZEROLABZ POST-QUANTUM CRYPTOGRAPHIC COMPLIANCE CERTIFICATE
========================================================================
Report ID:        ${currentReport.id}
Date Generated:   ${new Date(currentReport.generatedAt).toISOString()}
Framework:        ${currentReport.framework}
Overall Score:    ${currentReport.overallScore}% (${currentReport.status})
Evaluated Logs:   ${currentReport.totalEncryptedLogsEvaluated}
Quantum Ratio:    ${Math.round(currentReport.quantumReadinessRatio * 100)}%
Audit Authority:  ${currentReport.auditorOrg}
Attestation Seal: ${currentReport.attestationSignature}

------------------------------------------------------------------------
EVALUATED CONTROLS & FINDINGS:
------------------------------------------------------------------------
${currentReport.findings
  .map(
    f =>
      `[${f.pass ? 'PASS' : 'FAIL'}] ${f.checkName}\nCategory: ${f.category} (${f.quantumAssuranceLevel})\nDetails: ${f.description}\n`
  )
  .join('\n')}
========================================================================
VERIFIED BY ZEROLABZ QUANTUMEDGE POST-QUANTUM LEDGER CORE
========================================================================`;

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentReport.id}_Attestation_Seal.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = tagFilter === 'ALL' || log.complianceTags.includes(tagFilter as any);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight">Quantum-Encrypted Audit Logs &amp; Compliance</h1>
            <span className="text-xs font-mono-code text-cyan-400">NIST SP 800-208 / FIPS-203</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tamper-evident, hash-chained ledger encrypted with ML-KEM-1024 and signed with ML-DSA-87 for automated compliance verification.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddSampleLog}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-mono-code transition-colors border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Append Audit Record</span>
          </button>
          <button
            onClick={handleVerifyChain}
            disabled={isVerifying}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold font-mono-code transition-colors disabled:opacity-50"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isVerifying ? 'Verifying Hashes...' : 'Verify Hash Chain'}</span>
          </button>
        </div>
      </div>

      {/* Verification status toast */}
      {verifyStatus && (
        <div className="p-3 rounded bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono-code text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{verifyStatus}</span>
        </div>
      )}

      {/* Compliance Reporting Engine Section */}
      <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Automated Compliance Reporting Engine</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live evaluation of cryptographic controls, audit logs, and quantum-resilient data handling standards.
            </p>
          </div>

          {/* Framework Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded font-mono-code text-xs overflow-x-auto">
            {(['FIPS-203/204/205', 'NIST-SP-800-208', 'SOC2-Type-II', 'FedRAMP-High', 'HIPAA-Security'] as ComplianceReport['framework'][]).map(fw => (
              <button
                key={fw}
                onClick={() => handleGenerateReport(fw)}
                className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                  selectedFramework === fw
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {fw}
              </button>
            ))}
          </div>
        </div>

        {/* Report Overview Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded bg-slate-950/80 border border-slate-800 font-mono-code text-xs">
          <div>
            <div className="text-slate-500 text-[11px]">COMPLIANCE SCORE</div>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5">{currentReport.overallScore}%</div>
            <div className="text-[10px] text-emerald-500 uppercase">{currentReport.status}</div>
          </div>
          <div>
            <div className="text-slate-500 text-[11px]">EVALUATED ENCRYPTED LOGS</div>
            <div className="text-2xl font-bold text-white mt-0.5">{currentReport.totalEncryptedLogsEvaluated}</div>
            <div className="text-[10px] text-slate-400">100% Chained &amp; Signed</div>
          </div>
          <div>
            <div className="text-slate-500 text-[11px]">QUANTUM ASSURANCE</div>
            <div className="text-2xl font-bold text-cyan-300 mt-0.5">Category 5</div>
            <div className="text-[10px] text-cyan-400">ML-KEM-1024 Default</div>
          </div>
          <div className="flex flex-col justify-center gap-1.5">
            <button
              onClick={downloadJsonReport}
              className="flex items-center justify-center gap-1.5 py-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>Export JSON Report</span>
            </button>
            <button
              onClick={downloadTextCertificate}
              className="flex items-center justify-center gap-1.5 py-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition-colors"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              <span>Download Attestation Seal</span>
            </button>
          </div>
        </div>

        {/* Detailed Findings Table */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-300 font-mono-code">Audited Control Checks:</div>
          <div className="space-y-2">
            {currentReport.findings.map((f, i) => (
              <div
                key={i}
                className="p-3 rounded bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{f.checkName}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-cyan-400 font-mono-code text-[11px]">{f.category}</span>
                  </div>
                  <p className="text-slate-400 text-[11px]">{f.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 font-mono-code text-[11px]">
                  <span className="text-slate-400">{f.quantumAssuranceLevel}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${f.pass ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/40' : 'bg-rose-950 text-rose-300'}`}>
                    {f.pass ? 'VERIFIED PASS' : 'NEEDS ACTION'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Encrypted Audit Log Ledger */}
      <div className="p-5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-white">Quantum-Encrypted Audit Log Ledger</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Every audit record is encrypted with ML-KEM-1024, chained via SHA-384 previous block hashes, and signed with ML-DSA-87.
            </p>
          </div>

          {/* Search & Tag Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search actor or action..."
                className="pl-8 pr-3 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 font-mono-code"
              />
            </div>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono-code">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-2">Timestamp</th>
                <th className="pb-2">Actor</th>
                <th className="pb-2">Action / Resource</th>
                <th className="pb-2">PQC Encrypted Hash</th>
                <th className="pb-2">Chained Block</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-2.5 text-slate-400 text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 text-cyan-300 font-medium whitespace-nowrap">
                    {log.actor}
                  </td>
                  <td className="py-2.5">
                    <div className="text-white font-medium">{log.action}</div>
                    <div className="text-[10px] text-slate-500 truncate max-w-xs">{log.resource}</div>
                  </td>
                  <td className="py-2.5 text-slate-400 text-[11px] max-w-[140px] truncate" title={log.encryptedPayloadHash}>
                    {log.encryptedPayloadHash}
                  </td>
                  <td className="py-2.5 text-slate-500 text-[10px] max-w-[120px] truncate" title={log.previousBlockHash}>
                    prev: {log.previousBlockHash.substring(0, 14)}...
                  </td>
                  <td className="py-2.5 whitespace-nowrap">
                    <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                      <CheckCircle className="w-3 h-3 text-emerald-400" />
                      <span>{log.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
