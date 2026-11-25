import 'package:flutter/foundation.dart';
import 'package:agrismart/models/zone.dart';
import 'package:agrismart/services/api_client.dart';
import 'package:agrismart/services/zones_service.dart';

enum ZonesEtat { initial, chargement, charge, erreur }

class ZonesProvider extends ChangeNotifier {
  final ZonesService _service;

  ZonesProvider({ZonesService? service}) : _service = service ?? ZonesService();

  List<Zone> _zones = [];
  ZonesEtat _etat = ZonesEtat.initial;
  String? _erreur;

  List<Zone> get zones => List.unmodifiable(_zones);
  ZonesEtat get etat => _etat;
  String? get erreur => _erreur;
  bool get enChargement => _etat == ZonesEtat.chargement;

  int get nombre => _zones.length;

  int get nombreAIrriguer => _zones.where((z) => z.besoinIrrigation).length;

  List<String> noms({Zone? sauf}) {
    return _zones.where((z) => z != sauf).map((z) => z.nom).toList();
  }

  // Message lisible à partir d'une exception
  String _message(Object e) {
    if (e is ApiException) return e.message;
    return 'Impossible de joindre le serveur. Vérifiez votre connexion.';
  }

  // Chargement initial, et "Réessayer" après une erreur
  Future<void> charger() async {
    _etat = ZonesEtat.chargement;
    _erreur = null;
    notifyListeners();
    try {
      _zones = await _service.lister();
      _etat = ZonesEtat.charge;
    } catch (e) {
      _erreur = _message(e);
      _etat = ZonesEtat.erreur;
    }
    notifyListeners();
  }

  // Les actions ci-dessous retournent null si OK, sinon le message d'erreur.
  Future<String?> ajouter(Zone zone) async {
    try {
      final creee = await _service.creer(zone);
      _zones.add(creee);
      notifyListeners();
      return null;
    } catch (e) {
      return _message(e);
    }
  }

  Future<String?> modifier(Zone ancienne, Zone nouvelle) async {
    final id = ancienne.id;
    if (id == null) return 'Zone invalide';
    try {
      final misAJour = await _service.modifier(id, nouvelle);
      final index = _zones.indexWhere((z) => z.id == id);
      if (index != -1) _zones[index] = misAJour;
      notifyListeners();
      return null;
    } catch (e) {
      return _message(e);
    }
  }

  Future<String?> supprimer(Zone zone) async {
    final id = zone.id;
    if (id == null) return 'Zone invalide';
    try {
      await _service.supprimer(id);
      _zones.removeWhere((z) => z.id == id);
      notifyListeners();
      return null;
    } catch (e) {
      return _message(e);
    }
  }

  // Mise à jour optimiste de l'humidité : l'écran réagit tout de suite,
  // on annule si le serveur refuse.
  Future<String?> modifierHumidite(Zone zone, double delta) async {
    final id = zone.id;
    if (id == null) return 'Zone invalide';
    final ancienne = zone.humidite;
    zone.humidite = (ancienne + delta).clamp(0, 100).toDouble();
    notifyListeners();
    try {
      await _service.modifier(id, zone);
      return null;
    } catch (e) {
      zone.humidite = ancienne;
      notifyListeners();
      return _message(e);
    }
  }

  // À appeler à la déconnexion : on ne garde pas les zones de l'utilisateur précédent
  void vider() {
    _zones = [];
    _etat = ZonesEtat.initial;
    _erreur = null;
    notifyListeners();
  }
}
