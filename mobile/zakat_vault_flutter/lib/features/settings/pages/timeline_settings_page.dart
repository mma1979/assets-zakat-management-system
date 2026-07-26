import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../../services/zakat_service.dart';
import '../../../models/zakat_models.dart';

class TimelineSettingsPage extends ConsumerStatefulWidget {
  const TimelineSettingsPage({super.key});

  @override
  ConsumerState<TimelineSettingsPage> createState() => _TimelineSettingsPageState();
}

class _TimelineSettingsPageState extends ConsumerState<TimelineSettingsPage> {
  bool _isLoading = true;
  List<ZakatCycle> _cycles = [];

  @override
  void initState() {
    super.initState();
    _loadCycles();
  }

  Future<void> _loadCycles() async {
    setState(() => _isLoading = true);
    try {
      final cycles = await ref.read(zakatServiceProvider).getZakatCycles();
      setState(() => _cycles = cycles);
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _closeCurrentCycle() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Close Zakat Cycle?'),
        content: const Text(
          'Are you sure you want to close this cycle? This will lock the current calculations and add any unpaid Zakat as a liability due next month. A new cycle will be opened automatically.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981)),
            child: const Text('Confirm', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      setState(() => _isLoading = true);
      final success = await ref.read(zakatServiceProvider).closeCurrentCycle();
      if (success) {
        await _loadCycles();
      } else {
        setState(() => _isLoading = false);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Failed to close cycle')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Zakat Timeline'),
        actions: [
          if (_cycles.isNotEmpty && _cycles.first.status != 'Paid')
            IconButton(
              icon: const Icon(LucideIcons.checkCircle),
              onPressed: _closeCurrentCycle,
              tooltip: 'Close Current Cycle',
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _cycles.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(LucideIcons.history, size: 64, color: Colors.grey.shade300),
                      const SizedBox(height: 16),
                      const Text(
                        'No Zakat history available yet.',
                        style: TextStyle(color: Color(0xFF94A3B8)),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _cycles.length,
                  itemBuilder: (context, index) {
                    final cycle = _cycles[index];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 16),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '${cycle.hijriYear} AH',
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: cycle.status == 'Paid'
                                        ? Colors.green.shade100
                                        : Colors.amber.shade100,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    cycle.status,
                                    style: TextStyle(
                                      color: cycle.status == 'Paid'
                                          ? Colors.green.shade700
                                          : Colors.amber.shade700,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Date: ${cycle.gregorianDate.toLocal().toString().split(' ')[0]}',
                              style: const TextStyle(color: Colors.grey),
                            ),
                            const Divider(),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Zakat Due:'),
                                Text(
                                  '${cycle.zakatDue.toStringAsFixed(2)}',
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text('Amount Paid:'),
                                Text(
                                  '${cycle.amountPaid.toStringAsFixed(2)}',
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.green,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
