import React, { useState } from 'react';
import { Sheet } from '../../components/ui/Sheet';
import { useProjectStore } from '../../state/projectStore';
import { Copy, Download, Check } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

export const ProjectMapSheet: React.FC = () => {
  const { activeSheet, setActiveSheet, project } = useProjectStore();
  const { showToast } = useToast();
  const [copied, setCopied] = useState(false);

  const isOpen = activeSheet === 'map';
  const onClose = () => setActiveSheet(null);

  const jsonString = JSON.stringify(project, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      showToast({ type: 'success', text: 'JSON timing map copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast({ type: 'error', text: 'Could not copy to clipboard' });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.id || 'project'}.metre.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ type: 'success', text: `Downloaded ${project.id}.metre.json` });
  };

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title="Saved Timing Map"
      subtitle="Complete portable timeline and tempo schema (.metre.json)"
      width="max-w-xl"
    >
      <div className="flex flex-col gap-3">
        {/* Actions bar */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-sunken hover:bg-surface border border-border text-xs font-ui font-medium text-ink transition-all active:scale-98 shadow-1"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-success" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? 'Copied' : 'Copy JSON'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-white text-xs font-ui font-medium hover:bg-primary-hover transition-all active:scale-98 shadow-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .metre.json</span>
          </button>
        </div>

        {/* Code display */}
        <div className="relative rounded-md border border-border bg-[#1E2321] text-[#EBE7DF] p-4 overflow-x-auto text-[11px] font-mono leading-relaxed max-h-[60vh]">
          <pre>{jsonString}</pre>
        </div>
      </div>
    </Sheet>
  );
};
