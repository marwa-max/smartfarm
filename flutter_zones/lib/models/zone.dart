class Zone {
  final int? id; // identifiant de la base de données (null avant l'enregistrement)
  final String nom;
  final String culture;
  double humidite;
  final double seuil;
  bool vanneOuverte;

  Zone({
    this.id,
    required this.nom,
    required this.culture,
    required this.humidite,
    required this.seuil,
    this.vanneOuverte = false,
  });

  // Construit une zone à partir du JSON renvoyé par l'API
  factory Zone.fromJson(Map<String, dynamic> json) {
    return Zone(
      id: json['id'] as int?,
      nom: json['nom'] as String,
      culture: json['culture'] as String,
      humidite: (json['humidite'] as num).toDouble(),
      seuil: (json['seuil'] as num).toDouble(),
      vanneOuverte: json['vanneOuverte'] as bool? ?? false,
    );
  }

  // JSON envoyé à l'API (sans id : il est dans l'URL)
  Map<String, dynamic> toJson() {
    return {
      'nom': nom,
      'culture': culture,
      'humidite': humidite,
      'seuil': seuil,
      'vanneOuverte': vanneOuverte,
    };
  }

  // Vrai si l'humidité est sous le seuil
  bool get besoinIrrigation => humidite < seuil;

  String diagnostic() {
    return besoinIrrigation ? 'À irriguer' : 'Sol correct';
  }
}

// Humidité moyenne d'une liste de zones (0 si la liste est vide)
double humiditeMoyenne(List<Zone> zones) {
  if (zones.isEmpty) return 0;
  final somme = zones.fold<double>(0, (acc, z) => acc + z.humidite);
  return somme / zones.length;
}
