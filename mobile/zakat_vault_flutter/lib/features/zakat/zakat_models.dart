import '../../services/zakat_service.dart';

class ZakatState {
  final ZakatCalculation? calculation;
  final List<ZakatPayment> payments;
  final bool isLoading;
  final String? error;

  ZakatState({
    this.calculation,
    this.payments = const [],
    this.isLoading = false,
    this.error,
  });

  ZakatState copyWith({
    ZakatCalculation? calculation,
    List<ZakatPayment>? payments,
    bool? isLoading,
    String? error,
  }) {
    return ZakatState(
      calculation: calculation ?? this.calculation,
      payments: payments ?? this.payments,
      isLoading: isLoading ?? this.isLoading,
      error: error ?? this.error,
    );
  }

  bool get isEligible => (calculation?.totalZakatDue ?? 0) > 0;
}
