/**
 * Generate a professional black and white HTML report
 */
export function generateHTMLReport(state, formattedDate) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Survey Data Processing Report - ${state.fileName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      background: #ffffff;
      padding: 40px;
      color: #000000;
      line-height: 1.6;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
      background: white;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #000000;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 24pt;
      margin-bottom: 8px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .header p {
      font-size: 11pt;
      color: #333333;
    }
    .info-section {
      margin-bottom: 30px;
      border: 1px solid #000000;
      padding: 20px;
    }
    .info-section h2 {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 15px;
      text-transform: uppercase;
      border-bottom: 1px solid #000000;
      padding-bottom: 5px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      font-size: 11pt;
    }
    .info-item {
      padding: 8px 0;
      border-bottom: 1px dotted #cccccc;
    }
    .info-item strong {
      display: inline-block;
      width: 180px;
      font-weight: bold;
    }
    .section {
      margin-bottom: 40px;
    }
    .section h2 {
      font-size: 14pt;
      font-weight: bold;
      margin-bottom: 15px;
      text-transform: uppercase;
      border-bottom: 2px solid #000000;
      padding-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      font-size: 10pt;
      border: 2px solid #000000;
    }
    thead {
      background: #f5f5f5;
      border-bottom: 2px solid #000000;
    }
    th {
      padding: 12px 10px;
      text-align: left;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 9pt;
      border: 1px solid #000000;
    }
    td {
      padding: 10px;
      border: 1px solid #000000;
    }
    tbody tr:nth-child(even) {
      background-color: #fafafa;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 2px solid #000000;
      text-align: center;
      font-size: 9pt;
      color: #666666;
    }
    @media print {
      body {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Survey Data Processing Report</h1>
      <p>PrepCast-AI - Statistical Analysis System</p>
    </div>
    
    <div class="info-section">
      <h2>Report Information</h2>
      <div class="info-grid">
        <div class="info-item">
          <strong>File Name:</strong> ${state.fileName}
        </div>
        <div class="info-item">
          <strong>Processing Date:</strong> ${formattedDate}
        </div>
        <div class="info-item">
          <strong>Records Processed:</strong> ${state.processedData.length.toLocaleString()}
        </div>
        <div class="info-item">
          <strong>Variables Analyzed:</strong> ${Object.keys(state.statistics).length}
        </div>
        <div class="info-item">
          <strong>Detected Domain:</strong> ${state.detectedDomain.charAt(0).toUpperCase() + state.detectedDomain.slice(1)}
        </div>
        <div class="info-item">
          <strong>Confidence Level:</strong> 95%
        </div>
      </div>
    </div>

    <div class="section">
      <h2>Weighted Statistical Estimates</h2>
      <table>
        <thead>
          <tr>
            <th>Variable</th>
            <th>Weighted Mean</th>
            <th>Standard Error</th>
            <th>Margin of Error (±)</th>
            <th>Sample Size</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(state.statistics)
            .map(
                ([col, stats]) => `
          <tr>
            <td><strong>${col}</strong></td>
            <td>${stats.mean.toFixed(4)}</td>
            <td>${stats.standardError.toFixed(4)}</td>
            <td>±${stats.marginOfError.toFixed(4)}</td>
            <td>${stats.sampleSize.toLocaleString()}</td>
          </tr>
        `
            )
            .join("")}
        </tbody>
      </table>
    </div>

    ${state.forecastData
            ? `
    <div class="section">
      <h2>AI Forecast Results</h2>
      
      <div class="info-section">
        <h2>Forecast Metadata</h2>
        <div class="info-grid">
          <div class="info-item">
            <strong>Column:</strong> ${state.forecastData.column}
          </div>
          <div class="info-item">
            <strong>Method:</strong> ${state.forecastData.method}
          </div>
          <div class="info-item">
            <strong>Confidence:</strong> ${state.forecastData.confidence.toFixed(1)}%
          </div>
          <div class="info-item">
            <strong>Trend Strength:</strong> ${state.forecastData.trendStrength}%
          </div>
          <div class="info-item">
            <strong>Historical Data Points:</strong> ${state.forecastData.historicalDataPoints}
          </div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Future Step</th>
            <th>Predicted Value</th>
          </tr>
        </thead>
        <tbody>
          ${state.forecastData.predictions
                .map(
                    (value, index) => `
          <tr>
            <td><strong>Step ${index + 1}</strong></td>
            <td>${value.toFixed(4)}</td>
          </tr>
        `
                )
                .join("")}
        </tbody>
      </table>
    </div>
    `
            : ""
        }

    <div class="footer">
      <p><strong>Generated by PrepCast-AI</strong></p>
      <p>Survey Data Processing for Official Statistics</p>
      <p>${formattedDate}</p>
    </div>
  </div>
</body>
</html>`;
}
