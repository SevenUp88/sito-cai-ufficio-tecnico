function processScontisticaRow(row, rowIndex) {
  const L = Logger.log;
  const sheetNameForLog = SHEET_NAMES.discounts;

  const idFromSheet = getSheetValue(row, 'id', rowIndex, sheetNameForLog, 'string');
  if (!idFromSheet) { return null; }
  
  const categoria = getSheetValue(row, 'categoria', rowIndex, sheetNameForLog, 'string');
  const marca = getSheetValue(row, 'marca', rowIndex, sheetNameForLog, 'string');
  if (!categoria || !marca) { return null; }
  
  const discountData = {
    id: idFromSheet,
    categoria: categoria,
    marca: marca,
    sconto_in_acquisto: getSheetValue(row, 'sconto_in_acquisto', rowIndex, sheetNameForLog, 'string'),
    trasporto: getSheetValue(row, 'trasporto', rowIndex, sheetNameForLog, 'number'),
    sconto_in_vendita: getSheetValue(row, 'sconto_in_vendita', rowIndex, sheetNameForLog, 'string'), // CORRETTO
    agenzia: getSheetValue(row, 'agenzia', rowIndex, sheetNameForLog, 'string'),
    assistenza_cesena: getSheetValue(row, 'assistenza_cesena', rowIndex, sheetNameForLog, 'string'),
    assistenza_savignano: getSheetValue(row, 'assistenza_savignano', rowIndex, sheetNameForLog, 'string'),
    assistenza_rimini: getSheetValue(row, 'assistenza_rimini', rowIndex, sheetNameForLog, 'string'),
  };
  
  Object.keys(discountData).forEach(key => { if (discountData[key] === null) delete discountData[key]; });
  return { docId: idFromSheet, data: discountData };
}
