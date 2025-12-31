class ZakatConfig {
  final DateTime zakatDate;
  final bool reminderEnabled;
  final String email;
  final String baseCurrency;
  final String? geminiApiKey;
  final int? zakatAnniversaryDay;
  final int? zakatAnniversaryMonth;

  ZakatConfig({
    required this.zakatDate,
    this.reminderEnabled = false,
    required this.email,
    this.baseCurrency = 'EGP',
    this.geminiApiKey,
    this.zakatAnniversaryDay,
    this.zakatAnniversaryMonth,
  });

  factory ZakatConfig.fromJson(Map<String, dynamic> json) {
    return ZakatConfig(
      zakatDate: DateTime.parse(json['zakatDate'] ?? DateTime.now().toIso8601String()),
      reminderEnabled: json['reminderEnabled'] ?? false,
      email: json['email'] ?? '',
      baseCurrency: json['baseCurrency'] ?? 'EGP',
      geminiApiKey: json['geminiApiKey'],
      zakatAnniversaryDay: json['zakatAnniversaryDay'],
      zakatAnniversaryMonth: json['zakatAnniversaryMonth'],
    );
  }

  Map<String, dynamic> toJson() => {
    'zakatDate': zakatDate.toIso8601String(),
    'reminderEnabled': reminderEnabled,
    'email': email,
    'baseCurrency': baseCurrency,
    'geminiApiKey': geminiApiKey,
    'zakatAnniversaryDay': zakatAnniversaryDay,
    'zakatAnniversaryMonth': zakatAnniversaryMonth,
  };
}
