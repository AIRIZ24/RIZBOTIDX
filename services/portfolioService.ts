/**
 * Portfolio Service
 * Manages stock portfolio with buy/sell transactions and P&L calculation
 */

export interface Transaction {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  shares: number;      // Jumlah lot (1 lot = 100 lembar)
  pricePerShare: number;
  totalValue: number;
  fee: number;         // Biaya broker
  date: number;        // Timestamp
  note?: string;
}

export interface PortfolioPosition {
  symbol: string;
  totalShares: number;       // Total lot
  averagePrice: number;      // Harga rata-rata beli
  totalInvested: number;     // Total modal
  currentPrice: number;      // Harga saat ini
  currentValue: number;      // Nilai saat ini
  profitLoss: number;        // Profit/Loss nominal
  profitLossPercent: number; // Profit/Loss persentase
  transactions: Transaction[];
}

export interface PortfolioSummary {
  totalInvested: number;
  totalCurrentValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  totalRealizedPL: number;  // Total realized profit/loss from sells
  positions: PortfolioPosition[];
}

const PORTFOLIO_STORAGE_KEY = 'rizbot_portfolio';

// Generate unique ID
const generateId = (): string => {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Load transactions from localStorage
export const loadTransactions = (): Transaction[] => {
  try {
    const stored = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load portfolio:', e);
  }
  return [];
};

// Save transactions to localStorage
export const saveTransactions = (transactions: Transaction[]) => {
  try {
    localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(transactions));
  } catch (e) {
    console.error('Failed to save portfolio:', e);
  }
};

/**
 * Add buy transaction
 * @param symbol - Stock symbol (e.g., BBCA)
 * @param lots - Number of lots (1 lot = 100 shares)
 * @param pricePerShare - Price per share in IDR
 * @param fee - Broker fee (default: auto-calculated)
 * @param date - Transaction date (default: now)
 * @param note - Optional note
 */
export const addBuyTransaction = (
  symbol: string,
  lots: number,
  pricePerShare: number,
  fee: number = 0,
  date?: number,
  note?: string
): Transaction => {
  // Validation
  if (lots <= 0) throw new Error('Jumlah lot harus lebih dari 0');
  if (pricePerShare <= 0) throw new Error('Harga harus lebih dari 0');
  
  const shares = lots; // Store as lots
  const totalValue = lots * 100 * pricePerShare + fee; // 1 lot = 100 shares
  
  const transaction: Transaction = {
    id: generateId(),
    symbol: symbol.toUpperCase(),
    type: 'buy',
    shares,
    pricePerShare,
    totalValue,
    fee,
    date: date || Date.now(),
    note,
  };

  const transactions = loadTransactions();
  transactions.push(transaction);
  saveTransactions(transactions);

  return transaction;
};

/**
 * Add sell transaction
 * @param symbol - Stock symbol (e.g., BBCA)
 * @param lots - Number of lots to sell
 * @param pricePerShare - Price per share in IDR
 * @param fee - Broker fee (default: auto-calculated)
 * @param date - Transaction date (default: now)
 * @param note - Optional note
 */
export const addSellTransaction = (
  symbol: string,
  lots: number,
  pricePerShare: number,
  fee: number = 0,
  date?: number,
  note?: string
): Transaction => {
  // Validation
  if (lots <= 0) throw new Error('Jumlah lot harus lebih dari 0');
  if (pricePerShare <= 0) throw new Error('Harga harus lebih dari 0');
  
  // Check if we have enough shares to sell
  const position = calculatePosition(symbol, pricePerShare);
  if (!position || position.totalShares < lots) {
    throw new Error(`Tidak cukup lot untuk dijual. Tersedia: ${position?.totalShares || 0} lot`);
  }
  
  const shares = lots;
  const totalValue = lots * 100 * pricePerShare - fee;
  
  const transaction: Transaction = {
    id: generateId(),
    symbol: symbol.toUpperCase(),
    type: 'sell',
    shares,
    pricePerShare,
    totalValue,
    fee,
    date: date || Date.now(),
    note,
  };

  const transactions = loadTransactions();
  transactions.push(transaction);
  saveTransactions(transactions);

  return transaction;
};

// Delete transaction
export const deleteTransaction = (transactionId: string) => {
  const transactions = loadTransactions();
  const filtered = transactions.filter(t => t.id !== transactionId);
  saveTransactions(filtered);
};

