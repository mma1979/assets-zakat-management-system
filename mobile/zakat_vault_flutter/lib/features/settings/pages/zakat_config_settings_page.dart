import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../../core/theme.dart';
import '../../../models/zakat_models.dart';
import '../../../services/zakat_service.dart';
import '../../auth/auth_notifier.dart';

class ZakatConfigSettingsPage extends ConsumerStatefulWidget {
  const ZakatConfigSettingsPage({super.key});

  @override
  ConsumerState<ZakatConfigSettingsPage> createState() => _ZakatConfigSettingsPageState();
}

class _ZakatConfigSettingsPageState extends ConsumerState<ZakatConfigSettingsPage> {
  bool _isGregorian = true;
  DateTime _selectedDate = DateTime.now();
  int _selectedHijriDay = 27;
  int _selectedHijriMonth = 9; // Ramadan
  String _selectedCurrency = 'EGP - Egyptian Pound';
  bool _reminderEnabled = false;
  final _geminiKeyController = TextEditingController();
  final _emailController = TextEditingController();
  bool _isLoading = false;
  bool _isLoadingConfig = true;

  final List<String> _currencies = [
    'EGP - Egyptian Pound',
    'USD - US Dollar',
    'SAR - Saudi Riyal',
    'AED - UAE Dirham',
    'EUR - Euro',
  ];

  final List<String> _hijriMonths = [
    'Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani',
    'Jumada al-ula', 'Jumada al-akhira', 'Rajab', 'Sha\'ban',
    'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
  ];

  @override
  void initState() {
    super.initState();
    _loadConfig();
  }

  Future<void> _loadConfig() async {
    setState(() => _isLoadingConfig = true);
    
    final config = await ref.read(zakatServiceProvider).getConfig();
    
    if (mounted) {
      if (config != null) {
        setState(() {
          _selectedDate = config.zakatDate;
          _reminderEnabled = config.reminderEnabled;
          _emailController.text = config.email;
          
          // Find matching currency or default to first
          final currencyCode = config.baseCurrency;
          _selectedCurrency = _currencies.firstWhere(
            (c) => c.startsWith(currencyCode),
            orElse: () => _currencies.first,
          );
          
          if (config.geminiApiKey != null && config.geminiApiKey!.isNotEmpty) {
            _geminiKeyController.text = config.geminiApiKey!;
          }
          
          // Check if using Hijri dates
          if (config.zakatAnniversaryDay != null && config.zakatAnniversaryMonth != null) {
            _isGregorian = false;
            _selectedHijriDay = config.zakatAnniversaryDay!;
            _selectedHijriMonth = config.zakatAnniversaryMonth!;
          }
          
          _isLoadingConfig = false;
        });
      } else {
        // If no config exists, load user email at least
        final user = ref.read(authNotifierProvider).user;
        if (user != null) {
          _emailController.text = user.email;
        }
        setState(() => _isLoadingConfig = false);
      }
    }
  }

