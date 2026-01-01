import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../shared/widgets/app_drawer.dart';
import '../../services/liability_service.dart';
import 'liabilities_notifier.dart';
import 'liabilities_models.dart';
import 'widgets/add_liability_dialog.dart';

const Color emeraldColor = Color(0xFF10B981);

class LiabilitiesPage extends ConsumerWidget {
  const LiabilitiesPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final liabilitiesAsync = ref.watch(liabilitiesNotifierProvider);
    final currencyFormat = NumberFormat.currency(symbol: 'EGP ', decimalDigits: 2);
    final dateFormat = DateFormat('dd-MM-yyyy');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Liabilities'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.plus),
            onPressed: () => _showAddLiability(context, ref),
          ),
        ],
      ),
      drawer: const AppDrawer(),
      body: liabilitiesAsync.when(
        data: (state) {
          return RefreshIndicator(
            onRefresh: () => ref.read(liabilitiesNotifierProvider.notifier).refresh(),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   const Text(
                    'Debt Management',
                    style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  const Text(
                    'Track and manage your outstanding liabilities',
                    style: TextStyle(color: Colors.grey),
                  ),
                  const SizedBox(height: 24),

                  // Summary Cards
                  Row(
                    children: [
                      Expanded(
                        child: _buildSummaryCard(
                          title: 'Total Debt',
                          amount: state.totalLiabilities,
                          color: Colors.red.shade700,
                          icon: LucideIcons.frown,
                          currencyFormat: currencyFormat,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildSummaryCard(
                          title: 'Deductible',
                          amount: state.deductibleLiabilities,
                          color: emeraldColor,
                          icon: LucideIcons.checkCircle,
                          currencyFormat: currencyFormat,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 32),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Liability List',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      TextButton.icon(
                        onPressed: () => _showAddLiability(context, ref),
                        icon: const Icon(LucideIcons.plus, size: 16),
                        label: const Text('Add Debt'),
                        style: TextButton.styleFrom(foregroundColor: emeraldColor),
                      ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  if (state.liabilities.isEmpty)
                    _buildEmptyState()
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: state.liabilities.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 12),
                      itemBuilder: (context, index) {
                        final item = state.liabilities[index];
                        return _buildLiabilityItem(context, ref, item, currencyFormat, dateFormat);
                      },
                    ),
                ],
              ),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddLiability(context, ref),
        backgroundColor: emeraldColor,
        child: const Icon(LucideIcons.plus, color: Colors.white),
      ),
    );
  }

  Widget _buildSummaryCard({
    required String title,
    required double amount,
    required Color color,
    required IconData icon,
    required NumberFormat currencyFormat,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 12),
          Text(title, style: TextStyle(color: color, fontWeight: FontWeight.w500)),
          const SizedBox(height: 4),
          Text(
            currencyFormat.format(amount),
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(48),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200, style: BorderStyle.solid),
      ),
      child: Column(
        children: [
          Icon(LucideIcons.helpCircle, size: 48, color: Colors.grey.shade400),
          const SizedBox(height: 16),
          Text(
            'No liabilities found',
            style: TextStyle(color: Colors.grey.shade600, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 8),
          const Text(
            'Keep track of your debts here',
            style: TextStyle(color: Colors.grey, fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildLiabilityItem(
    BuildContext context,
    WidgetRef ref,
    LiabilityItem item,
    NumberFormat currencyFormat,
    DateFormat dateFormat,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: item.isDeductible ? emeraldColor.withOpacity(0.1) : Colors.grey.shade100,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              LucideIcons.dollarSign,
              color: item.isDeductible ? emeraldColor : Colors.grey.shade400,
              size: 20,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 4),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    const Icon(LucideIcons.calendar, size: 12, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      item.dueDate != null ? dateFormat.format(item.dueDate!) : 'No Due Date',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    const Text('•', style: TextStyle(color: Colors.grey)),
                    Text(
                      item.isDeductible ? 'Deductible' : 'Not Deductible',
                      style: TextStyle(
                        fontSize: 12,
                        color: item.isDeductible ? emeraldColor : Colors.grey,
                        fontWeight: item.isDeductible ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '-${currencyFormat.format(item.amount)}',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.redAccent),
              ),
              InkWell(
                onTap: () => _showDecreaseLiability(context, ref, item),
                child: const Text(
                  'DECREASE',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: emeraldColor,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(LucideIcons.trash2, size: 18, color: Colors.grey),
            onPressed: () => _confirmDelete(context, ref, item),
          ),
        ],
      ),
    );
  }

  Future<void> _showAddLiability(BuildContext context, WidgetRef ref) async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => const AddLiabilityDialog(),
    );

    if (result != null) {
      ref.read(liabilitiesNotifierProvider.notifier).addLiability(result);
    }
  }

  Future<void> _showDecreaseLiability(BuildContext context, WidgetRef ref, LiabilityItem item) async {
    final controller = TextEditingController();
    final result = await showDialog<double>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Decrease ${item.title}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Enter amount to decrease from ${currencyFormat.format(item.amount)}:'),
            const SizedBox(height: 16),
            TextField(
              controller: controller,
              keyboardType: TextInputType.number,
              autofocus: true,
              decoration: const InputDecoration(
                prefixText: 'EGP ',
                border: OutlineInputBorder(),
                hintText: '0.00',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, double.tryParse(controller.text)),
            style: ElevatedButton.styleFrom(backgroundColor: emeraldColor, foregroundColor: Colors.white),
            child: const Text('Decrease'),
          ),
        ],
      ),
    );

    if (result != null && result > 0) {
      ref.read(liabilitiesNotifierProvider.notifier).decreaseLiability(item.id, result);
    }
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref, LiabilityItem item) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Liability'),
        content: Text('Are you sure you want to delete "${item.title}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (result == true) {
      ref.read(liabilitiesNotifierProvider.notifier).removeLiability(item.id);
    }
  }
  
  // Need to provide currencyFormat to helper methods
  NumberFormat get currencyFormat => NumberFormat.currency(symbol: 'EGP ', decimalDigits: 2);
}
