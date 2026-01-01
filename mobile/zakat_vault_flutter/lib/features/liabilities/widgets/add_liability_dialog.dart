import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

const Color emeraldColor = Color(0xFF10B981);

class AddLiabilityDialog extends StatefulWidget {
  const AddLiabilityDialog({super.key});

  @override
  State<AddLiabilityDialog> createState() => _AddLiabilityDialogState();
}

class _AddLiabilityDialogState extends State<AddLiabilityDialog> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _amountController = TextEditingController();
  DateTime? _selectedDate;
  bool _isDeductible = true;

  @override
  void initState() {
    super.initState();
    _checkDeductibility();
  }

  void _checkDeductibility() {
    if (_selectedDate == null) {
      setState(() => _isDeductible = true);
      return;
    }

    // Rough deductibility logic matching web version's simple date comparison
    // In production, this should ideally be handled by fetching cycle range from backend
    final now = DateTime.now();
    final anniversary = DateTime(now.year, now.month, now.day); // Placeholder
    final startDate = anniversary.subtract(const Duration(days: 355));
    
    setState(() {
      _isDeductible = _selectedDate!.isAfter(startDate) && 
                      _selectedDate!.isBefore(anniversary.add(const Duration(days: 365)));
    });
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      Navigator.pop(context, {
        'title': _titleController.text,
        'amount': double.parse(_amountController.text),
        'dueDate': _selectedDate?.toIso8601String(),
        'isDeductible': _isDeductible,
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Add New Liability'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Title',
                  hintText: 'e.g. Personal Loan',
                  border: OutlineInputBorder(),
                ),
                validator: (v) => (v == null || v.isEmpty) ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _amountController,
                decoration: const InputDecoration(
                  labelText: 'Amount (EGP)',
                  border: OutlineInputBorder(),
                  prefixText: 'EGP ',
                ),
                keyboardType: TextInputType.number,
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Required';
                  if (double.tryParse(v) == null) return 'Invalid number';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              const Text('Due Date (Optional)', style: TextStyle(fontSize: 12, color: Colors.grey)),
              const SizedBox(height: 8),
              InkWell(
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: DateTime.now(),
                    firstDate: DateTime.now().subtract(const Duration(days: 365)),
                    lastDate: DateTime.now().add(const Duration(days: 3650)),
                  );
                  if (picked != null) {
                    setState(() {
                      _selectedDate = picked;
                      _checkDeductibility();
                    });
                  }
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  decoration: BoxDecoration(
                    border: Border.all(color: Colors.grey),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    children: [
                      const Icon(LucideIcons.calendar, size: 16, color: Colors.grey),
                      const SizedBox(width: 8),
                      Text(
                        _selectedDate == null 
                            ? 'Select Date' 
                            : DateFormat('dd-MM-yyyy').format(_selectedDate!),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _isDeductible ? emeraldColor.withOpacity(0.1) : Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: _isDeductible ? emeraldColor.withOpacity(0.2) : Colors.grey.shade200),
                ),
                child: Row(
                  children: [
                    Icon(
                      LucideIcons.info,
                      size: 18,
                      color: _isDeductible ? emeraldColor : Colors.grey.shade600,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _isDeductible ? 'Deductible' : 'Not Deductible',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: _isDeductible ? emeraldColor : Colors.grey.shade700,
                            ),
                          ),
                          Text(
                            _isDeductible 
                                ? 'This debt will be subtracted from your Zakat calculation.' 
                                : 'Long-term debts outside the current year are not deductible.',
                            style: const TextStyle(fontSize: 10, color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          onPressed: _submit,
          style: ElevatedButton.styleFrom(backgroundColor: emeraldColor, foregroundColor: Colors.white),
          child: const Text('Add Liability'),
        ),
      ],
    );
  }
}
