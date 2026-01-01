import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/zakat_service.dart';
import 'zakat_models.dart';

final zakatNotifierProvider =
    AsyncNotifierProvider<ZakatNotifier, ZakatState>(ZakatNotifier.new);

class ZakatNotifier extends AsyncNotifier<ZakatState> {
  @override
  FutureOr<ZakatState> build() async {
    return _fetchData();
  }

  Future<ZakatState> _fetchData() async {
    final service = ref.read(zakatServiceProvider);
    
    final calculation = await service.getZakatCalculation();
    final payments = await service.getZakatPayments();
    
    return ZakatState(
      calculation: calculation,
      payments: payments,
    );
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchData());
  }

  Future<void> addPayment(Map<String, dynamic> data) async {
    final service = ref.read(zakatServiceProvider);
    final newItem = await service.addZakatPayment(data);
    if (newItem != null) {
      await refresh();
    }
  }

  Future<void> removePayment(int id) async {
    final service = ref.read(zakatServiceProvider);
    final success = await service.deleteZakatPayment(id);
    if (success) {
      await refresh();
    }
  }
}
