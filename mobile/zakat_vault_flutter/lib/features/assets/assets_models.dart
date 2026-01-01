import '../../services/rates_service.dart';
import '../../services/transaction_service.dart';

class AssetMetrics {
  final double quantity;
  final double avgCost;

  AssetMetrics({
    required this.quantity,
    required this.avgCost,
  });

  factory AssetMetrics.empty() => AssetMetrics(quantity: 0, avgCost: 0);
}

class AssetsState {
  final List<RateItem> rates;
  final List<TransactionItem> transactions;
  final String activeAssetType;
  final Map<String, AssetMetrics> metrics;

  AssetsState({
    required this.rates,
    required this.transactions,
    required this.activeAssetType,
    required this.metrics,
  });

  AssetsState copyWith({
    List<RateItem>? rates,
    List<TransactionItem>? transactions,
    String? activeAssetType,
    Map<String, AssetMetrics>? metrics,
  }) {
    return AssetsState(
      rates: rates ?? this.rates,
      transactions: transactions ?? this.transactions,
      activeAssetType: activeAssetType ?? this.activeAssetType,
      metrics: metrics ?? this.metrics,
    );
  }
}
