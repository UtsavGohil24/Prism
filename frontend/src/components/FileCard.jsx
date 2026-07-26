import React, { useState } from 'react'
import RiskBadge from './RiskBadge'

export default function FileCard({ file }) {
  const [isOpen, setIsOpen] = useState(false)
  const hasBugs = file.bugs && file.bugs.length > 0
  const hasSuggestions = file.suggestions && file.suggestions.length > 0

  return (
    <div className="glass-panel rounded-xl overflow-hidden shadow-sm transition-all hover:border-primary-container/40">
      {/* Header (Toggle area) */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex cursor-pointer items-start justify-between p-5 select-none hover:bg-surface-light/20 transition-colors"
      >
        <div className="flex flex-col gap-1.5 max-w-[70%]">
          <div className="flex items-center gap-2 text-on-surface">
            <span className="material-symbols-outlined text-primary text-lg">description</span>
            <span className="font-mono text-sm font-semibold truncate" title={file.filename}>
              {file.filename}
            </span>
          </div>
          <span className="text-xs text-on-surface-variant font-medium">
            {file.lines_changed} lines changed
          </span>
          {/* Two rows showing real bugs.length and suggestions.length counts */}
          <div className="mt-2 space-y-1 text-xs text-on-surface-variant">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${hasBugs ? 'bg-error' : 'bg-outline-variant'}`} />
              <span>Bugs: {file.bugs ? file.bugs.length : 0}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${hasSuggestions ? 'bg-primary' : 'bg-outline-variant'}`} />
              <span>Suggestions: {file.suggestions ? file.suggestions.length : 0}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <RiskBadge level={file.risk_level} />
          <svg
            className={`h-5 w-5 text-on-surface-variant transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Collapsible Content */}
      <div className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px] border-t border-outline-variant/30 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
        <div className="p-5 space-y-4 bg-surface-lowest/40">
          {/* Bugs List */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider tech-mono text-on-surface-variant mb-2">
              Potential Bugs & Issues
            </h4>
            {hasBugs ? (
              <ul className="space-y-2">
                {file.bugs.map((bug, i) => {
                  const isObj = typeof bug === 'object' && bug !== null;
                  const desc = isObj ? bug.description : bug;
                  const sev = isObj ? bug.severity : null;
                  const lineRef = isObj ? bug.line_reference : null;

                  let sevColor = 'text-error';
                  let sevBg = 'bg-error/10 border-error/20';
                  
                  if (sev === 'moderate') {
                    sevColor = 'text-warning'; // assuming text-warning exists, else we can fall back to generic warning styles
                    sevBg = 'bg-yellow-500/10 border-yellow-500/20'; // Using tailwind primitives if semantic ones missing
                  } else if (sev === 'minor') {
                    sevColor = 'text-blue-400';
                    sevBg = 'bg-blue-500/10 border-blue-500/20';
                  }

                  // Default text-error/bg-error handles 'critical' or unknown/string cases

                  return (
                    <li 
                      key={i} 
                      className={`flex items-start gap-2.5 rounded-lg border ${sevBg} p-3 text-sm ${sevColor}`}
                    >
                      <span className={`material-symbols-outlined shrink-0 mt-0.5 text-lg ${sevColor}`}>bug_report</span>
                      <div className="flex flex-col gap-1">
                        <span>{desc}</span>
                        {(sev || lineRef) && (
                          <div className="flex items-center gap-2 text-[11px] font-medium opacity-80 uppercase tracking-wider tech-mono">
                            {sev && <span>{sev}</span>}
                            {sev && lineRef && <span>•</span>}
                            {lineRef && <span>{lineRef}</span>}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-on-surface-variant/60 italic pl-1">No bugs detected in this file.</p>
            )}
          </div>

          {/* Suggestions List */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-wider tech-mono text-on-surface-variant mb-2">
              AI Optimization Suggestions
            </h4>
            {hasSuggestions ? (
              <ul className="space-y-2">
                {file.suggestions.map((suggestion, i) => {
                  const isObj = typeof suggestion === 'object' && suggestion !== null;
                  // Handle potential object fields if suggestions are structured
                  const desc = isObj ? (suggestion.description || suggestion.text || suggestion.suggestion || JSON.stringify(suggestion)) : suggestion;

                  return (
                    <li 
                      key={i} 
                      className="flex items-start gap-2.5 rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-primary"
                    >
                      <span className="material-symbols-outlined shrink-0 text-primary mt-0.5 text-lg">lightbulb</span>
                      <span>{desc}</span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-on-surface-variant/60 italic pl-1">No suggestions available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
