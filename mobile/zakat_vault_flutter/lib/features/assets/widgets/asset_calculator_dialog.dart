import 'package:flutter/material.dart';
import '../../../services/rates_service.dart';
import 'package:intl/intl.dart';

class AssetCalculatorDialog extends StatefulWidget {
  final List<RateItem> rates;
  final String initialFrom;

  const AssetCalculatorDialog({
    super.key,
    required this.rates,
    required this.initialFrom,
  });

  @override
  State<AssetCalculatorDialog> createState() => _AssetCalculatorDialogState();
}

class _AssetCalculatorDialogState extends State<AssetCalculatorDialog> {
  String? _fromAsset;
  String? _toAsset;
  final _amountController = TextEditingController(text: '1');
  double _result = 0;

  @override
  void initState() {
    super.initState();
    // Default to valid selections
    if (widget.initialFrom.isNotEmpty && widget.rates.any((r) => r.name == widget.initialFrom)) {
      _fromAsset = widget.initialFrom;
    } else if (widget.rates.isNotEmpty) {
      _fromAsset = widget.rates.first.name;
    } else {
      _fromAsset = null;
    }

    // Set toAsset to USD if available, otherwise first rate, or null if empty
    if (widget.rates.any((r) => r.name == 'USD')) {
      _toAsset = 'USD';
    } else if (widget.rates.isNotEmpty) {
      _toAsset = widget.rates.first.name;
    } else {
      _toAsset = null;
    }
    
    // If fromAsset is USD, prefer GOLD for toAsset if available
    if (_fromAsset == 'USD' && widget.rates.any((r) => r.name == 'GOLD')) {
      _toAsset = 'GOLD';
    }

    _calculate();
  }


  void _calculate() {
    if (widget.rates.isEmpty) return;
    
    final amount = double.tryParse(_amountController.text) ?? 0;
    
    final fromMatches = widget.rates.where((r) => r.name == _fromAsset);
    final toMatches = widget.rates.where((r) => r.name == _toAsset);

    if (fromMatches.isNotEmpty && toMatches.isNotEmpty) {
      final rateFrom = fromMatches.first.value;
      final rateTo = toMatches.first.value;

      if (rateTo != 0) {
        setState(() {
          _result = (amount * rateFrom) / rateTo;
        });
      }
    }
  }


  @override
  Widget build(BuildContext context) {
    final numberFormat = NumberFormat.decimalPattern();

    return AlertDialog(
      title: const Row(
        children: [
          Icon(Icons.calculate_outlined, color: Colors.teal),
          SizedBox(width: 8),
          Text('Asset Calculator'),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Convert From', style: TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: DropdownButtonFormField<String?>(
                  value: _fromAsset,
                  items: widget.rates.map((r) => DropdownMenuItem(value: r.name, child: Text(r.name))).toList(),
                  onChanged: (v) {
                    setState(() => _fromAsset = v!);
                    _calculate();
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                flex: 3,
                child: TextFormField(
                  controller: _amountController,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(hintText: 'Amount'),
                  onChanged: (v) => _calculate(),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Center(
            child: IconButton(
              icon: const Icon(Icons.swap_vert),
              onPressed: () {
                setState(() {
                  final temp = _fromAsset;
                  _fromAsset = _toAsset;
                  _toAsset = temp;
                });
                _calculate();
              },
            ),
          ),
          const SizedBox(height: 16),
          const Text('Convert To', style: TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(height: 8),
          DropdownButtonFormField<String?>(
            value: _toAsset,
            items: widget.rates.map((r) => DropdownMenuItem(value: r.name, child: Text(r.name))).toList(),
            onChanged: (v) {
              setState(() => _toAsset = v!);
              _calculate();
            },
          ),
          const SizedBox(height: 24),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.teal.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.teal.shade100),
            ),
            child: Column(
              children: [
                const Text('Result', style: TextStyle(color: Colors.teal, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(
                  '${numberFormat.format(_result)} $_toAsset',
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.teal),
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close')),
      ],
    );
  }
}