// Get all unique symbols in portfolio
export const getPortfolioSymbols = (): string[] => {
  const transactions = loadTransactions();
  return [...new Set(transactions.map(t => t.symbol))];
};

// Calculate position for a single symbol
export const calculatePosition = (
  symbol: string,
  currentPrice: number
): PortfolioPosition | null => {
  const transactions = loadTransactions().filter(t => t.symbol === symbol);
  
  if (transactions.length === 0) return null;

  let totalShares = 0;
  let totalCost = 0;

  // Calculate using FIFO method
  transactions.forEach(t => {
    if (t.type === 'buy') {
      totalShares += t.shares;
      totalCost += t.totalValue;
    } else {
      // Sell reduces position
      const sellValue = t.shares * 100 * t.pricePerShare;
      const avgCostPerLot = totalShares > 0 ? totalCost / totalShares : 0;
      totalShares -= t.shares;
      totalCost -= avgCostPerLot * t.shares;
    }
  });

  // If no shares left, return null
  if (totalShares <= 0) return null;

  const averagePrice = totalCost / (totalShares * 100);
  const currentValue = totalShares * 100 * currentPrice;
  const profitLoss = currentValue - totalCost;
  const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

  return {
    symbol,
    totalShares,
    averagePrice,
    totalInvested: totalCost,
    currentPrice,
    currentValue,
    profitLoss,
    profitLossPercent,
    transactions,
  };
};

// Calculate full portfolio summary
export const calculatePortfolioSummary = (
  currentPrices: Record<string, number>
): PortfolioSummary => {
  const symbols = getPortfolioSymbols();
  const positions: PortfolioPosition[] = [];
  const allTransactions = loadTransactions();

  let totalInvested = 0;
  let totalCurrentValue = 0;
  let totalRealizedPL = 0;

  // Calculate realized P&L from all sell transactions
  allTransactions.forEach(txn => {
    if (txn.type === 'sell') {
      // Find average cost at time of sale (simplified)
      const buys = allTransactions.filter(t => 
        t.type === 'buy' && t.symbol === txn.symbol && t.date < txn.date
      );
      if (buys.length > 0) {
        const totalBuyValue = buys.reduce((sum, b) => sum + b.totalValue, 0);
        const totalBuyShares = buys.reduce((sum, b) => sum + b.shares, 0);
        const avgCost = totalBuyShares > 0 ? totalBuyValue / (totalBuyShares * 100) : 0;
        const sellValue = txn.shares * 100 * txn.pricePerShare;
        const costBasis = txn.shares * 100 * avgCost;
        totalRealizedPL += sellValue - costBasis - txn.fee;
      }
    }
  });

  symbols.forEach(symbol => {
    const price = currentPrices[symbol] || 0;
    const position = calculatePosition(symbol, price);
    
    if (position && position.totalShares > 0) {
      positions.push(position);
      totalInvested += position.totalInvested;
      totalCurrentValue += position.currentValue;
    }
  });

  const totalProfitLoss = totalCurrentValue - totalInvested;
  const totalProfitLossPercent = totalInvested > 0 
    ? (totalProfitLoss / totalInvested) * 100 
    : 0;

  return {
    totalInvested,
    totalCurrentValue,
    totalProfitLoss,
    totalProfitLossPercent,
    totalRealizedPL,
    positions: positions.sort((a, b) => b.currentValue - a.currentValue),
  };
};

// Get transaction history for a symbol
export const getTransactionHistory = (symbol?: string): Transaction[] => {
  const transactions = loadTransactions();
  const filtered = symbol 
    ? transactions.filter(t => t.symbol === symbol)
    : transactions;
  return filtered.sort((a, b) => b.date - a.date);
};

// Clear all transactions
export const clearPortfolio = () => {
  saveTransactions([]);
};

