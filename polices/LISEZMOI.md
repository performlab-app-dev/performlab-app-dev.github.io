# Polices de la PWA athlète

Barlow et Barlow Condensed (The Barlow Project Authors, https://github.com/jpt/barlow), sous
**licence SIL Open Font License 1.1** : `OFL-Barlow.txt`, `OFL-Barlow-Condensed.txt`, publiées
avec les polices.

**Embarquées** (chantier serveur/PWA, étape 6.4 bis) : servies par la PWA elle-même et mises
en cache par le service worker dès l'installation — jamais chargées depuis Google Fonts ni
aucun autre domaine. La PWA fonctionne hors ligne, et aucune adresse IP d'athlète n'est
transmise à un tiers.

Source : paquets npm `@fontsource/barlow` et `@fontsource/barlow-condensed`, version 5.3.0,
sous-ensemble `latin` seulement (U+0000-00FF, œ, guillemets et apostrophes typographiques,
€, − …), qui couvre le français et l'anglais. Graisses retenues (maquettes,
`Docs/PL3_maquettes_pwa.md`) :

| Fichier | Usage |
|---|---|
| `barlow-latin-400-normal.woff2` | texte courant |
| `barlow-latin-500-normal.woff2` | texte courant appuyé |
| `barlow-latin-600-normal.woff2` | libellés, boutons |
| `barlow-condensed-latin-600-normal.woff2` | chiffres de prescription |
| `barlow-condensed-latin-700-normal.woff2` | titres |

Les noms sont FIXES (dossier `public/`) : le service worker les met en cache à l'installation.
