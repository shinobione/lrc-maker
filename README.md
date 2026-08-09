# SHINOBIWAN LRC Maker

Interface web légère pour créer et synchroniser des fichiers **LRC** avec un fichier audio.

- Application : https://shinobione.github.io/lrc-maker/
- Dépôt : https://github.com/shinobione/lrc-maker
- Issues : https://github.com/shinobione/lrc-maker/issues
- Version du fork : **6.3.6**

## Lyrics Studio (Phase 6)

Le mode autonome reste disponible. LRC Maker expose maintenant deux consommateurs du **même moteur de synchronisation** :

1. l’application standalone historique ;
2. le bundle `build/embed/lyrics-studio.js`, monté par SHINOBIWAN Studio sous forme de Web Component `shinobiwan-lyrics-studio`.

Le mode embarqué réutilise le vrai `Synchronizer`, le vrai lecteur audio et le même pipeline de sérialisation. Il est isolé par Shadow DOM afin de ne pas injecter la feuille de style LRC Maker dans Studio. Ce n’est **pas une iframe** et ce n’est pas une réécriture du moteur.

Dans les deux modes Studio, seul le `trackId` canonique est nécessaire. Le moteur charge l’audio et `tracks/<slug>/lyrics.txt` via Track Manager, puis valide et sauvegarde exclusivement ce même `lyrics.txt` avec sa révision et son ETag.

Le texte et l’audio ne transitent jamais dans l’URL. Un export `.lrc` reste possible pour la compatibilité, mais il n’est ni obligatoire, ni une seconde source de vérité, ni un signal de Content Health.

Le mode embarqué ne propose pas de remplacement manuel de l’audio : l’audio vient du morceau canonique. Le standalone reste le fallback avancé si le bundle embarqué n’est pas disponible.

### 6.3.6 — PHASE UX canonical duration evidence

Le contexte Studio transmet désormais la durée finie et positive observée sur l’audio canonique protégé avec les requêtes existantes `lyrics/sync/validate` et `lyrics/sync/save`. Cette preuve évite qu’une durée de manifest périmée rejette des timestamps pourtant contenus dans l’audio réellement chargé. Aucun nouvel endpoint, champ persistant, seek au simple clic, stockage audio ou comportement standalone n’est ajouté.

### 6.3.5 — post-Phase-6 reducer hardening

Cette version ne change pas le workflow utilisateur validé en 6.3.4. Elle rend la règle critique **Espace = timestamp de la ligne sélectionnée, puis sélection de la ligne suivante** testable comme transition réelle du reducer au lieu de la protéger uniquement avec des recherches de chaînes dans le source.

Le reducer utilise désormais deux transitions pures partagées : une pour timestamp-er la ligne sélectionnée, une pour timestamp-er puis avancer exactement de `N` vers `N+1`. Un test comportemental compile et exécute réellement ces transitions, vérifie l’absence de mutation de l’état précédent, protège la ligne du dessus et la ligne suivante, et vérifie le clamp sur la dernière ligne.

Le garde Studio existant reste également actif pour la séparation souris : **simple clic = sélection uniquement**, **double-clic = retour au timestamp**. Aucun seek au simple clic n’est réintroduit. Le parser, le format LRC, la sauvegarde canonique `lyrics.txt`, Track Manager, R2 et l’embed Studio restent inchangés.

### 6.3.4 — native synchronization flow restore hotfix

Le workflow historique du `Synchronizer` est restauré dans **les deux modes, standalone et embarqué** :

- **simple clic** : sélectionne uniquement la ligne ;
- **double-clic** : replace l’audio sur le timestamp déjà associé à cette ligne ;
- **Espace** : écrit le temps courant sur la ligne sélectionnée puis sélectionne automatiquement la ligne suivante.

Le seek direct ajouté au simple clic en 6.3.2 a été retiré. Il interférait avec le flux natif `sélection → Espace → ligne suivante` lors des corrections en cours de lecture et pouvait conduire l’utilisateur à retimestamp-er la ligne précédente au lieu de poursuivre la séquence attendue.

Le hotfix restaure volontairement le comportement du moteur antérieur au commit de click-to-seek, sans modifier le parser, la sauvegarde canonique, Track Manager, R2 ni le contrat `lyrics.txt`. Le test Phase 6 vérifie désormais qu’un simple clic **ne modifie pas directement `audioRef.currentTime`**, que le double-clic reste disponible et que `ActionType.next` continue à poser le timestamp puis avancer la sélection.

### 6.3.3 — canonical reread normalization hotfix

