import 'package:flutter/material.dart';
import '../../shared/widgets/app_drawer.dart';

class LiabilitiesPage extends StatelessWidget {
  const LiabilitiesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Liabilities')),
      drawer: const AppDrawer(),
      body: const Center(child: Text('Liabilities Page - Coming Soon')),
    );
  }
}
