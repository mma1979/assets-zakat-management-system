import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/rates_service.dart';
import '../../services/transaction_service.dart';
import 'assets_models.dart';

final assetsNotifierProvider = AsyncNotifierProvider<AssetsNotifier, AssetsState>(() {
  return AssetsNotifier();
});

class AssetsNotifier extends AsyncNotifier<AssetsState> {
  @override
  FutureOr<AssetsState> build() async {
    return _fetchData();
  }

  Future<AssetsState> _fetchData() async {
    final ratesService = ref.read(ratesServiceProvider);
    final transactionService = ref.read(transactionServiceProvider);

    final rates = await ratesService.getLatestRates();
    final transactions = await transactionService.getTransactions();

    // Use first rate's name if available, otherwise empty string
    final activeAssetType = rates.isNotEmpty ? rates.first.name : '';
    
    final state = AssetsState(
      rates: rates,
      transactions: transactions,
      activeAssetType: activeAssetType,
      metrics: {},
    );

    return state.copyWith(metrics: _calculateAllMetrics(transactions, rates));
  }


  Map<String, AssetMetrics> _calculateAllMetrics(
      List<TransactionItem> transactions, List<RateItem> rates) {
    final Map<String, AssetMetrics> metrics = {};
    for (var rate in rates) {
      metrics[rate.name] = _calculateAssetMetrics(transactions, rate.name);
    }
    // Also add EGP if needed, though for now focus on rates
    return metrics;
  }

  AssetMetrics _calculateAssetMetrics(List<TransactionItem> transactions, String assetType) {
    final assetTxs = transactions
        .where((t) => t.assetType == assetType)
        .toList()
      ..sort((a, b) => a.date.compareTo(b.date));

    double quantity = 0;
    List<Map<String, double>> lots = [];

    for (var tx in assetTxs) {
      if (tx.type == 'BUY') {
        quantity += tx.amount;
        lots.add({'qty': tx.amount, 'cost': tx.pricePerUnit ?? 0});
      } else {
        double amountToSell = tx.amount;
        quantity -= amountToSell;

        while (amountToSell > 0 && lots.isNotEmpty) {
          final currentLot = lots[0];
          if (currentLot['qty']! <= amountToSell) {
            amountToSell -= currentLot['qty']!;
            lots.removeAt(0);
          } else {
            currentLot['qty'] = currentLot['qty']! - amountToSell;
            amountToSell = 0;
          }
        }
      }
    }

    double avgCost = 0;
    if (lots.isNotEmpty) {
      double totalRemainingCost = 0;
      double totalRemainingQty = 0;
      for (var lot in lots) {
        totalRemainingCost += lot['qty']! * lot['cost']!;
        totalRemainingQty += lot['qty']!;
      }
      avgCost = totalRemainingQty > 0 ? totalRemainingCost / totalRemainingQty : 0;
    }

    return AssetMetrics(
      quantity: quantity < 0 ? 0 : quantity,
      avgCost: avgCost,
    );
  }

  void setActiveAsset(String assetType) {
    state.whenData((data) {
      state = AsyncData(data.copyWith(activeAssetType: assetType));
    });
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetchData());
  }

  Future<void> addTransaction(Map<String, dynamic> txData) async {
    final transactionService = ref.read(transactionServiceProvider);
    
    // We need to implement addTransaction in TransactionService
    // For now, let's assume it exists or we add it
    final success = await transactionService.addTransaction(txData);
    if (success) {
      await refresh();
    }
  }

  Future<void> removeTransaction(int id) async {
    final transactionService = ref.read(transactionServiceProvider);
    final success = await transactionService.removeTransaction(id);
    if (success) {
      await refresh();
    }
  }
}