La vérification post-save conserve son garde-fou de relecture canonique, mais compare désormais la **forme canonique** des paroles : éventuel BOM UTF-8 retiré et fins de ligne `CRLF` / `CR` normalisées en `LF`, exactement comme le Writer Track Manager. Une différence de simple encodage de fin de ligne ne provoque donc plus le faux message `La relecture canonique ne correspond pas aux paroles sauvegardées`, tandis qu’une vraie différence de paroles continue à bloquer.

Le texte envoyé aux routes `lyrics/sync/validate` et `lyrics/sync/save` est lui aussi normalisé avant écriture. Un test de régression couvre BOM, CRLF/LF et vérifie qu’une modification réelle des paroles reste détectée.

### 6.3.2 — embedded editor parity hotfix

Le mode embarqué a récupéré les outils Lyrics utiles du standalone : **Supprimer les tags [ ]** et **Supprimer les lignes vides**. La suppression des tags conserve explicitement les timestamps LRC (`[00:12.340]`) et ne retire que les tags non temporels entre crochets.

Cette version avait aussi ajouté un seek immédiat au simple clic sur une ligne timestampée. Cette partie du changement est **retirée en 6.3.4** afin de revenir au workflow natif et fiable du synchroniseur ; les outils de nettoyage restent conservés.

### 6.3.1 — embedded runtime hotfix

Le bundle embarqué compile désormais explicitement React en mode production pour le navigateur. Cela supprime la référence résiduelle `process.env.NODE_ENV` qui pouvait interrompre l’exécution avant l’enregistrement du Web Component. Le build exécute aussi un garde post-build qui refuse tout bundle embarqué contenant encore une référence `process.env` non résolue ou ne contenant pas l’enregistrement `customElements.define`.

## Philosophie du fork

Cette version conserve le moteur LRC et le workflow de synchronisation qui font la force du projet, tout en simplifiant l'interface pour l'usage SHINOBIWAN :

- édition et synchronisation LRC centrées sur les paroles ;
- sortie **lyrics-only**, sans bloc de métadonnées ni tag `[tool: ...]` injecté automatiquement ;
- suppression de l'intégration GitHub Gist de l'interface ;
- suppression du lien vers l'ancien site LRC Utils ;
- fonctions **Supprimer les lignes vides** et **Supprimer les tags [ ]** intégrées directement à l'éditeur ;
- interface disponible uniquement en **Français** et **English** ;
- interface LaunchPAD sombre, glassmorphism et responsive ;
- branding et liens projet alignés sur le dépôt `shinobione/lrc-maker`.

## Utilisation

1. Ouvre l'éditeur et colle ou importe les paroles.
2. Si nécessaire, utilise **Supprimer les lignes vides** ou **Supprimer les tags [ ]** dans la barre d'outils.
3. Charge un fichier audio.
4. Ouvre l'outil de synchronisation.
5. **Simple clic** sur une ligne pour la sélectionner ; **double-clic** sur une ligne déjà timestampée pour replacer l’audio sur son timestamp.
6. Utilise `Espace` pour poser le timestamp courant : LRC Maker avance ensuite automatiquement sur la ligne suivante.
7. Reviens dans l'éditeur pour copier ou télécharger le fichier `.lrc`.

Dans SHINOBIWAN Studio, les étapes 1 à 4 sont contextualisées automatiquement à partir du morceau sélectionné.

## Raccourcis principaux

- `Espace` : insérer le timestamp sur la ligne sélectionnée et passer à la suivante.
- `Retour arrière` / `Suppr` : supprimer le timestamp.
- `Ctrl + Entrée` / `Cmd + Entrée` : lecture / pause.
- `←` / `A` : reculer de 5 secondes.
- `→` / `D` : avancer de 5 secondes.
- `↑` / `W` / `J` : ligne précédente.
- `↓` / `S` / `K` : ligne suivante.
- `-` / `+` : ajuster le timestamp sélectionné.
- `Ctrl + ↑` / `Cmd + ↑` : accélérer la lecture.
- `Ctrl + ↓` / `Cmd + ↓` : ralentir la lecture.
- `R` : réinitialiser la vitesse.

## Build et traçabilité

La page Paramètres affiche :

- la version définie par ce fork (`package.json`) ;
- le hash court du commit réellement compilé ;
- la date du dernier commit utilisé pour le build.

`pnpm run build` produit désormais :

- l’application Pages standalone dans `build/` ;
- le moteur embarquable stable dans `build/embed/lyrics-studio.js` ;
- un contrôle post-build qui vérifie que l’embed peut enregistrer son Web Component sans dépendance Node résiduelle.

Ces informations sont injectées automatiquement par Vite au moment du build afin que la version affichée corresponde au dépôt déployé.

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