// Format currency
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Format percentage
export const formatPercent = (value: number): string => {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

// Calculate broker fee (typical 0.15% buy, 0.25% sell)
export const calculateBrokerFee = (
  type: 'buy' | 'sell',
  lots: number,
  price: number
): number => {
  const value = lots * 100 * price;
  const feePercent = type === 'buy' ? 0.0015 : 0.0025;
  return Math.round(value * feePercent);
};

/**
 * Export Portfolio to PDF
 * Creates a downloadable PDF report of portfolio positions and transactions
 */
export const exportToPDF = async (
  summary: PortfolioSummary,
  transactions: Transaction[]
): Promise<void> => {
  const reportDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Laporan Portfolio - RIZBOT Trading</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          padding: 40px; 
          color: #1a1a1a;
          line-height: 1.6;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          padding-bottom: 20px;
          border-bottom: 3px solid #6366f1;
        }
        .header h1 { 
          color: #6366f1; 
          font-size: 28px;
          margin-bottom: 5px;
        }
        .header .subtitle { 
          color: #666; 
          font-size: 14px;
        }
        .summary { 
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          gap: 15px;
        }
        .summary-card {
          flex: 1;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
        }
        .summary-card.total { background: #f0f4ff; border: 1px solid #6366f1; }
        .summary-card.value { background: #f0fdf4; border: 1px solid #10b981; }
        .summary-card.pl { border: 1px solid #ddd; }
        .summary-card .label { font-size: 12px; color: #666; margin-bottom: 5px; }
        .summary-card .value { font-size: 18px; font-weight: bold; }
        .summary-card.total .value { color: #6366f1; }
        .summary-card.value .value { color: #10b981; }
        .profit { color: #10b981; }
        .loss { color: #ef4444; }
        .section { margin-bottom: 25px; }
        .section-title { 
          font-size: 16px; 
          font-weight: bold; 
          color: #333;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e5e7eb;
        }
        table { 
          width: 100%; 
          border-collapse: collapse;
          font-size: 12px;
        }
        th { 
          background: #f9fafb; 
          padding: 12px 8px; 
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
        }
        td { 
          padding: 10px 8px; 
          border-bottom: 1px solid #f3f4f6;
        }
        tr:hover { background: #f9fafb; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }
        .badge-buy { background: #d1fae5; color: #059669; }
        .badge-sell { background: #fee2e2; color: #dc2626; }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 11px;
          color: #9ca3af;
        }
        @media print {
          body { padding: 20px; }
          .summary { flex-wrap: wrap; }
          .summary-card { min-width: 150px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 RIZBOT Trading</h1>
        <p class="subtitle">Laporan Portfolio - ${reportDate}</p>
      </div>

      <div class="summary">
        <div class="summary-card total">
          <div class="label">Total Investasi</div>
          <div class="value">${formatCurrency(summary.totalInvested)}</div>
        </div>
        <div class="summary-card value">
          <div class="label">Nilai Saat Ini</div>
          <div class="value">${formatCurrency(summary.totalCurrentValue)}</div>
        </div>
        <div class="summary-card pl">
          <div class="label">Profit/Loss</div>
          <div class="value ${summary.totalProfitLoss >= 0 ? 'profit' : 'loss'}">
            ${formatCurrency(summary.totalProfitLoss)} (${formatPercent(summary.totalProfitLossPercent)})
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">📈 Posisi Portfolio</h2>
        <table>
          <thead>
            <tr>
              <th>Saham</th>
              <th class="text-right">Lot</th>
              <th class="text-right">Avg. Price</th>
              <th class="text-right">Current Price</th>
              <th class="text-right">Investasi</th>
              <th class="text-right">Nilai Saat Ini</th>
              <th class="text-right">P/L</th>
            </tr>
          </thead>
          <tbody>
            ${summary.positions.map(pos => `
              <tr>
                <td><strong>${pos.symbol}</strong></td>
                <td class="text-right">${pos.totalShares}</td>
                <td class="text-right">Rp ${pos.averagePrice.toLocaleString()}</td>
                <td class="text-right">Rp ${pos.currentPrice.toLocaleString()}</td>
                <td class="text-right">${formatCurrency(pos.totalInvested)}</td>
                <td class="text-right">${formatCurrency(pos.currentValue)}</td>
                <td class="text-right ${pos.profitLoss >= 0 ? 'profit' : 'loss'}">
                  ${formatCurrency(pos.profitLoss)}<br>
                  <small>(${formatPercent(pos.profitLossPercent)})</small>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2 class="section-title">📋 Riwayat Transaksi (${transactions.length} transaksi)</h2>
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Saham</th>
              <th class="text-center">Tipe</th>
              <th class="text-right">Lot</th>
              <th class="text-right">Harga/Lembar</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.slice(0, 50).map(txn => `
              <tr>
                <td>${new Date(txn.date).toLocaleDateString('id-ID')}</td>
                <td><strong>${txn.symbol}</strong></td>
                <td class="text-center">
                  <span class="badge ${txn.type === 'buy' ? 'badge-buy' : 'badge-sell'}">
                    ${txn.type === 'buy' ? 'BELI' : 'JUAL'}
                  </span>
                </td>
                <td class="text-right">${txn.shares}</td>
                <td class="text-right">Rp ${txn.pricePerShare.toLocaleString()}</td>
                <td class="text-right">${formatCurrency(txn.totalValue)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${transactions.length > 50 ? `<p style="text-align: center; color: #666; margin-top: 10px; font-size: 11px;">...dan ${transactions.length - 50} transaksi lainnya</p>` : ''}
      </div>

      <div class="footer">
        <p>Laporan ini di-generate oleh RIZBOT Trading</p>
        <p>Generated: ${new Date().toLocaleString('id-ID')}</p>
      </div>
    </body>
    </html>
  `;

  // Create a new window and print
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  }
};

/**
 * Export Portfolio to Excel (CSV format)
 * Creates a downloadable Excel-compatible CSV file
 */
export const exportToExcel = (
  summary: PortfolioSummary,
  transactions: Transaction[]
): void => {
  const BOM = '\uFEFF'; // UTF-8 BOM for Excel
  let csvContent = BOM;
  
  // Add header
  csvContent += 'LAPORAN PORTFOLIO - RIZBOT TRADING\n';
  csvContent += `Tanggal:,${new Date().toLocaleDateString('id-ID')}\n\n`;
  
  // Summary section
  csvContent += 'RINGKASAN PORTFOLIO\n';
  csvContent += `Total Investasi:,${summary.totalInvested}\n`;
  csvContent += `Nilai Saat Ini:,${summary.totalCurrentValue}\n`;
  csvContent += `Profit/Loss:,${summary.totalProfitLoss}\n`;
  csvContent += `Profit/Loss (%):,${summary.totalProfitLossPercent.toFixed(2)}%\n\n`;
  
  // Positions section
  csvContent += 'POSISI PORTFOLIO\n';
  csvContent += 'Saham,Lot,Avg Price,Current Price,Investasi,Nilai Saat Ini,P/L,P/L (%)\n';
  
  summary.positions.forEach(pos => {
    csvContent += `${pos.symbol},${pos.totalShares},${pos.averagePrice},${pos.currentPrice},${pos.totalInvested},${pos.currentValue},${pos.profitLoss},${pos.profitLossPercent.toFixed(2)}%\n`;
  });
  
  csvContent += '\n';
  
  // Transactions section
  csvContent += 'RIWAYAT TRANSAKSI\n';
  csvContent += 'Tanggal,Saham,Tipe,Lot,Harga/Lembar,Total,Fee,Catatan\n';
  
  transactions.forEach(txn => {
    const date = new Date(txn.date).toLocaleDateString('id-ID');
    csvContent += `${date},${txn.symbol},${txn.type === 'buy' ? 'BELI' : 'JUAL'},${txn.shares},${txn.pricePerShare},${txn.totalValue},${txn.fee},"${txn.note || ''}"\n`;
  });
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `portfolio_rizbot_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export Portfolio to JSON
 * Creates a downloadable JSON backup file
 */
export const exportToJSON = (
  summary: PortfolioSummary,
  transactions: Transaction[]
): void => {
  const exportData = {
    exportDate: new Date().toISOString(),
    appName: 'RIZBOT Trading',
    version: '1.0',
    summary: {
      totalInvested: summary.totalInvested,
      totalCurrentValue: summary.totalCurrentValue,
      totalProfitLoss: summary.totalProfitLoss,
      totalProfitLossPercent: summary.totalProfitLossPercent,
      positionCount: summary.positions.length,
    },
    positions: summary.positions,
    transactions: transactions,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `portfolio_backup_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default {
  loadTransactions,
  saveTransactions,
  addBuyTransaction,
  addSellTransaction,
  deleteTransaction,
  getPortfolioSymbols,
  calculatePosition,
  calculatePortfolioSummary,
  getTransactionHistory,
  clearPortfolio,
  formatCurrency,
  formatPercent,
  calculateBrokerFee,
  exportToPDF,
  exportToExcel,
  exportToJSON,
};
