import { Transaction, Liability, MarketRates } from '../types';
import { ASSET_LABELS, ASSET_UNITS } from '../constants';

const downloadFile = (content: string, fileName: string) => {
  // Add BOM for Excel UTF-8 compatibility
  const bom = '\uFEFF';
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const escapeCsvField = (field: any): string => {
  if (field === null || field === undefined) return '';
  const stringField = String(field);
  // If contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
    return `"${stringField.replace(/"/g, '""')}"`;
  }
  return stringField;
};

export const exportTransactionsToCSV = (transactions: Transaction[]) => {
  const headers = ['Date', 'Type', 'Asset', 'Amount', 'Unit', 'Price_Per_Unit_EGP', 'Total_Value_EGP', 'Notes'];
  
  const rows = transactions.map(tx => {
    return [
      tx.date,
      tx.type,
      ASSET_LABELS[tx.assetType] || tx.assetType,
      tx.amount,
      ASSET_UNITS[tx.assetType] || '',
      tx.pricePerUnit,
      (tx.amount * tx.pricePerUnit).toFixed(2),
      tx.notes || ''
    ].map(escapeCsvField).join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const fileName = `zakatvault_transactions_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadFile(csvContent, fileName);
};

export const exportLiabilitiesToCSV = (liabilities: Liability[]) => {
  const headers = ['Title', 'Amount_EGP', 'Due_Date', 'Is_Deductible'];
  
  const rows = liabilities.map(l => {
    return [
      l.title,
      l.amount,
      l.dueDate,
      l.isDeductible ? 'Yes' : 'No'
    ].map(escapeCsvField).join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const fileName = `zakatvault_liabilities_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadFile(csvContent, fileName);
};

export const exportPortfolioSummaryToCSV = (summary: any, rates: MarketRates) => {
  const headers = ['Category', 'Item', 'Quantity', 'Unit', 'Current_Rate_EGP', 'Market_Value_EGP'];
  
  const rows = [];

  // Assets
  if (summary.holdings.GOLD > 0) rows.push(['Asset', ASSET_LABELS.GOLD, summary.holdings.GOLD.toFixed(3), 'g', rates.gold_egp, summary.values.GOLD.toFixed(2)]);
  if (summary.holdings.GOLD_21 > 0) rows.push(['Asset', ASSET_LABELS.GOLD_21, summary.holdings.GOLD_21.toFixed(3), 'g', rates.gold21_egp, summary.values.GOLD_21.toFixed(2)]);
  if (summary.holdings.SILVER > 0) rows.push(['Asset', ASSET_LABELS.SILVER, summary.holdings.SILVER.toFixed(3), 'g', rates.silver_egp, summary.values.SILVER.toFixed(2)]);
  if (summary.holdings.USD > 0) rows.push(['Asset', ASSET_LABELS.USD, summary.holdings.USD.toFixed(2), '$', rates.usd_egp, summary.values.USD.toFixed(2)]);
  if (summary.holdings.EGP > 0) rows.push(['Asset', ASSET_LABELS.EGP, summary.holdings.EGP.toFixed(2), 'EGP', '1', summary.values.EGP.toFixed(2)]);

  // Spacer
  rows.push(['', '', '', '', '', '']);

  // Liabilities Summary
  rows.push(['Liability', 'Total Liabilities', '', '', '', `-${summary.totalLiabilities.toFixed(2)}`]);

  // Spacer
  rows.push(['', '', '', '', '', '']);

  // Totals
  rows.push(['Summary', 'Total Assets', '', '', '', summary.totalAssets.toFixed(2)]);
  rows.push(['Summary', 'Net Worth', '', '', '', summary.netWorth.toFixed(2)]);

  const csvContent = [
    headers.join(','), 
    ...rows.map(row => row.map(escapeCsvField).join(','))
  ].join('\n');

  const fileName = `zakatvault_portfolio_snapshot_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadFile(csvContent, fileName);
};