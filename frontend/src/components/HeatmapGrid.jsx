import React from 'react'
import FileCard from './FileCard'

export default function HeatmapGrid({ files = [] }) {
  if (!files || files.length === 0) {
    return (
      <div className="text-center py-10 bg-card border border-border rounded-xl">
        <p className="text-textmuted">No file details found in the report.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {files.map((file, idx) => (
        <FileCard key={file.filename || idx} file={file} />
      ))}
    </div>
  )
}
