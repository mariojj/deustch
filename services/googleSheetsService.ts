import { Word } from '../types';

function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

export async function fetchAndParseSheet(url: string): Promise<Word[]> {
  const sheetId = extractSheetId(url);
  if (!sheetId) {
    throw new Error('Invalid Google Sheet URL. Could not find the Sheet ID.');
  }

  // Construct the CSV export URL
  const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;

  try {
    const response = await fetch(csvUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet. Status: ${response.status}. Make sure it's published to the web.`);
    }
    const csvText = await response.text();
    const rows = csvText.split('\n').slice(1); // Split by newline and remove header

    return rows
      .map(row => {
        // CSV parsing: split by comma, but handle quoted strings
        const columns = (row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [])
          .map(field => field.trim().replace(/^"|"$/g, '').trim());
        
        if (columns.length >= 3) {
          const [german, spanish, audioUrl] = columns;
          const column4 = columns[3] || '';
          const timesFailed = parseInt(columns[4], 10) || 0;

          if (spanish && german && audioUrl) {
            return {
              spanish,
              german,
              audioUrl,
              column4,
              timesFailed
            };
          }
        }
        return null;
      })
      .filter((word): word is Word => word !== null);
  } catch (error) {
    console.error('Error fetching or parsing Google Sheet:', error);
    throw new Error('Could not load or parse the Google Sheet. Please check the URL and sharing settings.');
  }
}