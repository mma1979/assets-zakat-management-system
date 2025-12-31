import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../core/theme.dart';
import '../../models/zakat_models.dart';
import '../../services/zakat_service.dart';
import '../../features/auth/auth_notifier.dart';

class ZakatSetupPage extends ConsumerStatefulWidget {
  const ZakatSetupPage({super.key});

  @override
  ConsumerState<ZakatSetupPage> createState() => _ZakatSetupPageState();
}

class _ZakatSetupPageState extends ConsumerState<ZakatSetupPage> {
  bool _isGregorian = true;
  DateTime _selectedDate = DateTime.now();
  int _selectedHijriDay = 27;
  int _selectedHijriMonth = 9; // Ramadan
  String _selectedCurrency = 'EGP - Egyptian Pound';
  bool _reminderEnabled = false;
  final _geminiKeyController = TextEditingController();
  final _emailController = TextEditingController();
  bool _isLoading = false;

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
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final user = ref.read(authNotifierProvider).user;
      if (user != null) {
        _emailController.text = user.email;
      }
    });
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

    // Use POST as it handles both initial setup and updates on the backend
    final (success, error) = await ref.read(zakatServiceProvider).updateConfig(config, isUpdate: false);

    if (mounted) {
      setState(() => _isLoading = false);
      if (success) {
        Navigator.of(context).pushReplacementNamed('/dashboard');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error ?? 'Failed to save configuration')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 40),
          child: Center(
            child: Container(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Column(
                children: [
                  // Icon
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      LucideIcons.calculator,
                      color: AppTheme.primaryColor,
                      size: 32,
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Title
                  const Text(
                    'Zakat Configuration',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                  const SizedBox(height: 12),
                  
                  // Subtitle
                  const Text(
                    'Please configure your Zakat preferences to continue.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFF6B7280),
                    ),
                  ),
                  const SizedBox(height: 32),

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
                          text: TextSpan(
                            style: const TextStyle(fontSize: 11, color: Color(0xFF9CA3AF)),
                            children: [
                              const TextSpan(text: 'Required for Market Rates & AI Advisor. '),
                              TextSpan(
                                text: 'Get key here',
                                style: const TextStyle(color: AppTheme.primaryColor),
                                // Add launcher here if needed
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
                                      Text('Save & Continue', style: TextStyle(fontWeight: FontWeight.bold)),
                                      SizedBox(width: 8),
                                      Icon(LucideIcons.arrowRight, size: 18),
                                    ],
                                  ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Skip Link
                        Center(
                          child: TextButton(
                            onPressed: () => Navigator.of(context).pushReplacementNamed('/dashboard'),
                            child: const Text(
                              'Skip for now',
                              style: TextStyle(color: Color(0xFF9CA3AF), decoration: TextDecoration.underline),
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
