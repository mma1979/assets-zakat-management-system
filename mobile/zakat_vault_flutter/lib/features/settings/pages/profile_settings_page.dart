import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';

class ProfileSettingsPage extends StatelessWidget {
  const ProfileSettingsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Profile Settings')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(LucideIcons.user, size: 64, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            const Text(
              'Profile Settings',
              style: TextStyle(fontSize: 18, color: Color(0xFF64748B)),
            ),
            const Text('Coming Soon', style: TextStyle(color: Color(0xFF94A3B8))),
          ],
        ),
      ),
    );
  }
}
