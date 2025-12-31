class DashboardSummary {
  final double totalAssets;
  final double totalLiabilities;
  final double netWorth;

  DashboardSummary({
    required this.totalAssets,
    required this.totalLiabilities,
    required this.netWorth,
  });

  factory DashboardSummary.fromJson(Map<String, dynamic> json) {
    return DashboardSummary(
      totalAssets: (json['totalAssets'] ?? 0).toDouble(),
      totalLiabilities: (json['totalLiabilities'] ?? 0).toDouble(),
      netWorth: (json['netWorth'] ?? 0).toDouble(),
    );
  }
}

class PortfolioMetric {
  final String name;
  final double value;
  final double percentage;
  final String color;

  PortfolioMetric({
    required this.name,
    required this.value,
    required this.percentage,
    required this.color,
  });

  factory PortfolioMetric.fromJson(Map<String, dynamic> json) {
    return PortfolioMetric(
      name: json['name'] ?? '',
      value: (json['value'] ?? 0).toDouble(),
      percentage: (json['percentage'] ?? 0).toDouble(),
      color: json['color'] ?? '#888888',
    );
  }
}

class PortfolioValue {
  final String date;
  final double value;

  PortfolioValue({
    required this.date,
    required this.value,
  });

  factory PortfolioValue.fromJson(Map<String, dynamic> json) {
    return PortfolioValue(
      date: json['date'] ?? '',
      value: (json['value'] ?? 0).toDouble(),
    );
  }
}

class PortfolioValueGroup {
  final String title;
  final String color;
  final List<PortfolioValue> history;

  PortfolioValueGroup({
    required this.title,
    required this.color,
    required this.history,
  });

  factory PortfolioValueGroup.fromJson(Map<String, dynamic> json) {
    return PortfolioValueGroup(
      title: json['title'] ?? '',
      color: json['color'] ?? '#888888',
      history: (json['history'] as List? ?? [])
          .map((v) => PortfolioValue.fromJson(v))
          .toList(),
    );
  }
}
