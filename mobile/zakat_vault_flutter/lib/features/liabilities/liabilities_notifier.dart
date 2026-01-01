import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/liability_service.dart';
import 'liabilities_models.dart';

final liabilitiesNotifierProvider =
    AsyncNotifierProvider<LiabilitiesNotifier, LiabilitiesState>(LiabilitiesNotifier.new);

class LiabilitiesNotifier extends AsyncNotifier<LiabilitiesState> {
  @override
  FutureOr<LiabilitiesState> build() async {
    return _fetchData();
  }

  Future<LiabilitiesState> _fetchData() async {
    final service = ref.read(liabilityServiceProvider);
    final liabilities = await service.getLiabilities();
    return LiabilitiesState(liabilities: liabilities);
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchData());
  }

  Future<void> addLiability(Map<String, dynamic> data) async {
    final service = ref.read(liabilityServiceProvider);
    final newItem = await service.addLiability(data);
    if (newItem != null) {
      await refresh();
    }
  }

  Future<void> removeLiability(int id) async {
    final service = ref.read(liabilityServiceProvider);
    final success = await service.deleteLiability(id);
    if (success) {
      await refresh();
    }
  }

  Future<void> decreaseLiability(int id, double amount) async {
    final service = ref.read(liabilityServiceProvider);
    await service.decreaseLiability(id, amount);
    await refresh();
  }
}
