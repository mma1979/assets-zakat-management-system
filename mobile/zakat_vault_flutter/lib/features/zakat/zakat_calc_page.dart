import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../../shared/widgets/app_drawer.dart';
import 'zakat_notifier.dart';
import 'zakat_models.dart';
import '../../services/zakat_service.dart';

const Color emeraldColor = Color(0xFF10B981);
const Color amberColor = Color(0xFFF59E0B);
const Color roseColor = Color(0xFFF43F5E);
const Color blueColor = Color(0xFF3B82F6);

class ZakatCalcPage extends ConsumerWidget {
  const ZakatCalcPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final zakatAsync = ref.watch(zakatNotifierProvider);
    final currencyFormat = NumberFormat.currency(symbol: 'EGP ', decimalDigits: 2);
    final numberFormat = NumberFormat.decimalPattern();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Zakat Calculation'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.refreshCw),
            onPressed: () => ref.read(zakatNotifierProvider.notifier).refresh(),
          ),
        ],
      ),
      drawer: const AppDrawer(),
      body: zakatAsync.when(
        data: (state) {
          final calc = state.calculation;
          if (calc == null) return const Center(child: Text('No calculation data available'));

          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(),
                const SizedBox(height: 24),
                _buildWindowSummary(calc),
                const SizedBox(height: 24),
                _buildHeroCard(calc, currencyFormat),
                const SizedBox(height: 32),
                _buildCalculationBreakdown(calc, numberFormat),
                const SizedBox(height: 32),
                _buildNisabThresholds(calc, numberFormat),
                const SizedBox(height: 32),
                _buildPaymentManager(context, ref, state.payments, currencyFormat),
                const SizedBox(height: 100),
              ],
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }

  Widget _buildHeader() {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Zakat Assessment',
          style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
        ),
        SizedBox(height: 4),
        Text(
          'Complete overview of your Zakat obligations',
          style: TextStyle(color: Color(0xFF64748B), fontSize: 16),
        ),
      ],
    );
  }

  Widget _buildWindowSummary(ZakatCalculation calc) {
    final today = DateTime.now();
    final endDate = DateTime.tryParse(calc.zakatEndDate) ?? today;
    final remainingDays = endDate.difference(DateTime(today.year, today.month, today.day)).inDays;

    String remainingText;
    Color statusColor;
    if (remainingDays > 0) {
      remainingText = '$remainingDays Days Remaining';
      statusColor = emeraldColor;
    } else if (remainingDays == 0) {
      remainingText = 'Due Today';
      statusColor = amberColor;
    } else {
      remainingText = '${remainingDays.abs()} Days Overdue';
      statusColor = roseColor;
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: emeraldColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(LucideIcons.calendarClock, color: emeraldColor, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Calculation Window',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    Text(
                      'Based on your Zakat anniversary',
                      style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Start Date', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                  Text(calc.zakatStartDate, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                ],
              ),
              const Icon(LucideIcons.arrowRight, size: 16, color: Colors.grey),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text('End Date', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                  Text(calc.zakatEndDate, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: emeraldColor)),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              remainingText,
              textAlign: TextAlign.center,
              style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroCard(ZakatCalculation calc, NumberFormat currencyFormat) {
    final isEligible = calc.totalZakatDue > 0;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: isEligible ? emeraldColor : Colors.white,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: isEligible ? emeraldColor : const Color(0xFFF1F5F9)),
        boxShadow: [
          if (isEligible)
            BoxShadow(
              color: emeraldColor.withOpacity(0.3),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isEligible ? Colors.white.withOpacity(0.2) : Colors.grey.shade50,
              shape: BoxShape.circle,
            ),
            child: Icon(
              isEligible ? LucideIcons.checkCircle : LucideIcons.info,
              color: isEligible ? Colors.white : Colors.grey.shade400,
              size: 40,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Remaining Zakat Due',
            style: TextStyle(
              fontSize: 16,
              color: isEligible ? Colors.white.withOpacity(0.8) : Colors.grey.shade500,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            currencyFormat.format(calc.remainingZakatDue),
            style: TextStyle(
              fontSize: 40,
              fontWeight: FontWeight.bold,
              color: isEligible ? Colors.white : const Color(0xFF1E293B),
            ),
          ),
          if (calc.totalPayments > 0) ...[
            const SizedBox(height: 16),
            Text(
              'Total Due: ${currencyFormat.format(calc.totalZakatDue)} | Paid: ${currencyFormat.format(calc.totalPayments)}',
              style: TextStyle(
                fontSize: 12,
                color: isEligible ? Colors.white.withOpacity(0.7) : Colors.grey.shade500,
              ),
            ),
          ],
          const SizedBox(height: 24),
          Text(
            isEligible
                ? 'Your net wealth exceeds the silver-based Nisab requirement.'
                : 'Your wealth currently does not meet the minimum Nisab for Zakat.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: isEligible ? Colors.white.withOpacity(0.9) : Colors.grey.shade400,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCalculationBreakdown(ZakatCalculation calc, NumberFormat numberFormat) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Calculation Details',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
        ),
        const SizedBox(height: 16),
        _buildBreakdownItem(
          icon: LucideIcons.coins,
          title: 'Total Assets',
          value: calc.totalAssets,
          color: emeraldColor,
          numberFormat: numberFormat,
        ),
        _buildOperator(LucideIcons.arrowDown),
        _buildBreakdownItem(
          icon: LucideIcons.arrowDown,
          title: 'Less Debts',
          value: calc.totalDebts,
          color: roseColor,
          numberFormat: numberFormat,
          isNegative: true,
        ),
        _buildOperator(LucideIcons.arrowDown),
        _buildBreakdownItem(
          icon: LucideIcons.gem,
          title: 'Net Zakat Base',
          value: calc.netZakatBase,
          color: blueColor,
          numberFormat: numberFormat,
          isBold: true,
        ),
        _buildOperator(LucideIcons.arrowDown),
        _buildBreakdownItem(
          icon: LucideIcons.info,
          title: 'Total Zakat Due',
          value: calc.totalZakatDue,
          color: const Color(0xFF64748B),
          numberFormat: numberFormat,
          subtitle: '2.5% of net wealth',
        ),
        _buildOperator(LucideIcons.arrowDown),
        _buildBreakdownItem(
          icon: LucideIcons.receipt,
          title: 'Total Payments',
          value: calc.totalPayments,
          color: emeraldColor,
          numberFormat: numberFormat,
          isNegative: true,
        ),
      ],
    );
  }

  Widget _buildBreakdownItem({
    required IconData icon,
    required String title,
    required double value,
    required Color color,
    required NumberFormat numberFormat,
    bool isNegative = false,
    bool isBold = false,
    String? subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.1)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
                      color: const Color(0xFF64748B),
                    ),
                  ),
                  if (subtitle != null)
                    Text(
                      subtitle,
                      style: TextStyle(fontSize: 10, color: Colors.grey.shade500),
                    ),
                ],
              ),
            ],
          ),
          Text(
            '${isNegative ? '-' : ''}${numberFormat.format(value)} EGP',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOperator(IconData icon) {
    return Center(
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          border: Border.all(color: const Color(0xFFF1F5F9)),
        ),
        child: Icon(icon, size: 14, color: Colors.grey.shade400),
      ),
    );
  }

  Widget _buildNisabThresholds(ZakatCalculation calc, NumberFormat numberFormat) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Icon(LucideIcons.alertTriangle, color: amberColor, size: 20),
            SizedBox(width: 8),
            Text(
              'Nisab Thresholds',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: amberColor.withOpacity(0.05),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: amberColor.withOpacity(0.1)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Gold Nisab (85g)',
                style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF92400E)),
              ),
              const SizedBox(height: 4),
              Text(
                '${numberFormat.format(calc.nisabGoldValue)} EGP',
                style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF78350F)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.grey.shade50,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Silver Nisab (595g)',
                style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade600),
              ),
              const SizedBox(height: 4),
              Text(
                '${numberFormat.format(calc.nisabSilverValue)} EGP',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.grey.shade700),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildPaymentManager(BuildContext context, WidgetRef ref, List<ZakatPayment> payments, NumberFormat currencyFormat) {
    final dateFormat = DateFormat('dd MMM yyyy');

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Payment History',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)),
            ),
            TextButton.icon(
              onPressed: () => _showAddPaymentDialog(context, ref),
              icon: const Icon(LucideIcons.plus, size: 16),
              label: const Text('Add Payment'),
              style: TextButton.styleFrom(foregroundColor: emeraldColor),
            ),
          ],
        ),
        const SizedBox(height: 12),
        if (payments.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              children: [
                Icon(LucideIcons.receipt, size: 32, color: Colors.grey.shade300),
                const SizedBox(height: 12),
                Text('No payments recorded yet', style: TextStyle(color: Colors.grey.shade500)),
              ],
            ),
          )
        else
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: payments.length,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final payment = payments[index];
              return Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFF1F5F9)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: emeraldColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(LucideIcons.receipt, color: emeraldColor, size: 20),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            currencyFormat.format(payment.amount),
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          Text(
                            dateFormat.format(payment.date),
                            style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                          ),
                          if (payment.notes != null && payment.notes!.isNotEmpty)
                            Text(
                              payment.notes!,
                              style: TextStyle(color: Colors.grey.shade400, fontSize: 11, fontStyle: FontStyle.italic),
                            ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(LucideIcons.trash2, size: 18, color: Colors.grey),
                      onPressed: () => _confirmDeletePayment(context, ref, payment),
                    ),
                  ],
                ),
              );
            },
          ),
      ],
    );
  }

  Future<void> _showAddPaymentDialog(BuildContext context, WidgetRef ref) async {
    final amountController = TextEditingController();
    final notesController = TextEditingController();
    DateTime selectedDate = DateTime.now();

    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Record Zakat Payment'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: amountController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(
                    labelText: 'Amount',
                    prefixText: 'EGP ',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                InkWell(
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: selectedDate,
                      firstDate: DateTime(2000),
                      lastDate: DateTime(2100),
                    );
                    if (date != null) {
                      setState(() => selectedDate = date);
                    }
                  },
                  child: InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'Date',
                      border: OutlineInputBorder(),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(DateFormat('yyyy-MM-dd').format(selectedDate)),
                        const Icon(LucideIcons.calendar, size: 18),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: notesController,
                  decoration: const InputDecoration(
                    labelText: 'Notes',
                    hintText: 'e.g. Donation to charity X',
                    border: OutlineInputBorder(),
                  ),
                  maxLines: 2,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () {
                final amount = double.tryParse(amountController.text);
                if (amount != null && amount > 0) {
                  Navigator.pop(context, {
                    'amount': amount,
                    'date': DateFormat('yyyy-MM-dd').format(selectedDate),
                    'notes': notesController.text,
                  });
                }
              },
              style: ElevatedButton.styleFrom(backgroundColor: emeraldColor, foregroundColor: Colors.white),
              child: const Text('Add Payment'),
            ),
          ],
        ),
      ),
    );

    if (result != null) {
      ref.read(zakatNotifierProvider.notifier).addPayment(result);
    }
  }

  Future<void> _confirmDeletePayment(BuildContext context, WidgetRef ref, ZakatPayment payment) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Payment'),
        content: Text('Are you sure you want to delete this payment of ${NumberFormat.currency(symbol: 'EGP ').format(payment.amount)}?'),
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
      ref.read(zakatNotifierProvider.notifier).removePayment(payment.id);
    }
  }
}
