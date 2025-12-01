import { Transaction, AssetType } from '../types';

export const calculateAssetMetrics = (transactions: Transaction[], assetType: AssetType) => {
  const assetTxs = transactions
    .filter(t => t.assetType === assetType)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  let quantity = 0;
  // Lots for FIFO/Avg Cost
  let lots: { qty: number, cost: number }[] = [];

  assetTxs.forEach(tx => {
    if (tx.type === 'BUY') {
      quantity += tx.amount;
      lots.push({ qty: tx.amount, cost: tx.pricePerUnit });
    } else {
      // SELL - Consume lots (FIFO)
      let amountToSell = tx.amount;
      quantity -= amountToSell;
      
      while (amountToSell > 0 && lots.length > 0) {
        const currentLot = lots[0];
        if (currentLot.qty <= amountToSell) {
          amountToSell -= currentLot.qty;
          lots.shift(); // Remove empty lot
        } else {
          currentLot.qty -= amountToSell;
          amountToSell = 0;
        }
      }
    }
  });

  // Calculate Avg Cost of remaining lots
  let totalCost = 0;
  if (lots.length > 0) {
    const totalRemainingCost = lots.reduce((acc, lot) => acc + (lot.qty * lot.cost), 0);
    const totalRemainingQty = lots.reduce((acc, lot) => acc + lot.qty, 0);
    totalCost = totalRemainingQty > 0 ? totalRemainingCost / totalRemainingQty : 0;
  }

  return { quantity: Math.max(0, quantity), avgCost: totalCost };
};