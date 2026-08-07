# SHINOBIWAN LRC Maker

Interface web légère pour créer et synchroniser des fichiers **LRC** avec un fichier audio.

- Application : https://shinobione.github.io/lrc-maker/
- Dépôt : https://github.com/shinobione/lrc-maker
- Issues : https://github.com/shinobione/lrc-maker/issues

## Philosophie du fork

Cette version conserve le moteur LRC et le workflow de synchronisation qui font la force du projet, tout en simplifiant l'interface pour l'usage SHINOBIWAN :

- édition et synchronisation LRC centrées sur les paroles ;
- sortie **lyrics-only**, sans bloc de métadonnées ni tag `[tool: ...]` injecté automatiquement ;
- suppression de l'intégration GitHub Gist de l'interface ;
- accès direct à l'import, la copie, le téléchargement et LRC Utils ;
- interface sombre modernisée et responsive ;
- paramètres présentés en français ;
- branding et liens projet alignés sur le dépôt `shinobione/lrc-maker`.

## Utilisation

1. Ouvre l'éditeur et colle ou importe les paroles.
2. Charge un fichier audio.
3. Ouvre l'outil de synchronisation.
4. Utilise `Espace` pour poser les timestamps pendant la lecture.
5. Reviens dans l'éditeur pour copier ou télécharger le fichier `.lrc`.

## Raccourcis principaux

| Touche | Action |
| --- | --- |
| `Espace` | Insérer le timestamp sur la ligne sélectionnée |
| `Retour arrière` / `Suppr` | Supprimer le timestamp |
| `Ctrl + Entrée` / `Cmd + Entrée` | Lecture / pause |
| `←` / `A` | Reculer de 5 secondes |
| `→` / `D` | Avancer de 5 secondes |
| `↑` / `W` / `J` | Ligne précédente |
| `↓` / `S` / `K` | Ligne suivante |
| `-` / `+` | Ajuster le timestamp sélectionné |
| `Ctrl + ↑` / `Cmd + ↑` | Accélérer la lecture |
| `Ctrl + ↓` / `Cmd + ↓` | Ralentir la lecture |
| `R` | Réinitialiser la vitesse |

## Développement local

```bash
git clone https://github.com/shinobione/lrc-maker.git
cd lrc-maker
npm install
npm start
```

Build de production :

```bash
npm run build
```

Le projet est distribué sous licence MIT. Voir `LICENSE` pour les mentions de copyright et de licence du projet d'origine.
