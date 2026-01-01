import '../../services/liability_service.dart';

class LiabilitiesState {
  final List<LiabilityItem> liabilities;
  final bool isLoading;
  final String? error;

  LiabilitiesState({
    required this.liabilities,
    this.isLoading = false,
    this.error,
  });

  LiabilitiesState copyWith({
    List<LiabilityItem>? liabilities,
    bool? isLoading,
    String? error,
  }) {
    return LiabilitiesState(
      liabilities: liabilities ?? this.liabilities,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }

  double get totalLiabilities =>
      liabilities.fold(0, (sum, item) => sum + item.amount);

  double get deductibleLiabilities =>
      liabilities.where((l) => l.isDeductible).fold(0, (sum, item) => sum + item.amount);
}
