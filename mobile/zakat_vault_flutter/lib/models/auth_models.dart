class User {
  final int id;
  final String email;
  final String fullName;

  User({
    required this.id,
    required this.email,
    required this.fullName,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['userId'] ?? json['id'] ?? 0,
      email: json['email'] ?? '',
      fullName: json['name'] ?? json['fullName'] ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'fullName': fullName,
  };
}

class AuthResponse {
  final String token;
  final String refreshToken;
  final User user;
  final bool twoFactorRequired;
  final String? challengeToken;
  final bool isTwoFactorEnabled;
  final String? trustToken;

  AuthResponse({
    required this.token,
    required this.refreshToken,
    required this.user,
    this.twoFactorRequired = false,
    this.challengeToken,
    this.isTwoFactorEnabled = false,
    this.trustToken,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      token: json['token'] ?? '',
      refreshToken: json['refreshToken'] ?? '',
      twoFactorRequired: json['twoFactorRequired'] ?? false,
      challengeToken: json['challengeToken'],
      isTwoFactorEnabled: json['isTwoFactorEnabled'] ?? false,
      trustToken: json['trustToken'],
      user: User.fromJson(json), // Use the flat json to populate the user model
    );
  }
}