  @override
  void dispose() {
    _geminiKeyController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2000),
      lastDate: DateTime(2101),
      builder: (context, child) {
        return Theme(
          data: AppTheme.lightTheme.copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppTheme.primaryColor,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _handleSave() async {
    setState(() => _isLoading = true);
    
    final user = ref.read(authNotifierProvider).user;
    if (user == null) return;

    final config = ZakatConfig(
      zakatDate: _selectedDate,
      reminderEnabled: _reminderEnabled,
      email: _emailController.text,
      baseCurrency: _selectedCurrency.split(' - ')[0],
      geminiApiKey: _geminiKeyController.text.isEmpty ? null : _geminiKeyController.text,
      zakatAnniversaryDay: _isGregorian ? null : _selectedHijriDay,
      zakatAnniversaryMonth: _isGregorian ? null : _selectedHijriMonth,
    );

    // Use PUT for updating existing config
    final (success, error) = await ref.read(zakatServiceProvider).updateConfig(config, isUpdate: true);

    if (mounted) {
      setState(() => _isLoading = false);
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Configuration updated successfully'),
            backgroundColor: Color(0xFF10B981),
          ),
        );
        Navigator.of(context).pop();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error ?? 'Failed to update configuration')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('Zakat Configuration'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
      ),
      body: _isLoadingConfig
          ? const Center(child: CircularProgressIndicator())
          : SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
                child: Center(
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 400),
                    child: Column(
                      children: [
                        // Card
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE5E7EB)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.02),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Zakat Date Section
                              Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF3F4F6).withOpacity(0.5),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        const Text(
                                          'Zakat Date',
                                          style: TextStyle(
                                            fontWeight: FontWeight.w600,
                                            color: Color(0xFF374151),
                                          ),
                                        ),
                                        _buildToggle(),
                                      ],
                                    ),
                                    const SizedBox(height: 16),
                                    _isGregorian ? _buildGregorianInput() : _buildHijriInput(),
                                    const SizedBox(height: 12),
                                    Text(
                                      _isGregorian 
                                        ? 'The date your Zakat is due (usually 1 year after reaching Nisab).'
                                        : 'The Zakat anniversary will repeat every lunar year automatically (e.g. 27 Ramadan).',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Color(0xFF9CA3AF),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 24),

                              // Email Field
                              _buildLabel('Email Address'),
                              _buildTextField(
                                controller: _emailController,
                                hint: 'your@email.com',
                                readOnly: true,
                              ),
                              const SizedBox(height: 20),

                              // Currency Dropdown
                              _buildLabel('Base Currency'),
                              _buildDropdown(),
                              const SizedBox(height: 20),

                              // Gemini API Key
                              Row(
                                children: [
                                  _buildLabel('Gemini API Key (Optional)'),
                                ],
                              ),
                              _buildTextField(
                                controller: _geminiKeyController,
                                hint: 'AlzaSy...',
                              ),
                              const SizedBox(height: 4),
                              RichText(
                                text: const TextSpan(
                                  style: TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
                                  children: [
                                    TextSpan(text: 'Required for Market Rates & AI Advisor. '),
                                    TextSpan(
                                      text: 'Get key here',
                                      style: TextStyle(color: AppTheme.primaryColor),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 20),

                              // Reminder Toggle
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF9FAFB),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  children: [
                                    Checkbox(
                                      value: _reminderEnabled,
                                      activeColor: AppTheme.primaryColor,
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(4)),
                                      onChanged: (val) => setState(() => _reminderEnabled = val ?? false),
                                    ),
                                    const Text(
                                      'Enable Reminder',
                                      style: TextStyle(
                                        fontSize: 14,
                                        color: Color(0xFF374151),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 24),

                              // Save Button
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: _isLoading ? null : _handleSave,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.primaryColor,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    elevation: 0,
                                  ),
                                  child: _isLoading
                                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                      : const Row(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Text('Save Changes', style: TextStyle(fontWeight: FontWeight.bold)),
                                            SizedBox(width: 8),
                                            Icon(LucideIcons.check, size: 18),
                                          ],
                                        ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
    );
  }

  Widget _buildToggle() {
    return Container(
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildToggleButton('Gregorian', _isGregorian, () => setState(() => _isGregorian = true)),
          _buildToggleButton('Hijri', !_isGregorian, () => setState(() => _isGregorian = false)),
        ],
      ),
    );
  }

  Widget _buildToggleButton(String label, bool active, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: active ? AppTheme.primaryColor : Colors.transparent,
          borderRadius: BorderRadius.circular(6),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: active ? Colors.white : const Color(0xFF6B7280),
          ),
        ),
      ),
    );
  }

  Widget _buildGregorianInput() {
    return InkWell(
      onTap: () => _selectDate(context),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFD1D5DB)),
        ),
        child: Row(
          children: [
            const Icon(LucideIcons.calendar, size: 18, color: Color(0xFF9CA3AF)),
            const SizedBox(width: 8),
            Text(
              DateFormat('dd-MM-yyyy').format(_selectedDate),
              style: const TextStyle(color: Color(0xFF374151)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHijriInput() {
    return Row(
      children: [
        Expanded(
          child: _buildSmallDropdown(
            value: _selectedHijriDay,
            items: List.generate(30, (i) => i + 1),
            onChanged: (val) => setState(() => _selectedHijriDay = val!),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          flex: 2,
          child: _buildSmallDropdown(
            value: _hijriMonths[_selectedHijriMonth - 1],
            items: _hijriMonths,
            onChanged: (val) => setState(() => _selectedHijriMonth = _hijriMonths.indexOf(val!) + 1),
          ),
        ),
      ],
    );
  }

  Widget _buildSmallDropdown<T>({required T value, required List<T> items, required ValueChanged<T?> onChanged}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFD1D5DB)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          isExpanded: true,
          style: const TextStyle(fontSize: 14, color: Color(0xFF374151)),
          items: items.map((e) => DropdownMenuItem(value: e, child: Text(e.toString()))).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: Color(0xFF374151),
        ),
      ),
    );
  }

  Widget _buildTextField({required TextEditingController controller, required String hint, bool readOnly = false}) {
    return TextFormField(
      controller: controller,
      readOnly: readOnly,
      style: const TextStyle(fontSize: 14),
      decoration: InputDecoration(
        hintText: hint,
        filled: true,
        fillColor: readOnly ? const Color(0xFFF9FAFB) : Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFFD1D5DB)),
        ),
      ),
    );
  }

  Widget _buildDropdown() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFD1D5DB)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedCurrency,
          isExpanded: true,
          style: const TextStyle(fontSize: 14, color: Color(0xFF374151)),
          items: _currencies.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
          onChanged: (val) => setState(() => _selectedCurrency = val!),
        ),
      ),
    );
  }
}
