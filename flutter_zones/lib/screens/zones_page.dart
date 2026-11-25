import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:agrismart/models/zone.dart';
import 'package:agrismart/providers/zones_provider.dart';
import 'package:agrismart/screens/zone_detail_page.dart';
import 'package:agrismart/screens/zone_form_page.dart';
import 'package:agrismart/widgets/fiche_exploitation.dart';
import 'package:agrismart/widgets/resume_exploitation.dart';
import 'package:agrismart/widgets/zone_card.dart';

// Onglet Zones : les zones viennent de l'API via ZonesProvider.
// Trois états : chargement, erreur (avec "Réessayer"), liste (ou liste vide).
class ZonesPage extends StatefulWidget {
  const ZonesPage({super.key});

  @override
  State<ZonesPage> createState() => _ZonesPageState();
}

class _ZonesPageState extends State<ZonesPage> {
  @override
  void initState() {
    super.initState();
    // On ne peut pas appeler notifyListeners() pendant le build : on attend la 1re frame
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final provider = context.read<ZonesProvider>();
      if (provider.etat == ZonesEtat.initial) provider.charger();
    });
  }

  void _message(BuildContext context, String texte) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(texte)),
    );
  }

  // Affiche le succès ou l'erreur renvoyée par le provider
  void _resultat(BuildContext context, String? erreur, String succes) {
    _message(context, erreur ?? succes);
  }

  Future<void> _ajouter(BuildContext context) async {
    final provider = context.read<ZonesProvider>();
    final nouvelle = await Navigator.push<Zone>(
      context,
      MaterialPageRoute(
        builder: (_) => ZoneFormPage(nomsExistants: provider.noms()),
      ),
    );
    if (nouvelle == null || !context.mounted) return;
    final erreur = await provider.ajouter(nouvelle);
    if (!context.mounted) return;
    _resultat(context, erreur, 'Zone ajoutée');
  }

  Future<void> _ouvrirDetail(BuildContext context, Zone zone) async {
    final provider = context.read<ZonesProvider>();
    final modifiee = await Navigator.push<Zone>(
      context,
      MaterialPageRoute(
        builder: (_) =>
            ZoneDetailPage(zone: zone, nomsAutres: provider.noms(sauf: zone)),
      ),
    );
    if (modifiee == null || !context.mounted) return;
    final erreur = await provider.modifier(zone, modifiee);
    if (!context.mounted) return;
    _resultat(context, erreur, 'Zone modifiée');
  }

  Future<void> _confirmerSuppression(BuildContext context, Zone zone) async {
    final provider = context.read<ZonesProvider>();
    final confirme = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer la zone ?'),
        content: Text('La zone ${zone.nom} sera supprimée définitivement.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Annuler'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
    if (confirme != true || !context.mounted) return;
    final erreur = await provider.supprimer(zone);
    if (!context.mounted) return;
    _resultat(context, erreur, 'Zone supprimée');
  }

  Future<void> _changerHumidite(
      BuildContext context, Zone zone, double delta) async {
    final erreur =
        await context.read<ZonesProvider>().modifierHumidite(zone, delta);
    if (erreur != null && context.mounted) _message(context, erreur);
  }

  Widget _carte(BuildContext context, Zone zone) {
    return ZoneCard(
      zone: zone,
      onAugmenter: () => _changerHumidite(context, zone, 5),
      onDiminuer: () => _changerHumidite(context, zone, -5),
      onTap: () => _ouvrirDetail(context, zone),
      onLongPress: () => _confirmerSuppression(context, zone),
    );
  }

  // Erreur de chargement : message + bouton Réessayer
  Widget _erreur(BuildContext context, String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.cloud_off, size: 48),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => context.read<ZonesProvider>().charger(),
              icon: const Icon(Icons.refresh),
              label: const Text('Réessayer'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _liste(BuildContext context, List<Zone> zones) {
    if (zones.isEmpty) {
      return const Center(child: Text('Aucune zone pour le moment'));
    }
    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth >= 600) {
          return GridView.builder(
            padding: const EdgeInsets.only(bottom: 80),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 2.8,
            ),
            itemCount: zones.length,
            itemBuilder: (context, index) => _carte(context, zones[index]),
          );
        }
        return ListView.separated(
          padding: const EdgeInsets.only(bottom: 80),
          itemCount: zones.length,
          separatorBuilder: (context, index) => const Divider(),
          itemBuilder: (context, index) => _carte(context, zones[index]),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ZonesProvider>();
    final zones = provider.zones;

    Widget corps;
    if (provider.etat == ZonesEtat.erreur) {
      corps = _erreur(context, provider.erreur ?? 'Une erreur est survenue');
    } else if (provider.etat == ZonesEtat.initial || provider.enChargement) {
      corps = const Center(child: CircularProgressIndicator());
    } else {
      corps = _liste(context, zones);
    }

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        title: const Text('AgriSmart'),
        actions: [
          IconButton(
            tooltip: 'Actualiser',
            icon: const Icon(Icons.refresh),
            onPressed: provider.enChargement ? null : provider.charger,
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _ajouter(context),
        child: const Icon(Icons.add),
      ),
      body: Column(
        children: [
          FicheExploitation(humiditeMoyenne: humiditeMoyenne(zones)),
          ResumeExploitation(zones: zones),
          Expanded(child: corps),
        ],
      ),
    );
  }
}
