import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../services/rates_service.dart';
import '../assets_notifier.dart';

class AddTransactionDialog extends StatefulWidget {
  final List<RateItem> rates;
  final String initialAssetType;

  const AddTransactionDialog({
    super.key,
    required this.rates,
    required this.initialAssetType,
  });

  @override
  State<AddTransactionDialog> createState() => _AddTransactionDialogState();
}

class _AddTransactionDialogState extends State<AddTransactionDialog> {
  String? _selectedAssetType;
  String _transactionType = 'BUY';
  final _amountController = TextEditingController();
  final _priceController = TextEditingController();
  DateTime _selectedDate = DateTime.now();
  final _formKey = GlobalKey<FormState>();

  @override
  void initState() {
    super.initState();
    
    // Debug logging
    print('AddTransactionDialog - initialAssetType: "${widget.initialAssetType}"');
    print('AddTransactionDialog - rates count: ${widget.rates.length}');
    if (widget.rates.isNotEmpty) {
      print('AddTransactionDialog - first rate name: "${widget.rates.first.name}"');
    }
    
    // Default to a valid selection if initial value is missing or invalid
    if (widget.initialAssetType.isNotEmpty && widget.rates.any((r) => r.name == widget.initialAssetType)) {
      _selectedAssetType = widget.initialAssetType;
      print('AddTransactionDialog - Using initialAssetType: "$_selectedAssetType"');
    } else if (widget.rates.isNotEmpty) {
      _selectedAssetType = widget.rates.first.name;
      print('AddTransactionDialog - Using first rate: "$_selectedAssetType"');
    } else {
      _selectedAssetType = null;
      print('AddTransactionDialog - Using null (no rates available)');
    }

    _updatePrice();
  }


  void _updatePrice() {
    if (_transactionType == 'BUY' && _selectedAssetType != null) {
      final matches = widget.rates.where((r) => r.name == _selectedAssetType);
      if (matches.isNotEmpty) {
        _priceController.text = matches.first.value.toString();
      }
    }


  }


  @override
  Widget build(BuildContext context) {
    // Filter out any rates with empty names to prevent dropdown errors
    final validRates = widget.rates.where((r) => r.name.isNotEmpty).toList();
    
    return AlertDialog(
      title: const Text('Add Transaction'),
      content: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (validRates.isEmpty)
                const Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Text(
                    'No assets available. Please add rates first.',
                    style: TextStyle(color: Colors.red),
                  ),
                )
              else
                DropdownButtonFormField<String?>(
                  value: _selectedAssetType,
                  decoration: const InputDecoration(labelText: 'Asset'),
                  items: validRates.map((rate) {
                    return DropdownMenuItem(
                      value: rate.name,
                      child: Text(rate.title.isNotEmpty ? rate.title : rate.name),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedAssetType = value!;
                      _updatePrice();
                    });
                  },
                ),

              const SizedBox(height: 16),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'BUY', label: Text('Buy')),
                  ButtonSegment(value: 'SELL', label: Text('Sell')),
                ],
                selected: {_transactionType},
                onSelectionChanged: (newSelection) {
                  setState(() {
                    _transactionType = newSelection.first;
                    _updatePrice();
                  });
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _amountController,
                decoration: const InputDecoration(labelText: 'Amount'),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value == null || value.isEmpty) return 'Please enter an amount';
                  if (double.tryParse(value) == null) return 'Invalid number';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _priceController,
                decoration: const InputDecoration(labelText: 'Price per Unit (EGP)'),
                keyboardType: TextInputType.number,
                validator: (value) {
                  if (value == null || value.isEmpty) return 'Please enter a price';
                  if (double.tryParse(value) == null) return 'Invalid number';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              ListTile(
                title: const Text('Date'),
                subtitle: Text(DateFormat('yyyy-MM-dd').format(_selectedDate)),
                trailing: const Icon(Icons.calendar_today),
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: _selectedDate,
                    firstDate: DateTime(2000),
                    lastDate: DateTime.now(),
                  );
                  if (picked != null) {
                    setState(() => _selectedDate = picked);
                  }
                },
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('Cancel'),
        ),
        ElevatedButton(
          onPressed: _submit,
          style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white),
          child: const Text('Save'),
        ),
      ],
    );
  }

  void _submit() {
    if (_formKey.currentState!.validate()) {
      // TODO: Call notifier to add transaction
      // For now we just return the values
      Navigator.pop(context, {
        'assetType': _selectedAssetType ?? '',
        'type': _transactionType,
        'amount': double.parse(_amountController.text),
        'price': double.parse(_priceController.text),
        'date': _selectedDate,
      });
    }
  }
}
