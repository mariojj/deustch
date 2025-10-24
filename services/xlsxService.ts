import { Word } from '../types';

// This script assumes the xlsx library is loaded from a CDN and available as `XLSX` global.
declare const XLSX: any;

export function parseXlsxFile(file: File): Promise<Word[]> {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error("No file provided."));
    }

    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        if (!event.target?.result) {
            return reject(new Error("Failed to read file."));
        }
        const data = new Uint8Array(event.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
            return reject(new Error("XLSX file contains no sheets."));
        }
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Remove header row and map to Word objects
        const words: Word[] = jsonData
          .slice(1)
          .map(row => {
            if (row && row.length >= 3) {
              const [german, spanish, audioUrl] = row.map(cell => String(cell || '').trim());
              const column4 = String(row[3] || '').trim();
              const timesFailed = parseInt(String(row[4] || '0'), 10) || 0;

              if (spanish && german && audioUrl) {
                return { spanish, german, audioUrl, column4, timesFailed };
              }
            }
            return null;
          })
          .filter((word): word is Word => word !== null);
        
        if (words.length === 0) {
            return reject(new Error("No valid data found in the XLSX file. Ensure it has at least 3 columns: German, Spanish, Audio URL."));
        }

        resolve(words);
      } catch (error) {
        console.error("Error parsing XLSX file:", error);
        reject(new Error("Could not parse the XLSX file. Please ensure it is a valid .xlsx file."));
      }
    };

    reader.onerror = () => {
      reject(new Error("There was an error reading the file."));
    };

    reader.readAsArrayBuffer(file);
  });
}